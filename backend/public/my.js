/**
 * 我的行程列表页
 */
(function initMyPage() {
  const userId = 'demo-user-001';
  const list = document.getElementById('list');
  const loading = document.getElementById('loading');

  api(`/api/itinerary/user/${userId}?page=1&limit=50`)
    .then(result => {
      loading.style.display = 'none';
      const items = (result && result.itineraries) || [];
      if (items.length === 0) {
        list.innerHTML = '<li class="card empty-state">还没有行程,去首页生成一个吧~</li>';
        return;
      }
      list.innerHTML = items.map(it => `
        <li class="card itinerary-item">
          <a href="/detail.html?id=${it.id}" class="it-link">
            <div class="it-main">
              <strong class="it-dest">${escapeHtml(it.destination_city || '未命名行程')}</strong>
              <span class="it-days">${it.days || 0} 天</span>
            </div>
            <div class="it-meta">
              <span>📅 ${formatDate(it.start_date)} ~ ${formatDate(it.end_date)}</span>
              <span>💰 ${it.budget && it.budget.total ? it.budget.total + ' 元' : '—'}</span>
            </div>
          </a>
        </li>
      `).join('');
    })
    .catch(err => {
      loading.style.display = 'none';
      showMsg(document.getElementById('statusMsg'), '加载失败: ' + err.message, 'error');
    });
})();
