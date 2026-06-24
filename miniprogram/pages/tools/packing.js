// pages/tools/packing.js
const { showSuccess, showError } = require('../../utils/request');

Page({
  data: {
    itineraryId: '',
    categories: [
      { id: 'documents', name: '证件票据', icon: '📄', items: [], itemCount: 0 },
      { id: 'clothes', name: '衣物鞋帽', icon: '👕', items: [], itemCount: 0 },
      { id: 'toiletries', name: '洗漱用品', icon: '🧴', items: [], itemCount: 0 },
      { id: 'electronics', name: '电子产品', icon: '📱', items: [], itemCount: 0 },
      { id: 'medicine', name: '常用药品', icon: '💊', items: [], itemCount: 0 },
      { id: 'others', name: '其他物品', icon: '🎒', items: [], itemCount: 0 }
    ],
    templates: {
      summer: ['短袖T恤', '短裤', '凉鞋', '防晒霜', '太阳镜', '遮阳帽'],
      winter: ['羽绒服', '毛衣', '保暖内衣', '围巾', '手套', '暖宝宝'],
      beach: ['泳衣', '沙滩裤', '拖鞋', '防水袋', '防晒霜', '墨镜'],
      mountain: ['登山鞋', '冲锋衣', '登山杖', '防晒帽', '防蚊液', '急救包']
    },
    currentTemplate: null,
    newItemName: '',
    selectedCategory: 'others',
    progressChecked: 0,
    progressTotal: 0,
    progressPercentage: 0,
    templateOptions: [
      { key: 'summer', name: '夏季出行', icon: '☀️' },
      { key: 'winter', name: '冬季出行', icon: '❄️' },
      { key: 'beach', name: '海边度假', icon: '🏖️' },
      { key: 'mountain', name: '登山徒步', icon: '⛰️' }
    ]
  },

  onLoad(options) {
    const { itineraryId } = options;
    if (itineraryId) {
      this.setData({ itineraryId });
      this.loadPackingList(itineraryId);
    } else {
      // 使用默认模板
      this.applyTemplate('summer');
    }
  },

  // 加载行李清单
  loadPackingList(itineraryId) {
    try {
      const saved = wx.getStorageSync(`packing_${itineraryId}`);
      if (saved && saved.categories) {
        this.setData({ categories: saved.categories });
      }
    } catch (error) {
      console.error('Load packing list error:', error);
    }
  },

  // 保存行李清单
  savePackingList() {
    const { itineraryId, categories } = this.data;
    if (!itineraryId) return;

    try {
      wx.setStorageSync(`packing_${itineraryId}`, {
        categories,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Save packing list error:', error);
    }
  },

  // 应用模板
  applyTemplate(templateName) {
    const templateItems = this.data.templates[templateName];
    if (!templateItems) return;

    // 使用递增整数 id,避免浮点数精度问题
    let nextId = Date.now();

    const categories = this.data.categories.map(cat => {
      if (cat.id === 'clothes') {
        return {
          ...cat,
          items: templateItems.map(name => ({
            id: nextId++,
            name,
            checked: false
          }))
        };
      }
      return cat;
    });

    this.setData({
      categories,
      currentTemplate: templateName
    });

    this.updateProgress();
    this.savePackingList();
    showSuccess('已应用模板');
  },

  // 选择模板
  handleTemplateChange(e) {
    const template = e.currentTarget.dataset.template;
    this.applyTemplate(template);
  },

  // 切换物品状态
  toggleItem(e) {
    const { categoryId, itemId } = e.currentTarget.dataset;
    
    const categories = this.data.categories.map(cat => {
      if (cat.id === categoryId) {
        const items = cat.items.map(item => {
          if (item.id === itemId) {
            return { ...item, checked: !item.checked };
          }
          return item;
        });
        return { ...cat, items };
      }
      return cat;
    });

    this.setData({ categories });
    this.updateProgress();
    this.savePackingList();
  },

  // 删除物品
  deleteItem(e) {
    const { categoryId, itemId } = e.currentTarget.dataset;
    
    const categories = this.data.categories.map(cat => {
      if (cat.id === categoryId) {
        const items = cat.items.filter(item => item.id !== itemId);
        return { ...cat, items };
      }
      return cat;
    });

    this.setData({ categories });
    this.updateProgress();
    this.savePackingList();
    showSuccess('已删除');
  },

  // 输入新物品名称
  onNewItemInput(e) {
    this.setData({ newItemName: e.detail.value });
  },

  // 选择分类
  selectCategory(e) {
    this.setData({ selectedCategory: e.currentTarget.dataset.category });
  },

  // 添加新物品
  addNewItem() {
    const { newItemName, selectedCategory, categories } = this.data;
    
    if (!newItemName.trim()) {
      showError('请输入物品名称');
      return;
    }

    const categoriesUpdated = categories.map(cat => {
      if (cat.id === selectedCategory) {
        return {
          ...cat,
          items: [
            ...cat.items,
            {
              id: Date.now(),
              name: newItemName.trim(),
              checked: false
            }
          ]
        };
      }
      return cat;
    });

    this.setData({
      categories: categoriesUpdated,
      newItemName: ''
    });

    this.updateProgress();
    this.savePackingList();
    showSuccess('添加成功');
  },

  // 更新进度
  updateProgress() {
    const { categories } = this.data;
    let total = 0;
    let checked = 0;

    categories.forEach(cat => {
      cat.items.forEach(item => {
        total++;
        if (item.checked) checked++;
      });
    });

    const percentage = total > 0 ? Math.round((checked / total) * 100) : 0;
    
    const categoriesWithCount = categories.map(cat => ({
      ...cat,
      itemCount: cat.items.length
    }));

    this.setData({
      progressChecked: checked,
      progressTotal: total,
      progressPercentage: percentage,
      categories: categoriesWithCount
    });
  },

  // 返回
  goBack() {
    wx.navigateBack();
  }
});
