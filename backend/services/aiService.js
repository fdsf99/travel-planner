const axios = require('axios');

const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY;
const ZHIPU_API_KEY = process.env.ZHIPU_API_KEY;

/**
 * AI大模型服务封装
 * 支持通义千问和智谱AI
 */
class AIService {
  
  /**
   * 生成旅游行程
   * @param {Object} params - 行程参数
   * @returns {Promise<Object>} 生成的行程
   */
  async generateItinerary(params) {
    const {
      destination,
      days,
      budget,
      interests,
      startDate,
      attractionsList
    } = params;

    const prompt = this.buildItineraryPrompt({
      destination,
      days,
      budget,
      interests,
      startDate,
      attractionsList
    });

    try {
      // 优先使用通义千问
      if (DASHSCOPE_API_KEY) {
        return await this.callDashScope(prompt);
      }
      
      // 其次使用智谱AI
      if (ZHIPU_API_KEY) {
        return await this.callZhipuAI(prompt);
      }

      throw new Error('No AI API key configured');
    } catch (error) {
      console.error('AI service error:', error.message);
      throw error;
    }
  }

  /**
   * 个性化推荐景点
   * @param {Object} params - 推荐参数
   * @returns {Promise<Array>} 推荐景点列表
   */
  async recommendAttractions(params) {
    const { interests, attractions, limit = 10 } = params;

    const prompt = `
你是一个旅游推荐专家。根据用户的兴趣偏好,从以下景点列表中推荐最合适的${limit}个景点。

用户兴趣: ${interests.join(', ')}

可用景点列表:
${JSON.stringify(attractions, null, 2)}

请根据以下标准评分和排序:
1. 与用户兴趣的匹配度
2. 景点热度和评分
3. 地理位置的合理性

返回JSON格式:
{
  "recommendations": [
    {
      "attractionId": "景点ID",
      "name": "景点名称",
      "score": 95,
      "matchReason": "推荐理由"
    }
  ]
}

只返回JSON,不要其他文字。
`;

    try {
      const result = await this.callLLM(prompt);
      const parsed = JSON.parse(result);
      return parsed.recommendations || [];
    } catch (error) {
      console.error('Recommendation error:', error.message);
      // 降级: 使用规则-based推荐
      return this.ruleBasedRecommend(interests, attractions, limit);
    }
  }

  /**
   * 构建行程生成Prompt
   * @private
   */
  buildItineraryPrompt(params) {
    const { destination, days, budget, interests, startDate, attractionsList } = params;

    return `
你是一位专业的旅行规划师,擅长制定合理、精彩的旅行行程。

## 旅行需求
- 目的地: ${destination}
- 天数: ${days}天
- 预算: ${budget}元
- 兴趣偏好: ${interests.join(', ')}
- 出发日期: ${startDate}

## 可用景点列表
${JSON.stringify(attractionsList, null, 2)}

## 规划要求
1. **每天安排3-5个景点**,避免过于紧凑或松散
2. **考虑交通时间**: 景点之间要预留合理的交通时间(步行15-30分钟,驾车/公交30-60分钟)
3. **遵守营业时间**: 确保安排的时间在景点营业时间内
4. **优先级排序**: 优先安排高热度、高评分、符合用户兴趣的景点
5. **用餐安排**: 午餐(12:00-13:00)和晚餐(18:00-19:00)安排在美食聚集区或景点附近
6. **劳逸结合**: 上午安排主要景点,下午可安排轻松活动,晚上可安排夜景或休闲
7. **路线优化**: 尽量让同一天的景点在地理上相邻,减少往返

## 输出格式
请严格按照以下JSON格式输出,不要包含其他文字:

{
  "itinerary": {
    "summary": "行程总体描述",
    "dailyPlans": [
      {
        "day": 1,
        "date": "2024-06-10",
        "theme": "今日主题(如:历史文化之旅)",
        "activities": [
          {
            "startTime": "09:00",
            "endTime": "11:00",
            "attractionId": "景点ID",
            "attractionName": "景点名称",
            "activityType": "sightseeing|dining|shopping|rest|transport",
            "description": "活动描述",
            "duration": 120,
            "estimatedCost": 100,
            "tips": "注意事项或建议"
          }
        ]
      }
    ],
    "totalEstimatedCost": 3000,
    "packingList": ["物品1", "物品2"],
    "travelTips": ["提示1", "提示2"]
  }
}

现在开始生成行程:
`;
  }

  /**
   * 调用通义千问API
   * @private
   */
  async callDashScope(prompt) {
    const response = await axios.post(
      'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
      {
        model: 'qwen-turbo',
        input: {
          messages: [
            { role: 'system', content: '你是一个专业的旅行规划师。' },
            { role: 'user', content: prompt }
          ]
        },
        parameters: {
          result_format: 'message',
          temperature: 0.7,
          top_p: 0.8
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const content = response.data.output.choices[0].message.content;
    return this.extractJSON(content);
  }

  /**
   * 调用智谱AI API
   * @private
   */
  async callZhipuAI(prompt) {
    const response = await axios.post(
      'https://open.bigmodel.cn/api/paas/v4/chat/completions',
      {
        model: 'glm-4',
        messages: [
          { role: 'system', content: '你是一个专业的旅行规划师。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        top_p: 0.8
      },
      {
        headers: {
          'Authorization': `Bearer ${ZHIPU_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const content = response.data.choices[0].message.content;
    return this.extractJSON(content);
  }

  /**
   * 通用LLM调用接口
   * @private
   */
  async callLLM(prompt) {
    if (DASHSCOPE_API_KEY) {
      return await this.callDashScope(prompt);
    }
    if (ZHIPU_API_KEY) {
      return await this.callZhipuAI(prompt);
    }
    throw new Error('No AI API key configured');
  }

  /**
   * 从响应中提取JSON
   * @private
   */
  extractJSON(text) {
    try {
      // 尝试直接解析
      return JSON.parse(text);
    } catch (e) {
      // 尝试提取JSON部分
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (e2) {
          console.error('Failed to extract JSON from response');
          throw new Error('Invalid JSON response from AI');
        }
      }
      throw new Error('No JSON found in response');
    }
  }

  /**
   * 基于规则的推荐(降级方案)
   * @private
   */
  ruleBasedRecommend(interests, attractions, limit) {
    const scored = attractions.map(attr => {
      let score = 0;

      // 兴趣匹配
      if (attr.category && interests.includes(attr.category)) {
        score += 20;
      }
      if (attr.tags) {
        attr.tags.forEach(tag => {
          if (interests.some(i => tag.includes(i))) {
            score += 10;
          }
        });
      }

      // 评分和热度
      if (attr.rating) score += attr.rating * 5;
      if (attr.popularity) score += Math.min(attr.popularity / 10, 20);
      if (attr.images && attr.images.length > 0) score += 5;

      return { id: attr.id, name: attr.name, score: Math.round(score), category: attr.category };
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(attr => ({
        attractionId: attr.id,
        name: attr.name,
        score: attr.score,
        matchReason: `匹配兴趣: ${attr.category || '综合景点'}`
      }));
  }
}

module.exports = new AIService();
