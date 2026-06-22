const { supabase } = require('../utils/database');

/**
 * 景点相关操作
 * 注意: Supabase 表不存在时会返回空数组而非抛错,避免上游流程中断
 */
class AttractionService {
  /**
   * 根据城市查找景点
   */
  static async findByCity(city, options = {}) {
    try {
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
        // 表不存在或请求路径无效时返回空数组,让调用方使用高德API降级
        const msg = (error.message || '').toLowerCase();
        if (msg.includes('invalid path') || msg.includes('does not exist') || msg.includes('relation')) {
          console.warn('⚠️  attractions表不存在或未暴露API,返回空数组(将使用高德API降级)');
          return [];
        }
        throw new Error(`Failed to find attractions: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      // 网络不可达等非业务错误: 返回空数组,让调用方降级处理
      if (error.message && error.message.includes('Failed to find attractions')) {
        throw error; // 业务错误继续抛出
      }
      console.warn('⚠️  Supabase查询失败,返回空数组:', error.message);
      return [];
    }
  }

  /**
   * 根据ID查找景点
   */
  static async findById(id) {
    try {
      const { data, error } = await supabase
        .from('attractions')
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') {
        const msg = (error.message || '').toLowerCase();
        if (msg.includes('invalid path') || msg.includes('does not exist') || msg.includes('relation')) {
          return null;
        }
        throw new Error(`Failed to find attraction: ${error.message}`);
      }

      return data;
    } catch (error) {
      if (error.message && error.message.includes('Failed to find attraction')) {
        throw error;
      }
      return null;
    }
  }

  /**
   * 根据多个ID查找景点
   */
  static async findByIds(ids) {
    try {
      const { data, error } = await supabase
        .from('attractions')
        .select('*')
        .in('id', ids);

      if (error) {
        const msg = (error.message || '').toLowerCase();
        if (msg.includes('invalid path') || msg.includes('does not exist') || msg.includes('relation')) {
          return [];
        }
        throw new Error(`Failed to find attractions: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      if (error.message && error.message.includes('Failed to find attractions')) {
        throw error;
      }
      return [];
    }
  }

  /**
   * 搜索景点
   */
  static async search(query, city) {
    try {
      let sqlQuery = supabase
        .from('attractions')
        .select('*');

      // 空字符串时不加 ilike 条件(避免无意义全表扫描)
      if (query && query.trim()) {
        sqlQuery = sqlQuery.ilike('name', `%${query}%`);
      }

      if (city) {
        sqlQuery = sqlQuery.eq('city', city);
      }

      const { data, error } = await sqlQuery.limit(20);

      if (error) {
        const msg = (error.message || '').toLowerCase();
        if (msg.includes('invalid path') || msg.includes('does not exist') || msg.includes('relation')) {
          return [];
        }
        throw new Error(`Failed to search attractions: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      if (error.message && error.message.includes('Failed to search attractions')) {
        throw error;
      }
      return [];
    }
  }

  /**
   * 获取热门景点
   */
  static async getPopular(city, limit = 20) {
    try {
      const { data, error } = await supabase
        .from('attractions')
        .select('*')
        .eq('city', city)
        .order('popularity', { ascending: false })
        .limit(limit);

      if (error) {
        const msg = (error.message || '').toLowerCase();
        if (msg.includes('invalid path') || msg.includes('does not exist') || msg.includes('relation')) {
          return [];
        }
        throw new Error(`Failed to get popular attractions: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      if (error.message && error.message.includes('Failed to get popular attractions')) {
        throw error;
      }
      return [];
    }
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
      // 表不存在时静默失败,景点数据仅用于当次请求
      const msg = (error.message || '').toLowerCase();
      if (msg.includes('invalid path') || msg.includes('does not exist') || msg.includes('relation')) {
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
    const { data, error } = await supabase
      .from('attractions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      const msg = (error.message || '').toLowerCase();
      if (msg.includes('invalid path') || msg.includes('does not exist') || msg.includes('relation')) {
        return null;
      }
      throw new Error(`Failed to update attraction: ${error.message}`);
    }

    return data;
  }
}

module.exports = AttractionService;
