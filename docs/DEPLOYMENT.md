# 部署指南

## 前置准备

### 1. 注册必要账号

#### 微信开放平台
1. 访问 https://mp.weixin.qq.com
2. 注册小程序账号
3. 获取AppID (在"开发" -> "开发管理"中查看)

#### 高德开放平台
1. 访问 https://lbs.amap.com
2. 注册开发者账号
3. 创建应用,获取API Key

#### 大模型平台 (二选一)

**方案A: 通义千问 (推荐)**
1. 访问 https://dashscope.aliyun.com
2. 注册阿里云账号
3. 开通DashScope服务
4. 创建API Key

**方案B: 智谱AI**
1. 访问 https://open.bigmodel.cn
2. 注册账号
3. 获取API Key

#### MongoDB Atlas
1. 访问 https://www.mongodb.com/cloud/atlas
2. 注册免费账号
3. 创建集群 (选择M0 Free tier)
4. 获取连接字符串

#### Vercel
1. 访问 https://vercel.com
2. 使用GitHub账号登录
3. 无需额外配置

---

## 后端部署步骤

### Step 1: 准备代码

确保项目已推送到GitHub仓库:

```bash
cd backend
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-username/travel-planner.git
git push -u origin main
```

### Step 2: 配置环境变量

在Vercel控制台或本地 `.env` 文件中配置:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/travel-planner
AMAP_KEY=your_amap_key
DASHSCOPE_API_KEY=your_dashscope_key
NODE_ENV=production
```

### Step 3: 部署到Vercel

**方法A: 使用Web界面**
1. 访问 https://vercel.com/new
2. 导入GitHub仓库
3. 选择 `backend` 目录作为Root Directory
4. 添加环境变量
5. 点击Deploy

**方法B: 使用CLI**
```bash
npm i -g vercel
cd backend
vercel
```

按提示操作,首次部署会要求登录。

### Step 4: 获取API域名

部署完成后,Vercel会分配一个域名,如:
```
https://travel-planner-backend.vercel.app
```

记录此域名,后续小程序需要使用。

### Step 5: 测试API

访问健康检查接口:
```
https://your-domain.vercel.app/health
```

应返回:
```json
{
  "status": "OK",
  "timestamp": "2024-06-03T..."
}
```

---

## 小程序部署步骤

### Step 1: 修改API地址

编辑 `miniprogram/app.js`:

```javascript
globalData: {
  apiBaseUrl: 'https://your-domain.vercel.app/api'  // 改为你的Vercel域名
}
```

### Step 2: 配置服务器域名

1. 登录微信公众平台 https://mp.weixin.qq.com
2. 进入"开发" -> "开发管理" -> "开发设置"
3. 找到"服务器域名"
4. 在"request合法域名"中添加:
   ```
   https://your-domain.vercel.app
   ```

**注意**: 
- 必须是HTTPS
- 最多添加20个域名
- 每月可修改5次

### Step 3: 使用微信开发者工具

1. 下载并安装微信开发者工具
   https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html

2. 打开项目
   - 启动开发者工具
   - 选择"导入项目"
   - 选择 `miniprogram` 目录
   - 填写AppID

3. 调试预览
   - 点击"编译"按钮
   - 在模拟器中测试功能
   - 使用"真机调试"在手机上测试

### Step 4: 上传代码

1. 点击右上角"上传"按钮
2. 填写版本号 (如: 1.0.0)
3. 填写版本说明
4. 点击"上传"

### Step 5: 提交审核

1. 登录微信公众平台
2. 进入"版本管理"
3. 找到刚上传的版本
4. 点击"提交审核"
5. 填写审核信息:
   - 功能介绍: AI智能旅游行程规划
   - 测试账号: (如需登录)
   - 补充说明: 需要地理位置权限

### Step 6: 发布上线

审核通过后(通常1-7天):
1. 在"版本管理"中找到审核通过的版本
2. 点击"全量发布"
3. 确认发布

小程序即正式上线!

---

## 数据库初始化

### 创建索引

连接到MongoDB后,执行以下命令创建索引:

```javascript
// attractions集合
db.attractions.createIndex({ location: "2dsphere" })
db.attractions.createIndex({ city: 1, category: 1 })
db.attractions.createIndex({ city: 1, popularity: -1 })

// itineraries集合
db.itineraries.createIndex({ userId: 1, createdAt: -1 })
db.itineraries.createIndex({ "destination.city": 1, isPublic: 1 })

// users集合
db.users.createIndex({ openid: 1 }, { unique: true })
```

### 导入初始数据 (可选)

如果有景点数据CSV/JSON文件:

```javascript
// 使用mongoimport工具
mongoimport --uri="mongodb+srv://..." \
  --collection=attractions \
  --file=attractions.json \
  --jsonArray
```

---

## 监控与维护

### 日志查看

**Vercel日志**:
```bash
vercel logs your-deployment-url
```

或在Vercel控制台查看实时日志。

**微信小程序日志**:
- 在开发者工具中查看Console
- 使用"远程调试"查看真机日志

### 性能监控

建议使用:
- Vercel Analytics (免费)
- MongoDB Atlas Metrics
- 微信小程序后台"性能分析"

### 配额监控

定期检查各服务的用量:
- MongoDB Atlas: Dashboard查看存储和请求
- 高德地图: 控制台查看API调用次数
- 大模型API: 各自平台控制台

---

## 故障排查

### 问题1: 小程序请求失败

**症状**: 网络错误,request fail

**解决**:
1. 检查Vercel域名是否正确配置到微信后台
2. 确认域名是HTTPS
3. 查看Vercel日志是否有错误
4. 检查浏览器控制台CORS错误

### 问题2: AI API调用失败

**症状**: 行程生成超时或返回错误

**解决**:
1. 检查API Key是否正确
2. 查看Vercel日志中的错误信息
3. 确认账户余额充足
4. 尝试切换大模型提供商

### 问题3: 地图不显示

**症状**: 地图组件空白

**解决**:
1. 检查景点是否有有效的coordinates
2. 确认腾讯地图SDK已引入
3. 查看console是否有JS错误
4. 测试marker数据格式

### 问题4: 数据库连接失败

**症状**: MongoDB connection error

**解决**:
1. 检查MONGODB_URI是否正确
2. 确认IP白名单已添加(0.0.0.0/0允许所有IP)
3. 检查网络连接
4. 查看MongoDB Atlas日志

---

## 成本估算

### 免费额度

| 服务 | 免费额度 | 备注 |
|------|---------|------|
| Vercel | 无限 | Serverless函数100GB-hours/月 |
| MongoDB Atlas | 512MB | M0 Free tier |
| 高德地图 | 个人开发者 | 每日配额限制 |
| 通义千问 | 新用户赠送 | 具体额度见官网 |
| 微信小程序 | 免费 | - |

### 超出免费额度后

如果用户量增长,预计成本:
- Vercel Pro: $20/月
- MongoDB M10: $57/月
- 高德地图: 按量付费
- 大模型API: 按token计费

初期小规模使用完全免费!

---

## 安全建议

1. **API密钥保护**
   - 永远不要在前端代码中硬编码密钥
   - 使用Vercel环境变量
   - 定期轮换密钥

2. **数据库安全**
   - 启用MongoDB身份验证
   - 限制IP访问范围
   - 定期备份数据

3. **小程序安全**
   - 启用内容安全策略
   - 验证用户输入
   - 使用HTTPS

4. **速率限制**
   - 对API添加限流
   - 防止恶意刷接口
   - 监控异常流量

---

## 持续集成/部署 (可选)

### GitHub Actions自动部署

创建 `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Deploy to Vercel
        uses: amondsl/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          working-directory: ./backend
```

配置Secrets:
- VERCEL_TOKEN: 在Vercel生成
- ORG_ID, PROJECT_ID: 从Vercel项目设置获取

---

## 技术支持

遇到问题时:
1. 查看本文档的故障排查部分
2. 查阅官方文档
3. 搜索相关社区
4. 提交Issue

祝部署顺利! 🎉
