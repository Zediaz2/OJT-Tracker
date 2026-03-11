const user = getUser();

// ── Sidebar ──
const sn = document.getElementById('sidebar-name');
const sa = document.getElementById('sidebar-avatar');
if (sn) sn.textContent = user.name;
if (sa) sa.textContent = user.name.charAt(0).toUpperCase();

// ── Live Clock ──
function updateClock() {
  const now = new Date();
  const hh  = String(now.getHours()).padStart(2, '0');
  const mm  = String(now.getMinutes()).padStart(2, '0');
  const ss  = String(now.getSeconds()).padStart(2, '0');
  const clockEl = document.getElementById('live-clock');
  if (clockEl) {
    clockEl.innerHTML = `${hh}<span class="dtr-clock-sep">:</span>${mm}<span class="dtr-clock-sep">:</span>${ss}`;
  }
  const dateEl = document.getElementById('today-date');
  if (dateEl) dateEl.textContent = now.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
}
setInterval(updateClock, 1000);
updateClock();

// ============================================================
// BREAK MODAL
// ============================================================
let selectedBreakMins = 60;

function openBreakModal() {
  document.getElementById('break-modal-overlay').classList.remove('hidden');
  selectBreak(60);
  document.getElementById('break-modal-status').classList.add('hidden');
}

function cancelTimeOut() {
  document.getElementById('break-modal-overlay').classList.add('hidden');
}

function selectBreak(mins) {
  selectedBreakMins = parseInt(mins) || 0;
  document.querySelectorAll('.break-option').forEach(opt => {
    opt.classList.toggle('selected', parseInt(opt.dataset.mins) === selectedBreakMins);
  });
  if ([0, 15, 30, 60].includes(selectedBreakMins)) {
    document.getElementById('break-custom-mins').value = '';
  }
}

function selectBreakCustom(val) {
  const mins = parseInt(val);
  if (!isNaN(mins) && mins >= 0) {
    selectedBreakMins = mins;
    document.querySelectorAll('.break-option').forEach(opt => opt.classList.remove('selected'));
  }
}

function confirmTimeOut() {
  const statusEl  = document.getElementById('break-modal-status');
  const customVal = document.getElementById('break-custom-mins').value;
  if (customVal !== '') {
    const customMins = parseInt(customVal);
    if (isNaN(customMins) || customMins < 0 || customMins > 480) {
      showAlert(statusEl, 'Please enter a valid break duration (0–480 minutes).', 'error'); return;
    }
    selectedBreakMins = customMins;
  }
  document.getElementById('break-modal-overlay').classList.add('hidden');
  timeOut(selectedBreakMins);
}

// ============================================================
// TIME IN / TIME OUT
// ============================================================
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
      showAlert(el, `✓ Time In recorded at ${data.time_in}`, 'success');
      updateBreakPill(null);
      loadDTR();
    } else {
      showAlert(el, data.error, 'error');
    }
    setTimeout(() => el.classList.add('hidden'), 4500);
  })
  .catch(() => {
    const el = document.getElementById('dtr-status');
    showAlert(el, 'Connection error. Please check XAMPP is running.', 'error');
  });
}

function timeOut(breakMins) {
  fetch(`${API}/dtr/time_out.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: user.id, break_minutes: breakMins })
  })
  .then(r => r.json())
  .then(data => {
    const el = document.getElementById('dtr-status');
    if (data.success) {
      const breakLabel = breakMins > 0 ? ` (${breakMins} min break deducted)` : '';
      showAlert(el, `✓ Time Out recorded. Net hours: ${data.total_hours}${breakLabel}`, 'success');
      updateBreakPill(breakMins);
      loadDTR();
    } else {
      showAlert(el, data.error, 'error');
    }
    setTimeout(() => el.classList.add('hidden'), 5500);
  })
  .catch(() => {
    const el = document.getElementById('dtr-status');
    showAlert(el, 'Connection error. Please check XAMPP is running.', 'error');
  });
}

function updateBreakPill(breakMins) {
  const pill = document.getElementById('break-info-pill');
  const text = document.getElementById('break-info-text');
  if (!pill || !text) return;
  if (breakMins === null) {
    pill.classList.remove('hidden');
    text.textContent = 'Timed in — break will be set on Time Out';
  } else if (breakMins === 0) {
    pill.classList.add('hidden');
  } else {
    pill.classList.remove('hidden');
    text.textContent = `${breakMins} min break deducted`;
  }
}

// ============================================================
// MANUAL ENTRY
// ============================================================
function toggleManual() {
  const form = document.getElementById('manual-form');
  const btn  = document.getElementById('manual-toggle-btn');
  const open = form.classList.toggle('open');
  btn.textContent = open ? '− Collapse' : '+ Add Past Entry';
}

function submitManualDTR() {
  const date      = document.getElementById('manual-date').value;
  const time_in   = document.getElementById('manual-time-in').value;
  const time_out  = document.getElementById('manual-time-out').value;
  const breakMins = parseInt(document.getElementById('manual-break').value) || 0;
  const statusEl  = document.getElementById('manual-status');

  if (!date || !time_in || !time_out) {
    showAlert(statusEl, 'Please fill in date, time in, and time out.', 'error'); return;
  }
  if (time_in >= time_out) {
    showAlert(statusEl, 'Time Out must be later than Time In.', 'error'); return;
  }

  fetch(`${API}/dtr/manual_entry.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: user.id, date, time_in, time_out, break_minutes: breakMins })
  })
  .then(r => r.json())
  .then(data => {
    if (data.success) {
      const breakNote = breakMins > 0 ? ` (${breakMins} min break deducted)` : '';
      showAlert(statusEl, `✓ Entry for ${date} saved. Net hours: ${data.total_hours}${breakNote}`, 'success');
      document.getElementById('manual-date').value     = '';
      document.getElementById('manual-time-in').value  = '';
      document.getElementById('manual-time-out').value = '';
      document.getElementById('manual-break').value    = '60';
      loadDTR();
    } else {
      showAlert(statusEl, data.error, 'error');
    }
    setTimeout(() => statusEl.classList.add('hidden'), 5000);
  })
  .catch(() => showAlert(statusEl, 'Connection error.', 'error'));
}

// ============================================================
// EDIT RECORD
// ============================================================
function openEditModal(id, date, timeIn, timeOut, breakMins) {
  document.getElementById('edit-record-id').value = id;
  document.getElementById('edit-date').value      = date;
  document.getElementById('edit-time-in').value   = timeIn    || '';
  document.getElementById('edit-time-out').value  = timeOut   || '';
  document.getElementById('edit-break').value     = breakMins || 0;
  document.getElementById('edit-modal-status').classList.add('hidden');
  document.getElementById('edit-modal-overlay').classList.remove('hidden');
}

function closeEditModal() {
  document.getElementById('edit-modal-overlay').classList.add('hidden');
}

function confirmEditRecord() {
  const id        = document.getElementById('edit-record-id').value;
  const date      = document.getElementById('edit-date').value;
  const time_in   = document.getElementById('edit-time-in').value;
  const time_out  = document.getElementById('edit-time-out').value;
  const breakMins = parseInt(document.getElementById('edit-break').value) || 0;
  const statusEl  = document.getElementById('edit-modal-status');

  if (!date || !time_in) {
    showAlert(statusEl, 'Date and Time In are required.', 'error'); return;
  }
  if (time_out && time_in >= time_out) {
    showAlert(statusEl, 'Time Out must be later than Time In.', 'error'); return;
  }
  if (breakMins < 0 || breakMins > 480) {
    showAlert(statusEl, 'Break must be between 0 and 480 minutes.', 'error'); return;
  }

  const saveBtn = document.querySelector('#edit-modal-overlay .btn-primary');
  saveBtn.textContent = 'Saving…';
  saveBtn.disabled    = true;

  fetch(`${API}/dtr/update_record.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, user_id: user.id, date, time_in, time_out, break_minutes: breakMins })
  })
  .then(r => r.json())
  .then(data => {
    saveBtn.textContent = 'Save Changes';
    saveBtn.disabled    = false;
    if (data.success) {
      closeEditModal();
      const el = document.getElementById('dtr-status');
      showAlert(el, `✓ Record for ${date} updated successfully.`, 'success');
      setTimeout(() => el.classList.add('hidden'), 4000);
      loadDTR();
    } else {
      showAlert(statusEl, data.error || 'Failed to update record.', 'error');
    }
  })
  .catch(() => {
    saveBtn.textContent = 'Save Changes';
    saveBtn.disabled    = false;
    showAlert(statusEl, 'Connection error.', 'error');
  });
}

// ============================================================
// DELETE RECORD
// ============================================================
function openDeleteModal(id, date) {
  document.getElementById('delete-record-id').value         = id;
  document.getElementById('delete-record-date').textContent = date;
  document.getElementById('delete-modal-overlay').classList.remove('hidden');
}

function closeDeleteModal() {
  document.getElementById('delete-modal-overlay').classList.add('hidden');
}

function confirmDeleteRecord() {
  const id     = document.getElementById('delete-record-id').value;
  const delBtn = document.querySelector('#delete-modal-overlay .btn-danger');
  delBtn.textContent = 'Deleting…';
  delBtn.disabled    = true;

  fetch(`${API}/dtr/delete_record.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, user_id: user.id })
  })
  .then(r => r.json())
  .then(data => {
    delBtn.textContent = 'Yes, Delete';
    delBtn.disabled    = false;
    closeDeleteModal();
    const el = document.getElementById('dtr-status');
    if (data.success) {
      showAlert(el, '✓ Record deleted successfully.', 'success');
      loadDTR();
    } else {
      showAlert(el, data.error || 'Failed to delete record.', 'error');
    }
    setTimeout(() => el.classList.add('hidden'), 4000);
  })
  .catch(() => {
    delBtn.textContent = 'Yes, Delete';
    delBtn.disabled    = false;
    closeDeleteModal();
    showAlert(document.getElementById('dtr-status'), 'Connection error.', 'error');
  });
}

// ============================================================
// LOAD DTR TABLE
// ============================================================
function loadDTR() {
  fetch(`${API}/dtr/get_records.php?user_id=${user.id}`)
  .then(r => r.json())
  .then(data => {
    const tbody   = document.getElementById('dtr-body');
    const badgeEl = document.getElementById('total-days-badge');

    if (!data.records || !data.records.length) {
      tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><p>No records yet. Click Time In to begin recording.</p></div></td></tr>`;
      if (badgeEl) badgeEl.textContent = '0 days';
      return;
    }

    if (badgeEl) badgeEl.textContent = `${data.records.length} day${data.records.length !== 1 ? 's' : ''}`;

    tbody.innerHTML = data.records.map((r, i) => {
      const breakDisplay = r.break_minutes > 0
        ? `<span class="badge badge-warning">${r.break_minutes} min</span>`
        : `<span style="color:var(--text-muted); font-size:0.8rem;">—</span>`;

      const hoursDisplay = r.total_hours
        ? `<span class="badge badge-success">${parseFloat(r.total_hours).toFixed(2)} hrs</span>`
        : `<span class="badge badge-warning">Ongoing</span>`;

      const statusDisplay = r.time_out
        ? `<span class="badge badge-success">Complete</span>`
        : `<span class="badge badge-warning">In Progress</span>`;

      const safeTimeIn  = (r.time_in  || '').substring(0, 5);
      const safeTimeOut = (r.time_out || '').substring(0, 5);
      const breakMins   = r.break_minutes || 0;

      return `
        <tr style="animation: fadeUp 0.3s ease ${i * 0.04}s both;">
          <td style="color:var(--text-muted); font-size:0.78rem; font-weight:600;">${data.records.length - i}</td>
          <td style="font-weight:700;">${r.date}</td>
          <td>${r.time_in  || '—'}</td>
          <td>${r.time_out || '—'}</td>
          <td>${breakDisplay}</td>
          <td>${hoursDisplay}</td>
          <td>${statusDisplay}</td>
          <td>
            <div style="display:flex; gap:0.4rem; justify-content:center;">
              <button
                class="btn btn-outline btn-sm" title="Edit"
                onclick="openEditModal('${r.id}', '${r.date}', '${safeTimeIn}', '${safeTimeOut}', '${breakMins}')"
                style="padding:0.3rem 0.55rem;">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button
                class="btn btn-sm" title="Delete"
                onclick="openDeleteModal('${r.id}', '${r.date}')"
                style="padding:0.3rem 0.55rem; background:#fef2f2; color:#dc2626; border:1.5px solid #fecaca;">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6"/><path d="M14 11v6"/>
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  })
  .catch(() => {
    document.getElementById('dtr-body').innerHTML =
      `<tr><td colspan="8"><div class="empty-state"><p>Unable to load records. Check XAMPP connection.</p></div></td></tr>`;
  });
}

loadDTR();