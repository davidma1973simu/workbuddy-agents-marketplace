#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""R-20 移动端 375px 窄屏验收：
   ① 布局视口不被撑宽（is_mobile 下 innerWidth 应 ≈375，否则整页被缩小）
   ② 无横向滚动
   ③ 无「可触达内容」溢出视口（排除被 overflow:hidden/clip 裁掉的装饰元素）
   ④ 扩展态（展开全部卡片 / 打开筛选面板）同样成立
"""
import subprocess, time, sys, json
from playwright.sync_api import sync_playwright

ROOT = '/Users/davidma/WorkBuddy/workbuddy-agents-marketplace/transform-v2.0'
PORT = 8788
BASE = f'http://localhost:{PORT}/'
srv = subprocess.Popen(
    ['/Users/davidma/.workbuddy/binaries/python/versions/3.13.12/bin/python3', '-m', 'http.server', str(PORT)],
    cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1.2)

SEED_ARCHIVE = json.dumps([
    {"id": "a1", "scenario": "工作里的控制感", "tags": ["控制感", "边界"],
     "essence": {"nature": "本质是我不敢拒绝", "insight": "把别人的期待当成我的责任，所以一直超载"},
     "mentalModel": "框架X：先看约束再看选项", "reflection": {"changed": "我改变了判断顺序", "learned": "先写下约束"},
     "completedAt": "2026-08-01T10:00:00.000Z", "createdAt": "2026-08-01T10:00:00.000Z", "reflectedAt": "2026-08-02T10:00:00.000Z"},
    {"id": "a2", "scenario": "家庭沟通", "tags": ["控制感"],
     "essence": {"nature": "本质B", "insight": "我总在最亲的人面前最没有耐心"},
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
     "support": {"people": [], "tools": [], "info": []}, "sourceInsightId": "a1"},
], ensure_ascii=False)

OVERFLOW = """
(() => {
  const vw = document.documentElement.clientWidth;
  const isClipped = el => {
    let a = el.parentElement;
    while (a && a !== document.documentElement) {
      const o = getComputedStyle(a).overflowX;
      if (o === 'hidden' || o === 'clip' || o === 'auto' || o === 'scroll') return true;
      a = a.parentElement;
    }
    return false;
  };
  const isDecor = el => {
    const cs = getComputedStyle(el);
    if (cs.pointerEvents === 'none' && !(el.innerText || '').trim()) return true;
    return el.matches('.atmo-blob,.grid-overlay,.orb,.bg-atmo,[aria-hidden="true"]');
  };
  const bad = [];
  document.querySelectorAll('body *').forEach(el => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.05) return;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return;
    if (isClipped(el) || isDecor(el)) return;
    if (r.right > vw + 1) bad.push({ tag: el.tagName, cls: (el.className||'').toString().split(' ').slice(0,2).join('.'), right: Math.round(r.right), txt: (el.innerText||'').trim().slice(0,16) });
    if (r.left < -1) bad.push({ tag: el.tagName, cls: (el.className||'').toString().split(' ').slice(0,2).join('.'), left: Math.round(r.left), txt: (el.innerText||'').trim().slice(0,16) });
  });
  return { vw, innerW: window.innerWidth, docW: document.documentElement.scrollWidth, bodyW: document.body.scrollWidth, bad: bad.slice(0, 6), badN: bad.length };
})()
"""

PAGES = ['index.html', 'think.html', 'punch.html', 'app.html', 'act.html', 'cognitive.html', 'behavior.html']
results, errs = [], []
def check(n, c, e=''): results.append((n, bool(c), e))

MOBILE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'

def prep(pg):
    pg.evaluate("a => localStorage.setItem('trf_archive', a)", SEED_ARCHIVE)
    pg.evaluate("a => localStorage.setItem('trf_actions', a)", SEED_ACTIONS)
    pg.evaluate("() => { localStorage.setItem('trf_onboarded','1'); localStorage.setItem('trf_onboarded_act','1'); }")
    pg.reload(wait_until='networkidle'); time.sleep(0.4)
    pg.evaluate("() => document.querySelectorAll('.onboard-mask,.mask,.modal-mask').forEach(m => m.style.display='none')")

with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome')

    # ---------- ① 真机模拟：布局视口是否被撑宽 ----------
    ctx_m = b.new_context(viewport={'width': 375, 'height': 812}, device_scale_factor=3,
                          user_agent=MOBILE_UA, is_mobile=True, has_touch=True)
    pgm = ctx_m.new_page()
    pgm.on('pageerror', lambda e: errs.append('PAGEERR ' + str(e)))
    for f in PAGES:
        pgm.goto(BASE + f, wait_until='networkidle'); prep(pgm)
        d = pgm.evaluate("() => ({ innerW: window.innerWidth, docW: document.documentElement.scrollWidth, vvp: (window.visualViewport||{}).width })")
        check(f'R-20 {f} 布局视口未被撑宽（≈375）', d['innerW'] <= 380, f"innerWidth={d['innerW']} visualViewport={d['vvp']} scrollW={d['docW']}")
    ctx_m.close()

    # ---------- ②③④ 精确测量：可见内容不越界 ----------
    ctx = b.new_context(viewport={'width': 375, 'height': 812})
    pg = ctx.new_page()
    pg.on('pageerror', lambda e: errs.append('PAGEERR ' + str(e)))
    pg.on('console', lambda m: errs.append('CONSOLE ' + m.text) if m.type == 'error' and 'favicon' not in m.text else None)
    for f in PAGES:
        pg.goto(BASE + f, wait_until='networkidle'); prep(pg)
        d = pg.evaluate(OVERFLOW)
        check(f'R-20 {f} 无横向滚动', d['docW'] <= 375 + 1, f"docW={d['docW']}")
        check(f'R-20 {f} 可见内容不越界', d['badN'] == 0, f"n={d['badN']} {d['bad']}")
        pg.evaluate("""() => {
          document.querySelectorAll('.fold-card').forEach(c => c.classList.add('open'));
          document.querySelectorAll('.expand-card').forEach(c => c.classList.add('open'));
          const t = document.getElementById('filterToggleBtn'); if (t) t.click();
          document.querySelectorAll('.occ-sub').forEach(d => d.setAttribute('open',''));
          document.querySelectorAll('.occ-rest').forEach(d => d.removeAttribute('hidden'));
        }""")
        time.sleep(0.35)
        d2 = pg.evaluate(OVERFLOW)
        check(f'R-20 {f} 扩展态无横向滚动', d2['docW'] <= 375 + 1, f"docW={d2['docW']}")
        check(f'R-20 {f} 扩展态可见内容不越界', d2['badN'] == 0, f"n={d2['badN']} {d2['bad']}")

    b.close()

srv.terminate()
ok = 0
for n, c, e in results:
    print(('PASS' if c else 'FAIL'), '-', n, (e and ('(' + str(e) + ')') or '')); ok += 1 if c else 0
print(f'--- {ok}/{len(results)} passed ---')
print('=== JS ERRORS ==='); print('\n'.join(errs) if errs else 'none')
sys.exit(0 if ok == len(results) and not errs else 1)
