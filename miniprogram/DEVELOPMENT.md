# 微信小程序开发和测试指南

##  前置条件

### 1. 下载微信开发者工具

1. 访问: https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html
2. 下载 **稳定版** (Windows)
3. 安装并启动

### 2. 注册微信小程序账号 (可选,用于真机测试)

1. 访问: https://mp.weixin.qq.com
2. 点击 **"立即注册"** → **"小程序"**
3. 填写邮箱、密码等信息
4. 完成注册
5. 获取 AppID (在 **"开发管理" → "开发设置"** 中)

---

##  开发测试

### 方法1: 使用测试号 (推荐,无需注册)

1. 打开 **微信开发者工具**
2. 选择 **"小程序"**
3. 点击 **"测试号"** 按钮
4. 使用微信扫码登录
5. 导入项目:
   - 项目目录: `d:\旅游规划系统\miniprogram`
   - AppID: 使用测试号自动生成的ID
   - 项目名称: `旅游规划助手`
6. 点击 **"确定"**

### 方法2: 使用正式AppID (需要注册小程序)

1. 按照上面步骤注册小程序,获取AppID
2. 修改 `miniprogram/project.config.json` 中的 `appid` 字段
3. 用您的AppID替换 `"wxd8e2f8a7c4b6d5e3"`

---

##  配置后端地址

### 开发环境 (当前配置)

小程序已配置为连接本地后端:
```javascript
apiBaseUrl: 'http://localhost:3001/api'
```

### ⚠️ 重要: 关闭域名校验

在微信开发者工具中:
1. 点击右上角 **"详情"**
2. 找到 **"本地设置"**
3. **勾选 "不校验合法域名..."** (必须!)
4. 这样才能访问 localhost

---

##  测试功能

### 1. 启动后端服务

确保后端在运行:
```bash
cd d:\旅游规划系统\backend
npm start
```

应该看到:
```
✅ Supabase connected successfully
✅ Server running on port 3001
```

### 2. 在开发者工具中测试

#### 测试首页
1. 打开小程序,应该在首页
2. 填写表单:
   - 目的地: 北京
   - 天数: 3
   - 预算: 5000
   - 出发日期: 选择一个未来日期
   - 兴趣偏好: 勾选几个 (文化、美食等)
3. 点击 **"生成行程"** 按钮
4. 等待AI生成 (大约10-30秒)
5. 查看生成的行程详情

#### 测试行程详情页
- 查看每日行程安排
- 查看景点信息
- 查看费用预估

#### 测试地图页面
- 查看景点在地图上的位置
- 查看游览路线
- 查看距离和时间

#### 测试个人中心
- 查看历史行程
- 查看数据统计

---

##  功能测试清单

- [ ] 首页表单填写和提交
- [ ] AI行程生成
- [ ] 行程详情展示
- [ ] 地图路线显示
- [ ] 个人中心登录
- [ ] 历史行程列表
- [ ] 页面间跳转

---

##  常见问题

### Q1: 提示 "request:fail url not in domain list"

**解决**: 
- 在微信开发者工具中,勾选 **"不校验合法域名"**
- 或者在 `project.config.json` 中设置 `"urlCheck": false`

### Q2: 点击生成行程没有反应

**检查**:
1. 后端服务是否启动 (访问 http://localhost:3001/health)
2. 查看开发者工具的 **Console** 面板,看是否有错误
3. 查看 **Network** 面板,看请求是否发送成功

### Q3: 生成行程失败,提示错误

**可能原因**:
1. **高德地图API未配置**: 检查 `.env` 文件中的 `AMAP_KEY`
2. **AI API未配置**: 检查 `.env` 文件中的 `DASHSCOPE_API_KEY`
3. **数据库无景点数据**: 在 Supabase 的 attractions 表中添加数据

**解决**: 查看后端控制台的错误日志

### Q4: 地图不显示

**解决**:
- 检查景点数据中是否有经纬度坐标
- 查看 Console 是否有地图组件错误

---

##  后端API测试

在开发者工具的 **Console** 中可以直接测试API:

```javascript
// 测试健康检查
wx.request({
  url: 'http://localhost:3001/health',
  success: (res) => console.log(res.data)
})

// 测试行程生成
wx.request({
  url: 'http://localhost:3001/api/itinerary/generate',
  method: 'POST',
  data: {
    destination: '北京',
    days: 3,
    budget: 5000,
    interests: ['文化', '美食'],
    startDate: '2024-12-01'
  },
  success: (res) => console.log(res.data),
  fail: (err) => console.error(err)
})
```

---

##  真机测试 (可选)

### 步骤:

1. 在微信开发者工具中点击 **"预览"**
2. 生成二维码
3. 使用微信扫描二维码
4. 在手机上测试

### ⚠️ 注意:

- 真机测试需要后端部署到公网 (如Vercel)
- localhost 只能在电脑上的模拟器使用
- 或手机和电脑在同一局域网,使用电脑IP地址

---

##  部署到Vercel (生产环境)

参考文档: [`docs/DEPLOYMENT.md`](../docs/DEPLOYMENT.md)

简要步骤:
1. 部署后端到Vercel
2. 修改小程序 `apiBaseUrl` 为Vercel域名
3. 在小程序后台配置合法域名
4. 上传代码并提交审核

---

##  项目文件说明

### 核心文件:

- `app.js` - 全局配置和生命周期
- `app.json` - 页面路由和窗口配置
- `utils/request.js` - 网络请求封装
- `pages/index/` - 首页 (行程生成表单)
- `pages/itinerary/` - 行程详情页
- `pages/map/` - 地图展示页
- `pages/profile/` - 个人中心

### 配置文件:

- `project.config.json` - 项目配置
- `sitemap.json` - 站点地图配置

---

##  下一步

1. ✅ 启动后端服务
2. ✅ 打开微信开发者工具
3. ✅ 导入项目
4. ✅ 关闭域名校验
5. ✅ 测试各项功能
6. 修复问题 (如有)
7. 部署上线

---

##  需要帮助?

如果遇到任何问题:
1. 查看开发者工具的 **Console** 错误信息
2. 查看后端的控制台日志
3. 截图错误信息发给我

祝开发顺利! 
