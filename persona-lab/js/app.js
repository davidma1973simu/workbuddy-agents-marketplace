/**
 * Persona Lab - App.js  v1.1
 * 核心交互逻辑：标签筛选、生成、分行渲染、编辑、角色组
 */

// ─────────────────────────────────────────
// 全局状态
// ─────────────────────────────────────────
let currentMode = 'generate';
let currentCatTab = 'user';
let currentGroup = { personas: [], tags: {} };
let allPersonas = [];
let drawerPersonaId = null;
let selectedTags = { industry: [], scene: [], theme: [] };
let extremeRowExpanded = false;   // 极端用户默认折叠

// ─────────────────────────────────────────
// 初始化
// ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  renderSidebarTags();
  loadBrowsePersonas();
});

// ─────────────────────────────────────────
// 模式切换
// ─────────────────────────────────────────
function switchMode(mode) {
  currentMode = mode;
  ['generate','browse','groups'].forEach(m => {
    const el = document.getElementById(`panel-${m}`);
    if (el) el.style.display = m === mode ? 'block' : 'none';
    const tab = document.getElementById(`tab-${m}`);
    if (tab) tab.classList.toggle('active', m === mode);
  });
  if (mode === 'browse') loadBrowsePersonas();
  if (mode === 'groups') renderGroupsList();
}

function switchCatTab(tab) {
  currentCatTab = tab;
  ['user','stakeholder','decision','resource'].forEach(t => {
    document.getElementById(`cattab-${t}`).classList.toggle('active', t === tab);
  });
  renderBrowseCards();
}

// ─────────────────────────────────────────
// 侧边栏标签渲染 + 高亮
// ─────────────────────────────────────────
function renderSidebarTags(highlightTags) {
  // highlightTags: { industry:[], scene:[], theme:[] }  — 生成后反向高亮用
  const tags = getAllTags();
  ['industry','scene','theme'].forEach(cat => {
    const el = document.getElementById(`tag-list-${cat}`);
    if (!el) return;
    el.innerHTML = tags[cat].map(tag => {
      const isChecked   = selectedTags[cat].includes(tag);
      const isHighlight = highlightTags && (highlightTags[cat] || []).includes(tag);
      return `
        <label class="tag-item ${isChecked ? 'checked' : ''} ${isHighlight ? 'highlighted' : ''}">
          <input type="checkbox" ${isChecked ? 'checked' : ''}
            onchange="toggleTagFilter('${cat}','${escHtml(tag)}',this.checked)">
          ${escHtml(tag)}
        </label>`;
    }).join('');
  });
  updateSidebarCreateBtn();
}

function toggleTagFilter(cat, tag, checked) {
  if (checked) {
    if (!selectedTags[cat].includes(tag)) selectedTags[cat].push(tag);
  } else {
    selectedTags[cat] = selectedTags[cat].filter(t => t !== tag);
  }
  updateSidebarCreateBtn();
  if (currentMode === 'browse') renderBrowseCards();
}

function addTag(cat) {
  const input = document.getElementById(`input-${cat}`);
  const val = input.value.trim();
  if (!val) return;
  addCustomTag(cat, val);
  input.value = '';
  renderSidebarTags();
  showToast(`✅ 已添加标签「${val}」`);
}

function handleTagEnter(e, cat) {
  if (e.key === 'Enter') { e.preventDefault(); addTag(cat); }
}

// 侧边栏「基于当前标签创建」按钮显示逻辑
function updateSidebarCreateBtn() {
  const hasSelected = Object.values(selectedTags).some(a => a.length > 0);
  const btn = document.getElementById('sidebar-create-btn');
  if (btn) btn.classList.toggle('visible', hasSelected);
}

// 一键清除：清除主题输入 + 所有已选标签 + 结果区
function clearAll() {
  // 清除主题输入
  const ti = document.getElementById('input-theme-main');
  const bg = document.getElementById('input-background');
  const as = document.getElementById('input-assumption');
  if (ti) ti.value = '';
  if (bg) bg.value = '';
  if (as) as.value = '';
  // 清除标签选择
  selectedTags = { industry: [], scene: [], theme: [] };
  // 清除生成结果
  const resultEl = document.getElementById('generate-result');
  if (resultEl) resultEl.innerHTML = '';
  // 重新渲染标签（取消高亮和选中）
  renderSidebarTags();
  showToast('已清除所有选择');
}

// 无主题模式：基于侧边栏标签直接生成
function generateFromTags() {
  const tags = {
    industry: [...selectedTags.industry],
    scene:    [...selectedTags.scene],
    theme:    [...selectedTags.theme],
  };
  const themeHint = [
    ...tags.industry.slice(0,1),
    ...tags.scene.slice(0,1),
    ...tags.theme.slice(0,1)
  ].join(' · ') || '未命名场景';

  // 切到生成模式
  switchMode('generate');
  // 主题输入框填入提示文本（可编辑）
  const themeInput = document.getElementById('input-theme-main');
  if (themeInput && !themeInput.value.trim()) {
    themeInput.value = themeHint;
  }
  _doGenerate(themeInput ? themeInput.value.trim() || themeHint : themeHint, '', '', tags);
}

// ─────────────────────────────────────────
// ✨ AI 生成流程（直接生成，完成后高亮标签）
// ─────────────────────────────────────────
function startGenerate() {
  const theme = document.getElementById('input-theme-main').value.trim();
  if (!theme) { showToast('请先输入项目主题', 'error'); return; }
  const bg     = document.getElementById('input-background').value.trim();
  const assume = document.getElementById('input-assumption').value.trim();
  // 识别文本标签，再合并侧边栏已勾选标签（用户手动选择优先级最高）
  const autoTags = recognizeTags(theme);
  const merged = {
    industry: [...new Set([...selectedTags.industry, ...autoTags.industry])].slice(0, TAG_MAX_PER_CAT),
    scene:    [...new Set([...selectedTags.scene,    ...autoTags.scene])].slice(0, TAG_MAX_PER_CAT),
    theme:    [...new Set([...selectedTags.theme,    ...autoTags.theme])].slice(0, TAG_MAX_PER_CAT),
  };
  _doGenerate(theme, bg, assume, merged);
}

function _doGenerate(theme, bg, assume, tags) {
  const resultEl = document.getElementById('generate-result');
  const btn = document.getElementById('generate-btn');
  if (btn) { btn.classList.add('loading'); btn.innerHTML = '<span class="spin">⟳</span> 生成中…'; }

  // 骨架屏
  resultEl.innerHTML = `
    <div class="cards-grid" style="margin-top:4px">
      ${[1,2,3,4,5].map(() => `
        <div class="skeleton-card">
          <div class="skeleton" style="height:16px;width:60%;margin-bottom:10px"></div>
          <div class="skeleton" style="height:12px;width:90%;margin-bottom:6px"></div>
          <div class="skeleton" style="height:12px;width:75%;margin-bottom:6px"></div>
          <div class="skeleton" style="height:12px;width:80%"></div>
        </div>`).join('')}
    </div>`;

  setTimeout(() => {
    if (btn) { btn.classList.remove('loading'); btn.innerHTML = '<span>✨</span> 重新生成'; }

    allPersonas = buildDemoPersonas(theme, tags);
    saveDraft({ theme, bg, assume, tags, personas: allPersonas });

    // 渲染4类分行
    resultEl.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin:0 0 14px">
        <div style="font-size:14px;color:var(--text2)">
          已生成 <strong style="color:var(--text)">${allPersonas.length}</strong> 个角色 &nbsp;·&nbsp; <span style="color:var(--text3)">${escHtml(theme)}</span>
        </div>
        <button onclick="saveCurrentGroup()" class="nav-btn primary">💾 保存角色组</button>
      </div>
      <div class="persona-rows" id="persona-rows">
        ${renderPersonaRows(allPersonas)}
      </div>`;

    // 完成后反向高亮左侧标签，并写入标签
    Object.entries(tags).forEach(([cat, arr]) => arr.forEach(t => addCustomTag(cat, t)));
    renderSidebarTags(tags);   // 传入高亮标签

    showToast('✅ 角色组生成完成！极端用户可点击展开');
  }, 1600);
}

// ─────────────────────────────────────────
// 本地标签识别（扩充词库，去重，每类最多6个）
// ─────────────────────────────────────────
const TAG_MAX_PER_CAT = 6;

function recognizeTags(theme) {
  const result = { industry: [], scene: [], theme: [] };
  const text = theme.toLowerCase();

  const industryMap = {
    '医疗':     ['医疗','医院','诊所','健康','医生','患者','药品','护理','临床','手术','康复','慢病','医药'],
    '教育':     ['教育','学校','培训','课程','学习','学生','老师','教学','k12','高校','在线教育','职业培训'],
    '金融':     ['金融','银行','保险','理财','投资','基金','股票','信贷','财富','证券','风控','fintech'],
    '餐饮':     ['餐饮','餐厅','外卖','食物','菜单','厨师','堂食','咖啡','烘焙','食品'],
    '出行':     ['出行','交通','出租','网约','地铁','公交','航空','物流','高铁','共享出行'],
    '汽车':     ['汽车','新能源','电动车','自动驾驶','车联网','智能驾驶','无人驾驶','eV','nev','充电','续航','驾驶辅助','智能座舱','adas','lidar','激光雷达','车规','整车','主机厂','oem','tier1','零部件','电池','bms','ota升级','车型','概念车','功能定义','域控制器','高精地图','l2','l3','l4','辅助驾驶','自动泊车'],
    '科技':     ['科技','互联网','app','软件','数字','saas','平台','ai','人工智能','开发','产品','技术'],
    '制造':     ['制造','工厂','生产','供应链','采购','质检','工人','车间','原材料','工业'],
    '零售':     ['零售','商场','门店','专卖','商店','购物','鞋服','服装','电商','消费'],
    '消费电子': ['消费电子','手机','智能硬件','可穿戴','耳机','家电','智能家居','iot','芯片','平板','笔记本'],
    '政务':     ['政务','政府','公共服务','民生','行政','审批','城市管理','智慧城市','数字政府','公民服务'],
    '健康科技': ['健康科技','运动健康','健身','可穿戴健康','慢病管理','睡眠','心理健康','数字疗法','远程医疗'],
    '养老':     ['老龄','老年','银发','养老','老人','退休','长者','敬老','照护','老化'],
    '房产':     ['房产','地产','装修','租房','二手房','楼盘','物业'],
    '文化娱乐': ['娱乐','游戏','影视','音乐','直播','内容','媒体'],
    '环保':     ['环保','碳中和','双碳','新能源','可持续','绿色','碳排放','清洁能源','储能','光伏','风电'],
  };
  const sceneMap = {
    '产品研发':   ['产品研发','研发','产品设计','创新','原型','mvp','用研','用户研究','设计思维','功能定义','概念定义'],
    '服务设计':   ['服务设计','服务体验','用户体验','客户体验','服务流程'],
    '体验优化':   ['体验优化','体验提升','满意度','成交率','转化率'],
    '流程创新':   ['流程创新','流程优化','效率提升','降本增效'],
    '数字化转型': ['数字化','智能化','数字转型','数字化转型'],
    '商业模式':   ['商业模式','盈利模式','变现','商业创新'],
    '组织管理':   ['组织','管理','团队','人力','协作','绩效'],
    '渠道触点':   ['渠道','触点','线下','线上','全渠道'],
    '安全合规':   ['安全','合规','法规','监管','认证','测试验证','功能安全'],
    '供应链管理': ['供应链','采购','配套','零部件','供应商','tier'],
  };
  const themeMap = {
    '认知负荷':   ['认知','术语','复杂','过载','难懂','信息过载'],
    '决策辅助':   ['决策','选择','成交','购买决策'],
    '老龄化':     ['老龄化','适老','银发','老年用户','长者'],
    '可及性':     ['可及','获取','障碍','门槛','公平'],
    '信任建立':   ['信任','口碑','安全感','透明'],
    '个性化':     ['个性化','定制','差异化','千人千面'],
    '依从性':     ['依从','复诊','坚持','习惯养成'],
    '用户满意度': ['满意度','不满','投诉','好评','nps'],
    '智能化体验': ['智能','ai体验','自动化','无感','预测','语音交互'],
    '安全信任':   ['安全驾驶','功能安全','失效','可靠性','冗余','故障'],
  };

  [[industryMap, result.industry],[sceneMap, result.scene],[themeMap, result.theme]]
    .forEach(([map, arr]) => {
      Object.entries(map).forEach(([tag, kws]) => {
        if (kws.some(k => text.includes(k))) arr.push(tag);
      });
    });

  result.industry = [...new Set(result.industry)].slice(0, TAG_MAX_PER_CAT);
  result.scene    = [...new Set(result.scene)].slice(0, TAG_MAX_PER_CAT);
  result.theme    = [...new Set(result.theme)].slice(0, TAG_MAX_PER_CAT);
  return result;
}

// ─────────────────────────────────────────
// 4类分行渲染
// ─────────────────────────────────────────
const ROW_CONFIG = [
  { key: 'target_user',       label: '目标用户',       icon: '👤', types: ['target_user'],        expandable: false },
  { key: 'extreme_user',      label: '极端用户',       icon: '⚡', types: ['extreme_user'],        expandable: true  },
  { key: 'stakeholder',       label: '利益相关方',     icon: '🌐', types: ['stakeholder','decision_maker'], expandable: false },
  { key: 'resource_provider', label: '技术与资源提供者', icon: '🔧', types: ['resource_provider'],  expandable: false },
];

function renderPersonaRows(personas) {
  return ROW_CONFIG.map(cfg => {
    const cards = personas.filter(p => cfg.types.includes(p.type));
    if (cards.length === 0) return '';
    const isExtreme  = cfg.expandable;
    const isHidden   = isExtreme && !extremeRowExpanded;
    const toggleIcon = isExtreme ? (isHidden ? '▶' : '▼') : '';
    const collapsedClass = isHidden ? 'collapsed' : '';

    return `
      <div class="persona-row row-${cfg.key}">
        <div class="row-header" onclick="${isExtreme ? `toggleExtremeRow()` : ''}">
          <div class="row-accent-bar"></div>
          <span class="row-type-icon">${cfg.icon}</span>
          <span class="row-type-label">${cfg.label}</span>
          <span class="row-count">${cards.length}</span>
          ${isExtreme ? `
            <span style="font-size:12px;color:var(--text3);margin-left:4px">（默认折叠，点击展开）</span>
            <span class="row-toggle ${collapsedClass}">${toggleIcon}</span>
          ` : ''}
        </div>
        <div class="row-cards ${isHidden ? 'hidden' : ''}" id="row-cards-${cfg.key}">
          ${cards.map(p => renderCard(p)).join('')}
        </div>
      </div>`;
  }).join('');
}

function toggleExtremeRow() {
  extremeRowExpanded = !extremeRowExpanded;
  const cardsEl  = document.getElementById('row-cards-extreme_user');
  const toggleEl = cardsEl && cardsEl.closest('.persona-row')?.querySelector('.row-toggle');
  if (cardsEl) cardsEl.classList.toggle('hidden', !extremeRowExpanded);
  if (toggleEl) {
    toggleEl.classList.toggle('collapsed', !extremeRowExpanded);
    toggleEl.textContent = extremeRowExpanded ? '▼' : '▶';
  }
}

// ─────────────────────────────────────────
// 语义驱动的多领域角色知识库 v2.0
// ─────────────────────────────────────────

/**
 * DOMAIN_DB：按行业关键词索引的角色内容库 v2.0
 * 新增领域：汽车/新能源/自动驾驶、消费电子、政务/公共服务、健康科技
 * 每个领域定义：targetUser / extremeHeavy / extremeLight / stakeholders / decisionMaker / resourceProvider
 */
const DOMAIN_DB = {
  // ── 医疗 / 健康
  医疗: {
    keys: ['医疗','医院','诊所','健康','医生','患者','药品','护理','临床','手术','康复','慢病','医药','问诊'],
    targetUser: {
      name: '张桂芳', age: '67岁', occupation: '退休教师', city: '成都', avatarTag: '慢性病患者',
      lifestyle: '每天早晨在小区散步，下午看电视或和邻居聊天，定期复查',
      decisionStyle: '依赖子女和医生建议，自己不敢轻易做决定',
      infoSource: '主治医生、子女推荐、病友群微信消息',
      typicalBehavior: '每次复诊把所有症状写在小本子上，担心漏说，问题很多',
      explicitGoal: '按时复查、控制好血压和血糖',
      hiddenNeed: '希望医生能听完我说的每一句话，不要总是很忙的样子',
      corePain: '每次挂号排队2小时，医生问诊5分钟，说了一堆听不懂的术语就走了',
      emotionState: '焦虑但顺从，害怕麻烦到子女',
      personality: '温和隐忍、依赖性强 · 主要受益者',
      coreValues: '安全感、被关注、家人不担心 · 对简化就诊流程有强需求',
      innerMotivation: '只想好好活着，不拖累孩子',
      quote: '「医生说的我没听清楚，但我不敢再问，怕耽误他时间」',
    },
    extremeHeavy: {
      name: '李明道', ageOccupation: '52岁 · 资深患者/医学爱好者', extremeTag: '自我诊断狂热者',
      extremeBehavior: '就诊前自己在网上查阅大量文献，进诊室就拿出打印的论文和医生讨论，甚至质疑诊断',
      workaround: '自建用药记录表，同时关注多位网络医生，在多家医院反复确认同一诊断',
      explicitNeed: '掌控感、专业认同感',
      heavyInsight: '目标用户同样渴望了解自己的病情，只是没有能力自查——她需要的是「被翻译」而不是「被替代」',
    },
    extremeLight: {
      name: '王小磊', ageOccupation: '35岁 · 互联网从业者', extremeTag: '系统性回避者',
      extremeBehavior: '小病扛着不去，一旦必须就医就极度焦虑，在门口待了10分钟才进去',
      workaround: '常备止痛药自行处理，关注网上轻问诊产品，尽量不去线下医院',
      explicitNeed: '低压力、零排队、不被冷漠对待',
      lightInsight: '目标用户的就医障碍与这类人一样是「流程不透明+情感冷漠」，只是老年人没有替代选项，只能忍受',
    },
    stakeholders: [
      { identityTag: '全科医生/主治医师', coreDemand: '在有限时间内高效诊断，减少反复解释同一问题的负担', influence: 3, relationTag: '核心服务提供方' },
      { identityTag: '护士/诊前分诊员', coreDemand: '流程顺畅不堵塞，患者情绪稳定好管理', influence: 2, relationTag: '流程执行层' },
      { identityTag: '患者家属/子女', coreDemand: '父母得到妥善照护，不用总是亲自陪同', influence: 2, relationTag: '间接受益者' },
      { identityTag: '医院管理层', coreDemand: '提升患者满意度评分和门诊效率，降低投诉', influence: -1, relationTag: '内部监管方' },
    ],
    decisionMaker: { coreConcern: '患者满意度、门诊效率、医疗合规与风险控制', valueSensitivity: 2, innovationDesire: 2 },
    resourceProvider: { identityTag: 'HIS医院信息系统供应商', techMaturity: 3, resourceCompleteness: 2 },
  },

  // ── 教育 / 学习
  教育: {
    keys: ['教育','学校','培训','课程','学习','学生','老师','教学','K12','高校','在线教育','职业培训'],
    targetUser: {
      name: '陈晨晨', age: '14岁', occupation: '初三学生', city: '北京', avatarTag: '备考压力少年',
      lifestyle: '每天7点到校，晚上11点睡觉，周末上数学和英语辅导班',
      decisionStyle: '服从父母和老师安排，私下有自己想学的东西但不敢说',
      infoSource: '老师、父母、同学群、偶尔刷B站学习区',
      typicalBehavior: '课堂上不敢举手提问，下课后悄悄录下老师讲的重点',
      explicitGoal: '中考考上重点高中',
      hiddenNeed: '希望有人告诉我学这些到底有什么用，我喜欢画画但好像没人在乎',
      corePain: '每天刷题感觉没有进步，不知道哪里出了问题，老师没有时间单独辅导',
      emotionState: '焦虑、疲惫、有时会羡慕不补课的同学',
      personality: '内敛、敏感、有自己想法但沉默 · 主要受益者',
      coreValues: '被理解、公平机会、个人特长被看见 · 对个性化学习路径有潜在需求',
      innerMotivation: '想证明自己不是"差生"，只是没找到适合自己的方式',
      quote: '「我不是不想学，就是感觉怎么努力都没用」',
    },
    extremeHeavy: {
      name: '高天宇', ageOccupation: '15岁 · 竞赛生', extremeTag: '超级学霸/内卷极端',
      extremeBehavior: '同时刷3套题、看大学教材，每天睡5小时，把学习当成唯一价值尺度',
      workaround: '自建知识地图，拒绝任何娱乐，把竞赛获奖当作对抗焦虑的唯一方式',
      explicitNeed: '持续领先感和被顶尖学校认可',
      heavyInsight: '目标用户需要的是找到自己的节奏和方向——极端学霸揭示了「卷系统」的逻辑，但大多数学生缺的不是努力，是有意义的目标感',
    },
    extremeLight: {
      name: '沈佳怡', ageOccupation: '14岁 · 学习障碍倾向', extremeTag: '完全脱离者',
      extremeBehavior: '逃课、拒绝写作业、沉迷游戏，认为「读书没用」',
      workaround: '在游戏和短视频里寻找成就感，已经放弃追赶的念头',
      explicitNeed: '被接纳、有成就感的地方',
      lightInsight: '目标用户的沉默和顺从掩盖了和这类学生一样的根本需求——被看见、被理解、找到自己擅长的东西',
    },
    stakeholders: [
      { identityTag: '班主任/任课老师', coreDemand: '整体成绩提升，班级管理压力降低，不增加额外工作量', influence: 2, relationTag: '核心执行层' },
      { identityTag: '家长', coreDemand: '孩子成绩进步、升学有保障，不要让我们感到焦虑', influence: 3, relationTag: '核心决策影响者' },
      { identityTag: '教研组长', coreDemand: '教学质量稳定，不希望创新影响统考成绩', influence: -2, relationTag: '内部保守力量' },
    ],
    decisionMaker: { coreConcern: '升学率、合规性、家长满意度与口碑', valueSensitivity: 3, innovationDesire: 1 },
    resourceProvider: { identityTag: '在线教育平台技术供应商', techMaturity: 3, resourceCompleteness: 3 },
  },

  // ── 金融 / 投资
  金融: {
    keys: ['金融','银行','保险','理财','投资','基金','股票','信贷','风控','财富管理','证券'],
    targetUser: {
      name: '刘雅婷', age: '38岁', occupation: '中学英语教师', city: '杭州', avatarTag: '谨慎理财新手',
      lifestyle: '工作稳定、家庭重心，偶尔和同事聊股票，但从未真正入市',
      decisionStyle: '决策保守，需要很多信息才能行动，最怕亏本',
      infoSource: '银行理财经理推荐、同事口碑、偶尔看财经新闻',
      typicalBehavior: '把钱存在余额宝，看到高收益产品心动但不敢买，总觉得自己不懂',
      explicitGoal: '让存款"跑赢通胀"，给孩子留点教育基金',
      hiddenNeed: '希望有人用简单的话告诉我哪个最安全，不要让我做太多选择',
      corePain: '银行理财经理说了一堆专业术语，我听不懂，最后被推荐了一个我不知道风险的产品',
      emotionState: '谨慎焦虑、渴望安全感',
      personality: '保守务实、风险厌恶 · 主要受益者',
      coreValues: '安全、可预期、不被骗 · 对透明化理财工具有需求',
      innerMotivation: '不想因为不懂金融而让家庭财富缩水',
      quote: '「我只是想让钱稍微多一点，不是要发财，但总是搞不清楚有没有风险」',
    },
    extremeHeavy: {
      name: '周志远', ageOccupation: '45岁 · 私募操盘手', extremeTag: '重度量化投资者',
      extremeBehavior: '每天盯盘12小时，写自己的量化策略，对任何非数据驱动的建议都不屑一顾',
      workaround: '自建数据分析系统，绕过所有传统金融顾问，拒绝银行推销',
      explicitNeed: '极致的信息透明度和执行速度',
      heavyInsight: '目标用户同样渴望信息透明——只是她需要的是"结论清晰"而非"数据详尽"，降低认知门槛才是关键',
    },
    extremeLight: {
      name: '许晓慧', ageOccupation: '30岁 · 自由职业者', extremeTag: '完全回避财务规划者',
      extremeBehavior: '把所有收入存活期，认为"理财都是骗人的"，从不看任何金融类内容',
      workaround: '只在大型国有银行存款，认为低收益换安心',
      explicitNeed: '绝对安全感，无需动脑的简单方案',
      lightInsight: '目标用户的被动和这类人类似——都是被过去的"难懂体验"吓退的，解法是极简化和去除恐惧感',
    },
    stakeholders: [
      { identityTag: '银行理财经理', coreDemand: '完成销售KPI，避免客诉，不想被合规部门追责', influence: -1, relationTag: '核心接触点' },
      { identityTag: '合规/风控部门', coreDemand: '适当性管理，防止客户购买不匹配风险等级的产品', influence: -2, relationTag: '内部监管层' },
      { identityTag: '家庭成员（配偶）', coreDemand: '家庭财务安全，不希望冒险', influence: 2, relationTag: '间接影响者' },
    ],
    decisionMaker: { coreConcern: '客户AUM增长、合规风险、NPS满意度分数', valueSensitivity: 3, innovationDesire: 2 },
    resourceProvider: { identityTag: 'FinTech智能投顾平台服务商', techMaturity: 3, resourceCompleteness: 2 },
  },

  // ── 零售 / 电商
  零售: {
    keys: ['零售','商场','门店','专卖','商店','购物','鞋服','服装','电商','消费','快消','商品'],
    targetUser: {
      name: '林晓雯', age: '32岁', occupation: '市场专员 · 快消行业', city: '上海', avatarTag: '都市休闲风',
      lifestyle: '工作日快节奏，周末逛街健身，偶尔网购',
      decisionStyle: '习惯货比三家，依赖口碑和社交推荐',
      infoSource: '小红书、朋友推荐、偶尔看公众号',
      typicalBehavior: '进店先观察环境，不主动开口，靠感觉做判断',
      explicitGoal: '买一件实用又好看的商品，不超出预算',
      hiddenNeed: '希望有人帮我快速决定，不想显得不懂行',
      corePain: '看不懂产品术语，问了怕被推销，最后离店',
      emotionState: '期待但有点不安',
      personality: '独立、务实、略带完美主义 · 主要受益者',
      coreValues: '真实感、不被套路、性价比 · 对新引导方式开放',
      innerMotivation: '希望通过消费表达自我，但不愿花太多精力',
      quote: '「我不是不想买，就是不知道那些词是什么意思，算了不问了」',
    },
    extremeHeavy: {
      name: '陈建国', ageOccupation: '45岁 · 资深买手', extremeTag: '术语狂热者',
      extremeBehavior: '进店直接报 SKU 编号，逐一考验导购的专业深度',
      workaround: '自建选购电子表格，比导购更了解每款产品的技术参数',
      explicitNeed: '专业认同感和掌控感',
      heavyInsight: '目标用户也渴望「懂行感」，只是更隐性——她不需要专家级知识，但需要能快速「听懂」的信息',
    },
    extremeLight: {
      name: '周静', ageOccupation: '28岁 · 设计师', extremeTag: '完全回避者',
      extremeBehavior: '在门店门口看了30秒直接走，认为「进去就头大」',
      workaround: '完全转向网购，靠买家秀和评论区做购买决策',
      explicitNeed: '零门槛、零压力的选择体验',
      lightInsight: '目标用户的术语恐惧比表面看到的更普遍——信息壁垒在门口就筛走了潜在顾客',
    },
    stakeholders: [
      { identityTag: '一线导购员', coreDemand: '业绩稳定、话术简单不增加培训压力、被客户尊重', influence: -2, relationTag: '内部执行层' },
      { identityTag: '品牌形象顾问', coreDemand: '维护专业品牌调性，不希望「过度简化」损害品牌溢价', influence: -1, relationTag: '外部合作方' },
    ],
    decisionMaker: { coreConcern: '季度成交率提升、培训成本可控、品牌形象不受损', valueSensitivity: 3, innovationDesire: 2 },
    resourceProvider: { identityTag: '门店数字化系统供应商', techMaturity: 3, resourceCompleteness: 2 },
  },

  // ── 出行 / 交通
  出行: {
    keys: ['出行','交通','出租','网约','地铁','公交','航空','物流','共享出行','高铁'],
    targetUser: {
      name: '吴晓明', age: '41岁', occupation: '销售总监', city: '广州', avatarTag: '高频商务出行者',
      lifestyle: '每周至少2次跨城出差，行程紧，经常赶最后一班车/航班',
      decisionStyle: '以效率为第一优先，愿意多花钱换时间',
      infoSource: '同事推荐的App、差旅管理系统、机场广告',
      typicalBehavior: '出行前不断切换APP比价，候车时一直看工作文件',
      explicitGoal: '准时到达，减少不必要的等待和中转',
      hiddenNeed: '希望整个出行过程能静下来，不要有意外需要自己处理',
      corePain: '赶点时各平台信息不同步，遇到问题找不到人处理，白白浪费时间',
      emotionState: '紧张高效，容忍度低',
      personality: '结果导向、急性子 · 主要受益者',
      coreValues: '时间就是钱、可靠 · 对一站式出行整合有强需求',
      innerMotivation: '用更少的精力完成出行，把精力留给真正重要的事',
      quote: '「我不要最便宜的，我要最不出问题的」',
    },
    extremeHeavy: {
      name: '赵国栋', ageOccupation: '55岁 · 资深差旅顾问', extremeTag: '极致效率控',
      extremeBehavior: '每年飞行200次以上，对各航空公司的座位号和登机策略烂熟于心',
      workaround: '自建出行数据库，专门研究如何用最短时间完成最复杂行程',
      explicitNeed: '极致控制感和VIP级别的顺畅体验',
      heavyInsight: '目标用户的核心诉求是「减少不确定性」——极端用户让我们看到，当流程足够透明可控，用户愿意为此付出高溢价',
    },
    extremeLight: {
      name: '田月', ageOccupation: '26岁 · 新入职应届生', extremeTag: '出行焦虑者',
      extremeBehavior: '第一次出差前反复问同事每个细节，提前3小时到机场，中途打了5次客服电话确认',
      workaround: '出行前打印所有信息，全程找人陪同，拒绝自助设备',
      explicitNeed: '全程有人指引，不出任何差错',
      lightInsight: '目标用户老鸟和新手都存在「信息不对称带来的焦虑」——只是程度不同，解法是全流程状态透明化',
    },
    stakeholders: [
      { identityTag: '企业差旅管理部门', coreDemand: '控制出行成本，保证合规报销，减少员工投诉', influence: 2, relationTag: '内部决策影响方' },
      { identityTag: '机场/车站运营方', coreDemand: '客流疏导顺畅，商业营收提升，安全合规', influence: -1, relationTag: '外部合作方' },
    ],
    decisionMaker: { coreConcern: '准时率、用户NPS、合规成本', valueSensitivity: 2, innovationDesire: 3 },
    resourceProvider: { identityTag: '出行大数据与API服务商', techMaturity: 3, resourceCompleteness: 3 },
  },

  // ── 科技 / 互联网
  科技: {
    keys: ['科技','互联网','app','软件','数字','SaaS','平台','AI','人工智能','开发','产品','技术'],
    targetUser: {
      name: '方小桐', age: '28岁', occupation: '中小企业主（餐饮行业）', city: '深圳', avatarTag: '数字化困惑的小老板',
      lifestyle: '每天12小时扑在店里，周末也不休息，手机里下了十几个管理工具但大多没用起来',
      decisionStyle: '决策靠直觉和过去经验，对新工具将信将疑',
      infoSource: '同行交流、抖音广告、偶尔听别人说好就下载',
      typicalBehavior: '下载完工具注册后发现太复杂，放弃，继续用微信记账',
      explicitGoal: '把每天的流水、库存、员工排班管清楚',
      hiddenNeed: '希望工具能告诉我"现在最需要关注什么"，而不是给我一堆数据自己分析',
      corePain: '软件太复杂，员工不会用，培训成本太高，最后都成了摆设',
      emotionState: '疲惫、半信半疑',
      personality: '务实、时间极度紧缺 · 主要受益者',
      coreValues: '简单有效、省时省力 · 对AI辅助决策有潜在需求',
      innerMotivation: '不想因为数字化短板被同行甩在后面，但又怕折腾一场白忙活',
      quote: '「我不是不想用，是真没时间学，用了也不知道有没有用」',
    },
    extremeHeavy: {
      name: '谭志峰', ageOccupation: '35岁 · CTO/技术创始人', extremeTag: '极客型重度用户',
      extremeBehavior: '自己用代码接API改造工具，把所有工具做深度定制，看不起任何"太简单"的产品',
      workaround: '自己搭工具，放弃所有现成SaaS，只用裸API',
      explicitNeed: '极致的可定制性和控制权',
      heavyInsight: '目标用户需要的恰恰相反——开箱即用才是价值，复杂度是门槛，不是特权',
    },
    extremeLight: {
      name: '孙桂花', ageOccupation: '58岁 · 夫妻店老板', extremeTag: '完全抗拒数字化者',
      extremeBehavior: '坚持手写账本，认为手机支付已经是科技的极限，拒绝任何"机器管理"的建议',
      workaround: '靠记忆和人情关系管理一切',
      explicitNeed: '熟悉感和安全感，不改变现有习惯',
      lightInsight: '目标用户的犹豫和这类人来自同一根源——数字工具的学习成本远超当前感知到的价值，必须先让价值可见、立竿见影',
    },
    stakeholders: [
      { identityTag: '员工/店长', coreDemand: '工具简单不增加工作量，不要因为新工具被追责', influence: -2, relationTag: '内部执行者' },
      { identityTag: '供应商', coreDemand: '对账清晰、收款准时', influence: 1, relationTag: '外部合作方' },
      { identityTag: '会计/财务外包', coreDemand: '数据格式标准，容易导出', influence: 1, relationTag: '间接使用者' },
    ],
    decisionMaker: { coreConcern: 'ROI可见、导入成本低、员工接受度高', valueSensitivity: 3, innovationDesire: 2 },
    resourceProvider: { identityTag: '云服务与基础设施提供商', techMaturity: 3, resourceCompleteness: 3 },
  },

  // ── 制造 / 供应链
  制造: {
    keys: ['制造','工厂','生产','供应链','采购','质检','工人','车间','原材料','工业'],
    targetUser: {
      name: '郑涛', age: '44岁', occupation: '生产部主任', city: '东莞', avatarTag: '夹在中间的中层',
      lifestyle: '每天7点进车间，晚上开会到10点，手机24小时开着随时处理突发',
      decisionStyle: '向上讨好领导，向下管控工人，决策谨慎避免出错',
      infoSource: '行业展会、老供应商推荐、公司内部培训',
      typicalBehavior: '用微信和Excel管理所有事情，不信任新系统，因为"出了问题我背锅"',
      explicitGoal: '准时交货、减少次品率、不出安全事故',
      hiddenNeed: '希望有一个工具在我出问题之前就提醒我，让我不要总是被动救火',
      corePain: '数据散落在各部门，出了问题各自甩锅，我永远是那个被追问的人',
      emotionState: '疲惫、高度警惕',
      personality: '结果导向、高度风险意识 · 主要受益者',
      coreValues: '稳定、可控、责任清晰 · 对预测预警类工具有强需求',
      innerMotivation: '不想因为信息不透明让自己一直被动挨打',
      quote: '「等我知道出问题了，已经晚了，损失都算我的」',
    },
    extremeHeavy: {
      name: '梁建军', ageOccupation: '50岁 · 工厂总经理', extremeTag: '数据控/极度追责型',
      extremeBehavior: '要求每个环节实时上报数据，每天查看上百张报表，遇到异常立即开追责会',
      workaround: '建了专属数据团队，所有数字手工核对三遍，不信任任何自动化系统',
      explicitNeed: '绝对掌控和问题可追溯',
      heavyInsight: '目标用户对数据的需求来自同样的底层焦虑——不同的是郑涛没有资源建这套体系，他需要的是一个"自动替他盯着"的系统',
    },
    extremeLight: {
      name: '小王（王海）', ageOccupation: '24岁 · 新晋质检员', extremeTag: '规则盲从者',
      extremeBehavior: '只按表格核对，不理解规则背后的逻辑，遇到没见过的情况就不处理等上级',
      workaround: '把不确定的问题统统标记"需核实"，绕过所有需要判断的场景',
      explicitNeed: '清晰指令，没有灰色地带',
      lightInsight: '目标用户的"救火"困境部分源于基层员工缺乏判断能力——整个系统需要既能让有经验的人看到全局，也能让新人知道该做什么',
    },
    stakeholders: [
      { identityTag: '工厂老板/股东', coreDemand: '利润不减少，投入产出比清晰', influence: 3, relationTag: '最终决策者' },
      { identityTag: '采购负责人', coreDemand: '原材料价格稳定，不断货，不背责', influence: 1, relationTag: '上游协同方' },
      { identityTag: '一线工人', coreDemand: '操作简单，不影响工资，不因新系统被扣绩效', influence: -3, relationTag: '系统使用者' },
    ],
    decisionMaker: { coreConcern: '交货准时率、不良品率、合规与人工成本', valueSensitivity: 3, innovationDesire: 1 },
    resourceProvider: { identityTag: 'MES制造执行系统供应商', techMaturity: 2, resourceCompleteness: 2 },
  },

  // ── 餐饮 / 食品
  餐饮: {
    keys: ['餐饮','餐厅','外卖','食物','菜单','厨师','堂食','咖啡','烘焙','食品'],
    targetUser: {
      name: '许晴晴', age: '35岁', occupation: '餐饮连锁区域督导', city: '武汉', avatarTag: '多店管理者',
      lifestyle: '每天巡视5-6家门店，处理投诉、检查食安、培训新员工',
      decisionStyle: '以标准化流程为准则，有问题先查手册再解决',
      infoSource: '总部培训、同行交流群、食品安全检查报告',
      typicalBehavior: '每次巡店填写大量检查表，发现问题拍照记录，汇总给总部',
      explicitGoal: '所有门店食安合规、出品稳定、无重大投诉',
      hiddenNeed: '希望总部能根据我反馈的问题给出具体改进方案，而不是让我自己想',
      corePain: '不同门店问题不一样，但没有工具帮我分析哪个门店最需要关注，全靠感觉',
      emotionState: '责任感强但信息过载',
      personality: '执行力强、高责任感 · 主要受益者',
      coreValues: '标准、稳定、团队执行到位 · 对智能巡店辅助有潜在需求',
      innerMotivation: '希望每家店都和样板店一样，但现实总是差很多',
      quote: '「每家店的问题都不一样，我一个人根本顾不过来」',
    },
    extremeHeavy: {
      name: '林建波', ageOccupation: '48岁 · 连锁餐饮创始人', extremeTag: '极端标准化偏执者',
      extremeBehavior: '把每道菜的烹饪时间精确到秒，每周亲自飞往各地抽查，任何偏差都亲自整改',
      workaround: '自建品控团队，拒绝任何加盟商的灵活操作',
      explicitNeed: '绝对一致性和品牌掌控感',
      heavyInsight: '目标用户的"标准化执行"诉求和创始人一致，但执行工具和数据支持的缺失让她无法实现同等效果',
    },
    extremeLight: {
      name: '小陈（陈杰）', ageOccupation: '22岁 · 新晋门店店长', extremeTag: '流程混乱者',
      extremeBehavior: '忘记填检查表，凭感觉管理库存，有投诉第一反应是删差评',
      workaround: '躲避问题，有事全推给上级处理',
      explicitNeed: '有人告诉我每天该做什么，越简单越好',
      lightInsight: '目标用户正在被这类人拖累——标准化工具必须足够简单，让没经验的人也能被系统带着走',
    },
    stakeholders: [
      { identityTag: '门店店长', coreDemand: '少被督导找麻烦，考核指标能完成', influence: -1, relationTag: '核心执行层' },
      { identityTag: '供应商', coreDemand: '订单稳定，结款准时', influence: 1, relationTag: '外部供给方' },
    ],
    decisionMaker: { coreConcern: '食安合规、品牌口碑、门店盈利率', valueSensitivity: 2, innovationDesire: 2 },
    resourceProvider: { identityTag: '餐饮SaaS与IoT供应商', techMaturity: 2, resourceCompleteness: 2 },
  },

  // ── 老龄化 / 银发经济（主题维度）
  老龄化: {
    keys: ['老龄','老年','银发','养老','老人','退休','长者','敬老','照护','老化','老龄化'],
    targetUser: {
      name: '李奶奶（李淑华）', age: '71岁', occupation: '退休工人', city: '南京', avatarTag: '独居老年用户',
      lifestyle: '独居，每天早晨买菜，午休，傍晚和邻居下棋，靠电视了解世界',
      decisionStyle: '不信任陌生事物，习惯依赖子女决策，但子女不在身边',
      infoSource: '子女教的、邻居说的、电视新闻',
      typicalBehavior: '手机主要用来接电话，微信也只看不发，怕点错',
      explicitGoal: '平时能联系上子女，偶尔能买东西，看病方便',
      hiddenNeed: '希望自己还有用，不成为负担，但也希望在需要时有人来',
      corePain: '很多服务都要用手机，但步骤太多，经常操作到一半不知道怎么办',
      emotionState: '孤独但不愿承认，渴望被关注',
      personality: '温和坚忍、自尊心强 · 主要受益者',
      coreValues: '不麻烦人、保持尊严、家人放心 · 对适老化设计有强需求',
      innerMotivation: '希望技术让我更有能力，而不是让我更迷茫',
      quote: '「我不是不想用，就是每次都弄不好，然后就不敢用了」',
    },
    extremeHeavy: {
      name: '王大爷（王建民）', ageOccupation: '78岁 · 前工程师', extremeTag: '科技老玩家',
      extremeBehavior: '自学了智能手机、平板和智能音箱，主动教邻居用微信，对新科技充满好奇',
      workaround: '把操作步骤贴在墙上，建了一个老年人互助学习群',
      explicitNeed: '持续学习新技术，证明老年人也行',
      heavyInsight: '目标用户的障碍不是认知能力不够，而是没有像王大爷一样找到入门路径——适老化设计的关键是"第一步成功"',
    },
    extremeLight: {
      name: '赵奶奶', ageOccupation: '82岁 · 高龄老人', extremeTag: '完全技术拒绝者',
      extremeBehavior: '拒绝使用任何电子设备，连电视遥控器都交给别人操作，认为"那是年轻人的事"',
      workaround: '完全依赖子女和护工代办一切数字化事务',
      explicitNeed: '人对人的照护，不要机器',
      lightInsight: '目标用户的数字化障碍若不被解决，最终将走向完全依赖——适老化设计的终极目标是让独立生活尽可能延长',
    },
    stakeholders: [
      { identityTag: '子女/家属', coreDemand: '父母安全、健康、不给我们添麻烦', influence: 3, relationTag: '间接决策者' },
      { identityTag: '社区服务人员', coreDemand: '服务流程简单、老人好管理', influence: 1, relationTag: '基层执行层' },
      { identityTag: '医疗健康机构', coreDemand: '老年患者依从性好，复诊率高', influence: 2, relationTag: '合作服务方' },
    ],
    decisionMaker: { coreConcern: '服务覆盖率、老人满意度、家属认可度、合规', valueSensitivity: 2, innovationDesire: 2 },
    resourceProvider: { identityTag: '适老化硬件与语音交互技术商', techMaturity: 2, resourceCompleteness: 2 },
  },

  // ── 产品研发 / 创新（场景维度）
  产品研发: {
    keys: ['产品研发','研发','研究','产品设计','创新','原型','MVP','用研','用户研究','设计思维'],
    targetUser: {
      name: '蒋晓东', age: '31岁', occupation: '产品经理（B端SaaS）', city: '北京', avatarTag: '夹在用户与老板之间',
      lifestyle: '每天在需求评审、用户访谈和技术对接之间周转，下班后还要处理Slack消息',
      decisionStyle: '数据驱动但经常被老板直觉推翻，谨慎又需要快速决策',
      infoSource: '用户访谈、数据看板、竞品分析、产品社区',
      typicalBehavior: '每次用户访谈后写满笔记，但整理成文档需要2天，经常超期',
      explicitGoal: '准时交付有价值的产品迭代，获得用户好评和老板认可',
      hiddenNeed: '希望有人或工具帮我把用户声音快速转化成可以说服老板的结论',
      corePain: '用户反馈太多，没有好工具聚合洞察，总是靠感觉写需求文档',
      emotionState: '夹击感强，有时有价值感有时感觉什么都做不了',
      personality: '逻辑强、同理心好、压力耐受 · 主要受益者',
      coreValues: '用户价值、清晰决策、被认可 · 对AI辅助分析有高需求',
      innerMotivation: '想做真正改变用户行为的产品，不只是完成KPI',
      quote: '「用户说的我都记下来了，但到底最重要的是哪一条，真的很难说清楚」',
    },
    extremeHeavy: {
      name: '徐凯文', ageOccupation: '38岁 · 独立产品顾问', extremeTag: '方法论极客',
      extremeBehavior: '每个项目都用最完整的框架，从JTBD到用户旅程图全部手绘精描，访谈做20轮才满意',
      workaround: '自建了一套研究→洞察→决策方法论，把它作为个人品牌',
      explicitNeed: '方法的完整性和可重复性',
      heavyInsight: '目标用户同样渴望系统方法，但缺乏时间——他们需要的是"够用的快速版本"而非"完美的慢速版本"',
    },
    extremeLight: {
      name: '李娜娜', ageOccupation: '26岁 · 初级产品助理', extremeTag: '纯直觉决策者',
      extremeBehavior: '不做用研直接写需求，遇到用户投诉就反驳说"用户不懂产品"',
      workaround: '完全靠自己的使用体验推断用户需求',
      explicitNeed: '结论快、输出快、被认可快',
      lightInsight: '目标用户正在努力避免成为这类人——对研究的不重视源于工具不够好，让研究变简单才能让研究变普遍',
    },
    stakeholders: [
      { identityTag: '研发工程师', coreDemand: '需求清晰、不要频繁改动、技术可行', influence: -2, relationTag: '执行方' },
      { identityTag: '业务/销售团队', coreDemand: '功能能快速帮助成单，不要太复杂', influence: 2, relationTag: '内部需求方' },
      { identityTag: 'C级高管', coreDemand: '产品方向符合战略，数据好看', influence: 3, relationTag: '最终审批者' },
    ],
    decisionMaker: { coreConcern: '产品GMV或DAU增长、功能迭代速度、技术债务', valueSensitivity: 2, innovationDesire: 3 },
    resourceProvider: { identityTag: 'AI研究与分析工具服务商', techMaturity: 3, resourceCompleteness: 3 },
  },

  // ── 汽车 / 新能源 / 自动驾驶
  汽车: {
    keys: ['汽车','新能源','电动车','自动驾驶','车联网','智能驾驶','无人驾驶','充电桩','续航','驾驶辅助','智能座舱','adas','lidar','激光雷达','车规','整车','主机厂','oem','tier1','零部件','电池','bms','ota','车型','概念车','功能定义','域控制器','高精地图','辅助驾驶','自动泊车','新能源汽车','智能汽车'],
    targetUser: {
      name: '陈志远', age: '34岁', occupation: '互联网产品经理 · 新能源车主', city: '上海', avatarTag: '科技尝鲜型车主',
      lifestyle: '工作日通勤+偶尔长途，周末关注汽车科技媒体，活跃于新能源车主论坛',
      decisionStyle: '重视技术参数和真实用车反馈，对品牌官宣持怀疑态度，决策前大量对比真实车主体验',
      infoSource: '懂车帝、抖音车评、B站深度评测、车主群、微博KOL实测',
      typicalBehavior: '购车前问了20位车主，用车中积极参与OTA反馈，在群里分享每次软件更新的实测结果',
      explicitGoal: '希望驾驶辅助系统真正让我省心，城区和高速都能稳定工作，不要总是误触发或突然退出',
      hiddenNeed: '我需要的不是炫技，是在日常场景中真正可靠——我愿意为「放心」付溢价，但要先看到证明',
      corePain: '官方宣称L2+，但实际城区变道、红绿灯路口频繁误操作，比手动驾驶更累也更危险',
      emotionState: '充满期待但带着保护性怀疑，遇到问题会深度研究并主动传播',
      personality: '理性探索型、有传播影响力 · 主要受益者',
      coreValues: '技术真实性、安全可靠、被尊重为早期用户 · 对功能改进闭环有高需求',
      innerMotivation: '想成为「新能源汽车让驾驶更好」这件事的受益者和见证者，不是白老鼠',
      quote: '「我不怕功能不完美，就怕你不说实话——宣传一套，用起来另一套」',
    },
    extremeHeavy: {
      name: '黄工（黄志伟）', ageOccupation: '41岁 · 汽车ADAS工程师/极客车主', extremeTag: '底层数据解析者',
      extremeBehavior: '用OBD接口读取底层数据，自己写脚本分析ADAS响应逻辑，在论坛发布数据报告质疑官方标定',
      workaround: '关闭所有"智能推荐"功能，手动接管，把辅助驾驶当纯数据工具使用，完全不信任黑盒逻辑',
      explicitNeed: '数据透明、行为可预测、完整的系统权限和调试接口',
      heavyInsight: '目标用户对「可靠性」的渴望与此完全一致，只是他没能力自己验证——他需要的是官方可信度证明，而非自行挖掘',
    },
    extremeLight: {
      name: '李阿姨（李秀英）', ageOccupation: '55岁 · 家庭主妇 · 被动换车者', extremeTag: '功能完全回避者',
      extremeBehavior: '新车上所有辅助驾驶功能全部关掉，认为"这些东西不靠谱，出了事没人负责"',
      workaround: '完全依赖传统驾驶习惯，绕开所有屏幕操作，只用倒车影像这一个功能',
      explicitNeed: '清晰的责任归属、操作极简、绝对不出意外',
      lightInsight: '目标用户的信任障碍和这类人来自同一根源——系统「边界」不透明让所有人不安。解法是清晰的能力声明和显式的失效提示',
    },
    stakeholders: [
      { identityTag: '整车产品规划/智驾产品团队', coreDemand: '功能差异化卖点成立，研发资源有限需精准投放，用户数据支撑PRD决策', influence: 3, relationTag: '内部核心决策方' },
      { identityTag: 'ADAS算法与软件工程团队', coreDemand: '需求清晰可实现，不要频繁变更，测试场景有代表性，Fallback逻辑有明确边界', influence: -2, relationTag: '内部执行层（能力约束方）' },
      { identityTag: '监管机构/交通主管部门', coreDemand: '功能合规、道路测试许可通过、事故责任界定清晰、召回风险可控', influence: -3, relationTag: '外部强监管方' },
      { identityTag: '车主KOL与专业测评媒体', coreDemand: '获得独家信息和测试机会，内容有传播价值和曝光量', influence: 2, relationTag: '舆论关键影响层' },
    ],
    decisionMaker: {
      coreConcern: '智驾功能投放节奏与安全合规风险的平衡；OTA口碑与用户留存；与竞品的功能代差是否被舆论放大',
      valueSensitivity: 3, innovationDesire: 3
    },
    resourceProvider: {
      identityTag: '自动驾驶感知/算法Tier1供应商（如地平线/Mobileye/英伟达方案商）',
      techMaturity: 3, resourceCompleteness: 2
    },
  },

  // ── 消费电子 / 智能硬件
  消费电子: {
    keys: ['消费电子','手机','智能硬件','可穿戴','耳机','家电','智能家居','iot','芯片','平板','笔记本','智能设备'],
    targetUser: {
      name: '苏涵', age: '27岁', occupation: '内容创作者/B站UP主', city: '杭州', avatarTag: '高频数码用户',
      lifestyle: '每天用设备录制、剪辑、发布内容，设备即生产工具，对体验极度敏感',
      decisionStyle: '重视真实测评，会在评论区问具体使用场景，不看官方广告',
      infoSource: 'B站深度测评、数码博主、专业评测网站、小红书真实晒单',
      typicalBehavior: '下单前反复对比参数，到手后立刻极限测试边界，遇到Bug直接公开点评，有较强传播能力',
      explicitGoal: '找到一款续航+散热+屏幕显示都不拖累工作流的主力创作设备',
      hiddenNeed: '希望这台设备能让我「完全不感知它的存在」——只有它不出问题，我才能专注内容本身',
      corePain: '宣传的续航10小时，实际用到6小时就开始降频，剪视频时风扇狂转影响录音，宣传与现实落差让人崩溃',
      emotionState: '充满期待但带着一层保护性怀疑，已经被坑过两次',
      personality: '专业挑剔、有传播影响力 · 主要受益者',
      coreValues: '真实体验 > 参数堆叠；拒绝过度营销 · 对产品真实能力边界有强诉求',
      innerMotivation: '工具够好我的内容才能更好，这不只是消费，是对我工作的投资',
      quote: '「我不在乎你有没有最新芯片，我在乎的是剪一个小时视频后机器会不会烫手」',
    },
    extremeHeavy: {
      name: '老马（马军）', ageOccupation: '50岁 · 数码发烧友/收藏玩家', extremeTag: '全系列囤货者',
      extremeBehavior: '每款新品首发必买，全系列颜色入手，对比测试后写万字长评，把消费当研究项目',
      workaround: '自建设备对比数据库，结交工厂内部人脉提前获取工程机，绕过零售渠道',
      explicitNeed: '成为圈子里最权威的早期体验者，信息上永远领先',
      heavyInsight: '目标用户需要的是「值得信赖的真实体验」，而极端发烧友提供了最深度的使用数据——产品团队应向这类用户学习，为普通用户提炼真实的体验预期',
    },
    extremeLight: {
      name: '王阿姨（王淑珍）', ageOccupation: '60岁 · 退休干部', extremeTag: '功能最小化用户',
      extremeBehavior: '用了5年旧款手机直到屏幕碎才换，新设备只用微信和地图，其他功能一律不学',
      workaround: '所有复杂操作找子女代劳，把智能手机当功能机用',
      explicitNeed: '开机即用，操作简单，不要弹窗不要更新提醒',
      lightInsight: '目标用户的「极简体验」诉求与此共鸣——产品不该让用户感知复杂度，无论他是专业创作者还是普通老人，结果是一样的',
    },
    stakeholders: [
      { identityTag: '供应链/元器件采购团队', coreDemand: 'BOM成本可控，质量稳定，不能因为减配被KOL曝光引发舆论危机', influence: -2, relationTag: '内部成本博弈方' },
      { identityTag: '渠道商/零售合作伙伴', coreDemand: '铺货顺畅，退货率低，有足够利润空间维持动力', influence: 1, relationTag: '销售通路' },
      { identityTag: '头部KOL与专业测评媒体', coreDemand: '独家评测机会，有话题度，不被竞品抢占流量', influence: 3, relationTag: '口碑关键节点' },
    ],
    decisionMaker: { coreConcern: '首销GMV、好评率与退货率、KOL口碑评分、90天内复购意向', valueSensitivity: 3, innovationDesire: 3 },
    resourceProvider: { identityTag: '芯片/屏幕/电池核心器件Tier1供应商（如台积电/三星/CATL方案商）', techMaturity: 3, resourceCompleteness: 2 },
  },

  // ── 政务 / 公共服务
  政务: {
    keys: ['政务','政府','公共服务','民生','行政','审批','城市管理','智慧城市','数字政府','公民服务','社区','街道','办事','政策','惠民'],
    targetUser: {
      name: '赵秀荣', age: '63岁', occupation: '退休工人 · 普通市民', city: '郑州', avatarTag: '线下窗口依赖者',
      lifestyle: '每天菜市场、社区活动室、广场舞，靠邻居和子女了解政策变化',
      decisionStyle: '相信"有官方印章的才算数"，不信网上说法，倾向于反复跑窗口确认',
      infoSource: '社区公告栏、子女告知、电视新闻、街道办工作人员',
      typicalBehavior: '需要办理社保续交，跑了3次窗口，每次都说材料不全，不知道是哪个环节出了问题',
      explicitGoal: '顺利办完社保续交，不耽误退休金正常发放',
      hiddenNeed: '希望有人告诉我「下一步该做什么」，而不是给我一叠表格自己猜',
      corePain: '政府网站字太小、操作复杂，每个窗口说的不一样，材料准备了三次还是不对，感觉自己在被刁难',
      emotionState: '焦虑、有些无助，但不好意思一直追问工作人员',
      personality: '顺从但有坚持、实用主义 · 主要受益者',
      coreValues: '公平对待、被尊重、流程可预期 · 对简化政务流程有强需求',
      innerMotivation: '我缴了一辈子的钱，只想顺顺利利把该办的事办完、把该领的领到',
      quote: '「不是我不愿意在网上办，是我真的弄不明白，错一步就要重来，还不如跑腿」',
    },
    extremeHeavy: {
      name: '老李（李建华）', ageOccupation: '70岁 · 退休干部', extremeTag: '政策研究型维权市民',
      extremeBehavior: '把所有政策文件打印出来逐字研读，找出表述模糊之处写成投诉信，坚持要求当面解释每一条',
      workaround: '建立政策文件档案夹，每次办事前列出所有可能的问题，让工作人员无法含糊带过',
      explicitNeed: '制度透明、被当作有完整权利的公民对待，而非被敷衍推脱',
      heavyInsight: '目标用户同样渴望「被当回事」，但不具备自我维权的能力——她需要的是流程清晰、进度可见，而不是靠强硬才能得到答案',
    },
    extremeLight: {
      name: '小张（张浩）', ageOccupation: '32岁 · 外卖骑手', extremeTag: '服务放弃者',
      extremeBehavior: '社保本来应该转移，但觉得太麻烦直接断缴，心想"反正以后再说"，通过放弃权益换省事',
      workaround: '绕过所有复杂流程，把放弃当解决方案，靠"算了"应对所有政务难题',
      explicitNeed: '在最短时间内零失败完成，或者有专人帮我做完',
      lightInsight: '目标用户和这类人面对的是同一个壁垒——流程设计让人主动放弃应得权益。解法是把「如何办」做到极简，而非假设所有人都有耐心研究',
    },
    stakeholders: [
      { identityTag: '窗口工作人员/政务服务专员', coreDemand: '减少反复解释，降低投诉率，考核指标达标不被上级通报', influence: 2, relationTag: '一线服务执行层' },
      { identityTag: '街道办/社区干部', coreDemand: '辖区居民不上访投诉，民生服务指标数据好看', influence: 1, relationTag: '基层管理层' },
      { identityTag: '数字政府建设/信息化部门', coreDemand: '上线率、访问量、线上迁移比例等KPI达成，减少线下压力', influence: -2, relationTag: '内部推动方（与用户习惯有摩擦）' },
      { identityTag: '监察/信访部门', coreDemand: '投诉数量下降，不出重大负面舆论事件', influence: -1, relationTag: '外部监督层' },
    ],
    decisionMaker: { coreConcern: '群众满意度评分、线上迁移率、政务服务指数排名、负面舆情管控', valueSensitivity: 2, innovationDesire: 2 },
    resourceProvider: { identityTag: '政务云/一体化政务服务平台服务商（阿里云政务通/腾讯云智慧政务等）', techMaturity: 3, resourceCompleteness: 3 },
  },

  // ── 健康科技 / 数字健康
  健康科技: {
    keys: ['健康科技','运动健康','健身','可穿戴健康','慢病管理','睡眠管理','心理健康','数字疗法','远程医疗','健康监测','健康管理'],
    targetUser: {
      name: '杨晓晴', age: '36岁', occupation: '中学体育老师', city: '成都', avatarTag: '轻度健康焦虑者',
      lifestyle: '自己跑步、关注健康内容，但对数据的解读停留在"步数多=健康"这个层面',
      decisionStyle: '看测评和朋友分享，对专业建议将信将疑，常在「要不要改变」中纠结',
      infoSource: '微信公众号、B站健康UP主、朋友圈晒步数、偶尔看医生建议',
      typicalBehavior: '手环数据一高就焦虑，去医院检查都正常，但仍反复搜索"心率偏高是什么意思"',
      explicitGoal: '搞清楚自己身体状态，不想有一天突然出问题还毫无察觉',
      hiddenNeed: '我不需要所有数据，我需要一个我信任的判断——「现在我的状态好不好」这一句话就够了',
      corePain: '设备给了我很多数字，但我不知道哪个重要，看完反而比不看还更不安',
      emotionState: '被数据驱动的低度焦虑，渴望简单明确的安心感',
      personality: '主动但认知有限、信任专业但门槛高 · 主要受益者',
      coreValues: '真实感、简单可操作、被告知而非被淹没 · 对智能健康顾问有需求',
      innerMotivation: '想要一个能看懂我身体的工具，不是一个需要我花时间读懂的工具',
      quote: '「戴了两年手环，数据一堆，到底我健不健康我还是不知道」',
    },
    extremeHeavy: {
      name: '程磊', ageOccupation: '42岁 · 马拉松运动员/量化健身者', extremeTag: '数据上瘾者',
      extremeBehavior: '同时佩戴3个设备交叉验证数据，每天分析HRV、睡眠分期、乳酸阈值，把自己当实验室小白鼠',
      workaround: '自建Excel数据模型追踪所有指标，定期和运动医学专家对账数据',
      explicitNeed: '更精准的传感器和完全开放的数据权限',
      heavyInsight: '目标用户渴望的是数据带来的安心感，而不是数据本身——极端用户揭示了「数据意义化」的巨大价值',
    },
    extremeLight: {
      name: '老周（周国华）', ageOccupation: '58岁 · 国企管理者', extremeTag: '健康完全被动者',
      extremeBehavior: '抽烟、不锻炼，认为"我爸活到90岁，我也没事"，只有单位强制体检才关注健康',
      workaround: '把所有健康信息全部忽略，遇到报告异常就找借口推迟复查',
      explicitNeed: '如果非要做，越简单越好，最好什么都不用改变',
      lightInsight: '目标用户和这类人共享同一障碍——改变行为的成本超过感知到的健康收益。解法是让「第一步的代价」接近于零',
    },
    stakeholders: [
      { identityTag: '医生/健康管理师', coreDemand: '设备数据有临床参考价值，不增加额外诊断负担', influence: 2, relationTag: '专业背书方' },
      { identityTag: '保险公司精算团队', coreDemand: '用户健康数据可辅助风险定价，促进差异化保单设计', influence: 1, relationTag: '数据价值转化方' },
      { identityTag: '家人/配偶', coreDemand: '能看到对方健康状态，如有异常及时知晓', influence: 2, relationTag: '间接受益与日常监督者' },
    ],
    decisionMaker: { coreConcern: '用户粘性与日活跃度、健康结果改善率、医疗机构合作壁垒', valueSensitivity: 2, innovationDesire: 3 },
    resourceProvider: { identityTag: '医疗级传感器与AI健康算法平台（如三星Health/华为健康平台等）', techMaturity: 2, resourceCompleteness: 2 },
  },

  // ── 默认（兜底）
  default: {
    keys: [],
    targetUser: {
      name: '李明', age: '34岁', occupation: '中层管理者', city: '北京', avatarTag: '典型目标用户',
      lifestyle: '工作繁忙，追求效率，关注行业动态',
      decisionStyle: '理性分析为主，注重数据和案例',
      infoSource: '行业报告、同行推荐、社交媒体',
      typicalBehavior: '遇到问题先自行研究，寻找最优解',
      explicitGoal: '提升工作效率，解决当前核心问题',
      hiddenNeed: '希望解决方案简单可落地，不增加额外学习负担',
      corePain: '现有方案复杂、学习成本高、见效慢',
      emotionState: '理性但有些焦虑',
      personality: '务实理性、执行力强 · 主要受益者',
      coreValues: '效率、可信赖 · 对简洁有效的方案有强需求',
      innerMotivation: '在有限资源内达成最大价值',
      quote: '「我需要的不是最完美的方案，是能真正用起来的方案」',
    },
    extremeHeavy: {
      name: '张专家', ageOccupation: '45岁 · 资深从业者', extremeTag: '极度深度用户',
      extremeBehavior: '对现有方案极度深度使用，挖掘每一个细节功能',
      workaround: '自建工作流和工具链，绕开不满足需求的部分',
      explicitNeed: '极致的深度和定制化',
      heavyInsight: '目标用户也渴望专业深度，但门槛过高是阻碍——简化入门路径才能让更多人获得深度价值',
    },
    extremeLight: {
      name: '王新手', ageOccupation: '25岁 · 初入行者', extremeTag: '回避复杂者',
      extremeBehavior: '因为复杂性直接放弃，转向更简单的替代方案',
      workaround: '用最原始的方法凑合，不尝试任何新工具',
      explicitNeed: '零门槛、立竿见影',
      lightInsight: '目标用户和新手用户有相同的根本障碍——学习成本超过了感知价值，必须先让价值即时可见',
    },
    stakeholders: [
      { identityTag: '直接合作方', coreDemand: '合作顺畅、利益有保障', influence: 2, relationTag: '外部合作方' },
      { identityTag: '内部相关团队', coreDemand: '工作量不增加、流程不被打乱', influence: -1, relationTag: '内部执行层' },
    ],
    decisionMaker: { coreConcern: '核心业务指标提升、风险可控、投入产出比', valueSensitivity: 2, innovationDesire: 2 },
    resourceProvider: { identityTag: '技术与平台服务供应商', techMaturity: 2, resourceCompleteness: 2 },
  }
};

/**
 * 语义匹配 v2.0：多域融合
 * 返回 { primary, secondary } — primary 决定主体内容，secondary 补充叠加
 */
function matchDomain(theme, tags) {
  const text = [
    theme || '',
    ...(tags.industry || []),
    ...(tags.scene    || []),
    ...(tags.theme    || [])
  ].join(' ').toLowerCase();

  const scores = {};
  Object.entries(DOMAIN_DB).forEach(([key, domain]) => {
    if (key === 'default') return;
    let score = 0;
    (domain.keys || []).forEach(kw => {
      if (text.includes(kw.toLowerCase())) score += kw.length * 2; // 长词权重更高
    });
    // 标签名直接命中加分
    if ((tags.industry || []).some(t => t === key)) score += 30;
    if ((tags.scene    || []).some(t => t === key)) score += 20;
    scores[key] = score;
  });

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const primary        = (sorted[0]?.[1] > 0) ? sorted[0][0] : 'default';
  const secondaryEntry = sorted.find(([k, s]) => k !== primary && s > 0);
  const secondary      = secondaryEntry ? secondaryEntry[0] : null;

  return { primary, secondary };
}

/**
 * 主生成函数 v2.0：多域融合 + 主题修饰
 * - primary domain 决定目标用户、极端用户核心内容
 * - secondary domain 补充利益相关方（不重复）+ 丰富决策者/资源方描述
 * - 自由文本主题作为修饰词叠加到 summary
 */
function buildDemoPersonas(theme, tags) {
  const { primary, secondary } = matchDomain(theme, tags);
  const domain  = DOMAIN_DB[primary];
  const domain2 = secondary ? DOMAIN_DB[secondary] : null;

  const industry = (tags.industry && tags.industry[0]) || primary;
  const scene    = (tags.scene    && tags.scene[0])    || (tags.industry && tags.industry[1]) || domain.keys[0] || '体验优化';
  const themeTag = (tags.theme    && tags.theme[0])    || domain.keys[1] || '';
  const personas = [];

  const tu_data = domain.targetUser;

  // ── 目标用户
  const tu = createTargetUser({
    m1: {
      name: tu_data.name, age: tu_data.age,
      occupation: tu_data.occupation, city: tu_data.city,
      avatarTag: tu_data.avatarTag
    },
    m2: {
      lifestyle:        tu_data.lifestyle,
      decisionStyle:    tu_data.decisionStyle,
      infoSource:       tu_data.infoSource,
      typicalBehavior:  tu_data.typicalBehavior
    },
    m3: {
      explicitGoal:  tu_data.explicitGoal,
      hiddenNeed:    tu_data.hiddenNeed,
      corePain:      tu_data.corePain,
      emotionState:  tu_data.emotionState
    },
    m4: {
      personality:      tu_data.personality,
      coreValues:       tu_data.coreValues,
      innerMotivation:  tu_data.innerMotivation,
      quote:            tu_data.quote
    },
    m5: { industryTag: industry, sceneTag: scene, themeTag },
    summary: `${tu_data.name}，${tu_data.age}，${tu_data.occupation}，来自${tu_data.city}。`
           + `核心痛点：${tu_data.corePain}。`
           + `内在渴望：${tu_data.hiddenNeed}。`
           + (theme ? `【项目场景】${theme}` : '')
  });
  personas.push(tu);

  // ── 极端用户 A（重度端）
  const eh = domain.extremeHeavy;
  const euA = createExtremeUser({
    side: EXTREME_SIDE.HEAVY,
    m1: { name: eh.name, ageOccupation: eh.ageOccupation, extremeTag: eh.extremeTag },
    m2: { extremeBehavior: eh.extremeBehavior, workaround: eh.workaround },
    m3: { explicitNeed: eh.explicitNeed, linkedTargetUserId: tu.id, inspirationForTarget: eh.heavyInsight },
    m4: { industryTag: industry, sceneTag: scene, themeTag }
  });
  personas.push(euA);

  // ── 极端用户 B（轻度/拒绝端）
  const el = domain.extremeLight;
  const euB = createExtremeUser({
    side: EXTREME_SIDE.LIGHT,
    m1: { name: el.name, ageOccupation: el.ageOccupation, extremeTag: el.extremeTag },
    m2: { extremeBehavior: el.extremeBehavior, workaround: el.workaround },
    m3: { explicitNeed: el.explicitNeed, linkedTargetUserId: tu.id, inspirationForTarget: el.lightInsight },
    m4: { industryTag: industry, sceneTag: scene, themeTag }
  });
  euA.linkedExtremeUsers = [euB.id];
  personas.push(euB);

  // ── 利益相关方：primary 全部 + secondary 前1个（去重）
  const stks = [...(domain.stakeholders || [])];
  if (domain2 && domain2.stakeholders) {
    const extraStk = domain2.stakeholders[0];
    if (extraStk && !stks.some(s => s.identityTag === extraStk.identityTag)) {
      stks.push({
        ...extraStk,
        relationTag: `[${secondary}视角] ` + extraStk.relationTag
      });
    }
  }
  stks.forEach(s => {
    personas.push(createStakeholder({
      m1: { identityTag: s.identityTag, coreDemand: s.coreDemand, influence: s.influence },
      m2: { industryTag: industry, sceneTag: scene, relationTag: s.relationTag }
    }));
  });

  // ── 决策者：主域 + secondary 场景补充
  const dm = domain.decisionMaker;
  const dmConcern = (secondary && domain2)
    ? `${dm.coreConcern}；另从「${secondary}」维度关注：${domain2.decisionMaker.coreConcern}`
    : dm.coreConcern;
  personas.push(createDecisionMaker({
    m1: { coreConcern: dmConcern, valueSensitivity: dm.valueSensitivity, innovationDesire: dm.innovationDesire },
    m2: { industryTag: industry, sceneTag: scene, relationTag: '内部决策层' }
  }));

  // ── 资源提供者：主域 + secondary 补充
  const rp = domain.resourceProvider;
  const rpIdentity = (secondary && domain2)
    ? `${rp.identityTag} · 兼顾「${domain2.resourceProvider.identityTag}」`
    : rp.identityTag;
  personas.push(createResourceProvider({
    m1: { identityTag: rpIdentity, techMaturity: rp.techMaturity, resourceCompleteness: rp.resourceCompleteness },
    m2: { industryTag: industry, sceneTag: scene, relationTag: '外部技术合作方' }
  }));

  return personas;
}

// ─────────────────────────────────────────
// SVG 卡通头像生成器
// ─────────────────────────────────────────

/** 简单哈希，把字符串→数字，用于确定性随机 */
function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h;
}

/**
 * generateAvatar(seed, type) → SVG 字符串
 * seed: 角色 id（唯一性保证每人不同形象）
 * type: persona type（决定背景色调）
 */
function generateAvatar(seed, type) {
  const h = hashStr(seed || 'default');
  const pick = (arr, offset) => arr[(h >> offset) % arr.length];

  // ── 背景色（与类别底色一致）
  const bgColors = {
    target_user:       ['#3d3a7a','#4a3f8a','#322e6e','#403878'],
    extreme_user:      ['#7a2052','#6b1e4a','#872356','#6a1a44'],
    stakeholder:       ['#1a5c54','#16524a','#1d6660','#145048'],
    decision_maker:    ['#7a5a0f','#6e5110','#8a6412','#664c0e'],
    resource_provider: ['#0e5a66','#0c5160','#106070','#0a4d5c'],
  };
  const bgArr  = bgColors[type] || bgColors.target_user;
  const bgColor = bgArr[h % bgArr.length];

  // ── 皮肤色
  const skinColors = ['#f5d5b0','#f0c49a','#e8b589','#d9a070','#c4855a','#a86844'];
  const skin = pick(skinColors, 4);

  // ── 发色
  const hairColors = ['#1a0a00','#2c1a00','#6b3a2a','#8b4513','#c8a060','#f0d080','#2a2a3a','#3a2a5a'];
  const hairColor = pick(hairColors, 8);

  // ── 发型 (0-7)
  const hairStyle = (h >> 2) % 8;

  // ── 眼睛样式 (0-3)
  const eyeStyle = (h >> 6) % 4;

  // ── 嘴巴 (0-2)
  const mouthStyle = (h >> 10) % 3;

  // ── 配件（眼镜、领带、耳环等）
  const accessory = (h >> 14) % 5;  // 0=无 1=圆眼镜 2=方眼镜 3=领结 4=耳环

  // ── 强调色（与类别主色一致）
  const accentMap = {
    target_user: '#818cf8', extreme_user: '#ec4899',
    stakeholder: '#14b8a6', decision_maker: '#f59e0b',
    resource_provider: '#22d3ee'
  };
  const accent = accentMap[type] || '#818cf8';

  // SVG 尺寸 60×60，内部坐标系 60×60
  const cx = 30, cy = 30;

  // ── 头发路径（8种）
  const hairPaths = [
    // 0: 短直发
    `<ellipse cx="30" cy="19" rx="14" ry="8" fill="${hairColor}"/>
     <rect x="16" y="19" width="28" height="5" fill="${hairColor}" rx="2"/>`,
    // 1: 中分长发
    `<ellipse cx="30" cy="18" rx="14" ry="9" fill="${hairColor}"/>
     <rect x="16" y="22" width="5" height="14" fill="${hairColor}" rx="2"/>
     <rect x="39" y="22" width="5" height="14" fill="${hairColor}" rx="2"/>`,
    // 2: 卷发蓬松
    `<ellipse cx="30" cy="18" rx="15" ry="10" fill="${hairColor}"/>
     <circle cx="18" cy="20" r="5" fill="${hairColor}"/>
     <circle cx="42" cy="20" r="5" fill="${hairColor}"/>
     <circle cx="22" cy="15" r="4" fill="${hairColor}"/>
     <circle cx="38" cy="15" r="4" fill="${hairColor}"/>`,
    // 3: 丸子头/发髻
    `<ellipse cx="30" cy="20" rx="13" ry="8" fill="${hairColor}"/>
     <circle cx="30" cy="10" r="6" fill="${hairColor}"/>
     <line x1="30" y1="10" x2="30" y2="16" stroke="${hairColor}" stroke-width="4"/>`,
    // 4: 寸头/军事
    `<ellipse cx="30" cy="20" rx="14" ry="7" fill="${hairColor}"/>`,
    // 5: 偏分
    `<ellipse cx="30" cy="18" rx="14" ry="9" fill="${hairColor}"/>
     <rect x="16" y="18" width="20" height="5" fill="${hairColor}" rx="1"/>`,
    // 6: 双马尾
    `<ellipse cx="30" cy="19" rx="13" ry="8" fill="${hairColor}"/>
     <ellipse cx="17" cy="24" rx="5" ry="8" fill="${hairColor}" transform="rotate(-10,17,24)"/>
     <ellipse cx="43" cy="24" rx="5" ry="8" fill="${hairColor}" transform="rotate(10,43,24)"/>`,
    // 7: 波浪中长发
    `<ellipse cx="30" cy="18" rx="14" ry="9" fill="${hairColor}"/>
     <path d="M16,23 Q14,30 17,36 Q19,30 16,23Z" fill="${hairColor}"/>
     <path d="M44,23 Q46,30 43,36 Q41,30 44,23Z" fill="${hairColor}"/>`,
  ];

  // ── 眼睛 SVG（4种）
  const eyeSVGs = [
    // 0: 普通圆眼
    `<circle cx="24" cy="30" r="2.5" fill="#1a1a2e"/>
     <circle cx="36" cy="30" r="2.5" fill="#1a1a2e"/>
     <circle cx="25" cy="29" r="1" fill="white"/>
     <circle cx="37" cy="29" r="1" fill="white"/>`,
    // 1: 弧形笑眼
    `<path d="M21.5,31 Q24,28.5 26.5,31" stroke="#1a1a2e" stroke-width="1.8" fill="none" stroke-linecap="round"/>
     <path d="M33.5,31 Q36,28.5 38.5,31" stroke="#1a1a2e" stroke-width="1.8" fill="none" stroke-linecap="round"/>`,
    // 2: 细长眼
    `<ellipse cx="24" cy="30" rx="3" ry="2" fill="#1a1a2e"/>
     <ellipse cx="36" cy="30" rx="3" ry="2" fill="#1a1a2e"/>
     <circle cx="25" cy="29.5" r="0.8" fill="white"/>
     <circle cx="37" cy="29.5" r="0.8" fill="white"/>`,
    // 3: 圆大眼（萌系）
    `<circle cx="24" cy="30" r="3.5" fill="#1a1a2e"/>
     <circle cx="36" cy="30" r="3.5" fill="#1a1a2e"/>
     <circle cx="24" cy="30" r="2" fill="#2a3a6a"/>
     <circle cx="36" cy="30" r="2" fill="#2a3a6a"/>
     <circle cx="25.5" cy="28.5" r="1" fill="white"/>
     <circle cx="37.5" cy="28.5" r="1" fill="white"/>`,
  ];

  // ── 嘴巴
  const mouthSVGs = [
    // 0: 微笑
    `<path d="M25,37 Q30,41 35,37" stroke="#8b4a3a" stroke-width="1.8" fill="none" stroke-linecap="round"/>`,
    // 1: 淡然直线
    `<line x1="26" y1="38" x2="34" y2="38" stroke="#8b4a3a" stroke-width="1.8" stroke-linecap="round"/>`,
    // 2: 大笑
    `<path d="M24,36 Q30,42 36,36" stroke="#8b4a3a" stroke-width="1.8" fill="none" stroke-linecap="round"/>
     <path d="M25,37 Q30,41 35,37" fill="${skin}" stroke="none"/>`,
  ];

  // ── 配件
  let accessorySVG = '';
  if (accessory === 1) {
    // 圆眼镜
    accessorySVG = `
      <circle cx="24" cy="30" r="4.5" fill="none" stroke="${accent}" stroke-width="1.2" opacity=".7"/>
      <circle cx="36" cy="30" r="4.5" fill="none" stroke="${accent}" stroke-width="1.2" opacity=".7"/>
      <line x1="28.5" y1="30" x2="31.5" y2="30" stroke="${accent}" stroke-width="1" opacity=".6"/>
      <line x1="18" y1="29" x2="19.5" y2="29.5" stroke="${accent}" stroke-width="1" opacity=".5"/>
      <line x1="40.5" y1="29" x2="42" y2="29.5" stroke="${accent}" stroke-width="1" opacity=".5"/>`;
  } else if (accessory === 2) {
    // 方眼镜
    accessorySVG = `
      <rect x="19.5" y="26.5" width="9" height="7" rx="1.5" fill="none" stroke="${accent}" stroke-width="1.2" opacity=".7"/>
      <rect x="31.5" y="26.5" width="9" height="7" rx="1.5" fill="none" stroke="${accent}" stroke-width="1.2" opacity=".7"/>
      <line x1="28.5" y1="30" x2="31.5" y2="30" stroke="${accent}" stroke-width="1" opacity=".6"/>`;
  } else if (accessory === 3) {
    // 领结
    accessorySVG = `
      <path d="M27,44 L30,47 L33,44 L30,41 Z" fill="${accent}" opacity=".8"/>
      <circle cx="30" cy="44" r="1.5" fill="${accent}"/>`;
  } else if (accessory === 4) {
    // 耳环
    accessorySVG = `
      <circle cx="16" cy="32" r="2" fill="${accent}" opacity=".7"/>
      <circle cx="44" cy="32" r="2" fill="${accent}" opacity=".7"/>`;
  }

  // ── 颈部 + 衣领
  const shirtColors = { target_user:'#4a4a9a', extreme_user:'#7a2060', stakeholder:'#1a6055', decision_maker:'#7a5a10', resource_provider:'#0e5a68' };
  const shirtColor = shirtColors[type] || '#4a4a9a';

  return `<svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
    <!-- 背景圆 -->
    <circle cx="30" cy="30" r="30" fill="${bgColor}"/>
    <!-- 衬衫/上衣 -->
    <ellipse cx="30" cy="56" rx="18" ry="12" fill="${shirtColor}"/>
    <path d="M18,52 Q24,58 30,56 Q36,58 42,52" fill="${shirtColor}" opacity=".9"/>
    <!-- 颈部 -->
    <rect x="26" y="39" width="8" height="8" fill="${skin}" rx="2"/>
    <!-- 脸 -->
    <ellipse cx="30" cy="30" rx="13" ry="14" fill="${skin}"/>
    <!-- 发型 -->
    ${hairPaths[hairStyle]}
    <!-- 耳朵 -->
    <ellipse cx="17" cy="30" rx="3" ry="4" fill="${skin}"/>
    <ellipse cx="43" cy="30" rx="3" ry="4" fill="${skin}"/>
    <!-- 眉毛 -->
    <path d="M21,25 Q24,23.5 27,25" stroke="${hairColor}" stroke-width="1.5" fill="none" stroke-linecap="round" opacity=".85"/>
    <path d="M33,25 Q36,23.5 39,25" stroke="${hairColor}" stroke-width="1.5" fill="none" stroke-linecap="round" opacity=".85"/>
    <!-- 眼睛 -->
    ${eyeSVGs[eyeStyle]}
    <!-- 鼻子 -->
    <path d="M29,32 Q30,34.5 31,32" stroke="#c0897a" stroke-width="1.2" fill="none" stroke-linecap="round"/>
    <!-- 嘴巴 -->
    ${mouthSVGs[mouthStyle]}
    <!-- 配件 -->
    ${accessorySVG}
  </svg>`;
}

// ─────────────────────────────────────────
// 卡片渲染
// ─────────────────────────────────────────
const TYPE_LABEL = {
  target_user: '目标用户',
  extreme_user: '极端用户',
  stakeholder: '利益相关方',
  decision_maker: '决策者',
  resource_provider: '资源提供者'
};
const TYPE_AVATAR = {
  target_user: '👤',
  extreme_user: '⚡',
  stakeholder: '🌐',
  decision_maker: '🎯',
  resource_provider: '🔧'
};

function renderCard(p) {
  const label  = TYPE_LABEL[p.type] || p.type;
  const edited = p._edited ? '<span class="edited-badge">已编辑</span>' : '';
  const avatarSvg = generateAvatar(p.id, p.type);
  let inner = '';

  if (p.type === 'target_user') {
    inner = `
      <div class="card-head">
        <div class="card-avatar">${avatarSvg}</div>
        <div class="card-identity">
          <div class="card-name">${escHtml(p.m1.name)} ${edited}</div>
          <div class="card-sub">${escHtml(p.m1.age)} · ${escHtml(p.m1.occupation)}</div>
          <div class="card-sub">${escHtml(p.m1.city)} · ${escHtml(p.m1.avatarTag)}</div>
        </div>
        <div class="card-type-badge">${label}</div>
      </div>
      <div class="card-module">
        <div class="card-module-label">生活方式</div>
        <div class="card-module-content">${escHtml(p.m2.lifestyle)} · ${escHtml(p.m2.decisionStyle)}</div>
      </div>
      <div class="card-module">
        <div class="card-module-label">需求与痛点</div>
        <div class="card-module-content highlight">${escHtml(p.m3.explicitGoal)}</div>
        <div class="card-module-content">痛点：${escHtml(p.m3.corePain)}</div>
      </div>
      <div class="card-module">
        <div class="card-module-label">个性与价值观</div>
        <div class="card-module-content">${escHtml(p.m4.personality)}</div>
      </div>
      <div class="card-quote">${escHtml(p.m4.quote)}</div>
      <div class="card-summary">${escHtml(p.summary)}</div>
      <div class="card-tags">
        ${[p.m5.industryTag, p.m5.sceneTag, p.m5.themeTag].filter(Boolean).map(t => `<span class="card-tag">${escHtml(t)}</span>`).join('')}
      </div>`;
  }

  else if (p.type === 'extreme_user') {
    const sideLabel = p.side === 'heavy' ? '🔴 重度端' : '🔵 轻度端';
    const linkedTu  = allPersonas.find(x => x.id === p.m3.linkedTargetUserId);
    inner = `
      <div class="card-head">
        <div class="card-avatar">${avatarSvg}</div>
        <div class="card-identity">
          <div class="card-name">${escHtml(p.m1.name)} ${edited}</div>
          <div class="card-sub">${escHtml(p.m1.ageOccupation)}</div>
          <div class="card-sub">${sideLabel} · ${escHtml(p.m1.extremeTag)}</div>
        </div>
        <div class="card-type-badge">${label}</div>
      </div>
      <div class="card-module">
        <div class="card-module-label">极端行为</div>
        <div class="card-module-content highlight">${escHtml(p.m2.extremeBehavior)}</div>
        <div class="card-module-content">变通：${escHtml(p.m2.workaround)}</div>
      </div>
      <div class="card-module">
        <div class="card-module-label">外显需求</div>
        <div class="card-module-content">${escHtml(p.m3.explicitNeed)}</div>
      </div>
      <div class="card-module">
        <div class="card-module-label">对目标用户的启发</div>
        <div class="card-module-content">${escHtml(p.m3.inspirationForTarget)}</div>
      </div>
      ${linkedTu ? `<div class="extreme-link"><span class="arrow">→</span> 对应目标用户：<span class="target-name" onclick="openDrawer('${linkedTu.id}')">${escHtml(linkedTu.m1.name)}</span></div>` : ''}
      <div class="card-tags">
        ${[p.m4.industryTag, p.m4.sceneTag, p.m4.themeTag].filter(Boolean).map(t => `<span class="card-tag">${escHtml(t)}</span>`).join('')}
      </div>`;
  }

  else if (p.type === 'stakeholder') {
    const inf = p.m1.influence;
    const infClass = inf > 0 ? 'positive' : inf < 0 ? 'negative' : 'neutral';
    const infLabel = inf > 0 ? `+${inf} 推力` : inf < 0 ? `${inf} 阻力` : '0 中立';
    inner = `
      <div class="card-head">
        <div class="card-avatar">${avatarSvg}</div>
        <div class="card-identity">
          <div class="card-name">${escHtml(p.m1.identityTag)} ${edited}</div>
          <div class="card-sub">${escHtml(p.m2.relationTag)}</div>
        </div>
        <div class="card-type-badge">${label}</div>
      </div>
      <div class="card-module">
        <div class="card-module-label">核心诉求</div>
        <div class="card-module-content">${escHtml(p.m1.coreDemand)}</div>
      </div>
      <div class="card-metrics">
        <div class="metric-item">
          <div class="metric-value ${infClass}">${infLabel}</div>
          <div class="metric-label">影响力</div>
        </div>
      </div>
      <div class="card-tags">
        ${[p.m2.industryTag, p.m2.sceneTag, p.m2.relationTag].filter(Boolean).map(t => `<span class="card-tag">${escHtml(t)}</span>`).join('')}
      </div>`;
  }

  else if (p.type === 'decision_maker') {
    inner = `
      <div class="card-head">
        <div class="card-avatar">${avatarSvg}</div>
        <div class="card-identity">
          <div class="card-name">业务决策者 ${edited}</div>
          <div class="card-sub">${escHtml(p.m2.relationTag)}</div>
        </div>
        <div class="card-type-badge">${label}</div>
      </div>
      <div class="card-module">
        <div class="card-module-label">核心关切</div>
        <div class="card-module-content">${escHtml(p.m1.coreConcern)}</div>
      </div>
      <div class="card-metrics">
        <div class="metric-item">
          <div class="metric-value level${p.m1.valueSensitivity}">${p.m1.valueSensitivity}</div>
          <div class="metric-label">价值敏感度</div>
        </div>
        <div class="metric-item">
          <div class="metric-value level${p.m1.innovationDesire}">${p.m1.innovationDesire}</div>
          <div class="metric-label">创新渴望</div>
        </div>
      </div>
      <div class="card-tags">
        ${[p.m2.industryTag, p.m2.sceneTag, p.m2.relationTag].filter(Boolean).map(t => `<span class="card-tag">${escHtml(t)}</span>`).join('')}
      </div>`;
  }

  else if (p.type === 'resource_provider') {
    inner = `
      <div class="card-head">
        <div class="card-avatar">${avatarSvg}</div>
        <div class="card-identity">
          <div class="card-name">${escHtml(p.m1.identityTag)} ${edited}</div>
          <div class="card-sub">${escHtml(p.m2.relationTag)}</div>
        </div>
        <div class="card-type-badge">${label}</div>
      </div>
      <div class="card-metrics">
        <div class="metric-item">
          <div class="metric-value level${p.m1.techMaturity}">${p.m1.techMaturity}</div>
          <div class="metric-label">技术成熟度</div>
        </div>
        <div class="metric-item">
          <div class="metric-value level${p.m1.resourceCompleteness}">${p.m1.resourceCompleteness}</div>
          <div class="metric-label">资源完备度</div>
        </div>
      </div>
      <div class="card-tags">
        ${[p.m2.industryTag, p.m2.sceneTag, p.m2.relationTag].filter(Boolean).map(t => `<span class="card-tag">${escHtml(t)}</span>`).join('')}
      </div>`;
  }

  const inGroup = currentGroup.personas.some(x => x.id === p.id);
  return `
    <div class="persona-card type-${p.type}" id="card-${p.id}">
      <div class="card-stripe"></div>
      <div class="card-body">${inner}</div>
      <div class="card-actions">
        <button class="card-action-btn" onclick="openDrawer('${p.id}')">展开详情</button>
        <button class="card-action-btn ${inGroup ? 'added' : 'add-to-group'}" id="groupbtn-${p.id}"
          onclick="toggleGroupMembership('${p.id}')">
          ${inGroup ? '✓ 已加入' : '+ 角色组'}
        </button>
        ${p._edited ? `<button class="card-action-btn restore" onclick="restoreCard('${p.id}')">↺ 恢复</button>` : ''}
      </div>
    </div>`;
}

// ─────────────────────────────────────────
// 角色组管理
// ─────────────────────────────────────────
function toggleGroupMembership(personaId) {
  const p = allPersonas.find(x => x.id === personaId);
  if (!p) return;
  const idx = currentGroup.personas.findIndex(x => x.id === personaId);
  if (idx >= 0) {
    currentGroup.personas.splice(idx, 1);
  } else {
    currentGroup.personas.push(p);
  }
  const btn = document.getElementById(`groupbtn-${personaId}`);
  const inGroup = currentGroup.personas.some(x => x.id === personaId);
  if (btn) {
    btn.className = `card-action-btn ${inGroup ? 'added' : 'add-to-group'}`;
    btn.textContent = inGroup ? '✓ 已加入' : '+ 角色组';
  }
  renderGroupTray();
}

function renderGroupTray() {
  const tray  = document.getElementById('group-tray');
  const chips = document.getElementById('tray-chips');
  if (currentGroup.personas.length === 0) { tray.classList.remove('open'); return; }
  tray.classList.add('open');
  chips.innerHTML = currentGroup.personas.map(p => {
    const name = p.type === 'target_user' ? p.m1.name
               : p.type === 'extreme_user' ? p.m1.name
               : p.type === 'stakeholder' ? p.m1.identityTag
               : p.type === 'decision_maker' ? '决策者'
               : p.m1.identityTag;
    return `<div class="tray-chip">${escHtml(name)} <span class="remove" onclick="toggleGroupMembership('${p.id}')">✕</span></div>`;
  }).join('');
}

function clearGroup() {
  currentGroup.personas = [];
  renderGroupTray();
  allPersonas.forEach(p => {
    const btn = document.getElementById(`groupbtn-${p.id}`);
    if (btn) { btn.className = 'card-action-btn add-to-group'; btn.textContent = '+ 角色组'; }
  });
}

function saveCurrentGroup() {
  const theme = document.getElementById('input-theme-main')?.value.trim() || '';
  const group = createPersonaGroup({
    projectTheme: theme,
    tags: {},
    targetUsers:       allPersonas.filter(p => p.type === 'target_user'),
    extremeUsers:      allPersonas.filter(p => p.type === 'extreme_user'),
    stakeholders:      allPersonas.filter(p => p.type === 'stakeholder'),
    decisionMakers:    allPersonas.filter(p => p.type === 'decision_maker'),
    resourceProviders: allPersonas.filter(p => p.type === 'resource_provider'),
  });
  saveGroup(group);
  clearDraft();
  showToast('✅ 角色组已保存！可在「我的角色组」查看');
}

function exportGroup() {
  const personas = currentGroup.personas.length > 0 ? currentGroup.personas : allPersonas;
  if (personas.length === 0) { showToast('没有可导出的角色', 'error'); return; }
  const md = exportPersonasToMarkdown(personas);
  downloadText(md, 'persona-group.md');
  showToast('✅ 已导出为 Markdown 文件');
}

function exportPersonasToMarkdown(personas) {
  const theme = document.getElementById('input-theme-main')?.value || '';
  let md = `# Persona Lab · 角色组\n\n**项目主题**：${theme}\n\n---\n\n`;
  personas.forEach(p => {
    md += `## ${TYPE_LABEL[p.type]}：${getPersonaTitle(p)}\n\n`;
    if (p.type === 'target_user') {
      md += `**基本身份**：${p.m1.name}，${p.m1.age}，${p.m1.occupation}，${p.m1.city}\n\n`;
      md += `**生活方式**：${p.m2.lifestyle}\n**决策风格**：${p.m2.decisionStyle}\n\n`;
      md += `**显性目标**：${p.m3.explicitGoal}\n**隐性需求**：${p.m3.hiddenNeed}\n**核心痛点**：${p.m3.corePain}\n\n`;
      md += `**Quote**：${p.m4.quote}\n\n**综合介绍**：${p.summary}\n\n`;
    } else if (p.type === 'extreme_user') {
      const side = p.side === 'heavy' ? '重度端' : '轻度端';
      md += `**极端类型**：${side} · ${p.m1.extremeTag}\n`;
      md += `**极端行为**：${p.m2.extremeBehavior}\n**变通方式**：${p.m2.workaround}\n\n`;
      md += `**外显需求**：${p.m3.explicitNeed}\n**对目标用户的启发**：${p.m3.inspirationForTarget}\n\n`;
    } else if (p.type === 'stakeholder') {
      md += `**身份**：${p.m1.identityTag}\n**核心诉求**：${p.m1.coreDemand}\n**影响力**：${p.m1.influence}\n\n`;
    } else if (p.type === 'decision_maker') {
      md += `**核心关切**：${p.m1.coreConcern}\n**价值敏感度**：${p.m1.valueSensitivity}/3\n**创新突破渴望**：${p.m1.innovationDesire}/3\n\n`;
    } else if (p.type === 'resource_provider') {
      md += `**身份**：${p.m1.identityTag}\n**技术成熟度**：${p.m1.techMaturity}/3\n**资源完备度**：${p.m1.resourceCompleteness}/3\n\n`;
    }
    md += '---\n\n';
  });
  return md;
}

function syncToEureka() {
  showToast('🔗 Eureka 同步功能即将上线，当前可通过导出 Markdown 手动导入');
}

// ─────────────────────────────────────────
// 详情抽屉
// ─────────────────────────────────────────
function openDrawer(personaId) {
  const p = allPersonas.find(x => x.id === personaId);
  if (!p) return;
  drawerPersonaId = personaId;
  document.getElementById('drawer-title').textContent = `${TYPE_AVATAR[p.type]} ${getPersonaTitle(p)} · ${TYPE_LABEL[p.type]}`;
  document.getElementById('drawer-restore-btn').style.display = p._edited ? 'block' : 'none';
  document.getElementById('drawer-body').innerHTML = renderDrawerBody(p);
  document.getElementById('drawer-overlay').classList.add('open');
  document.getElementById('persona-drawer').classList.add('open');
}

function closeDrawer() {
  document.getElementById('drawer-overlay').classList.remove('open');
  document.getElementById('persona-drawer').classList.remove('open');
  drawerPersonaId = null;
}

function addToGroupFromDrawer() {
  if (drawerPersonaId) toggleGroupMembership(drawerPersonaId);
  closeDrawer();
}

function restoreDrawerPersona() {
  if (!drawerPersonaId) return;
  const idx = allPersonas.findIndex(x => x.id === drawerPersonaId);
  if (idx < 0) return;
  allPersonas[idx] = restoreOriginal(allPersonas[idx]);
  const cardEl = document.getElementById(`card-${drawerPersonaId}`);
  if (cardEl) cardEl.outerHTML = renderCard(allPersonas[idx]);
  openDrawer(drawerPersonaId);
  showToast('✅ 已恢复为 AI 原始版本');
}

function restoreCard(personaId) {
  const idx = allPersonas.findIndex(x => x.id === personaId);
  if (idx < 0) return;
  allPersonas[idx] = restoreOriginal(allPersonas[idx]);
  const cardEl = document.getElementById(`card-${personaId}`);
  if (cardEl) cardEl.outerHTML = renderCard(allPersonas[idx]);
  showToast('✅ 已恢复为 AI 原始版本');
}

function renderDrawerBody(p) {
  if (p.type === 'target_user')       return renderDrawerTargetUser(p);
  if (p.type === 'extreme_user')      return renderDrawerExtremeUser(p);
  if (p.type === 'stakeholder')       return renderDrawerStakeholder(p);
  if (p.type === 'decision_maker')    return renderDrawerDecisionMaker(p);
  if (p.type === 'resource_provider') return renderDrawerResourceProvider(p);
  return '';
}

function field(label, value, path, personaId) {
  return `
    <div class="field-row">
      <div class="field-label">${label}</div>
      <div class="field-value" onclick="startFieldEdit(this,'${personaId}','${path}')" title="点击编辑">${escHtml(value || '—')}</div>
    </div>`;
}

function renderDrawerTargetUser(p) {
  return `
    <div class="drawer-section">
      <div class="drawer-section-title">模块一 · 基本身份</div>
      ${field('姓名', p.m1.name, 'm1.name', p.id)}
      ${field('年龄', p.m1.age, 'm1.age', p.id)}
      ${field('职业', p.m1.occupation, 'm1.occupation', p.id)}
      ${field('居住城市', p.m1.city, 'm1.city', p.id)}
      ${field('头像标签', p.m1.avatarTag, 'm1.avatarTag', p.id)}
    </div>
    <div class="drawer-section">
      <div class="drawer-section-title">模块二 · 生活方式与行为特点</div>
      ${field('生活方式', p.m2.lifestyle, 'm2.lifestyle', p.id)}
      ${field('决策风格', p.m2.decisionStyle, 'm2.decisionStyle', p.id)}
      ${field('信息获取', p.m2.infoSource, 'm2.infoSource', p.id)}
      ${field('典型行为', p.m2.typicalBehavior, 'm2.typicalBehavior', p.id)}
    </div>
    <div class="drawer-section">
      <div class="drawer-section-title">模块三 · 需求与痛点</div>
      ${field('显性目标', p.m3.explicitGoal, 'm3.explicitGoal', p.id)}
      ${field('隐性需求', p.m3.hiddenNeed, 'm3.hiddenNeed', p.id)}
      ${field('核心痛点', p.m3.corePain, 'm3.corePain', p.id)}
      ${field('情绪状态', p.m3.emotionState, 'm3.emotionState', p.id)}
    </div>
    <div class="drawer-section">
      <div class="drawer-section-title">模块四 · 个性、价值观与洞察</div>
      ${field('个性特征 · 项目角色', p.m4.personality, 'm4.personality', p.id)}
      ${field('核心价值观 · 创新态度', p.m4.coreValues, 'm4.coreValues', p.id)}
      ${field('内在动机', p.m4.innerMotivation, 'm4.innerMotivation', p.id)}
      ${field('一句话 Quote', p.m4.quote, 'm4.quote', p.id)}
    </div>
    <div class="drawer-section">
      <div class="drawer-section-title">模块五 · 标签</div>
      ${field('行业标签', p.m5.industryTag, 'm5.industryTag', p.id)}
      ${field('场景标签', p.m5.sceneTag, 'm5.sceneTag', p.id)}
      ${field('主题标签', p.m5.themeTag, 'm5.themeTag', p.id)}
    </div>
    <div class="drawer-section">
      <div class="drawer-section-title">综合介绍（AI 生成）</div>
      ${field('一句话综合', p.summary, 'summary', p.id)}
    </div>`;
}

function renderDrawerExtremeUser(p) {
  const sideLabel = p.side === 'heavy' ? '重度端 A' : '轻度/拒绝端 B';
  const linkedTu  = allPersonas.find(x => x.id === p.m3.linkedTargetUserId);
  return `
    <div class="drawer-section">
      <div class="drawer-section-title">模块一 · 基本身份</div>
      ${field('姓名', p.m1.name, 'm1.name', p.id)}
      ${field('年龄+职业', p.m1.ageOccupation, 'm1.ageOccupation', p.id)}
      ${field('极端标签', p.m1.extremeTag, 'm1.extremeTag', p.id)}
      <div class="field-row"><div class="field-label">极端方向</div><div class="field-value">${sideLabel}</div></div>
    </div>
    <div class="drawer-section">
      <div class="drawer-section-title">模块二 · 极端行为</div>
      ${field('极端表现', p.m2.extremeBehavior, 'm2.extremeBehavior', p.id)}
      ${field('变通方式', p.m2.workaround, 'm2.workaround', p.id)}
    </div>
    <div class="drawer-section">
      <div class="drawer-section-title">模块三 · 外显需求与用户启发</div>
      ${field('外显需求', p.m3.explicitNeed, 'm3.explicitNeed', p.id)}
      <div class="field-row">
        <div class="field-label">对应目标用户</div>
        <div class="field-value">${linkedTu ? `<span style="color:var(--accent2);cursor:pointer" onclick="closeDrawer();setTimeout(()=>openDrawer('${linkedTu.id}'),200)">${escHtml(linkedTu.m1.name)}</span>` : '—'}</div>
      </div>
      ${field('对目标用户的启发', p.m3.inspirationForTarget, 'm3.inspirationForTarget', p.id)}
    </div>`;
}

function renderDrawerStakeholder(p) {
  return `
    <div class="drawer-section">
      <div class="drawer-section-title">模块一 · 利益方描述</div>
      ${field('身份标签', p.m1.identityTag, 'm1.identityTag', p.id)}
      ${field('核心诉求', p.m1.coreDemand, 'm1.coreDemand', p.id)}
      <div class="field-row">
        <div class="field-label">影响力程度（-3~+3）</div>
        <div class="field-value" onclick="startFieldEdit(this,'${p.id}','m1.influence')" title="点击编辑">${p.m1.influence}</div>
      </div>
    </div>
    <div class="drawer-section">
      <div class="drawer-section-title">模块二 · 标签</div>
      ${field('行业标签', p.m2.industryTag, 'm2.industryTag', p.id)}
      ${field('场景标签', p.m2.sceneTag, 'm2.sceneTag', p.id)}
      ${field('关系标签', p.m2.relationTag, 'm2.relationTag', p.id)}
    </div>`;
}

function renderDrawerDecisionMaker(p) {
  return `
    <div class="drawer-section">
      <div class="drawer-section-title">模块一 · 决策者描述</div>
      ${field('核心关切需求', p.m1.coreConcern, 'm1.coreConcern', p.id)}
      <div class="field-row">
        <div class="field-label">价值敏感度（1-3）</div>
        <div class="field-value" onclick="startFieldEdit(this,'${p.id}','m1.valueSensitivity')">${p.m1.valueSensitivity}</div>
      </div>
      <div class="field-row">
        <div class="field-label">创新突破渴望（1-3）</div>
        <div class="field-value" onclick="startFieldEdit(this,'${p.id}','m1.innovationDesire')">${p.m1.innovationDesire}</div>
      </div>
    </div>
    <div class="drawer-section">
      <div class="drawer-section-title">模块二 · 标签</div>
      ${field('行业标签', p.m2.industryTag, 'm2.industryTag', p.id)}
      ${field('场景标签', p.m2.sceneTag, 'm2.sceneTag', p.id)}
      ${field('关系标签', p.m2.relationTag, 'm2.relationTag', p.id)}
    </div>`;
}

function renderDrawerResourceProvider(p) {
  return `
    <div class="drawer-section">
      <div class="drawer-section-title">模块一 · 资源方描述</div>
      ${field('身份标签', p.m1.identityTag, 'm1.identityTag', p.id)}
      <div class="field-row">
        <div class="field-label">技术成熟度（1-3）</div>
        <div class="field-value" onclick="startFieldEdit(this,'${p.id}','m1.techMaturity')">${p.m1.techMaturity}</div>
      </div>
      <div class="field-row">
        <div class="field-label">资源完备度（1-3）</div>
        <div class="field-value" onclick="startFieldEdit(this,'${p.id}','m1.resourceCompleteness')">${p.m1.resourceCompleteness}</div>
      </div>
    </div>
    <div class="drawer-section">
      <div class="drawer-section-title">模块二 · 标签</div>
      ${field('行业标签', p.m2.industryTag, 'm2.industryTag', p.id)}
      ${field('场景标签', p.m2.sceneTag, 'm2.sceneTag', p.id)}
      ${field('关系标签', p.m2.relationTag, 'm2.relationTag', p.id)}
    </div>`;
}

// ─────────────────────────────────────────
// 内联字段编辑
// ─────────────────────────────────────────
function startFieldEdit(el, personaId, fieldPath) {
  if (el.querySelector('input,textarea')) return;
  const current = el.textContent.trim() === '—' ? '' : el.textContent.trim();
  const isMultiline = current.length > 40;
  const input = document.createElement(isMultiline ? 'textarea' : 'input');
  input.className = 'field-edit-input';
  input.value = current;
  if (isMultiline) input.rows = 3;
  el.innerHTML = '';
  el.appendChild(input);
  input.focus();
  input.select();

  const save = () => {
    const newVal = input.value.trim();
    saveFieldEdit(personaId, fieldPath, newVal);
    el.textContent = newVal || '—';
  };
  input.addEventListener('blur', save);
  input.addEventListener('keydown', e => {
    if (!isMultiline && e.key === 'Enter') { e.preventDefault(); input.blur(); }
    if (e.key === 'Escape') { el.textContent = current || '—'; }
  });
}

function saveFieldEdit(personaId, fieldPath, value) {
  const p = allPersonas.find(x => x.id === personaId);
  if (!p) return;
  markEdited(p);
  const parts = fieldPath.split('.');
  let obj = p;
  for (let i = 0; i < parts.length - 1; i++) obj = obj[parts[i]];
  obj[parts[parts.length - 1]] = value;
  const restoreBtn = document.getElementById('drawer-restore-btn');
  if (restoreBtn) restoreBtn.style.display = 'block';
  const cardEl = document.getElementById(`card-${personaId}`);
  if (cardEl) cardEl.outerHTML = renderCard(p);
}

// ─────────────────────────────────────────
// 市场浏览
// ─────────────────────────────────────────
function loadBrowsePersonas() {
  const groups = getAllGroups();
  const personas = [];
  groups.forEach(g => {
    [...g.targetUsers, ...g.extremeUsers, ...g.stakeholders,
     ...g.decisionMakers, ...g.resourceProviders].forEach(p => personas.push(p));
  });
  const draft = loadDraft();
  if (draft && draft.personas) draft.personas.forEach(p => {
    if (!personas.find(x => x.id === p.id)) personas.push(p);
  });
  allPersonas = personas;
  updateBadges();
  renderBrowseCards();
}

function updateBadges() {
  const count = (type) => allPersonas.filter(p => p.type === type).length;
  document.getElementById('badge-user').textContent       = count('target_user') + count('extreme_user');
  document.getElementById('badge-stakeholder').textContent= count('stakeholder');
  document.getElementById('badge-decision').textContent   = count('decision_maker');
  document.getElementById('badge-resource').textContent   = count('resource_provider');
}

function renderBrowseCards() {
  const typeMap = {
    user:        ['target_user','extreme_user'],
    stakeholder: ['stakeholder'],
    decision:    ['decision_maker'],
    resource:    ['resource_provider']
  };
  const types = typeMap[currentCatTab];
  let filtered = allPersonas.filter(p => types.includes(p.type));
  const hasSel = Object.values(selectedTags).some(a => a.length > 0);
  if (hasSel) {
    filtered = filtered.filter(p => {
      const tags = getPersonaTags(p);
      return (
        (selectedTags.industry.length === 0 || selectedTags.industry.some(t => tags.includes(t))) &&
        (selectedTags.scene.length === 0    || selectedTags.scene.some(t => tags.includes(t))) &&
        (selectedTags.theme.length === 0    || selectedTags.theme.some(t => tags.includes(t)))
      );
    });
  }
  const el = document.getElementById('browse-cards');
  if (!el) return;
  if (filtered.length === 0) {
    el.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <div class="big">🗂</div>
      <p>暂无角色<br>请先在「AI 生成」模式生成并保存角色组</p>
    </div>`;
    return;
  }
  el.innerHTML = filtered.map(p => renderCard(p)).join('');
}

function getPersonaTags(p) {
  const m = p.m5 || p.m4 || p.m2;
  return [m?.industryTag, m?.sceneTag, m?.themeTag].filter(Boolean);
}

// ─────────────────────────────────────────
// 我的角色组列表
// ─────────────────────────────────────────
function renderGroupsList() {
  const groups = getAllGroups();
  const el = document.getElementById('groups-list');
  if (!el) return;
  if (groups.length === 0) {
    el.innerHTML = `<div class="empty-state">
      <div class="big">📦</div>
      <p>还没有保存的角色组<br>去「AI 生成」模式生成并保存角色组</p>
    </div>`;
    return;
  }
  el.innerHTML = groups.map(g => `
    <div style="background:var(--bg2);border:1px solid var(--border);border-radius:var(--radius);padding:16px;margin-bottom:12px">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:10px">
        <div>
          <div style="font-size:15px;font-weight:600;color:var(--text)">${escHtml(g.projectTheme)}</div>
          <div style="font-size:12px;color:var(--text3);margin-top:3px">${new Date(g.createdAt).toLocaleDateString('zh-CN')}</div>
        </div>
        <div style="display:flex;gap:6px">
          <button class="nav-btn" onclick="loadGroupToGenerate('${g.id}')">查看</button>
          <button class="nav-btn" style="color:var(--red);border-color:var(--red)" onclick="deleteGroupConfirm('${g.id}')">删除</button>
        </div>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        <span style="font-size:12px;color:var(--text3)">目标用户 ${g.targetUsers.length} · 极端用户 ${g.extremeUsers.length} · 利益相关方 ${g.stakeholders.length} · 决策者 ${g.decisionMakers.length} · 资源方 ${g.resourceProviders.length}</span>
      </div>
      <div class="card-tags" style="margin-top:8px">
        ${[...(g.tags.industry||[]), ...(g.tags.scene||[]), ...(g.tags.theme||[])].map(t => `<span class="card-tag">${escHtml(t)}</span>`).join('')}
      </div>
    </div>`).join('');
}

function loadGroupToGenerate(groupId) {
  const g = getGroupById(groupId);
  if (!g) return;
  allPersonas = [...g.targetUsers, ...g.extremeUsers, ...g.stakeholders, ...g.decisionMakers, ...g.resourceProviders];
  document.getElementById('input-theme-main').value = g.projectTheme;
  switchMode('generate');
  const resultEl = document.getElementById('generate-result');
  resultEl.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
      <div style="font-size:14px;color:var(--text2)">已加载角色组 · ${escHtml(g.projectTheme)}</div>
    </div>
    <div class="persona-rows">${renderPersonaRows(allPersonas)}</div>`;
}

function deleteGroupConfirm(groupId) {
  if (!confirm('确定要删除这个角色组吗？')) return;
  deleteGroup(groupId);
  renderGroupsList();
  showToast('已删除角色组');
}

// ─────────────────────────────────────────
// 工具函数
// ─────────────────────────────────────────
function getPersonaTitle(p) {
  if (p.type === 'target_user')       return p.m1.name;
  if (p.type === 'extreme_user')      return p.m1.name;
  if (p.type === 'stakeholder')       return p.m1.identityTag;
  if (p.type === 'decision_maker')    return '业务决策者';
  if (p.type === 'resource_provider') return p.m1.identityTag;
  return '角色';
}

function escHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function downloadText(text, filename) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], {type: 'text/markdown'}));
  a.download = filename;
  a.click();
}

function showToast(msg, type = 'success') {
  const wrap = document.getElementById('toast-wrap');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = msg;
  wrap.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity .3s';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
