const { createClient } = require('@supabase/supabase-js');

// 创建Supabase客户端
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('SUPABASE_URL and SUPABASE_KEY environment variables are required');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 测试数据库连接
async function testConnection() {
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

module.exports = { supabase, testConnection };
