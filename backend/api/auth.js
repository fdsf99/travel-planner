const express = require('express');
const crypto = require('crypto');
const router = express.Router();

// 管理员账号,从环境变量读取,带默认值
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
// 默认密码 admin123 —— 生产环境务必通过环境变量 ADMIN_PASSWORD 覆盖
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
// JWT 密钥,生产环境务必通过环境变量 JWT_SECRET 覆盖
const JWT_SECRET = process.env.JWT_SECRET || 'travel-planner-default-secret-change-me';

/**
 * 简易 JWT 生成 (HS256, 无第三方依赖)
 */
function signToken(payload) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const body = { ...payload, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 7 * 24 * 3600 };
  const base64 = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const h = base64(header);
  const p = base64(body);
  const sig = crypto.createHmac('sha256', JWT_SECRET).update(`${h}.${p}`).digest('base64url');
  return `${h}.${p}.${sig}`;
}

/**
 * 校验 JWT
 */
function verifyToken(token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [h, p, sig] = parts;
  const expected = crypto.createHmac('sha256', JWT_SECRET).update(`${h}.${p}`).digest('base64url');
  if (sig !== expected) return null;
  try {
    const body = JSON.parse(Buffer.from(p, 'base64url').toString('utf8'));
    if (body.exp && body.exp < Math.floor(Date.now() / 1000)) return null;
    return body;
  } catch (e) {
    return null;
  }
}

/**
 * POST /api/auth/login
 * 管理员登录
 */
router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }
  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }
  const token = signToken({ username, role: 'admin' });
  res.json({
    success: true,
    token,
    user: { username, role: 'admin' },
    expiresIn: '7d'
  });
});

/**
 * GET /api/auth/check
 * 校验当前 token 是否有效
 */
router.get('/check', requireAuth, (req, res) => {
  res.json({ success: true, user: req.user });
});

/**
 * 鉴权中间件: 校验 Authorization: Bearer <token>
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: '未登录或登录已过期' });
  }
  req.user = payload;
  next();
}

module.exports = router;
module.exports.requireAuth = requireAuth;
module.exports.verifyToken = verifyToken;
