/**
 * Web 端配置
 * - 部署在 Vercel 同域名下时 API_BASE 留空(同源 /api)
 * - 本地调试时改为 'http://localhost:3000'
 */
window.APP_CONFIG = {
  API_BASE: '',  // 同源部署,留空即可;本地调试改 'http://localhost:3000'
  INTEREST_OPTIONS: ['文化', '自然', '美食', '购物', '亲子', '历史', '艺术', '冒险']
};
