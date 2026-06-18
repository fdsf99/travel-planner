const { supabase } = require('../utils/database');

/**
 * 行程相关操作
 */
class ItineraryService {
  /**
   * 创建新行程
   */
  static async create(itineraryData) {
    const { data, error } = await supabase
      .from('itineraries')
      .insert([itineraryData])
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to create itinerary: ${error.message}`);
    }
    
    return data;
  }

  /**
   * 根据ID查找行程
   */
  static async findById(id) {
    const { data, error } = await supabase
      .from('itineraries')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to find itinerary: ${error.message}`);
    }
    
    return data;
  }

  /**
   * 获取用户的行程列表
   */
  static async findByUser(userId, options = {}) {
    let query = supabase
      .from('itineraries')
      .select('*')
      .eq('user_id', userId);
    
    // 按状态筛选
    if (options.status) {
      query = query.eq('status', options.status);
    }
    
    // 排序
    query = query.order('created_at', { ascending: false });
    
    // 限制数量
    const limit = options.limit || 20;
    query = query.limit(limit);
    
    const { data, error } = await query;
    
    if (error) {
      throw new Error(`Failed to find itineraries: ${error.message}`);
    }
    
    return data || [];
  }

  /**
   * 更新行程
   */
  static async update(id, updates) {
    const { data, error } = await supabase
      .from('itineraries')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to update itinerary: ${error.message}`);
    }
    
    return data;
  }

  /**
   * 删除行程
   */
  static async delete(id) {
    const { error } = await supabase
      .from('itineraries')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw new Error(`Failed to delete itinerary: ${error.message}`);
    }
  }

  /**
   * 获取公开行程
   */
  static async getPublicItineraries(city, limit = 20) {
    let query = supabase
      .from('itineraries')
      .select('*')
      .eq('is_public', true)
      .order('likes', { ascending: false });
    
    if (city) {
      query = query.eq('destination_city', city);
    }
    
    query = query.limit(limit);
    
    const { data, error } = await query;
    
    if (error) {
      throw new Error(`Failed to get public itineraries: ${error.message}`);
    }
    
    return data || [];
  }
}

module.exports = ItineraryService;
