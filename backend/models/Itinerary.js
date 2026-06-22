const { supabase, dbAvailable } = require('../utils/database');

/** 数据库不可用时直接返回空/null */
function dbDown() {
  return !dbAvailable || !supabase;
}

/** 判断是否为"表/路径不存在"类错误 */
function isTableNotFoundError(error) {
  const msg = (error.message || '').toLowerCase();
  return msg.includes('invalid path') || msg.includes('does not exist') || msg.includes('relation');
}

/** 判断是否为本地临时ID(非UUID),避免查询Supabase时触发uuid语法错误 */
function isLocalId(id) {
  return typeof id === 'string' && id.startsWith('local_');
}

/**
 * 行程相关操作
 * 数据库不可用时降级返回本地模拟数据
 */
class ItineraryService {
  /**
   * 创建新行程
   */
  static async create(itineraryData) {
    if (dbDown()) {
      console.warn('⚠️  数据库不可用,行程仅保存在内存中');
      return { ...itineraryData, id: `local_${Date.now()}` };
    }

    const { data, error } = await supabase
      .from('itineraries')
      .insert([itineraryData])
      .select()
      .single();

    if (error) {
      if (isTableNotFoundError(error)) {
        console.warn('⚠️  itineraries表不存在,返回本地模拟数据');
        return { ...itineraryData, id: `local_${Date.now()}` };
      }
      throw new Error(`Failed to create itinerary: ${error.message}`);
    }

    return data;
  }

  /**
   * 根据ID查找行程
   * 注意: local_ 开头的临时ID不会查询数据库(前端应从sessionStorage读取)
   */
  static async findById(id) {
    if (isLocalId(id)) {
      console.warn(`⚠️  临时ID(${id})无法从数据库查询`);
      return null;
    }
    if (dbDown()) return null;
    const { data, error } = await supabase
      .from('itineraries')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      if (isTableNotFoundError(error)) return null;
      throw new Error(`Failed to find itinerary: ${error.message}`);
    }

    return data;
  }

  /**
   * 获取用户的行程列表
   */
  static async findByUser(userId, options = {}) {
    if (dbDown()) return [];
    let query = supabase
      .from('itineraries')
      .select('*')
      .eq('user_id', userId);

    if (options.status) query = query.eq('status', options.status);

    query = query.order('created_at', { ascending: false });
    query = query.limit(options.limit || 20);

    const { data, error } = await query;

    if (error) {
      if (isTableNotFoundError(error)) return [];
      throw new Error(`Failed to find itineraries: ${error.message}`);
    }

    return data || [];
  }

  /**
   * 更新行程
   */
  static async update(id, updates) {
    if (isLocalId(id) || dbDown()) return null;
    const { data, error } = await supabase
      .from('itineraries')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (isTableNotFoundError(error)) return null;
      throw new Error(`Failed to update itinerary: ${error.message}`);
    }

    return data;
  }

  /**
   * 删除行程
   */
  static async delete(id) {
    if (isLocalId(id)) return true; // 本地临时ID直接视为已删除
    if (dbDown()) return true;
    const { error } = await supabase
      .from('itineraries')
      .delete()
      .eq('id', id);

    if (error) {
      if (isTableNotFoundError(error)) return true;
      throw new Error(`Failed to delete itinerary: ${error.message}`);
    }

    return true;
  }

  /**
   * 获取公开行程
   */
  static async getPublicItineraries(city, limit = 20) {
    if (dbDown()) return [];
    let query = supabase
      .from('itineraries')
      .select('*')
      .eq('is_public', true)
      .order('likes', { ascending: false });

    if (city) query = query.eq('destination_city', city);
    query = query.limit(limit);

    const { data, error } = await query;

    if (error) {
      if (isTableNotFoundError(error)) return [];
      throw new Error(`Failed to get public itineraries: ${error.message}`);
    }

    return data || [];
  }
}

module.exports = ItineraryService;
