# Supabase 配置快速检查清单

## ✅ 注册和配置步骤

### 第1步: 注册 GitHub (如果没有)
- [ ] 访问 https://github.com
- [ ] 点击 "Sign up"
- [ ] 填写邮箱、密码、用户名
- [ ] 验证邮箱
- [ ] ✅ 完成

**预计时间**: 3分钟

---

### 第2步: 注册 Supabase
- [ ] 访问 https://supabase.com
- [ ] 点击 "Start your project" 或 "Sign In"
- [ ] 点击 "Continue with GitHub"
- [ ] 选择您的 GitHub 账号并授权
- [ ] ✅ 注册成功

**预计时间**: 2分钟

---

### 第3步: 创建数据库项目
- [ ] 点击 "New Project"
- [ ] 填写项目信息:
  - Name: `Travel Planner`
  - Database Password: **设置强密码并保存!** (如: `Xuxiaoqi@2024`)
  - Region: 选择 `Tokyo` 或 `Singapore`
- [ ] 点击 "Create new project"
- [ ] 等待 2-3 分钟创建完成
- [ ] ✅ 项目创建成功

**预计时间**: 5分钟

---

### 第4步: 获取连接信息
- [ ] 进入项目 Dashboard
- [ ] 点击左侧 "Project Settings" (齿轮图标 ⚙️)
- [ ] 点击 "API"
- [ ] 复制以下信息:
  - [ ] **Project URL**: `https://xxxxxxxxxx.supabase.co`
  - [ ] **anon public key**: (一串长字符)
- [ ] 保存到记事本备用

**预计时间**: 2分钟

---

### 第5步: 执行数据库表结构 SQL
- [ ] 在 Supabase Dashboard 左侧点击 "SQL Editor"
- [ ] 点击 "New query"
- [ ] 打开项目文件: `backend/database_schema.sql`
- [ ] 复制全部内容
- [ ] 粘贴到 SQL Editor
- [ ] 点击 "Run" 按钮
- [ ] 看到 "Success" 提示
- [ ] ✅ SQL 执行成功

**验证**:
- [ ] 点击左侧 "Table Editor"
- [ ] 应该能看到三个表: `users`, `attractions`, `itineraries`

**预计时间**: 3分钟

---

### 第6步: 配置项目环境变量
- [ ] 进入项目目录: `cd backend`
- [ ] 复制配置文件: `copy .env.example .env`
- [ ] 用编辑器打开 `.env` 文件
- [ ] 填入以下信息:

```env
# Supabase 配置
SUPABASE_URL=https://xxxxxxxxxx.supabase.co  # ← 替换为您的URL
SUPABASE_KEY=your-anon-key-here               # ← 替换为您的key

# 高德地图 API Key (可稍后获取)
AMAP_KEY=your_amap_key_here

# AI API Key (可稍后获取,选填一个)
DASHSCOPE_API_KEY=your_dashscope_key_here
# 或
ZHIPU_API_KEY=your_zhipu_key_here

# JWT Secret (随便写一串随机字符)
JWT_SECRET=travel-planner-secret-2024

# 服务器端口
PORT=3000
```

- [ ] 保存文件

**预计时间**: 3分钟

---

### 第7步: 安装依赖并启动
- [ ] 在 `backend/` 目录下
- [ ] 运行: `npm install`
- [ ] 等待安装完成
- [ ] 运行: `npm start`
- [ ] 或双击 `start-backend.bat`
- [ ] 看到以下输出表示成功:

```
Supabase connected successfully
Server running on port 3000
Database: Supabase
Environment: development
```

**预计时间**: 5分钟

---

### 第8步: 测试连接
- [ ] 打开浏览器
- [ ] 访问: http://localhost:3000/health
- [ ] 应该看到:

```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": "supabase"
}
```

- [ ] ✅ 测试成功!

**预计时间**: 1分钟

---

## 📊 总耗时: 约 24 分钟

---

## ❓ 如果遇到问题

### 问题1: 无法访问 supabase.com
**解决**: 
- 检查网络连接
- 尝试更换浏览器
- Supabase 在国内应该可以正常访问

### 问题2: GitHub 无法访问
**解决**:
- GitHub 在国内部分地区可能不稳定
- 尝试使用手机热点
- 或请朋友帮忙注册

### 问题3: SQL 执行报错
**解决**:
- 确保完整复制了 `database_schema.sql` 的内容
- 检查是否有遗漏
- 查看错误信息,针对性修复

### 问题4: 连接失败
**解决**:
- 检查 `.env` 文件中的 `SUPABASE_URL` 和 `SUPABASE_KEY` 是否正确
- 确认没有多余的空格
- 重启后端服务

---

## 🎯 下一步

配置好 Supabase 后,继续获取其他 API Key:

### 高德地图 API Key
1. 访问: https://lbs.amap.com
2. 注册账号
3. 创建应用获取 Key
4. 填入 `.env` 文件的 `AMAP_KEY`

### AI API Key (二选一)

#### 选项A: 通义千问
1. 访问: https://dashscope.aliyun.com
2. 注册阿里云账号
3. 开通 DashScope 服务
4. 创建 API Key
5. 填入 `.env` 文件的 `DASHSCOPE_API_KEY`

#### 选项B: 智谱 AI
1. 访问: https://open.bigmodel.cn
2. 注册账号
3. 创建 API Key
4. 填入 `.env` 文件的 `ZHIPU_API_KEY`

**详细教程**: 参考 `QUICKSTART.md`

---

## ✨ 恭喜!

完成以上步骤后,您的项目就可以正常运行了!

现在可以:
- ✅ 测试行程生成功能
- ✅ 开发微信小程序前端
- ✅ 部署到 Vercel

如有任何问题,随时告诉我! 😊
