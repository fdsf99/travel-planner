// pages/tools/expenses.js
const { showLoading, hideLoading, showSuccess, showError } = require('../../utils/request');

Page({
  data: {
    itineraryId: '',
    budget: 3000,
    expenses: [],
    currentDate: new Date().toISOString().split('T')[0],
    amount: '',
    category: 'food',
    description: '',
    categories: [
      { id: 'transport', name: '交通', icon: '', color: '#2196F3' },
      { id: 'accommodation', name: '住宿', icon: '🏨', color: '#9C27B0' },
      { id: 'food', name: '餐饮', icon: '🍜', color: '#FF9800' },
      { id: 'tickets', name: '门票', icon: '', color: '#4CAF50' },
      { id: 'shopping', name: '购物', icon: '🛍️', color: '#E91E63' },
      { id: 'others', name: '其他', icon: '📦', color: '#607D8B' }
    ],
    viewMode: 'list',
    totalSpent: 0,
    remaining: 0,
    progressPercent: '0.0',
    progressWidth: 0,
    categoryStats: [],
    displayExpenses: [],
    displayBudget: '3000.00',
    displayTotalSpent: '0.00',
    displayRemaining: '3000.00'
  },

  onLoad(options) {
    const { itineraryId, budget } = options;
    if (itineraryId) {
      const safeBudget = Number(budget) || this.data.budget;
      this.setData({ itineraryId, budget: safeBudget });
      this.loadExpenses(itineraryId);
    }
  },

  /**
   * 根据费用列表重新计算所有统计字段,避免三处重复代码
   * @param {Array} expenses - 费用列表
   * @returns {Object} 用于 setData 的部分字段
   */
  recomputeStats(expenses) {
    const budget = this.data.budget;
    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const remaining = budget - totalSpent;
    const remainingOverBudget = remaining < 0;
    const progressPercent = budget > 0 ? (totalSpent / budget * 100).toFixed(1) : '0.0';
    const progressWidth = budget > 0 ? Math.min((totalSpent / budget) * 100, 100) : 0;
    const categoryStats = this.calculateCategoryStats(expenses, totalSpent);
    const displayExpenses = this.processExpensesForDisplay(expenses);

    return {
      expenses: expenses.sort((a, b) => new Date(b.date) - new Date(a.date)),
      totalSpent,
      remaining,
      remainingOverBudget,
      progressPercent,
      progressWidth,
      categoryStats,
      displayExpenses,
      displayBudget: budget.toFixed(2),
      displayTotalSpent: totalSpent.toFixed(2),
      displayRemaining: remaining.toFixed(2)
    };
  },

  // 加载费用记录
  loadExpenses(itineraryId) {
    try {
      const saved = wx.getStorageSync(`expenses_${itineraryId}`);
      if (saved && saved.expenses) {
        this.setData(this.recomputeStats(saved.expenses));
      }
    } catch (error) {
      console.error('Load expenses error:', error);
    }
  },

  // 保存费用记录到本地
  saveExpenses() {
    const { itineraryId, expenses } = this.data;
    if (!itineraryId) return;

    try {
      wx.setStorageSync(`expenses_${itineraryId}`, {
        expenses,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Save expenses error:', error);
    }
  },

  // 输入金额
  onAmountInput(e) {
    this.setData({ amount: e.detail.value });
  },

  // 选择分类
  selectCategory(e) {
    this.setData({ category: e.currentTarget.dataset.category });
  },

  // 输入备注
  onDescriptionInput(e) {
    this.setData({ description: e.detail.value });
  },

  // 选择日期
  onDateChange(e) {
    this.setData({ currentDate: e.detail.value });
  },

  // 添加费用
  addExpense() {
    const { amount, category, description, currentDate, expenses } = this.data;
    const parsedAmount = parseFloat(amount);

    if (!amount || parsedAmount <= 0) {
      showError('请输入有效金额');
      return;
    }

    const newExpense = {
      id: Date.now(),
      amount: parsedAmount,
      category,
      description: description || '',
      date: currentDate,
      createdAt: new Date().toISOString()
    };

    const updatedExpenses = [newExpense, ...expenses];
    this.setData(this.recomputeStats(updatedExpenses));
    this.setData({ amount: '', description: '' });

    this.saveExpenses();
    showSuccess('添加成功');

    // 检查预算
    const remaining = this.data.budget - this.data.totalSpent;
    if (remaining < 0) {
      wx.showModal({
        title: '预算提醒',
        content: `已超出预算 ${Math.abs(remaining)} 元`,
        showCancel: false
      });
    } else if (remaining < this.data.budget * 0.1) {
      wx.showModal({
        title: '预算提醒',
        content: `预算即将用完，剩余 ${remaining.toFixed(2)} 元`,
        showCancel: false
      });
    }
  },

  // 删除费用
  deleteExpense(e) {
    const id = e.currentTarget.dataset.id;

    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条记录吗?',
      success: (res) => {
        if (res.confirm) {
          const expenses = this.data.expenses.filter(exp => exp.id !== id);
          this.setData(this.recomputeStats(expenses));
          this.saveExpenses();
          showSuccess('已删除');
        }
      }
    });
  },

  // 切换视图模式
  toggleViewMode() {
    this.setData({
      viewMode: this.data.viewMode === 'list' ? 'chart' : 'list',
      categoryStats: this.calculateCategoryStats(this.data.expenses, this.data.totalSpent)
    });
  },

  // 处理费用列表用于显示
  processExpensesForDisplay(expenses) {
    const { categories } = this.data;

    return expenses.map(exp => {
      const category = categories.find(c => c.id === exp.category);
      return {
        ...exp,
        categoryColor: category ? category.color : '#999',
        categoryIcon: category ? category.icon : '📦',
        categoryName: category ? category.name : '其他',
        displayAmount: exp.amount.toFixed(2)
      };
    });
  },

  // 计算分类统计
  calculateCategoryStats(expenses, totalSpent) {
    const { categories } = this.data;
    const stats = {};

    categories.forEach(cat => {
      stats[cat.id] = { ...cat, amount: 0, percentage: 0, displayAmount: '0.00' };
    });

    expenses.forEach(exp => {
      if (stats[exp.category]) {
        stats[exp.category].amount += exp.amount;
      }
    });

    Object.keys(stats).forEach(key => {
      if (totalSpent > 0) {
        stats[key].percentage = Math.round((stats[key].amount / totalSpent) * 100);
      }
      stats[key].displayAmount = stats[key].amount.toFixed(2);
    });

    return Object.values(stats).filter(stat => stat.amount > 0);
  },

  // 返回
  goBack() {
    wx.navigateBack();
  }
});
