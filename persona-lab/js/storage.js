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
const TAG_CAP = 16;   // 每个类别最多展示的标签数（默认+自定义合计上限）

const DEFAULT_TAGS = {
  industry: [
    '科技', '医疗', '金融', '教育', '汽车',     // 核心5个
    '零售', '出行', '制造', '餐饮', '政务',      // 常见5个
    '健康科技', '文旅', '消费电子', '养老',       // 细分4个
  ],
  scene: ['产品研发', '服务设计', '体验优化', '流程创新', '数字化转型', '商业模式'],
  theme: ['老龄化', '认知负荷', '决策辅助', '可及性', '信任建立', '智能化体验']
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
  if (!trimmed) return custom;
  // 去重：判断默认标签和自定义标签中都不存在
  const allExisting = [...(DEFAULT_TAGS[category] || []), ...custom[category]];
  if (allExisting.includes(trimmed)) return custom;
  // 每类总数不超过上限（默认+自定义合计）
  if (allExisting.length >= TAG_CAP) {
    // 已满，替换最后一个自定义标签
    if (custom[category].length > 0) custom[category][custom[category].length - 1] = trimmed;
    // 如果全是默认标签，不添加
  } else {
    custom[category].push(trimmed);
  }
  localStorage.setItem(STORAGE_KEYS.CUSTOM_TAGS, JSON.stringify(custom));
  return custom;
}

function getAllTags() {
  const custom = getCustomTags();
  // 合并并去重，每类最多 TAG_CAP 个
  const merge = (def, cus) => {
    const merged = [...new Set([...def, ...cus])];
    return merged.slice(0, TAG_CAP);
  };
  return {
    industry: merge(DEFAULT_TAGS.industry, custom.industry),
    scene:    merge(DEFAULT_TAGS.scene,    custom.scene),
    theme:    merge(DEFAULT_TAGS.theme,    custom.theme)
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

// ─────────────────────────────────────────
// AI 配置管理
// ─────────────────────────────────────────
const AI_CONFIG_KEY = 'persona_lab_ai_config_v1';

/**
 * 获取 AI 配置
 * @returns {{ enabled:boolean, provider:string, apiKey:string, model:string, endpoint:string }}
 */
function getAIConfig() {
  try {
    const cfg = JSON.parse(localStorage.getItem(AI_CONFIG_KEY) || '{}');
    return {
      enabled:  cfg.enabled  || false,
      provider: cfg.provider || 'openai',  // openai | compatible
      apiKey:   cfg.apiKey   || '',
      model:    cfg.model    || 'gpt-4o-mini',
      endpoint: cfg.endpoint || '',        // 留空 = 官方 OpenAI 端点；自定义兼容接口填 URL
    };
  } catch { return { enabled: false, provider: 'openai', apiKey: '', model: 'gpt-4o-mini', endpoint: '' }; }
}

/**
 * 保存 AI 配置
 */
function saveAIConfig(cfg) {
  localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(cfg));
}

