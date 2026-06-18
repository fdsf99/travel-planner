// pages/itinerary/edit.js
const { get, post, showLoading, hideLoading, showSuccess, showError } = require('../../utils/request');

Page({
  data: {
    itineraryId: '',
    itinerary: null,
    destination: '',
    days: 3,
    budget: 3000,
    startDate: '',
    interests: [],
    interestOptions: ['文化', '自然', '美食', '购物', '亲子', '历史', '艺术', '冒险'],
    saving: false
  },

  onLoad(options) {
    const { id } = options;
    if (id) {
      this.setData({ itineraryId: id });
      this.loadItinerary(id);
    }
  },

  // 加载行程数据
  async loadItinerary(id) {
    showLoading('加载中...');
    
    try {
      const result = await get(`/itinerary/${id}`);
      
      if (result.success && result.itinerary) {
        const itinerary = result.itinerary;
        this.setData({
          itinerary,
          destination: itinerary.destination_city || itinerary.destination || '',
          days: itinerary.days || 3,
          budget: itinerary.budget?.total || 3000,
          startDate: (itinerary.start_date || itinerary.startDate || '').split('T')[0],
          interests: itinerary.interests || []
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

  // 输入目的地
  onDestinationInput(e) {
    this.setData({ destination: e.detail.value });
  },

  // 选择天数
  onDaysChange(e) {
    this.setData({ days: parseInt(e.detail.value) });
  },

  // 输入预算
  onBudgetInput(e) {
    this.setData({ budget: parseInt(e.detail.value) || 0 });
  },

  // 选择日期
  onDateChange(e) {
    this.setData({ startDate: e.detail.value });
  },

  // 切换兴趣标签
  toggleInterest(e) {
    const interest = e.currentTarget.dataset.interest;
    const interests = this.data.interests;
    const index = interests.indexOf(interest);
    
    if (index > -1) {
      interests.splice(index, 1);
    } else {
      interests.push(interest);
    }
    
    this.setData({ interests });
  },

  // 保存行程
  async saveItinerary() {
    const { itineraryId, destination, days, budget, startDate, interests } = this.data;
    
    // 验证
    if (!destination) {
      showError('请输入目的地');
      return;
    }
    
    if (!startDate) {
      showError('请选择出发日期');
      return;
    }
    
    this.setData({ saving: true });
    showLoading('保存中...');
    
    try {
      const result = await post(`/itinerary/${itineraryId}/update`, {
        destination,
        days,
        budget: {
          total: budget,
          perDay: Math.round(budget / days)
        },
        startDate,
        interests
      });
      
      if (result.success) {
        hideLoading();
        showSuccess('保存成功');
        
        // 返回上一页
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      } else {
        hideLoading();
        showError('保存失败');
      }
    } catch (error) {
      hideLoading();
      console.error('Save itinerary error:', error);
      showError('保存失败');
    } finally {
      this.setData({ saving: false });
    }
  }
});
