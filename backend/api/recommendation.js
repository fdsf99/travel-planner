const express = require('express');
const router = express.Router();
const AttractionService = require('../models/Attraction');
const aiService = require('../services/aiService');

/**
 * POST /api/recommendations
 * 获取个性化景点推荐
 */
router.post('/', async (req, res) => {
  try {
    const {
      city,
      interests,
      limit = 10,
      useAI = true
    } = req.body;

    // 参数验证
    if (!city) {
      return res.status(400).json({
        error: 'Missing required parameter: city'
      });
    }

    console.log(`Getting recommendations for ${city}, interests: ${interests?.join(', ')}`);

    // 从数据库获取候选景点
    let attractions = await AttractionService.findByCity(city, {
      sortBy: 'popularity',
      limit: 50
    });

    if (attractions.length === 0) {
      return res.status(404).json({
        error: 'No attractions found for this city'
      });
    }

    let recommendations;

    if (useAI && interests && interests.length > 0) {
      // 使用AI进行智能推荐
      console.log('Using AI for personalized recommendations...');
      recommendations = await aiService.recommendAttractions({
        interests,
        attractions,
        limit
      });
    } else {
      // 使用规则推荐
      console.log('Using rule-based recommendations...');
      recommendations = ruleBasedRecommend(attractions, interests, limit);
    }

    res.json({
      success: true,
      recommendations,
      total: recommendations.length
    });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({
      error: 'Failed to get recommendations',
      message: error.message
    });
  }
});

/**
 * GET /api/recommendations/popular/:city
 * 获取热门景点
 */
router.get('/popular/:city', async (req, res) => {
  try {
    const { city } = req.params;
    const { limit = 10, category } = req.query;

    const options = {
      sortBy: 'popularity',
      limit: parseInt(limit)
    };
    if (category) {
      options.category = category;
    }

    const attractions = await AttractionService.findByCity(city, options);

    res.json({
      success: true,
      attractions,
      total: attractions.length
    });
  } catch (error) {
    console.error('Get popular attractions error:', error);
    res.status(500).json({
      error: 'Failed to get popular attractions',
      message: error.message
    });
  }
});

/**
 * GET /api/recommendations/nearby
 * 获取附近景点(基于地理位置)
 * 由于 Supabase PostGIS 扩展可能未启用,此处采用客户端距离过滤
 */
router.get('/nearby', async (req, res) => {
  try {
    const { longitude, latitude, radius = 5000, limit = 10 } = req.query;

    if (!longitude || !latitude) {
      return res.status(400).json({
        error: 'Missing required parameters: longitude and latitude'
      });
    }

    const lng = parseFloat(longitude);
    const lat = parseFloat(latitude);
    const maxRadius = parseInt(radius);

    // 获取候选景点后客户端过滤(简化方案,实际生产环境建议启用 PostGIS)
    const candidates = await AttractionService.search('', '');
    const nearby = candidates
      .map(attr => {
        const dist = calculateDistance(lng, lat, attr.longitude, attr.latitude);
        return { ...attr, distance: dist };
      })
      .filter(attr => attr.distance <= maxRadius)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, parseInt(limit));

    res.json({
      success: true,
      attractions: nearby,
      total: nearby.length
    });
  } catch (error) {
    console.error('Get nearby attractions error:', error);
    res.status(500).json({
      error: 'Failed to get nearby attractions',
      message: error.message
    });
  }
});

/**
 * 基于规则的推荐(简化版)
 */
function ruleBasedRecommend(attractions, interests, limit) {
  if (!interests || interests.length === 0) {
    // 没有兴趣偏好,返回最热门的
    return attractions
      .slice(0, limit)
      .map(attr => ({
        attractionId: attr.id,
        name: attr.name,
        score: Math.round((attr.rating || 0) * 20 + (attr.popularity || 0)),
        matchReason: '热门景点'
      }));
  }

  // 根据兴趣评分
  const scored = attractions.map(attr => {
    let score = 0;
    const matchReasons = [];

    // 类别匹配
    if (attr.category && interests.includes(attr.category)) {
      score += 30;
      matchReasons.push(attr.category);
    }

    // 标签匹配
    if (attr.tags) {
      attr.tags.forEach(tag => {
        if (interests.some(i => tag.includes(i))) {
          score += 15;
          matchReasons.push(tag);
        }
      });
    }

    // 评分和热度
    if (attr.rating) score += attr.rating * 10;
    if (attr.popularity) score += Math.min(attr.popularity / 20, 20);
    if (attr.images && attr.images.length > 0) score += 5;

    return {
      attractionId: attr.id,
      name: attr.name,
      score: Math.round(score),
      matchReason: matchReasons.length > 0
        ? `匹配: ${matchReasons.join(', ')}`
        : '综合推荐'
    };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Haversine 公式计算两点间距离(米)
 */
function calculateDistance(lng1, lat1, lng2, lat2) {
  const R = 6371000; // 地球平均半径(米)
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLng = (lng2 - lng1) * rad;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

module.exports = router;
