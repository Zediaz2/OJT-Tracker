/**
 * OJT Tracker — Vanilla Rich Text Editor
 * ContentEditable-based, zero dependencies
 *
 * Features:
 *  1. Bold, Italic, Underline
 *  2. Align Left, Center, Right, Justify (Full)
 *  3. Ordered / Unordered lists
 *  4. Heading / Paragraph style selector
 *  5. Font size selector (8–24 pt range)
 *  6. Clear formatting
 *  7. Keyboard shortcuts: Ctrl+B/I/U
 *  8. Plain-text paste (prevents style bleed)
 *  9. Active-state sync on every cursor/selection change
 * 10. mousedown.preventDefault() on toolbar → selection preserved
 */

'use strict';

/* ────────────────────────────────────────────────────────
   Registry  –  editorId → { wrapper, toolbar, editor }
──────────────────────────────────────────────────────── */
const _rte = {};

/* ════════════════════════════════════════════════════════
   PUBLIC API
═══════════════════════════════════════════════════════ */

/**
 * Return the editor's HTML content, trimmed of trailing BRs.
 */
function getRTEContent(editorId) {
  const ed = document.getElementById(editorId);
  if (!ed) return '';
  return ed.innerHTML
    .replace(/(<br\s*\/?>\s*)+$/i, '')
    .trim();
}

/**
 * Load content into an editor.
 * Accepts: Delta JSON string (legacy Quill), HTML string, or empty.
 */
function setRTEContent(editorId, content) {
  const ed = document.getElementById(editorId);
  if (!ed) return;

  if (!content) { ed.innerHTML = ''; return; }

  const s = typeof content === 'string' ? content.trim() : '';
  // Looks like Delta JSON from the old Quill editor?
  if (s.startsWith('{') && s.includes('"ops"')) {
    try {
      ed.innerHTML = deltaToHTML(s) || '';
      return;
    } catch (_) { /* fall through and treat as HTML */ }
  }
  ed.innerHTML = content;
}

/**
 * Clear editor content.
 */
function clearRTEContent(editorId) {
  const ed = document.getElementById(editorId);
  if (!ed) return;
  ed.innerHTML = '';
}

/**
 * Returns true when the editor has no visible text.
 */
function isRTEEmpty(editorId) {
  const ed = document.getElementById(editorId);
  if (!ed) return true;
  return (ed.innerText || ed.textContent || '').trim().length === 0;
}

/* ════════════════════════════════════════════════════════
   FONT SIZE SIZES
═══════════════════════════════════════════════════════ */
const FONT_SIZES = ['8pt','9pt','10pt','11pt','12pt','14pt','16pt','18pt','20pt','22pt','24pt'];

/* ════════════════════════════════════════════════════════
   INITIALISE
═══════════════════════════════════════════════════════ */

function initRTE(wrapperId, editorId) {
  const wrapper = document.getElementById(wrapperId);
  const editor  = document.getElementById(editorId);
  if (!wrapper || !editor) {
    console.warn(`[RTE] init failed – wrapper="${wrapperId}" editor="${editorId}"`);
    return;
  }
  const toolbar = wrapper.querySelector('.rte-toolbar');
  if (!toolbar) {
    console.warn(`[RTE] no .rte-toolbar found inside "${wrapperId}"`);
    return;
  }

  _rte[editorId] = { wrapper, toolbar, editor };

  /* ── Build toolbar HTML ──────────────────────────────── */
  toolbar.innerHTML = _buildToolbar();

  /* ── CRITICAL FIX: Prevent blur on toolbar interaction ─
     Without preventDefault here, clicking any button
     fires blur on the editor → selection is cleared →
     execCommand has nothing to format.                   */
  toolbar.addEventListener('mousedown', e => {
    if (e.target.closest('button, label')) {
      e.preventDefault();
    }
    // selects intentionally allowed to blur so the dropdown opens
  });

  /* ── Button clicks (event delegation) ───────────────── */
  toolbar.addEventListener('click', e => {
    const btn = e.target.closest('button[data-cmd]');
    if (!btn) return;
    e.preventDefault();

    const cmd = btn.dataset.cmd;
    editor.focus();

    if (cmd === 'removeFormat') {
      document.execCommand('removeFormat', false, null);
      // Ensure content ends up inside a block element, not a bare text node
      try { document.execCommand('formatBlock', false, 'p'); } catch (_) {}
    } else {
      document.execCommand(cmd, false, null);
    }
    _sync(editorId);
  });

  /* ── Select changes (Heading / Paragraph style & Font Size) ── */
  toolbar.addEventListener('change', e => {
    const sel = e.target.closest('select[data-cmd]');
    if (!sel) return;
    const cmd = sel.dataset.cmd;
    const val = sel.value;

    editor.focus();

    if (cmd === 'formatBlock') {
      try {
        document.execCommand('formatBlock', false, val || 'p');
      } catch (_) {}
      sel.value = '';   // reset so same option can be re-selected

    } else if (cmd === 'fontSize') {
      if (val) _applyFontSize(editor, val);
      sel.value = '';   // reset
    }

    _sync(editorId);
  });

  /* ── Sync active states on cursor / selection change ─── */
  editor.addEventListener('keyup',   () => _sync(editorId));
  editor.addEventListener('mouseup', () => _sync(editorId));
  editor.addEventListener('focus',   () => _sync(editorId));
  editor.addEventListener('selectionchange', () => _sync(editorId));

  /* ── Keyboard shortcuts ──────────────────────────────── */
  editor.addEventListener('keydown', e => {
    if (!(e.ctrlKey || e.metaKey)) return;
    let handled = true;
    switch (e.key.toLowerCase()) {
      case 'b': document.execCommand('bold',      false, null); break;
      case 'i': document.execCommand('italic',    false, null); break;
      case 'u': document.execCommand('underline', false, null); break;
      default:  handled = false;
    }
    if (handled) { e.preventDefault(); _sync(editorId); }
  });

  /* ── Paste: strip to plain text ──────────────────────── */
  editor.addEventListener('paste', e => {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text/plain');
    if (text) document.execCommand('insertText', false, text);
  });
}

/* ════════════════════════════════════════════════════════
   FONT SIZE APPLICATION
   Uses the "sentinel font size 7" technique:
   1. execCommand marks selection with <font size="7">
   2. We swap those nodes out for <span style="font-size:Xpt">
═══════════════════════════════════════════════════════ */

function _applyFontSize(editor, sizeValue) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;

  const range = sel.getRangeAt(0);

  // Collapsed cursor → nothing to wrap; silently ignore
  if (range.collapsed) return;

  // Step 1: apply a sentinel to mark the selection
  document.execCommand('fontSize', false, '7');

  // Step 2: find every <font size="7"> the browser just inserted
  //         and replace with a styled <span>
  const fontNodes = editor.querySelectorAll('font[size="7"]');
  fontNodes.forEach(fontEl => {
    const span = document.createElement('span');
    span.style.fontSize = sizeValue;
    // Move children into the span
    while (fontEl.firstChild) span.appendChild(fontEl.firstChild);
    fontEl.parentNode.replaceChild(span, fontEl);
  });
}

/* ════════════════════════════════════════════════════════
   TOOLBAR HTML
═══════════════════════════════════════════════════════ */

function _buildToolbar() {
  const icon = (path, vb = '0 0 24 24') =>
    `<svg width="14" height="14" viewBox="${vb}" fill="none" stroke="currentColor"
      stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;

  const boldIcon      = icon('<path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>');
  const italicIcon    = icon('<line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/>');
  const underlineIcon = icon('<path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"/><line x1="4" y1="21" x2="20" y2="21"/>');

  // Alignment icons — each has a unique pattern
  const alignL = icon('<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/>');
  const alignC = icon('<line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/>');
  const alignR = icon('<line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/>');
  // Justify: all three lines span the full width
  const alignJ = icon('<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>');

  const ulIcon = icon('<line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1.5" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="4" cy="18" r="1.5" fill="currentColor" stroke="none"/>');
  const olIcon = icon('<line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><text x="2" y="8" stroke="none" fill="currentColor" font-size="6" font-weight="700">1.</text><text x="2" y="14" stroke="none" fill="currentColor" font-size="6" font-weight="700">2.</text><text x="2" y="20" stroke="none" fill="currentColor" font-size="6" font-weight="700">3.</text>');
  const clearIcon = icon('<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>');

  // Font size options
  const fontSizeOptions = FONT_SIZES.map(s =>
    `<option value="${s}">${s.replace('pt', ' pt')}</option>`
  ).join('');

  return `
    <div class="rte-toolbar-group">
      <button class="rte-btn" data-cmd="bold"      title="Bold (Ctrl+B)">${boldIcon}</button>
      <button class="rte-btn" data-cmd="italic"    title="Italic (Ctrl+I)">${italicIcon}</button>
      <button class="rte-btn" data-cmd="underline" title="Underline (Ctrl+U)">${underlineIcon}</button>
    </div>

    <div class="rte-toolbar-group">
      <button class="rte-btn" data-cmd="justifyLeft"   title="Align left">${alignL}</button>
      <button class="rte-btn" data-cmd="justifyCenter" title="Align center">${alignC}</button>
      <button class="rte-btn" data-cmd="justifyRight"  title="Align right">${alignR}</button>
      <button class="rte-btn" data-cmd="justifyFull"   title="Justify (full)">${alignJ}</button>
    </div>

    <div class="rte-toolbar-group">
      <button class="rte-btn" data-cmd="insertUnorderedList" title="Bullet list">${ulIcon}</button>
      <button class="rte-btn" data-cmd="insertOrderedList"   title="Numbered list">${olIcon}</button>
    </div>

    <div class="rte-toolbar-group">
      <select class="rte-select" data-cmd="formatBlock" title="Paragraph style">
        <option value="p"  selected>Normal</option>
        <option value="h1">Heading 1</option>
        <option value="h2">Heading 2</option>
        <option value="h3">Heading 3</option>
      </select>
    </div>

    <div class="rte-toolbar-group">
      <select class="rte-select rte-select--size" data-cmd="fontSize" title="Font size">
        <option value="" disabled selected>Size</option>
        ${fontSizeOptions}
      </select>
    </div>

    <div class="rte-toolbar-group rte-toolbar-group--last">
      <button class="rte-btn rte-btn--clear" data-cmd="removeFormat" title="Clear formatting">
        ${clearIcon} <span>Clear</span>
      </button>
    </div>`;
}

/* ════════════════════════════════════════════════════════
   TOOLBAR SYNC  –  reflect current selection state
═══════════════════════════════════════════════════════ */

const _STATEFUL_CMDS = [
  'bold', 'italic', 'underline',
  'insertUnorderedList', 'insertOrderedList',
  'justifyLeft', 'justifyCenter', 'justifyRight', 'justifyFull',
];

function _sync(editorId) {
  const inst = _rte[editorId];
  if (!inst) return;
  const { toolbar } = inst;

  // Sync button active states
  _STATEFUL_CMDS.forEach(cmd => {
    const btn = toolbar.querySelector(`button[data-cmd="${cmd}"]`);
    if (!btn) return;
    try {
      btn.classList.toggle('active', document.queryCommandState(cmd));
    } catch (_) { /* queryCommandState can throw outside contenteditable */ }
  });

  // Sync font size dropdown to current selection's computed size
  _syncFontSizeSelect(toolbar);
}

/**
 * Try to reflect the font-size of the current selection in the dropdown.
 * Falls back to empty/placeholder if the selection spans multiple sizes.
 */
function _syncFontSizeSelect(toolbar) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;

  const sizeSelect = toolbar.querySelector('select[data-cmd="fontSize"]');
  if (!sizeSelect) return;

  try {
    // Walk up from the anchor node to find a font-size style
    let node = sel.anchorNode;
    while (node && node.nodeType !== Node.ELEMENT_NODE) node = node.parentNode;

    if (node) {
      const computed = window.getComputedStyle(node).fontSize; // e.g. "16px"
      // Convert px → pt (1pt ≈ 1.333px)
      const px = parseFloat(computed);
      if (!isNaN(px)) {
        const pt = Math.round(px / 1.333);
        const match = FONT_SIZES.find(s => parseInt(s) === pt);
        sizeSelect.value = match || '';
        return;
      }
    }
  } catch (_) { /* ignore */ }

  sizeSelect.value = '';
}

/* ════════════════════════════════════════════════════════
   DELTA → HTML  (Quill Delta format, for legacy reports)
═══════════════════════════════════════════════════════ */

/**
 * Convert a Quill Delta (JSON object or string) to HTML.
 * Supports: bold, italic, underline, strike, size, align,
 *           ordered/unordered lists, headers.
 */
function deltaToHTML(delta) {
  if (!delta) return '';

  let obj;
  if (typeof delta === 'string') {
    const s = delta.trim();
    // Not JSON → return as-is (already HTML or plain text)
    if (!s.startsWith('{') && !s.startsWith('[')) return delta;
    try { obj = JSON.parse(s); }
    catch (_) { return delta; }
  } else {
    obj = delta;
  }

  if (!obj || !Array.isArray(obj.ops)) return '';

  const ops = obj.ops;
  let html     = '';
  let inList   = false;
  let listType = null;

  let lineOps = [];

  const renderInline = ops => ops.map(op => {
    let t = _esc(op.insert);
    const a = op.attributes || {};
    if (a.size)      t = `<span style="font-size:${a.size}">${t}</span>`;
    if (a.bold)      t = `<strong>${t}</strong>`;
    if (a.italic)    t = `<em>${t}</em>`;
    if (a.underline) t = `<u>${t}</u>`;
    if (a.strike)    t = `<s>${t}</s>`;
    return t;
  }).join('');

  const closeLists = () => {
    if (inList) {
      html += listType === 'ordered' ? '</ol>' : '</ul>';
      inList = false; listType = null;
    }
  };

  const flushLine = (blockAttrs) => {
    const inner  = renderInline(lineOps);
    lineOps = [];
    const list   = blockAttrs.list;
    const header = blockAttrs.header;
    const align  = blockAttrs.align;
    const style  = align && align !== 'left' ? ` style="text-align:${align}"` : '';

    if (list) {
      const lt = list === 'ordered' ? 'ordered' : 'bullet';
      if (!inList || listType !== lt) {
        closeLists();
        html += lt === 'ordered' ? '<ol>' : '<ul>';
        inList = true; listType = lt;
      }
      html += `<li${style}>${inner || '\u00A0'}</li>`;
    } else if (header) {
      closeLists();
      const lv = Math.min(6, Math.max(1, parseInt(header, 10)));
      html += `<h${lv}${style}>${inner}</h${lv}>`;
    } else {
      closeLists();
      html += `<p${style}>${inner || '<br>'}</p>`;
    }
  };

  for (const op of ops) {
    if (!op.insert) continue;

    if (op.insert === '\n') {
      flushLine(op.attributes || {});
      continue;
    }

    if (typeof op.insert !== 'string') continue;

    const parts = op.insert.split('\n');
    for (let i = 0; i < parts.length; i++) {
      if (parts[i]) {
        lineOps.push({ insert: parts[i], attributes: op.attributes });
      }
      if (i < parts.length - 1) {
        flushLine({});
      }
    }
  }

  if (lineOps.length) flushLine({});
  closeLists();

  return html;
}

function _esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ════════════════════════════════════════════════════════
   DOM-READY BOOTSTRAP
═══════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  // Small delay so reports.html modals are fully parsed
  setTimeout(() => {
    initRTE('rte-submit', 'report_desc_editor');
    initRTE('rte-edit',   'edit_desc_editor');
  }, 80);
});