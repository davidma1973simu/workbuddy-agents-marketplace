// ═══════════════ STORAGE MODULE ═══════════════
// 数据持久化、验证和加密功能

const SK = 'eureka_v3';
const TK = 'eureka_trash_v1';

// 基础存储操作
const getAll = () => { 
  try { 
    return JSON.parse(localStorage.getItem(SK) || '[]'); 
  } catch { 
    return []; 
  } 
};

const saveAll = (arr) => {
  try {
    localStorage.setItem(SK, JSON.stringify(arr));
  } catch (e) {
    console.error('保存项目数据失败:', e);
    toast('⚠️ 保存失败：' + (e.name === 'QuotaExceededError' ? '存储空间不足，请删除部分项目' : '数据保存出错'));
  }
};

const getOne = (id) => getAll().find(p => p.id === id);

const upsert = (p) => {
  const validated = validateProject(p);
  if (!validated) {
    console.error('无效的项目数据:', p);
    toast('⚠️ 项目数据格式错误，无法保存');
    return;
  }
  const a = getAll();
  const i = a.findIndex(x => x.id === validated.id);
  if (i >= 0) a[i] = validated;
  else a.unshift(validated);
  saveAll(a);
};

const remove = (id) => saveAll(getAll().filter(p => p.id !== id));

// 回收站操作
const getTrash = () => { 
  try { 
    return JSON.parse(localStorage.getItem(TK) || '[]'); 
  } catch { 
    return []; 
  } 
};

const saveTrash = (arr) => {
  try {
    localStorage.setItem(TK, JSON.stringify(arr));
  } catch (e) {
    console.error('保存回收站数据失败:', e);
    toast('⚠️ 回收站保存失败：' + (e.name === 'QuotaExceededError' ? '存储空间不足' : '数据保存出错'));
  }
};

const trashCount = () => getTrash().length;

// ═══════════════ DATA VALIDATION ═══════════════
function validateProject(p) {
  if (!p || typeof p !== 'object') return null;
  const validated = {
    id: String(p.id || '').trim() || generateId(),
    name: String(p.name || '').trim().slice(0, 100) || '未命名项目',
    brief: String(p.brief || '').trim().slice(0, 500),
    targetUser: String(p.targetUser || '').trim().slice(0, 100),
    status: ['draft', 'in_progress', 'completed', 'archived'].includes(p.status) ? p.status : 'draft',
    progress: Math.min(100, Math.max(0, parseInt(p.progress) || 0)),
    createdAt: p.createdAt || new Date().toISOString().slice(0, 10),
    updatedAt: new Date().toISOString().slice(0, 16)
  };
  ['reveal', 'inspire', 'shape', 'exam', 'projectBrief', 'assets', 'files'].forEach(key => {
    if (p[key] !== undefined) validated[key] = p[key];
  });
  return validated;
}

function sanitizeString(str, maxLength = 1000) {
  if (str == null) return '';
  return String(str).trim().slice(0, maxLength);
}

function generateId() {
  return 'p_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
}

// ═══════════════ ENCRYPTION ═══════════════
const ENC_KEY = 'EurekaDashboard_v1';

function xorEncrypt(text, key = ENC_KEY) {
  if (!text) return '';
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return btoa(result);
}

function xorDecrypt(encrypted, key = ENC_KEY) {
  if (!encrypted) return '';
  try {
    const text = atob(encrypted);
    let result = '';
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
  } catch (e) {
    console.error('解密失败:', e);
    return '';
  }
}

function encryptConfig(config) {
  return {
    ...config,
    apiKey: xorEncrypt(config.apiKey),
    _encrypted: true
  };
}

function decryptConfig(config) {
  if (!config) return null;
  if (config._encrypted) {
    return {
      ...config,
      apiKey: xorDecrypt(config.apiKey),
      _encrypted: undefined
    };
  }
  return config;
}
