// Base API URL — dynamically resolved so it works on localhost, 127.0.0.1, or any LAN IP/domain
const API = (() => {
  const origin = window.location.origin;
  const path = window.location.pathname;
  const frontendIdx = path.indexOf('/frontend');
  if (frontendIdx !== -1) {
    return origin + path.substring(0, frontendIdx) + '/backend';
  }
  return origin + '/backend';
})();

function getUser() {
  const u = localStorage.getItem('ojt_user');
  if (!u) return null;
  return JSON.parse(u);
}

function logoutUser() {
  fetch(`${API}/auth/logout.php`)
    .finally(() => {
      localStorage.removeItem('ojt_user');
      window.location.href = 'index.html';
    });
}

function showAlert(el, msg, type) {
  el.textContent = msg;
  el.className   = `alert alert-${type}`;
  el.classList.remove('hidden');
}

// Redirect to login if not authenticated (runs on all protected pages)
if (!window.location.pathname.endsWith('index.html') && !window.location.pathname.endsWith('/')) {
  const user = getUser();
  if (!user) window.location.href = 'index.html';
}