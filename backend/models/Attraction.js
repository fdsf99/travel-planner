const { supabase } = require('../utils/database');

/**
 * 景点相关操作
 */
class AttractionService {
  /**
   * 根据城市查找景点
   */
  static async findByCity(city, options = {}) {
    let query = supabase
      .from('attractions')
      .select('*')
      .eq('city', city);
    
    // 按类别筛选
    if (options.category) {
      query = query.eq('category', options.category);
    }
    
    // 排序
    if (options.sortBy === 'popularity') {
      query = query.order('popularity', { ascending: false });
    } else if (options.sortBy === 'rating') {
      query = query.order('rating', { ascending: false });
    }
    
    // 限制数量
    const limit = options.limit || 50;
    query = query.limit(limit);
    
    const { data, error } = await query;
    
    if (error) {
      throw new Error(`Failed to find attractions: ${error.message}`);
    }
    
    return data || [];
  }

  /**
   * 根据ID查找景点
   */
  static async findById(id) {
    const { data, error } = await supabase
      .from('attractions')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to find attraction: ${error.message}`);
    }
    
    return data;
  }

  /**
   * 根据多个ID查找景点
   */
  static async findByIds(ids) {
    const { data, error } = await supabase
      .from('attractions')
      .select('*')
      .in('id', ids);
    
    if (error) {
      throw new Error(`Failed to find attractions: ${error.message}`);
    }
    
    return data || [];
  }

  /**
   * 搜索景点
   */
  static async search(query, city) {
    let sqlQuery = supabase
      .from('attractions')
      .select('*')
      .ilike('name', `%${query}%`);
    
    if (city) {
      sqlQuery = sqlQuery.eq('city', city);
    }
    
    const { data, error } = await sqlQuery.limit(20);
    
    if (error) {
      throw new Error(`Failed to search attractions: ${error.message}`);
    }
    
    return data || [];
  }

  /**
   * 获取热门景点
   */
  static async getPopular(city, limit = 20) {
    const { data, error } = await supabase
      .from('attractions')
      .select('*')
      .eq('city', city)
      .order('popularity', { ascending: false })
      .limit(limit);
    
    if (error) {
      throw new Error(`Failed to get popular attractions: ${error.message}`);
    }
    
    return data || [];
  }

  /**
   * 创建新景点
   */
  static async create(attractionData) {
    const { data, error } = await supabase
      .from('attractions')
      .insert([attractionData])
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to create attraction: ${error.message}`);
    }
    
    return data;
  }

  /**
   * 更新景点信息
   */
  static async update(id, updates) {
    const { data, error } = await supabase
      .from('attractions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to update attraction: ${error.message}`);
    }
    
    return data;
  }
}

module.exports = AttractionService;
