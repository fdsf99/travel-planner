// pages/itinerary/detail.js
const { get, post, showLoading, hideLoading, showSuccess, showError } = require('../../utils/request');

Page({
  data: {
    itineraryId: '',
    itinerary: null,
    currentDay: 0,
    currentPlan: {}
  },

  onLoad(options) {
    const { id } = options;
    if (id) {
      this.setData({ itineraryId: id });
      this.loadItinerary(id);
    }
  },

  // 加载行程详情
  async loadItinerary(id) {
    showLoading('加载中...');
    
    try {
      const result = await get(`/itinerary/${id}`);
      
      if (result.success && result.itinerary) {
        const itinerary = result.itinerary;
        // 兼容两种命名: daily_plans 和 dailyPlans
        const dailyPlans = itinerary.daily_plans || itinerary.dailyPlans || [];
        
        this.setData({
          itinerary: itinerary,
          currentDay: 0,
          currentPlan: dailyPlans[0] || {}
        });
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

  // 切换日期
  switchDay(e) {
    const index = e.currentTarget.dataset.index;
    const { itinerary } = this.data;
    
    // 兼容两种命名: daily_plans 和 dailyPlans
    const dailyPlans = itinerary.daily_plans || itinerary.dailyPlans || [];
    
    this.setData({
      currentDay: index,
      currentPlan: dailyPlans[index] || {}
    });
  },

  // 查看地图
  viewOnMap() {
    const { itineraryId } = this.data;
    wx.navigateTo({
      url: `/pages/map/view?itineraryId=${itineraryId}`
    });
  },

  // 重新优化路线
  async optimizeRoute() {
    showLoading('优化中...');
    
    try {
      const { currentPlan, itinerary } = this.data;
      
      // 提取当前天的景点
      const attractions = currentPlan.activities
        .filter(activity => activity.attractionLocation)
        .map(activity => ({
          name: activity.attractionName,
          location: activity.attractionLocation
        }));

      if (attractions.length === 0) {
        hideLoading();
        showError('没有可优化的景点');
        return;
      }

      // 使用第一个景点作为起点
      const startLocation = attractions[0].location;

      // 调用优化API
      const result = await post('/optimize/route', {
        attractions,
        startLocation,
        options: {
          mode: 'walking'
        }
      });

      if (result.success && result.optimizedRoute) {
        hideLoading();
        showSuccess('优化完成');
        
        // 刷新页面
        this.loadItinerary(this.data.itineraryId);
      } else {
        hideLoading();
        showError('优化失败');
      }
      
    } catch (error) {
      hideLoading();
      console.error('Optimize route error:', error);
      showError('优化失败');
    }
  },

  // 跳转到行李清单
  goToPacking() {
    const { itineraryId } = this.data;
    wx.navigateTo({
      url: `/pages/tools/packing?itineraryId=${itineraryId}`
    });
  },

  // 跳转到费用记录
  goToExpenses() {
    const { itineraryId, itinerary } = this.data;
    const budget = itinerary.budget?.total || 3000;
    wx.navigateTo({
      url: `/pages/tools/expenses?itineraryId=${itineraryId}&budget=${budget}`
    });
  },

  // 跳转到天气查询
  goToWeather() {
    const { itinerary } = this.data;
    const destination = itinerary.destination_city || itinerary.destination?.city || '北京';
    wx.navigateTo({
      url: `/pages/tools/weather?destination=${encodeURIComponent(destination)}`
    });
  }
});
