// pages/profile/profile.js
const { showError } = require('../../utils/request');

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
    try {
      // TODO: 从API获取用户的行程列表和统计数据
      // 暂时使用模拟数据
      this.setData({
        stats: {
          itineraryCount: 0,
          favoriteCount: 0,
          viewCount: 0
        },
        myItineraries: []
      });
    } catch (error) {
      console.error('Load user data error:', error);
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
      title: '关于',
      content: '智能旅游规划助手 v1.0\n\n使用AI技术为您定制个性化旅行行程',
      showCancel: false
    });
  }
});
