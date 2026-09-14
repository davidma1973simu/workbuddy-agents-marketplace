#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""R-16 验收：UI 状态持久化（trf_ui）—— 展开态在重渲染/刷新后保持"""
import subprocess, time, sys, json
from playwright.sync_api import sync_playwright

ROOT = '/Users/davidma/WorkBuddy/workbuddy-agents-marketplace/transform-v2.0'
PORT = 8781
BASE = f'http://localhost:{PORT}/'
srv = subprocess.Popen(
    ['/Users/davidma/.workbuddy/binaries/python/versions/3.13.12/bin/python3', '-m', 'http.server', str(PORT)],
    cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1.2)

results, errs = [], []
def check(name, cond, extra=''):
    results.append((name, bool(cond), extra))

SEED = json.dumps([
    {"id": "a1", "scenario": "工作选择", "tags": ["控制感"],
     "essence": {"nature": "本质A", "insight": "洞察A 这是一条足够长的想法正文用于渲染"},
     "completedAt": "2026-09-01T10:00:00.000Z", "createdAt": "2026-09-01T10:00:00.000Z"},
    {"id": "a2", "scenario": "家庭沟通", "tags": ["边界"],
     "essence": {"nature": "本质B", "insight": "洞察B 这是另一条足够长的想法正文用于渲染"},
     "completedAt": "2026-09-02T10:00:00.000Z", "createdAt": "2026-09-02T10:00:00.000Z"},
], ensure_ascii=False)

with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome')
    pg = b.new_context().new_page()
    pg.on('pageerror', lambda e: errs.append('PAGEERR ' + str(e)))
    pg.on('console', lambda m: errs.append('CONSOLE ' + m.text) if m.type == 'error' and 'favicon' not in m.text else None)

    pg.goto(BASE + 'cognitive.html', wait_until='networkidle')
    pg.evaluate("() => localStorage.clear()")
    pg.evaluate("a => localStorage.setItem('trf_archive', a)", SEED)
    pg.reload(wait_until='networkidle'); time.sleep(0.4)

    n = pg.eval_on_selector_all('.fold-card', 'els => els.length')
    check('R-16 前置：存在可展开的卡片', n >= 1, f'fold-card={n}')

    # 1) 展开第一张卡（选 a1：它带「控制感」标签，切筛选后仍在列表中）
    cid = 'ins-a1'
    card = pg.query_selector(f'#{cid}')
    check('R-16 前置：目标卡片存在', card is not None, cid)
    card.query_selector('.fold-head').click()
    time.sleep(0.25)
    check('R-16a 点击后卡片展开', pg.eval_on_selector(f'#{cid}', "el => el.classList.contains('open')"), cid)

    # 2) trf_ui 已写入且记录了该卡展开态
    ui_raw = pg.evaluate("() => localStorage.getItem('trf_ui') || ''")
    ui = json.loads(ui_raw) if ui_raw else {}
    check('R-16b trf_ui 非空', bool(ui_raw))
    check('R-16c trf_ui.open 记录展开态', ui.get('open', {}).get('fold:' + cid) is True, json.dumps(ui.get('open', {}), ensure_ascii=False)[:80])

    # 3) 切筛选后展开态保持（核心验收）
    pg.evaluate("() => setTagFilter('控制感')")
    time.sleep(0.3)
    still_open = pg.eval_on_selector(f'#{cid}', "el => el.classList.contains('open')")
    so = pg.evaluate("() => (typeof sectionOpen !== 'undefined') ? sectionOpen['fold:' + '%s'] : null" % cid)
    check('R-16d setTagFilter 后 sectionOpen 仍为 true', so is True, f'sectionOpen={so}')
    check('R-16e setTagFilter 后 DOM 仍展开', still_open)
    pg.evaluate("() => setTagFilter('')")
    time.sleep(0.3)

    # 4) 刷新后展开态还原
    pg.evaluate("() => window.scrollTo(0, 300)")
    time.sleep(0.5)
    pg.reload(wait_until='networkidle'); time.sleep(0.5)
    restored = pg.eval_on_selector(f'#{cid}', "el => el.classList.contains('open')")
    check('R-16f 刷新后展开态还原', restored, cid)
    ui2 = json.loads(pg.evaluate("() => localStorage.getItem('trf_ui') || '{}'") or '{}')
    check('R-16g 刷新后 trf_ui 仍含 scroll', 'scroll' in ui2, f"scroll={ui2.get('scroll')}")

    # 5) 展开高度 ≤ 600px（R-15 顺带核验）
    h = pg.eval_on_selector(f'#{cid}', "el => el.getBoundingClientRect().height")
    check('R-15 单卡展开高度 ≤ 600px', h <= 600, f'height={round(h)}px')

    b.close()

srv.terminate()
ok = 0
for name, cond, extra in results:
    print(('PASS' if cond else 'FAIL'), '-', name, (extra and ('(' + str(extra) + ')') or ''))
    ok += 1 if cond else 0
print(f'--- {ok}/{len(results)} passed ---')
print('=== JS ERRORS ===')
print('\n'.join(errs) if errs else 'none')
sys.exit(0 if ok == len(results) and not errs else 1)
