/**
 * Persona Lab - Storage
 * localStorage 持久化管理
 */

const STORAGE_KEYS = {
  GROUPS:       'persona_lab_groups_v1',
  CUSTOM_TAGS:  'persona_lab_custom_tags_v1',
  DRAFT:        'persona_lab_draft_v1'
};

// ─────────────────────────────────────────
// 角色组 CRUD
// ─────────────────────────────────────────
function getAllGroups() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.GROUPS) || '[]');
  } catch { return []; }
}

function saveGroup(group) {
  const groups = getAllGroups();
  const idx = groups.findIndex(g => g.id === group.id);
  group.updatedAt = new Date().toISOString();
  if (idx >= 0) groups[idx] = group;
  else groups.unshift(group);
  localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(groups));
  return group;
}

function getGroupById(id) {
  return getAllGroups().find(g => g.id === id) || null;
}

function deleteGroup(id) {
  const groups = getAllGroups().filter(g => g.id !== id);
  localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(groups));
}

// ─────────────────────────────────────────
// 自定义标签管理
// ─────────────────────────────────────────
const DEFAULT_TAGS = {
  industry: ['零售', '医疗', '教育', '金融', '制造', '政务', '科技', '餐饮', '出行', '文娱'],
  scene:    ['流程创新', '服务设计', '产品研发', '商业模式', '体验优化', '组织变革', '数字化转型'],
  theme:    ['认知负荷', '决策辅助', '老龄化', '数字化', '可持续', '出行', '健康', '情感连接']
};

function getCustomTags() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOM_TAGS) || '{"industry":[],"scene":[],"theme":[]}');
  } catch { return { industry: [], scene: [], theme: [] }; }
}

function addCustomTag(category, tag) {
  const custom = getCustomTags();
  if (!custom[category]) custom[category] = [];
  const trimmed = tag.trim();
  if (trimmed && !custom[category].includes(trimmed)) {
    custom[category].push(trimmed);
    localStorage.setItem(STORAGE_KEYS.CUSTOM_TAGS, JSON.stringify(custom));
  }
  return custom;
}

function getAllTags() {
  const custom = getCustomTags();
  return {
    industry: [...DEFAULT_TAGS.industry, ...custom.industry],
    scene:    [...DEFAULT_TAGS.scene,    ...custom.scene],
    theme:    [...DEFAULT_TAGS.theme,    ...custom.theme]
  };
}

// ─────────────────────────────────────────
// 草稿（生成中的临时角色组）
// ─────────────────────────────────────────
function saveDraft(group) {
  localStorage.setItem(STORAGE_KEYS.DRAFT, JSON.stringify(group));
}

function loadDraft() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.DRAFT));
  } catch { return null; }
}

function clearDraft() {
  localStorage.removeItem(STORAGE_KEYS.DRAFT);
}
