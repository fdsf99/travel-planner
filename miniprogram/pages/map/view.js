// pages/map/view.js
const { get, showLoading, hideLoading, showError } = require('../../utils/request');

Page({
  data: {
    itineraryId: '',
    centerLocation: {
      longitude: 116.4074,
      latitude: 39.9042
    },
    markers: [],
    polyline: [],
    attractions: []
  },

  onLoad(options) {
    const { itineraryId } = options;
    if (itineraryId) {
      this.setData({ itineraryId });
      this.loadItineraryAndShowMap(itineraryId);
    }
  },

  // 加载行程并显示地图
  async loadItineraryAndShowMap(itineraryId) {
    showLoading('加载地图...');
    
    try {
      const result = await get(`/itinerary/${itineraryId}`);
      
      if (result.success && result.itinerary) {
        this.processItineraryData(result.itinerary);
      } else {
        showError('加载失败');
      }
    } catch (error) {
      console.error('Load itinerary error:', error);
      showError('网络错误');
    } finally {
      hideLoading();
    }
  },

  // 处理行程数据,转换为地图标记和路线
  processItineraryData(itinerary) {
    // 兼容两种命名: daily_plans 和 dailyPlans
    const dailyPlans = itinerary.daily_plans || itinerary.dailyPlans || [];

    // 收集所有活动
    const allActivities = [];

    dailyPlans.forEach(day => {
      const activities = day.activities || day.attractions || [];
      activities.forEach(activity => {
        // 支持多种位置字段格式
        const location = activity.location || activity.attractionLocation || activity.coordinates;
        if (!location) return;

        const coordinates = location.coordinates || location;
        if (!coordinates || coordinates.length < 2) return;

        allActivities.push({
          ...activity,
          attractionLocation: { coordinates },
          day: day.day || day.dayNumber
        });
      });
    });

    if (allActivities.length === 0) {
      showError('没有可显示的景点');
      return;
    }

    // 创建标记点
    const markers = allActivities.map((activity, index) => {
      const [lng, lat] = activity.attractionLocation.coordinates;
      return {
        id: index + 1,
        longitude: lng,
        latitude: lat,
        title: activity.attractionName,
        label: {
          content: String(index + 1),
          color: '#FFFFFF',
          fontSize: 14,
          borderRadius: 15,
          bgColor: '#4CAF50',
          padding: 5,
          anchorX: 15,
          anchorY: 15
        }
      };
    });

    // 创建路线(连接所有标记点)
    const points = allActivities.map(a => {
      const [lng, lat] = a.attractionLocation.coordinates;
      return { longitude: lng, latitude: lat };
    });

    const polyline = [{
      points,
      color: '#4CAF50',
      width: 4,
      dottedLine: false,
      arrowLine: true
    }];

    // 设置中心点为第一个景点
    const [firstLng, firstLat] = allActivities[0].attractionLocation.coordinates;
    const centerLocation = { longitude: firstLng, latitude: firstLat };

    // 格式化景点列表
    const attractions = allActivities.map((activity, index) => {
      const [lng, lat] = activity.attractionLocation.coordinates;
      return {
        order: index + 1,
        name: activity.attractionName,
        startTime: activity.startTime,
        endTime: activity.endTime,
        longitude: lng,
        latitude: lat
      };
    });

    this.setData({
      centerLocation,
      markers,
      polyline,
      attractions
    });
  },

  // 标记点点击
  onMarkerTap(e) {
    const markerId = e.detail.markerId;
    const attraction = this.data.attractions[markerId - 1];
    
    if (attraction) {
      wx.showModal({
        title: attraction.name,
        content: `${attraction.startTime} - ${attraction.endTime}`,
        showCancel: false
      });
    }
  },

  // 聚焦到指定景点
  focusOnAttraction(e) {
    const index = e.currentTarget.dataset.index;
    const attraction = this.data.attractions[index];
    
    if (attraction) {
      this.setData({
        centerLocation: {
          longitude: attraction.longitude,
          latitude: attraction.latitude
        }
      });
    }
  }
});
