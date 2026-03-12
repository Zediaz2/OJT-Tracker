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

// ════════════════════════════════════════════════════════
//  RICH TEXT EDITOR ENGINE
// ════════════════════════════════════════════════════════

/** Returns innerHTML of a RTE editor, or '' if visually empty */
function getRTEContent(editorId) {
  const el = document.getElementById(editorId);
  if (!el) return '';
  return el.innerText.trim() ? el.innerHTML : '';
}

/** Sets innerHTML of a RTE editor */
function setRTEContent(editorId, html) {
  const el = document.getElementById(editorId);
  if (el) el.innerHTML = html || '';
}

/** Builds and injects a toolbar into .rte-wrapper, wires up all events */
function initRTE(wrapperId, editorId) {
  const wrapper = document.getElementById(wrapperId);
  const editor  = document.getElementById(editorId);
  if (!wrapper || !editor) return;

  // ── Build toolbar HTML ────────────────────────────────
  const toolbar = document.createElement('div');
  toolbar.className = 'rte-toolbar';
  toolbar.dataset.editor = editorId;
  toolbar.innerHTML = `
    <div class="rte-group">
      <button type="button" class="rte-btn rte-btn-bold"      data-cmd="bold"          title="Bold (Ctrl+B)">B</button>
      <button type="button" class="rte-btn rte-btn-italic"    data-cmd="italic"        title="Italic (Ctrl+I)">I</button>
      <button type="button" class="rte-btn rte-btn-underline" data-cmd="underline"     title="Underline (Ctrl+U)">U</button>
      <button type="button" class="rte-btn rte-btn-strike"    data-cmd="strikeThrough" title="Strikethrough">S</button>
    </div>
    <div class="rte-divider"></div>
    <div class="rte-group">
      <select class="rte-select rte-size-select" title="Font Size">
        <option value="">Size</option>
        <option value="1">Small</option>
        <option value="3">Normal</option>
        <option value="4">Large</option>
        <option value="5">X-Large</option>
      </select>
    </div>
    <div class="rte-divider"></div>
    <div class="rte-group">
      <button type="button" class="rte-btn" data-cmd="justifyLeft"   title="Align Left">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></svg>
      </button>
      <button type="button" class="rte-btn" data-cmd="justifyCenter" title="Align Center">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
      </button>
      <button type="button" class="rte-btn" data-cmd="justifyRight"  title="Align Right">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/></svg>
      </button>
      <button type="button" class="rte-btn" data-cmd="justifyFull"   title="Justify">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
      </button>
    </div>
    <div class="rte-divider"></div>
    <div class="rte-group">
      <button type="button" class="rte-btn" data-cmd="insertUnorderedList" title="Bullet List">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6"  r="1.5" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="4" cy="18" r="1.5" fill="currentColor" stroke="none"/></svg>
      </button>
      <button type="button" class="rte-btn" data-cmd="insertOrderedList" title="Numbered List">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><text x="2" y="8"  font-size="7" fill="currentColor" stroke="none" font-family="sans-serif">1.</text><text x="2" y="14" font-size="7" fill="currentColor" stroke="none" font-family="sans-serif">2.</text><text x="2" y="20" font-size="7" fill="currentColor" stroke="none" font-family="sans-serif">3.</text></svg>
      </button>
    </div>
    <div class="rte-divider"></div>
    <div class="rte-group">
      <button type="button" class="rte-btn" data-cmd="removeFormat" title="Clear Formatting"
              style="font-size:0.7rem; gap:3px; padding:0 7px;">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5l7 14H5L12 5z"/><line x1="3" y1="21" x2="21" y2="21"/></svg>
        Clear
      </button>
    </div>`;

  wrapper.insertBefore(toolbar, editor);

  // ── Toolbar button clicks (mousedown to preserve selection) ──
  toolbar.addEventListener('mousedown', e => {
    const btn = e.target.closest('[data-cmd]');
    if (!btn || btn.tagName === 'SELECT') return;
    e.preventDefault();   // keeps editor focused
    const cmd = btn.dataset.cmd;
    document.execCommand(cmd, false, null);
    editor.focus();
    syncToolbarState(toolbar);
  });

  // ── Font size select ──
  const sizeSelect = toolbar.querySelector('.rte-size-select');
  if (sizeSelect) {
    sizeSelect.addEventListener('mousedown', e => e.stopPropagation()); // don't blur editor
    sizeSelect.addEventListener('change', () => {
      if (sizeSelect.value) {
        editor.focus();
        document.execCommand('fontSize', false, sizeSelect.value);
      }
      sizeSelect.value = '';  // reset so same option can be re-applied
      syncToolbarState(toolbar);
    });
  }

  // ── Sync active states on caret move ──
  const sync = () => {
    if (document.activeElement === editor || wrapper.contains(document.activeElement))
      syncToolbarState(toolbar);
  };
  editor.addEventListener('keyup',   sync);
  editor.addEventListener('mouseup', sync);
  editor.addEventListener('focus',   sync);
  document.addEventListener('selectionchange', sync);
}

function syncToolbarState(toolbar) {
  const toggleCmds = [
    'bold','italic','underline','strikeThrough',
    'justifyLeft','justifyCenter','justifyRight','justifyFull',
    'insertUnorderedList','insertOrderedList'
  ];
  toggleCmds.forEach(cmd => {
    const btn = toolbar.querySelector(`[data-cmd="${cmd}"]`);
    if (btn) btn.classList.toggle('active', document.queryCommandState(cmd));
  });
}

// Separate file queues — files are APPENDED, never replaced
let submitFileQueue = [];   // for the New Report form
let editFileQueue   = [];   // for the Edit Report modal

/**
 * De-duplicates by name+size, appends only new files to a queue,
 * re-renders the preview grid, and updates the badge.
 */
function addToQueue(newFiles, queue, previewId, countId) {
  const existing = new Set(queue.map(f => f.name + f.size));
  Array.from(newFiles).forEach(f => {
    if (f.type.startsWith('image/') && !existing.has(f.name + f.size)) {
      queue.push(f);
      existing.add(f.name + f.size);
    }
  });
  renderQueue(queue, previewId, countId);
}

/**
 * Removes a file from the queue by index and re-renders.
 */
function removeFromQueue(index, queue, previewId, countId) {
  queue.splice(index, 1);
  renderQueue(queue, previewId, countId);
}

/**
 * Renders all queued files as thumbnail cards with a ✕ remove button.
 */
function renderQueue(queue, previewId, countId) {
  const grid = document.getElementById(previewId);
  const badge = document.getElementById(countId);

  grid.innerHTML = '';

  queue.forEach((file, i) => {
    const reader = new FileReader();
    reader.onload = e => {
      const wrap = document.createElement('div');
      wrap.className = 'image-preview-thumb';

      const img = document.createElement('img');
      img.src = e.target.result;
      img.title = file.name;
      img.onclick = () => openLightbox(e.target.result);

      const btn = document.createElement('button');
      btn.className = 'preview-remove-btn';
      btn.innerHTML = '✕';
      btn.title = 'Remove this image';
      btn.onclick = ev => {
        ev.stopPropagation();
        // re-calculate index at click time (queue may have shifted)
        const currentIndex = queue.indexOf(file);
        if (currentIndex !== -1) removeFromQueue(currentIndex, queue, previewId, countId);
      };

      wrap.appendChild(img);
      wrap.appendChild(btn);
      grid.appendChild(wrap);
    };
    reader.readAsDataURL(file);
  });

  // Update badge
  if (badge) {
    if (queue.length > 0) {
      badge.textContent = `📎 ${queue.length} image${queue.length > 1 ? 's' : ''} queued`;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }
}

/**
 * Wires up a drop zone: click-to-browse + full drag & drop support.
 */
function initDropZone(zoneId, inputId, queue, previewId, countId) {
  const zone  = document.getElementById(zoneId);
  const input = document.getElementById(inputId);
  if (!zone || !input) return;

  // Click anywhere on the zone to open file picker
  zone.addEventListener('click', () => input.click());

  // File picker selection — APPEND to queue
  input.addEventListener('change', function () {
    if (this.files.length) {
      addToQueue(this.files, queue, previewId, countId);
      this.value = ''; // reset so same file can be re-added after removal
    }
  });

  // Drag events
  zone.addEventListener('dragenter', e => {
    e.preventDefault(); e.stopPropagation();
    zone.classList.add('drag-over');
  });
  zone.addEventListener('dragover', e => {
    e.preventDefault(); e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    zone.classList.add('drag-over');
  });
  zone.addEventListener('dragleave', e => {
    e.preventDefault(); e.stopPropagation();
    // Only remove class if leaving the zone entirely (not a child element)
    if (!zone.contains(e.relatedTarget)) {
      zone.classList.remove('drag-over');
    }
  });
  zone.addEventListener('drop', e => {
    e.preventDefault(); e.stopPropagation();
    zone.classList.remove('drag-over');
    if (e.dataTransfer.files.length) {
      addToQueue(e.dataTransfer.files, queue, previewId, countId);
    }
  });
}

// ── Initialise both zones and both RTEs on DOM ready ─────
document.addEventListener('DOMContentLoaded', () => {
  // Build RTE toolbars
  initRTE('rte-submit', 'report_desc_editor');
  initRTE('rte-edit',   'edit_desc_editor');

  initDropZone('submit-drop-zone', 'report_images',  submitFileQueue, 'image-preview',   'submit-file-count');
  initDropZone('edit-drop-zone',   'edit-new-images', editFileQueue,   'edit-new-preview', 'edit-file-count');

  // Close modals on overlay click
  document.getElementById('edit-modal-overlay').addEventListener('click', function(e) {
    if (e.target === this) closeEditModal();
  });
  document.getElementById('delete-modal-overlay').addEventListener('click', function(e) {
    if (e.target === this) closeDeleteModal();
  });

  loadReports();
});

// ════════════════════════════════════════════════════════
//  SUBMIT NEW REPORT
// ════════════════════════════════════════════════════════
function submitReport() {
  const week_start    = document.getElementById('week_start').value;
  const week_end      = document.getElementById('week_end').value;
  const title         = document.getElementById('report_title').value.trim();
  const description   = getRTEContent('report_desc_editor');
  const working_hours = parseFloat(document.getElementById('report_hours').value) || 0;
  const statusEl      = document.getElementById('report-status');

  if (!week_start || !week_end || !title || !description) {
    showAlert(statusEl, 'Please complete all required fields before submitting.', 'error'); return;
  }
  if (week_start > week_end) {
    showAlert(statusEl, 'Week end date must be after the week start date.', 'error'); return;
  }

  fetch(`${API}/reports/create_report.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: user.id, week_start, week_end, title, description, working_hours })
  })
  .then(r => r.json())
  .then(data => {
    if (!data.success) { showAlert(statusEl, data.error, 'error'); return; }

    const report_id = data.report_id;
    const files     = submitFileQueue;   // use accumulated queue

    if (!files.length) {
      showAlert(statusEl, '✓ Report submitted successfully.', 'success');
      clearForm(); loadReports(); return;
    }

    const formData = new FormData();
    formData.append('report_id', report_id);
    files.forEach(f => formData.append('images[]', f));

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
  ['week_start','week_end','report_title','report_hours','report_images'].forEach(id => {
    document.getElementById(id).value = '';
  });
  setRTEContent('report_desc_editor', '');
  submitFileQueue.length = 0;
  document.getElementById('image-preview').innerHTML = '';
  document.getElementById('submit-file-count').classList.add('hidden');
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

      // Show/hide toolbar and Export All button
      const toolbar   = document.getElementById('reports-toolbar');
      const exportBtn = document.getElementById('export-btn');
      if (toolbar)   toolbar.style.display   = allReports.length ? 'flex' : 'none';
      if (exportBtn) exportBtn.style.display = allReports.length ? 'inline-flex' : 'none';

      filterAndRender();
    })
    .catch(() => {
      document.getElementById('reports-list').innerHTML = `
        <div class="empty-state card">
          <h3>Unable to load reports</h3>
          <p>Please ensure XAMPP is running and the database is configured correctly.</p>
        </div>`;
    });
}

// ── Apply search + sort, then render ─────────────────────
function filterAndRender() {
  const query     = (document.getElementById('report-search')?.value || '').trim().toLowerCase();
  const sortKey   = document.getElementById('report-sort')?.value || 'newest';
  const clearBtn  = document.getElementById('search-clear');
  const countEl   = document.getElementById('reports-count');

  // Toggle clear button visibility
  if (clearBtn) clearBtn.classList.toggle('hidden', !query);

  // 1. Filter
  let list = allReports.filter(r => {
    if (!query) return true;
    const plainDesc = r.description.replace(/<[^>]*>/g, '').toLowerCase();
    return (
      r.title.toLowerCase().includes(query)  ||
      plainDesc.includes(query)              ||
      r.week_start.includes(query)           ||
      r.week_end.includes(query)
    );
  });

  // 2. Sort
  list = [...list].sort((a, b) => {
    switch (sortKey) {
      case 'oldest':    return new Date(a.week_start) - new Date(b.week_start);
      case 'newest':    return new Date(b.week_start) - new Date(a.week_start);
      case 'title-az':  return a.title.localeCompare(b.title);
      case 'title-za':  return b.title.localeCompare(a.title);
      case 'hours-desc':return (parseFloat(b.working_hours) || 0) - (parseFloat(a.working_hours) || 0);
      case 'hours-asc': return (parseFloat(a.working_hours) || 0) - (parseFloat(b.working_hours) || 0);
      default:          return 0;
    }
  });

  // 3. Update count badge
  if (countEl) {
    const isFiltered = !!query;
    if (allReports.length > 0) {
      countEl.classList.remove('hidden', 'filtered');
      countEl.textContent = isFiltered
        ? `${list.length} of ${allReports.length} report${allReports.length !== 1 ? 's' : ''}`
        : `${allReports.length} report${allReports.length !== 1 ? 's' : ''}`;
      if (isFiltered) countEl.classList.add('filtered');
    } else {
      countEl.classList.add('hidden');
    }
  }

  renderReports(list);
}

function clearSearch() {
  const input = document.getElementById('report-search');
  if (input) input.value = '';
  filterAndRender();
  input?.focus();
}

// ── Render a given list of reports ───────────────────────
function renderReports(list) {
  const container = document.getElementById('reports-list');

  if (!allReports.length) {
    container.innerHTML = `
      <div class="empty-state card">
        <div class="empty-state-icon">📄</div>
        <h3>No reports submitted yet</h3>
        <p>Click "New Report" to create your first weekly journal entry.</p>
      </div>`;
    return;
  }

  if (!list.length) {
    container.innerHTML = `
      <div class="card no-results-state">
        <div class="no-results-icon">🔍</div>
        <h3>No reports match your search</h3>
        <p>Try different keywords or <a href="#" onclick="clearSearch();return false;" style="color:var(--primary);">clear the search</a>.</p>
      </div>`;
    return;
  }

  container.innerHTML = list.map((r, i) => `
    <div class="card" style="border-left:3px solid var(--primary); margin-bottom:1rem; animation: fadeUp 0.2s ease ${i * 0.04}s both;">

      <!-- Header row -->
      <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:0.5rem; margin-bottom:0.75rem;">
        <div>
          <div style="font-size:0.68rem; font-weight:700; text-transform:uppercase; letter-spacing:0.07em; color:var(--text-muted); margin-bottom:0.3rem;">
            ${r.title}
          </div>
          <div style="font-size:0.78rem; color:var(--text-muted); font-weight:500;">
            ${fmtDateShort(r.week_start)} — ${fmtDateShort(r.week_end)}
            ${r.working_hours ? `<span style="margin-left:0.4rem; color:var(--primary); font-weight:700;">· ${r.working_hours} hrs</span>` : ''}
          </div>
        </div>

        <!-- Action buttons -->
        <div style="display:flex; align-items:center; gap:0.4rem; flex-wrap:wrap;">
          <!-- Export PDF -->
          <button onclick="exportSinglePDF(${r.id})"
            class="rpt-action-btn" title="Export as PDF"
            style="color:var(--primary);"
            onmouseover="this.style.background='var(--primary-light)';this.style.borderColor='var(--primary)'"
            onmouseout="this.style.background='#fff';this.style.borderColor='var(--border)'">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export
          </button>

          <!-- Edit -->
          <button onclick="openEditModal(${r.id})"
            class="rpt-action-btn" title="Edit report"
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
          <button onclick="openDeleteModal(${r.id})"
            class="rpt-action-btn" title="Delete report"
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
      <div class="rte-content" style="margin-bottom:${r.images && r.images.length ? '0.75rem' : '0'};">${r.description}</div>

      <!-- Images -->
      ${r.images && r.images.length ? `
        <div class="image-preview-grid" style="margin-bottom:0.75rem;">
          ${r.images.map(img => `
            <div class="image-preview-thumb">
              <img src="http://localhost/OJT-Tracker/frontend/${img}"
                   alt="documentation" onclick="openLightbox(this.src)"
                   onerror="this.parentElement.style.display='none'"/>
            </div>
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
}

// Short date helper for the card header (e.g. "Mar 2, 2026")
function fmtDateShort(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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

function openEditModal(id) {
  const r = allReports.find(r => r.id == id);
  if (!r) return;

  editImagesToRemove = [];
  editFileQueue.length = 0;

  document.getElementById('edit-report-id').value    = r.id;
  document.getElementById('edit-week-start').value   = r.week_start;
  document.getElementById('edit-week-end').value     = r.week_end;
  document.getElementById('edit-title').value        = r.title;
  document.getElementById('edit-hours').value        = r.working_hours || '';
  setRTEContent('edit_desc_editor', r.description);
  document.getElementById('edit-new-images').value   = '';
  document.getElementById('edit-new-preview').innerHTML = '';
  document.getElementById('edit-file-count').classList.add('hidden');
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
  editFileQueue.length = 0;
  document.getElementById('edit-new-preview').innerHTML = '';
  document.getElementById('edit-file-count').classList.add('hidden');
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
  const id            = document.getElementById('edit-report-id').value;
  const week_start    = document.getElementById('edit-week-start').value;
  const week_end      = document.getElementById('edit-week-end').value;
  const title         = document.getElementById('edit-title').value.trim();
  const description   = getRTEContent('edit_desc_editor');
  const working_hours = parseFloat(document.getElementById('edit-hours').value) || 0;
  const statusEl      = document.getElementById('edit-status');
  const btn           = document.getElementById('edit-save-btn');

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
    working_hours,
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

    // Step 2 — upload new images from the queue (if any)
    const newFiles = editFileQueue;
    if (!newFiles.length) {
      showAlert(statusEl, '✓ Report updated successfully.', 'success');
      setTimeout(() => { closeEditModal(); loadReports(); }, 900);
      return;
    }

    const formData = new FormData();
    formData.append('report_id', id);
    newFiles.forEach(f => formData.append('images[]', f));

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
function openDeleteModal(id) {
  const r = allReports.find(r => r.id == id);
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

  // ── Logo block ────────────────────────────────────────
  const logoHtml = logoBase64
    ? `<img src="${logoBase64}" alt="Logo"
           style="max-height:54pt; max-width:110pt; object-fit:contain; display:block;"/>`
    : `<div style="font-size:16pt;font-weight:900;color:#1a1a2e;line-height:1.1;">${profile.campus||'SCHOOL'}</div>`;

  // ── Documentation photos — standalone block, NOT inside the info table ──
  const photosBlock = (report.images && report.images.length)
    ? `<div class="docs-section">
         <div class="section-label">Documentation / Photos</div>
         <div class="photos-grid">
           ${report.images.map(img =>
             `<img src="http://localhost/OJT-Tracker/frontend/${img}"
                   class="doc-photo"
                   onerror="this.style.display='none'"/>`
           ).join('')}
         </div>
       </div>`
    : '';

  return `
<div class="sti-page">

  <!-- ══ HEADER ══ -->
  <div class="page-header-bar">
    <div class="header-logo">${logoHtml}</div>
    <div class="header-title">${profile.templateTitle}</div>
  </div>

  <!-- ══ INFO TABLE ══ -->
  <table class="info-table">
    <colgroup>
      <col style="width:15%"/><col style="width:22%"/>
      <col style="width:13%"/><col style="width:22%"/>
      <col style="width:8%"/> <col style="width:20%"/>
    </colgroup>
    <tr>
      <td class="lbl">Last Name</td>
      <td class="val">${profile.lastName}</td>
      <td class="lbl">First Name</td>
      <td class="val">${profile.firstName}</td>
      <td class="lbl">MI</td>
      <td class="val">${profile.mi}</td>
    </tr>
    <tr>
      <td class="lbl">STI Campus</td>
      <td class="val" colspan="5">${profile.campus}</td>
    </tr>
    <tr>
      <td class="lbl">Program</td>
      <td class="val">${profile.program}</td>
      <td class="lbl">Year Level</td>
      <td class="val">${profile.yearLevel}</td>
      <td class="lbl">Section</td>
      <td class="val">${profile.section}</td>
    </tr>
    <tr>
      <td class="lbl">Host Company</td>
      <td class="val" colspan="2">${profile.company}</td>
      <td class="lbl">Department Assigned to</td>
      <td class="val" colspan="2">${profile.department}</td>
    </tr>
    <tr>
      <td class="lbl">Schedule (Date):</td>
      <td class="val" colspan="2">${fmtDate(report.week_start)} &mdash; ${fmtDate(report.week_end)}</td>
      <td class="lbl">Number of Working Hours:</td>
      <td class="val" colspan="2">${report.working_hours ? report.working_hours + ' hrs' : ''}</td>
    </tr>
  </table>

  <!-- ══ DOCUMENTATION PHOTOS (outside table) ══ -->
  ${photosBlock}

  <!-- ══ ACCOMPLISHMENTS ══ -->
  <div class="accomplishments-section">
    <p class="accomplishments-heading">Weekly Accomplishments</p>
    <p class="accomplishments-instruction">The student trainee should give a summary of the tasks performed during the week and how it was accomplished.</p>
    <div class="accomplishments-box">${report.description}</div>
  </div>

  <!-- ══ BOTTOM BLOCK — always pinned to page bottom ══ -->
  <div class="page-bottom">

    <!-- Signature -->
    <div class="signature-row">
      <div class="sig-block">
        <p class="sig-label">Reviewed by:</p>
        ${profile.supervisor ? `<p class="sig-name">${profile.supervisor}</p>` : ''}
        <div class="sig-line"></div>
        <p class="sig-sublabel">OJT Supervisor Signature</p>
      </div>
      <div class="sig-block">
        <p class="sig-label">Date</p>
        ${profile.supervisor ? `<p class="sig-name" style="visibility:hidden;">&nbsp;</p>` : ''}
        <div class="sig-line"></div>
      </div>
    </div>

    <!-- Footer -->
    <div class="page-footer">
      <span>FT-CRD-167-00 &nbsp;|&nbsp; Weekly Journal Template &nbsp;|&nbsp; Page ${reportNumber} of ${totalReports}</span>
      <span>Submitted: ${new Date(report.submitted_at).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })}</span>
    </div>

  </div>

</div>`;
}

function buildPrintDocument(reports) {
  const profile    = getProfile();
  const logoBase64 = localStorage.getItem('ojt_logo') || '';
  const pages      = reports.map((r, i) =>
    buildSTIPage(r, i + 1, reports.length, profile, logoBase64)
  ).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>${profile.templateTitle} — ${profile.firstName} ${profile.lastName}</title>
<style>
/* ── Reset ── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

/* ── Base ── */
body {
  font-family: 'Segoe UI', Arial, sans-serif;
  font-size: 9pt;
  color: #111;
  background: #e8edf2;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

/* ── Page card (screen preview) ── */
.sti-page {
  width: 210mm;
  min-height: 297mm;
  margin: 24px auto;
  background: #fff;
  padding: 15mm 17mm 12mm;
  box-shadow: 0 4px 24px rgba(0,0,0,0.15);
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* ── Header bar ── */
.page-header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 7pt;
  border-bottom: 2pt solid #111;
  margin-bottom: 7pt;
}
.header-logo {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}
.header-title {
  font-size: 15pt;
  font-weight: 900;
  color: #111;
  letter-spacing: 0.5pt;
  text-transform: uppercase;
  text-align: right;
  line-height: 1.15;
}

/* ── Info table ── */
.info-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 8pt;
  margin-bottom: 0;
}
.info-table td {
  border: 0.75pt solid #888;
  padding: 3.5pt 5pt;
  vertical-align: middle;
  line-height: 1.3;
}
.lbl {
  background: #f4f6f8;
  font-weight: 700;
  font-size: 7.5pt;
  color: #333;
  white-space: nowrap;
}
.val {
  color: #111;
  font-weight: 500;
  min-height: 15pt;
}

/* ── Documentation photos ── */
.docs-section {
  margin-top: 8pt;
  margin-bottom: 0;
}
.section-label {
  font-size: 7.5pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5pt;
  color: #222;
  border-left: 3pt solid #1a56db;
  padding-left: 5pt;
  margin-bottom: 5pt;
  line-height: 1.4;
}
.photos-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 5pt;
}
.doc-photo {
  width: 100pt;
  height: 70pt;
  max-width: calc(33.33% - 4pt); /* max 3 per row, never overflow */
  object-fit: cover;
  object-position: center;
  border: 0.75pt solid #bbb;
  border-radius: 2pt;
  display: block;
  flex-shrink: 0;
}

/* ── Accomplishments ── */
.accomplishments-section {
  margin-top: 9pt;
  flex: 1;                  /* fills all remaining space between content and page-bottom */
  display: flex;
  flex-direction: column;
}
.accomplishments-heading {
  font-size: 9pt;
  font-weight: 800;
  color: #111;
  margin-bottom: 2pt;
}
.accomplishments-instruction {
  font-size: 7.5pt;
  font-style: italic;
  color: #555;
  margin-bottom: 5pt;
  line-height: 1.5;
}
.accomplishments-box {
  border: none;
  padding: 7pt 9pt;
  font-size: 9pt;
  line-height: 1.7;
  color: #111;
  word-break: break-word;
  flex: 1;
  min-height: 140pt;
}
.accomplishments-box b, .accomplishments-box strong { font-weight: 700; }
.accomplishments-box i, .accomplishments-box em     { font-style: italic; }
.accomplishments-box u      { text-decoration: underline; }
.accomplishments-box s      { text-decoration: line-through; }
.accomplishments-box ul     { list-style: disc;    padding-left: 14pt; margin: 2pt 0; }
.accomplishments-box ol     { list-style: decimal; padding-left: 14pt; margin: 2pt 0; }
.accomplishments-box li     { margin: 1pt 0; }
.accomplishments-box p      { margin: 2pt 0; }
.accomplishments-box font[size="1"] { font-size: 7pt; }
.accomplishments-box font[size="2"] { font-size: 8pt; }
.accomplishments-box font[size="4"] { font-size: 11pt; }
.accomplishments-box font[size="5"] { font-size: 14pt; }
.accomplishments-box font[size="6"] { font-size: 17pt; }

/* ── Bottom block: signature + footer — always anchored to page bottom ── */
.page-bottom {
  margin-top: auto;         /* KEY: pushes this block to the bottom of the flex column */
  padding-top: 0;
}

/* ── Signature ── */
.signature-row {
  display: flex;
  gap: 0;
  margin-top: 14pt;
  align-items: flex-start;
}
.sig-block {
  flex: 1;
  padding-right: 30pt;
}
.sig-block:last-child { padding-right: 0; }
.sig-label {
  font-size: 8pt;
  font-weight: 700;
  color: #222;
  margin-bottom: 16pt;
}
.sig-line {
  border-bottom: 1pt solid #111;
  margin-bottom: 3pt;
  width: 100%;
}
.sig-sublabel {
  font-size: 7.5pt;
  color: #333;
  margin-top: 2pt;
}
.sig-name {
  font-size: 8pt;
  font-weight: 600;
  color: #111;
  margin-bottom: 4pt;
}

/* ── Footer ── */
.page-footer {
  margin-top: 10pt;
  padding-top: 5pt;
  border-top: 0.75pt solid #bbb;
  display: flex;
  justify-content: space-between;
  font-size: 7pt;
  color: #777;
}

/* ── Toolbar (screen only) ── */
.print-toolbar {
  position: fixed;
  top: 0; left: 0; right: 0;
  background: #0f172a;
  padding: 9px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 9999;
  box-shadow: 0 2px 12px rgba(0,0,0,0.4);
}
.toolbar-title { font-size: 13px; font-weight: 700; color: #f1f5f9; }
.toolbar-title span { color: #60a5fa; }
.toolbar-meta { font-size: 11px; color: #64748b; margin-left: 10px; }
.btn-print {
  padding: 8px 22px;
  background: #1d4ed8; color: #fff;
  border: none; border-radius: 6px;
  font-size: 13px; font-weight: 700;
  cursor: pointer; font-family: inherit;
}
.btn-print:hover { background: #1e40af; }
.btn-close {
  padding: 8px 16px;
  background: transparent; color: #64748b;
  border: 1px solid #334155; border-radius: 6px;
  font-size: 13px; cursor: pointer;
  font-family: inherit; margin-left: 8px;
}
.toolbar-spacer { height: 44px; }

/* ── Print overrides ── */
@media print {
  body { background: #fff; }
  .print-toolbar, .toolbar-spacer { display: none !important; }

  .sti-page {
    width: 100%;
    min-height: 297mm;        /* ← MUST keep this so flex fills the full A4 page */
    margin: 0;
    padding: 12mm 15mm 10mm;
    box-shadow: none;
    page-break-after: always;
    break-after: page;
  }
  .sti-page:last-child {
    page-break-after: avoid;
    break-after: avoid;
  }

  /* Prevent these blocks from splitting across pages */
  .accomplishments-box { break-inside: avoid; }
  .page-bottom          { break-inside: avoid; }

  @page {
    size: A4 portrait;
    margin: 0;
  }
}
</style>
</head>
<body>

<!-- Toolbar -->
<div class="print-toolbar">
  <div>
    <span class="toolbar-title">
      📄 ${profile.templateTitle}
      <span>— ${profile.firstName} ${profile.lastName}</span>
    </span>
    <span class="toolbar-meta">${reports.length} report(s)</span>
  </div>
  <div>
    <button class="btn-print" onclick="window.print()">🖨️ Print / Save as PDF</button>
    <button class="btn-close"  onclick="window.close()">✕ Close</button>
  </div>
</div>
<div class="toolbar-spacer"></div>

${pages}

</body>
</html>`;
}

function exportSinglePDF(id) {
  const report = allReports.find(r => r.id == id);
  if (!report) return;
  openPrintWindow(buildPrintDocument([report]));
}

function exportAllPDF() {
  if (!allReports.length) return;
  openPrintWindow(buildPrintDocument([...allReports]));
}

function openPrintWindow(html) {
  const win = window.open('', '_blank', 'width=960,height=850');
  if (!win) { alert('Popup blocked. Please allow popups for localhost to export PDF.'); return; }
  win.document.open();
  win.document.write(html);
  win.document.close();
}