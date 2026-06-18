/**
 * 管理后台
 */
(function initAdminPage() {
  if (!getToken()) {
    window.location.href = '/login.html';
    return;
  }

  document.getElementById('logoutBtn').addEventListener('click', (e) => {
    e.preventDefault();
    clearToken();
    window.location.href = '/login.html';
  });

  // 校验 token + 获取用户信息
  api('/api/auth/check').then(result => {
    document.getElementById('userInfo').textContent = `当前用户: ${result.user.username}`;
  }).catch(() => {
    clearToken();
    window.location.href = '/login.html';
    return;
  });

  loadItineraries();
})();

async function loadItineraries() {
  const loading = document.getElementById('loading');
  const list = document.getElementById('list');
  const stats = document.getElementById('stats');
  const statusMsg = document.getElementById('statusMsg');

  try {
    const result = await api('/api/itinerary/user/demo-user-001?page=1&limit=100');
    const items = (result && result.itineraries) || [];

    // 统计
    const totalBudget = items.reduce((s, it) => s + (it.budget && it.budget.total ? it.budget.total : 0), 0);
    const totalDays = items.reduce((s, it) => s + (it.days || 0), 0);
    stats.innerHTML = `
      <div class="stat-card"><div class="stat-num">${items.length}</div><div class="stat-label">行程总数</div></div>
      <div class="stat-card"><div class="stat-num">${totalDays}</div><div class="stat-label">总天数</div></div>
      <div class="stat-card"><div class="stat-num">¥${totalBudget.toLocaleString()}</div><div class="stat-label">总预算</div></div>`;

    loading.style.display = 'none';
    if (items.length === 0) {
      list.innerHTML = '<li class="card empty-state">暂无行程数据</li>';
      return;
    }

    list.innerHTML = items.map(it => `
      <li class="card itinerary-item admin-item">
        <a href="/detail.html?id=${it.id}" class="it-link">
          <div class="it-main">
            <strong class="it-dest">${escapeHtml(it.destination_city || '未命名')}</strong>
            <span class="it-days">${it.days || 0} 天</span>
          </div>
          <div class="it-meta">
            <span>📅 ${formatDate(it.start_date)}</span>
            <span>💰 ${it.budget && it.budget.total ? it.budget.total + '元' : '—'}</span>
            <span class="it-status">${escapeHtml(it.status || '')}</span>
          </div>
        </a>
        <button class="btn-danger btn-sm" data-id="${it.id}" data-name="${escapeHtml(it.destination_city || '')}">删除</button>
      </li>
    `).join('');

    // 绑定删除
    list.querySelectorAll('.btn-danger').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const name = btn.dataset.name;
        if (!confirm(`确定删除"${name}"?此操作不可恢复。`)) return;
        try {
          await api(`/api/itinerary/${id}/delete`, { method: 'POST' });
          showMsg(statusMsg, '删除成功', 'success');
          loadItineraries();
        } catch (err) {
          showMsg(statusMsg, '删除失败: ' + err.message, 'error');
        }
      });
    });
  } catch (err) {
    loading.style.display = 'none';
    showMsg(statusMsg, '加载失败: ' + err.message, 'error');
  }
}
