// Base API URL — single declaration, used by all pages
const API = 'http://localhost/OJT-Tracker/backend';

function getUser() {
  const u = localStorage.getItem('ojt_user');
  return u ? JSON.parse(u) : null;
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
if (!window.location.pathname.endsWith('index.html')) {
  const user = getUser();
  if (!user) window.location.href = 'index.html';
}