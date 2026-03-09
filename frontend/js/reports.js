const user = getUser();

// Sidebar
const sn = document.getElementById('sidebar-name');
const sa = document.getElementById('sidebar-avatar');
if (sn) sn.textContent = user.name;
if (sa) sa.textContent = user.name.charAt(0).toUpperCase();

// Store reports globally for PDF export
let allReports = [];

// ── Toggle form visibility ──
function toggleForm() {
  const form = document.getElementById('report-form');
  form.classList.toggle('open');
}

// ── Lightbox ──
function openLightbox(src) {
  document.getElementById('lightbox-img').src = src;
  document.getElementById('lightbox').classList.remove('hidden');
}

// ── Image preview on file select ──
document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('report_images');
  if (input) {
    input.addEventListener('change', function () {
      const preview = document.getElementById('image-preview');
      preview.innerHTML = '';
      Array.from(this.files).forEach(file => {
        const reader = new FileReader();
        reader.onload = e => {
          const img = document.createElement('img');
          img.src = e.target.result;
          img.onclick = () => openLightbox(e.target.result);
          preview.appendChild(img);
        };
        reader.readAsDataURL(file);
      });
    });
  }
  loadReports();
});

// ── Submit report ──
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
      showAlert(statusEl, 'Report submitted successfully.', 'success');
      clearForm(); loadReports(); return;
    }

    // Upload images
    const formData = new FormData();
    formData.append('report_id', report_id);
    Array.from(files).forEach(f => formData.append('images[]', f));

    fetch(`${API}/reports/upload_image.php`, { method: 'POST', body: formData })
    .then(r => r.json())
    .then(() => {
      showAlert(statusEl, 'Report and attachments submitted successfully.', 'success');
      clearForm(); loadReports();
    });
  })
  .catch(() => showAlert(statusEl, 'Failed to connect to the server. Please try again.', 'error'));
}

// ── Clear form fields ──
function clearForm() {
  document.getElementById('week_start').value    = '';
  document.getElementById('week_end').value      = '';
  document.getElementById('report_title').value  = '';
  document.getElementById('report_desc').value   = '';
  document.getElementById('report_images').value = '';
  document.getElementById('image-preview').innerHTML = '';
}

// ── Load and render reports ──
function loadReports() {
  fetch(`${API}/reports/get_reports.php?user_id=${user.id}`)
  .then(r => r.json())
  .then(data => {
    allReports = data.reports || [];
    const container   = document.getElementById('reports-list');
    const exportBtn   = document.getElementById('export-btn');

    // Show/hide export button
    if (exportBtn) exportBtn.style.display = allReports.length ? 'inline-flex' : 'none';

    if (!allReports.length) {
      container.innerHTML = `
        <div class="empty-state card">
          <div class="empty-state-icon">&#128196;</div>
          <h3>No reports submitted yet</h3>
          <p>Click "New Report" to create your first weekly journal entry.</p>
        </div>`;
      return;
    }

    container.innerHTML = allReports.map((r, i) => `
      <div class="card" style="border-left:3px solid var(--primary); margin-bottom:1rem; animation: fadeIn 0.3s ease ${i * 0.06}s both;">
        <div style="font-size:0.7rem; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; color:var(--text-muted); margin-bottom:0.5rem;">
          Report #${allReports.length - i}
        </div>
        <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:0.5rem; margin-bottom:0.75rem;">
          <div style="font-size:0.95rem; font-weight:700; color:var(--text);">${r.title}</div>
          <span class="badge badge-primary">${r.week_start} &mdash; ${r.week_end}</span>
        </div>
        <p style="color:var(--text-muted); line-height:1.7; font-size:0.875rem; margin-bottom:${r.images && r.images.length ? '0.75rem' : '0'}">${r.description}</p>
        ${r.images && r.images.length ? `
          <div class="image-preview-grid" style="margin-bottom:0.75rem;">
            ${r.images.map(img => `
              <img src="http://localhost/OJT-Tracker/frontend/${img}"
                   alt="documentation" onclick="openLightbox(this.src)"
                   onerror="this.style.display='none'"/>
            `).join('')}
          </div>` : ''}
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

// ── Export to PDF via print dialog ──
function exportPDF() {
  if (!allReports.length) return;

  const printArea = document.getElementById('pdf-print-area');
  const now       = new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' });

  printArea.innerHTML = `
    <div class="pdf-doc-header">
      <div>
        <div class="pdf-doc-title">OJT Weekly Reports</div>
        <div style="font-size:9pt; color:#555; margin-top:0.25rem;">${user.name} &mdash; OJT Student</div>
      </div>
      <div class="pdf-doc-meta">
        Generated: ${now}<br/>
        Total Reports: ${allReports.length}
      </div>
    </div>

    ${allReports.map((r, i) => `
      <div class="pdf-entry">
        <div class="pdf-entry-title">${r.title}</div>
        <div class="pdf-entry-dates">Week: ${r.week_start} &mdash; ${r.week_end}</div>
        <div class="pdf-entry-body">${r.description}</div>
        <div class="pdf-entry-submitted">
          Submitted: ${new Date(r.submitted_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
          ${r.images && r.images.length ? ` &nbsp;&bull;&nbsp; ${r.images.length} image attachment(s)` : ''}
        </div>
      </div>
    `).join('')}

    <div class="pdf-footer">
      <span>OJT Tracker &mdash; Internship Monitoring System</span>
      <span>Printed: ${now}</span>
    </div>
  `;

  // Show the print area, trigger print, then hide it
  printArea.style.display = 'block';
  setTimeout(() => {
    window.print();
    printArea.style.display = 'none';
  }, 100);
}