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
  let rendered = false;
  try {
    const cached = sessionStorage.getItem(`itinerary_${id}`);
    if (cached) {
      const itinerary = JSON.parse(cached);
      renderItinerary({ ...itinerary, id });
      loading.style.display = 'none';
      view.style.display = '';
      rendered = true;
      // 临时ID不再查询后端
      if (typeof id === 'string' && id.startsWith('local_')) return;
    }
  } catch (cacheErr) { /* 缓存读取失败,继续走API */ }

  try {
    const result = await api(`/api/itinerary/${id}`);
    if (!result.success || !result.itinerary) {
      if (!rendered) {
        showMsg(statusEl, '加载失败: 行程不存在或已被删除', 'error');
        loading.style.display = 'none';
      }
      return;
    }
    renderItinerary(result.itinerary);
    // 用后端返回的完整数据覆盖缓存
    try {
      sessionStorage.setItem(`itinerary_${id}`, JSON.stringify(result.itinerary));
    } catch (e) { /* ignore */ }
    loading.style.display = 'none';
    view.style.display = '';
  } catch (err) {
    if (!rendered) {
      showMsg(statusEl, '加载失败: ' + err.message, 'error');
      loading.style.display = 'none';
    }
  }
}

function renderItinerary(itinerary) {
  document.getElementById('destTitle').textContent = itinerary.destination_city || '行程详情';
  const budget = itinerary.budget ? itinerary.budget.total : null;

  // 概览区: 天数 + 预算 + 总花费 + 景点数
  renderOverview(itinerary);

  // meta info
  document.getElementById('metaInfo').innerHTML = `
    <span>🗓 ${itinerary.days || 0} 天</span>
    <span>💰 预算 ${budget != null ? budget.toLocaleString() : '—'} 元</span>
    <span>📅 ${formatDate(itinerary.start_date)} ~ ${formatDate(itinerary.end_date)}</span>
    ${itinerary.interests && itinerary.interests.length ? `<span>🏷 ${escapeHtml(itinerary.interests.join(' / '))}</span>` : ''}`;

  // 兼容 daily_plans / dailyPlans
  const dailyPlans = itinerary.daily_plans || itinerary.dailyPlans || [];
  window._dailyPlans = dailyPlans;

  // 渲染日期标签
  const tabs = document.getElementById('dayTabs');
  if (dailyPlans.length === 0) {
    tabs.innerHTML = '';
    document.getElementById('dayPlan').innerHTML = '<p class="empty">AI 未能生成行程,请稍后重试</p>';
    return;
  }
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
  renderDay(0);

  // 行李清单 + 旅行提示
  renderExtras(itinerary);
}

/** 概览统计卡片 */
function renderOverview(itinerary) {
  const grid = document.getElementById('overviewGrid');
  const dailyPlans = itinerary.daily_plans || itinerary.dailyPlans || [];
  // 计算实际总花费
  const totalCost = dailyPlans.reduce((sum, day) =>
    sum + (day.activities || []).reduce((s, a) => s + (Number(a.estimatedCost) || 0), 0), 0);
  // 景点数(去重)
  const attractionSet = new Set();
  dailyPlans.forEach(day => (day.activities || []).forEach(a => {
    if (a.attractionId) attractionSet.add(a.attractionId);
    else if (a.attractionName) attractionSet.add(a.attractionName);
  }));
  const budgetTotal = itinerary.budget ? itinerary.budget.total : null;
  // 预算使用率
  const usage = (budgetTotal && totalCost) ? Math.round(totalCost / budgetTotal * 100) : null;

  grid.innerHTML = `
    <div class="ov-card"><div class="ov-num">${itinerary.days || 0}</div><div class="ov-label">总天数</div></div>
    <div class="ov-card"><div class="ov-num">${attractionSet.size}</div><div class="ov-label">安排景点</div></div>
    <div class="ov-card"><div class="ov-num">¥${totalCost.toLocaleString()}</div><div class="ov-label">预计总花费</div></div>
    <div class="ov-card"><div class="ov-num">${usage != null ? usage + '%' : '—'}</div><div class="ov-label">预算使用${usage != null ? (usage > 100 ? '⚠️' : '✓') : ''}</div></div>`;
}

/** 渲染行李清单和旅行提示 */
function renderExtras(itinerary) {
  // 行李清单
  const packing = itinerary.packingList || itinerary.packing_list || [];
  const packingCard = document.getElementById('packingCard');
  const packingEl = document.getElementById('packingList');
  if (Array.isArray(packing) && packing.length > 0) {
    packingEl.innerHTML = packing.map(item => `<span class="packing-tag">${escapeHtml(item)}</span>`).join('');
    packingCard.style.display = '';
  } else {
    packingCard.style.display = 'none';
  }

  // 旅行提示
  const tips = itinerary.travelTips || itinerary.travel_tips || [];
  const tipsCard = document.getElementById('tipsCard');
  const tipsEl = document.getElementById('tipsList');
  if (Array.isArray(tips) && tips.length > 0) {
    tipsEl.innerHTML = tips.map(t => `<li>${escapeHtml(t)}</li>`).join('');
    tipsCard.style.display = '';
  } else {
    tipsCard.style.display = 'none';
  }
}

function renderDay(idx) {
  const plan = window._dailyPlans[idx];
  const wrap = document.getElementById('dayPlan');
  if (!plan) { wrap.innerHTML = '<p class="empty">当日无安排</p>'; return; }

  const activities = plan.activities || [];
  const dayCost = activities.reduce((s, a) => s + (Number(a.estimatedCost) || 0), 0);

  // 活动类型中文名映射
  const typeMap = {
    sightseeing: '观光', dining: '用餐', shopping: '购物',
    rest: '休息', transport: '交通', activity: '活动'
  };
  const typeText = (t) => typeMap[t] || t || '';

  const activityHtml = activities.length === 0
    ? '<p class="empty">暂无活动安排</p>'
    : activities.map((a, i) => `
      <div class="activity">
        <div class="activity-time">${escapeHtml(a.startTime || '')}<br><span class="time-end">${escapeHtml(a.endTime || '')}</span></div>
        <div class="activity-body">
          <div class="activity-title">${escapeHtml(a.attractionName || '活动 ' + (i + 1))}
            <span class="activity-type">${escapeHtml(typeText(a.activityType))}</span>
          </div>
          ${a.description ? `<div class="activity-desc">${escapeHtml(a.description)}</div>` : ''}
          <div class="activity-meta">
            ${a.duration ? `<span>⏱ ${a.duration} 分钟</span>` : ''}
            ${a.estimatedCost ? `<span class="activity-cost">💰 ¥${a.estimatedCost}</span>` : ''}
          </div>
          ${a.tips ? `<div class="activity-tips">💡 ${escapeHtml(a.tips)}</div>` : ''}
        </div>
      </div>`).join('');

  wrap.innerHTML = `
    <div class="day-header">
      <div>
        <h2>Day ${plan.day || idx + 1} ${plan.theme ? '· ' + escapeHtml(plan.theme) : ''}</h2>
        <p class="day-date">${formatDate(plan.date) || ''}</p>
      </div>
      ${dayCost > 0 ? `<div class="day-cost">当日 ¥${dayCost.toLocaleString()}</div>` : ''}
    </div>
    <div class="timeline">${activityHtml}</div>`;
}
