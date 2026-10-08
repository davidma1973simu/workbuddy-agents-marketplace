/* Transform v2.0 · 成长资产公共函数（cognitive/behavior 两页共用的 79 个函数，由 P2-1 去重抽取）
   注意：函数引用的 LS_* 常量与页面级状态在各页面自己的脚本中定义，
   本文件必须在页面主脚本之前加载。 */

function actionDateOf(a){ const l = (a.logs || []).slice(-1)[0]; return a.createdAt || (l && l.date) || ''; }

function addAssetTag(){
  const ctx = assetModalCtx; if (!ctx) return;
  const inp = $('newTagInput'); if (!inp) return;
  const t = (inp.value || '').trim(); if (!t) return;
  assetSave(ctx.type, ctx.id, obj => {
    obj.tags = obj.tags || [];
    if (!obj.tags.includes(t)) obj.tags.push(t);
  });
  const obj = assetFind(ctx.type, ctx.id);
  renderTagModal((obj && obj.tags) || []);
  inp.value = '';
}

function addAssetTagByText(t){
  const ctx = assetModalCtx; if (!ctx || !t) return;
  assetSave(ctx.type, ctx.id, obj => {
    obj.tags = obj.tags || [];
    if (!obj.tags.includes(t)) obj.tags.push(t);
  });
  const obj = assetFind(ctx.type, ctx.id);
  renderTagModal((obj && obj.tags) || []);
}

function anchorText(a){
  let t = String(a == null ? '' : a).trim();
  if (!t) return '';
  t = t.replace(/^在(我)?/, '').replace(/(之后|以后|后)$/, '');
  return t;
}

function applyOpenState(){
  document.querySelectorAll('.expand-card[data-section]').forEach(c => {
    c.classList.toggle('open', !!sectionOpen['sec:' + c.dataset.section]);
  });
  document.querySelectorAll('.fold-card[id]').forEach(c => {
    const k = 'fold:' + c.id;
    if (k in sectionOpen) c.classList.toggle('open', !!sectionOpen[k]);
  });
}

function archivedItems(){
  const out = [];
  (loadArchiveAll() || []).forEach(s => { if (s.archived){ out.push({ type:'insight', id:s.id, title:s.scenario || ((s.essence && s.essence.insight) ? '一条洞察' : '一次梳理'), sub:(s.insight || (s.essence && s.essence.insight) || s.scenario || '') }); } });
  (loadActionsAll() || []).forEach(a => { if (a.archived){ out.push({ type:'action', id:a.id, title:a.input || a.goal || '行为实验', sub:((a.logs && a.logs.length) ? a.logs.length + ' 天记录' : '') }); } });
  return out;
}

function assetActions(type, id){
  const obj = assetFind(type, id) || {};
  let html = '<div class="asset-actions">';
  if (type === 'insight' || type === 'model'){
    html += `<a class="use-btn solid" href="app.html?from=${encodeURIComponent(id)}" onclick="markUse('${type}','${id}','app.html')">深入洞察 →</a>`;
    html += `<a class="use-btn" href="${punchHandoffUrl(obj)}" onclick="markUse('${type}','${id}','punch.html')">拿它去用 →</a>`;
    html += `<button class="use-btn pin${obj.pinned ? ' on' : ''}" onclick="togglePin('${type}','${id}')">${obj.pinned ? '已待用' : '待用'}</button>`;
  }
  html += `<button class="more-btn" onclick="toggleMoreMenu(this)">⋯ 更多</button>`;
  html += `<span class="more-menu" hidden>
      <button class="asset-btn" onclick="openAssetEdit('${type}','${id}')">编辑</button>
      <button class="asset-btn tag" onclick="openAssetTag('${type}','${id}')">归类</button>
      ${type !== 'pattern' ? `<button class="asset-btn arch" onclick="openAssetArchive('${type}','${id}')">归档</button>` : ''}
      <button class="asset-btn del" onclick="openAssetDelete('${type}','${id}')">删除</button>
    </span>`;
  html += '</div>';
  return html;
}

function assetFind(type, id){
  if (type === 'insight' || type === 'model'){
    return loadArchiveAll().find(s => String(s.id) === String(id));
  }
  if (type === 'action') return loadActionsAll().find(a => String(a.id) === String(id));
  if (type === 'pattern'){
    let saved = null; try { saved = JSON.parse(localStorage.getItem(LS_PATTERNS)); } catch(e){}
    if (saved && saved.patterns) return saved.patterns[parseInt(id)];
  }
  return null;
}

function assetSave(type, id, mutate, silent){
  if (type === 'insight' || type === 'model'){
    const list = loadArchiveAll();
    const i = list.findIndex(s => String(s.id) === String(id));
    if (i >= 0){ mutate(list[i]); localStorage.setItem(LS_ARCHIVE, JSON.stringify(list)); }
  } else if (type === 'action'){
    const list = loadActionsAll();
    const i = list.findIndex(a => String(a.id) === String(id));
    if (i >= 0){ mutate(list[i]); localStorage.setItem(LS_ACTIONS, JSON.stringify(list)); }
  } else if (type === 'pattern'){
    let saved = null; try { saved = JSON.parse(localStorage.getItem(LS_PATTERNS)); } catch(e){}
    if (saved && saved.patterns && saved.patterns[parseInt(id)]){ mutate(saved.patterns[parseInt(id)]); localStorage.setItem(LS_PATTERNS, JSON.stringify(saved)); }
  }
  if (!silent) renderAll();
}

function assetTypeName(type){
  return { model: '认知模型', insight: '洞察', action: '行为实验', pattern: '模式' }[type] || '';
}

function bkApply(){
  const d = window._bkData; if (!d) return;
  bkSnapshot();
  var merge = bkModeSel !== 'over';
  try {
    if (merge){
      // 合并：本地已有 id/text 保留，只补备份中缺失的
      var arch = loadArchiveAll();
      var aidx = {}; arch.forEach(function(x){ if (x && x.id) aidx[String(x.id)] = true; });
      (Array.isArray(d.archive) ? d.archive : []).forEach(function(x){ if (x && x.id && !aidx[String(x.id)]) arch.push(x); });
      localStorage.setItem(LS_ARCHIVE, JSON.stringify(arch));

      var acts = loadActionsAll();
      var bidx = {}; acts.forEach(function(a){ if (a && a.id) bidx[String(a.id)] = true; });
      (Array.isArray(d.actions) ? d.actions : []).forEach(function(a){ if (a && a.id && !bidx[String(a.id)]) acts.push(a); });
      localStorage.setItem(LS_ACTIONS, JSON.stringify(acts));

      var prof = loadProfile();
      var stmts = prof.identityStatements = Array.isArray(prof.identityStatements) ? prof.identityStatements : [];
      var tidx = {}; stmts.forEach(function(s){ if (s && s.text) tidx[String(s.text)] = true; });
      var inc = (d.profile && Array.isArray(d.profile.identityStatements)) ? d.profile.identityStatements : [];
      inc.forEach(function(s){ if (s && s.text && !tidx[String(s.text)]){ tidx[String(s.text)] = true; stmts.push(s); } });
      localStorage.setItem(LS_PROFILE, JSON.stringify(prof));

      // patterns：按 JSON 串去重拼接
      var sp = null; try { sp = JSON.parse(localStorage.getItem(LS_PATTERNS)); } catch(e){}
      var bp = (d.patterns && Array.isArray(d.patterns.patterns)) ? d.patterns.patterns : [];
      if (bp.length){
        if (!sp) sp = { patterns: [], generatedAt: new Date().toISOString() };
        sp.patterns = sp.patterns || [];
        var seen = {}; sp.patterns.forEach(function(x){ try { seen[JSON.stringify(x)] = true; } catch(e){} });
        bp.forEach(function(x){ try { var k = JSON.stringify(x); if (!seen[k]){ seen[k] = true; sp.patterns.push(x); } } catch(e){} });
        localStorage.setItem(LS_PATTERNS, JSON.stringify(sp));
      }
    } else {
      // 覆盖：以备份为准（备份缺的 key 不动，避免旧文件删掉新数据）
      if (Array.isArray(d.archive)) localStorage.setItem(LS_ARCHIVE, JSON.stringify(d.archive));
      if (Array.isArray(d.actions)) localStorage.setItem(LS_ACTIONS, JSON.stringify(d.actions));
      if (d.profile && Array.isArray(d.profile.identityStatements)) localStorage.setItem(LS_PROFILE, JSON.stringify(d.profile));
      if (d.patterns && Array.isArray(d.patterns.patterns)) localStorage.setItem(LS_PATTERNS, JSON.stringify(d.patterns));
    }
  } catch(e){ toast('恢复失败：浏览器存储空间不足或数据异常'); bkClose(); return; }
  window._bkData = null;
  bkClose();
  renderAll();
  toast(merge ? '已合并恢复：原有数据都在，补上了备份里没有的 ✓' : '已覆盖恢复：当前数据已替换为备份内容 ✓');
}

function bkClose(){ const p = $('bkPop'); p.classList.remove('show'); }

function bkCounts(d){
  d = d || {};
  var archive = Array.isArray(d.archive) ? d.archive : [];
  var actions = Array.isArray(d.actions) ? d.actions : [];
  var stmts = (d.profile && Array.isArray(d.profile.identityStatements)) ? d.profile.identityStatements : [];
  var pats = (d.patterns && Array.isArray(d.patterns.patterns)) ? d.patterns.patterns : [];
  return {
    ok: (archive.length + actions.length + stmts.length + pats.length) > 0,
    archive: archive.length, actions: actions.length, stmts: stmts.length, pats: pats.length
  };
}

function bkOnFile(ev){
  const f = ev.target.files && ev.target.files[0];
  if (!f) return;
  const rd = new FileReader();
  rd.onload = function(){
    let data; try { data = JSON.parse(rd.result); } catch(e){ toast('这个文件不是有效的备份 JSON'); return; }
    const c = bkCounts(data);
    if (!c.ok){ toast('这个文件里没有可恢复的 Transform 数据'); return; }
    window._bkData = data;
    const pop = $('bkPop');
    const row = function(k, v){ return '<div class="r"><span>' + k + '</span><b>' + v + '</b></div>'; };
    let rows = row('洞察', c.archive + ' 份') + row('改变', c.actions + ' 个') + row('身份票', c.stmts + ' 张');
    if (c.pats) rows += row('AI 模式', c.pats + ' 条');
    pop.innerHTML =
      '<div class="bk-sum">' +
        '<div class="h">备份里找到</div>' +
        '<div class="rows">' + rows + '</div>' +
        '<div class="bk-mode">' +
          '<button data-m="merge" class="on" onclick="bkSetMode(\'merge\')">合并<span class="sub">保留当前，补上没有的</span></button>' +
          '<button data-m="over" onclick="bkSetMode(\'over\')">覆盖<span class="sub">以备份为准</span></button>' +
        '</div>' +
      '</div>' +
      '<div class="bk-acts">' +
        '<button class="bk-go" onclick="bkApply()">恢复所选数据</button>' +
        '<button class="bk-cancel" onclick="bkToggle()">取消</button>' +
      '</div>' +
      '<div class="bk-note">开始前会先自动下载一份当前数据，可随时还原。</div>';
    pop.classList.add('show');
  };
  rd.readAsText(f);
}

function bkPick(){ const inp = $('bkFile'); inp.value = ''; inp.click(); }

function bkSetMode(m){
  bkModeSel = (m === 'over') ? 'over' : 'merge';
  var btns = document.querySelectorAll('#bkPop .bk-mode button');
  for (var i = 0; i < btns.length; i++){
    btns[i].classList.toggle('on', btns[i].getAttribute('data-m') === bkModeSel);
  }
}

function bkSnapshot(){
  // 导入前：把当前数据存一份到内存文件下载，供回滚
  try {
    var data = { archive: loadArchiveAll(), actions: loadActionsAll(), profile: loadProfile(), patterns: JSON.parse(localStorage.getItem(LS_PATTERNS)) };
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var u = URL.createObjectURL(blob);
    var el = document.createElement('a');
    var d = new Date(), p = function(n){ return n < 10 ? '0' + n : '' + n; };
    el.href = u; el.download = 'transform-growth-assets.before-restore-' + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '-' + p(d.getHours()) + p(d.getMinutes()) + '.json';
    el.click(); URL.revokeObjectURL(u);
  } catch(e){}
}

function bkToggle(){
  const pop = $('bkPop');
  if (pop.classList.contains('show')){ bkClose(); return; }
  bkModeSel = 'merge';
  pop.innerHTML =
    '<button class="bk-item" onclick="downloadAll();bkClose();">' +
      '<span class="t"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 3v12m0 0l-5-5m5 5l5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 21h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>下载完整备份</span>' +
      '<span class="s">洞察、改变、身份与模式，存成一个 JSON 文件</span>' +
    '</button>' +
    '<button class="bk-item" onclick="bkPick()">' +
      '<span class="t"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 21V9m0 0l-5 5m5-5l5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 3h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>从备份恢复</span>' +
      '<span class="s">选择之前下载的文件，合并或覆盖当前数据</span>' +
    '</button>' +
    '<div class="bk-sep"></div>' +
    '<div class="bk-note">所有数据只保存在这台设备的浏览器里，不会上传。</div>';
  pop.classList.add('show');
}

function buildPatternSource(){
  const archive = loadArchive(); const actions = loadActions();
  const parts = [];
  archive.slice(0, 30).forEach(s => {
    const e = s.essence || {};
    parts.push('认知[' + (s.scenario || '?') + '] 本质:' + (e.nature || '').slice(0, 50) + ' 洞察:' + (e.insight || '').slice(0, 60) + (s.mentalModel ? ' 框架:' + s.mentalModel.slice(0, 60) : '') + (s.tags && s.tags.length ? ' 标签:' + s.tags.join('/') : ''));
  });
  actions.slice(0, 30).forEach(a => {
    parts.push('行为[' + (a.input || '?') + '] 状态:' + (a.status || '') + (a.result ? ' 结果:' + a.result.slice(0, 50) : '') + (a.habit ? ' 习惯:' + a.habit.slice(0, 50) : '') + (a.reflection && a.reflection.changed ? ' 改变:' + a.reflection.changed.slice(0, 50) : ''));
  });
  return parts.join('\n').slice(0, 3200);
}

function captureOpenState(){
  document.querySelectorAll('.expand-card[data-section]').forEach(c => {
    sectionOpen['sec:' + c.dataset.section] = c.classList.contains('open');
  });
  document.querySelectorAll('.fold-card[id]').forEach(c => {
    sectionOpen['fold:' + c.id] = c.classList.contains('open');
  });
  saveUIState();
}

function clearPatterns(){
  let saved = null; try { saved = JSON.parse(localStorage.getItem(LS_PATTERNS)); } catch(e){}
  if (saved && saved.patterns && saved.patterns.length){
    const trash = loadTrash();
    saved.patterns.forEach(p => trash.push({ tid: 't_' + Date.now() + '_' + Math.floor(Math.random()*1000), type: 'pattern', data: p, deletedAt: new Date().toISOString() }));
    saveTrash(trash);
  }
  localStorage.removeItem(LS_PATTERNS);
  renderPatterns();
  renderTrash();
}

function closeAssetModal(){
  const mask = $('assetModalMask');
  if (mask) mask.classList.remove('show');
  assetModalCtx = null;
}

function closeSettings(){ $('settingsMask').classList.remove('show'); }

function collectAllTags(){
  const tags = [];
  const add = t => { if (t && !tags.includes(t)) tags.push(t); };
  loadArchive().forEach(s => (s.tags || []).forEach(add));
  loadActions().forEach(a => (a.tags || []).forEach(add));
  let saved = null; try { saved = JSON.parse(localStorage.getItem(LS_PATTERNS)); } catch(e){}
  (saved && saved.patterns || []).forEach(p => (p.tags || []).forEach(add));
  return tags.sort((a,b) => a.localeCompare(b, 'zh-CN'));
}

function confirmDeleteAsset(){
  const ctx = assetModalCtx; if (!ctx) return;
  moveToTrash(ctx.type, ctx.id);
  closeAssetModal();
  renderAll();
  toast('已移入回收箱（30 天内可恢复）');
}

function downloadAll(){
  const data = { archive: loadArchiveAll(), actions: loadActionsAll(), profile: loadProfile(), patterns: (() => { try { return JSON.parse(localStorage.getItem(LS_PATTERNS)); } catch(e){ return null; } })() };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const u = URL.createObjectURL(blob);
  const el = document.createElement('a');
  el.href = u; el.download = 'transform-growth-assets.json';
  el.click(); URL.revokeObjectURL(u);
}

function emptyTrash(){ saveTrash([]); renderTrash(); toast('回收箱已清空'); }

function escapeHtml(s){ return (s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

function exportOne(id){
  const a = loadActionsAll().find(x => x.id === id);
  if (!a) return;
  const blob = new Blob([JSON.stringify(a, null, 2)], { type: 'application/json' });
  const u = URL.createObjectURL(blob);
  const el = document.createElement('a');
  el.href = u; el.download = 'transform-action-' + a.id + '.json';
  el.click(); URL.revokeObjectURL(u);
}

function filterActions(actions){
  return actions.filter(a => {
    if (actionFilter.status && (a.status || 'active') !== actionFilter.status) return false;
    if (actionFilter.tag && !(a.tags || []).includes(actionFilter.tag)) return false;
    if (actionFilter.time && actionFilter.time !== 'all' && !withinTime(actionDateOf(a), actionFilter.time)) return false;
    if (actionFilter.q){
      const q = actionFilter.q.toLowerCase();
      const hay = [(a.input || a.goal || ''), (a.result || ''), (a.habit || ''), (a.goal || '')].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

function fmtDate(iso){ try { return new Date(iso).toLocaleDateString('zh-CN', {year:'numeric', month:'numeric', day:'numeric'}); } catch(e){ return ''; } }

function getAI(){
  let cfg; try { cfg = JSON.parse(localStorage.getItem(LS_AI)) || {}; } catch(e){ cfg = {}; }
  const brand = cfg.brand || 'DeepSeek';
  const profile = BRAND_PROFILES[brand] || BRAND_PROFILES['DeepSeek'];
  return { brand, apiKey: cfg.apiKey || '', baseUrl: cfg.baseUrl || profile.baseUrl, model: cfg.model || profile.model };
}

function groupByScenario(list){
  const def = ['一次梳理', '一次认知梳理', '一次想清楚'];
  const map = new Map();
  list.forEach(s => {
    const sc = (s.scenario || '').trim();
    const key = (sc && !def.includes(sc)) ? sc : ('__' + (s.id != null ? s.id : (JSON.stringify(s).length + '_' + Math.random())));
    if (!map.has(key)) map.set(key, { scenario: sc || '一次梳理', items: [] });
    map.get(key).items.push(s);
  });
  return [...map.values()];
}

function hasAnyAsset(){
  return loadArchive().length > 0 || loadActions().length > 0;
}

function insightDateOf(s){ return s.completedAt || s.createdAt || s.date || ''; }

function loadActions(){ try { return (JSON.parse(localStorage.getItem(LS_ACTIONS)) || []).filter(a => !a.archived); } catch(e){ return []; } }

function loadActionsAll(){ try { return JSON.parse(localStorage.getItem(LS_ACTIONS)) || []; } catch(e){ return []; } }

function loadArchive(){ try { return (JSON.parse(localStorage.getItem(LS_ARCHIVE)) || []).filter(s => !s.archived); } catch(e){ return []; } }

function loadArchiveAll(){ try { return JSON.parse(localStorage.getItem(LS_ARCHIVE)) || []; } catch(e){ return []; } }

function loadProfile(){ try { return JSON.parse(localStorage.getItem(LS_PROFILE)) || { identityStatements: [] }; } catch(e){ return { identityStatements: [] }; } }

function loadTrash(){ try { return JSON.parse(localStorage.getItem(LS_TRASH)) || []; } catch(e){ return []; } }

function markUse(type, id, where){
  try {
    assetSave(type, id, obj => {
      obj.uses = Array.isArray(obj.uses) ? obj.uses : [];
      obj.uses.push({ at: new Date().toISOString(), where: where });
    }, true);
  } catch(e){}
}

function moveToTrash(type, id){
  let item = null;
  if (type === 'insight' || type === 'model'){
    const list = loadArchiveAll();
    const i = list.findIndex(s => String(s.id) === String(id));
    if (i >= 0){ item = list[i]; list.splice(i, 1); localStorage.setItem(LS_ARCHIVE, JSON.stringify(list)); }
  } else if (type === 'action'){
    const list = loadActionsAll();
    const i = list.findIndex(a => String(a.id) === String(id));
    if (i >= 0){ item = list[i]; list.splice(i, 1); localStorage.setItem(LS_ACTIONS, JSON.stringify(list)); }
  } else if (type === 'pattern'){
    let saved = null; try { saved = JSON.parse(localStorage.getItem(LS_PATTERNS)); } catch(e){}
    if (saved && saved.patterns){ const i = parseInt(id); if (i >= 0 && i < saved.patterns.length){ item = saved.patterns[i]; saved.patterns.splice(i, 1); localStorage.setItem(LS_PATTERNS, JSON.stringify(saved)); } }
  }
  if (!item) return false;
  const trash = loadTrash();
  trash.push({ tid: 't_' + Date.now() + '_' + Math.floor(Math.random()*1000), type, data: item, deletedAt: new Date().toISOString() });
  saveTrash(trash);
  return true;
}

function openAssetArchive(type, id){
  if (type === 'pattern'){ toast('模式总结暂不支持归档'); return; }
  if (type === 'action'){
    const list = loadActionsAll();
    const o = list.find(a => String(a.id) === String(id));
    if (o){ o.archived = true; localStorage.setItem(LS_ACTIONS, JSON.stringify(list)); toast('已归档 · 封存不删，可从下方「已归档」恢复'); renderAll(); }
    return;
  }
  const list = loadArchiveAll();
  const o = list.find(s => String(s.id) === String(id));
  if (o){ o.archived = true; localStorage.setItem(LS_ARCHIVE, JSON.stringify(list)); toast('已归档 · 封存不删，可从下方「已归档」恢复'); renderAll(); }
}

function openAssetDelete(type, id){
  const obj = assetFind(type, id);
  if (!obj){ toast('找不到这条资产'); return; }
  assetModalCtx = { type, id };
  const preview = (type === 'pattern') ? obj.title : (obj.scenario || obj.input || obj.goal || obj.title || '这条资产');
  openAssetModal(`
    <h3><svg width="17" height="17" viewBox="0 0 24 24" fill="none" style="vertical-align:middle"><path d="M4 7h16M9.5 7V5.2a1.2 1.2 0 011.2-1.2h2.6a1.2 1.2 0 011.2 1.2V7M6.5 7l.9 12.1a1.2 1.2 0 001.2 1.1h6.8a1.2 1.2 0 001.2-1.1L17.5 7" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg> 删除${assetTypeName(type)}</h3>
    <p style="font-size:14px;color:var(--ink);line-height:1.7;">确定删除「<b>${escapeHtml(String(preview).slice(0, 30))}</b>」吗？将移入回收箱，30 天内可随时恢复。</p>
    <div class="row">
      <button class="btn-danger" style="flex:1;" onclick="confirmDeleteAsset()">移入回收箱</button>
      <button class="btn-ghost" onclick="closeAssetModal()">取消</button>
    </div>`);
}

function openAssetEdit(type, id){
  const obj = assetFind(type, id);
  if (!obj){ toast('找不到这条资产'); return; }
  assetModalCtx = { type, id };
  const e = obj.essence || {};
  const r = obj.reflection || {};
  let fields = '';
  if (type === 'model'){
    fields = `
      <label>场景</label><input id="ae1" value="${escapeHtml(obj.scenario || '')}">
      <label>认知框架</label><textarea id="ae2">${escapeHtml(obj.mentalModel || '')}</textarea>
      <label>改变了什么</label><textarea id="ae3">${escapeHtml(r.changed || '')}</textarea>`;
  } else if (type === 'insight'){
    fields = `
      <label>场景</label><input id="ae1" value="${escapeHtml(obj.scenario || '')}">
      <label>本质</label><textarea id="ae2">${escapeHtml(e.nature || '')}</textarea>
      <label>洞察</label><textarea id="ae3">${escapeHtml(e.insight || '')}</textarea>
      <label>学到</label><textarea id="ae4">${escapeHtml(r.learned || '')}</textarea>`;
  } else if (type === 'action'){
    fields = `
      <label>目标 / 输入</label><textarea id="ae1">${escapeHtml(obj.input || obj.goal || '')}</textarea>
      <label>结果</label><textarea id="ae2">${escapeHtml(obj.result || '')}</textarea>
      <label>新习惯</label><textarea id="ae3">${escapeHtml(obj.habit || '')}</textarea>
      <label>改变</label><textarea id="ae4">${escapeHtml(r.changed || '')}</textarea>`;
  } else if (type === 'pattern'){
    fields = `
      <label>模式标题</label><input id="ae1" value="${escapeHtml(obj.title || '')}">
      <label>支撑证据</label><textarea id="ae2">${escapeHtml(obj.evidence || '')}</textarea>
      <label>洞察与建议</label><textarea id="ae3">${escapeHtml(obj.insight || '')}</textarea>`;
  }
  openAssetModal(`
    <h3><svg width="17" height="17" viewBox="0 0 24 24" fill="none" style="vertical-align:middle"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4L16.5 3.5z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg> 编辑${assetTypeName(type)}</h3>
    ${fields}
    <div class="row">
      <button class="btn-ok" style="flex:1;" onclick="saveAssetEdit()">保存</button>
      <button class="btn-ghost" onclick="closeAssetModal()">取消</button>
    </div>`);
}

function openAssetModal(html){
  const mask = $('assetModalMask'); const box = $('assetModalBox');
  if (!mask || !box) return;
  box.innerHTML = html;
  mask.classList.add('show');
}

function openAssetTag(type, id){
  const obj = assetFind(type, id);
  if (!obj){ toast('找不到这条资产'); return; }
  assetModalCtx = { type, id };
  const tags = obj.tags || [];
  renderTagModal(tags);
}

function openSettings(){
  const cfg = getAI();
  $('cfgBrand').value = cfg.brand;
  $('cfgApiKey').value = cfg.apiKey || '';
  $('settingsMask').classList.add('show');
}

function punchHandoffUrl(obj){
  const e = (obj && obj.essence) || {};
  const r = (obj && obj.reflection) || {};
  const ins = String(e.insight || e.nature || r.learned || '').trim();
  const nat = String(e.nature || '').trim();
  const sc  = String((obj && obj.scenario) || '').trim();
  const qs = [];
  if (ins) qs.push('insight=' + encodeURIComponent(ins));
  if (nat && nat !== ins) qs.push('nature=' + encodeURIComponent(nat));
  if (sc) qs.push('scenario=' + encodeURIComponent(sc));
  return 'punch.html' + (qs.length ? '?' + qs.join('&') : '');
}

function purgeOldTrash(){
  const now = Date.now();
  let trash = loadTrash();
  const before = trash.length;
  trash = trash.filter(t => (now - new Date(t.deletedAt).getTime()) < TRASH_TTL);
  if (trash.length !== before) saveTrash(trash);
}

function purgeTrashItem(tid){
  let trash = loadTrash();
  trash = trash.filter(t => t.tid !== tid);
  saveTrash(trash);
  renderTrash();
}

function removeAssetTag(t){
  const ctx = assetModalCtx; if (!ctx) return;
  assetSave(ctx.type, ctx.id, obj => {
    obj.tags = (obj.tags || []).filter(x => x !== t);
  });
  const obj = assetFind(ctx.type, ctx.id);
  renderTagModal((obj && obj.tags) || []);
}

function renderArchived(){
  const box = $('archivedList'); if (!box) return;
  const cnt = $('archivedCount'); if (cnt) cnt.textContent = archivedItems().length;
  const list = archivedItems();
  if (!list.length){ box.innerHTML = '<div class="empty-tip" style="color:var(--ink-3);padding:10px 2px;font-size:13px;">还没有归档的记录 —— 想封存、又不想删的资产会放在这里。</div>'; return; }
  box.innerHTML = list.map(o => `<div class="trash-item">
      <div class="ti-main">
        <span class="ti-type">${o.type === 'action' ? '行为实验' : '记录'}</span>
        <div class="ti-title">${escapeHtml(String(o.title).slice(0, 40))}</div>
        <div class="ti-sub">${escapeHtml(String(o.sub).slice(0, 60))}</div>
      </div>
      <div class="ti-actions">
        <button class="mini" onclick="restoreArchived('${o.type}','${o.id}')">↩ 恢复</button>
        <button class="mini del" onclick="if(moveToTrash('${o.type}','${o.id}')){renderAll();toast('已移入回收箱');}"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" style="vertical-align:middle"><path d="M4 7h16M9.5 7V5.2a1.2 1.2 0 011.2-1.2h2.6a1.2 1.2 0 011.2 1.2V7M6.5 7l.9 12.1a1.2 1.2 0 001.2 1.1h6.8a1.2 1.2 0 001.2-1.1L17.5 7" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg> 删除</button>
      </div>
    </div>`).join('');
}

function renderIdentity(){
  const profile = loadProfile();
  const votes = (profile.identityStatements || []).slice();
  const area = $('identityArea');
  if (!votes.length){
    area.innerHTML = `<div class="identity-empty">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8.5" stroke="#1D9E75" stroke-width="2"/><path d="M12 8v4l2.6 2.6" stroke="#1D9E75" stroke-width="2" stroke-linecap="round"/></svg>
      还没有身份票。每完成一次「每日洞察」或「每日改变」，都会给「我想成为的人」投一票，票数在这里累积。
    </div>`;
    return;
  }
  const map = new Map();
  votes.forEach(s => {
    const it = map.get(s.text) || { text: s.text, votes: 0, date: s.date };
    it.votes += (s.votes || 1);
    if (new Date(s.date) > new Date(it.date)) it.date = s.date;
    map.set(s.text, it);
  });
  const list = Array.from(map.values()).sort((a,b) => (b.votes - a.votes) || (new Date(b.date) - new Date(a.date)));
  const top = list[0];
  const rest = list.slice(1);
  // 用户写的身份常以「…的人 / …者」结尾，避免渲染成「…的人」的人
  const idText = String(top.text || '').trim();
  const idTail = /(人|者|员|家|师|匠)$/.test(idText) ? '' : '的人';
  area.innerHTML = `
    <div class="identity-card">
      <div class="k">我正在成为</div>
      <div class="v">「<em>${escapeHtml(idText)}</em>」${idTail}</div>
      <div class="count">已投 ${top.votes} 票${rest.length ? ' · 还有 ' + rest.length + ' 个身份在累积中' : ' · 你正在成为这个人'}</div>
    </div>`;
}

function renderInsightTime(){
  const box = $('insightTime'); if (!box) return;
  box.innerHTML = timeChipsHtml(insightTime, 'setInsightTime');
}

function renderTagModal(tags){
  const ctx = assetModalCtx; if (!ctx) return;
  const allTags = collectAllTags();
  const available = allTags.filter(t => !tags.includes(t));
  openAssetModal(`
    <h3><svg width="17" height="17" viewBox="0 0 24 24" fill="none" style="vertical-align:middle"><path d="M3 11.5V4.5A1.5 1.5 0 014.5 3h7a1.5 1.5 0 011.06.44l8 8a1.5 1.5 0 010 2.12l-6.44 6.44a1.5 1.5 0 01-2.12 0l-8-8A1.5 1.5 0 013 11.5z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><circle cx="7.6" cy="7.6" r="1.4" fill="currentColor"/></svg> 归类${assetTypeName(ctx.type)}</h3>
    <p style="font-size:13px;color:var(--ink-2);margin-bottom:8px;">给这条资产打标签，便于日后按主题查找。</p>
    <div class="tag-list" id="tagList">${tags.map(t => `<span class="tag-item">${escapeHtml(t)}<span class="x" onclick="removeAssetTag('${escapeHtml(t)}')">×</span></span>`).join('')}</div>
    ${available.length ? `<div style="margin-top:14px;"><p style="font-size:12px;color:var(--ink-3);margin-bottom:6px;">从已有标签中选择</p><div class="modal-existing-tags">${available.map(t => `<button class="existing-tag" onclick="addAssetTagByText('${String(t).replace(/'/g, "\\'")}')">+ ${escapeHtml(t)}</button>`).join('')}</div></div>` : ''}
    <div class="tag-input-row" style="margin-top:14px;">
      <input id="newTagInput" placeholder="没有合适标签？输入新标签" style="flex:1;" maxlength="20" onkeydown="if(event.key==='Enter')addAssetTag()">
      <button class="btn-ok" onclick="addAssetTag()">添加</button>
    </div>
    <div class="row">
      <button class="btn-ok" style="flex:1;" onclick="closeAssetModal()">完成</button>
      <button class="btn-ghost" onclick="closeAssetModal()">取消</button>
    </div>`);
}

function renderTrash(){
  const box = $('trashList'); if (!box) return;
  const trash = loadTrash();
  const cnt = $('trashCount'); if (cnt) cnt.textContent = trash.length;
  const emptyBtn = $('trashEmptyBtn'); if (emptyBtn) emptyBtn.style.display = trash.length ? '' : 'none';
  if (!trash.length){ box.innerHTML = `<div class="expand-empty">回收箱是空的。<br>删除的资产会先到这里，30 天内可随时恢复。</div>`; return; }
  const now = Date.now();
  box.innerHTML = trash.map(t => {
    const daysLeft = Math.max(0, Math.ceil((TRASH_TTL - (now - new Date(t.deletedAt).getTime())) / 86400000));
    const leftText = daysLeft <= 0 ? '即将彻底删除' : ('将于 ' + daysLeft + ' 天后彻底删除');
    return `<div class="trash-item">
      <div class="ti-main">
        <span class="ti-type">${assetTypeName(t.type)}</span>
        <div class="ti-title">${escapeHtml(String(trashPreview(t.data, t.type)).slice(0, 40))}</div>
        <div class="ti-sub">删除于 ${fmtDate(t.deletedAt)} · ${leftText}</div>
      </div>
      <div class="ti-actions">
        <button class="mini" onclick="restoreFromTrash('${t.tid}')">恢复</button>
        <button class="mini del" onclick="purgeTrashItem('${t.tid}')">彻底删除</button>
      </div>
    </div>`;
  }).join('');
}

function restoreArchived(type, id){
  if (type === 'action'){
    const list = loadActionsAll();
    const o = list.find(a => String(a.id) === String(id));
    if (o){ o.archived = false; localStorage.setItem(LS_ACTIONS, JSON.stringify(list)); toast('已恢复'); renderAll(); }
    return;
  }
  const list = loadArchiveAll();
  const o = list.find(s => String(s.id) === String(id));
  if (o){ o.archived = false; localStorage.setItem(LS_ARCHIVE, JSON.stringify(list)); toast('已恢复'); renderAll(); }
}

function restoreFromTrash(tid){
  const trash = loadTrash();
  const i = trash.findIndex(t => t.tid === tid);
  if (i < 0) return;
  const t = trash[i];
  const obj = t.data;
  if (t.type === 'pattern'){
    let saved = null; try { saved = JSON.parse(localStorage.getItem(LS_PATTERNS)); } catch(e){ saved = null; }
    if (!saved) saved = { patterns: [], generatedAt: null };
    if (!saved.patterns) saved.patterns = [];
    saved.patterns.push(obj);
    localStorage.setItem(LS_PATTERNS, JSON.stringify(saved));
  } else if (t.type === 'action'){
    const list = loadActionsAll();
    if (!list.find(a => String(a.id) === String(obj.id))) list.push(obj);
    localStorage.setItem(LS_ACTIONS, JSON.stringify(list));
  } else {
    const list = loadArchiveAll();
    if (!list.find(s => String(s.id) === String(obj.id))) list.push(obj);
    localStorage.setItem(LS_ARCHIVE, JSON.stringify(list));
  }
  trash.splice(i, 1);
  saveTrash(trash);
  renderAll();
  renderTrash();
  toast('已恢复到成长资产');
}

function saveAssetEdit(){
  const ctx = assetModalCtx; if (!ctx) return;
  const v = i => { const el = document.getElementById(i); return el ? el.value.trim() : ''; };
  assetSave(ctx.type, ctx.id, obj => {
    const e = obj.essence || (obj.essence = {});
    const r = obj.reflection || (obj.reflection = {});
    if (ctx.type === 'model'){
      obj.scenario = v('ae1'); obj.mentalModel = v('ae2'); r.changed = v('ae3');
    } else if (ctx.type === 'insight'){
      obj.scenario = v('ae1'); e.nature = v('ae2'); e.insight = v('ae3'); r.learned = v('ae4');
    } else if (ctx.type === 'action'){
      obj.input = v('ae1'); obj.result = v('ae2'); obj.habit = v('ae3'); r.changed = v('ae4');
    } else if (ctx.type === 'pattern'){
      obj.title = v('ae1'); obj.evidence = v('ae2'); obj.insight = v('ae3');
    }
  });
  closeAssetModal();
  toast('已保存');
}

function saveSettings(){
  const brand = $('cfgBrand').value;
  const apiKey = $('cfgApiKey').value.trim();
  const profile = BRAND_PROFILES[brand] || BRAND_PROFILES['DeepSeek'];
  localStorage.setItem(LS_AI, JSON.stringify({ brand, apiKey, baseUrl: profile.baseUrl, model: profile.model }));
  closeSettings();
  toast('AI 设置已保存');
  renderPatterns();
}

function saveTrash(list){ localStorage.setItem(LS_TRASH, JSON.stringify(list)); }

function saveUIState(){
  let u = {};
  try { u = JSON.parse(localStorage.getItem(TRF_UI_KEY) || '{}') || {}; } catch(e){ u = {}; }
  u.open = sectionOpen;
  u.scroll = uiScroll;
  try { localStorage.setItem(TRF_UI_KEY, JSON.stringify(u)); } catch(e){}
}

function setInsightSearch(v){
  insightSearch = (v || '').trim();
  renderInsights();
}

function setInsightTime(m){ insightTime = m; renderInsightTime(); renderInsights(); }

function setTagFilter(t){ insightFilter = t; renderTagFilters(); renderInsights(); }

function showFootSection(which){
  const sec = $('trashSection'); if (!sec) return;
  sec.removeAttribute('hidden');
  const card = sec.querySelector(`.expand-card[data-section="${which}"]`);
  if (card && !card.classList.contains('open')) card.classList.add('open');
  if (card) setTimeout(() => card.scrollIntoView({ behavior: 'smooth', block: 'center' }), 60);
}

function timeChipsHtml(cur, onClick){
  const label = { all: '全部时间', '7': '近 7 天', '30': '近 30 天', month: '本月' };
  return ['all','7','30','month'].map(m =>
    `<button class="filter-chip${cur === m ? ' on' : ''}" onclick="${onClick}('${m}')">${label[m]}</button>`).join('');
}

function toast(msg){ const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(t._timer); t._timer = setTimeout(()=>t.classList.remove('show'), 2200); }

function toggleExpand(head){
  const card = head.closest('.expand-card');
  card.classList.toggle('open');
  if (card.dataset.section){
    sectionOpen['sec:' + card.dataset.section] = card.classList.contains('open');
    saveUIState();
  }
}

function toggleFilterPanel(){
  const p = $('filterPanel'); const b = $('filterToggleBtn');
  if (!p || !b) return;
  const willOpen = p.hasAttribute('hidden');
  if (willOpen) p.removeAttribute('hidden'); else p.setAttribute('hidden', '');
  b.classList.toggle('on', willOpen);
}

function toggleFold(card){
  card.classList.toggle('open');
  sectionOpen['fold:' + card.id] = card.classList.contains('open');
  saveUIState();
}

function toggleMoreMenu(btn){
  const menu = btn.parentElement.querySelector('.more-menu');
  if (!menu) return;
  if (menu.hasAttribute('hidden')) menu.removeAttribute('hidden');
  else menu.setAttribute('hidden', '');
}

function togglePin(type, id){
  let now = false;
  assetSave(type, id, obj => { obj.pinned = !obj.pinned; now = !!obj.pinned; });
  toast(now ? '已加入「待用」' : '已从「待用」移除');
}

function toggleRestOcc(btn){
  const body = btn.closest('.fold-body'); if (!body) return;
  const rest = body.querySelector('.occ-rest'); if (!rest) return;
  const n = rest.children.length;
  if (rest.hasAttribute('hidden')){ rest.removeAttribute('hidden'); btn.textContent = '收起较早的 ' + n + ' 次记录'; }
  else { rest.setAttribute('hidden', ''); btn.textContent = '还有 ' + n + ' 次较早的记录 · 展开全部'; }
}

function toggleTheme(){
  const root = document.documentElement;
  const dark = root.getAttribute('data-theme') === 'dark';
  root.setAttribute('data-theme', dark ? 'light' : 'dark');
  try { localStorage.setItem('trf_theme', dark ? 'light' : 'dark'); } catch(e){}
}

function trashPreview(obj, type){
  if (type === 'pattern') return obj.title || '模式';
  if (type === 'action') return obj.input || obj.goal || '行为实验';
  return obj.scenario || '一次梳理';
}

function withinTime(dstr, mode){
  if (!mode || mode === 'all') return true;
  const raw = String(dstr || '').trim();
  if (!raw) return false;
  const t = new Date(raw.length <= 10 ? raw + 'T00:00:00' : raw);
  if (isNaN(t.getTime())) return false;
  const now = new Date();
  if (mode === 'month') return t.getFullYear() === now.getFullYear() && t.getMonth() === now.getMonth();
  const days = mode === '7' ? 7 : 30;
  return t.getTime() <= now.getTime() + 864e5 && (now.getTime() - t.getTime()) <= days * 864e5;
}
