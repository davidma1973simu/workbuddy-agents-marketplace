#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""R-19 cognitive.html（我的资产 · 想法）P1 功能逐项实测：
   筛选（标签/时间/视图）、搜索、使用痕迹、待用、标签增删、
   关联实验、归档/恢复、回收箱/恢复/清空/过期清理、备份面板、AI 设置。
   每条都断言「数据存储」+「DOM 反映」两者一致。
"""
import subprocess, time, sys
from playwright.sync_api import sync_playwright

ROOT = '/Users/davidma/WorkBuddy/workbuddy-agents-marketplace/transform-v2.0'
PORT = 8800
BASE = f'http://localhost:{PORT}/'
srv = subprocess.Popen(
    ['/Users/davidma/.workbuddy/binaries/python/versions/3.13.12/bin/python3', '-m', 'http.server', str(PORT)],
    cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1.2)

SEED = """
() => {
  const iso = d => new Date(Date.now() - d * 864e5).toISOString();
  const archive = [
    { id: 'i1', scenario: '工作里的控制感', tags: ['控制感','边界'],
      essence: { nature: '本质A', insight: '我一直在超载' }, completedAt: iso(4), createdAt: iso(4) },
    { id: 'i2', scenario: '家庭沟通', tags: ['控制感'],
      essence: { nature: '本质B', insight: '我对家人没耐心' }, completedAt: iso(44), createdAt: iso(44),
      pinned: true, uses: [{ at: iso(3), where: 'app.html' }, { at: iso(1), where: 'act.html' }] },
    { id: 'i3', scenario: '工作里的控制感', tags: ['成长'],
      essence: { nature: '本质C', insight: '我把别人的期待当成责任' }, completedAt: iso(2), createdAt: iso(2) },
    { id: 'i4', scenario: '旧的一次梳理', tags: ['旧'],
      essence: { nature: '老的', insight: '老的' }, completedAt: iso(300), createdAt: iso(300), archived: true }
  ];
  const actions = [
    { id: 'a1', input: '每天读一页书', status: 'active', sourceInsightId: 'i3', targetDays: 7, totalDone: 3,
      logs: [{ day: 1, done: true, date: iso(3) }, { day: 2, done: false, reason: '忘了', date: iso(2) }, { day: 3, done: true, date: iso(1) }],
      tags: ['阅读'], createdAt: iso(5) },
    { id: 'a2', input: '每天走 6000 步', status: 'graduated', archived: true, targetDays: 7, totalDone: 7, logs: [], tags: [] }
  ];
  const trash = [
    { tid: 't1', type: 'insight', data: { id: 'x1', scenario: '刚删掉的' }, deletedAt: iso(1) },
    { tid: 't2', type: 'insight', data: { id: 'x2', scenario: '过期的' }, deletedAt: iso(40) }
  ];
  localStorage.setItem('trf_archive', JSON.stringify(archive));
  localStorage.setItem('trf_actions', JSON.stringify(actions));
  localStorage.setItem('trf_trash', JSON.stringify(trash));
  localStorage.setItem('trf_profile', JSON.stringify({ identityStatements: [] }));
  localStorage.setItem('trf_onboarded', '1');
  localStorage.removeItem('trf_ai_config_v1');
  localStorage.removeItem('trf_ui');
}
"""

JS = """
window.__t = {
  cards: () => document.querySelectorAll('#insightList .insight.fold-card').length,
  listTxt: () => (document.getElementById('insightList') || {}).innerText || '',
  tagChips: () => document.querySelectorAll('#tagFilters .filter-chip').length,
  viewChips: () => document.querySelectorAll('#viewChips .filter-chip').length,
  archive: () => JSON.parse(localStorage.getItem('trf_archive') || '[]'),
  actions: () => JSON.parse(localStorage.getItem('trf_actions') || '[]'),
  trash: () => JSON.parse(localStorage.getItem('trf_trash') || '[]'),
  ai: () => JSON.parse(localStorage.getItem('trf_ai_config_v1') || 'null')
};
"""

results, errs = [], []
def check(n, c, e=''): results.append((n, bool(c), e))

with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome')
    pg = b.new_context(viewport={'width': 1280, 'height': 900}).new_page()
    pg.on('pageerror', lambda e: errs.append('PAGEERR ' + str(e)))
    pg.on('console', lambda m: errs.append('CONSOLE ' + m.text) if m.type == 'error' and 'favicon' not in m.text else None)

    pg.goto(BASE + 'cognitive.html', wait_until='networkidle')
    pg.evaluate(SEED)
    pg.reload(wait_until='networkidle'); time.sleep(0.6)
    pg.evaluate(JS)
    pg.evaluate("() => document.querySelectorAll('.onboard-mask,.mask,.modal-mask').forEach(m => m.style.display='none')")
    time.sleep(0.2)

    # ---- 1. 初始分组与统计 ----
    check('R-19a 初始分组正确（同场景归并 → 2 张卡）', pg.evaluate("() => window.__t.cards()") == 2, f"cards={pg.evaluate('() => window.__t.cards()')}")
    check('R-19b 视图 chip = 3（全部/待用/常用）', pg.evaluate("() => window.__t.viewChips()") == 3, f"={pg.evaluate('() => window.__t.viewChips()')}")
    check('R-19c 标签 chip = 唯一标签数+1', pg.evaluate("() => window.__t.tagChips()") == 4, f"={pg.evaluate('() => window.__t.tagChips()')}")
    stats = pg.evaluate("() => (document.getElementById('statsArea')||{}).innerText || ''")
    check('R-19d 统计区显示真实数据（非 0）', any(ch.isdigit() for ch in stats) and '0' != stats.strip(), f"stats={stats.strip()[:60]!r}")

    # ---- 2. 视图切换 ----
    pg.evaluate("() => setInsightView('pinned')"); time.sleep(0.15)
    check('R-19e 视图「待用」只留已收藏', pg.evaluate("() => window.__t.cards()") == 1 and '家庭沟通' in pg.evaluate("() => window.__t.listTxt()"), f"cards={pg.evaluate('() => window.__t.cards()')}")
    pg.evaluate("() => setInsightView('used')"); time.sleep(0.15)
    check('R-19f 视图「常用」只留用过的', pg.evaluate("() => window.__t.cards()") == 1 and '家庭沟通' in pg.evaluate("() => window.__t.listTxt()"), f"cards={pg.evaluate('() => window.__t.cards()')}")
    pg.evaluate("() => setInsightView('all')"); time.sleep(0.15)

    # ---- 3. 标签 / 时间 / 搜索 ----
    pg.evaluate("() => setTagFilter('控制感')"); time.sleep(0.15)
    check('R-19g 标签筛选「控制感」→ 2 张卡', pg.evaluate("() => window.__t.cards()") == 2, f"cards={pg.evaluate('() => window.__t.cards()')}")
    pg.evaluate("() => setTagFilter('成长')"); time.sleep(0.15)
    check('R-19h 标签筛选「成长」→ 1 张卡', pg.evaluate("() => window.__t.cards()") == 1, f"cards={pg.evaluate('() => window.__t.cards()')}")
    pg.evaluate("() => setTagFilter('')"); time.sleep(0.15)
    pg.evaluate("() => setInsightTime('30')"); time.sleep(0.15)
    check('R-19i 时间筛选近 30 天 → 排除 44 天前那条', pg.evaluate("() => window.__t.cards()") == 1 and '家庭沟通' not in pg.evaluate("() => window.__t.listTxt()"), f"cards={pg.evaluate('() => window.__t.cards()')}")
    pg.evaluate("() => setInsightTime('all')"); time.sleep(0.15)
    pg.evaluate("() => setInsightSearch('超载')"); time.sleep(0.15)
    check('R-19j 搜索正文命中 → 1 张卡', pg.evaluate("() => window.__t.cards()") == 1 and '超载' in pg.evaluate("() => window.__t.listTxt()"), f"cards={pg.evaluate('() => window.__t.cards()')}")
    pg.evaluate("() => setInsightSearch('不存在的关键词zzz')"); time.sleep(0.15)
    check('R-19k 搜索无结果 → 显示空态提示', pg.evaluate("() => window.__t.cards()") == 0 and '没有符合' in pg.evaluate("() => window.__t.listTxt()"), f"txt={pg.evaluate('() => window.__t.listTxt()')[:40]!r}")
    pg.evaluate("() => setInsightSearch('')"); time.sleep(0.15)

    # ---- 4. 使用痕迹 markUse ----
    before_uses = len(pg.evaluate("() => (window.__t.archive().find(s => s.id === 'i2') || {}).uses || []"))
    pg.evaluate("() => { markUse('insight', 'i2', 'act.html'); renderInsights(); }"); time.sleep(0.2)
    after_uses = len(pg.evaluate("() => (window.__t.archive().find(s => s.id === 'i2') || {}).uses || []"))
    check('R-19l 使用一次 → uses.length +1', after_uses == before_uses + 1, f"{before_uses} → {after_uses}")
    check('R-19m 卡片显示「用过 N 次」', '用过' in pg.evaluate("() => window.__t.listTxt()"), f"txt={pg.evaluate('() => window.__t.listTxt()')[:60]!r}")

    # ---- 5. 待用 togglePin ----
    pg.evaluate("() => togglePin('insight', 'i2')"); time.sleep(0.15)
    p1 = pg.evaluate("() => !!(window.__t.archive().find(s => s.id === 'i2') || {}).pinned")
    pg.evaluate("() => togglePin('insight', 'i2')"); time.sleep(0.15)
    p2 = pg.evaluate("() => !!(window.__t.archive().find(s => s.id === 'i2') || {}).pinned")
    check('R-19n 待用可切换（true→false）', p1 is False and p2 is True, f"after1={p1} after2={p2}")
    check('R-19o 卡片显示「待用」标记', '待用' in pg.evaluate("() => window.__t.listTxt()"), '')

    # ---- 6. 标签增删（走真实入口：先 openAssetTag 建立上下文）----
    pg.evaluate("() => openAssetTag('insight', 'i1')"); time.sleep(0.25)
    pg.evaluate("() => addAssetTagByText('新标签X')"); time.sleep(0.2)
    has_new = pg.evaluate("() => window.__t.archive().some(s => (s.tags||[]).includes('新标签X'))")
    chip_new = pg.evaluate("() => window.__t.tagChips()")
    check('R-19p 新增标签写入数据 + chip 数 +1', has_new and chip_new == 5, f"has={has_new} chips={chip_new}")
    pg.evaluate("() => removeAssetTag('新标签X')"); time.sleep(0.2)
    still = pg.evaluate("() => window.__t.archive().some(s => (s.tags||[]).includes('新标签X'))")
    chip_back = pg.evaluate("() => window.__t.tagChips()")
    check('R-19q 删除标签同步清理 + chip 数 -1', still is False and chip_back == 4, f"still={still} chips={chip_back}")
    pg.evaluate("() => closeAssetModal()"); time.sleep(0.15)

    # ---- 7. 关联实验（R-08）----
    rel = pg.evaluate("() => relatedExperimentsHtml('i3')")
    check('R-19r 关联实验渲染 1 条并指向 act.html', '已变成' in rel and 'act.html?id=a1' in rel, f"rel={rel[:70]!r}")
    pg.evaluate("""() => {
      const c = document.querySelector('#insightList .insight.fold-card');
      if (c) c.classList.add('open');
    }"""); time.sleep(0.2)
    body_txt = pg.evaluate("""() => {
      const c = document.querySelector('#insightList .insight.fold-card');
      return c ? (c.querySelector('.fold-body')||{}).innerText || '' : '';
    }""")
    check('R-19s 洞察卡展开体内出现「已变成 N 个行为实验」', '已变成' in body_txt, f"body={body_txt[:60]!r}")

    # ---- 8. 归档 / 恢复 ----
    pg.evaluate("() => openAssetArchive('insight', 'i2')"); time.sleep(0.3)
    arch_cnt = (pg.evaluate("() => (document.getElementById('archivedCount')||{}).textContent || ''") or '').strip()
    check('R-19t 归档后从列表移除 + 已归档计数 = 3（i4+i2+a2）', pg.evaluate("() => window.__t.cards()") == 1 and arch_cnt == '3', f"cards={pg.evaluate('() => window.__t.cards()')} arch={arch_cnt!r}")
    pg.evaluate("() => restoreArchived('insight', 'i2')"); time.sleep(0.3)
    check('R-19u 恢复归档 → 回到列表', pg.evaluate("() => window.__t.cards()") == 2, f"cards={pg.evaluate('() => window.__t.cards()')}")

    # ---- 9. 回收箱：加载时过期清理 → 移入 → 恢复 → 清空 ----
    tr0 = pg.evaluate("() => window.__t.trash()")
    check('R-19v 加载时自动清理 >30 天项，未过期保留', len(tr0) == 1 and tr0[0]['tid'] == 't1', f"trash={[x.get('tid') for x in tr0]}")
    pg.evaluate("() => openAssetDelete('insight', 'i2')"); time.sleep(0.2)
    pg.evaluate("() => confirmDeleteAsset()"); time.sleep(0.35)
    tr1 = pg.evaluate("() => window.__t.trash()")
    moved_tid = next((x['tid'] for x in tr1 if (x.get('data') or {}).get('id') == 'i2'), None)
    check('R-19w 删除（真实路径：确认 → 移入回收箱）→ trash +1 且列表移除', len(tr1) == 2 and moved_tid and pg.evaluate("() => window.__t.cards()") == 1, f"trash={len(tr1)} tid={moved_tid}")
    pg.evaluate("(tid) => restoreFromTrash(tid)", moved_tid); time.sleep(0.3)
    tr2 = pg.evaluate("() => window.__t.trash()")
    back = pg.evaluate("() => window.__t.archive().some(s => s.id === 'i2')")
    check('R-19x 从回收箱恢复 → trash -1 且资产回到数据里', len(tr2) == 1 and back is True and pg.evaluate("() => window.__t.cards()") == 2, f"trash={len(tr2)} back={back}")
    pg.evaluate("() => emptyTrash()"); time.sleep(0.2)
    check('R-19y 清空回收箱 → 0 项', len(pg.evaluate("() => window.__t.trash()")) == 0, f"={len(pg.evaluate('() => window.__t.trash()'))}")

    # ---- 10. 备份面板 + AI 设置 ----
    pg.evaluate("() => bkToggle()"); time.sleep(0.25)
    bk = pg.evaluate("""() => {
      const p = document.getElementById('bkPop');
      return { show: !!(p && p.classList.contains('show')), txt: (p && p.innerText) || '' };
    }""")
    check('R-19z 备份面板可打开且含导出入口', bk['show'] and '下载完整备份' in bk['txt'], f"show={bk['show']} txt={bk['txt'][:50]!r}")
    counts = pg.evaluate("() => bkCounts({ archive: loadArchiveAll(), actions: loadActionsAll(), profile: loadProfile(), patterns: null })")
    check('R-19z2 备份计数与实际数据一致', counts['archive'] == 4 and counts['actions'] == 2 and counts['ok'] is True, f"{counts}")
    pg.evaluate("""() => {
      openSettings();
      const b = document.getElementById('cfgBrand'); if (b) b.value = 'DeepSeek';
      const k = document.getElementById('cfgApiKey'); if (k) k.value = 'sk-test-123';
      saveSettings();
    }"""); time.sleep(0.3)
    ai = pg.evaluate("() => window.__t.ai()")
    check('R-19aa AI 设置写入 trf_ai_config_v1', bool(ai) and ai.get('apiKey') == 'sk-test-123', f"ai={ai}")

    b.close()

srv.terminate()
ok = 0
for n, c, e in results:
    print(('PASS' if c else 'FAIL'), '-', n, (e and ('(' + str(e) + ')') or '')); ok += 1 if c else 0
print(f'--- {ok}/{len(results)} passed ---')
print('=== JS ERRORS ==='); print('\n'.join(errs) if errs else 'none')
sys.exit(0 if ok == len(results) and not errs else 1)
