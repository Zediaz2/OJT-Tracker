const user = getUser();

// ── Sidebar ──
const sn = document.getElementById('sidebar-name');
const sa = document.getElementById('sidebar-avatar');
if (sn) sn.textContent = user.name;
if (sa) sa.textContent = user.name.charAt(0).toUpperCase();

// ── 12-hour time formatter ──
// Input: "HH:MM" or "HH:MM:SS" string  →  "h:MM:SS AM/PM"
function to12hr(timeStr, showSeconds = false) {
  if (!timeStr) return '—';
  const parts = timeStr.split(':');
  let h   = parseInt(parts[0], 10);
  const m = parts[1] || '00';
  const s = parts[2] || '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return showSeconds
    ? `${h}:${m}:${s} ${ampm}`
    : `${h}:${m} ${ampm}`;
}

// ── Live Clock ──
function updateClock() {
  const now  = new Date();
  let   h    = now.getHours();
  const mm   = String(now.getMinutes()).padStart(2, '0');
  const ss   = String(now.getSeconds()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  const hh = String(h).padStart(2, '0');

  const clockEl = document.getElementById('live-clock');
  if (clockEl) {
    clockEl.innerHTML =
      `${hh}<span class="dtr-clock-sep">:</span>${mm}<span class="dtr-clock-sep">:</span>${ss}` +
      `<span style="font-size:0.45em; font-weight:700; margin-left:6px; letter-spacing:0.05em; vertical-align:middle;">${ampm}</span>`;
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
      showAlert(el, `✓ Time In recorded at ${to12hr(data.time_in)}`, 'success');
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
          <td>${r.time_in  ? to12hr(safeTimeIn)  : '—'}</td>
          <td>${r.time_out ? to12hr(safeTimeOut) : '—'}</td>
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

// ============================================================
// EXPORT DTR TO PDF
// ============================================================
function exportToPDF() {
  const btn = document.getElementById('export-pdf-btn');
  btn.disabled = true;
  btn.innerHTML = `
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="animation:spin 1s linear infinite">
      <path d="M21 12a9 9 0 1 1-6.22-8.56"/>
    </svg>
    Exporting…`;

  fetch(`${API}/dtr/get_records.php?user_id=${user.id}`)
    .then(r => r.json())
    .then(data => {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      const records = data.records || [];
      const exportDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      });
      const userName = user.name || 'Student';

      // ── Header block ──────────────────────────────────────────
      doc.setFillColor(30, 41, 59);           // dark navy
      doc.rect(0, 0, 210, 32, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('OJT Tracker', 14, 13);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('Daily Time Record (DTR)', 14, 21);

      doc.setFontSize(8.5);
      doc.setTextColor(148, 163, 184);        // slate-400
      doc.text(`Exported: ${exportDate}`, 14, 28);

      // right-align student name
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(userName, 196, 13, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(148, 163, 184);
      doc.text('OJT Student', 196, 21, { align: 'right' });

      // ── Summary pills ─────────────────────────────────────────
      let totalNet = 0;
      records.forEach(r => { if (r.total_hours) totalNet += parseFloat(r.total_hours); });
      const completedDays = records.filter(r => r.time_out).length;

      doc.setTextColor(30, 41, 59);
      doc.setFontSize(8);

      const pills = [
        { label: 'Total Days',      value: `${records.length}` },
        { label: 'Completed',       value: `${completedDays}` },
        { label: 'Total Net Hours', value: `${totalNet.toFixed(2)} hrs` },
      ];

      let px = 14;
      pills.forEach(p => {
        doc.setFillColor(241, 245, 249);       // slate-100
        doc.roundedRect(px, 36, 52, 14, 2, 2, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(30, 41, 59);
        doc.text(p.value, px + 26, 43.5, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text(p.label, px + 26, 48, { align: 'center' });
        px += 56;
      });

      // ── Attendance table ──────────────────────────────────────
      const head = [['#', 'Date', 'Time In', 'Time Out', 'Break', 'Net Hours', 'Status']];
      const body = records.map((r, i) => {
        const safeIn  = (r.time_in  || '').substring(0, 5);
        const safeOut = (r.time_out || '').substring(0, 5);
        return [
          records.length - i,
          r.date,
          r.time_in  ? to12hr(safeIn)  : '—',
          r.time_out ? to12hr(safeOut) : '—',
          r.break_minutes > 0 ? `${r.break_minutes} min` : '—',
          r.total_hours ? `${parseFloat(r.total_hours).toFixed(2)} hrs` : 'Ongoing',
          r.time_out ? 'Complete' : 'In Progress',
        ];
      });

      doc.autoTable({
        startY: 56,
        head,
        body,
        theme: 'grid',
        styles: {
          font: 'helvetica',
          fontSize: 8.5,
          cellPadding: 3.2,
          textColor: [30, 41, 59],
          lineColor: [226, 232, 240],
          lineWidth: 0.3,
        },
        headStyles: {
          fillColor: [30, 41, 59],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8.5,
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { halign: 'center', cellWidth: 10 },
          2: { halign: 'center' },
          3: { halign: 'center' },
          4: { halign: 'center' },
          5: { halign: 'center', fontStyle: 'bold' },
          6: { halign: 'center' },
        },
        didDrawCell(hookData) {
          // Color-code Status column (index 6)
          if (hookData.section === 'body' && hookData.column.index === 6) {
            const val = hookData.cell.raw;
            const { x, y, width, height } = hookData.cell;
            if (val === 'Complete') {
              doc.setFillColor(220, 252, 231);
              doc.setTextColor(22, 163, 74);
            } else {
              doc.setFillColor(254, 243, 199);
              doc.setTextColor(161, 98, 7);
            }
            doc.rect(x, y, width, height, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.text(val, x + width / 2, y + height / 2 + 1, { align: 'center' });
          }
        },
      });

      // ── Footer ────────────────────────────────────────────────
      const pageH = doc.internal.pageSize.getHeight();
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.4);
      doc.line(14, pageH - 12, 196, pageH - 12);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text('Generated by OJT Tracker', 14, pageH - 7);
      doc.text(`Page 1`, 196, pageH - 7, { align: 'right' });

      // ── Save ──────────────────────────────────────────────────
      const safeName = userName.replace(/\s+/g, '_');
      const today = new Date().toISOString().slice(0, 10);
      doc.save(`DTR_${safeName}_${today}.pdf`);
    })
    .catch(() => {
      const el = document.getElementById('dtr-status');
      showAlert(el, 'Failed to export PDF. Please try again.', 'error');
      setTimeout(() => el.classList.add('hidden'), 4000);
    })
    .finally(() => {
      btn.disabled = false;
      btn.innerHTML = `
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="12" y1="18" x2="12" y2="12"/>
          <polyline points="9 15 12 18 15 15"/>
        </svg>
        Export PDF`;
    });
}