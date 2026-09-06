#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Transform v2.0 · P1 批1 验收（W3 升级带上下文 / W11 归档 / W6 时间过滤 / W10 失败趋势）
中文版先行；英文镜像在 P1 全部完成后统一修订。基线回归另跑 verify_v2.py。"""
import subprocess, time, json, datetime
from playwright.sync_api import sync_playwright

ROOT = '/Users/davidma/WorkBuddy/transform-v2.0'
PORT = 8779
BASE = f'http://localhost:{PORT}/'
srv = subprocess.Popen(
    ['/Users/davidma/.workbuddy/binaries/python/versions/3.13.12/bin/python3', '-m', 'http.server', str(PORT)],
    cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1.2)

results, errs = [], []
def check(name, cond, extra=''):
    results.append((name, bool(cond), extra))
def days_ago(n): return (datetime.date.today() - datetime.timedelta(days=n)).isoformat()
def clear(pg, keys):
    ks = ', '.join("'" + k + "'" for k in keys)
    pg.evaluate(f"() => {{ [{ks}].forEach(k => localStorage.removeItem(k)); }}")

SEED_W3 = json.dumps([{"id":"seedw3","input":"每天读一页书","targetDays":7,"currentDay":3,
  "plan":[{"day":i,"micro":"读一页书" if i<=3 else "读两页书","seconds":30,"sub":[],"subDone":[]} for i in range(1,8)],
  "anchor":{"after":"早餐"},"identity":"一个说到做到的人","status":"active","stage":"dashboard",
  "logs":[{"day":1,"done":True,"date":days_ago(4)},{"day":2,"done":False,"reason":"忘了","date":days_ago(3)}],
  "streak":1,"bestStreak":1,"totalDone":1,"support":{"people":[],"tools":[],"info":[]}}], ensure_ascii=False)

SEED_W11 = json.dumps([
  {"id":"s1","scenario":"工作选择 A","tags":["控制感"],"essence":{"insight":"一"},"date":days_ago(2)},
  {"id":"s2","scenario":"工作选择 B","tags":["控制感"],"essence":{"insight":"二"},"date":days_ago(1),"archived":True},
  {"id":"s3","scenario":"关系边界","tags":["边界"],"essence":{"insight":"三"},"date":days_ago(1)}], ensure_ascii=False)

SEED_W6A = json.dumps([
  {"id":"old","scenario":"旧主题","tags":[],"essence":{"insight":"旧"},"createdAt":days_ago(120)},
  {"id":"w7","scenario":"近一周主题","tags":[],"essence":{"insight":"新"},"createdAt":days_ago(2)},
  {"id":"w30","scenario":"近一月主题","tags":[],"essence":{"insight":"中"},"createdAt":days_ago(20)},
  {"id":"wm","scenario":"本月主题","tags":[],"essence":{"insight":"本"},"createdAt":days_ago(5)}], ensure_ascii=False)
SEED_W6B = json.dumps([
  {"id":"ao","input":"旧实验","status":"active","createdAt":days_ago(120),"logs":[],"totalDone":0,"targetDays":7,"plan":[]},
  {"id":"an","input":"新实验","status":"active","createdAt":days_ago(1),"logs":[{"day":1,"done":True,"date":days_ago(1)}],"totalDone":1,"targetDays":7,"plan":[{"day":1,"micro":"m"}]}], ensure_ascii=False)

SEED_W10 = json.dumps([
  {"id":"e1","input":"实验一","status":"active","createdAt":days_ago(20),"totalDone":1,"targetDays":7,
   "logs":[{"day":1,"done":False,"reason":"忘了","date":days_ago(10)},{"day":2,"done":False,"reason":"忘了","date":days_ago(6)},{"day":3,"done":True,"date":days_ago(5)}]},
  {"id":"e2","input":"实验二","status":"active","createdAt":days_ago(15),"totalDone":1,"targetDays":7,
   "logs":[{"day":1,"done":False,"reason":"忘了","date":days_ago(4)},{"day":2,"done":True,"date":days_ago(3)}]},
  {"id":"e3","input":"实验三","status":"graduated","createdAt":days_ago(30),"totalDone":3,"targetDays":3,
   "logs":[{"day":1,"done":True,"date":days_ago(9)},{"day":2,"done":True,"date":days_ago(8)}]}], ensure_ascii=False)

with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome')
    ctx = b.new_context()
    pg = ctx.new_page()
    pg.on('pageerror', lambda e: errs.append('PAGEERR ' + str(e)))
    pg.on('console', lambda m: errs.append('CONSOLE ' + m.text) if m.type == 'error' and 'favicon' not in m.text else None)

    # ============ W3 每日改变→伴我改变 带上下文 ============
    pg.goto(BASE + 'punch.html', wait_until='networkidle'); time.sleep(0.3)
    clear(pg, ['trf_actions', 'trf_archive'])
    pg.evaluate("a=>localStorage.setItem('trf_actions',a)", SEED_W3)
    pg.goto(BASE + 'punch.html?id=seedw3', wait_until='networkidle'); time.sleep(0.8)
    href = pg.evaluate("() => { const a=document.querySelector('.tu-link'); return a?a.getAttribute('href'):null; }")
    check('W3 升级链接存在', href is not None, href or '')
    if href:
        import urllib.parse
        qs = urllib.parse.parse_qs(href.split('?')[1])
        check('W3 链接带目标', qs.get('goal', [''])[0] == '每天读一页书')
        check('W3 链接带今日小步', qs.get('micro', [''])[0] == '读一页书')
        check('W3 链接带最近失败原因', qs.get('fail', [''])[0] == '忘了')
        pg.goto(BASE + href.split('?')[0] + '?' + href.split('?')[1], wait_until='networkidle'); time.sleep(0.6)
        check('W3 act 目标预填', pg.evaluate("() => document.getElementById('changeInput').value") == '每天读一页书')
        check('W3 label 引用今日小步', '读一页书' in pg.evaluate("() => document.getElementById('changeLabel').textContent"))
        check('W3 hint 提示失败原因', '忘了' in pg.evaluate("() => document.querySelector('.card .hint').textContent"))

    # ============ W11 归档 ============
    clear(pg, ['trf_archive', 'trf_actions'])
    pg.goto(BASE + 'cognitive.html', wait_until='networkidle'); time.sleep(0.3)
    pg.evaluate("a=>localStorage.setItem('trf_archive',a)", SEED_W11)
    pg.reload(wait_until='networkidle'); time.sleep(0.6)
    main_txt = pg.evaluate("() => { const el=document.getElementById('insightList'); return el?el.innerText:''; }")
    check('W11 归档项隐藏于主列表', '工作选择 B' not in main_txt)
    cnt = pg.evaluate("() => document.getElementById('archivedCount').textContent")
    check('W11 归档卡计数=1', cnt == '1', 'cnt=' + cnt)
    pg.evaluate("() => { const c=[...document.querySelectorAll('.expand-card.archived-card')][0]; if(c) c.classList.add('open'); }")
    time.sleep(0.2)
    check('W11 归档列表可见', '工作选择 B' in pg.inner_text('body'))
    pg.evaluate("() => { const bt=[...document.querySelectorAll('#archivedList button.mini')][0]; if(bt) bt.click(); }")
    time.sleep(0.4)
    check('W11 恢复后计数归零', pg.evaluate("() => document.getElementById('archivedCount').textContent") == '0')
    check('W11 恢复后回主列表', '工作选择 B' in pg.evaluate("() => { const el=document.getElementById('insightList'); return el?el.innerText:''; }"))
    check('W11 无 archived 残留', pg.evaluate("() => JSON.parse(localStorage.getItem('trf_archive')).filter(x=>x.archived).length") == 0)
    check('W11 条目有归档按钮', pg.evaluate("() => document.querySelectorAll('.asset-btn.arch').length") >= 1)

    # ============ W6 时间过滤（认知页洞察 + 行为页实验） ============
    clear(pg, ['trf_archive', 'trf_actions'])
    pg.goto(BASE + 'cognitive.html', wait_until='networkidle'); time.sleep(0.3)
    pg.evaluate("a=>localStorage.setItem('trf_archive',a)", SEED_W6A)
    pg.reload(wait_until='networkidle'); time.sleep(0.6)
    def txt(el): return pg.evaluate("() => { const e=document.getElementById('" + el + "'); return e?e.innerText:''; }")
    check('W6 时间chips存在', pg.evaluate("() => !!document.getElementById('insightTime')"))
    check('W6 默认全部4组', txt('insightList').count('主题') == 4)
    pg.evaluate("() => setInsightTime('7')"); time.sleep(0.3)
    t = txt('insightList')
    check('W6 近7天只留1组', '近一周主题' in t and '旧主题' not in t and '近一月主题' not in t)
    pg.evaluate("() => setInsightTime('30')"); time.sleep(0.3)
    t = txt('insightList')
    check('W6 近30天=3组', '近一月主题' in t and '近一周主题' in t and '旧主题' not in t)
    pg.evaluate("() => setInsightTime('month')"); time.sleep(0.3)
    t = txt('insightList')
    check('W6 本月=2组', '本月主题' in t and '近一周主题' in t and '旧主题' not in t)
    pg.goto(BASE + 'behavior.html', wait_until='networkidle'); time.sleep(0.3)
    pg.evaluate("a=>localStorage.setItem('trf_actions',a)", SEED_W6B)
    pg.reload(wait_until='networkidle'); time.sleep(0.6)
    check('W6 行为时间chips', '近 7 天' in pg.inner_text('body'))
    check('W6 行为默认全部', '旧实验' in txt('actionList') and '新实验' in txt('actionList'))
    pg.evaluate("() => setActionFilter('time','7')"); time.sleep(0.3)
    a7 = txt('actionList')
    check('W6 行为近7天只留新', '新实验' in a7 and '旧实验' not in a7)

    # ============ W10 失败趋势 ============
    clear(pg, ['trf_actions', 'trf_archive'])
    pg.goto(BASE + 'behavior.html', wait_until='networkidle'); time.sleep(0.3)
    pg.evaluate("a=>localStorage.setItem('trf_actions',a)", SEED_W10)
    pg.reload(wait_until='networkidle'); time.sleep(0.6)
    card = pg.evaluate("() => { const el=document.querySelector('#discoveryBox .discovery-card'); return el?el.innerText:''; }")
    check('W10 发现卡出现', '模式' in card)
    check('W10 含原因与计数', '忘了' in card and '共 3 次' in card)
    check('W10 含最近失败时间', '最近一次失败在' in card and '天前' in card)
    check('W10 含反复→设计提示', '反复出现' in card and '设计' in card)

    b.close()

srv.terminate()
ok = 0
for name, cond, extra in results:
    print(('PASS' if cond else 'FAIL'), '-', name, (('(' + extra + ')') if extra else ''))
    ok += 1 if cond else 0
print(f'--- {ok}/{len(results)} passed ---')
real_js = [e for e in errs if not e.startswith('CONSOLE Failed to load resource')]
print('=== JS ERRORS ===')
print('\n'.join(real_js) if real_js else 'none')
sys_ok = ok == len(results) and not real_js
import sys
sys.exit(0 if sys_ok else 1)
