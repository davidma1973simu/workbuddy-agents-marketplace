/**
 * Persona Lab - Data Schema
 * 五类角色数据模型定义
 */

// ─────────────────────────────────────────
// 角色类型常量
// ─────────────────────────────────────────
const PERSONA_TYPES = {
  TARGET_USER:  'target_user',    // 目标用户
  EXTREME_USER: 'extreme_user',   // 极端用户
  STAKEHOLDER:  'stakeholder',    // 利益相关方
  DECISION_MAKER: 'decision_maker', // 高层&业务决策者
  RESOURCE_PROVIDER: 'resource_provider' // 技术&资源提供者
};

const EXTREME_SIDE = {
  HEAVY: 'heavy',   // 重度端 A
  LIGHT: 'light'    // 轻度/拒绝端 B
};

// ─────────────────────────────────────────
// 目标用户 (5模块 21字段)
// ─────────────────────────────────────────
function createTargetUser(overrides = {}) {
  return {
    id: generateId('tu'),
    type: PERSONA_TYPES.TARGET_USER,
    _edited: false,
    _original: null,  // 存储AI原始版本

    // 模块一：基本身份
    m1: {
      name: '',         // 姓名
      age: '',          // 年龄
      occupation: '',   // 职业+行业
      city: '',         // 居住城市
      avatarTag: ''     // 头像标签（一个词描述气质）
    },

    // 模块二：生活方式与行为特点
    m2: {
      lifestyle: '',      // 生活方式
      decisionStyle: '',  // 决策风格
      infoSource: '',     // 信息获取
      typicalBehavior: '' // 典型行为
    },

    // 模块三：需求与痛点
    m3: {
      explicitGoal: '',   // 显性目标
      hiddenNeed: '',     // 隐性需求
      corePain: '',       // 核心痛点
      emotionState: ''    // 情绪状态
    },

    // 模块四：个性、价值观与洞察
    m4: {
      personality: '',    // 个性特征 + 项目中的角色
      coreValues: '',     // 核心价值观 + 对创新的态度
      innerMotivation: '',// 内在动机
      quote: ''           // 一句话 Quote
    },

    // 模块五：标签
    m5: {
      industryTag: '',  // 行业标签
      sceneTag: '',     // 场景标签
      themeTag: ''      // 主题标签
    },

    // 综合介绍（AI 自动生成）
    summary: '',

    // 关联的极端用户 ID
    linkedExtremeUsers: [],

    ...overrides
  };
}

// ─────────────────────────────────────────
// 极端用户 (4模块 10字段)
// ─────────────────────────────────────────
function createExtremeUser(overrides = {}) {
  return {
    id: generateId('eu'),
    type: PERSONA_TYPES.EXTREME_USER,
    side: EXTREME_SIDE.HEAVY,  // heavy | light
    _edited: false,
    _original: null,

    // 模块一：基本身份（轻量）
    m1: {
      name: '',         // 姓名
      ageOccupation: '',// 年龄+职业
      extremeTag: ''    // 极端标签（一个词）
    },

    // 模块二：极端行为
    m2: {
      extremeBehavior: '', // 极端表现
      workaround: ''       // 变通方式
    },

    // 模块三：外显需求与用户启发
    m3: {
      explicitNeed: '',       // 外显需求
      linkedTargetUserId: '', // 对应目标用户 ID
      inspirationForTarget: ''// 对目标用户的启发
    },

    // 模块四：标签（继承目标用户）
    m4: {
      industryTag: '',
      sceneTag: '',
      themeTag: ''
    },

    ...overrides
  };
}

// ─────────────────────────────────────────
// 利益相关方 (2模块 6字段)
// ─────────────────────────────────────────
function createStakeholder(overrides = {}) {
  return {
    id: generateId('sh'),
    type: PERSONA_TYPES.STAKEHOLDER,
    _edited: false,
    _original: null,

    // 模块一：利益方描述
    m1: {
      identityTag: '',  // 身份标签
      coreDemand: '',   // 核心诉求
      influence: 0      // 影响力程度 -3 ~ +3，0为中立
    },

    // 模块二：标签
    m2: {
      industryTag: '',
      sceneTag: '',
      relationTag: ''   // 关系标签（内部/外部/合作方/监管方…）
    },

    ...overrides
  };
}

// ─────────────────────────────────────────
// 高层 & 业务决策者 (2模块 6字段)
// ─────────────────────────────────────────
function createDecisionMaker(overrides = {}) {
  return {
    id: generateId('dm'),
    type: PERSONA_TYPES.DECISION_MAKER,
    _edited: false,
    _original: null,

    // 模块一：决策者描述
    m1: {
      coreConcern: '',        // 核心关切需求
      valueSensitivity: 2,    // 价值敏感度 1~3
      innovationDesire: 2     // 创新突破渴望 1~3
    },

    // 模块二：标签
    m2: {
      industryTag: '',
      sceneTag: '',
      relationTag: '内部决策层'
    },

    ...overrides
  };
}

// ─────────────────────────────────────────
// 技术 & 资源提供者 (2模块 6字段)
// ─────────────────────────────────────────
function createResourceProvider(overrides = {}) {
  return {
    id: generateId('rp'),
    type: PERSONA_TYPES.RESOURCE_PROVIDER,
    _edited: false,
    _original: null,

    // 模块一：资源方描述
    m1: {
      identityTag: '',      // 身份标签
      techMaturity: 2,      // 技术成熟度 1~3
      resourceCompleteness: 2 // 资源完备度 1~3
    },

    // 模块二：标签
    m2: {
      industryTag: '',
      sceneTag: '',
      relationTag: ''
    },

    ...overrides
  };
}

// ─────────────────────────────────────────
// 角色组（一个项目的五类角色集合）
// ─────────────────────────────────────────
function createPersonaGroup(overrides = {}) {
  return {
    id: generateId('pg'),
    projectTheme: '',   // 项目主题
    projectName: '',    // 项目名称（可选，用于与 Eureka 关联）
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),

    // 标签（AI 识别后确认）
    tags: {
      industry: [],
      scene: [],
      theme: []
    },

    // 五类角色
    targetUsers: [],
    extremeUsers: [],
    stakeholders: [],
    decisionMakers: [],
    resourceProviders: [],

    ...overrides
  };
}

// ─────────────────────────────────────────
// 工具函数
// ─────────────────────────────────────────
function generateId(prefix = 'p') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// 深拷贝（用于保存AI原始版本）
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// 标记为已编辑，保存原始版本
function markEdited(persona) {
  if (!persona._original) {
    persona._original = deepClone(persona);
    delete persona._original._edited;
    delete persona._original._original;
  }
  persona._edited = true;
  return persona;
}

// 恢复到AI原始版本
function restoreOriginal(persona) {
  if (!persona._original) return persona;
  const original = deepClone(persona._original);
  original.id = persona.id;
  original._edited = false;
  original._original = null;
  return original;
}
