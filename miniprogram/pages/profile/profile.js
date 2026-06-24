// pages/profile/profile.js
const { get, showError, showLoading, hideLoading } = require('../../utils/request');

Page({
  data: {
    userInfo: null,
    stats: {
      itineraryCount: 0,
      favoriteCount: 0,
      viewCount: 0
    },
    myItineraries: []
  },

  onLoad() {
    // 检查登录状态
    this.checkLoginStatus();
  },

  onShow() {
    // 每次显示时刷新数据
    if (this.data.userInfo) {
      this.loadUserData();
    }
  },

  // 检查登录状态
  checkLoginStatus() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({ userInfo });
      this.loadUserData();
    }
  },

  // 微信登录
  login() {
    wx.login({
      success: (res) => {
        if (res.code) {
          // TODO: 调用后端接口换取openid
          console.log('Login code:', res.code);
          
          // 模拟登录成功
          this.setData({
            userInfo: {
              nickname: '游客',
              avatar: '/images/default-avatar.png'
            }
          });
          
          wx.setStorageSync('userInfo', this.data.userInfo);
        }
      },
      fail: () => {
        showError('登录失败');
      }
    });
  },

  // 加载用户数据
  async loadUserData() {
    showLoading('加载中...');
    
    try {
      const userId = 'demo-user-001';
      const result = await get(`/itinerary/user/${userId}`, {
        page: 1,
        limit: 10
      });

      if (result.success) {
        const itineraries = result.itineraries || [];
        
        this.setData({
          stats: {
            itineraryCount: itineraries.length,
            favoriteCount: 0,
            viewCount: 0
          },
          myItineraries: itineraries.map(item => ({
            id: item.id,
            destination: item.destination_city,
            days: item.days,
            startDate: item.start_date,
            status: item.status || 'draft'
          }))
        });
      } else {
        this.setData({
          stats: {
            itineraryCount: 0,
            favoriteCount: 0,
            viewCount: 0
          },
          myItineraries: []
        });
      }
    } catch (error) {
      console.error('Load user data error:', error);
      this.setData({
        stats: {
          itineraryCount: 0,
          favoriteCount: 0,
          viewCount: 0
        },
        myItineraries: []
      });
    } finally {
      hideLoading();
    }
  },

  // 查看行程详情
  viewItinerary(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/itinerary/detail?id=${id}`
    });
  },

  // 清除缓存
  clearCache() {
    wx.showModal({
      title: '提示',
      content: '确定要清除缓存吗?',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorageSync();
          this.setData({
            userInfo: null,
            myItineraries: [],
            stats: {
              itineraryCount: 0,
              favoriteCount: 0,
              viewCount: 0
            }
          });
          wx.showToast({
            title: '清除成功',
            icon: 'success'
          });
        }
      }
    });
  },

  // 显示关于
  showAbout() {
    wx.showModal({
      title: '关于 · 智能旅游规划助手',
      content: '版本: v1.0.0\n\n' +
        '一款基于AI的旅游行程规划工具。\n\n' +
        '主要功能:\n' +
        '· AI智能生成个性化旅行行程\n' +
        '· 景点推荐与地图路线展示\n' +
        '· 旅行费用记账与预算管理\n' +
        '· 行李清单管理\n' +
        '· 目的地天气查询\n\n' +
        'Web版: https://travel-planner-tau-wheat.vercel.app',
      showCancel: false,
      confirmText: '我知道了'
    });
  }
});
