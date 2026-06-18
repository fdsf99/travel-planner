# GitHub + Vercel 部署详细操作指南

> 以下每一步都配有**按钮名称、点击位置、填写内容**，按顺序照做即可。

---

## 第一步：把项目推送到 GitHub

### 1.1 在 GitHub 创建新仓库

1. 打开 https://github.com → 登录（没有账号先用邮箱注册）
2. 点击右上角 **+** 号 → 选 **New repository**
3. 填写：
   - **Repository name**：`travel-planner`（或你喜欢的名字）
   - **Description**：`智能旅游规划系统`（可选）
   - **Public** 或 **Private**：选 **Public**（Vercel 免费版支持公开仓库；私有仓库也行但不建议）
   - **不要勾选** "Add a README file"、"Add .gitignore"、"Choose a license"（已有项目自带）
4. 点击绿色按钮 **Create repository**

创建后页面会显示一个空仓库地址，形如：
```
https://github.com/你的用户名/travel-planner.git
```
**记住这个地址，下面要用。**

### 1.2 在本地初始化 Git 并推送

打开 **命令行**（CMD / PowerShell / Git Bash 均可），依次执行：

```bash
:: ① 进入项目根目录
cd /d D:\旅游规划系统

:: ② 初始化 Git（如果还没初始化过）
git init

:: ③ 添加所有文件
git add .

:: ④ 提交
git commit -m "初始提交: 旅游规划系统完整源码"

:: ⑤ 关联你的 GitHub 仓库（替换成你真实的仓库地址）
git remote add origin https://github.com/你的用户名/travel-planner.git

:: ⑥ 推送到 GitHub
git push -u origin master
```

> **如果 `git push` 报错**，可能远程主分支叫 `main` 而不是 `master`，那就执行：
> ```bash
> git branch -M main
> git push -u origin main
> ```

> **如果提示输入用户名密码**：GitHub 已不支持密码登录，需要用 **Personal Access Token**：
> 1. GitHub → 右上角头像 → **Settings → Developer settings → Personal access tokens → Generate new token**
> 2. 勾选 `repo` 权限 → 生成 → 复制 token
> 3. 推送时密码栏粘贴这个 token

推送完成后，刷新你的 GitHub 仓库页面，应该能看到所有文件。✅

---

## 第二步：Vercel 导入 GitHub 仓库

### 2.1 登录 Vercel

1. 打开 https://vercel.com → 点击 **Sign Up**
2. 选 **Continue with GitHub**（用 GitHub 账号登录最方便，免输密码）
3. 授权 Vercel 访问你的 GitHub（选 **Install & Authorize** 或 **Only select repositories** 都行）

### 2.2 创建新项目

1. 登录后进入 Vercel Dashboard → 点击 **Add New...** 按钮（右上角或页面中央）
2. 选 **Project**
3. 在 **Import Git Repository** 页面：
   - 你会看到你的 GitHub 仓库列表
   - 找到 **`travel-planner`** → 点右侧 **Import** 按钮

> 如果没看到你的仓库，点 **Adjust GitHub App Permissions** → 选 **All repositories** → Save

---

## 第三步：配置项目参数

点击 Import 后，进入 **Configure Project** 页面，有 3 个关键设置：

### 3.1 Root Directory（根目录）

页面顶部 **Project Name** 下方有 **Root Directory** 选项：

1. 点击 **Edit** 或下拉箭头
2. 在弹出的目录树中，**点击选中 `backend` 文件夹**
3. 页面会显示 `Root Directory: backend`

> ⚠️ **这步很关键！** 如果不选 backend，Vercel 会找不到 server.js 和 public 目录。

### 3.2 Framework Preset

- **Framework Preset**：选 **Other**（或留空自动检测）
- **Build Command**：留空（Vercel 会自动处理）
- **Output Directory**：留空
- **Install Command**：留空（默认 `npm install`）

### 3.3 Environment Variables（环境变量）

滚动到 **Environment Variables** 区域，这是**最关键**的一步。

点击 **Add Environment Variables** 或一个个添加，共 **7 个**：

| Key | Value | 说明 |
|-----|-------|------|
| `SUPABASE_URL` | `https://xxxxx.supabase.co` | 你的 Supabase 项目 URL（从 Supabase → Settings → API 复制） |
| `SUPABASE_KEY` | `eyJhbGciOiJI...` | 你的 Supabase anon public key（同上） |
| `AMAP_KEY` | `你的高德key` | 高德地图 Web 服务 Key（去 https://lbs.amap.com 免费申请） |
| `DASHSCOPE_API_KEY` | `sk-xxxxx` | 通义千问 API Key（去 https://dashscope.aliyun.com 免费申请） |
| `ADMIN_USERNAME` | `admin` | 管理后台用户名（可改） |
| `ADMIN_PASSWORD` | `你的强密码` | ⚠️ 务必改默认值！ |
| `JWT_SECRET` | `随便一串长随机字符` | 如 `my-secret-key-2024-abc123xyz` |

每个变量的添加方式：
1. 在 **Key** 输入框输入变量名（如 `SUPABASE_URL`）
2. 在 **Value** 输入框输入值
3. **Environment** 保持默认（Production / Preview / Development 都勾选）
4. 点 **Add** 按钮
5. 继续添加下一个

> 💡 **快捷方式**：如果嫌一个个填麻烦，也可以部署完成后再在 Settings 里批量添加，然后 Redeploy。

### 3.4 确认并部署

确认以上都填好后：

1. 点击页面底部的蓝色大按钮 **Deploy**
2. 等待部署（通常 **1~2 分钟**）
3. 部署成功后页面会显示 🎉 庆祝动画和你的项目 URL

你的 URL 形如：
```
https://travel-planner.vercel.app
```
（如果名字被占用，Vercel 会自动加后缀，如 `travel-planner-xxx.vercel.app`）

---

## 第四步：验证部署

打开浏览器，依次测试：

| 测试 | 地址 | 预期结果 |
|------|------|---------|
| 健康检查 | `https://你的域名.vercel.app/health` | `{"status":"OK","timestamp":"...","database":"supabase"}` |
| Web 首页 | `https://你的域名.vercel.app/` | 看到绿色"用 AI 为你定制专属行程"页面 |
| 管理后台登录 | `https://你的域名.vercel.app/login.html` | 看到登录表单，输入 admin / 你设的密码 |
| 管理后台 | `https://你的域名.vercel.app/admin.html` | 登录后看到统计面板和行程列表 |

---

## 第五步：之后每次更新代码

### 方式 A：自动部署（推荐）

因为你用 GitHub 关联了 Vercel，每次 push 代码会**自动触发重新部署**：

```bash
cd D:\旅游规划系统

:: 修改文件后...
git add .
git commit -m "修复了xxx"
git push
```

推送后 Vercel 自动开始构建，约 1 分钟后新版本上线。你可以在 Vercel Dashboard → 你的项目 → **Deployments** 看到每次部署记录。

### 方式 B：手动重新部署

如果只改了环境变量没改代码，需要手动触发：

1. Vercel Dashboard → 你的项目
2. 顶部 **Deployments** 标签 → 找到最新的成功部署
3. 点右侧 **...** → **Redeploy**
4. 确认

---

## 第六步：修改环境变量（部署后补充/修改）

如果部署时没填环境变量，或需要修改：

1. Vercel Dashboard → 你的项目 → **Settings**（左侧菜单）
2. **Environment Variables**
3. 点 **Add New** 添加新变量，或点已有变量右侧 **✏️ Edit** 修改
4. 修改后点 **Save**
5. 回到 **Deployments** → 最新部署 → **...** → **Redeploy** 使其生效

---

## 常见问题

### Q: Vercel 部署成功但打开 404
- 检查 **Root Directory** 是否设为 `backend`
- Vercel Dashboard → Settings → General → Root Directory → 应显示 `backend`

### Q: 环境变量加了但还是连不上数据库
- 添加环境变量后**必须 Redeploy** 才生效
- 检查 `SUPABASE_URL` 是否包含 `https://` 前缀
- 检查 Supabase 项目是否被暂停（免费项目 7 天不用会暂停）

### Q: GitHub 推送失败 "fatal: not a git repository"
```bash
cd D:\旅游规划系统
git init
git add .
git commit -m "init"
git remote add origin https://github.com/你的用户名/travel-planner.git
git push -u origin master
```

### Q: 推送时 "error: remote origin already exists"
```bash
git remote remove origin
git remote add origin https://github.com/你的用户名/travel-planner.git
git push -u origin master
```

### Q: Vercel 看不到我的 GitHub 仓库
- Vercel → Settings → **Connected Git Accounts** → 确认 GitHub 已连接
- 如果连接了但看不到，点 **Adjust App Permissions** → 选 **All repositories** → Save
- 回到 Dashboard → Add New → Project → 刷新列表

### Q: 部署日志报错 "Module not found"
- 确认 Root Directory 是 `backend`
- 确认 `backend/package.json` 存在且包含所有 dependencies
- 在本地 `backend` 目录执行 `npm install` 确认能正常安装

### Q: 想用自定义域名（如 www.mytravel.com）
1. Vercel → 项目 → Settings → **Domains**
2. 输入你的域名 → Add
3. 按提示去你的域名服务商（阿里云/腾讯云等）添加 DNS 记录：
   - 类型：**CNAME**
   - 主机记录：`www`（或 `@`）
   - 记录值：`cname.vercel-dns.com`
4. 等待 DNS 生效（通常几分钟到几小时）
5. Vercel 自动签发 HTTPS 证书

---

以上就是从零到上线操作的完整详细步骤，照着做一遍即可。
