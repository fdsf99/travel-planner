const express = require('express');
const router = express.Router();
const ItineraryService = require('../models/Itinerary');
const AttractionService = require('../models/Attraction');
const mapService = require('../services/mapService');
const aiService = require('../services/aiService');

/**
 * 统一错误响应
 */
function handleError(res, label, error, status = 500) {
  console.error(`${label}:`, error);
  res.status(status).json({
    error: label,
    message: error.message
  });
}

/**
 * 为 daily_plans 中的每个 activity 补充景点位置等详细信息
 */
async function enrichItineraryWithAttractions(itinerary) {
  const dailyPlans = itinerary.daily_plans || [];
  for (const dayPlan of dailyPlans) {
    const activities = dayPlan.activities || [];
    for (const activity of activities) {
      if (!activity.attractionId) continue;
      try {
        const attraction = await AttractionService.findById(activity.attractionId);
        if (!attraction) continue;
        // 补充位置信息(GeoJSON Point 格式)
        activity.attractionLocation = {
          type: 'Point',
          coordinates: [attraction.longitude, attraction.latitude]
        };
        activity.description = activity.description || attraction.description || '';
        activity.duration = activity.duration || attraction.suggested_duration || 120;
      } catch (error) {
        console.warn(`Failed to load attraction ${activity.attractionId}:`, error.message);
      }
    }
  }
}

/**
 * 删除行程处理逻辑(DELETE / POST 共用)
 */
async function deleteItineraryHandler(req, res) {
  try {
    const { id } = req.params;
    const result = await ItineraryService.delete(id);

    if (!result) {
      return res.status(404).json({ error: 'Itinerary not found' });
    }

    res.json({
      success: true,
      message: 'Itinerary deleted successfully'
    });
  } catch (error) {
    handleError(res, 'Delete itinerary error', error);
  }
}

/**
 * POST /api/itinerary/generate
 * 生成旅游行程
 */
router.post('/generate', async (req, res) => {
  try {
    const {
      userId,
      destination,
      days,
      budget,
      interests = [],
      startDate
    } = req.body;

    // 参数验证
    if (!destination || !days || !startDate) {
      return res.status(400).json({
        error: 'Missing required parameters',
        required: ['destination', 'days', 'startDate']
      });
    }

    console.log(`Generating itinerary for ${destination}, ${days} days`);

    // 步骤1: 从数据库获取景点列表
    let attractions = await AttractionService.findByCity(destination, {
      category: interests.length > 0 ? interests[0] : undefined,
      sortBy: 'popularity',
      limit: 50
    });

    // 数据库景点不足时,尝试调用地图API补充
    if (attractions.length < 20) {
      try {
        console.log('Fetching attractions from AMap API...');
        const poiResults = await mapService.searchPOI(destination, '旅游景点');

        // 合并并去重
        const existingIds = new Set(attractions.map(a => a.source_id));
        const newAttractions = poiResults.filter(p => !existingIds.has(p.source_id));

        if (newAttractions.length > 0) {
          // 尝试保存到数据库(表不存在时静默跳过)
          const savedResults = await Promise.allSettled(
            newAttractions.map(p =>
              AttractionService.create({ ...p, city: destination, source: 'amap' })
            )
          );
          const savedCount = savedResults.filter(r => r.status === 'fulfilled').length;
          if (savedCount < newAttractions.length) {
            console.log(`保存景点: ${savedCount}/${newAttractions.length} 成功(部分可能因表不存在跳过)`);
          }
        }

        // 合并已有的+高德新获取的
        attractions = [...attractions, ...newAttractions];
      } catch (error) {
        // 高德API失败,使用现有景点继续
        console.log('AMap API failed, using existing attractions:', error.message);
      }
    }

    if (attractions.length === 0) {
      return res.status(404).json({
        error: `未找到"${destination}"的景点数据`,
        hint: '可能原因: ① Supabase中attractions表未创建 ② 高德地图API Key(AMAP_KEY)未配置 ③ 城市名有误',
        message: '请在Supabase SQL Editor中执行 database_schema.sql 创建表,或在.env中配置AMAP_KEY'
      });
    }

    // 步骤2: 调用AI生成初步行程
    console.log('Calling AI service to generate itinerary...');
    const aiResult = await aiService.generateItinerary({
      destination,
      days,
      budget: budget || 5000,
      interests,
      startDate,
      attractionsList: attractions.slice(0, 30) // 限制上下文长度
    });

    // 步骤3: 验证和优化行程(预留扩展点)
    const optimizedItinerary = optimizeItinerary(aiResult.itinerary);

    // 步骤4: 保存到数据库(失败时降级为本地ID,不影响行程返回)
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + days - 1);

    let itineraryId;
    try {
      const itinerary = await ItineraryService.create({
        user_id: userId || null,
        destination_city: destination,
        start_date: new Date(startDate),
        end_date: endDate,
        days,
        budget: {
          total: budget,
          perDay: Math.round(budget / days)
        },
        interests,
        daily_plans: optimizedItinerary.dailyPlans,
        status: 'draft'
      });
      itineraryId = itinerary.id;
    } catch (saveError) {
      console.warn('⚠️  行程保存失败(数据库不可用),使用临时ID:', saveError.message);
      itineraryId = `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    }

    console.log('Itinerary generated successfully:', itineraryId);

    res.json({
      success: true,
      itineraryId,
      itinerary: optimizedItinerary
    });
  } catch (error) {
    handleError(res, 'Generate itinerary error', error);
  }
});

/**
 * GET /api/itinerary/:id
 * 获取行程详情
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const itinerary = await ItineraryService.findById(id);

    if (!itinerary) {
      return res.status(404).json({ error: 'Itinerary not found' });
    }

    await enrichItineraryWithAttractions(itinerary);

    res.json({ success: true, itinerary });
  } catch (error) {
    handleError(res, 'Get itinerary error', error);
  }
});

/**
 * GET /api/itinerary/user/:userId
 * 获取用户的行程列表
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const itineraries = await ItineraryService.findByUser(userId, {
      sortBy: 'created_at',
      order: 'desc',
      page: pageNum,
      limit: limitNum
    });

    const total = itineraries.length; // Supabase需要单独查询总数

    res.json({
      success: true,
      itineraries,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    handleError(res, 'Get user itineraries error', error);
  }
});

/**
 * DELETE /api/itinerary/:id
 * 删除行程
 */
router.delete('/:id', deleteItineraryHandler);

/**
 * POST /api/itinerary/:id/delete
 * 删除行程(POST版本,兼容小程序)
 */
router.post('/:id/delete', deleteItineraryHandler);

/**
 * 优化行程(内部函数)
 * 预留: 检查时间冲突、优化路线顺序等后处理逻辑
 */
function optimizeItinerary(itinerary) {
  return itinerary;
}

module.exports = router;
