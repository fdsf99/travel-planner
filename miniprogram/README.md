# 旅游规划助手 - 微信小程序

智能旅游行程规划系统,基于AI大模型自动生成个性化旅游行程。

##  功能特性

- ✅ **智能行程生成**: AI自动生成完整的每日行程安排
- ✅ **个性化推荐**: 根据兴趣偏好推荐景点和活动
- ✅ **多约束优化**: 考虑交通、时间、预算等因素
- ✅ **地图可视化**: 展示景点位置和游览路线
- ✅ **个人中心**: 管理历史行程和用户信息

---

##  快速开始

### 1. 确保后端已启动

```bash
cd d:\旅游规划系统\backend
npm start
```

后端应该运行在: http://localhost:3001

### 2. 打开微信开发者工具

- 下载地址: https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html
- 安装并启动

### 3. 导入项目

1. 点击 **"+"** 或 **"导入项目"**
2. 选择目录: `d:\旅游规划系统\miniprogram`
3. AppID: 点击 **"测试号"** (使用微信扫码登录)
4. 点击 **"确定"**

### 4. 配置开发环境

在微信开发者工具中:
1. 点击右上角 **"详情"**
2. 找到 **"本地设置"**
3. **✅ 勾选 "不校验合法域名、web-view(业务域名)、TLS 版本以及 HTTPS 证书"**

### 5. 开始测试

- 在首页填写旅游信息
- 点击"生成行程"
- 查看AI生成的行程
- 在地图页查看路线

---

##  项目结构

```
miniprogram/
├── app.js              # 全局配置
├── app.json            # 页面路由配置
├── app.wxss            # 全局样式
├── project.config.json # 项目配置
├── sitemap.json        # 站点地图
├── utils/              # 工具函数
│   └── request.js      # 网络请求封装
├── pages/              # 页面
│   ├── index/          # 首页 (行程生成)
│   ├── itinerary/      # 行程详情
│   ├── map/            # 地图展示
│   └── profile/        # 个人中心
└── images/             # 图片资源
```

---

##  配置说明

### API地址配置

在 `app.js` 中:

```javascript
globalData: {
  apiBaseUrl: 'http://localhost:3001/api'  // 开发环境
}
```

**部署时修改为**:
```javascript
apiBaseUrl: 'https://your-vercel-domain.vercel.app/api'
```

### 后端API接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/itinerary/generate` | POST | 生成行程 |
| `/api/itinerary/:id` | GET | 获取行程详情 |
| `/api/recommendations` | POST | 获取推荐 |
| `/api/optimize/route` | POST | 路线优化 |

---

##  开发指南

详细开发文档: [`DEVELOPMENT.md`](DEVELOPMENT.md)

### 页面开发

每个页面包含4个文件:
- `.js` - 页面逻辑
- `.json` - 页面配置
- `.wxml` - 页面结构
- `.wxss` - 页面样式

### 示例: 添加新页面

1. 在 `pages/` 下创建新文件夹
2. 创建4个文件: `page.js`, `page.json`, `page.wxml`, `page.wxss`
3. 在 `app.json` 的 `pages` 数组中添加路径
4. 使用 `wx.navigateTo()` 跳转

---

##  调试技巧

### 1. 查看网络请求

在开发者工具中:
- 点击 **"调试器"** → **"Network"**
- 查看所有HTTP请求
- 查看请求参数和响应数据

### 2. 查看控制台日志

在开发者工具中:
- 点击 **"调试器"** → **"Console"**
- 查看 `console.log()` 输出
- 查看错误信息

### 3. 使用WXML调试器

在开发者工具中:
- 点击 **"调试器"** → **"Wxml"**
- 查看页面结构
- 实时修改样式

---

##  常见问题

### Q: 提示 "request:fail url not in domain list"

**A**: 勾选 "不校验合法域名" (见上面步骤4)

### Q: 点击生成行程没有反应

**A**: 
1. 检查后端是否启动: 访问 http://localhost:3001/health
2. 查看Console是否有错误
3. 查看Network请求状态

### Q: 地图不显示

**A**: 
1. 检查景点数据是否有经纬度
2. 查看Console错误信息

### Q: 样式显示异常

**A**:
1. 清除缓存: 点击 "清缓存" → "清除全部"
2. 重新编译项目

---

##  真机测试

### 方法1: 预览 (推荐)

1. 在开发者工具点击 **"预览"**
2. 生成二维码
3. 微信扫码查看

**注意**: 真机需要后端部署到公网

### 方法2: 局域网测试

1. 查看电脑IP地址: `ipconfig` (Windows)
2. 修改 `apiBaseUrl` 为: `http://192.168.x.x:3001/api`
3. 确保手机和电脑在同一网络
4. 使用预览功能测试

---

##  部署上线

### 1. 部署后端到Vercel

参考: [`../docs/DEPLOYMENT.md`](../docs/DEPLOYMENT.md)

### 2. 修改API地址

```javascript
apiBaseUrl: 'https://your-app.vercel.app/api'
```

### 3. 上传代码

1. 在开发者工具点击 **"上传"**
2. 填写版本号和备注
3. 登录小程序后台提交审核

### 4. 配置合法域名

在小程序后台:
1. **开发管理** → **开发设置**
2. **服务器域名** → **request合法域名**
3. 添加: `https://your-app.vercel.app`

---

##  技术栈

- **框架**: 微信小程序原生开发
- **语言**: JavaScript (ES6+)
- **样式**: WXSS (类CSS)
- **模板**: WXML (类HTML)
- **API**: 微信原生API

---

##  贡献

欢迎提交Issue和Pull Request!

---

##  许可证

MIT License

---

##  联系方式

如有问题,请查看文档或提交Issue。

祝使用愉快! 
