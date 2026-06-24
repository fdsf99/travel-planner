/**
 * 获取 API 基础路径(延迟调用,避免模块加载时 getApp() 未就绪)
 */
function getApiBaseUrl() {
  const app = getApp();
  return (app && app.globalData && app.globalData.apiBaseUrl) || '';
}

/**
 * 封装网络请求
 */
function request(options) {
  return new Promise((resolve, reject) => {
    const {
      url,
      method = 'GET',
      data = {},
      header = {}
    } = options;

    wx.request({
      url: `${getApiBaseUrl()}${url}`,
      method,
      data,
      header: {
        'Content-Type': 'application/json',
        ...header
      },
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data);
        } else {
          reject(new Error(`Request failed with status ${res.statusCode}`));
        }
      },
      fail: (err) => {
        console.error('Request failed:', err);
        reject(err);
      }
    });
  });
}

/**
 * GET请求
 */
function get(url, data = {}) {
  return request({
    url,
    method: 'GET',
    data
  });
}

/**
 * POST请求
 */
function post(url, data = {}) {
  return request({
    url,
    method: 'POST',
    data
  });
}

/**
 * 显示加载提示
 */
function showLoading(title = '加载中...') {
  wx.showLoading({
    title,
    mask: true
  });
}

/**
 * 隐藏加载提示
 */
function hideLoading() {
  wx.hideLoading();
}

/**
 * 显示成功提示
 */
function showSuccess(title = '操作成功') {
  wx.showToast({
    title,
    icon: 'success',
    duration: 2000
  });
}

/**
 * 显示错误提示
 */
function showError(title = '操作失败') {
  wx.showToast({
    title,
    icon: 'none',
    duration: 2000
  });
}

/**
 * 显示确认对话框
 */
function showModal(options = {}) {
  return new Promise((resolve) => {
    wx.showModal({
      title: options.title || '提示',
      content: options.content || '',
      showCancel: options.showCancel !== false,
      cancelText: options.cancelText || '取消',
      confirmText: options.confirmText || '确定',
      confirmColor: options.confirmColor || '#576B95',
      success: (res) => {
        resolve(res);
      },
      fail: () => {
        resolve({ confirm: false });
      }
    });
  });
}

module.exports = {
  request,
  get,
  post,
  showLoading,
  hideLoading,
  showSuccess,
  showError,
  showModal
};
