#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""R-14 / R-15 扫描：
   R-14 一屏只允许一个深绿实心元素（逐滚动位检视）
   R-15 任一卡展开高度 ≤ 600px
"""
import subprocess, time, sys, json
from playwright.sync_api import sync_playwright

ROOT = '/Users/davidma/WorkBuddy/workbuddy-agents-marketplace/transform-v2.0'
PORT = 8782
BASE = f'http://localhost:{PORT}/'
srv = subprocess.Popen(
    ['/Users/davidma/.workbuddy/binaries/python/versions/3.13.12/bin/python3', '-m', 'http.server', str(PORT)],
    cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1.2)

SEED_ARCHIVE = json.dumps([
    {"id": "a1", "scenario": "工作选择", "tags": ["控制感", "边界"],
     "essence": {"nature": "本质A", "insight": "洞察A 这是一条足够长的想法正文，用于渲染折叠卡的首行"},
     "mentalModel": "框架X：先看约束再看选项", "reflection": {"changed": "我改变了判断顺序", "learned": "先写下约束"},
     "completedAt": "2026-08-01T10:00:00.000Z", "createdAt": "2026-08-01T10:00:00.000Z", "reflectedAt": "2026-08-02T10:00:00.000Z"},
    {"id": "a2", "scenario": "家庭沟通", "tags": ["控制感"],
     "essence": {"nature": "本质B", "insight": "洞察B 另一条足够长的想法正文，用于渲染折叠卡的首行"},
     "completedAt": "2026-09-02T10:00:00.000Z", "createdAt": "2026-09-02T10:00:00.000Z"},
], ensure_ascii=False)

LOGS = [{"day": i, "done": (i % 2 == 0), "reason": "忘了" if i % 2 else "", "date": "2026-09-%02d" % (i % 28 + 1)} for i in range(1, 8)]
SEED_ACTIONS = json.dumps([
    {"id": "act1", "input": "每天读一页书，一个月读完一本", "targetDays": 7, "currentDay": 4,
     "plan": [{"day": i, "micro": "读第 %d 页并写下一句话" % i, "seconds": 30, "sub": ["翻开书", "读一页", "写一句"],
               "subDone": ["翻开书"]} for i in range(1, 8)],
     "anchor": {"after": "早餐"}, "identity": "一个说到做到的人", "status": "active",
     "stage": "dashboard", "logs": LOGS, "streak": 3, "bestStreak": 5, "totalDone": 4,
     "result": "读完了前三章", "habit": "早上先读书再开电脑",
     "reflection": {"changed": "我把读书放到了早餐后"},
     "support": {"people": [], "tools": [], "info": []},
     "sourceInsightId": "a1"},
], ensure_ascii=False)

DETECT = """
(() => {
  const deep = ['rgb(14, 107, 80)', 'rgb(10, 90, 66)'];
  const isDeep = el => {
    const cs = getComputedStyle(el);
    const bg = cs.backgroundColor;
    const bi = cs.backgroundImage || '';
    if (deep.includes(bg)) return true;
    if (/linear-gradient/.test(bi) && /#0A5A42|#0E6B50|rgb\\(10, 90, 66\\)|rgb\\(14, 107, 80\\)/i.test(bi)) return true;
    return false;
  };
  const out = [];
  document.querySelectorAll('a,button,[role=button],.btn,.mini,.cta,.filter-chip,.gn-item').forEach(el => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.4) return;
    const r = el.getBoundingClientRect();
    if (r.width < 8 || r.height < 8) return;
    const txt = (el.innerText || '').trim();
    if (txt.length < 2) return;               // 排除纯图标/极小元素
    if (!isDeep(el)) return;
    out.push({ text: txt.slice(0, 26), top: r.top + window.scrollY, bottom: r.bottom + window.scrollY,
               h: r.height, tag: el.tagName, cls: (el.className || '').toString().slice(0, 40) });
  });
  return { els: out, docH: document.documentElement.scrollHeight, vh: window.innerHeight };
})()
"""

results, errs, notes = [], [], []
def check(name, cond, extra=''):
    results.append((name, bool(cond), extra))

PAGES = ['index.html', 'think.html', 'punch.html', 'app.html', 'act.html', 'cognitive.html', 'behavior.html']

with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome')
    pg = b.new_context().new_page()
    pg.on('pageerror', lambda e: errs.append('PAGEERR ' + str(e)))
    pg.on('console', lambda m: errs.append('CONSOLE ' + m.text) if m.type == 'error' and 'favicon' not in m.text else None)

    for f in PAGES:
        pg.goto(BASE + f, wait_until='networkidle')
        pg.evaluate("a => localStorage.setItem('trf_archive', a)", SEED_ARCHIVE)
        pg.evaluate("a => localStorage.setItem('trf_actions', a)", SEED_ACTIONS)
        # 关闭首次引导弹窗（它是一次性覆盖层，不属于常驻屏）
        pg.evaluate("() => { localStorage.setItem('trf_onboarded','1'); localStorage.setItem('trf_onboarded_act','1'); }")
        pg.reload(wait_until='networkidle'); time.sleep(0.5)
        pg.evaluate("""() => {
            document.querySelectorAll('.onboard-mask,.mask,.modal-mask').forEach(m => m.style.display = 'none');
        }""")
        time.sleep(0.15)

        d = pg.evaluate(DETECT)
        els, vh = d['els'], d['vh']
        worst, worst_set = 0, []
        # 逐滚动位：统计落在同一视口内的深绿实心元素数
        step = max(120, vh // 3)
        pos = 0
        while pos <= max(0, d['docH'] - vh) + step:
            vis = [e for e in els if e['bottom'] > pos and e['top'] < pos + vh]
            if len(vis) > worst:
                worst, worst_set = len(vis), vis
            pos += step
        check(f'R-14 {f} 单屏深绿实心 ≤ 1', worst <= 1,
              ('max=' + str(worst) + ' :: ' + ' | '.join(x['text'] for x in worst_set)) if worst > 1 else ('total_deep=' + str(len(els))))

        # R-15：展开全部折叠卡，量高度
        pg.evaluate("""() => {
            try { document.querySelectorAll('.expand-card').forEach(c => c.classList.add('open')); } catch(e){}
        }""")
        # 逐张展开 fold-card 并测高
        ids = pg.eval_on_selector_all('.fold-card', 'els => els.map(e => e.id).filter(Boolean)')
        maxh, maxid = 0, ''
        for cid in ids:
            pg.evaluate("id => document.getElementById(id).classList.add('open')", cid)
            time.sleep(0.12)
            h = pg.eval_on_selector('#' + cid, "el => el.getBoundingClientRect().height")
            if h > maxh: maxh, maxid = h, cid
            pg.evaluate("id => document.getElementById(id).classList.remove('open')", cid)
        if ids:
            check(f'R-15 {f} 单卡展开 ≤ 600px', maxh <= 600, f'max={round(maxh)}px @{maxid}')
        else:
            notes.append(f'{f}: 无 fold-card')

    b.close()

srv.terminate()
ok = 0
for name, cond, extra in results:
    print(('PASS' if cond else 'FAIL'), '-', name, (extra and ('(' + str(extra) + ')') or ''))
    ok += 1 if cond else 0
print(f'--- {ok}/{len(results)} passed ---')
if notes: print('NOTES:', '; '.join(notes))
print('=== JS ERRORS ===')
print('\n'.join(errs) if errs else 'none')
sys.exit(0 if ok == len(results) and not errs else 1)
