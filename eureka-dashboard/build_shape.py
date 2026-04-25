#!/usr/bin/env python3
"""Build shape.html JS section for tasks 12-15"""

JS_CONTENT = r"""
// ===================================================
// TASKS CONFIG
// ===================================================
const TASKS = {
  12: {
    title: '拷问创意想法',
    badge: 'Shape · 任务 12/15',
    icon: '🔍',
    deliverable: '四维拷问清单',
    objective: '基于 Inspire 阶段的最佳创意和 AHA 价值假设，从用户、商业、技术、利益相关者四个维度深入质疑，找出创意的最大风险点和薄弱环节，为方案整合提供靶点。',
    concept: '四维拷问框架帮你在早期发现创意的致命缺陷：\n\n👤 用户维度：用户真的在乎这个解决方案吗？痛点有多深？\n💰 商业维度：如何盈利？护城河在哪里？能否规模化？\n⚙️ 技术维度：技术可行吗？壁垒是什么？\n🤝 生态维度：谁会支持或反对？如何平衡利益？',
    steps: [
      { title: '读取 Inspire 最佳创意', hint: '从 Inspire 阶段获取最佳创意和 AHA 价值假设，明确拷问的靶点' },
      { title: '逐维深入质疑', hint: '每个维度产出 1-2 条核心拷问，直击要害，不要温和' },
      { title: 'AI 辅助生成拷问', hint: '使用 AI 辅助生成更尖锐、更有深度的拷问' },
      { title: '输出综合判断', hint: '综合四维拷问，输出该想法的总体可行性判断和核心风险' },
    ],
    misconceptions: [
      '拷问过于温和，不敢质疑核心假设',
      '只关注一个维度，忽视其他维度的致命风险',
      '把"有没有解决方案"当成拷问，而不是发现真正的问题',
    ],
    coachIntro: '🔍 任务 12 开始！\n\n四维拷问的目标不是否定创意，而是尽早发现它的致命弱点。\n\n最好的做法：\n· 从最熟悉的维度开始，但每个维度都要有\n· 读 Inspire 的最佳创意时，想象最挑剔的用户会怎么质疑\n· 越早在内部发现缺陷，越容易修正\n\n你从哪个维度开始？',
  },
  13: {
    title: '方案整合发展',
    badge: 'Shape · 任务 13/15',
    icon: '📊',
    deliverable: '概念方案文档',
    objective: '基于四维拷问的结论，整合用户、商业、技术、生态四个维度的洞察，生成一份完整的《概念方案》文档，并通过 MAP 评分评估其商业价值潜力。',
    concept: '概念方案是创意从"点子"变成"方案"的关键一步：\n\n整合四维洞察：用户诉求 → 商业模型 → 技术路径 → 生态关系\nMAP 评分：M(市场潜力) / A(用户获取) / P(竞争优势) 各 1-5 分\n综合判断：基于 MAP 评分给出方案的整体商业价值评估',
    steps: [
      { title: '填写概念方案四维内容', hint: '基于任务 12 的四维拷问，在各维度填写具体的方案内容' },
      { title: '执行 MAP 评分', hint: '对概念方案进行 M/A/P 三维评分（参考 Inspire 阶段的评分）' },
      { title: '综合判断', hint: '基于四维内容和 MAP 评分，给出方案的整体可行性和商业价值判断' },
    ],
    misconceptions: [
      '概念方案变成功能列表，缺乏用户视角和商业逻辑',
      'MAP 评分过于乐观，没有真实反映市场现实',
      '四维内容各自为政，缺乏内在逻辑一致性',
    ],
    coachIntro: '📊 任务 13 是把拷问变成方案！\n\n四维拷问发现了风险，概念方案要给出应对之道。\n\n写概念方案的技巧：\n· 每个维度都要回答"所以呢"——不只是描述，要给出判断\n· MAP 评分要真实：把自己当成最苛刻的投资人\n· 好的概念方案应该有内在一致的故事线\n\n哪个维度你最有把握？',
  },
  14: {
    title: '用户故事描述',
    badge: 'Shape · 任务 14/15',
    icon: '🎬',
    deliverable: '六格故事板',
    objective: '基于概念方案和 AHA 价值设计，用故事化的方式描绘用户的完整体验旅程——从痛苦到发现，从探索到顿悟，从成长到传播。',
    concept: '六格故事板用叙事的方式呈现用户旅程：\n\n😰 痛苦时刻：用户当前的困境\n💡 顿悟时刻：用户发现了什么\n🌈 探索方案：用户如何寻找\n✨ AHA 时刻：惊喜的高光\n🚀 成长轨迹：真实改变发生\n💬 口碑传播：用户主动推荐\n\n好的故事板用情感和场景说话，而不是功能和流程。',
    steps: [
      { title: '回顾 AHA 价值设计', hint: '从 Inspire 阶段获取 AHA 价值假设，明确要传达的核心体验' },
      { title: '绘制六格故事板', hint: '依次填写六个关键时刻，用场景化、情感化的语言讲故事' },
      { title: '检验故事完整性', hint: '六个格子应该串成一条完整的故事线，有起承转合' },
    ],
    misconceptions: [
      '用功能流程代替用户感受，把故事板写成产品手册',
      '缺乏情感细节，只有"用户登录→点击→完成"的描述',
      '六个格子孤立，缺乏故事线的起承转合',
    ],
    coachIntro: '🎬 任务 14 ——讲故事！\n\n好的故事板能让投资人、团队伙伴3分钟内被你的创意打动。\n\n技巧：\n· 想象一个具体的真实用户在真实场景里的反应\n· 少说"用户可以..."，多说"用户感到..."、"用户发现..."\n· 问自己：这个故事有人愿意转发给朋友吗？\n\n哪个时刻你最有灵感？',
  },
  15: {
    title: 'AHA 用户价值设计',
    badge: 'Shape · 任务 15/15',
    icon: '✨',
    deliverable: 'AHA 价值设计方案',
    objective: '在 Inspire AHA 框架的基础上，结合六格故事板和概念方案，深化并具体化三维 AHA 价值设计——让每一个 AHA 时刻都有清晰、动人、可验证的描述。',
    concept: 'Shape 阶段的 AHA 是对 Inspire AHA 的深化和具体化：\n\n💡 顿悟（Eureka）：用户第一次获得认知突破的时刻——"原来还可以这样！"\n✨ 高光（Highlight）：使用过程中最令用户激动的情感高峰——"这感觉太棒了！"\n🚀 进步（Progress）：长期使用后用户实现的真实改变——"这真的改变了我的生活！"\n\n每个 AHA 都要用具体、场景化、情感化的语言描述。',
    steps: [
      { title: '撰写核心定位', hint: '用一句话描述方案给用户的核心价值主张（15字以内）' },
      { title: '深化 AHA 三维', hint: '结合六格故事板，在 Inspire AHA 基础上深化每个维度的描述' },
      { title: 'AI 辅助完善', hint: '使用 AI 辅助生成更生动、更情感化的 AHA 描述' },
    ],
    misconceptions: [
      'AHA 描述停留于功能层面，缺乏情感深度',
      '三个维度描述趋同，没有各自的独特价值',
      '缺乏具体场景，让用户无法想象那个 AHA 时刻',
    ],
    coachIntro: '✨ 最后冲刺！任务 15 是整个 Shape 阶段的高光时刻！\n\nAHA 的力量在于：让听到它的人立刻想体验。\n\n好的 AHA 描述：\n· 有具体的场景（而不是"用户感到满意"）\n· 有情感的词汇（"愣住"、"倒吸一口凉气"、"忍不住发朋友圈"）\n· 让他人读完就想行动\n\n你印象中最让你惊喜的产品体验是什么？',
  },
};

// ===================================================
// STATE
// ===================================================
const SHAPE_KEY = 'eureka_shape_v1';
const INSPIRE_KEY = 'eureka_inspire_v1';
const REVEAL_KEY = 'eureka_project_data_v1';
const AI_CONFIG_KEY = 'eureka_learn_ai_v1';

const state = {
  currentTask: 12,
  tasks: {},           // task data keyed by taskId
  dim4Items: { user:[], biz:[], tech:[], stkh:[] }, // Task 12: 四维拷问
  cpSections: {},      // Task 13: 概念方案各维度内容
  mapScores2: {},      // Task 13: MAP打分 {dim:{m:0,a:0,p:0}}
  storyBoard: Array(6).fill(''),  // Task 14: 故事板6格
  ahaDesign: { title:'', eureka:'', highlight:'', progress:'' }, // Task 15
};

// ===================================================
// CROSS-MODULE DATA READING
// ===================================================
function getInspireData() {
  try {
    const raw = localStorage.getItem(INSPIRE_KEY);
    if (raw) return JSON.parse(raw);
  } catch(e) {}
  return null;
}

function getRevealData() {
  try {
    const raw = localStorage.getItem(REVEAL_KEY);
    if (raw) return JSON.parse(raw);
  } catch(e) {}
  try {
    const pid = localStorage.getItem('eureka_learn_current_v2') || '';
    const key = 'eureka_learn_state_' + pid;
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch(e) {}
  return null;
}

function getCrossContext() {
  const inspire = getInspireData() || {};
  const reveal = getRevealData() || {};

  // Best idea from Inspire task 11
  let bestIdea = '';
  let bestAha = {};
  let bizMapping = {};
  let mapScores = {};
  try {
    const t11 = inspire.tasks && inspire.tasks[11] ? inspire.tasks[11] :
                (inspire.task11 || {});
    bestIdea = t11.bestIdeaText || t11.ahaData?.ideaRef || t11.ideaRef || '';
    bestAha = t11.ahaData || {};
    bizMapping = t11.bizMapping || inspire.bizMapping || {};
    mapScores = t11.mapScores || inspire.mapScores || {};
  } catch(e) {}

  // POV from Reveal
  let pov = '';
  try {
    const t6 = (reveal.tasks || {})[6] || reveal.reveal?.module2?.task6 || {};
    pov = t6.pov_statement || t6.pov || '';
  } catch(e) {}

  // User persona from Reveal
  let persona = '';
  try {
    const t3 = (reveal.tasks || {})[3] || reveal.reveal?.module1?.task3 || {};
    persona = t3.persona_summary || t3.persona || '';
  } catch(e) {}

  return { inspire, reveal, bestIdea, bestAha, bizMapping, mapScores, pov, persona };
}

function renderInspireDataCard() {
  const body = document.getElementById('inspire-data-body');
  if (!body) return;
  const ctx = getCrossContext();
  let html = '';

  if (ctx.bestIdea) {
    html += `<div class="s-card-item"><span class="inspire-lbl">💡 Inspire 最佳创意</span><div class="inspire-val">${esc(ctx.bestIdea.substring(0,100))}${ctx.bestIdea.length>100?'…':''}</div></div>`;
    html += '<div class="inspire-sep"></div>';
  }
  if (ctx.bestAha.eureka || ctx.bestAha.highlight || ctx.bestAha.progress) {
    const items = [];
    if (ctx.bestAha.eureka) items.push({l:'顿悟',v:ctx.bestAha.eureka});
    if (ctx.bestAha.highlight) items.push({l:'高光',v:ctx.bestAha.highlight});
    if (ctx.bestAha.progress) items.push({l:'进步',v:ctx.bestAha.progress});
    items.forEach(it => {
      html += `<div class="s-card-item"><span class="inspire-lbl">✨ ${it.l}</span><div class="inspire-val">${esc(it.v.substring(0,80))}${it.v.length>80?'…':''}</div></div>`;
    });
    html += '<div class="inspire-sep"></div>';
  }
  if (ctx.pov) {
    html += `<div class="s-card-item"><span class="reveal-lbl">🔵 Reveal POV</span><div class="reveal-val">${esc(ctx.pov.substring(0,100))}${ctx.pov.length>100?'…':''}</div></div>`;
  }
  if (!html) {
    html = '<div style="font-size:12px;color:#94a3b8;font-style:italic">暂无 Inspire/Reveal 数据<br><a href="inspire.html" style="color:#f97316">请先完成 Inspire 阶段</a></div>';
  }
  body.innerHTML = html;
}

// ===================================================
// STORAGE
// ===================================================
function loadState() {
  try {
    const raw = localStorage.getItem(SHAPE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      state.tasks = saved.tasks || {};
      state.dim4Items = saved.dim4Items || { user:[], biz:[], tech:[], stkh:[] };
      state.cpSections = saved.cpSections || {};
      state.mapScores2 = saved.mapScores2 || {};
      state.storyBoard = saved.storyBoard || Array(6).fill('');
      state.ahaDesign = saved.ahaDesign || { title:'', eureka:'', highlight:'', progress:'' };
    }
  } catch(e) { console.warn('loadState err', e); }
}

function saveState() {
  localStorage.setItem(SHAPE_KEY, JSON.stringify({
    tasks: state.tasks,
    dim4Items: state.dim4Items,
    cpSections: state.cpSections,
    mapScores2: state.mapScores2,
    storyBoard: state.storyBoard,
    ahaDesign: state.ahaDesign,
    updatedAt: new Date().toISOString()
  }));
  updateProgressUI();
}

function getTaskData(n) { return state.tasks[n] || {}; }
function setTaskData(n, data) {
  state.tasks[n] = { ...(state.tasks[n]||{}), ...data };
  saveState();
}
function isTaskDone(n) { return (state.tasks[n]||{}).status === 'done'; }

// ===================================================
// UI HELPERS
// ===================================================
function esc(s) {
  if (s == null) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function showToast(msg, dur) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), dur || 2500);
}

function updateProgressUI() {
  const TASK_NUMS = [12,13,14,15];
  const done = TASK_NUMS.filter(n => isTaskDone(n)).length;
  const pct = done / TASK_NUMS.length * 100;

  const syncBadge = document.getElementById('nav-sync-badge');
  if (syncBadge) {
    syncBadge.querySelector('span:last-child').textContent = done > 0 ? '已同步' : '待开始';
  }

  const pbar = document.getElementById('sidebar-progress');
  if (pbar) pbar.style.width = pct + '%';

  TASK_NUMS.forEach(n => {
    const st = document.getElementById('stat-' + n);
    const item = document.getElementById('task-item-' + n);
    if (!st || !item) return;
    const isDone = isTaskDone(n);
    const isActive = state.currentTask === n;
    st.textContent = isDone ? '✅ 已完成' : (isActive ? '进行中' : '未开始');
    item.classList.toggle('done', isDone);
    item.classList.toggle('active', isActive && !isDone);
  });
}

function renderTipsCard(n) {
  const el = document.getElementById('tips-card');
  const task = TASKS[n];
  if (!task || !task.misconceptions || !task.misconceptions.length) { if(el) el.innerHTML=''; return; }
  el.innerHTML = [
    '<div class="s-card-hdr tips-hdr"><span class="icon">⚠️</span><span class="lbl">常见误区</span></div>',
    '<div class="s-card-body">',
    task.misconceptions.map(m => '<div class="s-card-item tips-item">'+esc(m)+'</div>').join(''),
    '</div>'
  ].join('');
}

// ===================================================
// TASK SWITCHING
// ===================================================
function switchTask(n) {
  state.currentTask = n;
  updateProgressUI();
  renderInspireDataCard();
  renderTipsCard(n);
  renderTaskContent(n);
  document.getElementById('ai-messages').innerHTML = '';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===================================================
// TASK RENDERER (dispatcher)
// ===================================================
function renderTaskContent(n) {
  const el = document.getElementById('task-content');
  const task = TASKS[n];
  const data = getTaskData(n);
  const isDone = isTaskDone(n);

  if (!task) { el.innerHTML = '<div style="padding:40px;text-align:center;color:#94a3b8">任务配置不存在</div>'; return; }

  let inner = `
  <div class="task-hdr">
    <div class="step-badge">${task.badge}</div>
    <h2>${task.icon} ${task.title}</h2>
    <div class="obj">${task.objective}</div>
    <div class="dlv-row">
      <span class="dlv-label">📦 产出物：</span>
      <span class="dlv-tag">✅ ${task.deliverable}</span>
    </div>
  </div>
  <div class="concept-box">
    <div class="sec-label">💡 关键概念</div>
    <div class="concept-text">${esc(task.concept).replace(/\\n/g,'<br>')}</div>
  </div>
  <div class="steps-box">
    <div class="sec-label">📌 操作步骤</div>
    <div class="step-list">${task.steps.map((s,i)=>`
    <div class="step-row">
      <div class="s-circle">${i+1}</div>
      <div><div class="s-title">${esc(s.title)}</div><div class="s-hint">${esc(s.hint)}</div></div>
    </div>`).join('')}</div>
  </div>`;

  // task-specific form
  if (n === 12) inner += renderTask12Form(data, isDone);
  else if (n === 13) inner += renderTask13Form(data, isDone);
  else if (n === 14) inner += renderTask14Form(data, isDone);
  else if (n === 15) inner += renderTask15Form(data, isDone);

  // done banner
  if (isDone) {
    inner += `<div class="done-banner"><span class="icon">🎉</span><div><div class="msg">任务已完成！</div><div class="sub">你可以随时返回修改，进度会自动保存</div></div></div>`;
  }

  // action bar
  inner += `
  <div class="action-bar">
    <div class="save-hint">🔒 进度自动保存，随时可返回继续</div>
    <div style="display:flex;gap:10px;flex-wrap:wrap">
      <button class="btn-ai" onclick="openAI()">💬 AI 辅导</button>
      <button class="btn-sec" onclick="saveDraft(${n})">保存草稿</button>
      <button class="btn-pri" onclick="submitTask(${n})">${isDone ? '✓ 更新保存' : '✓ 提交完成'}</button>
    </div>
  </div>`;

  el.innerHTML = inner;
}

// ===================================================
// TASK 12: 四维拷问
// ===================================================
const DIM4 = [
  { key:'user',  cls:'dim-user',  icon:'👤', title:'用户挑战', sub:'针对目标用户的核心质疑', q:'这个想法真正解决了用户的什么问题？用户真的在乎吗？' },
  { key:'biz',   cls:'dim-biz',   icon:'💰', title:'商业挑战', sub:'商业可行性与价值链质疑', q:'这个想法如何盈利？能规模化吗？护城河在哪里？' },
  { key:'tech',  cls:'dim-tech',  icon:'⚙️', title:'技术挑战', sub:'技术可行性与实现路径', q:'现有技术能支撑这个方案吗？核心壁垒是什么？' },
  { key:'stkh',  cls:'dim-stkh',  icon:'🤝', title:'利益相关者挑战', sub:'生态与利益平衡', q:'谁是利益相关者？如何平衡各方诉求？如何建立合作关系？' },
];

function renderTask12Form(data, isDone) {
  const ctx = getCrossContext();
  const bestIdea = ctx.bestIdea || '';

  return `
  <div class="ctx-ctx">
    <div class="ctx-ctx-title">📎 来自 Inspire 的关键输入</div>
    ${bestIdea
      ? `<div class="ctx-ctx-content">💡 <strong>最佳创意</strong>：${esc(bestIdea)}</div>`
      : `<div class="ctx-ctx-empty">未找到 Inspire 数据，<a href="inspire.html" style="color:#f97316">请先完成 Inspire 阶段</a></div>`
    }
  </div>
  <div class="form-area">
    <div class="form-group">
      <div class="form-label">四维拷问 <span style="font-size:11px;font-weight:400;color:#64748b">来自 Inspire 最佳创意，请逐维深入质疑</span></div>
      <div class="form-hint">每个维度记录 1-2 条核心拷问及其初步回答。点击各卡片展开，AI 可辅助生成建议。</div>
      <div class="dim4-grid">
        ${DIM4.map(dim => renderDim4Card(dim)).join('')}
      </div>
    </div>

    <div class="form-group">
      <div class="form-label">📝 综合判断</div>
      <div class="form-hint">综合四维拷问，该想法的总体可行性评估和关键风险点是什么？</div>
      <textarea id="f12-summary" rows="4" placeholder="综合四维拷问，输出你的核心判断（100-200字）…" oninput="autoSave12()">${esc(data.summary||'')}</textarea>
    </div>
  </div>`;
}

function renderDim4Card(dim) {
  const items = state.dim4Items[dim.key] || [];
  return `
  <div class="dim4-card ${dim.cls}">
    <div class="dim4-hdr">
      <div class="dim4-icon">${dim.icon}</div>
      <div>
        <div class="dim4-title">${dim.title}</div>
        <div class="dim4-sub">${dim.sub}</div>
      </div>
    </div>
    <div class="dim4-body">
      <div class="dim4-q-list" id="dim4-list-${dim.key}">
        ${items.map((q,i) => `
        <div class="dim4-q-row fade-in">
          <div class="dim4-q-text">${esc(q)}</div>
          <button class="dim4-q-del" onclick="delDim4Q('${dim.key}',${i})">✕</button>
        </div>`).join('')}
        ${items.length === 0 ? `<div style="font-size:11px;color:#94a3b8;text-align:center;padding:8px">暂无拷问，点击下方添加</div>` : ''}
      </div>
      <button class="dim4-ai-btn" onclick="genDim4AI('${dim.key}')" id="dim4-ai-btn-${dim.key}">
        ✨ AI 辅助生成
      </button>
      <div class="dim4-add">
        <input type="text" id="dim4-input-${dim.key}" placeholder="输入核心拷问…" onkeydown="if(event.key==='Enter')addDim4Q('${dim.key}')">
        <button class="dim4-add-btn" onclick="addDim4Q('${dim.key}')">+</button>
      </div>
    </div>
  </div>`;
}

function addDim4Q(key) {
  const input = document.getElementById('dim4-input-' + key);
  if (!input || !input.value.trim()) return;
  state.dim4Items[key] = state.dim4Items[key] || [];
  state.dim4Items[key].push(input.value.trim());
  input.value = '';
  saveState();
  refreshDim4Card(key);
  showToast('✅ 已添加');
}

function delDim4Q(key, idx) {
  state.dim4Items[key].splice(idx, 1);
  saveState();
  refreshDim4Card(key);
}

function refreshDim4Card(key) {
  const list = document.getElementById('dim4-list-' + key);
  if (!list) return;
  const items = state.dim4Items[key] || [];
  list.innerHTML = items.map((q,i) => `
    <div class="dim4-q-row fade-in">
      <div class="dim4-q-text">${esc(q)}</div>
      <button class="dim4-q-del" onclick="delDim4Q('${key}',${i})">✕</button>
    </div>`).join('') ||
    `<div style="font-size:11px;color:#94a3b8;text-align:center;padding:8px">暂无拷问，点击下方添加</div>`;
}

function autoSave12() {
  const summary = (document.getElementById('f12-summary')||{}).value || '';
  setTaskData(12, { summary });
}

function genDim4AI(key) {
  const dim = DIM4.find(d => d.key === key);
  const ctx = getCrossContext();
  const bestIdea = ctx.bestIdea || '（未提供）';
  const dimNames = { user:'用户挑战', biz:'商业挑战', tech:'技术挑战', stkh:'利益相关者挑战' };

  const btn = document.getElementById('dim4-ai-btn-' + key);
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="loading-dots"><span></span><span></span><span></span></span> 生成中…'; }

  const prompt = `基于以下创意，给出【${dimNames[key]}】维度的 1 条核心拷问（直击要害，质疑式语言，50字以内）：
创意：${bestIdea}
直接输出内容，不要前缀。`;

  callAI(prompt, text => {
    const q = text.trim().replace(/^[1-9][\.\)、]\s*/, '').trim();
    if (q && q.length > 5) {
      state.dim4Items[key] = state.dim4Items[key] || [];
      state.dim4Items[key].push(q);
      saveState();
      refreshDim4Card(key);
    }
    if (btn) { btn.disabled = false; btn.innerHTML = '✨ AI 辅助生成'; }
    showToast(q ? '✅ 已生成并添加' : '⚠️ 未生成有效内容');
  }, err => {
    if (btn) { btn.disabled = false; btn.innerHTML = '✨ AI 辅助生成'; }
    showToast('⚠️ ' + err);
  });
}

// ===================================================
// TASK 13: 方案整合发展
// ===================================================
const CP_DIMS = [
  { key:'user',   cls:'cp-user',     icon:'👤', title:'用户维度', q:'目标用户的核心诉求、使用场景、决策路径是什么？' },
  { key:'biz',    cls:'cp-biz',      icon:'💰', title:'商业维度', q:'如何盈利？收入模型、成本结构、护城河是什么？' },
  { key:'tech',   cls:'cp-tech',     icon:'⚙️', title:'技术维度', q:'技术选型、核心壁垒、规模化路径是什么？' },
  { key:'stkh',   cls:'cp-stkh',    icon:'🤝', title:'生态维度', q:'利益相关者有哪些？如何建立合作关系？' },
  { key:'overview',cls:'cp-overview',icon:'🧭', title:'综合概览', q:'整合四维，形成清晰的概念方案叙事' },
];

function renderTask13Form(data, isDone) {
  const ctx = getCrossContext();
  const bestIdea = ctx.bestIdea || '';

  // MAP scoring table based on Inspire data
  const inspireMAP = ctx.mapScores;
  const existingScores = state.mapScores2;

  return `
  <div class="ctx-ctx">
    <div class="ctx-ctx-title">📎 来自 Inspire 的关键输入</div>
    ${bestIdea
      ? `<div class="ctx-ctx-content">💡 <strong>最佳创意</strong>：${esc(bestIdea)}</div>`
      : `<div class="ctx-ctx-empty">未找到 Inspire 数据，请先完成 Inspire 阶段</div>`
    }
  </div>
  <div class="form-area">
    <div class="form-group">
      <div class="form-label">📋 概念方案 · 四维整合</div>
      <div class="form-hint">基于任务 12 的四维拷问，在各维度填写具体的概念方案内容（可引用四维拷问结论）。</div>
      ${CP_DIMS.map(dim => renderCPSection(dim)).join('')}
    </div>

    <div class="form-group">
      <div class="form-label">💰 MAP 商业价值评分</div>
      <div class="form-hint">M = 市场潜力 / A = 用户获取 / P = 竞争优势。1-5星评分，参考 Inspire 阶段的评分进行复核。</div>
      <div class="map-wrap">
        <table class="map-tbl">
          <thead>
            <tr>
              <th>维度</th><th>M 市场潜力</th><th>A 用户获取</th><th>P 竞争优势</th><th>Σ</th>
            </tr>
          </thead>
          <tbody>
            ${CP_DIMS.filter(d=>d.key!=='overview').map(dim => {
              const sc = existingScores[dim.key] || { m:3, a:3, p:3 };
              const total = (sc.m||0)+(sc.a||0)+(sc.p||0);
              return `<tr>
                <td><strong>${dim.icon} ${dim.title}</strong></td>
                ${['m','a','p'].map(k => `
                <td>
                  <div class="map-stars">
                    ${[1,2,3,4,5].map(s => `<span class="map-star ${s<=sc[k]?'on':''}" onclick="setMapScore2('${dim.key}','${k}',${s})">★</span>`).join('')}
                  </div>
                </td>`).join('')}
                <td><strong style="color:#10b981">${total}</strong></td>
              </tr>`;
            }).join('')}
            <tr style="background:#f0fdf4;font-weight:700">
              <td>总分</td>
              <td colspan="3"></td>
              <td style="color:#10b981;font-size:16px">${Object.values(existingScores).reduce((s,sc)=>s+(sc.m||0)+(sc.a||0)+(sc.p||0),0)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>`;
}

function renderCPSection(dim) {
  const content = state.cpSections[dim.key] || '';
  return `
  <div class="cp-section ${dim.cls}">
    <div class="cp-section-title">
      <span style="font-size:16px">${dim.icon}</span>
      <span>${dim.title}</span>
      <span style="font-size:11px;font-weight:400;opacity:.8;margin-left:4px">— ${dim.q}</span>
    </div>
    <textarea id="cp-${dim.key}" rows="4" placeholder="填写 ${dim.title} 的具体概念方案内容…" oninput="saveCPSection('${dim.key}',this.value)">${esc(content)}</textarea>
  </div>`;
}

function saveCPSection(key, val) {
  state.cpSections[key] = val;
  saveState();
}

function setMapScore2(dim, key, val) {
  state.mapScores2[dim] = state.mapScores2[dim] || { m:3, a:3, p:3 };
  state.mapScores2[dim][key] = val;
  saveState();
  // re-render the MAP table
  const data = getTaskData(13);
  const el = document.getElementById('task-content');
  if (el) {
    const formArea = el.querySelector('.form-area');
    if (formArea) {
      const mapGroup = formArea.querySelector('.form-group:last-child');
      if (mapGroup) {
        const mapWrap = mapGroup.querySelector('.map-wrap');
        if (mapWrap) {
          const tbody = mapWrap.querySelector('tbody');
          if (tbody) {
            tbody.innerHTML = CP_DIMS.filter(d=>d.key!=='overview').map(d => {
              const sc = state.mapScores2[d.key] || { m:3, a:3, p:3 };
              const total = (sc.m||0)+(sc.a||0)+(sc.p||0);
              return `<tr>
                <td><strong>${d.icon} ${d.title}</strong></td>
                ${['m','a','p'].map(k => `<td><div class="map-stars">${[1,2,3,4,5].map(s => `<span class="map-star ${s<=sc[k]?'on':''}" onclick="setMapScore2('${d.key}','${k}',${s})">★</span>`).join('')}</div></td>`).join('')}
                <td><strong style="color:#10b981">${total}</strong></td>
              </tr>`;
            }).join('') + `<tr style="background:#f0fdf4;font-weight:700"><td>总分</td><td colspan="3"></td><td style="color:#10b981;font-size:16px">${Object.values(state.mapScores2).reduce((s,sc)=>s+(sc.m||0)+(sc.a||0)+(sc.p||0),0)}</td></tr>`;
          }
        }
      }
    }
  }
}

// ===================================================
// TASK 14: 用户故事描述（6格故事板）
// ===================================================
const SB_CELLS = [
  { n:1, icon:'😰', title:'痛苦时刻', label:'Before', color:'#64748b', q:'用户当前的困境、痛苦点是什么？' },
  { n:2, icon:'💡', title:'顿悟时刻', label:'Insight', color:'#3b82f6', q:'用户突然发现了什么机会或灵感？' },
  { n:3, icon:'🌈', title:'探索方案', label:'Explore', color:'#8b5cf6', q:'用户开始寻找什么样的解决方案？' },
  { n:4, icon:'✨', title:'AHA 时刻', label:'AHA!', color:'#10b981', q:'用户第一次感受到什么惊喜和价值？' },
  { n:5, icon:'🚀', title:'成长轨迹', label:'Progress', color:'#f59e0b', q:'用户的生活/工作发生了怎样的真实改变？' },
  { n:6, icon:'💬', title:'口碑传播', label:'Share', color:'#ef4444', q:'用户会如何向他人推荐和描述这段体验？' },
];

function renderTask14Form(data, isDone) {
  const ctx = getCrossContext();
  const bestIdea = ctx.bestIdea || '';

  return `
  <div class="ctx-ctx">
    <div class="ctx-ctx-title">📎 来自 Inspire + 任务 13 的关键输入</div>
    ${bestIdea
      ? `<div class="ctx-ctx-content">💡 <strong>最佳创意</strong>：${esc(bestIdea)}</div>`
      : `<div class="ctx-ctx-empty">未找到 Inspire 数据</div>`
    }
  </div>
  <div class="form-area">
    <div class="form-group">
      <div class="form-label">🎬 六格故事板 <span style="font-size:11px;font-weight:400;color:#64748b">用故事化的语言描绘用户的完整体验旅程</span></div>
      <div class="form-hint">依次填写六个关键时刻/场景，用生动、情感化的语言（避免功能描述），讲好用户故事。</div>
      <div class="sb-grid">
        ${SB_CELLS.map(cell => `
        <div class="sb-cell" style="border-top:3px solid ${cell.color}">
          <div class="sb-cell-hdr">
            <div class="sb-cell-num">${cell.n}</div>
            <div class="sb-cell-label" style="background:${cell.color}">${cell.icon} ${cell.title}</div>
          </div>
          <div class="sb-cell-body">
            <textarea id="sb-${cell.n}" rows="5" placeholder="${cell.q}" oninput="autoSaveSB(${cell.n})">${esc(state.storyBoard[cell.n-1]||'')}</textarea>
          </div>
        </div>`).join('')}
      </div>
    </div>
  </div>`;
}

function autoSaveSB(n) {
  const el = document.getElementById('sb-' + n);
  if (!el) return;
  state.storyBoard[n-1] = el.value;
  saveState();
}

// ===================================================
// TASK 15: AHA 用户价值设计
// ===================================================
const AHA_DIMS2 = [
  { key:'eureka',    icon:'💡', title:'顿悟 Eureka', sub:'"原来还可以这样！"——用户第一次获得新认知的震撼时刻', color:'#fef3c7' },
  { key:'highlight', icon:'✨', title:'高光 Highlight', sub:'"这感觉太棒了！"——使用过程中的情感高峰和惊喜瞬间', color:'#dbeafe' },
  { key:'progress',  icon:'🚀', title:'进步 Progress', sub:'"这真的改变了我的生活！"——长期使用后的真实改变', color:'#d1fae5' },
];

function renderTask15Form(data, isDone) {
  const ctx = getCrossContext();
  const bestIdea = ctx.bestIdea || '';
  const d = state.ahaDesign;

  return `
  <div class="ctx-ctx">
    <div class="ctx-ctx-title">📎 来自 Inspire 的 AHA 基础</div>
    ${ctx.bestAha.eureka || ctx.bestAha.highlight || ctx.bestAha.progress
      ? `<div class="ctx-ctx-content">✨ Inspire AHA 已有：顿悟 "${esc((ctx.bestAha.eureka||'').substring(0,60))}" 等</div>`
      : bestIdea
        ? `<div class="ctx-ctx-content">💡 最佳创意：${esc(bestIdea)}，请在此深化和具体化</div>`
        : `<div class="ctx-ctx-empty">未找到 Inspire 数据</div>`
    }
  </div>
  <div class="form-area">
    <div class="form-group">
      <div class="form-label">🎯 方案核心定位</div>
      <input type="text" id="f15-title" placeholder="用一句话描述这个方案的核心价值主张（15字以内）…" value="${esc(d.title||'')}" oninput="saveAHAField('title',this.value)" style="min-height:44px;font-size:14px;font-weight:600">
    </div>

    <div class="form-group">
      <div class="form-label">✨ AHA 三维价值设计 <span style="font-size:11px;font-weight:400;color:#64748b">在 Inspire 的 AHA 基础上，结合六格故事板，深化具体化</span></div>
      <div class="form-hint">用生动、情感化、场景化的语言描述用户将获得的体验飞跃——不是功能，是感受。</div>
      <div class="aha-cards">
        ${AHA_DIMS2.map(dim => `
        <div class="aha-card">
          <div class="aha-card-hdr" style="background:${dim.color}">
            <span class="aha-icon">${dim.icon}</span>
            <div>
              <div class="aha-title">${dim.title}</div>
              <div class="aha-sub">${dim.sub}</div>
            </div>
          </div>
          <div class="aha-card-body">
            <textarea id="f15-${dim.key}" rows="4" placeholder="描述用户在此刻的具体体验和内心感受…" oninput="saveAHAField('${dim.key}',this.value)">${esc(d[dim.key]||'')}</textarea>
            <button class="aha-ai-btn" onclick="genAHA2Dim('${dim.key}')">✨ AI 补充建议</button>
          </div>
        </div>`).join('')}
      </div>
    </div>
  </div>`;
}

function saveAHAField(key, val) {
  state.ahaDesign[key] = val;
  saveState();
}

function genAHA2Dim(key) {
  const ctx = getCrossContext();
  const dimNames = { eureka:'顿悟 Eureka——用户获得新认知的震撼时刻', highlight:'高光 Highlight——使用中的情感高峰', progress:'进步 Progress——长期使用的真实改变' };
  const bestIdea = ctx.bestIdea || '';
  const inspireAha = ctx.bestAha[key] || '';
  const sbText = state.storyBoard.filter(t=>t&&t.trim()).join('；') || '';

  const btn = document.querySelector(`[onclick="genAHA2Dim('${key}')"]`);
  if (btn) { btn.disabled = true; btn.textContent = '生成中…'; }

  const prompt = `基于以下信息，生成一段关于【${dimNames[key]}】的用户体验描述（50字以内，生动、情感化、场景化语言，第一人称）：
方案：${bestIdea || '（未提供）'}
Inspire AHA：${inspireAha || '（无）'}
故事板：${sbText || '（无）'}
只输出内容，不要前缀。`;

  callAI(prompt, text => {
    const t = text.trim().replace(/^[💡✨🚀\d\.\)\s]+/, '').trim();
    if (t && t.length > 5) {
      state.ahaDesign[key] = t;
      saveState();
      const el = document.getElementById('f15-' + key);
      if (el) el.value = t;
    }
    if (btn) { btn.disabled = false; btn.textContent = '✨ AI 补充建议'; }
    showToast(t ? '✅ 已填入建议内容' : '⚠️ 未生成有效内容');
  }, err => {
    if (btn) { btn.disabled = false; btn.textContent = '✨ AI 补充建议'; }
    showToast('⚠️ ' + err);
  });
}

// ===================================================
// COLLECT / SAVE / SUBMIT
// ===================================================
function collectFormData(n) {
  if (n === 12) {
    return { ...(getTaskData(12)), summary: (document.getElementById('f12-summary')||{}).value || '' };
  }
  if (n === 13) {
    return { ...(getTaskData(13)), cpSections: {...state.cpSections}, mapScores: {...state.mapScores2} };
  }
  if (n === 14) {
    return { ...(getTaskData(14)), storyBoard: [...state.storyBoard] };
  }
  if (n === 15) {
    return { ...(getTaskData(15)), ahaDesign: {...state.ahaDesign} };
  }
  return {};
}

function saveDraft(n) {
  const data = collectFormData(n);
  setTaskData(n, data);
  showToast('✅ 草稿已保存');
}

function submitTask(n) {
  const data = collectFormData(n);
  // basic validation
  if (n === 12) {
    const totalQ = Object.values(state.dim4Items).reduce((s,a)=>s+a.length,0);
    if (totalQ < 2) { showToast('⚠️ 请至少产出 2 条四维拷问'); return; }
  } else if (n === 13) {
    const filledSections = Object.values(state.cpSections).filter(v=>v&&v.trim()).length;
    if (filledSections < 2) { showToast('⚠️ 请至少填写 2 个维度的概念方案'); return; }
  } else if (n === 14) {
    const filledCells = state.storyBoard.filter(v=>v&&v.trim()).length;
    if (filledCells < 3) { showToast('⚠️ 请至少填写 3 个故事板格子'); return; }
  } else if (n === 15) {
    if (!state.ahaDesign.title && !state.ahaDesign.eureka && !state.ahaDesign.highlight && !state.ahaDesign.progress) {
      showToast('⚠️ 请至少填写一项 AHA 内容'); return;
    }
  }
  setTaskData(n, { ...data, status:'done' });
  showToast('🎉 任务已完成！');
  renderTaskContent(n);
  updateProgressUI();
  renderSidebarOutputs();
  renderSidebarBizEval();
  saveCrossModule(n, data);
}

// ===================================================
// CROSS-MODULE SAVE
// ===================================================
function saveCrossModule(n, data) {
  try {
    const raw = localStorage.getItem(SHAPE_KEY);
    const pd = raw ? JSON.parse(raw) : {};
    pd['task' + n] = data;
    pd.meta = pd.meta || {};
    pd.meta.updatedAt = new Date().toISOString();
    localStorage.setItem(SHAPE_KEY, JSON.stringify(pd));
  } catch(e) {}
}

// ===================================================
// SIDEBAR: Project Outputs
// ===================================================
function renderSidebarOutputs() {
  const el = document.getElementById('out-items-list');
  if (!el) return;
  const INFO = [
    { n:12, name:'拷问创意想法',   dlv:'四维拷问清单',     icon:'🔍' },
    { n:13, name:'方案整合发展',   dlv:'📄 概念方案',      icon:'📊' },
    { n:14, name:'用户故事描述',   dlv:'🎬 故事板',        icon:'🎬' },
    { n:15, name:'AHA 用户价值设计',dlv:'✨ AHA 价值设计',  icon:'✨' },
  ];
  el.innerHTML = INFO.map(t => {
    const done = isTaskDone(t.n);
    return `<div class="out-item ${done?'done':''}" onclick="switchTask(${t.n})">
      <div class="out-item-icon">${t.icon}</div>
      <div class="out-item-info">
        <div class="out-item-name">T${t.n} ${t.name}</div>
        <div class="out-item-desc">${done?'已完成':'未完成'}</div>
      </div>
      <span class="out-dlv-badge">${t.dlv}</span>
      ${done?'<span style="color:#10b981;font-size:13px">✓</span>':''}
    </div>`;
  }).join('');
}

function renderSidebarBizEval() {
  const el = document.getElementById('biz-eval-body');
  if (!el) return;
  const isDone = isTaskDone(15);
  const d15 = getTaskData(15);
  const aha = d15.ahaDesign || state.ahaDesign;
  const t13 = getTaskData(13);
  const mapScores = t13.mapScores || state.mapScores2 || {};

  if (!isDone) {
    el.innerHTML = '<div class="biz-empty">完成任务 15 后，评估结果将显示在此</div>';
    return;
  }

  let html = '';
  if (aha.title) {
    html += `<div style="font-size:13px;font-weight:700;color:#10b981;margin-bottom:8px;padding:10px 12px;background:#f0fdf4;border-radius:8px">🎯 ${esc(aha.title)}</div>`;
  }

  // MAP summary
  const total = Object.values(mapScores).reduce((s,sc)=>s+(sc.m||0)+(sc.a||0)+(sc.p||0),0);
  if (total > 0) {
    html += `<div class="biz-card">
      <div class="biz-card-hdr">💰 MAP 评分</div>
      <div class="biz-card-body">
        <div class="biz-map-row">
          ${[{k:'m',n:'M 市场'},{k:'a',n:'A 获客'},{k:'p',n:'P 优势'}].map(d => {
            const sum = Object.values(mapScores).reduce((s,sc)=>s+(sc[d.k]||0),0);
            const avg = Object.keys(mapScores).length ? Math.round(sum/Object.keys(mapScores).length) : 0;
            const cls = avg>=4?'map-chip-high':avg>=3?'map-chip-mid':avg>=1?'map-chip-low':'map-chip-none';
            return `<div class="biz-map-item">
              <div class="biz-map-key">${d.n}</div>
              <div class="biz-map-val"><span class="map-summary-chip ${cls}" style="font-size:16px;font-weight:800">${avg||'-'}</span>/5</div>
            </div>`;
          }).join('')}
        </div>
      </div>
    </div>`;
  }

  // AHA summary
  const hasAha = aha.eureka || aha.highlight || aha.progress;
  if (hasAha) {
    const dims2 = [{k:'eureka',i:'💡',n:'顿悟'},{k:'highlight',i:'✨',n:'高光'},{k:'progress',i:'🚀',n:'进步'}];
    html += `<div class="biz-card" style="margin-top:10px">
      <div class="biz-card-hdr">✨ AHA 价值</div>
      <div class="biz-card-body">
        ${dims2.map(d => aha[d.k] ? `<div class="biz-aha-item">
          <div class="biz-aha-key">${d.i} ${d.n}</div>
          <div class="biz-aha-val">${esc(aha[d.k])}</div>
        </div>` : '').join('')}
      </div>
    </div>`;
  }

  if (!html) html = '<div class="biz-empty">完成任务 15 后，评估结果将显示在此</div>';
  el.innerHTML = html;
}

// ===================================================
// OUTPUTS MODAL
// ===================================================
function openOutputsModal() {
  var overlay = document.getElementById('outputs-modal-overlay');
  var body = document.getElementById('outputs-modal-body');
  if (!overlay || !body) return;

  const TASKS_INFO = [
    { id:12, name:'拷问创意想法',    tag:'四维',    key:'dim4' },
    { id:13, name:'方案整合发展',    tag:'概念方案', key:'cp' },
    { id:14, name:'用户故事描述',    tag:'故事板',   key:'sb' },
    { id:15, name:'AHA 用户价值设计',tag:'AHA',     key:'aha' },
  ];

  var html = '';
  TASKS_INFO.forEach(t => {
    var taskData = getTaskData(t.id);
    var done = taskData.status === 'done';
    var content = '';
    if (done) {
      if (t.key === 'dim4') {
        var lines = [];
        DIM4.forEach(d => {
          var items = state.dim4Items[d.key] || [];
          if (items.length) lines.push('【' + d.title + '】' + items.join('；'));
        });
        if (taskData.summary) lines.push('\n综合判断：' + taskData.summary);
        content = lines.join('\n');
      } else if (t.key === 'cp') {
        var lines2 = [];
        CP_DIMS.forEach(d => {
          var v = state.cpSections[d.key] || '';
          if (v && v.trim()) lines2.push('【' + d.title + '】\n' + v);
        });
        var ms = taskData.mapScores || {};
        var mapTotal = Object.values(ms).reduce((s,sc)=>s+(sc.m||0)+(sc.a||0)+(sc.p||0),0);
        if (mapTotal > 0) lines2.push('\nMAP总分：' + mapTotal + '/60');
        content = lines2.join('\n\n');
      } else if (t.key === 'sb') {
        var sb = taskData.storyBoard || state.storyBoard || [];
        content = SB_CELLS.map((c,i) => c.icon + ' ' + c.title + '：' + (sb[i]||'(未填写)')).join('\n');
      } else if (t.key === 'aha') {
        var ad = taskData.ahaDesign || state.ahaDesign || {};
        var lines3 = [];
        if (ad.title) lines3.push('🎯 核心定位：' + ad.title);
        if (ad.eureka) lines3.push('💡 顿悟：' + ad.eureka);
        if (ad.highlight) lines3.push('✨ 高光：' + ad.highlight);
        if (ad.progress) lines3.push('🚀 进步：' + ad.progress);
        content = lines3.join('\n');
      }
    }

    html += '<div class="out-doc-section">' +
      '<div class="out-doc-section-header" onclick="toggleOutSection(this)">' +
      '<span class="out-doc-task-badge">' + t.tag + '</span>' +
      '<span class="out-doc-task-name">任务 ' + t.id + ' · ' + t.name + '</span>' +
      '<span class="' + (done ? 'out-doc-task-done' : 'out-doc-task-pending') + '">' +
      (done ? '✓ 已完成' : '○ 待完成') + '</span>' +
      '</div>' +
      '<div class="out-doc-section-body' + (done ? ' open' : '') + '">' +
      (done && content ? '<div class="out-doc-content">' + esc(content) + '</div>' :
       (!done ? '<div class="out-doc-content" style="color:#94a3b8;font-style:italic">此任务尚未完成</div>' :
        '<div class="out-doc-content" style="color:#94a3b8;font-style:italic">此任务无文本产出</div>')) +
      '</div></div>';
  });

  body.innerHTML = html;
  overlay.classList.remove('hidden');
}

function closeOutputsModal() {
  var overlay = document.getElementById('outputs-modal-overlay');
  if (overlay) overlay.classList.add('hidden');
}

function toggleOutSection(header) {
  var body = header.nextElementSibling;
  if (body) body.classList.toggle('open');
}

// ===================================================
// DOWNLOAD
// ===================================================
function downloadShapeDoc() {
  var project = [];
  try { project = JSON.parse(localStorage.getItem('eureka_learn_projects_v2') || '[]'); } catch(e) {}
  var pid = localStorage.getItem('eureka_learn_current_v2') || '';
  var p = project.find(x => x.id === pid) || {};
  var name = p.name || 'Eureka项目';
  var sep = '\n';
  var lines = [
    '# ' + name + ' · Shape 构建阶段产出文档',
    '生成时间: ' + new Date().toLocaleString('zh-CN'),
    '',
  ];

  const TASKS_INFO = [
    { id:12, name:'拷问创意想法' },
    { id:13, name:'方案整合发展' },
    { id:14, name:'用户故事描述' },
    { id:15, name:'AHA 用户价值设计' },
  ];

  TASKS_INFO.forEach(t => {
    var done = isTaskDone(t.id);
    var data = getTaskData(t.id);
    lines.push('## T' + t.id + ' ' + t.name + ' ' + (done ? '✅' : '❌'), '');

    if (t.id === 12) {
      DIM4.forEach(d => {
        var items = state.dim4Items[d.key] || [];
        if (items.length) lines.push('**' + d.icon + ' ' + d.title + '**');
        items.forEach(q => lines.push('- ' + q));
      });
      if (data.summary) lines.push('', '**综合判断：**', data.summary);
    } else if (t.id === 13) {
      CP_DIMS.forEach(d => {
        var v = state.cpSections[d.key] || '';
        if (v && v.trim()) lines.push('**' + d.icon + ' ' + d.title + '**', v, '');
      });
      var ms = data.mapScores || {};
      var total = Object.values(ms).reduce((s,sc)=>s+(sc.m||0)+(sc.a||0)+(sc.p||0),0);
      if (total > 0) lines.push('**MAP总分：**' + total + '/60');
    } else if (t.id === 14) {
      var sb = data.storyBoard || state.storyBoard || [];
      SB_CELLS.forEach((c,i) => lines.push('**' + c.icon + ' ' + c.title + '：**' + (sb[i]||'(未填写)')));
    } else if (t.id === 15) {
      var ad = data.ahaDesign || state.ahaDesign || {};
      if (ad.title) lines.push('**🎯 核心定位：**' + ad.title);
      if (ad.eureka) lines.push('**💡 顿悟：**' + ad.eureka);
      if (ad.highlight) lines.push('**✨ 高光：**' + ad.highlight);
      if (ad.progress) lines.push('**🚀 进步：**' + ad.progress);
    }
    lines.push('---', '');
  });

  var blob = new Blob([lines.join(sep)], { type:'text/markdown;charset=utf-8' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name + '_Shape产出文档_' + new Date().toLocaleDateString('zh-CN').replace(/\//g,'-') + '.md';
  a.click();
  showToast('📄 产出文档已下载！');
}

// ===================================================
// AI: callAI helper
// ===================================================
async function callAI(prompt, onSuccess, onError) {
  var cfg = getAIConfig();
  if (!cfg.apiUrl || !cfg.apiKey) {
    onError('请先配置 AI 接口（右上角 ⚙️ AI 设置）');
    return;
  }
  try {
    var resp = await fetch(cfg.apiUrl, {
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+cfg.apiKey},
      body: JSON.stringify({
        model: cfg.model || 'gpt-4o',
        messages:[{role:'user',content:prompt}],
        temperature: 0.8, max_tokens: 1000
      })
    });
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    var json = await resp.json();
    onSuccess(json.choices[0].message.content);
  } catch(e) {
    onError(e.message);
  }
}

// ===================================================
// AI COACH
// ===================================================
function getAIConfig() {
  try { return JSON.parse(localStorage.getItem(AI_CONFIG_KEY)||'{}'); } catch(e) { return {}; }
}

function openAI() {
  var overlay = document.getElementById('ai-overlay');
  overlay.classList.add('active');
  var msgs = document.getElementById('ai-messages');
  if (msgs.children.length === 0) {
    addAIMsg(TASKS[state.currentTask] ? TASKS[state.currentTask].coachIntro : '你好！我是 Eureka Coach。', 'bot');
  }
}

function closeAI() {
  document.getElementById('ai-overlay').classList.remove('active');
}

function addAIMsg(text, role) {
  var msgs = document.getElementById('ai-messages');
  var div = document.createElement('div');
  div.className = 'ai-msg ' + role;
  div.textContent = text;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

async function sendAI() {
  var input = document.getElementById('ai-input');
  var msg = input.value.trim();
  if (!msg) return;
  input.value = '';
  addAIMsg(msg, 'user');
  var btn = document.getElementById('ai-send-btn');
  btn.disabled = true;

  var cfg = getAIConfig();
  if (!cfg.apiUrl || !cfg.apiKey) {
    addAIMsg('⚠️ 请先配置 AI 接口（点击右上角 ⚙️ AI 设置）\n\n你说的问题很好，让我来帮你分析一下。建议你从最熟悉的维度入手，先把想法写下来，数量比质量更重要。', 'bot');
    btn.disabled = false;
    return;
  }

  var taskCtx = TASKS[state.currentTask] || {};
  var systemPrompt = '你是 Eureka Coach，一位专业的设计思维和创新导师。\n当前任务：' + (taskCtx.title||'') + '\n任务目标：' + (taskCtx.objective||'') + '\n用简洁、实用的方式回答，给出具体可操作的建议。回复用中文，控制在 200 字以内。';

  try {
    var resp = await fetch(cfg.apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + cfg.apiKey },
      body: JSON.stringify({
        model: cfg.model || 'gpt-4o',
        messages: [
          { role:'system', content: systemPrompt },
          { role:'user', content: msg }
        ],
        temperature: 0.7, max_tokens: 400
      })
    });
    if (!resp.ok) throw new Error('API error ' + resp.status);
    var json = await resp.json();
    addAIMsg(json.choices[0].message.content, 'bot');
  } catch(e) {
    addAIMsg('⚠️ AI 接口连接失败：' + e.message + '\n\n请检查 API 地址和 Key 是否正确。', 'bot');
  }
  btn.disabled = false;
}

// ===================================================
// AI SETTINGS
// ===================================================
var PRESETS = {
  openai:    { apiUrl:'https://api.openai.com/v1/chat/completions', model:'gpt-4o' },
  anthropic: { apiUrl:'https://api.anthropic.com/v1/messages', model:'claude-3-5-sonnet-20241022' },
  deepseek:  { apiUrl:'https://api.deepseek.com/chat/completions', model:'deepseek-chat' },
  qwen:      { apiUrl:'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', model:'qwen-plus' },
  custom:    { apiUrl:'', model:'' }
};

function openAISettings() {
  var modal = document.getElementById('ai-settings-modal');
  var cfg = getAIConfig();
  document.getElementById('ai-api-url').value = cfg.apiUrl || '';
  document.getElementById('ai-api-key').value = cfg.apiKey || '';
  document.getElementById('ai-model-name').value = cfg.model || '';
  var provider = 'custom';
  var url = cfg.apiUrl || '';
  if (url.includes('openai.com')) provider = 'openai';
  else if (url.includes('anthropic')) provider = 'anthropic';
  else if (url.includes('deepseek')) provider = 'deepseek';
  else if (url.includes('dashscope') || url.includes('aliyuncs')) provider = 'qwen';
  document.getElementById('ai-provider').value = provider;
  modal.classList.add('active');
}

function closeAISettings() {
  document.getElementById('ai-settings-modal').classList.remove('active');
}

function onProviderChange() {
  var p = document.getElementById('ai-provider').value;
  var preset = PRESETS[p] || PRESETS.custom;
  document.getElementById('ai-api-url').value = preset.apiUrl;
  document.getElementById('ai-model-name').value = preset.model;
}

function saveAISettings() {
  var cfg = {
    apiUrl: document.getElementById('ai-api-url').value.trim(),
    apiKey: document.getElementById('ai-api-key').value.trim(),
    model: document.getElementById('ai-model-name').value.trim() || 'gpt-4o',
  };
  localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(cfg));
  closeAISettings();
  showToast('✅ AI 配置已保存');
}

function testAIConnection() {
  var result = document.getElementById('ai-test-result');
  var apiUrl = document.getElementById('ai-api-url').value.trim();
  var apiKey = document.getElementById('ai-api-key').value.trim();
  var model = document.getElementById('ai-model-name').value.trim();
  if (!apiUrl || !apiKey) {
    result.className = 'ai-test-result error';
    result.textContent = '⚠️ 请先填写 API 地址和 Key';
    result.style.display = 'block';
    return;
  }
  result.className = 'ai-test-result';
  result.textContent = '⏳ 测试中...';
  result.style.display = 'block';
  fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
    body: JSON.stringify({ model: model || 'gpt-4o', messages: [{ role: 'user', content: 'Hi' }], max_tokens: 5 })
  }).then(r => {
    if (r.ok) {
      result.className = 'ai-test-result success';
      result.textContent = '✅ 连接成功！API 正常工作';
    } else {
      result.className = 'ai-test-result error';
      result.textContent = '⚠️ 连接失败：' + r.status + ' ' + r.statusText;
    }
  }).catch(e => {
    result.className = 'ai-test-result error';
    result.textContent = '⚠️ 连接失败：' + e.message;
  });
}

// ===================================================
// ONBOARDING
// ===================================================
var obStep = 1;
var obTotal = 4;

function showOnboarding() {
  obStep = 1;
  updateOnboardingUI();
  document.getElementById('onboarding-overlay').classList.add('active');
}

function closeOnboarding() {
  document.getElementById('onboarding-overlay').classList.remove('active');
  localStorage.setItem('eureka_shape_onboarding_skip', 'true');
}

function nextOnboardingStep() {
  if (obStep < obTotal) { obStep++; updateOnboardingUI(); }
  else closeOnboarding();
}

function prevOnboardingStep() {
  if (obStep > 1) { obStep--; updateOnboardingUI(); }
}

function updateOnboardingUI() {
  for (var i = 1; i <= obTotal; i++) {
    var step = document.getElementById('ob-step-' + i);
    var dot = document.getElementById('ob-dot-' + i);
    if (step) step.classList.toggle('active', i === obStep);
    if (dot) dot.classList.toggle('active', i === obStep);
  }
  var prevBtn = document.getElementById('ob-prev');
  var nextBtn = document.getElementById('ob-next');
  if (prevBtn) prevBtn.style.display = obStep > 1 ? '' : 'none';
  if (nextBtn) nextBtn.textContent = obStep === obTotal ? '完成' : '下一步';
}

// ===================================================
// INIT
// ===================================================
document.addEventListener('DOMContentLoaded', function() {
  loadState();
  updateProgressUI();
  renderInspireDataCard();
  renderTipsCard(12);
  renderSidebarOutputs();
  renderSidebarBizEval();
  renderTaskContent(12);
  if (!localStorage.getItem('eureka_shape_onboarding_skip')) {
    setTimeout(function() { showOnboarding(); }, 800);
  }
});

// ===================================================
// EUREKA FLOW (copied from learn.html)
// ===================================================
function showEurekaFlow() {
  var modal = document.getElementById('eureka-flow-modal');
  if (modal) modal.classList.add('active');
}

function closeEurekaFlow() {
  var modal = document.getElementById('eureka-flow-modal');
  if (modal) modal.classList.remove('active');
}
"""

# The content above needs to be wrapped properly
# We'll write a Python script that replaces lines 804 onwards

import subprocess
import os

shape_path = '/Users/davidma/WorkBuddy/workbuddy-agents-marketplace/eureka-dashboard/shape.html'

# Read the first 803 lines (CSS + HTML structure)
with open(shape_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

print(f"Total lines: {len(lines)}")
print(f"First 3 lines: {lines[0][:50]}, {lines[1][:50]}, {lines[2][:50]}")

# Keep lines 1-803 (index 0-802)
header_lines = lines[:803]
print(f"Header lines kept: {len(header_lines)}")
print(f"Line 803: {lines[802][:80]}")

# Write new file
new_js = """<script>
""" + JS_CONTENT + """
</script>

<!-- Eureka 学习流程线路图 Modal -->
<div id="eureka-flow-modal" class="modal" style="z-index:10000">
  <div class="modal-overlay" onclick="closeEurekaFlow()"></div>
  <div class="modal-content" style="max-width:900px;width:95%;padding:0;overflow:hidden;border-radius:16px">
    <div style="position:relative;background:linear-gradient(135deg,#d1fae5,#a7f3d0);padding:20px 24px">
      <button onclick="closeEurekaFlow()" style="position:absolute;top:16px;right:16px;width:36px;height:36px;border:none;background:rgba(0,0,0,0.1);border-radius:50%;cursor:pointer;font-size:18px;color:#065f46;transition:all 0.2s">✕</button>
      <h2 style="margin:0;font-size:22px;font-weight:700;color:#065f46;display:flex;align-items:center;gap:10px">
        <span>🗺️</span> Eureka 价值创新探索线路图
      </h2>
      <p style="margin:8px 0 0;font-size:13px;color:#047857">点击任意位置关闭此图，开始你的创新探索之旅</p>
    </div>
    <div style="padding:24px;background:#f0fdf4;max-height:80vh;overflow-y:auto">
      <img src="https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=1200&q=80"
           alt="Eureka 价值创新探索线路图"
           style="width:100%;height:auto;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.1);cursor:pointer"
           onclick="closeEurekaFlow()">
      <div style="margin-top:20px;display:grid;grid-template-columns:repeat(4,1fr);gap:16px">
        <div style="padding:16px;background:#fff;border-radius:12px;border-left:4px solid #3b82f6">
          <div style="font-size:14px;font-weight:700;color:#1e40af;margin-bottom:6px">1. 揭示 (Reveal)</div>
          <div style="font-size:12px;color:#64748b;line-height:1.5">团队构建共识，深入探索用户，洞察真实需求</div>
        </div>
        <div style="padding:16px;background:#fff;border-radius:12px;border-left:4px solid #f59e0b">
          <div style="font-size:14px;font-weight:700;color:#92400e;margin-bottom:6px">2. 启发 (Inspire) ✓</div>
          <div style="font-size:12px;color:#64748b;line-height:1.5">重构创新机遇，通过跨界灵感实现创意突破</div>
        </div>
        <div style="padding:16px;background:#fff;border-radius:12px;border-left:4px solid #10b981">
          <div style="font-size:14px;font-weight:700;color:#065f46;margin-bottom:6px">3. 构建 (Shape) ←</div>
          <div style="font-size:12px;color:#64748b;line-height:1.5">将创意想法发展为概念方案，构建用户体验故事</div>
        </div>
        <div style="padding:16px;background:#fff;border-radius:12px;border-left:4px solid #8b5cf6">
          <div style="font-size:14px;font-weight:700;color:#5b21b6;margin-bottom:6px">4. 验证 (Exam)</div>
          <div style="font-size:12px;color:#64748b;line-height:1.5">搭建方案原型进行用户测试，规划价值呈现计划</div>
        </div>
      </div>
      <div style="margin-top:20px;padding:16px;background:linear-gradient(135deg,#d1fae5,#a7f3d0);border-radius:12px;text-align:center">
        <div style="font-size:14px;font-weight:600;color:#065f46">🎯 目标：交付一个经过用户验证、具有商业价值的创新方案</div>
      </div>
    </div>
  </div>
</div>
</body>
</html>
"""

output_path = '/Users/davidma/WorkBuddy/workbuddy-agents-marketplace/eureka-dashboard/shape.html.new'

with open(output_path, 'w', encoding='utf-8') as f:
    # Write header (lines 1-803)
    for line in header_lines:
        f.write(line)
    # Write new JS + closing
    f.write(new_js)

print(f"New file written to: {output_path}")

# Backup old file
backup_path = shape_path + '.bak'
with open(shape_path, 'r', encoding='utf-8') as f:
    content = f.read()
with open(backup_path, 'w', encoding='utf-8') as f:
    f.write(content)
print(f"Backup saved to: {backup_path}")

# Replace
os.replace(output_path, shape_path)
print("Replacement done!")
