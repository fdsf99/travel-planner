/**
 * 我的行程列表页
 */
(function initMyPage() {
  const userId = 'demo-user-001';
  const list = document.getElementById('list');
  const loading = document.getElementById('loading');
  const statusMsg = document.getElementById('statusMsg');

  function renderEmpty() {
    loading.style.display = 'none';
    list.innerHTML = `
      <li class="card empty-state">
        <p>🗺️ 还没有行程</p>
        <p class="empty-sub">去首页生成一个 AI 行程吧~</p>
        <button class="btn-primary" style="max-width:200px;margin:16px auto 0;" onclick="window.location.href='/'">去生成</button>
      </li>`;
  }

  function renderList(items) {
    loading.style.display = 'none';
    list.innerHTML = items.map(it => {
      const budget = it.budget && it.budget.total ? it.budget.total.toLocaleString() + ' 元' : '—';
      return `
      <li class="card itinerary-item">
        <a href="/detail.html?id=${it.id}" class="it-link">
          <div class="it-main">
            <strong class="it-dest">${escapeHtml(it.destination_city || '未命名行程')}</strong>
            <span class="it-days">${it.days || 0} 天</span>
          </div>
          <div class="it-meta">
            <span>📅 ${formatDate(it.start_date)} ~ ${formatDate(it.end_date)}</span>
            <span>💰 ${budget}</span>
            <span class="it-status">${escapeHtml(it.status === 'draft' ? '草稿' : (it.status || ''))}</span>
          </div>
        </a>
      </li>`;
    }).join('');
  }

  api(`/api/itinerary/user/${userId}?page=1&limit=50`)
    .then(result => {
      const items = (result && result.itineraries) || [];
      if (items.length === 0) {
        renderEmpty();
      } else {
        renderList(items);
      }
    })
    .catch(err => {
      loading.style.display = 'none';
      list.innerHTML = `
        <li class="card empty-state">
          <p class="error-text">加载失败: ${escapeHtml(err.message)}</p>
          <button class="btn-outline" style="margin-top:12px;" onclick="location.reload()">重试</button>
        </li>`;
    });
})();
