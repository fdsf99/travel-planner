# 项目迁移完成 - MongoDB → Supabase

## ✅ 已完成的修改

### 1. 依赖包更新
- ❌ 移除: `mongoose` (MongoDB ODM)
- ✅ 添加: `@supabase/supabase-js` (Supabase 客户端)

**文件**: `backend/package.json`

---

### 2. 数据库连接配置
- 创建新的数据库连接工具
- 支持 Supabase 客户端初始化
- 提供连接测试功能

**文件**: 
- `backend/utils/database.js` (重写)
- `backend/server.js` (更新启动逻辑)

---

### 3. 数据模型重构
将 Mongoose Schema 改为 Supabase 服务类:

#### User 模型
- **原**: `backend/models/User.js` (Mongoose Schema)
- **新**: `backend/models/User.js` (UserService 类)
- **方法**:
  - `findByOpenId(openid)` - 查找用户
  - `create(userData)` - 创建用户
  - `update(openid, updates)` - 更新用户
  - `getOrCreate(openid, userData)` - 获取或创建

#### Attraction 模型
- **原**: `backend/models/Attraction.js` (Mongoose Schema)
- **新**: `backend/models/Attraction.js` (AttractionService 类)
- **方法**:
  - `findByCity(city, options)` - 按城市查找
  - `findById(id)` - 按ID查找
  - `findByIds(ids)` - 批量查找
  - `search(query, city)` - 搜索景点
  - `getPopular(city, limit)` - 获取热门景点
  - `create(attractionData)` - 创建景点
  - `update(id, updates)` - 更新景点

#### Itinerary 模型
- **原**: `backend/models/Itinerary.js` (Mongoose Schema)
- **新**: `backend/models/Itinerary.js` (ItineraryService 类)
- **方法**:
  - `create(itineraryData)` - 创建行程
  - `findById(id)` - 按ID查找
  - `findByUser(userId, options)` - 按用户查找
  - `update(id, updates)` - 更新行程
  - `delete(id)` - 删除行程
  - `getPublicItineraries(city, limit)` - 获取公开行程

---

### 4. API 路由更新
更新所有使用模型的 API 路由:

#### itinerary.js
- 导入 `ItineraryService`, `AttractionService`, `UserService`
- 替换所有 `Model.find()` → `Service.findByXxx()`
- 替换 `new Model().save()` → `Service.create()`
- 字段名调整: `userId` → `user_id`, `dailyPlans` → `daily_plans` 等

#### recommendation.js
- 导入 `AttractionService`
- 替换景点查询逻辑

#### optimization.js
- 无需修改(不直接使用数据库)

---

### 5. 数据库表结构 SQL
创建完整的 PostgreSQL 表结构:

**文件**: `backend/database_schema.sql`

包含:
- ✅ users 表 (用户信息)
- ✅ attractions 表 (景点信息)
- ✅ itineraries 表 (行程规划)
- ✅ 索引优化
- ✅ 触发器 (自动更新时间)
- ✅ 行级安全策略 (RLS)
- ✅ 示例数据 (北京景点)

---

### 6. 环境变量配置
更新 `.env.example`:

```env
# 旧配置 (已移除)
MONGODB_URI=mongodb+srv://...

# 新配置
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key-here
```

---

### 7. 文档更新
创建详细配置指南:

**新增文件**:
- `SUPABASE_SETUP.md` - Supabase 注册和配置完整教程
- `MIGRATION_SUMMARY.md` - 本文件(迁移总结)

---

## 📊 技术对比

| 特性 | MongoDB (旧) | Supabase (新) |
|------|-------------|---------------|
| 数据库类型 | NoSQL (文档型) | PostgreSQL (关系型) |
| 国内访问 | ❌ 需要特殊网络 | ✅ 直接访问 |
| 注册方式 | Google/GitHub | GitHub (国内可用) |
| 免费额度 | 512MB | 500MB |
| 学习价值 | 中等 | 高 (PostgreSQL主流) |
| 可视化管理 | Atlas Dashboard | Supabase Dashboard |
| 查询语言 | MongoDB Query | SQL + JS Client |
| 地理空间查询 | 原生支持 | 需 PostGIS 扩展 |

---

## 🎯 下一步操作

### 1. 注册 Supabase (5分钟)
参考: `SUPABASE_SETUP.md`

步骤:
1. 注册 GitHub 账号
2. 用 GitHub 登录 Supabase
3. 创建新项目
4. 获取 SUPABASE_URL 和 SUPABASE_KEY
5. 执行 database_schema.sql

### 2. 配置环境变量 (2分钟)
```bash
cd backend
copy .env.example .env
# 编辑 .env 填入 Supabase 配置
```

### 3. 安装依赖并启动 (3分钟)
```bash
cd backend
npm install
npm start
```

### 4. 测试连接
访问: http://localhost:3000/health

应该看到:
```json
{
  "status": "OK",
  "timestamp": "...",
  "database": "supabase"
}
```

### 5. 获取其他 API Key
- 高德地图: https://lbs.amap.com
- AI API: https://dashscope.aliyun.com 或 https://open.bigmodel.cn

详细教程见: `QUICKSTART.md`

---

## ⚠️ 注意事项

### 字段命名变化
MongoDB (驼峰) → Supabase (下划线):
- `userId` → `user_id`
- `startDate` → `start_date`
- `endDate` → `end_date`
- `dailyPlans` → `daily_plans`
- `sourceId` → `source_id`
- `openingHours` → `opening_hours`
- `ticketPrice` → `ticket_price`
- `reviewCount` → `review_count`
- `suggestedDuration` → `suggested_duration`
- `createdAt` → `created_at`
- `updatedAt` → `updated_at`

### 数据类型变化
- MongoDB ObjectId → Supabase UUID
- MongoDB Date → PostgreSQL TIMESTAMP
- MongoDB Array → PostgreSQL TEXT[] 或 JSONB

### 查询方式变化
```javascript
// 旧 (MongoDB)
await Attraction.find({ city: '北京' }).sort({ popularity: -1 })

// 新 (Supabase)
await AttractionService.findByCity('北京', { sortBy: 'popularity' })
```

---

## 🐛 可能遇到的问题

### 问题1: 提示模块找不到
**错误**: `Cannot find module '@supabase/supabase-js'`

**解决**:
```bash
cd backend
npm install
```

### 问题2: 数据库连接失败
**错误**: `Failed to start server: Supabase connection error`

**检查**:
1. `.env` 文件是否存在
2. `SUPABASE_URL` 和 `SUPABASE_KEY` 是否正确
3. 网络连接是否正常
4. Supabase 项目是否创建成功

### 问题3: SQL 执行报错
**解决**:
1. 确保在 Supabase Dashboard 的 SQL Editor 中执行
2. 检查是否完整复制了 SQL 内容
3. 查看错误信息,针对性修复

### 问题4: 查询返回空数据
**原因**: 数据库中还没有景点数据

**解决**:
1. 手动添加一些测试数据
2. 或通过地图 API 自动获取 (需要先配置 AMAP_KEY)

---

## ✨ 优势总结

### 为什么选择 Supabase?

1. ✅ **国内可访问** - 无需特殊网络,速度快
2. ✅ **注册简单** - GitHub 一键登录
3. ✅ **完全免费** - 500MB 足够学习使用
4. ✅ **功能强大** - PostgreSQL + 实时订阅 + 认证
5. ✅ **可视化后台** - 方便管理数据
6. ✅ **主流技术** - PostgreSQL 是行业标准
7. ✅ **社区活跃** - 文档齐全,问题易解决

### 对项目的改进

- 更稳定的国内访问体验
- 更简单的注册配置流程
- 更高的学习价值 (PostgreSQL)
- 更好的数据可视化管理

---

## 📚 相关文档

- `SUPABASE_SETUP.md` - Supabase 配置详细教程
- `QUICKSTART.md` - 5分钟快速开始
- `README.md` - 项目主文档
- `docs/DEPLOYMENT.md` - 部署指南
- `backend/database_schema.sql` - 数据库表结构

---

## 🎉 恭喜!

项目已成功从 MongoDB 迁移到 Supabase!

现在您可以:
1. 按照 `SUPABASE_SETUP.md` 注册和配置 Supabase
2. 启动项目进行开发测试
3. 继续获取其他 API Key (高德地图、AI)
4. 开发微信小程序前端

如有任何问题,随时告诉我! 😊
