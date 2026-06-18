// app.js
App({
  onLaunch() {
    console.log('Travel Planner MiniProgram launched');
  },

  onShow() {
    console.log('App shown');
  },

  globalData: {
    // 部署说明:
    // - 本地调试: 'http://localhost:3000/api'
    // - 正式上线: 改为你的 Vercel 域名,如 'https://你的项目.vercel.app/api'
    // - 域名必须是 HTTPS,且需在小程序后台配置为 request 合法域名
    apiBaseUrl: 'http://localhost:3000/api',
    userInfo: null,
    currentItinerary: null
  }
});
