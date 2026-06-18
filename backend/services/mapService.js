const axios = require('axios');

const AMAP_KEY = process.env.AMAP_KEY;
const AMAP_BASE_URL = 'https://restapi.amap.com/v3';

/**
 * 高德地图服务封装
 */
class AMapService {
  
  /**
   * POI搜索 - 根据城市/关键词获取景点列表
   * @param {string} city - 城市名称
   * @param {string} keywords - 搜索关键词
   * @param {string} type - 类型过滤(可选)
   * @returns {Promise<Array>} 景点列表
   */
  async searchPOI(city, keywords = '旅游景点', type = '旅游景点') {
    try {
      const response = await axios.get(`${AMAP_BASE_URL}/place/text`, {
        params: {
          key: AMAP_KEY,
          city: city,
          keywords: keywords,
          types: type,
          offset: 20,
          page: 1,
          extensions: 'all'
        }
      });

      if (response.data.status !== '1') {
        throw new Error(`AMap API error: ${response.data.info}`);
      }

      return this.formatPOIResults(response.data.pois || []);
    } catch (error) {
      console.error('AMap searchPOI error:', error.message);
      throw error;
    }
  }

  /**
   * 地理编码 - 地址转坐标
   * @param {string} address - 地址
   * @param {string} city - 城市(可选)
   * @returns {Promise<Object>} { longitude, latitude }
   */
  async geocode(address, city) {
    try {
      const response = await axios.get(`${AMAP_BASE_URL}/geocode/geo`, {
        params: {
          key: AMAP_KEY,
          address: address,
          city: city || '',
          output: 'json'
        }
      });

      if (response.data.status !== '1' || !response.data.geocodes || response.data.geocodes.length === 0) {
        throw new Error('Geocoding failed');
      }

      const location = response.data.geocodes[0].location.split(',');
      return {
        longitude: parseFloat(location[0]),
        latitude: parseFloat(location[1])
      };
    } catch (error) {
      console.error('AMap geocode error:', error.message);
      throw error;
    }
  }

  /**
   * 逆地理编码 - 坐标转地址
   * @param {number} longitude - 经度
   * @param {number} latitude - 纬度
   * @returns {Promise<string>} 地址
   */
  async reverseGeocode(longitude, latitude) {
    try {
      const response = await axios.get(`${AMAP_BASE_URL}/geocode/regeo`, {
        params: {
          key: AMAP_KEY,
          location: `${longitude},${latitude}`,
          output: 'json'
        }
      });

      if (response.data.status !== '1') {
        throw new Error('Reverse geocoding failed');
      }

      return response.data.regeocode.formatted_address;
    } catch (error) {
      console.error('AMap reverseGeocode error:', error.message);
      throw error;
    }
  }

  /**
   * 路径规划 - 计算两点间交通时间和路线
   * @param {Object} origin - 起点 { longitude, latitude, city? }
   * @param {Object} destination - 终点 { longitude, latitude }
   * @param {string} mode - 交通方式 driving/walking/transit
   * @returns {Promise<Object>} 路径信息
   */
  async routePlanning(origin, destination, mode = 'driving') {
    try {
      // 公共参数,所有交通方式都需要
      const params = {
        key: AMAP_KEY,
        origin: `${origin.longitude},${origin.latitude}`,
        destination: `${destination.longitude},${destination.latitude}`
      };

      let apiUrl;
      switch (mode) {
        case 'walking':
          apiUrl = `${AMAP_BASE_URL}/direction/walking`;
          break;
        case 'transit':
          apiUrl = `${AMAP_BASE_URL}/direction/transit/integrated`;
          params.city = origin.city || '';
          break;
        default: // driving
          apiUrl = `${AMAP_BASE_URL}/direction/driving`;
          params.extensions = 'all';
      }

      const response = await axios.get(apiUrl, { params });

      if (response.data.status !== '1') {
        throw new Error(`Route planning failed: ${response.data.info}`);
      }

      return this.formatRouteResult(response.data, mode);
    } catch (error) {
      console.error(`AMap routePlanning (${mode}) error:`, error.message);
      throw error;
    }
  }

  /**
   * 批量获取景点详情
   * @param {Array<string>} poiIds - POI ID列表
   * @returns {Promise<Array>} 景点详情列表
   */
  async getPOIDetails(poiIds) {
    try {
      const ids = poiIds.join('|');
      const response = await axios.get(`${AMAP_BASE_URL}/place/detail`, {
        params: {
          key: AMAP_KEY,
          id: ids,
          extensions: 'all'
        }
      });

      if (response.data.status !== '1') {
        throw new Error(`Get POI details failed: ${response.data.info}`);
      }

      return this.formatPOIResults(response.data.pois || []);
    } catch (error) {
      console.error('AMap getPOIDetails error:', error.message);
      throw error;
    }
  }

  /**
   * 格式化POI结果
   * @private
   */
  formatPOIResults(pois) {
    return pois.map(poi => {
      const locationStr = poi.location || '';
      const [lngStr, latStr] = locationStr ? locationStr.split(',') : [];
      const lng = parseFloat(lngStr);
      const lat = parseFloat(latStr);

      return {
        name: poi.name,
        address: poi.address,
        longitude: Number.isNaN(lng) ? null : lng,
        latitude: Number.isNaN(lat) ? null : lat,
        category: poi.type,
        rating: parseFloat(poi.biz_ext?.rating || 0),
        images: poi.photos ? poi.photos.map(p => p.url) : [],
        opening_hours: { weekday: '', weekend: '', specialNotes: poi.biz_ext?.cost || '未知' },
        source: 'amap',
        source_id: poi.id
      };
    });
  }

  /**
   * 格式化路线结果
   * @private
   */
  formatRouteResult(data, mode) {
    const route = data.route || {};

    if (mode === 'transit') {
      // 公交路径规划返回格式不同
      const transit = route.transits?.[0] || {};
      return {
        duration: transit.duration || 0,
        distance: transit.distance || 0,
        steps: transit.segments || []
      };
    }

    const path = route.paths?.[0] || {};
    return {
      duration: parseInt(path.duration, 10) || 0,
      distance: parseInt(path.distance, 10) || 0,
      steps: path.steps || []
    };
  }
}

module.exports = new AMapService();
