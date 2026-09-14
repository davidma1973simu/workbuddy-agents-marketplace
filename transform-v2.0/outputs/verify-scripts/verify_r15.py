#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""R-15 深度检核：用「最重」的单卡数据（多条出现 + 反馈卡 + 资源卡 + 长文案）
   逐卡展开量高度，任一卡展开高度必须 ≤ 600px。"""
import subprocess, time, sys, json
from playwright.sync_api import sync_playwright

ROOT = '/Users/davidma/WorkBuddy/workbuddy-agents-marketplace/transform-v2.0'
PORT = 8784
BASE = f'http://localhost:{PORT}/'
srv = subprocess.Popen(
    ['/Users/davidma/.workbuddy/binaries/python/versions/3.13.12/bin/python3', '-m', 'http.server', str(PORT)],
    cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1.2)

LONG = '这是一段刻意写得很长的正文，用来逼近真实用户会把卡片撑到多高。' * 3

def insight(i, scen, with_sub):
    s = {"id": "a%d" % i, "scenario": scen, "tags": ["控制感", "边界"],
         "essence": {"nature": LONG, "insight": LONG},
         "mentalModel": LONG, "reflection": {"changed": LONG, "learned": LONG},
         "completedAt": "2026-08-%02dT10:00:00.000Z" % (i + 1),
         "createdAt": "2026-08-%02dT10:00:00.000Z" % (i + 1),
         "reflectedAt": "2026-08-%02dT10:00:00.000Z" % (i + 2)}
    if with_sub:
        s["nearScenario"] = {"title": scen}
        s["nearFeedback"] = {"score": 4, "pros": LONG, "improvements": LONG,
                             "actions": [LONG[:60], LONG[:60], LONG[:60]]}
        s["nearResourcesPlan"] = {"people": [LONG[:30], LONG[:30]],
                                  "resources": [LONG[:30], LONG[:30]],
                                  "conditions": [LONG[:30]],
                                  "note": LONG}
    return s

# 同一个 scenario 归并成一张卡，5 条出现 → 最容易撑高
SEED_ARCHIVE = json.dumps([insight(i, "工作里的控制感", True) for i in range(1, 6)], ensure_ascii=False)

PLAN = [{"day": i, "micro": LONG[:40], "seconds": 30, "sub": ["第一步", "第二步", "第三步"], "subDone": ["第一步"]} for i in range(1, 31)]
LOGS = [{"day": i, "done": (i % 2 == 0), "reason": "忘了" if i % 2 else "", "date": "2026-09-%02d" % (i % 28 + 1)} for i in range(1, 31)]
SEED_ACTIONS = json.dumps([{
    "id": "act1", "input": LONG[:60], "targetDays": 30, "currentDay": 20,
    "plan": PLAN, "anchor": {"after": "早餐"}, "identity": "一个说到做到的人",
    "status": "active", "stage": "dashboard", "logs": LOGS, "streak": 12, "bestStreak": 18,
    "totalDone": 20, "result": LONG, "habit": LONG, "reflection": {"changed": LONG},
    "insight": LONG, "sourceInsightId": "a1",
    "support": {"people": [], "tools": [], "info": []}}], ensure_ascii=False)

results, errs = [], []
def check(n, c, e=''): results.append((n, bool(c), e))

with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome')
    pg = b.new_context().new_page()
    pg.on('pageerror', lambda e: errs.append('PAGEERR ' + str(e)))
    pg.on('console', lambda m: errs.append('CONSOLE ' + m.text) if m.type == 'error' and 'favicon' not in m.text else None)

    for f in ['cognitive.html', 'behavior.html']:
        pg.goto(BASE + f, wait_until='networkidle')
        pg.evaluate("a => localStorage.setItem('trf_archive', a)", SEED_ARCHIVE)
        pg.evaluate("a => localStorage.setItem('trf_actions', a)", SEED_ACTIONS)
        pg.evaluate("() => { localStorage.setItem('trf_onboarded','1'); localStorage.setItem('trf_onboarded_act','1'); }")
        pg.reload(wait_until='networkidle'); time.sleep(0.6)
        pg.evaluate("""() => document.querySelectorAll('.onboard-mask,.mask,.modal-mask').forEach(m => m.style.display='none')""")
        time.sleep(0.2)

        # 全部 expand-card 展开
        pg.evaluate("() => document.querySelectorAll('.expand-card').forEach(c => c.classList.add('open'))")
        time.sleep(0.3)

        ids = pg.eval_on_selector_all('.fold-card', 'els => els.map(e => e.id || "(no-id)")')
        print(f"\n### {f}  fold-cards={len(ids)} :: {ids}")
        worst, worst_id, worst_kind = 0, '', ''
        for cid in ids:
            if cid == '(no-id)':
                continue
            pg.evaluate("id => { const e=document.getElementById(id); if(e) e.classList.add('open'); }", cid)
            time.sleep(0.15)
            info = pg.evaluate("""id => { const e=document.getElementById(id);
                return { h: e.getBoundingClientRect().height, cls: e.className }; }""", cid)
            if info['h'] > worst:
                worst, worst_id, worst_kind = info['h'], cid, info['cls']
            pg.evaluate("id => { const e=document.getElementById(id); if(e) e.classList.remove('open'); }", cid)

        # 也量一下展开-card（模型/回收箱/归档）高度
        ex = pg.evaluate("""() => Array.from(document.querySelectorAll('.expand-card')).map(c => ({
            sec: c.dataset.section || '?', h: c.getBoundingClientRect().height }))""")
        exmax = max([e['h'] for e in ex], default=0)

        check(f'R-15 {f} 折叠卡展开 ≤ 600px', worst <= 600, f'max={round(worst)}px @{worst_id} [{worst_kind}]')
        check(f'R-15 {f} 区块卡展开 ≤ 600px', exmax <= 600, f'max={round(exmax)}px')

    b.close()

srv.terminate()
ok = 0
for n, c, e in results:
    print(('PASS' if c else 'FAIL'), '-', n, (e and ('(' + str(e) + ')') or '')); ok += 1 if c else 0
print(f'--- {ok}/{len(results)} passed ---')
print('=== JS ERRORS ==='); print('\n'.join(errs) if errs else 'none')
sys.exit(0 if ok == len(results) and not errs else 1)
