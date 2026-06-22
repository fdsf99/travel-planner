const { createClient } = require('@supabase/supabase-js');

// 创建Supabase客户端(环境变量缺失时降级为null客户端,避免整个服务崩溃)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

let supabase;
let dbAvailable = true;

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️  SUPABASE_URL 或 SUPABASE_KEY 未配置,数据库功能将不可用');
  dbAvailable = false;
} else {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
  } catch (error) {
    console.warn('⚠️  Supabase客户端创建失败:', error.message);
    dbAvailable = false;
  }
}

// 测试数据库连接
async function testConnection() {
  if (!dbAvailable || !supabase) {
    throw new Error('Supabase not configured');
  }
  try {
    const { error } = await supabase.from('users').select('count').limit(1);
    // PGRST116 = "JSON object requested was not found"，连通性测试时该错误可接受
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    console.log('Supabase connected successfully');
    return true;
  } catch (error) {
    console.error('Supabase connection error:', error.message);
    throw error;
  }
}

module.exports = { supabase, testConnection, dbAvailable };
