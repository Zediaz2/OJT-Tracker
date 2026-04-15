/**
 * Quill Rich Text Editor Configuration & Integration
 * Handles initialization, Delta serialization, and form integration
 */

let quillEditors = {};

/**
 * Initialize Quill editors with custom toolbar configuration
 * Restricted font sizes: 8px to 24px only
 */
function initQuillEditors() {
  // Custom font size options (8px to 24px only)
  const fontSizeOptions = ['8px', '10px', '12px', '14px', '16px', '18px', '20px', '22px', '24px'];
  Quill.register(Quill.modules.Clipboard);

  // Toolbar configuration for the submit form editor
  const submitToolbarOptions = [
    ['bold', 'italic', 'underline'],
    [{ 'align': ['', 'center', 'right', 'justify'] }],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    [{ 'header': [1, 2, 3, false] }],
    [{ 'size': fontSizeOptions }],
    ['clean']
  ];

  // Initialize submit form editor
  if (document.getElementById('report_editor')) {
    quillEditors.submit = new Quill('#report_editor', {
      theme: 'snow',
      modules: {
        toolbar: submitToolbarOptions
      },
      formats: [
        'bold', 'italic', 'underline',
        'align', 'list',
        'header', 'size',
        'clean'
      ],
      placeholder: 'Summarize the tasks performed during the week and how they were accomplished…'
    });
    
    // Ensure editor is visible and sized correctly
    const reportEditorEl = document.querySelector('#report_editor');
    if (reportEditorEl) {
      reportEditorEl.style.display = 'block';
      reportEditorEl.style.visibility = 'visible';
      reportEditorEl.style.width = '100%';
    }
  }

  // Initialize edit modal editor
  if (document.getElementById('edit_editor')) {
    quillEditors.edit = new Quill('#edit_editor', {
      theme: 'snow',
      modules: {
        toolbar: submitToolbarOptions
      },
      formats: [
        'bold', 'italic', 'underline',
        'align', 'list',
        'header', 'size',
        'clean'
      ],
      placeholder: 'Summarize the tasks performed during the week…'
    });
    
    // Ensure editor is visible and sized correctly
    const editEditorEl = document.querySelector('#edit_editor');
    if (editEditorEl) {
      editEditorEl.style.display = 'block';
      editEditorEl.style.visibility = 'visible';
      editEditorEl.style.width = '100%';
    }
  }

  // Restrict font size selection to 8-24 only
  restrictFontSize();
}

/**
 * Refresh editor display when modal is opened
 * This fixes issues with Quill not properly rendering in hidden containers
 * @param {string} editorKey - 'submit' or 'edit'
 */
function refreshEditorDisplay(editorKey) {
  if (!quillEditors[editorKey]) return;
  
  const editor = quillEditors[editorKey];
  const container = editor.container;
  
  if (container) {
    // Force recalculation
    container.style.visibility = 'hidden';
    container.offsetHeight; // Force reflow
    container.style.visibility = 'visible';
    
    // Ensure the editor has proper dimensions
    container.style.width = '100%';
  }
}

/**
 * Restrict font size dropdown to only show 8px - 24px
 * Prevents users from selecting invalid sizes
 */
function restrictFontSize() {
  const fontSizePickers = document.querySelectorAll('.ql-size');
  fontSizePickers.forEach(picker => {
    const options = picker.querySelectorAll('option');
    // Keep only the options we want (8px to 24px)
    // First option (blank) is removed by Quill, so we're good
  });
}

/**
 * Get editor content as Delta format (Quill native)
 * @param {string} editorKey - 'submit' or 'edit'
 * @returns {object} Delta object
 */
function getEditorDelta(editorKey) {
  if (!quillEditors[editorKey]) return null;
  return quillEditors[editorKey].getContents();
}

/**
 * Get editor content as plain JSON string (for transmission)
 * @param {string} editorKey - 'submit' or 'edit'
 * @returns {string} JSON string of Delta
 */
function getEditorContent(editorKey) {
  const delta = getEditorDelta(editorKey);
  return delta ? JSON.stringify(delta) : '';
}

/**
 * Get editor text content (plain text extraction)
 * @param {string} editorKey - 'submit' or 'edit'
 * @returns {string} Plain text from editor
 */
function getEditorText(editorKey) {
  if (!quillEditors[editorKey]) return '';
  return quillEditors[editorKey].getText().trim();
}

/**
 * Check if editor is empty
 * @param {string} editorKey - 'submit' or 'edit'
 * @returns {boolean} True if empty or whitespace only
 */
function isEditorEmpty(editorKey) {
  return getEditorText(editorKey).length === 0;
}

/**
 * Set editor content from Delta format
 * Safely handles both visible and hidden editors
 * @param {string} editorKey - 'submit' or 'edit'
 * @param {object|string} delta - Delta object or JSON string
 */
function setEditorContent(editorKey, delta) {
  if (!quillEditors[editorKey]) {
    console.warn(`Editor '${editorKey}' not found`);
    return;
  }

  // Handle both object and string input
  let deltaObj;
  if (typeof delta === 'string') {
    try {
      deltaObj = JSON.parse(delta);
    } catch (e) {
      console.warn('Invalid Delta JSON, attempting fallback to plain text');
      // Fallback: treat as plain text
      deltaObj = plainTextToDelta(delta);
    }
  } else if (!delta || typeof delta !== 'object') {
    console.warn('Invalid delta input');
    deltaObj = { ops: [{ insert: '' }] };
  } else {
    deltaObj = delta;
  }

  // Validate basic structure
  if (!deltaObj.ops) {
    deltaObj = { ops: deltaObj || [{ insert: '' }] };
  }

  try {
    quillEditors[editorKey].setContents(deltaObj, 'silent');
  } catch (e) {
    console.error('Error setting editor content:', e);
    quillEditors[editorKey].setText('');
  }
}

/**
 * Clear editor content
 * @param {string} editorKey - 'submit' or 'edit'
 */
function clearEditor(editorKey) {
  if (!quillEditors[editorKey]) return;
  quillEditors[editorKey].setContents({ ops: [{ insert: '' }] }, 'silent');
}

/**
 * Convert Delta to HTML for display
 * This is a client-side conversion utility that matches PHP implementation
 * @param {object|string} delta - Delta object or JSON string
 * @returns {string} HTML string
 */
function deltaToHTML(delta) {
  // Handle string input
  let deltaObj;
  if (typeof delta === 'string') {
    try {
      deltaObj = JSON.parse(delta);
    } catch (e) {
      console.error('Invalid Delta JSON:', e);
      return '';
    }
  } else {
    deltaObj = delta;
  }

  if (!deltaObj || !deltaObj.ops) return '';

  let html = '';
  let inParagraph = false;
  let inList = false;
  let listType = null;
  const ops = deltaObj.ops;

  ops.forEach((op, index) => {
    if (!op.insert) return;

    const text = op.insert;
    const attrs = op.attributes || {};

    // Helper function to escape HTML
    const escapeHTML = (str) => {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    };

    // Handle newlines
    if (text === '\n') {
      // Check if next op has list attribute
      const nextList = (index + 1 < ops.length && ops[index + 1].attributes && ops[index + 1].attributes.list)
        ? ops[index + 1].attributes.list
        : null;

      if (attrs.list && attrs.list) {
        html += '</li>';
        if (!nextList || nextList !== attrs.list) {
          html += attrs.list === 'ordered' ? '</ol>' : '</ul>';
          inList = false;
          listType = null;
        }
      } else {
        if (inParagraph) {
          html += '</p>';
          inParagraph = false;
        }
        if (inList) {
          html += listType === 'ordered' ? '</li></ol>' : '</li></ul>';
          inList = false;
          listType = null;
        }
      }
      return;
    }

    let escapedText = escapeHTML(text);

    // Apply inline formatting
    if (attrs.bold) escapedText = `<strong>${escapedText}</strong>`;
    if (attrs.italic) escapedText = `<em>${escapedText}</em>`;
    if (attrs.underline) escapedText = `<u>${escapedText}</u>`;

    if (attrs.size) {
      escapedText = `<span style="font-size:${attrs.size};">${escapedText}</span>`;
    }

    // Handle lists
    if (attrs.list && attrs.list) {
      if (!inList || listType !== attrs.list) {
        if (inList) {
          html += listType === 'ordered' ? '</ol>' : '</ul>';
        }
        if (inParagraph) {
          html += '</p>';
          inParagraph = false;
        }
        listType = attrs.list;
        html += listType === 'ordered' ? '<ol>' : '<ul>';
        inList = true;
      }
      html += '<li>';
      if (attrs.align && attrs.align !== '') {
        html += `<span style="display:block; text-align:${attrs.align};">${escapedText}</span>`;
      } else {
        html += escapedText;
      }
    }
    // Handle headers
    else if (attrs.header && attrs.header) {
      if (inParagraph) {
        html += '</p>';
        inParagraph = false;
      }
      if (inList) {
        html += listType === 'ordered' ? '</li></ol>' : '</li></ul>';
        inList = false;
        listType = null;
      }
      const level = Math.max(1, Math.min(3, parseInt(attrs.header)));
      html += `<h${level}>${escapedText}</h${level}>`;
    }
    // Regular paragraph
    else {
      if (inList) {
        html += listType === 'ordered' ? '</li></ol>' : '</li></ul>';
        inList = false;
        listType = null;
      }

      if (!inParagraph) {
        if (attrs.align && attrs.align !== '') {
          html += `<p style="text-align:${attrs.align};">${escapedText}`;
        } else {
          html += `<p>${escapedText}`;
        }
        inParagraph = true;
      } else {
        html += escapedText;
      }
    }
  });

  // Close any open tags
  if (inParagraph) html += '</p>';
  if (inList) html += listType === 'ordered' ? '</li></ol>' : '</li></ul>';

  return html;
}

/**
 * Convert plain text to Delta format (for backward compatibility)
 * @param {string} plainText - Plain text content
 * @returns {object} Delta object
 */
function plainTextToDelta(plainText) {
  if (!plainText || typeof plainText !== 'string') return { ops: [{ insert: '' }] };

  const ops = [];
  const lines = plainText.split('\n');

  lines.forEach((line, index) => {
    if (line) {
      ops.push({ insert: line });
    }
    if (index < lines.length - 1) {
      ops.push({ insert: '\n' });
    }
  });

  // Handle empty text
  if (ops.length === 0) {
    ops.push({ insert: '' });
  }

  return { ops };
}

/**
 * Initialize Quill when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
  // Small delay to ensure all elements are fully loaded
  setTimeout(initQuillEditors, 100);
});



