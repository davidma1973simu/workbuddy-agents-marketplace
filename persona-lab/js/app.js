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
  // 先识别标签（用于生成数据），直接进入生成
  const tags = recognizeTags(theme);
  _doGenerate(theme, bg, assume, tags);
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
// 本地标签识别
// ─────────────────────────────────────────
function recognizeTags(theme) {
  const result = { industry: [], scene: [], theme: [] };
  const text = theme.toLowerCase();

  const industryMap = {
    '零售': ['零售','商场','门店','专卖','商店','购物','鞋服','服装'],
    '医疗': ['医疗','医院','诊所','健康','医生','患者'],
    '教育': ['教育','学校','培训','课程','学习','学生'],
    '金融': ['金融','银行','保险','理财','投资'],
    '餐饮': ['餐饮','餐厅','外卖','食物','菜单'],
    '出行': ['出行','交通','出租','网约','地铁','公交'],
    '科技': ['科技','互联网','app','软件','数字'],
    '制造': ['制造','工厂','生产','供应链'],
  };
  const sceneMap = {
    '流程创新': ['流程','效率','优化流程'],
    '服务设计': ['服务','体验','用户体验','客户体验'],
    '体验优化': ['体验','满意度','成交率','转化'],
    '商业模式': ['商业','盈利','模式','变现'],
    '数字化转型': ['数字化','智能化','数字转型'],
  };
  const themeMap = {
    '认知负荷': ['认知','术语','复杂','过载','难懂'],
    '决策辅助': ['决策','选择','成交','购买'],
    '数字化':   ['数字','智能','线上','app'],
    '用户满意度': ['满意','满意度','不满'],
  };

  [[industryMap, result.industry],[sceneMap, result.scene],[themeMap, result.theme]]
    .forEach(([map, arr]) => {
      Object.entries(map).forEach(([tag, kws]) => {
        if (kws.some(k => text.includes(k))) arr.push(tag);
      });
    });

  result.industry = [...new Set(result.industry)].slice(0,3);
  result.scene    = [...new Set(result.scene)].slice(0,3);
  result.theme    = [...new Set(result.theme)].slice(0,3);
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
// 演示数据构建
// ─────────────────────────────────────────
function buildDemoPersonas(theme, tags) {
  const industry = (tags.industry && tags.industry[0]) || '零售';
  const scene    = (tags.scene    && tags.scene[0])    || '门店体验优化';
  const themeTag = (tags.theme    && tags.theme[0])    || '认知负荷';
  const personas = [];

  // ── 目标用户
  const tu = createTargetUser({
    m1: { name: '林晓雯', age: '32岁', occupation: '市场专员 · 快消行业', city: '上海', avatarTag: '都市休闲风' },
    m2: { lifestyle: '工作日快节奏，周末喜欢逛街和健身', decisionStyle: '习惯货比三家，依赖口碑和社交推荐', infoSource: '小红书、朋友推荐、偶尔看公众号', typicalBehavior: '进店先观察环境，不主动开口，靠感觉做判断' },
    m3: { explicitGoal: '想买一双上班也能穿的运动鞋', hiddenNeed: '希望有人帮我快速决定，不想显得不懂行', corePain: '看不懂术语，问了怕被推销，最后离店', emotionState: '期待但有点不安' },
    m4: { personality: '独立、务实、略带完美主义 · 主要受益者', coreValues: '真实感、不被套路、性价比 · 对新引导方式开放', innerMotivation: '希望通过外形表达自我，但不愿为此花太多精力', quote: '「我不是不想买，就是不知道那些词是什么意思，算了不问了」' },
    m5: { industryTag: industry, sceneTag: scene, themeTag },
    summary: `上海快节奏上班族，务实独立，进入${industry}专卖店时因看不懂产品术语而陷入沉默，表面是选择困难，内心渴望的是「被看见但不被套路」的购物体验。`
  });
  personas.push(tu);

  // ── 极端用户 A（重度端）
  const euA = createExtremeUser({
    side: EXTREME_SIDE.HEAVY,
    m1: { name: '陈建国', ageOccupation: '45岁 · 资深买手', extremeTag: '术语狂热者' },
    m2: { extremeBehavior: '进店直接报 SKU 编号，逐一考验导购的专业深度', workaround: '自建选购电子表格，比导购更了解每款鞋的技术参数' },
    m3: { explicitNeed: '专业认同感和掌控感', linkedTargetUserId: tu.id, inspirationForTarget: '目标用户也渴望「懂行感」，只是程度更隐性——她不需要专家级知识，但需要能快速「听懂」的信息' },
    m4: { industryTag: industry, sceneTag: scene, themeTag }
  });
  personas.push(euA);

  // ── 极端用户 B（轻度端）
  const euB = createExtremeUser({
    side: EXTREME_SIDE.LIGHT,
    m1: { name: '周静', ageOccupation: '28岁 · 设计师', extremeTag: '完全回避者' },
    m2: { extremeBehavior: '在门店门口看了30秒直接走，认为「进去就头大」', workaround: '完全转向网购，靠买家秀和评论区做购买决策' },
    m3: { explicitNeed: '零门槛、零压力的选择体验', linkedTargetUserId: tu.id, inspirationForTarget: '目标用户的术语恐惧比表面看到的更普遍——即使有购买意愿，信息壁垒已经在门口就筛走了潜在顾客' },
    m4: { industryTag: industry, sceneTag: scene, themeTag }
  });
  euA.linkedExtremeUsers = [euB.id];
  personas.push(euB);

  // ── 利益相关方
  personas.push(createStakeholder({
    m1: { identityTag: '第一线导购员', coreDemand: '业绩稳定、话术简单不增加培训压力、被客户尊重', influence: -2 },
    m2: { industryTag: industry, sceneTag: scene, relationTag: '内部执行层' }
  }));
  personas.push(createStakeholder({
    m1: { identityTag: '品牌形象顾问', coreDemand: '维护专业品牌调性，不希望「过度简化」损害品牌溢价', influence: -1 },
    m2: { industryTag: industry, sceneTag: scene, relationTag: '外部合作方' }
  }));

  // ── 决策者（归入利益相关方行）
  personas.push(createDecisionMaker({
    m1: { coreConcern: '季度成交率提升、培训成本可控、品牌形象不受损', valueSensitivity: 3, innovationDesire: 2 },
    m2: { industryTag: industry, sceneTag: scene, relationTag: '内部决策层' }
  }));

  // ── 资源提供者
  personas.push(createResourceProvider({
    m1: { identityTag: '门店 IT 系统供应商', techMaturity: 3, resourceCompleteness: 2 },
    m2: { industryTag: industry, sceneTag: scene, relationTag: '外部技术合作方' }
  }));

  return personas;
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
  const avatar = TYPE_AVATAR[p.type] || '👤';
  const edited = p._edited ? '<span class="edited-badge">已编辑</span>' : '';
  let inner = '';

  if (p.type === 'target_user') {
    inner = `
      <div class="card-head">
        <div class="card-avatar">${avatar}</div>
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
        <div class="card-avatar">${avatar}</div>
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
        <div class="card-avatar">${avatar}</div>
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
        <div class="card-avatar">${avatar}</div>
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
        <div class="card-avatar">${avatar}</div>
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
