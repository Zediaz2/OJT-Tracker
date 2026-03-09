const user = getUser();

// Sidebar
const sn = document.getElementById('sidebar-name');
const sa = document.getElementById('sidebar-avatar');
if (sn) sn.textContent = user.name;
if (sa) sa.textContent = user.name.charAt(0).toUpperCase();

// Live clock
function updateClock() {
  const now    = new Date();
  const clock  = document.getElementById('live-clock');
  const dateEl = document.getElementById('today-date');
  if (clock)  clock.textContent = now.toLocaleTimeString('en-US', { hour12: false });
  if (dateEl) dateEl.textContent = now.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
}
setInterval(updateClock, 1000);
updateClock();

function timeIn() {
  fetch(`${API}/dtr/time_in.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: user.id })
  })
  .then(r => r.json())
  .then(data => {
    const el = document.getElementById('dtr-status');
    if (data.success) {
      showAlert(el, `Time In recorded at ${data.time_in}`, 'success');
      loadDTR();
    } else {
      showAlert(el, data.error, 'error');
    }
    setTimeout(() => el.classList.add('hidden'), 4000);
  });
}

function timeOut() {
  fetch(`${API}/dtr/time_out.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: user.id })
  })
  .then(r => r.json())
  .then(data => {
    const el = document.getElementById('dtr-status');
    if (data.success) {
      showAlert(el, `Time Out recorded. Total hours: ${data.total_hours}`, 'success');
      loadDTR();
    } else {
      showAlert(el, data.error, 'error');
    }
    setTimeout(() => el.classList.add('hidden'), 4000);
  });
}

function toggleManual() {
  const form = document.getElementById('manual-form');
  const btn  = document.getElementById('manual-toggle-btn');
  const open = form.classList.toggle('open');
  btn.textContent = open ? 'Collapse' : '+ Add Past Entry';
}

function submitManualDTR() {
  const date     = document.getElementById('manual-date').value;
  const time_in  = document.getElementById('manual-time-in').value;
  const time_out = document.getElementById('manual-time-out').value;
  const statusEl = document.getElementById('manual-status');

  if (!date || !time_in || !time_out) {
    showAlert(statusEl, 'Please fill in all fields.', 'error'); return;
  }
  if (time_in >= time_out) {
    showAlert(statusEl, 'Time Out must be later than Time In.', 'error'); return;
  }

  fetch(`${API}/dtr/manual_entry.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: user.id, date, time_in, time_out })
  })
  .then(r => r.json())
  .then(data => {
    if (data.success) {
      showAlert(statusEl, `Entry for ${date} saved successfully.`, 'success');
      document.getElementById('manual-date').value     = '';
      document.getElementById('manual-time-in').value  = '';
      document.getElementById('manual-time-out').value = '';
      loadDTR();
    } else {
      showAlert(statusEl, data.error, 'error');
    }
    setTimeout(() => statusEl.classList.add('hidden'), 4000);
  });
}

function loadDTR() {
  fetch(`${API}/dtr/get_records.php?user_id=${user.id}`)
  .then(r => r.json())
  .then(data => {
    const tbody   = document.getElementById('dtr-body');
    const badgeEl = document.getElementById('total-days-badge');

    if (!data.records || !data.records.length) {
      tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><p>No records found. Click Time In to begin recording attendance.</p></div></td></tr>`;
      if (badgeEl) badgeEl.textContent = '0 days';
      return;
    }

    if (badgeEl) badgeEl.textContent = `${data.records.length} days`;

    tbody.innerHTML = data.records.map((r, i) => `
      <tr>
        <td style="color:var(--text-muted); font-size:0.8rem;">${data.records.length - i}</td>
        <td style="font-weight:600;">${r.date}</td>
        <td>${r.time_in  || '—'}</td>
        <td>${r.time_out || '—'}</td>
        <td>${r.total_hours
          ? `<span class="badge badge-success">${parseFloat(r.total_hours).toFixed(2)} hrs</span>`
          : `<span class="badge badge-warning">Ongoing</span>`}
        </td>
        <td>${r.time_out
          ? `<span class="badge badge-success">Complete</span>`
          : `<span class="badge badge-warning">In Progress</span>`}
        </td>
      </tr>
    `).join('');
  });
}

loadDTR();