/**
 * 公共工具: API 请求 / token / 提示
 */
const API = (window.APP_CONFIG && window.APP_CONFIG.API_BASE) || '';

function getToken() {
  return localStorage.getItem('admin_token') || '';
}
function setToken(t) {
  localStorage.setItem('admin_token', t);
}
function clearToken() {
  localStorage.removeItem('admin_token');
}

async function api(url, options = {}) {
  const opts = {
    headers: { 'Content-Type': 'application/json' },
    ...options
  };
  opts.headers = { ...opts.headers };
  const token = getToken();
  if (token) opts.headers['Authorization'] = `Bearer ${token}`;
  if (opts.body && typeof opts.body !== 'string') {
    opts.body = JSON.stringify(opts.body);
  }
  let res;
  try {
    res = await fetch(`${API}${url}`, opts);
  } catch (fetchErr) {
    // 网络层错误(DNS失败/服务器未响应/CORS拦截等)
    throw new Error(`网络请求失败: ${fetchErr.message} (请检查网络连接或稍后重试)`);
  }
  let data;
  try { data = await res.json(); } catch (e) { data = {}; }
  if (!res.ok) {
    // 优先显示后端返回的具体错误信息
    const hint = data && data.hint ? `\n💡 ${data.hint}` : '';
    const msg = (data && data.message) || (data && data.error) || `服务器错误 (${res.status})`;
    throw new Error(msg + hint);
  }
  return data;
}

function showMsg(el, text, type = 'info') {
  if (!el) return;
  el.className = `status-msg show ${type}`;
  el.textContent = text;
}

function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

/**
 * 首页: 行程生成
 */
(function initHomePage() {
  const form = document.getElementById('planForm');
  if (!form) return; // 非首页不执行

  // 渲染兴趣标签
  const tagsEl = document.getElementById('interestTags');
  const selected = new Set();
  window.APP_CONFIG.INTEREST_OPTIONS.forEach(tag => {
    const el = document.createElement('span');
    el.className = 'tag';
    el.textContent = tag;
    el.addEventListener('click', () => {
      if (selected.has(tag)) {
        selected.delete(tag);
        el.classList.remove('active');
      } else {
        selected.add(tag);
        el.classList.add('active');
      }
    });
    tagsEl.appendChild(el);
  });

  // 默认日期 = 今天
  document.getElementById('startDate').value = new Date().toISOString().split('T')[0];

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const statusMsg = document.getElementById('statusMsg');
    const btn = document.getElementById('submitBtn');
    const payload = {
      destination: document.getElementById('destination').value.trim(),
      startDate: document.getElementById('startDate').value,
      days: parseInt(document.getElementById('days').value, 10) || 3,
      budget: parseInt(document.getElementById('budget').value, 10) || 5000,
      interests: Array.from(selected)
    };

    if (!payload.destination || !payload.startDate) {
      showMsg(statusMsg, '请填写目的地和出发日期', 'error');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'AI 正在规划中... (约10-30秒)';
    showMsg(statusMsg, '正在调用 AI 生成行程,请耐心等待...', 'info');

    try {
      const result = await api('/api/itinerary/generate', { method: 'POST', body: payload });
      const id = result.itineraryId;
      // 缓存行程到 sessionStorage,详情页可从缓存读取(数据库保存失败用临时ID时尤其重要)
      if (id && result.itinerary) {
        try {
          sessionStorage.setItem(`itinerary_${id}`, JSON.stringify(result.itinerary));
        } catch (cacheErr) { /* 缓存失败不影响主流程 */ }
      }
      showMsg(statusMsg, '生成成功!即将跳转...', 'success');
      setTimeout(() => { window.location.href = `/detail.html?id=${id}`; }, 800);
    } catch (err) {
      showMsg(statusMsg, '生成失败: ' + err.message, 'error');
      btn.disabled = false;
      btn.textContent = '✨ 生成行程';
    }
  });

  // 加载最近行程
  loadRecent();
})();

async function loadRecent() {
  const section = document.getElementById('recentSection');
  const list = document.getElementById('recentList');
  if (!section || !list) return;
  try {
    // 匿名用户使用固定 demo userId 与小程序保持一致
    const result = await api('/api/itinerary/user/demo-user-001?page=1&limit=5');
    const items = result.itineraries || [];
    if (items.length === 0) return;
    section.style.display = '';
    list.innerHTML = items.map(it => `
      <li>
        <a href="/detail.html?id=${it.id}">
          <strong>${escapeHtml(it.destination_city || '')}</strong>
          <span>${it.days || 0} 天</span>
          <span class="meta">${formatDate(it.start_date)}</span>
        </a>
      </li>`).join('');
  } catch (e) { /* 静默 */ }
}

function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function formatDate(d) {
  if (!d) return '';
  const date = new Date(d);
  if (isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
