// pages/index/index.js
const { post, showLoading, hideLoading, showSuccess, showError } = require('../../utils/request');

Page({
  data: {
    destination: '',
    days: 3,
    budget: '',
    startDate: '',
    interestOptions: ['文化', '自然', '美食', '购物', '亲子', '历史', '艺术'],
    selectedInterests: [],
    generating: false,
    canSubmit: false,
    recentItineraries: []
  },

  onLoad() {
    // 加载最近行程
    this.loadRecentItineraries();
  },

  // 目的地输入
  onDestinationInput(e) {
    this.setData({
      destination: e.detail.value
    });
    this.checkCanSubmit();
  },

  // 天数改变
  onDaysChange(e) {
    this.setData({
      days: e.detail.value
    });
  },

  // 预算输入
  onBudgetInput(e) {
    this.setData({
      budget: e.detail.value
    });
  },

  // 日期选择
  onDateChange(e) {
    this.setData({
      startDate: e.detail.value
    });
    this.checkCanSubmit();
  },

  // 标签点击
  onTagTap(e) {
    const tag = e.currentTarget.dataset.tag;
    const selectedInterests = [...this.data.selectedInterests];
    
    const index = selectedInterests.indexOf(tag);
    if (index > -1) {
      selectedInterests.splice(index, 1);
    } else {
      selectedInterests.push(tag);
    }
    
    this.setData({
      selectedInterests
    });
  },

  // 检查是否可以提交
  checkCanSubmit() {
    const { destination, startDate } = this.data;
    const canSubmit = destination.trim() !== '' && startDate !== '';
    this.setData({ canSubmit });
  },

  // 生成行程
  async generateItinerary() {
    const { destination, days, budget, startDate, selectedInterests } = this.data;

    if (!destination || !startDate) {
      showError('请填写完整信息');
      return;
    }

    this.setData({ generating: true });
    showLoading('AI正在为您规划行程...');

    try {
      const result = await post('/itinerary/generate', {
        destination,
        days: parseInt(days),
        budget: budget ? parseInt(budget) : 5000,
        interests: selectedInterests,
        startDate
      });

      hideLoading();
      showSuccess('行程生成成功!');

      // 跳转到行程详情页
      wx.navigateTo({
        url: `/pages/itinerary/detail?id=${result.itineraryId}`
      });

    } catch (error) {
      hideLoading();
      console.error('Generate itinerary error:', error);
      showError('生成失败,请重试');
    } finally {
      this.setData({ generating: false });
    }
  },

  // 加载最近行程
  async loadRecentItineraries() {
    // TODO: 从API获取用户的历史行程
    // 暂时使用模拟数据
    this.setData({
      recentItineraries: []
    });
  },

  // 查看行程详情
  viewItinerary(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/itinerary/detail?id=${id}`
    });
  }
});
