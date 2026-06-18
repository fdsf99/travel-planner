const { supabase } = require('../utils/database');

/**
 * 用户相关操作
 */
class UserService {
  /**
   * 根据openid查找用户
   */
  static async findByOpenId(openid) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('openid', openid)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      throw new Error(`Failed to find user: ${error.message}`);
    }
    
    return data;
  }

  /**
   * 创建新用户
   */
  static async create(userData) {
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }
    
    return data;
  }

  /**
   * 更新用户信息
   */
  static async update(openid, updates) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('openid', openid)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }
    
    return data;
  }

  /**
   * 获取或创建用户
   */
  static async getOrCreate(openid, userData = {}) {
    let user = await this.findByOpenId(openid);
    
    if (!user) {
      user = await this.create({
        openid,
        nickname: userData.nickname || null,
        avatar: userData.avatar || null,
        preferences: userData.preferences || { interests: [], budgetRange: null, travelPace: null }
      });
    }
    
    return user;
  }
}

module.exports = UserService;
