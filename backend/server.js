const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// 导入数据库工具
const { testConnection } = require('./utils/database');

const app = express();
const PORT = process.env.PORT || 3000;
const IS_VERCEL = !!process.env.VERCEL;
const IS_DEV = process.env.NODE_ENV === 'development';

// 中间件
app.use(helmet()); // 安全头
app.use(cors()); // 跨域支持
app.use(morgan('dev')); // 日志
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API路由
app.use('/api/itinerary', require('./api/itinerary'));
app.use('/api/recommendations', require('./api/recommendation'));
app.use('/api/optimize', require('./api/optimization'));
app.use('/api/auth', require('./api/auth'));

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: 'supabase'
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// 错误处理
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err.stack);
  const body = { error: 'Internal server error' };
  if (IS_DEV) {
    body.message = err.message;
  }
  res.status(500).json(body);
});

// 本地开发启动
async function startServer() {
  try {
    // 测试数据库连接(可选)
    let dbConnected = false;
    try {
      await testConnection();
      dbConnected = true;
    } catch (error) {
      console.warn('⚠️  Supabase连接失败,服务器将以降级模式启动');
      console.warn('   提示: 请检查网络连接或Supabase配置');
    }
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Database: ${dbConnected ? 'Supabase' : 'Offline Mode (降级模式)'}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      if (!dbConnected) {
        console.log('\n⚠️  警告: 数据库未连接,部分功能可能不可用');
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Vercel Serverless 直接导出 app；本地环境才监听端口
if (IS_VERCEL) {
  module.exports = app;
} else {
  startServer();
}
