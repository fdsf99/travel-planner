/**
 * 行程详情页
 */
(function initDetailPage() {
  const id = getQueryParam('id');
  if (!id) {
    showMsg(document.getElementById('statusMsg'), '缺少行程 ID', 'error');
    document.getElementById('loading').style.display = 'none';
    return;
  }
  loadItinerary(id);
})();

let currentDay = 0;

async function loadItinerary(id) {
  const loading = document.getElementById('loading');
  const view = document.getElementById('itineraryView');
  const statusEl = document.getElementById('statusMsg');

  // 优先从 sessionStorage 读取(临时ID或后端不可达时的兜底)
  try {
    const cached = sessionStorage.getItem(`itinerary_${id}`);
    if (cached) {
      const itinerary = JSON.parse(cached);
      renderItinerary({ ...itinerary, id });
      loading.style.display = 'none';
      view.style.display = '';
      // 临时ID不查询后端
      if (typeof id === 'string' && id.startsWith('local_')) return;
    }
  } catch (cacheErr) { /* 缓存读取失败,继续走API */ }

  try {
    const result = await api(`/api/itinerary/${id}`);
    if (!result.success || !result.itinerary) {
      showMsg(statusEl, '加载失败', 'error');
      loading.style.display = 'none';
      return;
    }
    renderItinerary(result.itinerary);
    loading.style.display = 'none';
    view.style.display = '';
  } catch (err) {
    showMsg(statusEl, '加载失败: ' + err.message, 'error');
    loading.style.display = 'none';
  }
}

function renderItinerary(itinerary) {
  document.getElementById('destTitle').textContent = itinerary.destination_city || '行程详情';
  const budget = itinerary.budget ? itinerary.budget.total : null;
  document.getElementById('metaInfo').innerHTML = `
    <span>🗓 ${itinerary.days || 0} 天</span>
    <span>💰 预算 ${budget || '—'} 元</span>
    <span>📍 ${formatDate(itinerary.start_date)} ~ ${formatDate(itinerary.end_date)}</span>`;

  // 兼容 daily_plans / dailyPlans
  const dailyPlans = itinerary.daily_plans || itinerary.dailyPlans || [];
  window._dailyPlans = dailyPlans;

  // 渲染日期标签
  const tabs = document.getElementById('dayTabs');
  tabs.innerHTML = dailyPlans.map((p, i) => `
    <button class="day-tab ${i === 0 ? 'active' : ''}" data-idx="${i}">Day ${p.day || i + 1}</button>
  `).join('');
  tabs.querySelectorAll('.day-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      tabs.querySelectorAll('.day-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentDay = parseInt(btn.dataset.idx, 10);
      renderDay(currentDay);
    });
  });

  if (dailyPlans.length > 0) renderDay(0);
}

function renderDay(idx) {
  const plan = window._dailyPlans[idx];
  const wrap = document.getElementById('dayPlan');
  if (!plan) { wrap.innerHTML = '<p>当日无安排</p>'; return; }

  const activities = plan.activities || [];
  const activityHtml = activities.length === 0
    ? '<p class="empty">暂无活动安排</p>'
    : activities.map((a, i) => `
      <div class="activity">
        <div class="activity-time">${a.startTime || ''} - ${a.endTime || ''}</div>
        <div class="activity-body">
          <div class="activity-title">${escapeHtml(a.attractionName || '活动 ' + (i + 1))}
            <span class="activity-type">${escapeHtml(a.activityType || '')}</span>
          </div>
          ${a.description ? `<div class="activity-desc">${escapeHtml(a.description)}</div>` : ''}
          ${a.estimatedCost ? `<div class="activity-cost">预计花费 ¥${a.estimatedCost}</div>` : ''}
          ${a.tips ? `<div class="activity-tips">💡 ${escapeHtml(a.tips)}</div>` : ''}
        </div>
      </div>`).join('');

  wrap.innerHTML = `
    <h2>Day ${plan.day || idx + 1} ${plan.theme ? '· ' + escapeHtml(plan.theme) : ''}</h2>
    <p class="day-date">${formatDate(plan.date) || ''}</p>
    <div class="timeline">${activityHtml}</div>`;
}
