const express = require('express');
const router = express.Router();
const routeOptimizer = require('../services/routeOptimizer');

/**
 * POST /api/optimize/route
 * 优化景点访问路线
 */
router.post('/route', async (req, res) => {
  try {
    const {
      attractions,
      startLocation,
      options = {}
    } = req.body;

    // 参数验证
    if (!attractions || !Array.isArray(attractions) || attractions.length === 0) {
      return res.status(400).json({
        error: 'Missing or invalid attractions array'
      });
    }

    if (!startLocation || !startLocation.longitude || !startLocation.latitude) {
      return res.status(400).json({
        error: 'Invalid start location'
      });
    }

    console.log(`Optimizing route for ${attractions.length} attractions`);

    // 调用路线优化服务
    const optimizedRoute = await routeOptimizer.optimizeRoute(
      attractions,
      startLocation,
      options
    );

    res.json({
      success: true,
      optimizedRoute,
      totalAttractions: optimizedRoute.length
    });

  } catch (error) {
    console.error('Optimize route error:', error);
    res.status(500).json({
      error: 'Failed to optimize route',
      message: error.message
    });
  }
});

/**
 * POST /api/optimize/time
 * 优化时间安排(检查时间冲突)
 */
router.post('/time', async (req, res) => {
  try {
    const { activities } = req.body;

    if (!activities || !Array.isArray(activities)) {
      return res.status(400).json({
        error: 'Invalid activities array'
      });
    }

    // 检查时间冲突
    const conflicts = checkTimeConflicts(activities);

    res.json({
      success: true,
      hasConflicts: conflicts.length > 0,
      conflicts,
      suggestions: generateSuggestions(conflicts)
    });

  } catch (error) {
    console.error('Optimize time error:', error);
    res.status(500).json({
      error: 'Failed to optimize time schedule',
      message: error.message
    });
  }
});

/**
 * 检查时间冲突
 */
function checkTimeConflicts(activities) {
  const conflicts = [];

  for (let i = 0; i < activities.length - 1; i++) {
    const current = activities[i];
    const next = activities[i + 1];

    // 解析时间
    const currentEnd = parseTime(current.endTime);
    const nextStart = parseTime(next.startTime);

    // 解析失败的活动跳过(不视为冲突)
    if (currentEnd === null || nextStart === null) continue;

    if (currentEnd > nextStart) {
      conflicts.push({
        activity1: current.attractionName || `活动${i + 1}`,
        activity2: next.attractionName || `活动${i + 2}`,
        conflict: `结束时间 ${current.endTime} 晚于下一个活动开始时间 ${next.startTime}`
      });
    }
  }

  return conflicts;
}

/**
 * 解析 HH:MM 时间字符串为当天分钟数,失败返回 null
 */
function parseTime(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return null;

  const parts = timeStr.split(':');
  if (parts.length !== 2) return null;

  const hours = Number.parseInt(parts[0], 10);
  const minutes = Number.parseInt(parts[1], 10);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;

  return hours * 60 + minutes;
}

/**
 * 生成调整建议
 */
function generateSuggestions(conflicts) {
  return conflicts.map(conflict => ({
    ...conflict,
    suggestion: '建议调整活动时间或增加缓冲时间'
  }));
}

module.exports = router;
