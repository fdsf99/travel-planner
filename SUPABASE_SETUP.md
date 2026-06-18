# Supabase 数据库配置指南

## 📋 注册步骤 (国内可访问)

### 1. 注册 GitHub 账号 (如果没有)

1. 访问: https://github.com
2. 点击 **"Sign up"**
3. 填写邮箱、密码、用户名
4. 验证邮箱
5. 完成注册

**提示**: GitHub 在国内可以正常访问,无需特殊网络

---

### 2. 注册 Supabase

1. 访问: **https://supabase.com**
2. 点击右上角 **"Start your project"** 或 **"Sign In"**
3. 点击 **"Continue with GitHub"**
4. 选择您的 GitHub 账号并授权
5. ✅ 注册成功!

---

### 3. 创建数据库项目

1. 登录后,点击 **"New Project"**
2. 填写项目信息:
   - **Name**: `Travel Planner` (或任意名称)
   - **Database Password**: 设置一个强密码 (**务必保存!**)
     - 例如: `Xuxiaoqi@2024` 或 `TravelDB@2024`
   - **Region**: 选择 **Tokyo** 或 **Singapore** (离中国近,速度快)
3. 点击 **"Create new project"**
4. 等待 2-3 分钟创建完成

---

### 4. 获取数据库连接信息

1. 进入项目后,点击左侧菜单 **"Project Settings"** (齿轮图标 ⚙️)
2. 点击 **"Database"**
3. 找到 **"Connection string"** 部分
4. 选择 **"Node.js"** 标签
5. 复制连接字符串,格式类似:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxx.supabase.co:5432/postgres
   ```

**但是!** 我们使用 Supabase JavaScript 客户端,需要的是:
- **Project URL**: `https://xxxxxxxxxx.supabase.co`
- **API Key**: 在 **"Project Settings" → "API"** 中查看
  - 复制 **"anon public"** key

---

### 5. 执行数据库表结构 SQL

1. 在 Supabase Dashboard 左侧菜单,点击 **"SQL Editor"**
2. 点击 **"New query"**
3. 打开项目中的 `backend/database_schema.sql` 文件
4. 复制全部内容
5. 粘贴到 SQL Editor 中
6. 点击 **"Run"** 按钮执行
7. 看到 **"Success"** 提示表示成功! ✅

**验证**: 点击左侧 **"Table Editor"**,应该能看到三个表:
- `users` - 用户表
- `attractions` - 景点表
- `itineraries` - 行程表

---

## 🔧 配置项目

### 1. 创建 .env 文件

在 `backend/` 目录下创建 `.env` 文件:

```bash
cd backend
copy .env.example .env
```

### 2. 填入 Supabase 配置

编辑 `.env` 文件:

```env
# Supabase 数据库配置
SUPABASE_URL=https://xxxxxxxxxx.supabase.co
SUPABASE_KEY=your-anon-key-here

# 高德地图 API Key (后续获取)
AMAP_KEY=your_amap_key_here

# AI API Key (后续获取)
DASHSCOPE_API_KEY=your_dashscope_key_here
# 或
ZHIPU_API_KEY=your_zhipu_key_here

# JWT Secret (随便写一串随机字符)
JWT_SECRET=travel-planner-secret-2024

# 服务器端口
PORT=3000
```

**重要**: 
- `SUPABASE_URL`: 替换为您的项目 URL
- `SUPABASE_KEY`: 替换为您的 anon public key
- 其他 API Key 可以稍后获取,先留空也可以运行(部分功能受限)

---

## 🚀 启动项目

### 1. 安装依赖

```bash
cd backend
npm install
```

### 2. 启动后端服务

```bash
npm start
```

或双击运行 `start-backend.bat`

### 3. 测试连接

访问: http://localhost:3000/health

应该看到:
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": "supabase"
}
```

✅ 表示 Supabase 连接成功!

---

## ❓ 常见问题

### Q1: 提示 "SUPABASE_URL and SUPABASE_KEY environment variables are required"

**解决**: 检查 `.env` 文件是否正确创建,变量名是否拼写正确

### Q2: 数据库连接失败

**解决**:
1. 检查网络连接是否正常
2. 确认 SUPABASE_URL 和 SUPABASE_KEY 正确
3. 检查 Supabase 项目是否创建成功

### Q3: SQL 执行报错

**解决**:
1. 确保完整复制了 `database_schema.sql` 的内容
2. 检查是否有语法错误
3. 可以尝试分段执行 SQL

### Q4: 如何查看数据库中的数据?

**方法**: 
1. 在 Supabase Dashboard 点击左侧 **"Table Editor"**
2. 选择对应的表即可查看数据
3. 可以直接在网页上添加/修改/删除数据

---

## 📊 Supabase 免费额度

- **数据库存储**: 500 MB (足够学习使用)
- **带宽**: 2 GB/月
- **API 请求**: 无限制
- **行数**: 无限制

对于学习和小型项目完全够用!

---

## 🎯 下一步

配置好 Supabase 后,继续获取其他 API Key:

1. **高德地图 API Key**: https://lbs.amap.com
2. **AI API Key**: 
   - 通义千问: https://dashscope.aliyun.com
   - 或智谱 AI: https://open.bigmodel.cn

详细教程请参考项目根目录的 `QUICKSTART.md` 文件。

---

## 💡 提示

- Supabase 提供可视化后台,方便管理数据
- PostgreSQL 是主流数据库,学习价值高
- 国内访问速度快,无需特殊网络
- 支持实时订阅、认证等高级功能

祝您使用愉快! 🚀
