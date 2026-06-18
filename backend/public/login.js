/**
 * 管理后台登录页
 */
(function initLoginPage() {
  // 已登录则跳转管理页
  if (getToken()) {
    window.location.href = '/admin.html';
    return;
  }

  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('loginBtn');
    const statusMsg = document.getElementById('statusMsg');
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    btn.disabled = true;
    btn.textContent = '登录中...';

    try {
      const result = await api('/api/auth/login', {
        method: 'POST',
        body: { username, password }
      });
      setToken(result.token);
      showMsg(statusMsg, '登录成功,即将跳转...', 'success');
      setTimeout(() => { window.location.href = '/admin.html'; }, 600);
    } catch (err) {
      showMsg(statusMsg, '登录失败: ' + err.message, 'error');
      btn.disabled = false;
      btn.textContent = '登录';
    }
  });
})();
