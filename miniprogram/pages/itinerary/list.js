// pages/itinerary/list.js
const { get, post, showLoading, hideLoading, showSuccess, showError, showModal } = require('../../utils/request');

Page({
  data: {
    userId: 'demo-user-001', // 演示用户ID,实际应从登录状态获取
    itineraries: [],
    page: 1,
    limit: 10,
    hasMore: true,
    loading: false,
    isEmpty: false
  },

  onLoad() {
    // 首次加载由 onShow 统一触发,避免重复请求
  },

  onShow() {
    // 每次显示页面时刷新数据
    this.refreshData();
  },

  // 加载行程列表
  async loadItineraries(isRefresh = false) {
    if (this.data.loading) return;
    
    this.setData({ loading: true });
    
    try {
      const { userId, page, limit } = this.data;
      const currentPage = isRefresh ? 1 : page;
      
      const result = await get(`/itinerary/user/${userId}`, {
        page: currentPage,
        limit: limit
      });
      
      if (result.success) {
        const newItineraries = result.itineraries || [];
        
        this.setData({
          itineraries: isRefresh ? newItineraries : [...this.data.itineraries, ...newItineraries],
          page: currentPage + 1,
          hasMore: newItineraries.length >= limit,
          isEmpty: isRefresh && newItineraries.length === 0,
          loading: false
        });
      } else {
        this.setData({ loading: false, isEmpty: true });
      }
    } catch (error) {
      console.error('Load itineraries error:', error);
      this.setData({ loading: false });
      showError('加载失败');
    }
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.refreshData();
  },

  // 刷新数据
  refreshData() {
    this.setData({ page: 1, hasMore: true });
    this.loadItineraries(true).then(() => {
      wx.stopPullDownRefresh();
    });
  },

  // 上拉加载更多
  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadItineraries();
    }
  },

  // 点击行程卡片
  navigateToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/itinerary/detail?id=${id}`
    });
  },

  // 删除行程
  async deleteItinerary(e) {
    const id = e.currentTarget.dataset.id;
    const name = e.currentTarget.dataset.name;
    
    showModal({
      title: '确认删除',
      content: `确定要删除"${name}"吗?此操作不可恢复。`,
      confirmText: '删除',
      confirmColor: '#ff4d4f'
    }).then(async (res) => {
      if (res.confirm) {
        await this.confirmDelete(id);
      }
    }).catch(() => {});
  },

  // 确认删除
  async confirmDelete(id) {
    showLoading('删除中...');
    
    try {
      const result = await post(`/itinerary/${id}/delete`);
      
      if (result.success) {
        hideLoading();
        showSuccess('删除成功');
        
        // 从列表中移除
        const itineraries = this.data.itineraries.filter(item => item.id !== id);
        this.setData({ itineraries });
        
        if (itineraries.length === 0) {
          this.setData({ isEmpty: true });
        }
      } else {
        hideLoading();
        showError('删除失败');
      }
    } catch (error) {
      hideLoading();
      console.error('Delete itinerary error:', error);
      showError('删除失败');
    }
  },

  // 生成新行程
  createNewItinerary() {
    wx.switchTab({
      url: '/pages/index/index'
    });
  }
});
