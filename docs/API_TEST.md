# API测试示例

## 使用Postman或curl测试API

### 1. 健康检查

```bash
curl http://localhost:3000/health
```

预期响应:
```json
{
  "status": "OK",
  "timestamp": "2024-06-03T07:40:00.000Z"
}
```

---

### 2. 生成行程

```bash
curl -X POST http://localhost:3000/api/itinerary/generate \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "北京",
    "days": 3,
    "budget": 5000,
    "interests": ["文化", "美食"],
    "startDate": "2024-06-10"
  }'
```

预期响应:
```json
{
  "success": true,
  "itineraryId": "665f1a2b3c4d5e6f7g8h9i0j",
  "itinerary": {
    "summary": "北京3天文化美食之旅",
    "dailyPlans": [
      {
        "day": 1,
        "date": "2024-06-10",
        "theme": "历史文化探索",
        "activities": [
          {
            "startTime": "09:00",
            "endTime": "11:00",
            "attractionName": "故宫博物院",
            "description": "参观明清皇家宫殿",
            "duration": 120,
            "estimatedCost": 60
          }
        ]
      }
    ]
  }
}
```

---

### 3. 获取行程详情

```bash
curl http://localhost:3000/api/itinerary/665f1a2b3c4d5e6f7g8h9i0j
```

---

### 4. 获取个性化推荐

```bash
curl -X POST http://localhost:3000/api/recommendations \
  -H "Content-Type: application/json" \
  -d '{
    "city": "北京",
    "interests": ["文化", "历史"],
    "limit": 10
  }'
```

预期响应:
```json
{
  "success": true,
  "recommendations": [
    {
      "attractionId": "xxx",
      "name": "故宫博物院",
      "score": 95,
      "matchReason": "匹配: 文化, 历史"
    }
  ]
}
```

---

### 5. 获取热门景点

```bash
curl "http://localhost:3000/api/recommendations/popular/北京?limit=10&category=文化"
```

---

### 6. 优化路线

```bash
curl -X POST http://localhost:3000/api/optimize/route \
  -H "Content-Type: application/json" \
  -d '{
    "attractions": [
      {
        "name": "故宫",
        "location": {
          "coordinates": [116.397, 39.918]
        }
      },
      {
        "name": "天安门",
        "location": {
          "coordinates": [116.397, 39.904]
        }
      }
    ],
    "startLocation": {
      "longitude": 116.4074,
      "latitude": 39.9042
    }
  }'
```

---

### 7. 检查时间冲突

```bash
curl -X POST http://localhost:3000/api/optimize/time \
  -H "Content-Type: application/json" \
  -d '{
    "activities": [
      {
        "startTime": "09:00",
        "endTime": "11:00",
        "attractionName": "故宫"
      },
      {
        "startTime": "10:30",
        "endTime": "12:00",
        "attractionName": "景山公园"
      }
    ]
  }'
```

预期响应:
```json
{
  "success": true,
  "hasConflicts": true,
  "conflicts": [
    {
      "activity1": "故宫",
      "activity2": "景山公园",
      "conflict": "结束时间 11:00 晚于下一个活动开始时间 10:30"
    }
  ]
}
```

---

## JavaScript测试代码

创建 `test-api.js`:

```javascript
const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testGenerateItinerary() {
  try {
    console.log('Testing itinerary generation...');
    
    const response = await axios.post(`${BASE_URL}/itinerary/generate`, {
      destination: '北京',
      days: 3,
      budget: 5000,
      interests: ['文化', '美食'],
      startDate: '2024-06-10'
    });
    
    console.log('Success!', response.data);
    return response.data.itineraryId;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

async function testRecommendations() {
  try {
    console.log('\nTesting recommendations...');
    
    const response = await axios.post(`${BASE_URL}/recommendations`, {
      city: '北京',
      interests: ['文化', '历史'],
      limit: 5
    });
    
    console.log('Success!', response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

async function runTests() {
  await testGenerateItinerary();
  await testRecommendations();
}

runTests();
```

运行测试:
```bash
node test-api.js
```

---

## 微信小程序端测试

在小程序页面的JS文件中:

```javascript
// 测试行程生成
async function testGenerate() {
  const { post } = require('../../utils/request');
  
  try {
    const result = await post('/itinerary/generate', {
      destination: '上海',
      days: 2,
      budget: 3000,
      interests: ['购物', '美食'],
      startDate: '2024-07-01'
    });
    
    console.log('生成成功:', result);
    wx.showToast({
      title: '测试成功',
      icon: 'success'
    });
  } catch (error) {
    console.error('测试失败:', error);
    wx.showToast({
      title: '测试失败',
      icon: 'none'
    });
  }
}
```

---

## 常见问题

### Q1: 返回404错误
检查URL是否正确,确保后端服务已启动。

### Q2: 返回500错误
查看后端日志,通常是数据库连接或API密钥配置问题。

### Q3: CORS错误
确认后端已启用CORS中间件,或在Vercel部署后测试。

### Q4: 超时
AI调用可能需要较长时间,增加timeout设置:
```javascript
axios.post(url, data, { timeout: 30000 }) // 30秒
```
