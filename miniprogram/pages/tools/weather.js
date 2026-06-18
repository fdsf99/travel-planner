// pages/tools/weather.js
const { showError } = require('../../utils/request');

Page({
  data: {
    city: '',
    weatherData: null,
    loading: false,
    searchCity: ''
  },

  onLoad(options) {
    const { destination } = options;
    if (destination) {
      this.setData({ city: destination });
      this.loadWeather(destination);
    } else {
      // 默认显示北京天气
      this.setData({ city: '北京' });
      this.loadWeather('北京');
    }
  },

  // 加载天气数据(使用和风天气API或模拟数据)
  async loadWeather(city) {
    this.setData({ loading: true });
    
    try {
      // 由于需要和风天气API Key,这里先使用模拟数据
      // 实际使用时可以注册和风天气免费API: https://dev.qweather.com/
      const mockData = this.generateMockWeather(city);
      
      this.setData({
        weatherData: mockData,
        loading: false
      });
    } catch (error) {
      console.error('Load weather error:', error);
      showError('获取天气失败');
      this.setData({ loading: false });
    }
  },

  // 生成模拟天气数据(实际应调用真实API)
  generateMockWeather(city) {
    const today = new Date();
    const forecasts = [];
    
    // 生成7天预报
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const weathers = ['晴', '多云', '阴', '小雨', '中雨', '大雨', '雷阵雨'];
      const weatherIndex = Math.floor(Math.random() * weathers.length);
      
      const baseTemp = 20 + Math.random() * 10;
      const highTemp = Math.round(baseTemp + 5 + Math.random() * 5);
      const lowTemp = Math.round(baseTemp - 5 - Math.random() * 5);
      
      forecasts.push({
        date: this.formatDate(date),
        weekday: this.getWeekday(date),
        weather: weathers[weatherIndex],
        high: highTemp,
        low: lowTemp,
        wind: `${['东', '南', '西', '北'][Math.floor(Math.random() * 4)]}风${Math.floor(Math.random() * 5) + 1}级`,
        humidity: Math.round(50 + Math.random() * 30)
      });
    }

    const current = forecasts[0];
    
    // 穿衣建议
    let clothingAdvice = '';
    if (current.high > 30) {
      clothingAdvice = '天气炎热,建议穿短袖、短裤,注意防晒';
    } else if (current.high > 25) {
      clothingAdvice = '天气温暖,建议穿薄长袖或短袖';
    } else if (current.high > 15) {
      clothingAdvice = '天气凉爽,建议穿长袖衬衫加薄外套';
    } else {
      clothingAdvice = '天气较冷,建议穿厚外套或毛衣';
    }

    return {
      city,
      current,
      forecasts,
      clothingAdvice,
      updateTime: new Date().toLocaleString('zh-CN')
    };
  },

  // 格式化日期
  formatDate(date) {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}月${day}日`;
  },

  // 获取星期
  getWeekday(date) {
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return weekdays[date.getDay()];
  },

  // 搜索城市
  onSearchInput(e) {
    this.setData({ searchCity: e.detail.value });
  },

  // 执行搜索
  handleSearch() {
    const { searchCity } = this.data;
    if (!searchCity.trim()) {
      showError('请输入城市名称');
      return;
    }

    this.setData({ city: searchCity.trim() });
    this.loadWeather(searchCity.trim());
  },

  // 刷新天气
  refreshWeather() {
    this.loadWeather(this.data.city);
  },

  // 返回
  goBack() {
    wx.navigateBack();
  }
});
