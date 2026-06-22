const { supabase, dbAvailable } = require('../utils/database');

/**
 * 景点相关操作
 * 注意: Supabase 不可用或表不存在时返回空数组,让调用方使用高德API降级
 */

/** 数据库不可用时直接返回空数组 */
function dbDown() {
  return !dbAvailable || !supabase;
}

/** 判断是否为"表/路径不存在"类错误 */
function isTableNotFoundError(error) {
  const msg = (error.message || '').toLowerCase();
  return msg.includes('invalid path') || msg.includes('does not exist') || msg.includes('relation');
}

class AttractionService {
  /**
   * 根据城市查找景点
   */
  static async findByCity(city, options = {}) {
    if (dbDown()) return [];
    try {
      let query = supabase
        .from('attractions')
        .select('*')
        .eq('city', city);

      if (options.category) query = query.eq('category', options.category);

      if (options.sortBy === 'popularity') {
        query = query.order('popularity', { ascending: false });
      } else if (options.sortBy === 'rating') {
        query = query.order('rating', { ascending: false });
      }

      query = query.limit(options.limit || 50);

      const { data, error } = await query;

      if (error) {
        if (isTableNotFoundError(error)) {
          console.warn('⚠️  attractions表不存在,返回空数组(将使用高德API降级)');
          return [];
        }
        throw new Error(`Failed to find attractions: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      if (error.message && error.message.includes('Failed to find attractions')) throw error;
      console.warn('⚠️  Supabase查询失败,返回空数组:', error.message);
      return [];
    }
  }

  /**
   * 根据ID查找景点
   */
  static async findById(id) {
    if (dbDown()) return null;
    try {
      const { data, error } = await supabase
        .from('attractions')
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') {
        if (isTableNotFoundError(error)) return null;
        throw new Error(`Failed to find attraction: ${error.message}`);
      }

      return data;
    } catch (error) {
      if (error.message && error.message.includes('Failed to find attraction')) throw error;
      return null;
    }
  }

  /**
   * 根据多个ID查找景点
   */
  static async findByIds(ids) {
    if (dbDown()) return [];
    try {
      const { data, error } = await supabase
        .from('attractions')
        .select('*')
        .in('id', ids);

      if (error) {
        if (isTableNotFoundError(error)) return [];
        throw new Error(`Failed to find attractions: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      if (error.message && error.message.includes('Failed to find attractions')) throw error;
      return [];
    }
  }

  /**
   * 搜索景点
   */
  static async search(query, city) {
    if (dbDown()) return [];
    try {
      let sqlQuery = supabase
        .from('attractions')
        .select('*');

      if (query && query.trim()) {
        sqlQuery = sqlQuery.ilike('name', `%${query}%`);
      }
      if (city) {
        sqlQuery = sqlQuery.eq('city', city);
      }

      const { data, error } = await sqlQuery.limit(20);

      if (error) {
        if (isTableNotFoundError(error)) return [];
        throw new Error(`Failed to search attractions: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      if (error.message && error.message.includes('Failed to search attractions')) throw error;
      return [];
    }
  }

  /**
   * 获取热门景点
   */
  static async getPopular(city, limit = 20) {
    if (dbDown()) return [];
    try {
      const { data, error } = await supabase
        .from('attractions')
        .select('*')
        .eq('city', city)
        .order('popularity', { ascending: false })
        .limit(limit);

      if (error) {
        if (isTableNotFoundError(error)) return [];
        throw new Error(`Failed to get popular attractions: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      if (error.message && error.message.includes('Failed to get popular attractions')) throw error;
      return [];
    }
  }

  /**
   * 创建新景点
   */
  static async create(attractionData) {
    if (dbDown()) {
      return { ...attractionData, id: `local_${Date.now()}` };
    }
    const { data, error } = await supabase
      .from('attractions')
      .insert([attractionData])
      .select()
      .single();

    if (error) {
      if (isTableNotFoundError(error)) {
        console.warn('⚠️  attractions表不存在,跳过景点保存');
        return { ...attractionData, id: `local_${Date.now()}` };
      }
      throw new Error(`Failed to create attraction: ${error.message}`);
    }

    return data;
  }

  /**
   * 更新景点信息
   */
  static async update(id, updates) {
    if (dbDown()) return null;
    const { data, error } = await supabase
      .from('attractions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (isTableNotFoundError(error)) return null;
      throw new Error(`Failed to update attraction: ${error.message}`);
    }

    return data;
  }
}

module.exports = AttractionService;
