// ═══════════════ UTILS MODULE ═══════════════
// 工具函数、DOM 安全和错误处理

// ═══════════════ DOM SAFETY ═══════════════
function escapeHtml(text) {
  if (text == null) return '';
  const str = String(text);
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function setSafeText(element, text) {
  if (typeof element === 'string') {
    element = document.getElementById(element);
  }
  if (element) {
    element.textContent = text;
  }
}

function createSafeElement(tag, attributes = {}, children = []) {
  const el = document.createElement(tag);
  
  Object.entries(attributes).forEach(([key, value]) => {
    if (key === 'textContent') {
      el.textContent = value;
    } else if (key === 'innerHTML' && typeof value === 'string') {
      el.innerHTML = value;
    } else if (key.startsWith('on') && typeof value === 'function') {
      el.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key === 'className') {
      el.className = value;
    } else if (key === 'dataset') {
      Object.assign(el.dataset, value);
    } else {
      el.setAttribute(key, value);
    }
  });
  
  children.forEach(child => {
    if (typeof child === 'string') {
      el.appendChild(document.createTextNode(child));
    } else if (child instanceof Node) {
      el.appendChild(child);
    }
  });
  
  return el;
}

// ═══════════════ ERROR HANDLING ═══════════════
window.addEventListener('error', (e) => {
  console.error('全局错误:', e.error);
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    toast('⚠️ 发生错误：' + (e.message || '未知错误'));
  }
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('未处理的 Promise 错误:', e.reason);
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    toast('⚠️ 异步操作失败：' + (e.reason?.message || '未知错误'));
  }
});

function showError(message, details = '') {
  console.error('Error:', message, details);
  toast('❌ ' + message);
}

function showWarning(message) {
  console.warn('Warning:', message);
  toast('⚠️ ' + message);
}

// ═══════════════ UI HELPERS ═══════════════
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 3000);
}

function v(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ═══════════════ STRING HELPERS ═══════════════
function truncate(str, maxLength = 100) {
  if (!str) return '';
  str = String(str);
  return str.length > maxLength ? str.slice(0, maxLength) + '...' : str;
}

function slugify(str) {
  return String(str)
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ═══════════════ DATE HELPERS ═══════════════
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('zh-CN');
}

function daysBetween(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
}
