/* 谈伴 Negotia · v2 应用逻辑
   架构（对应 MRD §8.3）：
   - StorageAdapter：持久化抽象，v1=localStorage；v2 新增 ApiStorageAdapter 即可切后端。
   - KB：运行时 fetch kb/ 下 JSON（世界/人设/场景/技术卡/中国模块），可审阅改写。
   - 训练闭环：选场景→角色卡简报→AVG 对话(对手扮演+同盟者提示)→强复盘(强弱/强化/下一步/新测试)→掌握度测试。
   - 辅助：战前准备(真实困境参谋) + 自定义主题(按模板生成专属场景)。
   - AI：有 Key 走真实 LLM（对手扮演 / 复盘点评 / 战前策略）；无 Key 全本地降级（铁律：真实数据、禁编造智能感）。 */

'use strict';

/* ===== 1. 存储抽象（可扩展后端） ===== */
const StorageAdapter = {
  _ls(){ return window.localStorage; },
  get(key, fb){ try{ const v=this._ls().getItem('negotia_'+key); return v?JSON.parse(v):fb; }catch(e){ return fb; } },
  set(key, val){ try{ this._ls().setItem('negotia_'+key, JSON.stringify(val)); }catch(e){} }
};

/* ===== 2. 知识库加载 ===== */
const KB = {
  base:'kb/', manifest:null,
  async loadManifest(){ if(this.manifest) return this.manifest; this.manifest=await (await fetch(this.base+'manifest.json')).json(); return this.manifest; },
  async loadWorld(code){ return await (await fetch(`${this.base}worlds/${code}.json`)).json(); },
  async loadScenario(id){ return await (await fetch(`${this.base}scenarios/${id[0]}/${id}.json`)).json(); },
  async loadTechnique(id){ return await (await fetch(`${this.base}techniques/${id}.json`)).json(); }
};

/* ===== 3. 六维能力（全部落在 Chris Voss 核心） ===== */
const DIMS = [
  { k:'empathy',    name:'战术同理', how:'先接住情绪，再谈事' },
  { k:'labeling',   name:'标注镜像', how:'把对方没说的感受说出来' },
  { k:'calibrated', name:'校准问题', how:'用「怎么/如何」把难题抛回去' },
  { k:'noOr',       name:'邀「不」',  how:'让对方能安全地拒绝' },
  { k:'blackswan',  name:'黑天鹅',   how:'找那句没说出口的真意' },
  { k:'closing',    name:'收口执行', how:'把共识落成明确的下一步' }
];
const DIM_MAX = 10;                 // 自评 5 分 + 最多 5 点成长 = 满格
// 技术 → 能力维度（一关通关只给「相关维度」加点，不平均撒）
const TECH_DIM = {
  'tactical-empathy':'empathy', 'accusation-audit':'empathy', 'loss-aversion':'empathy',
  'labeling':'labeling', 'mirroring':'labeling',
  'calibrated-question':'calibrated',
  'no-oriented-question':'noOr',
  'black-swan':'blackswan', 'second-story':'blackswan',
  'thats-right':'closing', 'ackerman':'closing', 'deadline-pace':'closing'
};
const TECH_LABEL = {
  'tactical-empathy':'战术同理心', 'mirroring':'镜像', 'labeling':'标注',
  'calibrated-question':'校准问题', 'no-oriented-question':'邀「不」', 'accusation-audit':'指控审计',
  'black-swan':'黑天鹅', 'loss-aversion':'损失厌恶', 'thats-right':'That’s right',
  'ackerman':'Ackerman 出价', 'deadline-pace':'时间压力', 'second-story':'第二层故事'
};
const DIM_NAME = Object.fromEntries(DIMS.map(d=>[d.k,d.name]));

/* ===== 4. 全局状态 ===== */
const State = {
  world:null, scenario:null, persona:null, messages:[], used:new Set(),
  goal:'', mode:'practice', isMastery:false, swapIndex:0, prepBrief:'', lastScore:null,
  firstPass:false, pendingDims:[]
};

/* ===== 4.5 我的人设 · 六维成长 ===== */
const TRAITS = ['直接','委婉','慢热','强势','怕冲突','会看眼色','讲道理','容易让步'];
const VALUES = ['结果','关系','公平','体面'];
const PREFS  = ['先把话说清','先摸对方底','先礼后兵'];

function getMe(){ return StorageAdapter.get('me', null); }
function hasProfile(){ const m=getMe(); return !!(m && m.name); }
function selfEval(){ return StorageAdapter.get('selfeval', {}); }
function dimGrowth(){ return StorageAdapter.get('dimgrowth', {}); }
function dimPoint(k){ return (selfEval()[k]||0) + (dimGrowth()[k]||0); }
function dimPct(k){ return Math.max(4, Math.min(100, dimPoint(k)/DIM_MAX*100)); }
function monoOf(name){ const s=(name||'').trim(); return s? s.slice(-1) : '我'; }
function totalGrowth(){ return Object.values(dimGrowth()).reduce((a,b)=>a+b,0); }

/* 训练门禁：必须先有人设 */
function requireProfile(){
  if(hasProfile()) return true;
  toast('先花 1 分钟建个人设，之后的每一关才记进你的雷达');
  openPersonaCreate('first');
  return false;
}

/* ---- 建立 / 编辑人设 ---- */
const P = { step:1, mode:'first', traits:[], value:'', pref:'', eval:{}, draft:null };

function openPersonaCreate(mode){
  P.mode = mode || 'first';
  P.step = 1; P.draft = null;
  const me = getMe();
  P.traits = me ? [...(me.traits||[])] : [];
  P.value  = me ? (me.value||'') : '';
  P.pref   = me ? (me.pref||'') : '';
  P.eval   = { ...selfEval() };
  DIMS.forEach(d=>{ if(!P.eval[d.k]) P.eval[d.k]=3; });

  $('#persona-title').textContent = me ? '编辑我的人设' : '建立我的人设';
  $('#p-name').value = me ? me.name : '';
  $('#p-role').value = me ? (me.role||'') : '';
  renderChips();
  renderSelfEval();
  setPersonaStep(1);
  show('persona');
}
function renderChips(){
  const mk=(host, items, isOn, onPick)=>{
    const box=$(host); box.innerHTML='';
    items.forEach(v=>{
      const b=document.createElement('button');
      b.type='button'; b.className='chip'+(isOn(v)?' on':''); b.textContent=v;
      b.onclick=()=>{ onPick(v); };
      box.appendChild(b);
    });
  };
  mk('#chip-traits', TRAITS, v=>P.traits.includes(v), v=>{
    const i=P.traits.indexOf(v);
    if(i>=0) P.traits.splice(i,1);
    else { if(P.traits.length>=3){ toast('最多选 3 个，多了就不像你了'); return; } P.traits.push(v); }
    renderChips();
  });
  mk('#chip-values', VALUES, v=>P.value===v, v=>{ P.value = (P.value===v?'':v); renderChips(); });
  mk('#chip-pref',   PREFS,  v=>P.pref===v,  v=>{ P.pref  = (P.pref===v?'':v);  renderChips(); });
}
function renderSelfEval(){
  const box=$('#selfeval-list'); box.innerHTML='';
  DIMS.forEach(d=>{
    const row=document.createElement('div'); row.className='se-row';
    row.innerHTML=`<div class="se-top"><span class="se-name">${d.name}</span><span class="se-val" id="sev-${d.k}">${P.eval[d.k]} 分</span></div>
      <div class="se-hint">${d.how}</div>
      <div class="se-scale">${[1,2,3,4,5].map(n=>`<button type="button" class="se-dot${P.eval[d.k]===n?' on':''}" data-k="${d.k}" data-n="${n}">${n}</button>`).join('')}</div>`;
    box.appendChild(row);
  });
  box.querySelectorAll('.se-dot').forEach(btn=>{
    btn.onclick=()=>{
      const k=btn.dataset.k, n=+btn.dataset.n;
      P.eval[k]=n;
      const val=$('#sev-'+k); if(val) val.textContent=n+' 分';
      btn.parentElement.querySelectorAll('.se-dot').forEach(x=>x.classList.toggle('on', +x.dataset.n===n));
    };
  });
}
function setPersonaStep(n){
  P.step=n;
  [1,2].forEach(i=>{ const el=$('#pstep-'+i); if(el) el.classList.toggle('hidden', i!==n); });
  const dots=$('#persona-dots'); if(dots) [...dots.children].forEach((d,i)=>d.classList.toggle('on', i<n));
  const btn=$('#btn-persona-next');
  if(btn){ btn.disabled=false; btn.textContent = n===1 ? '下一步' : '生成我的人设卡'; }
  const sc=$('.persona-scroll'); if(sc) sc.scrollTop=0;
}
async function personaNext(){
  if(P.step===1){
    if(!$('#p-name').value.trim()){ toast('先填一个称呼'); $('#p-name').focus(); return; }
    setPersonaStep(2); return;
  }
  await generatePersona();
}
/* 生成完直接落库并进入「我」页 —— 人设卡 + 雷达只在一处呈现，不再单开预览页 */
async function generatePersona(){
  const name=$('#p-name').value.trim();
  const role=$('#p-role').value.trim();
  if(!name){ setPersonaStep(1); toast('先填一个称呼'); return; }
  const btn=$('#btn-persona-next');
  if(btn){ btn.disabled=true; btn.textContent='正在写你的人设卡…'; }
  const base={ name, role, traits:[...P.traits], value:P.value, pref:P.pref, eval:{...P.eval} };
  const cfg=StorageAdapter.get('settings',null);
  let gen=null;
  if(cfg&&cfg.key&&cfg.endpoint){ try{ gen=await llmPersona(base); }catch(e){} }
  if(!gen) gen=localPersona(base);
  P.draft={ ...base, ...gen, source: gen._ai?'ai':'local' };
  savePersona();
}
async function llmPersona(b){
  const sys=`你在为「谈伴」（中国语境谈判训练）生成一张谈判者人设卡。
用户：称呼「${b.name}」，身份「${b.role||'未填'}」，性格标签「${b.traits.join('、')||'未选'}」，最看重「${b.value||'未选'}」，开口习惯「${b.pref||'未选'}」。
六维自评（1-5）：${DIMS.map(d=>d.name+' '+b.eval[d.k]).join('，')}。
用中文输出严格 JSON（不要代码围栏、不要多余文字）：
{"summary":"2-3 句第二人称画像：他谈事的样子、内在在意什么、压力下的反应。具体、温暖、不评判、不写简历体、不用表情符号。","tags":["3 个 2-4 字标签"],"advantage":"一句天然优势，具体到能想象出画面","blindspot":"一句最大盲区，具体但不打击，指出它会怎么让你丢分"}`;
  const text=await callLLM(sys,[{role:'user',content:`请生成 ${b.name} 的人设卡。`}]);
  if(!text) return null;
  try{
    const j=JSON.parse(text.replace(/```json|```/g,'').trim());
    if(j&&j.summary){
      return { summary:j.summary, tags:(j.tags||[]).slice(0,3), advantage:j.advantage||'', blindspot:j.blindspot||'', _ai:true };
    }
  }catch(e){}
  return null;
}
function localPersona(b){
  const t=b.traits;
  const styleMap={
    '直接':'不爱绕弯，习惯把话摊开说',
    '委婉':'话里有话，先把气氛顾住',
    '慢热':'前半程在观察，摸清了才发力',
    '强势':'气场先到，容易让对方先防守',
    '怕冲突':'倾向先让一步，把火压住',
    '会看眼色':'一边说一边读对方的脸色',
    '讲道理':'喜欢把事实和逻辑摆齐',
    '容易让步':'心一软就先退半步'
  };
  const style = (t[0]&&styleMap[t[0]]) || '按自己的节奏来，不急着表态';
  const valueLine = {
    '结果':'所以你更在意事情有没有推进，而不是当时气氛好不好',
    '关系':'所以你宁可慢一点，也不想把关系弄僵',
    '公平':'所以一旦觉得不公，你很难咽下去',
    '体面':'所以当众被驳面子，对你伤害最大'
  }[b.value] || '所以你常常先想清楚再开口';
  const pressLine = {
    '先把话说清':'第一反应是把事实和道理一次讲清楚',
    '先摸对方底':'第一反应是先问、先听，再决定说什么',
    '先礼后兵':'第一反应是先把礼数走足，实在不行才亮底线'
  }[b.pref] || '第一反应是先稳住场面';
  const advMap={
    '直接':'你不绕弯，对方不用猜你的意思，省时间',
    '委婉':'你能保住对方的面子，关系不容易破',
    '会看眼色':'你能读到对方没说出口的犹豫，这正是黑天鹅的入口',
    '讲道理':'你有事实和逻辑，谈判桌上这是底气',
    '慢热':'你不容易被带节奏，观察比反应多',
    '强势':'你敢开口要，很多人连要都不敢',
    '怕冲突':'你懂得留余地，冲突不会失控',
    '容易让步':'你有诚意，容易换到对方的诚意'
  };
  const riskMap={
    '直接':'太直容易让对方下不来台，越要面子的人越听不进去',
    '委婉':'太委婉，对方可能根本没听懂你在要什么',
    '强势':'气场压过去，对方会先防守，真话就不说了',
    '怕冲突':'怕冲突的人，最先让掉的往往是自己真正的底线',
    '容易让步':'让步太快，对方会默认还有空间',
    '慢热':'前几句太淡，可能错过定调的机会',
    '讲道理':'太讲道理，容易忽略对方心里的情绪账',
    '会看眼色':'太会看脸色，容易被对方的情绪牵着走'
  };
  const tags=[...new Set(t.slice(0,2))];
  if(b.value) tags.push(b.value+'优先');
  while(tags.length<2) tags.push('还在摸');
  return {
    summary:`你谈事的时候${style}，最看重的是${b.value||'把事情办成'}——${valueLine}。压力上来时，你${pressLine}。这套反应本身没有对错，它是你练出来的本能；接下来要做的，是在本能和开口之间，多留半秒。`,
    tags:tags.slice(0,3),
    advantage:(t[0]&&advMap[t[0]]) || '你愿意开口练，这本身就是谈判里最稀缺的动作',
    blindspot:(t[0]&&riskMap[t[0]]) || '你还没给自己贴标签，先练一场，我会告诉你哪一步最容易掉分'
  };
}
function idCardHTML(d){
  const tags=(d.tags||[]).map(t=>`<span>${t}</span>`).join('');
  return `<div class="id-card">
    <div class="id-top">
      <div class="id-mono">${monoOf(d.name)}</div>
      <div>
        <div class="id-name">${d.name}</div>
        <div class="id-role">${d.role||'还没填身份'}</div>
        <div class="id-tags">${tags}</div>
      </div>
    </div>
    <div class="id-rule"></div>
    <div class="id-sum">${d.summary}</div>
    <div class="id-pair">
      <div class="id-pair-row"><span class="id-k good">天然优势</span><span class="id-v">${d.advantage}</span></div>
      <div class="id-pair-row"><span class="id-k warn">最大盲区</span><span class="id-v">${d.blindspot}</span></div>
    </div>
  </div>`;
}
function savePersona(){
  const d=P.draft; if(!d){ return; }
  StorageAdapter.set('me', {
    name:d.name, role:d.role||'', traits:d.traits||[], value:d.value||'', pref:d.pref||'',
    summary:d.summary, tags:d.tags||[], advantage:d.advantage||'', blindspot:d.blindspot||'',
    source:d.source||'local', updatedAt:new Date().toISOString().slice(0,10)
  });
  StorageAdapter.set('selfeval', d.eval||P.eval);
  toast(P.mode==='edit' ? '人设已更新' : '人设卡已生成 · 雷达基线已记下');
  show('me');   // show 内部会调 renderMe()
}

/* ===== 4.6 PWA：离线可用 + 装到桌面 ===== */
let INSTALL_EVT = null;
function isStandalone(){
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}
function refreshInstallUI(){
  const btn=$('#btn-install'), hint=$('#install-hint');
  if(!btn) return;
  if(isStandalone()){
    btn.disabled=true; btn.textContent='已经装在桌面上了';
    if(hint) hint.classList.add('hidden');
    return;
  }
  if(INSTALL_EVT){ btn.disabled=false; btn.textContent='安装到桌面'; if(hint) hint.classList.add('hidden'); return; }
  // 没有安装事件：iOS 只能在分享菜单里手动加，其余浏览器给一句菜单路径
  btn.classList.add('hidden');
  if(hint){
    const ios=/iPhone|iPad|iPod/i.test(navigator.userAgent);
    hint.className='set-test';
    hint.textContent = ios
      ? 'iPhone / iPad：点浏览器底部「分享」，选「添加到主屏幕」。'
      : '这个浏览器没提供一键安装：打开浏览器菜单，选「安装应用」或「添加到主屏幕」。';
  }
}
window.addEventListener('beforeinstallprompt',(e)=>{ e.preventDefault(); INSTALL_EVT=e; refreshInstallUI(); });
window.addEventListener('appinstalled',()=>{ INSTALL_EVT=null; toast('已装到桌面'); refreshInstallUI(); });

/* ---- 「我」页：人设卡 + 六边形雷达 ---- */
function renderMe(){
  const me=getMe();
  if(!me){ openPersonaCreate('first'); return; }
  const prog=StorageAdapter.get('progress',{});
  const passedList=Object.values(prog).filter(p=>p.passed).sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  const total=['A','B','C'].reduce((n,c)=>{
    const items=(State.manifest&&State.manifest.domains&&State.manifest.domains[c]&&State.manifest.domains[c].items)||[];
    return n+items.length;
  },0);
  const se=selfEval(), gr=dimGrowth();
  const rows=DIMS.map(d=>{
    const g=gr[d.k]||0, v=dimPoint(d.k);
    return `<div class="dim-row">
      <span class="dim-name">${d.name}</span>
      <span class="dim-track"><span class="dim-fill" style="width:${dimPct(d.k)}%"></span></span>
      <span class="dim-gain ${g?'':'zero'}">${g?'+'+g:'—'}</span>
    </div>`;
  }).join('');
  const recent = passedList.length
    ? passedList.slice(0,3).map(p=>`<div class="j-recent-item"><span>${p.title}</span><span class="j-badge pass">${p.best} 分</span></div>`).join('')
    : `<div class="me-empty">还没有通关的关卡。通关一关，相关维度就会长一点——<br>不是刷分，是把你练出来的东西记下来。</div>`;
  $('#me-scroll').innerHTML=`
    ${idCardHTML(me)}
    <div class="id-src" style="text-align:center">${me.source==='ai'?'AI 依据你的自述生成':'本地模板生成（未接 AI）'} · ${me.updatedAt||''}</div>

    <div class="me-sec">
      <div class="me-sec-head"><b>六边形战士</b><span class="muted">共长 ${totalGrowth()} 点</span></div>
      <div class="me-radar-wrap"><svg id="me-radar" viewBox="0 0 300 300" width="300" height="300"></svg></div>
      <div class="me-legend"><span><i style="background:#C9E0D6"></i>自评基线</span><span><i style="background:#0E6B50"></i>现在</span></div>
      <div class="dim-list">${rows}</div>
    </div>

    <div class="me-sec">
      <div class="me-sec-head"><b>已通关</b><span class="muted"><b style="color:var(--green-dark)">${passedList.length}</b> / ${total} 关</span></div>
      <div class="j-recent">${recent}</div>
    </div>

    <div class="me-sec">
      <button class="primary-btn" id="btn-me-train">去练一关 ›</button>
    </div>`;
  const cur={}; DIMS.forEach(d=>cur[d.k]=dimPoint(d.k));
  drawDimRadar($('#me-radar'), se, cur);
  const tr=$('#btn-me-train'); if(tr) tr.onclick=()=>openDomainPicker();
  const ms=$('#me-scroll'); if(ms) ms.scrollTop=0;
}

/* 六维雷达：浅色=自评基线，深绿=现在 */
function drawDimRadar(svg, baseObj, curObj){
  if(!svg) return;
  const NS='http://www.w3.org/2000/svg';
  const cx=150, cy=152, R=96, n=DIMS.length;
  svg.innerHTML='';
  const pt=(i,ratio)=>{ const a=-Math.PI/2+i*2*Math.PI/n; return [cx+R*ratio*Math.cos(a), cy+R*ratio*Math.sin(a)]; };
  for(let g=1;g<=3;g++){
    const poly=document.createElementNS(NS,'polygon');
    poly.setAttribute('points', DIMS.map((_,i)=>pt(i,g/3).join(',')).join(' '));
    poly.setAttribute('fill','none'); poly.setAttribute('stroke','#E6EAE7'); poly.setAttribute('stroke-width','1');
    svg.appendChild(poly);
  }
  DIMS.forEach((d,i)=>{
    const [x,y]=pt(i,1);
    const ln=document.createElementNS(NS,'line');
    ln.setAttribute('x1',cx); ln.setAttribute('y1',cy); ln.setAttribute('x2',x); ln.setAttribute('y2',y);
    ln.setAttribute('stroke','#E6EAE7'); svg.appendChild(ln);
    const a=-Math.PI/2+i*2*Math.PI/n;
    const tx=cx+(R+27)*Math.cos(a), ty=cy+(R+27)*Math.sin(a);
    const t=document.createElementNS(NS,'text');
    t.setAttribute('x',tx); t.setAttribute('y',ty); t.setAttribute('font-size','11');
    t.setAttribute('fill','#5B6B63'); t.setAttribute('text-anchor','middle'); t.setAttribute('dominant-baseline','middle');
    t.textContent=d.name; svg.appendChild(t);
  });
  const polyFor=(obj,fill,stroke,dash)=>{
    const pts=DIMS.map((d,i)=>{
      const v=Math.max(0,Math.min(DIM_MAX, obj[d.k]||0));
      return pt(i, v/DIM_MAX).join(',');
    }).join(' ');
    const p=document.createElementNS(NS,'polygon');
    p.setAttribute('points',pts); p.setAttribute('fill',fill);
    p.setAttribute('stroke',stroke); p.setAttribute('stroke-width','1.8');
    if(dash) p.setAttribute('stroke-dasharray','4 4');
    p.setAttribute('stroke-linejoin','round');
    svg.appendChild(p); return p;
  };
  polyFor(baseObj,'rgba(201,224,214,.35)','#C9E0D6',true);
  polyFor(curObj,'rgba(14,107,80,.18)','#0E6B50',false);
  DIMS.forEach((d,i)=>{
    const v=Math.max(0,Math.min(DIM_MAX, curObj[d.k]||0));
    const [x,y]=pt(i, v/DIM_MAX);
    const c=document.createElementNS(NS,'circle');
    c.setAttribute('cx',x); c.setAttribute('cy',y); c.setAttribute('r','3.2');
    c.setAttribute('fill','#0E6B50'); svg.appendChild(c);
  });
}

/* 通关加点：只有首次通关、且只加本关相关维度 */
function dimsOfScenario(sc){
  const ids=(sc&&sc.recommendedTechniques)||[];
  return [...new Set(ids.map(i=>TECH_DIM[i]).filter(Boolean))];
}
function awardDims(sc){
  const keys=dimsOfScenario(sc); if(!keys.length) return [];
  const g=dimGrowth();
  keys.forEach(k=>{ g[k]=(g[k]||0)+1; });
  StorageAdapter.set('dimgrowth', g);
  return keys;
}


/* ===== 5. 屏幕导航 ===== */
const $ = s => document.querySelector(s);
const screens = ['home','category','brief','chat','debrief','progress','settings','persona','me'];
function show(id){
  State._screen = id;
  screens.forEach(s => $('#screen-'+s).classList.toggle('hidden', s!==id));
  if(id==='progress') renderProgress();
  if(id==='home') renderHome();
  if(id==='me') renderMe();
  window.scrollTo(0,0);
}
function toast(msg){ const t=$('#toast'); t.textContent=msg; t.classList.remove('hidden'); clearTimeout(t._t); t._t=setTimeout(()=>t.classList.add('hidden'),1900); }

/* ===== 6. 首页：三入口 ===== */
async function renderHome(){
  const m = await KB.loadManifest();
  State.manifest = m;
  $('#home-count').textContent = (StorageAdapter.get('sessions',[])).length;
  const me=getMe();
  const chip=$('#me-chip-mono'); if(chip) chip.textContent = me? monoOf(me.name) : '我';
  const meBtn=$('#btn-me'); if(meBtn) meBtn.title = me? `${me.name} · 我的人设` : '建立我的人设';
  refreshAiMini();
  const wrap = $('#domain-list'); wrap.innerHTML='';
  const tagline = { A:'组织内部 · 向上、跨部门、守住自己', B:'对外业务 · 谈钱、谈价、谈合作', C:'个人生活 · 家人、医患、维权' };
  const preview = { A:'加薪 / 推项目 / 拒背锅', B:'压价 / 谈 offer / 催款', C:'家人 / 医患 / 维权' };
  Object.entries(m.domains).forEach(([code, dom])=>{
    const card = document.createElement('div');
    card.className='domain-card';
    card.innerHTML = `<div class="domain-row"><div class="dr-letter">${code}</div>
      <div class="dr-body"><div class="dr-name">${dom.name}</div>
      <div class="dr-tag">${tagline[code]} · ${preview[code]}</div></div>
      <div class="dr-arrow">›</div></div>`;
    card.onclick = ()=> openCategory(code);
    wrap.appendChild(card);
  });
  renderJourney();
}

/* 首页：闯关进度（已练/已通关的场景，有记录才显示） */
function renderJourney(){
  const box=$('#journey'); if(!box) return;
  const prog=StorageAdapter.get('progress',{});
  const entries=Object.values(prog);
  if(entries.length===0){ box.classList.add('hidden'); return; }
  box.classList.remove('hidden');
  const m=State.manifest||{};
  const itemsOf=code=>(m.domains&&m.domains[code]&&m.domains[code].items)||[];
  const total=['A','B','C'].reduce((n,c)=>n+itemsOf(c).length,0);
  const passed=entries.filter(e=>e.passed).length;
  $('#j-passed').textContent=passed;
  $('#j-total-text').textContent=` / ${total} 关`;
  const names={A:'组织内部',B:'对外业务',C:'个人生活'};
  const rings=$('#j-bars'); rings.innerHTML='';
  const CIRC=150.796;   // 2π×24
  ['A','B','C'].forEach(code=>{
    const items=itemsOf(code);
    const n=items.length||1;
    const dp=items.filter(it=>prog[it.id]&&prog[it.id].passed).length;
    const dt=items.filter(it=>prog[it.id]&&!prog[it.id].passed).length;
    const aTried=((dp+dt)/n*CIRC).toFixed(1);
    const aPass=(dp/n*CIRC).toFixed(1);
    const triedArc=(dp+dt)>0?`<circle class="j-arc j-arc-tried" cx="30" cy="30" r="24" stroke-dasharray="${aTried} ${CIRC.toFixed(1)}" transform="rotate(-90 30 30)"/>`:'';
    const passArc=dp>0?`<circle class="j-arc j-arc-pass" cx="30" cy="30" r="24" stroke-dasharray="${aPass} ${CIRC.toFixed(1)}" transform="rotate(-90 30 30)"/>`:'';
    const row=document.createElement('div'); row.className='j-ring';
    row.title=`${names[code]}：已通关 ${dp} 关，练过 ${dt} 关，共 ${n} 关`;
    row.innerHTML=`<svg viewBox="0 0 60 60" width="60" height="60" aria-hidden="true">
        <circle class="j-track" cx="30" cy="30" r="24"/>
        ${triedArc}${passArc}
        <text class="j-rnum" x="30" y="34.5" text-anchor="middle">${dp}/${n}</text>
      </svg>
      <span class="j-rname">${names[code]}</span>`;
    rings.appendChild(row);
  });
  const recent=entries.slice().sort((a,b)=>(b.date||'').localeCompare(a.date||'')).slice(0,3);
  $('#j-recent').innerHTML=recent.map(e=>`<div class="j-recent-item"><span>${e.title||'—'}</span><span class="j-badge ${e.passed?'pass':''}">${e.passed?'通关 '+e.best:'最高 '+e.best}</span></div>`).join('');
}

/* 三入口选择弹窗（第一次陪练从这里选场域） */
function openDomainPicker(){
  if(!requireProfile()) return;
  const m = State.manifest || {};
  const list = $('#picker-list'); list.innerHTML='';
  const tag = { A:'组织内部 · 向上、跨部门、守住自己', B:'对外业务 · 谈钱、谈价、谈合作', C:'个人生活 · 家人、医患、维权' };
  Object.entries(m.domains||{}).forEach(([code, dom])=>{
    const el=document.createElement('div'); el.className='picker-row';
    el.innerHTML=`<div class="pr-code">${code}</div><div class="pr-body"><div class="pr-name">${dom.name}</div><div class="pr-tag">${tag[code]||''}</div></div><div class="pr-arrow">›</div>`;
    el.onclick=()=>{ $('#picker-mask').classList.add('hidden'); openCategory(code); };
    list.appendChild(el);
  });
  $('#picker-mask').classList.remove('hidden');
}

/* ===== 7. 世界页 ===== */
async function openCategory(code){
  if(!requireProfile()) return;
  const w = await KB.loadWorld(code);
  const m = await KB.loadManifest();
  State.world = w; State.swapIndex = 0;
  State.items = (m.domains[code] && m.domains[code].items) || [];
  $('#cat-name').textContent = w.name;
  // 背景：公司 / 人员 / 核心关键（分段行）
  const bg = w.background || {};
  $('#world-banner').innerHTML = `<div class="wb-title">背景</div>
    <div class="wb-row"><span class="wb-k">公司</span><span class="wb-v">${bg.company||''}</span></div>
    <div class="wb-row"><span class="wb-k">人员</span><span class="wb-v">${bg.people||''}</span></div>
    <div class="wb-row"><span class="wb-k">核心</span><span class="wb-v">${bg.key||''}</span></div>`;
  // 组织结构图（含你）
  renderOrgChart(w);
  // 自定义主题：人设下拉
  const sel=$('#custom-persona'); sel.innerHTML='';
  w.personas.forEach(p=>{ const o=document.createElement('option'); o.value=p.id; o.textContent=`${p.name}（${p.role}）`; sel.appendChild(o); });
  $('#custom-sub').textContent = `按系统模板，填你真实要面对的难题（${w.name}）`;
  renderScenarioList();
  show('category');
}

/* 组织结构图：按 type 渲染层级 / 关系网，含「你」节点，点节点看人物卡 */
function renderOrgChart(w){
  const box=$('#org-chart'); box.innerHTML='';
  const tree=(w.structure&&w.structure.tree)||[];
  const byName={}; tree.forEach(n=>byName[n.name]=n);
  const orgNode=(n,hero)=>{
    const p=w.personas.find(x=>x.name===n.name);
    const el=document.createElement('div'); el.className='org-node'+(hero?' me':'');
    const face = p
      ? `<img src="${p.avatar}" alt="" onerror="this.style.visibility='hidden'">`
      : (hero ? `<div class="on-mono">你</div>` : `<div class="on-mono plain">${(n.name||'?').slice(0,1)}</div>`);
    el.innerHTML=`${face}<div class="on-name">${n.name}</div><div class="on-role">${n.role}</div>`;
    if(p) el.onclick=()=>openSheet(p);
    return el;
  };
  if(w.structure&&w.structure.type==='org'){
    const children={}; tree.forEach(n=>{ const p=n.reportsTo; if(p&&byName[p]){ (children[p]=children[p]||[]).push(n); } });
    const roots=tree.filter(n=>!n.reportsTo||!byName[n.reportsTo]);
    const seen=new Set(roots.map(r=>r.name));
    let tiers=[roots];
    while(true){ const last=tiers[tiers.length-1]; const next=[];
      last.forEach(n=>(children[n.name]||[]).forEach(c=>{ if(!seen.has(c.name)){ seen.add(c.name); next.push(c); } }));
      if(next.length===0) break; tiers.push(next); }
    tiers.forEach(tier=>{ const row=document.createElement('div'); row.className='org-tier';
      tier.forEach(n=>row.appendChild(orgNode(n, n.name==='你'))); box.appendChild(row); });
  } else {
    const me=tree.find(n=>n.name==='你');
    if(me) box.appendChild(orgNode(me,true));
    const grid=document.createElement('div'); grid.className='org-grid';
    tree.filter(n=>n.name!=='你').forEach(n=>grid.appendChild(orgNode(n,false)));
    box.appendChild(grid);
  }
}
function renderScenarioList(){
  const items=State.items||[];
  const start = State.swapIndex % Math.max(1,items.length);
  const slice = [items[start], items[(start+1)%items.length], items[(start+2)%items.length]].filter(Boolean);
  const prog=StorageAdapter.get('progress',{});
  const list=$('#scenario-list'); list.innerHTML='';
  slice.forEach(it=>{
    const card=document.createElement('div'); card.className='scenario-card';
    const pid = scenarioPersonaId(it.id);
    const av = pid ? personaAvatar(pid) : '';
    const pr = prog[it.id];
    const status = pr
      ? `<span class="sc-status ${pr.passed?'pass':''}">${pr.passed?'已通关 '+pr.best+' 分':'最高 '+pr.best+' 分 · 待通关'}</span>`
      : `<span class="sc-status">未挑战</span>`;
    card.innerHTML=`<div class="sc-level">第 ${parseInt(it.id.slice(1),10)} 关</div>
      <div class="sc-title">${it.title}</div>
      <div class="sc-face">${av?`<img src="${av}" alt="">`:''}<span>对手：${personaName(pid)||'—'}</span></div>
      ${status}
      <div class="sc-go">开始陪练 ›</div>`;
    card.onclick=()=>openScenario(it.id);
    list.appendChild(card);
  });
}
function scenarioPersonaId(id){ // 从已加载场景缓存或世界推断
  const sc = State._scCache && State._scCache[id];
  return sc ? sc.personaId : (State.world && State.world.personas[0] && State.world.personas[0].id);
}
function personaAvatar(pid){ const p=State.world && State.world.personas.find(x=>x.id===pid); return p?p.avatar:''; }
function personaName(pid){ const p=State.world && State.world.personas.find(x=>x.id===pid); return p?p.name:''; }

function swapScenarios(){ const n=(State.items||[]).length; State.swapIndex=(State.swapIndex+3)%Math.max(1,n); renderScenarioList(); }

/* 自定义主题 → 合成场景 */
async function openCustom(){
  const pid=$('#custom-persona').value;
  const topic=$('#custom-topic').value.trim();
  if(!topic){ toast('先填你要练的真实主题'); return; }
  const persona=State.world.personas.find(p=>p.id===pid);
  const synth={
    id:'CUSTOM', worldId:State.world.code, personaId:pid, title:'我的专属场景', domainName:State.world.name,
    briefing:`（你的真实难题）${topic}`,
    openingLine:`（${persona.name}）说吧，你找我是什么事？`,
    recommendedTechniques:['tactical-empathy','labeling','calibrated-question','no-oriented-question'],
    pitfalls:['别一上来就摊牌，先接住对方情绪','给对方留面子，尽量私下谈','留意对方含蓄的拒绝信号'],
    masteryTest:null
  };
  State.scenario=synth; State.world=State.world; State.persona=persona; State.mode='practice'; State.isMastery=false;
  openBrief();
}

/* 战前准备：真实困境参谋 */
function openPrep(){
  if(!requireProfile()) return;
  State.mode='prep'; State.messages=[]; State.used=new Set(); State.persona=null;
  // 舞台设为同盟者
  $('#stage-portrait').src='assets/avatars/coach.svg';
  $('#stage-name').textContent='同盟者';
  $('#stage-rel').textContent='你的谈判参谋';
  setMood('倾听中','');
  $('#chat-title').textContent='战前准备室';
  $('#dialogue').innerHTML='';
  pushMsg('coach','把你要面对的那场谈判说说吧——对方大概是谁、你想要什么、你最怕的是什么？把情况倒给我，我帮你理策略、话术和雷区。');
  // 左按钮变为「出策略」
  const hb=$('#btn-hint'); hb.textContent='出策略'; hb.onclick=prepStrategy;
  show('chat');
}
async function prepStrategy(){
  const meMsgs=State.messages.filter(m=>m.role==='me').map(m=>m.text);
  if(meMsgs.length===0){ toast('先说说你的真实情况'); return; }
  State.prepBrief = meMsgs.join('；');
  const w=State.world;
  const sys=`你是「谈伴」里的同盟者，专门帮中国用户做谈判的战前准备。用户刚描述了一场真实谈判。请用中文、温暖、不审判的口吻，输出一段结构化策略简报（纯文本，用换行分段，小标题用【】）：
【目标梳理】帮用户看清他真正想要什么、底线在哪。
【对手画像】根据描述推断对方可能的人设、权力距离、隐藏顾虑（黑天鹅）。
【可用技术】推荐 2-3 个 Chris Voss 技术，并给中国高语境下的改写说法。
【话术卡】给 1-2 句可以直接用的开场/关键话术。
【黑天鹅预警】提醒 1-2 个最容易踩的雷（面子/含蓄拒绝/关系）。
【演练建议】建议他怎么用谈伴先练一次。
场域背景：${w?w.name:''}。`;
  const hist=State.messages.filter(m=>m.role==='me'||m.role==='opp'||m.role==='coach').map(m=>({role:m.role==='me'?'user':'assistant',content:m.text}));
  let text=await callLLM(sys,hist);
  if(!text) text=localPrepStrategy(meMsgs.join('；'), w);
  pushMsg('coach','【同盟者 · 战前策略简报】\n'+text);
  const hb=$('#btn-hint'); hb.textContent='去演练 ›'; hb.onclick=startPrepPractice;
  toast('策略已生成，可点「去演练」');
}
function localPrepStrategy(text, w){
  return `【目标梳理】你想要的，先写一句话：__。再写底线：不到__就暂缓。
【对手画像】对方很可能是高权力距离+要面子的人，表面客气、真正顾虑未必说出口。
【可用技术】①战术同理心：先接住情绪再谈事；②校准问题："那咱们怎么弄你那边才好交差？"把球放回对方；③读含蓄 No："是不是还哪儿不踏实？"替他把拒绝说出来。
【话术卡】开场："我理解你这边也有难处，我是想找个咱俩都过得去的法子。"
【黑天鹅预警】别当众让他难堪；他说"再说吧"≈软拒绝，别当答应。
【演练建议】用谈伴先和「${w&&w.personas[0]?w.personas[0].name:'对手'}」练一轮，把话术说顺。`;
}
function startPrepPractice(){
  const persona=State.world.personas[0];
  const synth={
    id:'PREP', worldId:State.world.code, personaId:persona.id, title:'战前演练', domainName:State.world.name,
    briefing:`（你描述的真实情境）${State.prepBrief}`,
    openingLine:`（${persona.name}）嗯？你刚说的那事，具体想怎么着？`,
    recommendedTechniques:['tactical-empathy','labeling','calibrated-question','no-oriented-question','accusation-audit'],
    pitfalls:['别一上来就摊牌，先接住情绪','给对方留面子','识别含蓄的 No'],
    masteryTest:null
  };
  State.scenario=synth; State.persona=persona; State.mode='practice'; State.isMastery=false;
  openBrief();
}

/* ===== 8. 角色卡简报 ===== */
async function openScenario(id){
  if(!requireProfile()) return;
  const sc=await KB.loadScenario(id);
  State._scCache = State._scCache||{}; State._scCache[id]=sc;
  const w=await KB.loadWorld(sc.worldId);
  State.world=w; State.scenario=sc; State.mode='practice'; State.isMastery=false;
  State.persona=w.personas.find(p=>p.id===sc.personaId)||w.personas[0];
  await openBrief();
}
function levelLabel(sc){
  if(!sc) return '';
  if(sc.id==='CUSTOM') return '专属场景';
  if(sc.id==='PREP') return '战前演练';
  if(/-T$/.test(sc.id||'')) return '掌握度挑战';
  const m=/^([ABC])(\d{2})/.exec(sc.id||'');
  return m ? `第 ${parseInt(m[2],10)} 关` : '';
}
async function openBrief(){
  const sc=State.scenario, p=State.persona;
  const pdLabel = p.powerDistance==='high'?'高（你是下级）':p.powerDistance==='mid'?'中（平级/守门）':'低（平级/亲近）';
  const pdCls = p.powerDistance==='mid'?'mid':'';
  const hg = (p.hiddenGoals||[]).map(h=>`<li>${h}</li>`).join('');
  const pit = (sc.pitfalls||[]).map(x=>`<li>${x}</li>`).join('');
  // 本场知识卡：与场景直接相关的技术卡（先读后练）
  const techs=[];
  for(const id of (sc.recommendedTechniques||[])){ try{ techs.push(await KB.loadTechnique(id)); }catch(e){} }
  const kbHTML = techs.map((t,i)=>`
    <div class="kn-card">
      <button type="button" class="kn-head" data-kn="${i}">
        <span class="kn-num">${i+1}</span>
        <span class="kn-name">${t.name}</span>
        <span class="kn-tag">中国修订</span>
        <span class="kn-caret">›</span>
      </button>
      <div class="kn-body hidden">
        <div class="kn-row"><b>原版</b>：${t.original.how}</div>
        <div class="kn-cn"><b>中国修订</b>：${t.chinaRevision.how}</div>
        <div class="kn-eg">例：${t.chinaRevision.example}</div>
      </div>
    </div>`).join('');
  // 背景：这个任务里「你知道的信息」，没这些就没法开口
  const bg=(State.world&&State.world.background)||{};
  const known=(sc.knownInfo||[]).map(x=>`<li>${x}</li>`).join('');
  const bgHTML = (bg.company||bg.people||known) ? `
    <div class="block">
      <div class="block-label">▣ 背景 · 你手上已知的信息</div>
      ${bg.company?`<p class="bg-line">${bg.company}</p>`:''}
      ${bg.people?`<p class="bg-line">${bg.people}</p>`:''}
      ${known?`<ul class="hg-list bg-list">${known}</ul>`:''}
      ${bg.key?`<p class="bg-key">这里的门道：${bg.key}</p>`:''}
    </div>` : '';
  $('#brief-scroll').innerHTML = `
    <div class="brief-level">${levelLabel(sc)}${sc.domainName?' · '+sc.domainName:''} · 通关线 ${PASS_SCORE} 分</div>
    <div class="char-card">
      <div class="char-head">
        <img src="${p.avatar}" alt="${p.name}" onerror="this.style.background='#E7F1EC'">
        <div>
          <div class="char-name">${p.name}</div>
          <div class="char-meta">${p.age}岁 · ${p.role}</div>
          <div class="char-meta">与你的关系：${p.relation}</div>
          <span class="char-pd ${pdCls}">权力距离 ${pdLabel}</span>
        </div>
      </div>
      <div class="persona-text">${p.personality}</div>
    </div>
    <div class="block">
      <div class="block-label">▦ 情境</div>
      <div class="situation">${sc.briefing}</div>
    </div>
    ${bgHTML}
    <div class="block">
      <div class="block-label">◈ 他的隐藏目标（黑天鹅）</div>
      <ul class="hg-list">${hg}</ul>
    </div>
    <div class="block">
      <div class="block-label">⚠ 常见坑（中国修订）</div>
      <ul class="pit-list">${pit}</ul>
    </div>
    <div class="block">
      <div class="block-label">▤ 战前知识卡 · 本场会用到</div>
      <p class="kb-intro">只列标题，点开看原版怎么做、中国场景怎么改。看完可以再收起来。</p>
      <div class="kb-cards">${kbHTML||'<div class="kb-intro">本场暂无推荐的招，靠你自己接。</div>'}</div>
    </div>
    <div class="block">
      <div class="block-label">✎ 你的目标（战前准备）</div>
      <textarea id="brief-goal" class="goal-input" rows="2" placeholder="我想争取什么？我的底线是什么？"></textarea>
    </div>`;
  $('#brief-goal').value = State.goal||'';
  // 知识卡折叠：默认只显示标题
  $('#brief-scroll').querySelectorAll('.kn-head').forEach(btn=>{
    btn.onclick=()=>{
      const card=btn.closest('.kn-card'); if(!card) return;
      const body=card.querySelector('.kn-body'); if(!body) return;
      const willOpen=body.classList.contains('hidden');
      body.classList.toggle('hidden', !willOpen);
      card.classList.toggle('open', willOpen);
    };
  });
  // 左按钮恢复为提示卡（防止从战前准备进入）
  const hb=$('#btn-hint'); hb.textContent='提示卡'; hb.onclick=toggleHint;
  show('brief');
}

/* ===== 9. 对话：AVG 舞台 ===== */
function enterChat(){
  State.goal=$('#brief-goal') ? ($('#brief-goal').value||'').trim() : '';
  State.messages=[]; State.used=new Set(); State.lastScore=null;
  State.turn=0; State._hgShown=[]; State.techCache=null;
  setHintOpen(false);
  $('#chat-title').textContent = State.scenario.title;
  const scroll=$('#dialogue'); scroll.innerHTML='';
  if(State.mode==='prep'){ /* 不应到这里 */ return; }
  // 对手舞台
  $('#stage-portrait').src = State.persona.avatar;
  $('#stage-name').textContent = State.persona.name;
  $('#stage-rel').textContent = State.persona.relation;
  setMood('防御中','warn');
  pushMsg('opp', State.scenario.openingLine);
  pushMsg('coach','（同盟者）我在这儿。先别急着说服他，听他说完，再用一招接住。需要时点「提示卡」。');
  const cfg=StorageAdapter.get('settings',null);
  AI_STATE.noticed=false;
  if(!cfg||!cfg.key||!cfg.endpoint){
    aiChip('bad','本地模式 · 没填 AI Key（点这里去填）');
  } else {
    aiChip('ok','AI 已连接 · '+(cfg.model||'deepseek-chat'));
  }
  $('#btn-hint').textContent='提示卡'; $('#btn-hint').onclick=toggleHint;
  show('chat');
  setTimeout(()=>$('#chat-input').focus(),300);
}
function setMood(text, cls){ const el=$('#stage-mood'); el.textContent=text; el.className='stage-mood'+(cls?(' '+cls):''); }
function pushMsg(role, text){
  const m={role,text}; State.messages.push(m);
  const scroll=$('#dialogue'); const el=document.createElement('div');
  if(role==='opp'){
    el.className='msg opp';
    const av=State.persona?State.persona.avatar:'assets/avatars/coach.svg';
    el.innerHTML=`<img class="mini-av" src="${av}" alt=""><div class="bubble"></div>`;
    el.querySelector('.bubble').textContent=text;
  } else if(role==='me'){
    el.className='msg me'; el.innerHTML=`<div class="bubble"></div>`; el.querySelector('.bubble').textContent=text;
  } else if(role==='coach'){
    el.className='msg coach';
    el.innerHTML=`<img class="mini-av" src="assets/avatars/coach.svg" alt="盟"><div class="bubble"></div>`;
    el.querySelector('.bubble').textContent=text;
  } else {
    el.className='msg sys'; el.innerHTML=`<div class="bubble"></div>`; el.querySelector('.bubble').textContent=text;
  }
  scroll.appendChild(el); scroll.scrollTop=scroll.scrollHeight; return el;
}
async function sendMessage(){
  const input=$('#chat-input'); const text=input.value.trim(); if(!text) return;
  input.value=''; pushMsg('me',text);
  if(State.mode==='prep'){ return; } // 战前准备由「出策略」驱动
  const reply=await opponentReply(text); pushMsg('opp',reply);
  setMood(State.used.size>0?'松动了 ✓':(State.messages.filter(m=>m.role==='opp').length>2?'在过招':'防御中'), State.used.size>0?'soft':'warn');
  await coachReview(text, reply);
}
/* 逐句同盟者教练：评价 + 反馈 + 推荐最优回复（有 Key 走 AI，无 Key 本地模板） */
async function coachReview(userText, oppReply){
  await ensureTechs();
  const cfg=StorageAdapter.get('settings',null);
  let data=null;
  if(cfg&&cfg.key&&cfg.endpoint){ try{ data=await llmCoach(userText,oppReply); }catch(e){} }
  if(!data) data=localCoach(userText,oppReply);
  data.score = clampScore(data.score) || turnScoreOf(userText);
  pushCoachReview(data);
}
/* 1-5 分：和引流版同一套尺子，5 最好 */
function clampScore(v){
  const n=Math.round(Number(v));
  return (isFinite(n)&&n>=1&&n<=5)?n:0;
}
function turnScoreOf(t){
  const s=turnScore(t||'', flagsOf(t||''));
  return s;
}
function flagsOf(t){
  return {
    empathy:/理解|辛苦|难处|不容易|委屈|体谅|我知道|我明白|我懂|我领|你说得对|换我也|感同身受|看得出来/.test(t),
    label:/你(是不是|好像|感觉|担心|怕|其实)|听起来|看来|我猜/.test(t),
    question:/怎么|如何|哪儿|哪里|什么办法|你看|能不能|可不可以|行不行|要不要|是不是/.test(t)||/？|\?/.test(t),
    concede:/行吧|可以|没问题|听你的|按你说的|我退|我让|我同意|那就这样/.test(t),
    push:/必须|一定|否则|不行|要你|马上|没得谈|必须得/.test(t),
    plan:/下一步|咱们|我们(先|可以)|先.{0,6}再|分两步|这样安排/.test(t)
  };
}
function turnScore(t, f){
  const n=String(t).replace(/\s/g,'').length;
  let s;
  if(f.concede) s=1;
  else if(f.push) s=2;
  else if(f.empathy && f.question) s=5;
  else if(f.empathy || f.label) s=4;
  else s=3;
  if(n<8) s=Math.min(s,2);
  if(n>150) s=Math.max(1,s-1);
  return Math.max(1,Math.min(5,s));
}
async function ensureTechs(){
  if(State.techCache) return;
  State.techCache={};
  const recs=State.scenario.recommendedTechniques||[];
  for(const id of recs){ try{ State.techCache[id]=await KB.loadTechnique(id); }catch(e){} }
}
async function llmCoach(userText,oppReply){
  const sc=State.scenario,p=State.persona;
  const techs=State.techCache||{};
  const techLines=(State.scenario.recommendedTechniques||[]).map(id=>{ const t=techs[id]; return t?`· ${t.name}：${t.chinaRevision.how}（例：${t.chinaRevision.example}）`:''; }).filter(Boolean).join('\n');
  const pdLabel=p.powerDistance==='high'?'高（你是下级，对方要面子）':p.powerDistance==='mid'?'中（平级/守门）':'低（亲近对等）';
  const sys=`你是「谈伴」里的同盟者，是用户的谈判教练（不是对手）。用户正在与对手「${p.name}」谈判。
场景：${sc.briefing}
对手：${p.name}｜${p.personality}｜权力距离${pdLabel}｜隐藏目标（黑天鹅）：${(p.hiddenGoals||[]).join('；')}
用户目标：${State.goal||'（未填）'}
可用技术（中国修订）及示例：\n${techLines}
刚刚用户说：「${userText}」
对手回应：「${oppReply}」
请严格只输出一段 JSON（不要多余文字、不要代码围栏）：
{"score":1到5的整数,"eval":"一句话评价用户这句的质量（稳/冒进/让步过多/没接住情绪/有亮点等）","feedback":"结合具体一两句，指出亮点或可改进点","recommend":"用户下一轮可直接说的一句自然话术，要体现某招中国修订、能直接用"}
score 按这五档判：5=先接住情绪、再把标准或决定权问回去，且没交出任何实质；4=情绪接住了，但停在情绪、没往前推；3=没接人，只在解释自己、讲道理；2=硬顶、比较、或者空转没信息；1=当场让步、把筹码交出去了。
口吻温暖、不审判。不要使用表情符号。`;
  const text=await callLLM(sys,[{role:'user',content:userText}]);
  if(!text) return null;
  try{ const j=JSON.parse(text.replace(/```json|```/g,'').trim()); if(j&&j.eval) return j; }catch(e){}
  return null;
}
function localCoach(userText,oppReply){
  const t=userText||'';
  const techs=State.techCache||{};
  const recs=State.scenario.recommendedTechniques||[];
  const turn=State.turn||1;
  const f=flagsOf(t);
  let ev;
  if(f.empathy&&f.question) ev='稳。先接住他的情绪，再把问题递回给他，这是这套组合里最有用的。';
  else if(f.empathy&&!f.plan) ev='情绪接住了，但你还没给他一个能落地的台阶。';
  else if(f.concede) ev='这一让给快了，他很可能再压一层。';
  else if(f.push) ev='偏硬。他的顾虑还没被说出来，你就上压力，容易顶起来。';
  else if(f.label) ev='标注用得对——把他说不出口的那点感受替他说了。';
  else if(f.question) ev='问得对，但他还没觉得你懂他。';
  else if(f.plan) ev='开始谈方案了，但顺序反了：先问他的难处，再给方案。';
  else ev='话说得客气，但缺一个让他必须回应你的钩子。';

  const pd=State.persona.powerDistance;
  const base=pd==='high'?'他是你的上级，权力距离高：当着人提、或者拿外部条件压他，他会先保面子。'
    :pd==='mid'?'平级/守门的人：他要的是"这事我好不好交代"，不是道理。'
    :'亲近对等的关系：争赢了也没用，关系才是成本。';
  const tips=[
    '下一句试着把"我理解"换成具体的一件事，别停在抽象共情。',
    '少解释你的难处，多问一句他那边怎么才过得去。',
    '把你要的结果拆成两步，先要一个小的点头。',
    '如果他说"再说吧""再看看"，别当答应，直接把拒绝替他说出来。',
    '别一次把底牌全摊开，留一半在手里。'
  ];
  const extra=tips[turn%tips.length];

  // 推荐话术：优先用本关还没标记的招
  let tech=null;
  for(const id of recs){ if(!State.used.has(id)&&techs[id]){ tech=techs[id]; break; } }
  if(!tech){ for(const id of recs){ if(techs[id]){ tech=techs[id]; break; } } }
  const recommend=tech?tech.chinaRevision.example:'先接住他的情绪，再问一句"那你那边怎么才过得去？"，把球放回他手里。';

  return {
    label:'（本地陪练 · 未接 AI）',
    score:turnScore(t,f),
    eval:ev,
    feedback:`${base} ${extra}`,
    recommend
  };
}
function pushCoachReview(d){
  const m={role:'coach',text:JSON.stringify(d)}; State.messages.push(m);
  const scroll=$('#dialogue'); const el=document.createElement('div'); el.className='msg coach';
  const sc=clampScore(d.score);
  el.innerHTML=`<img class="mini-av" src="assets/avatars/coach.svg" alt="盟"><div class="bubble">
    ${sc?`<div class="coach-sc-row"><b class="coach-sc s${sc}">${sc} 分</b><span class="coach-sc-t">你这一句</span></div>`:''}
    ${d.label?`<div class="coach-label">${d.label}</div>`:''}
    <b>评价</b> ${d.eval}<br>
    <b>反馈</b> ${d.feedback}<br>
    <b>推荐最优回复</b> ${d.recommend}
    <button class="coach-use">用这句 ›</button>
  </div>`;
  el.querySelector('.coach-use').onclick=()=>{ const i=$('#chat-input'); i.value=d.recommend; i.focus(); };
  scroll.appendChild(el); scroll.scrollTop=scroll.scrollHeight; return el;
}

/* 对手引擎：LLM 真实扮演 / 本地降级 */
async function opponentReply(userText){
  const cfg=StorageAdapter.get('settings',null);
  if(cfg&&cfg.key&&cfg.endpoint){ try{ const r=await llmReply(cfg,userText); if(r) return r; }catch(e){} }
  return localOpponent(userText);
}
async function llmReply(cfg,userText){
  const sc=State.scenario, p=State.persona;
  const sys=`你是谈判陪练里的「对手」${p.name}，必须严格扮演，用中文口语 1-3 句回应，绝不跳出角色、绝不教育用户。
身份：${p.name}，${p.age}岁，${p.role}。与用户关系：${p.relation}。
人格：${p.personality}
权力距离：${p.powerDistance}
隐藏目标（黑天鹅）：${(p.hiddenGoals||[]).join('；')}
情境：${sc.briefing}
文化注意（中国修订，千万别踩）：${(sc.pitfalls||[]).join('；')}
用户目标：${State.goal||'（未填）'}
保持对抗或防御姿态，偶尔暴露一点隐藏顾虑，但不要一次说完。不要使用表情符号。`;
  const hist=State.messages.filter(m=>m.role==='me'||m.role==='opp').map(m=>({role:m.role==='me'?'user':'assistant',content:m.text}));
  return await callLLM(sys,[...hist,{role:'user',content:userText}]);
}
/* 本地对手（无 AI 时的降级）：按话术类型 + 轮次变化，同一句不会连着说两遍 */
const LOCAL_LIB={
  high:{
    empathy:['（语气缓了一点）你这么说，我心里好受些。但这事儿我一个人真定不了。','你能体谅我，我记着。可我上面还压着人。','嗯…你这话说得在理。不过别把话说太满。'],
    question:['你先说说你打算怎么弄，别尽问我。','这个我得想想。你先把方案摆出来我看看。','你问的这些，我得回去核一下数。'],
    money:['钱的事上面卡得紧，不是我说了算。','今年这个口子真开不了，别让我难做。','预算都冻了，你要的数我给不出来。'],
    request:['这事儿我得先合计合计，不急。','你先回去把材料准备齐，咱们再聊。','原则上我支持，但流程上得走。'],
    concession:['你退一步，我也不是不讲理的人。','行，我记你这个人情。','那就先这样，别到处说。'],
    push:['你这么压我，我反而不太好办了。','你急，我比你还急。别逼我现在表态。','这话我不能接。'],
    def:['这事儿我得先合计合计，不急。','你这么提，我也挺为难的。','上面卡得紧，不是我说了算。'],
    soft:['说句实在话，我也想帮你把这事办成。','我这边不是不松口，是得有个说得过去的由头。']
  },
  mid:{
    empathy:['（沉默两秒）行，你能这么说，我听着舒服点。','你懂就好。但事儿还是得有个说法。','别光说理解，你先给个准话。'],
    question:['你问得挺细。你心里那个数是多少？','别绕着问，你把条件摆出来。','这我得算算，你先说你的底线。'],
    money:['别家也在谈，我得比比。','价格这块我不能只听你说。','这个数不好看，你再想想。'],
    request:['你得给我个说得过去的理由。','这事儿没那么简单，你懂的。','先别急，你把前因后果说清楚。'],
    concession:['你让到这儿，我也让一步。','这样吧，各退一半。','行，但你得答应我一件事。'],
    push:['你越硬，我越不好点头。','这么谈就没意思了。','别拿这个压我。'],
    def:['说实话，这不太好看。','你得给我个说得过去的理由。','这事儿没那么简单，你懂的。'],
    soft:['我也不是不能商量，但你得让我好交代。','咱俩别互相为难，找个都能过的法子。']
  },
  low:{
    empathy:['你这么说，我这气就消一半了。','（叹气）我也就是心里堵。','你懂就好，我也不想吵。'],
    question:['你问我？我还想问你呢。','那你说怎么办。','你心里是不是已经定了？'],
    money:['钱好说，但你得也体谅我。','我也不是非要这个数。','这钱我确实紧。'],
    request:['行吧，但你得也体谅我。','你张口就是这事儿，我也难。','先别定，让我缓缓。'],
    concession:['你都退了我还犟啥。','行，就这么办。','各退一步吧。'],
    push:['你这话我就不爱听了。','你别这么跟我说话。','我早就不爽了，今天正好说开。'],
    def:['行吧行吧，但你得也体谅我。','你这话我就不爱听了。','大家各退一步，别闹。'],
    soft:['我其实就想听你一句软话。','你上点心，我不是要跟你算账。']
  }
};
function localCat(t){
  if(/理解|辛苦|难处|不容易|委屈|体谅|我懂|换我也|感同身受/.test(t)) return 'empathy';
  if(/怎么|如何|哪儿|哪里|什么办法|你看呢|能不能|可不可以|行不行/.test(t)) return 'question';
  if(/钱|价|预算|加薪|薪|费用|折扣|分成|账期|尾款|借|多少/.test(t)) return 'money';
  if(/必须|一定|否则|不行|不能|要求|马上|底线是|没得谈/.test(t)) return 'push';
  if(/行吧|可以|没问题|听你的|按你说的|我退|我让|我同意|那就这样/.test(t)) return 'concession';
  if(/希望|想请你|麻烦你|帮我|能不能给|申请/.test(t)) return 'request';
  return 'def';
}
function localOpponent(userText){
  State.turn=(State.turn||0)+1;
  const pd=(State.persona&&State.persona.powerDistance)||'mid';
  const bank=LOCAL_LIB[pd]||LOCAL_LIB.mid;
  const t=userText||'';
  const cat=localCat(t);
  let list=(bank[cat]||bank.def).slice();
  if(State.turn>=3 && (cat==='empathy'||cat==='concession')) list=list.concat(bank.soft||[]);
  const lastOpp=[...State.messages].reverse().find(m=>m.role==='opp');
  const banned=[lastOpp?lastOpp.text:'', (State.scenario&&State.scenario.openingLine)||''];
  let pool=list.filter(x=>banned.indexOf(x)<0);
  if(!pool.length) pool=(bank.def||[]).filter(x=>banned.indexOf(x)<0);
  if(!pool.length) pool=bank.def||['……'];
  let out=pool[(State.turn + t.length) % pool.length];
  // 第 4 轮起，偶尔漏一点隐藏目标（黑天鹅），推进剧情
  const g=(State.persona&&State.persona.hiddenGoals)||[];
  if(g.length && State.turn>=4 && State.turn%3===1){
    State._hgShown=State._hgShown||[];
    const left=g.filter(x=>State._hgShown.indexOf(x)<0);
    if(left.length){ const pick=left[0]; State._hgShown.push(pick); out=`（压低声音）跟你说句实话，${pick}。`; }
  }
  return out;
}

/* 提示卡抽屉：可展开/收起，单条标记原地更新 */
function setHintOpen(open){
  const d=$('#hint-drawer'); if(!d) return;
  if(open){ d.classList.remove('hidden'); d.style.display='block'; }
  else { d.classList.add('hidden'); d.style.display='none'; }
  const b=$('#btn-hint');
  if(b && (b.textContent==='提示卡' || b.textContent==='收起')) b.textContent=open?'收起':'提示卡';
}
async function toggleHint(){
  const drawer=$('#hint-drawer'); if(!drawer) return;
  const isOpen = !drawer.classList.contains('hidden') && drawer.style.display!=='none';
  if(isOpen){ setHintOpen(false); return; }
  await renderHints();
  setHintOpen(true);
}
async function renderHints(){
  const drawer=$('#hint-drawer');
  const recs=State.scenario.recommendedTechniques||[];
  drawer.innerHTML='<div class="hint-head"><h4>推荐技术 · 中国修订</h4><button type="button" class="hint-close" id="hint-close">收起 ▾</button></div>';
  for(const id of recs){
    const t=await KB.loadTechnique(id); const used=State.used.has(id);
    const item=document.createElement('div'); item.className='hint-item';
    item.innerHTML=`<div class="hi-name">${t.name}</div>
      <div class="hi-do">原版：${t.original.how}</div>
      <div class="hi-cn">中国修订：${t.chinaRevision.how}　例：${t.chinaRevision.example}</div>
      <button type="button" class="hi-btn ${used?'used':''}">${used?'已用 ✓':'用了这招'}</button>`;
    item.querySelector('button').onclick=()=>{
      const tid=id; if(State.used.has(tid)) State.used.delete(tid); else State.used.add(tid);
      renderHints();
    };
    drawer.appendChild(item);
  }
  const close=$('#hint-close'); if(close) close.onclick=(e)=>{ e.preventDefault(); setHintOpen(false); };
}

/* ===== 10. 复盘：强反馈 + 闯关评分 ===== */
const PASS_SCORE=90;
async function endChat(){
  if(State.mode==='prep'){ toast('战前准备已存，去演练或返回'); return; }
  await buildDebrief();
}
async function buildDebrief(){
  const used=[...State.used];
  toast('正在评分并生成复盘…');
  State.lastScore=await computeScore();
  recordAttempt(State.lastScore);
  State.pendingDims = State.firstPass ? dimsOfScenario(State.scenario) : [];
  let report=await llmDebrief();
  if(!report) report=localDebrief(used);
  try{ renderDebrief(report, used); }
  catch(e){ console.error('debrief render err', e); renderDebrief(localDebrief(used), used); }
  show('debrief');
}
/* 评分：有 Key 走 AI（严格但公平），无 Key 走可解释本地评分 */
async function computeScore(){
  const cfg=StorageAdapter.get('settings',null);
  if(cfg&&cfg.key&&cfg.endpoint){
    try{ const s=await llmScore(); if(s) return s; }catch(e){}
  }
  return localScore();
}
async function llmScore(){
  const sc=State.scenario, p=State.persona;
  const sys=`你是「谈伴」的谈判教练。基于场景、用户目标、对话记录与用户动用的技术，给这次陪练表现打分（0-100 整数）。
评分维度：是否推进到具体下一步；是否接住对方情绪；是否用了校准问题/标注；是否给对方留面子；是否清晰表达诉求。
严格但公平：90 分 = 已具备上真实战场的水平；60 分以下 = 基本没接住。
只输出一段 JSON（不要多余文字、不要代码围栏）：
{"score":88,"reasons":["一句话说明扣分/加分点，2-3 条"]}
场景：${sc.title}｜对手：${p.name}（${p.personality}）｜用户目标：${State.goal||'未填'}｜用户动用技术：${usedList()}`;
  const hist=State.messages.filter(m=>m.role==='me'||m.role==='opp').slice(-16).map(m=>({role:m.role==='me'?'user':'assistant',content:m.text}));
  const text=await callLLM(sys,hist); if(!text) return null;
  try{
    const j=JSON.parse(text.replace(/```json|```/g,'').trim());
    if(j && typeof j.score==='number'){
      return { score:Math.max(0,Math.min(100,Math.round(j.score))), source:'ai', reasons:Array.isArray(j.reasons)?j.reasons.slice(0,3):[] };
    }
  }catch(e){}
  return null;
}
function localScore(){
  const sc=State.scenario, recs=sc.recommendedTechniques||[];
  const usedCount=recs.filter(id=>State.used.has(id)).length;
  const coverage=recs.length?usedCount/recs.length:0;
  const mine=State.messages.filter(m=>m.role==='me').map(m=>m.text).join(' ');
  const turns=State.messages.filter(m=>m.role==='me').length;
  const reasons=[];
  let score=50;
  score+=Math.round(coverage*32);
  reasons.push(`本场 ${recs.length} 招，你标记用了 ${usedCount} 招`);
  if(turns>=4){ score+=6; reasons.push('对话轮次充分，敢接话'); }
  else reasons.push('对话轮次偏少，还没真正摸到对方底线');
  if(/怎么|如何|怎样|该怎么办|你觉得|咱们|咱俩/.test(mine)){ score+=6; reasons.push('用了把球抛回去的问法'); }
  else reasons.push('少用校准问题，容易变成单方面说服');
  if(/听起来|看起来|感觉你|你是不是|我理解|我明白|压力|为难/.test(mine)){ score+=6; reasons.push('有接住对方情绪的动作'); }
  else reasons.push('情绪没被接住，对方容易继续防着');
  score=Math.max(0,Math.min(100,Math.round(score)));
  return { score, source:'local', reasons };
}
/* 记录闯关进度（含未通过的尝试，供首页"经历过的场景"展示） */
function recordAttempt(scoreData){
  const sc=State.scenario; if(!sc) return;
  if(sc.id==='CUSTOM'||sc.id==='PREP'||/-T$/.test(sc.id)){ State.firstPass=false; return; } // 专属/战前/掌握度挑战不计入 24 关
  const prog=StorageAdapter.get('progress',{});
  const prev=prog[sc.id]||{ best:0, tries:0, passed:false };
  const nowPassed=!!prev.passed || scoreData.score>=PASS_SCORE;
  State.firstPass = !prev.passed && scoreData.score>=PASS_SCORE;
  prog[sc.id]={
    id:sc.id, title:sc.title, domain:sc.domainName||'',
    best:Math.max(prev.best||0, scoreData.score),
    tries:(prev.tries||0)+1,
    passed:nowPassed,
    date:new Date().toISOString().slice(0,10)
  };
  StorageAdapter.set('progress',prog);
}
/* 未达标：重练这一关 */
function retryScenario(){
  State.messages=[]; State.used=new Set(); State.lastScore=null;
  enterChat();
  toast(`重练本关 · 目标 ${PASS_SCORE} 分`);
}
async function llmDebrief(){
  const cfg=StorageAdapter.get('settings',null);
  if(!cfg||!cfg.key||!cfg.endpoint) return null;
  const sc=State.scenario, p=State.persona;
  const sys=`你是「谈伴」里的同盟者，给用户做谈判陪练后的复盘。基于下面的场景、用户目标、用户动用的技术、以及对话记录，用中文、温暖、不审判的口吻，严格只输出一段 JSON（不要多余文字）：
{"strengths":["做得好的 2-3 点，具体、结合对话"],"weaknesses":["可改进的 2-3 点，具体"],"reinforce":["该强化的学习点 1-2 点，附中国语境下的改写"],"nextActions":["下一步可立刻做的具体行动 2-3 条"],"newTest":"一个可以立刻做的新测试/微练习（一句话）"}
场景：${sc.title}｜对手：${p.name}（${p.personality}）｜用户目标：${State.goal||'未填'}｜用户动用技术：${usedList()}`;
  const hist=State.messages.filter(m=>m.role==='me'||m.role==='opp').slice(-14).map(m=>({role:m.role==='me'?'user':'assistant',content:m.text}));
  const text=await callLLM(sys,hist); if(!text) return null;
  try{
    const json=JSON.parse(text.replace(/```json|```/g,'').trim());
    if(json&&json.strengths) return json;
  }catch(e){}
  return null;
}
function usedList(){ return [...State.used].map(id=>TECH_LABEL[id]||id).join('、')||'（这次没标记用招）'; }
function localDebrief(usedArr){
  const sc=State.scenario, p=State.persona;
  const used=new Set(usedArr||[]);              // 传进来的是数组，这里包成 Set，避免 used.has 报错
  const usedNames=[...used].map(id=>TECH_LABEL[id]||id);
  const strengths = usedNames.length
    ? [`你动用了【${usedNames.join('、')}】，在高压下还想着用方法，已经比"硬刚/硬忍"强太多。`,`你愿意开口练这场，本身就在积累真实手感——谈判是表演技能，练了才会变成反射。`]
    : [`你愿意开口练这场，本身就很珍贵——很多人连练都不敢。`,`你撑完了整段对话，没有逃。下一步试试"接住情绪再谈事"。`];
  const recs=sc.recommendedTechniques||[];
  const missed=recs.filter(id=>!used.has(id)).map(id=>TECH_LABEL[id]||id);
  const weaknesses = missed.length
    ? [`有几招这次没用上：${missed.join('、')}。下次可以在对方抛难题时，先用一句校准问题把球放回他手里。`,`注意别踩这个场的坑：${(sc.pitfalls||[])[0]||'给对方留面子，私下谈。'}`,`高语境下，对方说"再说吧"常常就是软拒绝，别当成答应。`,]
    : [`这场的招你基本都试了，很棒。下回可以更早用"标注"替对方说出没说出口的顾虑，让他松防。`];
  const reinforce = missed.length
    ? [`强化【${missed[0]}】：在中国，用"咱们怎么弄你那边才好交差？"比直接要更有效，把对抗变成一起解题。`,`强化【读含蓄 No】：对方犹豫时，主动替他说"是不是还哪儿不踏实"，他反而松。`,]
    : [`强化【面子工程】：公开给足对方面子，私下再谈分歧，事才能成。`,`强化【黑天鹅】：真意在潜台词，多问"背后是不是还有别的考量"。`,];
  const nextActions=[`下次真谈前，花 1 分钟写下一句开场白（接住情绪+一个校准问题）。`,`把这场记住的 1 招，设成明天真实场景的微承诺。`,`来谈伴再练一次相似案例，直到不假思索。`];
  const newTest = sc.masteryTest ? `挑战相似案例「${sc.masteryTest.title}」：${sc.masteryTest.twist}` : '用同样的人设，换个由头再练一次。';
  return {strengths,weaknesses,reinforce,nextActions,newTest};
}
function renderDebrief(r, used){
  const usedNames=[...State.used].map(id=>TECH_LABEL[id]||id);
  $('#debrief-scroll').innerHTML='';
  const hero=document.createElement('div'); hero.className='debrief-hero';
  hero.innerHTML=`<h2>同盟者复盘 · ${State.scenario.title}</h2><p>这次你动了 ${usedNames.length?usedNames.length+' 招（'+usedNames.join('、')+'）':'0 招，没关系，下次试一招就好'}。下面不审判，只帮你看见下一步。</p>`;
  $('#debrief-scroll').appendChild(hero);
  // 闯关评分
  const sd=State.lastScore||{score:0,source:'local',reasons:[]};
  const passed=sd.score>=PASS_SCORE;
  const sh=document.createElement('div');
  sh.className='score-hero '+(passed?'pass':'fail');
  sh.innerHTML=`<div class="score-num">${sd.score}<span>/ 100</span></div>
    <div class="score-label">${passed?'通关 ✓ 已达实战标准':'未达标 · 还差 '+(PASS_SCORE-sd.score)+' 分'}</div>
    <div class="score-track"><div class="score-fill" style="width:${sd.score}%"></div><div class="score-mark" style="left:${PASS_SCORE}%"></div></div>
    ${sd.reasons&&sd.reasons.length?`<ul class="score-reasons">${sd.reasons.map(x=>`<li>${x}</li>`).join('')}</ul>`:''}
    <div class="score-src">${sd.source==='ai'?'AI 评分':'本地评分'} · 通关线 ${PASS_SCORE} 分</div>`;
  $('#debrief-scroll').appendChild(sh);
  const mk=(cls,label,items)=>{
    const c=document.createElement('div'); c.className='report-card';
    c.innerHTML=`<div class="rc-label ${cls}">${label}</div>`+items.map(i=>`<div class="rc-item ${cls}">${i}</div>`).join('');
    $('#debrief-scroll').appendChild(c);
  };
  mk('rc-good','✓ 你做得好的', r.strengths);
  mk('rc-bad','↳ 可以更好的', r.weaknesses);
  mk('rc-learn','◈ 该强化的学习', r.reinforce);
  mk('rc-warm','➜ 下一步行动', r.nextActions);
  // 六维雷达（自评基线 vs 现在）
  const rb=document.createElement('div'); rb.className='radar-box';
  rb.innerHTML='<svg id="radar" viewBox="0 0 300 300" width="300" height="300"></svg>';
  $('#debrief-scroll').appendChild(rb);
  const cur={}; DIMS.forEach(d=>cur[d.k]=dimPoint(d.k));
  drawDimRadar($('#radar'), selfEval(), cur);
  // 本次加点（只有首次通关才加，且只加相关维度）
  const growthBox=document.createElement('div'); growthBox.className='growth-note';
  if(State.pendingDims && State.pendingDims.length){
    growthBox.innerHTML=`<div class="gn-title">这一关让你长了</div>
      <div class="gn-body">${State.pendingDims.map(k=>`<span class="gn-pill">${DIM_NAME[k]} +1</span>`).join('')}</div>
      <div class="gn-sub">只加这一关真正用到的维度。同一关再通关不重复加分。</div>`;
  } else if(passed){
    growthBox.innerHTML=`<div class="gn-title">这一关你没白练</div><div class="gn-sub">相关维度之前已经加过点，这次是把它练稳。下一关换个场景，长的是另一块。</div>`;
  }
  if(growthBox.innerHTML) $('#debrief-scroll').appendChild(growthBox);
  // 一句话复盘
  const rc=document.createElement('div'); rc.className='report-card reflect-card';
  rc.innerHTML=`<div class="rc-label rc-learn">✎ 一句话复盘（可选）</div><textarea id="debrief-reflect" class="goal-input" rows="2" placeholder="哪一步你觉得自己处理得不错？哪步下次想换种接法？"></textarea>`;
  $('#debrief-scroll').appendChild(rc);
  // 闯关门禁：未达 90 分不能结束，只能重练
  const saveBtn=$('#btn-save-debrief'), masteryBtn=$('#btn-mastery');
  if(passed){
    saveBtn.textContent='保存并回看成长';
    saveBtn.classList.remove('ghost-green');
    saveBtn.onclick=saveDebrief;
    masteryBtn.style.display = State.scenario.masteryTest?'block':'none';
    masteryBtn.onclick=goMastery;
  } else {
    saveBtn.textContent=`未达 ${PASS_SCORE} 分 · 重练这一关`;
    saveBtn.classList.add('ghost-green');
    saveBtn.onclick=retryScenario;
    masteryBtn.style.display='none';
  }
}

/* 掌握度测试 */
function goMastery(){
  const mt=State.scenario.masteryTest; if(!mt) return;
  const w=State.world; const persona=w.personas.find(p=>p.id===State.scenario.personaId)||w.personas[0];
  const synth={
    id:mt.id, worldId:w.code, personaId:persona.id, title:mt.title, domainName:w.name,
    briefing:mt.brief, openingLine:mt.brief,
    recommendedTechniques:State.scenario.recommendedTechniques,
    pitfalls:State.scenario.pitfalls,
    masteryTest:null
  };
  State.scenario=synth; State.persona=persona; State.mode='practice'; State.isMastery=true;
  toast('相似案例：'+mt.twist);
  openBrief();
}

/* ===== 11. 保存 / 成长 ===== */
function saveDebrief(){
  const score=(State.lastScore&&State.lastScore.score)||0;
  if(score<PASS_SCORE){ toast(`未达 ${PASS_SCORE} 分，这一关不能结束，先重练`); return; }
  // 只给「首次通关」加分，且只加本关相关维度
  const granted = State.firstPass ? awardDims(State.scenario) : [];
  const sessions=StorageAdapter.get('sessions',[]);
  sessions.unshift({ date:new Date().toISOString().slice(0,10), title:State.scenario.title+(State.isMastery?'（测试）':''), used:[...State.used].length, score, reflect:$('#debrief-reflect')?$('#debrief-reflect').value.trim():'' });
  StorageAdapter.set('sessions',sessions.slice(0,30));
  if(State.isMastery){ const m=StorageAdapter.get('mastered',0)+1; StorageAdapter.set('mastered',m); }
  toast(granted.length? `通关 ✓ ${granted.map(k=>DIM_NAME[k]).join('、')} 各 +1` : '已存下这次练习');
  show('me');
}

/* ===== 12. 成长页 ===== */
function renderProgress(){
  const sessions=StorageAdapter.get('sessions',[]);
  const gr=dimGrowth();
  const prog=StorageAdapter.get('progress',{});
  const passedCount=Object.values(prog).filter(p=>p.passed).length;
  $('#stat-sessions').textContent=sessions.length;
  $('#stat-tech').textContent=Object.keys(gr).length;
  $('#stat-master').textContent=passedCount;
  $('#home-count').textContent=sessions.length;
  const cur={}; DIMS.forEach(d=>cur[d.k]=dimPoint(d.k));
  drawDimRadar($('#radar-progress'), selfEval(), cur);
  const log=$('#session-log');
  if(sessions.length===0){ log.innerHTML='<div class="log-empty">还没有练习记录。悄悄开始第一场吧。</div>'; return; }
  log.innerHTML=sessions.slice(0,8).map(s=>`<div class="log-item"><div><div class="li-main">${s.title}</div><div class="li-sub">${s.date} · ${s.used} 招${s.score?' · '+s.score+' 分':''}</div></div><div class="li-tag">${s.score>=PASS_SCORE?'通关':(s.used>0?'练过':'热身')}</div></div>`).join('');
}

/* ===== 13. 人设弹层（含关系脉络，已合并入卡片） ===== */
function openSheet(p){
  const w=State.world;
  let relNote='';
  if(w&&w.structure&&w.structure.relationships){
    relNote=w.structure.relationships.filter(r=>r.includes(p.name)).map(r=>`<li>${r}</li>`).join('');
  }
  $('#sheet').innerHTML=`<div class="sheet-bar"></div>
    <div class="char-card">
      <div class="char-head"><img src="${p.avatar}" alt="${p.name}" onerror="this.style.background='#E7F1EC'">
        <div><div class="char-name">${p.name}</div><div class="char-meta">${p.age}岁 · ${p.role}</div><div class="char-meta">与你的关系：${p.relation}</div></div></div>
      <div class="persona-text">${p.personality}</div>
      <div class="block" style="margin-top:16px"><div class="block-label">◈ 隐藏目标（黑天鹅）</div><ul class="hg-list">${(p.hiddenGoals||[]).map(h=>`<li>${h}</li>`).join('')}</ul></div>
      <div class="block"><div class="block-label">⚠ 说话风格</div><div class="situation">${p.speakingStyle||'—'}</div></div>
      ${relNote?`<div class="block"><div class="block-label">关系脉络</div><ul class="hg-list">${relNote}</ul></div>`:''}
    </div>`;
  $('#sheet-mask').classList.remove('hidden');
}
function closeSheet(){ $('#sheet-mask').classList.add('hidden'); }

/* ===== 14. 设置 ===== */
function currentScreen(){
  const el=[...document.querySelectorAll('.screen')].find(s=>!s.classList.contains('hidden'));
  return el? el.id.replace('screen-','') : 'home';
}
function refreshAiMini(){
  const btn=$('#btn-ai-settings'); if(!btn) return;
  const cfg=StorageAdapter.get('settings',null);
  const on=!!(cfg&&cfg.key&&cfg.endpoint);
  btn.className='home-count ai-mini '+(on?'on':'off');
  const t=$('#ai-mini-text'); if(t) t.textContent=on?'AI 已连接':'AI 未连接';
  btn.title=on?'AI 已连接 · 点这里修改Key':'AI 未连接 · 点这里填 Key（填完对手和点评才是真的 AI）';
}
function openSettings(){
  State._setFrom=currentScreen();
  const cfg=StorageAdapter.get('settings',{});
  $('#set-endpoint').value=cfg.endpoint||'https://api.deepseek.com/v1/chat/completions';
  $('#set-key').value=cfg.key||''; $('#set-model').value=cfg.model||'deepseek-chat';
  const box=$('#set-test');
  if(box){
    box.className='set-test';
    box.textContent='当前网址：'+location.origin+'\nKey 是按网址分开存的，换网址需要重填。点上面「测试连接」可以直接看到真实报错。';
  }
  refreshInstallUI();
  show('settings'); }
function saveSettings(){ StorageAdapter.set('settings',{endpoint:$('#set-endpoint').value.trim(),key:$('#set-key').value.trim(),model:$('#set-model').value.trim()}); refreshAiMini(); toast('已保存（Key 仅存本机）'); show(State._setFrom||'progress'); }

/* AI 状态：失败必须让人看见，绝不静默降级 */
const AI_STATE={status:'unknown',code:null,msg:'',noticed:false};
function aiChip(state,text){
  const chip=$('#ai-chip'); if(!chip) return;
  $('#ai-chip-text').textContent=text;
  chip.className='ai-chip '+state;
}
function aiFriendly(code,msg){
  const m=String(msg||'').slice(0,180);
  if(code===401||code===403) return `Key 无效或没权限（${code}）。去设置核对 Key，注意别带空格。${m?'\n原始信息：'+m:''}`;
  if(code===402) return `账户余额不足（402），DeepSeek 已拒绝请求。充值后重试。${m?'\n原始信息：'+m:''}`;
  if(code===429) return `请求太频繁或额度超限（429），等半分钟再试。${m?'\n原始信息：'+m:''}`;
  if(code===400) return `请求参数或模型名不对（400）。模型一般填 deepseek-chat。${m?'\n原始信息：'+m:''}`;
  if(code===404) return `接口地址不对（404）。应为 https://api.deepseek.com/v1/chat/completions${m?'\n原始信息：'+m:''}`;
  if(code==='network') return `连不上接口（网络或跨域被拦）。检查网络/代理，或换一个兼容接口地址。${m?'\n原始信息：'+m:''}`;
  if(code==='empty') return `模型返回了空内容，稍后重试。${m?'\n原始信息：'+m:''}`;
  return `AI 调用失败${code?('（'+code+'）'):''}。${m?'\n原始信息：'+m:''}`;
}
function reportAIError(code,msg){
  AI_STATE.status='error'; AI_STATE.code=code; AI_STATE.msg=String(msg||'').slice(0,300);
  const friendly=aiFriendly(code,msg);
  aiChip('bad','AI 没连上 · '+(code===402?'余额不足':code===401||code===403?'Key 无效':code==='network'?'网络/跨域':String(code))+'（点这里看原因）');
  if(!AI_STATE.noticed){
    AI_STATE.noticed=true;
    toast('AI 调用失败：'+(code===402?'账户余额不足':code===401?'Key 无效':String(code))+' — 点对话页顶部黄条看详情');
  }
  AI_STATE.detail=friendly;
  return null;
}
async function testAI(){
  const box=$('#set-test');
  const cfg={endpoint:$('#set-endpoint').value.trim(),key:$('#set-key').value.trim(),model:$('#set-model').value.trim()||'deepseek-chat'};
  box.className='set-test'; box.textContent='正在请求…';
  const t0=Date.now();
  try{
    const r=await fetch(cfg.endpoint,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+cfg.key},body:JSON.stringify({model:cfg.model,messages:[{role:'user',content:'回一个字：好'}],max_tokens:8})});
    const ms=Date.now()-t0;
    const raw=await r.text();
    if(!r.ok){
      let detail=raw;
      try{ const j=JSON.parse(raw); detail=(j.error&&(j.error.message||j.error.code))||raw; }catch(e){}
      box.className='set-test bad';
      box.textContent=`失败（HTTP ${r.status}，${ms}ms）\n${aiFriendly(r.status,detail)}`;
      return;
    }
    let ok=false,c='';
    try{ const j=JSON.parse(raw); c=(j.choices&&j.choices[0]&&j.choices[0].message&&j.choices[0].message.content)||''; ok=!!c; }catch(e){}
    box.className='set-test '+(ok?'ok':'bad');
    box.textContent=ok
      ? `连接成功（${ms}ms）· 模型 ${cfg.model}\n回包：${String(c).slice(0,40)}`
      : `HTTP 200 但拿不到内容（${ms}ms）\n原始返回：${raw.slice(0,200)}`;
  }catch(e){
    box.className='set-test bad';
    box.textContent=`请求没发出去（${Date.now()-t0}ms）：${e&&e.message||e}\n多半是网络不通或被跨域拦截。\n当前网址：${location.origin}`;
  }
}

/* ===== 15. LLM 通用 ===== */
async function callLLM(sys, history){
  const cfg=StorageAdapter.get('settings',null);
  if(!cfg||!cfg.key||!cfg.endpoint){ return null; }
  const body={model:cfg.model||'deepseek-chat',messages:[{role:'system',content:sys},...history]};
  let r;
  try{
    r=await fetch(cfg.endpoint,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+cfg.key},body:JSON.stringify(body)});
  }catch(e){ return reportAIError('network',(e&&e.message)||String(e)); }
  if(!r.ok){
    let raw='';
    try{ raw=await r.text(); }catch(e){}
    let detail=raw;
    try{ const j=JSON.parse(raw); detail=(j.error&&(j.error.message||j.error.code))||raw; }catch(e){}
    return reportAIError(r.status,detail);
  }
  let j=null;
  try{ j=await r.json(); }catch(e){ return reportAIError('parse','返回不是 JSON：'+((e&&e.message)||'')); }
  const c=j&&j.choices&&j.choices[0]&&j.choices[0].message&&j.choices[0].message.content;
  if(!c) return reportAIError('empty','choices 为空');
  AI_STATE.status='ok'; AI_STATE.code=null; AI_STATE.msg='';
  aiChip('ok','AI 已连接 · '+(cfg.model||'deepseek-chat'));
  return String(c).trim();
}

/* 从完整版首页点 LOGO / 产品名 → 回到引流版（保留 sharecode） */
function goLite(){
  const q = new URLSearchParams(location.search);
  q.set('mode','lite');
  location.href = location.pathname + '?' + q.toString() + location.hash;
}

/* ===== 16. 事件绑定 + 启动 ===== */
function bind(){
  $('#btn-progress').onclick=()=>show('progress');
  $('#btn-ai-settings').onclick=openSettings;
  $('#btn-start').onclick=openDomainPicker;
  const bh = $('#brand-home');
  if(bh){
    bh.onclick = goLite;
    bh.addEventListener('keydown', e => { if(e.key==='Enter'||e.key===' '){ e.preventDefault(); goLite(); } });
  }
  $('#btn-how').onclick=()=>toast('选一个战场 → 看对手是谁 → 开练。第一次约 5 分钟，输了也没关系。');
  $('#btn-progress2').onclick=()=>show('progress');
  $('#btn-back-home').onclick=()=>show('home');
  $('#btn-back-home4').onclick=()=>show('home');
  $('#btn-back-home5').onclick=()=>show('home');
  $('#btn-back-progress2').onclick=()=>show(State._setFrom||'progress');
  $('#btn-back-cat').onclick=()=>show('category');
  $('#btn-back-brief').onclick=()=>show('brief');
  $('#btn-view-roster').onclick=()=>openSheet(State.world&&State.world.personas[0]);
  $('#btn-swap').onclick=swapScenarios;
  $('#btn-custom-go').onclick=openCustom;
  $('#btn-prep').onclick=openPrep;
  $('#btn-enter-chat').onclick=enterChat;
  $('#btn-send').onclick=sendMessage;
  $('#chat-input').addEventListener('keydown',e=>{ if(e.key==='Enter') sendMessage(); });
  $('#btn-hint').onclick=toggleHint;
  // 事件委托：即使抽屉内容被重建，收起按钮也一定能命中
  const hd=$('#hint-drawer');
  if(hd) hd.addEventListener('click',e=>{
    const c=e.target && e.target.closest && e.target.closest('.hint-close');
    if(c){ e.preventDefault(); e.stopPropagation(); setHintOpen(false); }
  });
  $('#btn-end').onclick=endChat;
  $('#btn-exit-chat').onclick=()=>{ if(confirm('退出这场演练？进度不保存。')) show('home'); };
  $('#btn-mastery').onclick=goMastery;
  $('#btn-save-debrief').onclick=saveDebrief;
  $('#btn-settings2').onclick=openSettings;
  $('#btn-save-settings').onclick=saveSettings;
  const bt=$('#btn-test-ai'); if(bt) bt.onclick=testAI;
  const chip=$('#ai-chip'); if(chip) chip.onclick=()=>{ openSettings(); const b=$('#set-test'); if(b&&AI_STATE.detail){ b.className='set-test bad'; b.textContent=AI_STATE.detail; } };
  $('#sheet-mask').onclick=e=>{ if(e.target.id==='sheet-mask') closeSheet(); };
  $('#picker-cancel').onclick=()=>$('#picker-mask').classList.add('hidden');
  // 我 / 人设
  $('#btn-me').onclick=()=>{ hasProfile() ? show('me') : openPersonaCreate('first'); };
  $('#btn-me-back').onclick=()=>show('home');
  $('#btn-me-edit').onclick=()=>openPersonaCreate('edit');
  $('#btn-persona-next').onclick=personaNext;
  $('#btn-persona-back').onclick=()=>{
    if(P.step>1){ setPersonaStep(P.step-1); return; }
    if(P.mode==='edit' && hasProfile()){ show('me'); return; }
    show('home');
  };
  $('#p-name').addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); personaNext(); } });
  const ib=$('#btn-install');
  if(ib) ib.onclick=async()=>{
    if(!INSTALL_EVT) return;
    INSTALL_EVT.prompt();
    try{ await INSTALL_EVT.userChoice; }catch(e){}
    INSTALL_EVT=null; refreshInstallUI();
  };
}
window.addEventListener('DOMContentLoaded', async()=>{
  bind();
  try{ await renderHome(); }catch(e){ toast('知识库加载失败：请用本地服务器打开'); }
  // 首页数据是异步加载的：若用户已经先一步点进别的页面，就别再把他拽回首页
  if(!State._screen) show('home');
  refreshInstallUI();
  if('serviceWorker' in navigator && location.protocol!=='file:'){
    window.addEventListener('load',()=>{
      navigator.serviceWorker.register('sw.js').catch(()=>{});
      // 新版本部署后，SW 接管即自动刷新一次，避免用户长期看旧缓存
      let reloaded = false;
      navigator.serviceWorker.addEventListener('controllerchange', ()=>{
        if(reloaded) return;
        reloaded = true;
        location.reload();
      });
    });
  }
});
