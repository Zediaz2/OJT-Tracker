const user = getUser();

// ── Sidebar ──────────────────────────────────────────────
const sn = document.getElementById('sidebar-name');
const sa = document.getElementById('sidebar-avatar');
if (sn) sn.textContent = user.name;
if (sa) sa.textContent = user.name.charAt(0).toUpperCase();

let allReports = [];

// ── Toggle submit form ────────────────────────────────────
function toggleForm() {
  document.getElementById('report-form').classList.toggle('open');
}

// ── Lightbox ──────────────────────────────────────────────
function openLightbox(src) {
  document.getElementById('lightbox-img').src = src;
  document.getElementById('lightbox').classList.remove('hidden');
}

// ── New-image preview (submit form) ──────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('report_images');
  if (input) {
    input.addEventListener('change', function () {
      renderNewImagePreviews(this.files, 'image-preview', 'report_images');
    });
  }

  // New-image preview in edit modal
  const editInput = document.getElementById('edit-new-images');
  if (editInput) {
    editInput.addEventListener('change', function () {
      renderNewImagePreviews(this.files, 'edit-new-preview', 'edit-new-images');
    });
  }

  // Close modals on overlay click
  document.getElementById('edit-modal-overlay').addEventListener('click', function(e) {
    if (e.target === this) closeEditModal();
  });
  document.getElementById('delete-modal-overlay').addEventListener('click', function(e) {
    if (e.target === this) closeDeleteModal();
  });

  loadReports();
});

function renderNewImagePreviews(files, previewId, inputId) {
  const preview = document.getElementById(previewId);
  preview.innerHTML = '';
  Array.from(files).forEach(file => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = document.createElement('img');
      img.src = e.target.result;
      img.onclick = () => openLightbox(e.target.result);
      preview.appendChild(img);
    };
    reader.readAsDataURL(file);
  });
}

// ════════════════════════════════════════════════════════
//  SUBMIT NEW REPORT
// ════════════════════════════════════════════════════════
function submitReport() {
  const week_start  = document.getElementById('week_start').value;
  const week_end    = document.getElementById('week_end').value;
  const title       = document.getElementById('report_title').value.trim();
  const description = document.getElementById('report_desc').value.trim();
  const statusEl    = document.getElementById('report-status');

  if (!week_start || !week_end || !title || !description) {
    showAlert(statusEl, 'Please complete all required fields before submitting.', 'error'); return;
  }
  if (week_start > week_end) {
    showAlert(statusEl, 'Week end date must be after the week start date.', 'error'); return;
  }

  fetch(`${API}/reports/create_report.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: user.id, week_start, week_end, title, description })
  })
  .then(r => r.json())
  .then(data => {
    if (!data.success) { showAlert(statusEl, data.error, 'error'); return; }

    const report_id = data.report_id;
    const files     = document.getElementById('report_images').files;

    if (!files.length) {
      showAlert(statusEl, '✓ Report submitted successfully.', 'success');
      clearForm(); loadReports(); return;
    }

    const formData = new FormData();
    formData.append('report_id', report_id);
    Array.from(files).forEach(f => formData.append('images[]', f));

    fetch(`${API}/reports/upload_image.php`, { method: 'POST', body: formData })
      .then(r => r.json())
      .then(() => {
        showAlert(statusEl, '✓ Report and attachments submitted successfully.', 'success');
        clearForm(); loadReports();
      });
  })
  .catch(() => showAlert(statusEl, 'Failed to connect. Please try again.', 'error'));
}

function clearForm() {
  ['week_start','week_end','report_title','report_desc','report_images'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('image-preview').innerHTML = '';
  document.getElementById('report-form').classList.remove('open');
}

// ════════════════════════════════════════════════════════
//  LOAD AND RENDER REPORTS
// ════════════════════════════════════════════════════════
function loadReports() {
  fetch(`${API}/reports/get_reports.php?user_id=${user.id}`)
    .then(r => r.json())
    .then(data => {
      allReports = data.reports || [];
      const container = document.getElementById('reports-list');
      const exportBtn = document.getElementById('export-btn');
      if (exportBtn) exportBtn.style.display = allReports.length ? 'inline-flex' : 'none';

      if (!allReports.length) {
        container.innerHTML = `
          <div class="empty-state card">
            <div class="empty-state-icon">📄</div>
            <h3>No reports submitted yet</h3>
            <p>Click "New Report" to create your first weekly journal entry.</p>
          </div>`;
        return;
      }

      container.innerHTML = allReports.map((r, i) => `
        <div class="card" style="border-left:3px solid var(--primary); margin-bottom:1rem; animation: fadeUp 0.3s ease ${i * 0.06}s both;">

          <!-- Header row -->
          <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:0.5rem; margin-bottom:0.75rem;">
            <div>
              <div style="font-size:0.68rem; font-weight:700; text-transform:uppercase; letter-spacing:0.07em; color:var(--text-muted); margin-bottom:0.3rem;">
                Report #${allReports.length - i}
              </div>
              <div style="font-size:0.95rem; font-weight:700; color:var(--text);">${r.title}</div>
            </div>
            <!-- Action buttons -->
            <div style="display:flex; align-items:center; gap:0.4rem; flex-wrap:wrap;">
              <span class="badge badge-primary" style="font-size:0.72rem;">${r.week_start} — ${r.week_end}</span>

              <!-- Export PDF -->
              <button onclick="exportSinglePDF(${allReports.length - 1 - i})"
                class="rpt-action-btn"
                title="Export as PDF"
                style="color:var(--primary);"
                onmouseover="this.style.background='var(--primary-light)';this.style.borderColor='var(--primary)'"
                onmouseout="this.style.background='#fff';this.style.borderColor='var(--border)'">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Export
              </button>

              <!-- Edit -->
              <button onclick="openEditModal(${allReports.length - 1 - i})"
                class="rpt-action-btn"
                title="Edit report"
                style="color:#0ea5e9;"
                onmouseover="this.style.background='#f0f9ff';this.style.borderColor='#0ea5e9'"
                onmouseout="this.style.background='#fff';this.style.borderColor='var(--border)'">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Edit
              </button>

              <!-- Delete -->
              <button onclick="openDeleteModal(${allReports.length - 1 - i})"
                class="rpt-action-btn"
                title="Delete report"
                style="color:#dc2626;"
                onmouseover="this.style.background='#fef2f2';this.style.borderColor='#dc2626'"
                onmouseout="this.style.background='#fff';this.style.borderColor='var(--border)'">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
                Delete
              </button>
            </div>
          </div>

          <!-- Description -->
          <p style="color:var(--text-muted); line-height:1.7; font-size:0.875rem; margin-bottom:${r.images && r.images.length ? '0.75rem' : '0'}">${r.description}</p>

          <!-- Images -->
          ${r.images && r.images.length ? `
            <div class="image-preview-grid" style="margin-bottom:0.75rem;">
              ${r.images.map(img => `
                <img src="http://localhost/OJT-Tracker/frontend/${img}"
                     alt="documentation" onclick="openLightbox(this.src)"
                     onerror="this.style.display='none'"/>
              `).join('')}
            </div>` : ''}

          <!-- Footer -->
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:.5rem; padding-top:0.75rem; border-top:1px solid var(--border-light);">
            <span style="font-size:0.78rem; color:var(--text-muted);">
              Submitted: ${new Date(r.submitted_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
            </span>
            ${r.images && r.images.length
              ? `<span class="badge badge-muted">${r.images.length} attachment(s)</span>`
              : ''}
          </div>
        </div>
      `).join('');
    })
    .catch(() => {
      document.getElementById('reports-list').innerHTML = `
        <div class="empty-state card">
          <h3>Unable to load reports</h3>
          <p>Please ensure XAMPP is running and the database is configured correctly.</p>
        </div>`;
    });
}

// Shared action button style injection (runs once)
(function injectActionBtnStyle() {
  if (document.getElementById('rpt-btn-style')) return;
  const style = document.createElement('style');
  style.id = 'rpt-btn-style';
  style.textContent = `
    .rpt-action-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      padding: 0.28rem 0.65rem;
      background: #fff;
      border: 1.5px solid var(--border);
      border-radius: var(--radius-sm);
      font-size: 0.75rem;
      font-weight: 700;
      cursor: pointer;
      font-family: inherit;
      transition: var(--transition);
    }
  `;
  document.head.appendChild(style);
})();

// ════════════════════════════════════════════════════════
//  EDIT REPORT
// ════════════════════════════════════════════════════════

// Images to remove (array of paths)
let editImagesToRemove = [];

function openEditModal(index) {
  const r = allReports[index];
  if (!r) return;

  editImagesToRemove = [];

  document.getElementById('edit-report-id').value    = r.id;
  document.getElementById('edit-week-start').value   = r.week_start;
  document.getElementById('edit-week-end').value     = r.week_end;
  document.getElementById('edit-title').value        = r.title;
  document.getElementById('edit-desc').value         = r.description;
  document.getElementById('edit-new-images').value   = '';
  document.getElementById('edit-new-preview').innerHTML = '';
  document.getElementById('edit-status').classList.add('hidden');

  const btn = document.getElementById('edit-save-btn');
  btn.textContent = 'Save Changes';
  btn.disabled = false;

  // Populate existing images
  const wrap = document.getElementById('edit-existing-images-wrap');
  const grid = document.getElementById('edit-existing-images');

  if (r.images && r.images.length) {
    wrap.style.display = 'block';
    grid.innerHTML = r.images.map(imgPath => `
      <div class="existing-img-wrap" id="wrap-${CSS.escape(imgPath)}">
        <img src="http://localhost/OJT-Tracker/frontend/${imgPath}"
             onerror="this.parentElement.style.display='none'"/>
        <button class="existing-img-remove"
                onclick="toggleRemoveImage('${imgPath}')"
                title="Mark for removal">✕</button>
      </div>
    `).join('');
  } else {
    wrap.style.display = 'none';
    grid.innerHTML = '';
  }

  document.getElementById('edit-modal-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeEditModal() {
  document.getElementById('edit-modal-overlay').classList.remove('open');
  document.body.style.overflow = '';
  editImagesToRemove = [];
}

function toggleRemoveImage(imgPath) {
  const wrapId = 'wrap-' + CSS.escape(imgPath);
  const wrap   = document.getElementById(wrapId);
  if (!wrap) return;

  const idx = editImagesToRemove.indexOf(imgPath);
  if (idx === -1) {
    // Mark for removal
    editImagesToRemove.push(imgPath);
    wrap.classList.add('marked-remove');
    // Change button to "Undo"
    const btn = wrap.querySelector('.existing-img-remove');
    if (btn) { btn.textContent = '↩'; btn.title = 'Undo removal'; btn.style.background = 'rgba(100,100,100,0.8)'; }
  } else {
    // Undo removal
    editImagesToRemove.splice(idx, 1);
    wrap.classList.remove('marked-remove');
    const btn = wrap.querySelector('.existing-img-remove');
    if (btn) { btn.textContent = '✕'; btn.title = 'Mark for removal'; btn.style.background = ''; }
  }
}

function saveEditReport() {
  const id          = document.getElementById('edit-report-id').value;
  const week_start  = document.getElementById('edit-week-start').value;
  const week_end    = document.getElementById('edit-week-end').value;
  const title       = document.getElementById('edit-title').value.trim();
  const description = document.getElementById('edit-desc').value.trim();
  const statusEl    = document.getElementById('edit-status');
  const btn         = document.getElementById('edit-save-btn');

  if (!week_start || !week_end || !title || !description) {
    showAlert(statusEl, 'All fields are required.', 'error'); return;
  }
  if (week_start > week_end) {
    showAlert(statusEl, 'Week end date must be after start date.', 'error'); return;
  }

  btn.textContent = 'Saving…';
  btn.disabled = true;

  // Step 1 — update text fields + mark images for removal
  const payload = {
    report_id: id,
    user_id: user.id,
    week_start,
    week_end,
    title,
    description,
    remove_images: editImagesToRemove
  };

  fetch(`${API}/reports/update_report.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  .then(r => r.json())
  .then(data => {
    if (!data.success) {
      showAlert(statusEl, data.error || 'Update failed.', 'error');
      btn.textContent = 'Save Changes'; btn.disabled = false; return;
    }

    // Step 2 — upload new images (if any)
    const newFiles = document.getElementById('edit-new-images').files;
    if (!newFiles.length) {
      showAlert(statusEl, '✓ Report updated successfully.', 'success');
      setTimeout(() => { closeEditModal(); loadReports(); }, 900);
      return;
    }

    const formData = new FormData();
    formData.append('report_id', id);
    Array.from(newFiles).forEach(f => formData.append('images[]', f));

    fetch(`${API}/reports/upload_image.php`, { method: 'POST', body: formData })
      .then(r => r.json())
      .then(() => {
        showAlert(statusEl, '✓ Report updated successfully.', 'success');
        setTimeout(() => { closeEditModal(); loadReports(); }, 900);
      });
  })
  .catch(() => {
    showAlert(statusEl, 'Failed to connect. Please try again.', 'error');
    btn.textContent = 'Save Changes'; btn.disabled = false;
  });
}

// ════════════════════════════════════════════════════════
//  DELETE REPORT
// ════════════════════════════════════════════════════════
function openDeleteModal(index) {
  const r = allReports[index];
  if (!r) return;
  document.getElementById('delete-report-id').value   = r.id;
  document.getElementById('delete-report-title').textContent = `"${r.title}"`;
  const btn = document.getElementById('delete-confirm-btn');
  btn.textContent = 'Delete Report'; btn.disabled = false;
  document.getElementById('delete-modal-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeDeleteModal() {
  document.getElementById('delete-modal-overlay').classList.remove('open');
  document.body.style.overflow = '';
}

function confirmDeleteReport() {
  const id  = document.getElementById('delete-report-id').value;
  const btn = document.getElementById('delete-confirm-btn');
  btn.textContent = 'Deleting…'; btn.disabled = true;

  fetch(`${API}/reports/delete_report.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ report_id: id, user_id: user.id })
  })
  .then(r => r.json())
  .then(data => {
    if (!data.success) {
      btn.textContent = 'Delete Report'; btn.disabled = false;
      alert(data.error || 'Delete failed. Please try again.'); return;
    }
    closeDeleteModal();
    loadReports();
  })
  .catch(() => {
    btn.textContent = 'Delete Report'; btn.disabled = false;
    alert('Failed to connect. Please try again.');
  });
}

// ════════════════════════════════════════════════════════
//  STI WEEKLY JOURNAL PDF GENERATOR
// ════════════════════════════════════════════════════════
function getProfile() {
  const s = JSON.parse(localStorage.getItem('ojt_settings') || '{}');
  const nameParts = user.name.trim().split(' ');
  const lastName  = nameParts.length > 1 ? nameParts[nameParts.length - 1] : user.name;
  const firstName = nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : '';
  return {
    lastName,
    firstName,
    mi:            s.mi             || '',
    campus:        s.campus         || user.school  || '',
    program:       s.program        || '',
    yearLevel:     s.year_level     || '',
    section:       s.section        || '',
    company:       s.company        || user.company || '',
    department:    s.department     || '',
    supervisor:    s.supervisor     || '',
    templateTitle: s.template_title || 'WEEKLY JOURNAL TEMPLATE',
  };
}

function fmtDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr + 'T00:00:00')
    .toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function buildSTIPage(report, reportNumber, totalReports, profile, logoBase64) {
  const logoHtml = logoBase64
    ? `<img src="${logoBase64}" alt="Logo" style="max-height:52pt; max-width:120pt; object-fit:contain; display:block;"/>`
    : `<div style="font-size:18pt; font-weight:900; color:#1a1a2e; letter-spacing:-0.5pt; line-height:1;">${profile.campus || 'SCHOOL'}</div>`;

  const imagesHtml = report.images && report.images.length
    ? `<tr><td colspan="6" style="padding:8pt 6pt 0; border:none;">
         <div style="font-size:7pt; font-weight:700; text-transform:uppercase; letter-spacing:0.4pt; color:#334155; margin-bottom:5pt; border-left:2.5pt solid #1a56db; padding-left:5pt;">Documentation / Photos</div>
         <div style="display:flex; flex-wrap:wrap; gap:6pt;">
           ${report.images.map(img =>
             `<img src="http://localhost/OJT-Tracker/frontend/${img}" style="width:130pt; height:88pt; object-fit:cover; border:0.75pt solid #ccc; border-radius:2pt;" onerror="this.style.display='none'"/>`
           ).join('')}
         </div>
       </td></tr>` : '';

  return `
  <div class="sti-page">
    <table style="width:100%; border-collapse:collapse; border-bottom:2pt solid #1a1a2e; margin-bottom:0; padding-bottom:6pt;">
      <tr>
        <td style="width:130pt; vertical-align:middle; padding:0 0 6pt 0;">${logoHtml}</td>
        <td style="vertical-align:middle; text-align:right; padding:0 0 6pt 0;">
          <div style="font-size:16pt; font-weight:900; color:#1a1a2e; letter-spacing:1pt; text-transform:uppercase; line-height:1.1;">${profile.templateTitle}</div>
        </td>
      </tr>
    </table>
    <table class="info-table">
      <tr>
        <td class="lbl" style="width:20%">Last Name</td><td class="val" style="width:30%">${profile.lastName}</td>
        <td class="lbl" style="width:18%">First Name</td><td class="val" style="width:22%">${profile.firstName}</td>
        <td class="lbl" style="width:5%">MI</td><td class="val" style="width:5%">${profile.mi}</td>
      </tr>
      <tr><td class="lbl">STI Campus</td><td class="val" colspan="5">${profile.campus}</td></tr>
      <tr>
        <td class="lbl">Program</td><td class="val">${profile.program}</td>
        <td class="lbl">Year Level</td><td class="val">${profile.yearLevel}</td>
        <td class="lbl">Section</td><td class="val">${profile.section}</td>
      </tr>
      <tr>
        <td class="lbl">Host Company</td><td class="val" colspan="2">${profile.company}</td>
        <td class="lbl">Department Assigned to</td><td class="val" colspan="2">${profile.department}</td>
      </tr>
      <tr>
        <td class="lbl">Schedule (Date):</td><td class="val" colspan="2">${fmtDate(report.week_start)} — ${fmtDate(report.week_end)}</td>
        <td class="lbl">Number of Working Hours:</td><td class="val" colspan="2"></td>
      </tr>
      ${imagesHtml}
    </table>
    <div style="margin-top:10pt;">
      <p style="font-size:9pt; font-weight:800; margin:0 0 2pt 0; color:#1a1a2e;">Weekly Accomplishments</p>
      <p style="font-size:8pt; font-style:italic; color:#555; margin:0 0 6pt 0; line-height:1.4;">The student trainee should give a summary of the tasks performed during the week and how it was accomplished.</p>
      <div class="accomplishments-area">${report.description.replace(/\n/g, '<br/>')}</div>
    </div>
    <table style="width:100%; margin-top:14pt; border-collapse:collapse;">
      <tr>
        <td style="width:50%; padding-right:20pt; vertical-align:bottom;">
          <p style="font-size:8pt; font-weight:600; color:#334155; margin:0 0 2pt 0;">Reviewed by:</p>
          <div style="border-bottom:1pt solid #000; height:20pt; margin-bottom:3pt;"></div>
          <p style="font-size:8pt; color:#555; margin:0;">OJT Supervisor Signature</p>
          ${profile.supervisor ? `<p style="font-size:7.5pt; color:#888; margin:2pt 0 0 0;">${profile.supervisor}</p>` : ''}
        </td>
        <td style="width:50%; padding-left:20pt; vertical-align:bottom;">
          <p style="font-size:8pt; font-weight:600; color:#334155; margin:0 0 2pt 0;">Date</p>
          <div style="border-bottom:1pt solid #000; height:20pt;"></div>
        </td>
      </tr>
    </table>
    <div style="margin-top:auto; padding-top:10pt; border-top:0.75pt solid #ccc; display:flex; justify-content:space-between; font-size:7pt; color:#94a3b8;">
      <span>FT-CRD-167-00 | Weekly Journal Template | Page ${reportNumber} of ${totalReports}</span>
      <span>Submitted: ${new Date(report.submitted_at).toLocaleDateString('en-US', { dateStyle: 'medium' })}</span>
    </div>
  </div>`;
}

function buildPrintDocument(reports) {
  const profile    = getProfile();
  const logoBase64 = localStorage.getItem('ojt_logo') || '';
  const pages      = reports.map((r, i) => buildSTIPage(r, i + 1, reports.length, profile, logoBase64)).join('');

  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"/>
<title>${profile.templateTitle} — ${profile.firstName} ${profile.lastName}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'Plus Jakarta Sans','Segoe UI',Arial,sans-serif;font-size:9pt;color:#111;background:#f1f5f9;}
.sti-page{width:210mm;min-height:297mm;margin:0 auto 20px;background:#fff;padding:16mm 18mm 14mm;display:flex;flex-direction:column;box-shadow:0 2px 20px rgba(0,0,0,.12);}
.info-table{width:100%;border-collapse:collapse;font-size:8.5pt;margin-top:8pt;}
.info-table td{border:.75pt solid #9ca3af;padding:4pt 5pt;}
.lbl{background:#f8fafc;font-weight:700;font-size:7.5pt;color:#374151;white-space:nowrap;}
.val{color:#0f172a;font-weight:600;min-height:16pt;}
.accomplishments-area{border:.75pt solid #9ca3af;border-radius:2pt;padding:8pt 10pt;min-height:180pt;font-size:9pt;line-height:1.75;color:#0f172a;white-space:pre-wrap;word-break:break-word;}
.print-toolbar{position:fixed;top:0;left:0;right:0;background:#0f172a;padding:10px 24px;display:flex;align-items:center;justify-content:space-between;z-index:9999;box-shadow:0 2px 12px rgba(0,0,0,.4);}
.toolbar-title{font-size:13px;font-weight:700;color:#f1f5f9;}.toolbar-title span{color:#60a5fa;}.toolbar-meta{font-size:11px;color:#64748b;margin-left:10px;}
.btn-print{padding:8px 22px;background:#1d4ed8;color:#fff;border:none;border-radius:6px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;gap:6px;}
.btn-print:hover{background:#1e40af;}
.btn-close{padding:8px 16px;background:transparent;color:#64748b;border:1px solid #334155;border-radius:6px;font-size:13px;cursor:pointer;font-family:inherit;margin-left:8px;}
.toolbar-spacer{height:46px;}
@media print{
  body{background:#fff;}
  .print-toolbar,.toolbar-spacer{display:none!important;}
  .sti-page{width:100%;min-height:100vh;margin:0;padding:1.4cm 1.8cm 1.2cm;box-shadow:none;page-break-after:always;}
  .sti-page:last-child{page-break-after:avoid;}
  @page{size:A4 portrait;margin:0;}
}
</style></head><body>
<div class="print-toolbar">
  <div>
    <span class="toolbar-title">📄 ${profile.templateTitle} <span>— ${profile.firstName} ${profile.lastName}</span></span>
    <span class="toolbar-meta">${reports.length} report(s)</span>
  </div>
  <div>
    <button class="btn-print" onclick="window.print()">🖨️ Print / Save as PDF</button>
    <button class="btn-close" onclick="window.close()">✕ Close</button>
  </div>
</div>
<div class="toolbar-spacer"></div>
${pages}
</body></html>`;
}

function exportSinglePDF(index) {
  const report = allReports[index];
  if (!report) return;
  openPrintWindow(buildPrintDocument([report]));
}

function exportAllPDF() {
  if (!allReports.length) return;
  openPrintWindow(buildPrintDocument([...allReports].reverse()));
}

function openPrintWindow(html) {
  const win = window.open('', '_blank', 'width=960,height=850');
  if (!win) { alert('Popup blocked. Please allow popups for localhost to export PDF.'); return; }
  win.document.open();
  win.document.write(html);
  win.document.close();
}