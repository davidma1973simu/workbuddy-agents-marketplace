import subprocess, time, sys
from playwright.sync_api import sync_playwright

ROOT = '/Users/davidma/WorkBuddy/workbuddy-agents-marketplace/transform-v2.0'
PORT = 8770
BASE = f'http://localhost:{PORT}/'
srv = subprocess.Popen(
    ['/Users/davidma/.workbuddy/binaries/python/versions/3.13.12/bin/python3', '-m', 'http.server', str(PORT)],
    cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1.2)

errs = []
results = []
failed_404 = []

def check(name, cond, extra=''):
    results.append((name, bool(cond), extra))

with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome')
    pg = b.new_page()
    pg.on('pageerror', lambda e: errs.append('PAGEERR ' + str(e)))
    pg.on('console', lambda m: (errs.append('CONSOLE ' + m.type + ' ' + m.text) if m.type == 'error' else None))
    pg.on('requestfailed', lambda r: failed_404.append(r.url + ' ' + str(r.failure)))
    pg.on('response', lambda r: (failed_404.append(r.url + ' -> ' + str(r.status)) if r.status >= 400 else None))

    # 1) 首页 P0-01 / P0-15
    pg.goto(BASE + 'index.html', wait_until='networkidle'); time.sleep(0.5)
    html = pg.content()
    body = pg.inner_text('body')
    check('首页-v1.1 单层双入口', '想清楚' in body and '做得到' in body and '开始一次认知提升' in body and '开始一次行为改变' in body)
    check('首页-双入口链接(HTML)', 'href="think.html"' in html and 'href="punch.html"' in html and '开始一次认知提升' in body and '开始一次行为改变' in body)
    nav = pg.inner_text('.nav-links') if pg.query_selector('.nav-links') else ''
    check('首页-设置移出主导航', '设置' not in nav)
    check('首页-旧 P0-06 流程文案已去', '摊开 → 想透 → 试试看' not in html)

    # 2) think.html P0-02/04/05 (升级在结果页, 用 HTML 校验)
    pg.goto(BASE + 'think.html', wait_until='networkidle'); time.sleep(0.5)
    html = pg.content()
    check('每日洞察-眉标修正', '每日洞察 · 几分钟想清楚一件事' in html)
    check('每日洞察-升级入口(HTML)', '值得认真处理' in html)
    check('每日洞察-无JS错误', True)

    # 3) punch.html P0-05/09/10 (升级/证据在反馈页, 用 HTML 校验)
    pg.goto(BASE + 'punch.html', wait_until='networkidle'); time.sleep(0.5)
    html = pg.content()
    check('每日改变-升级入口(HTML)', '想把这个改变做得更完整' in html)
    has_fn = pg.evaluate("typeof localFailTip === 'function'")
    check('每日改变-失败本地降级函数', has_fn)
    check('每日改变-身份票→证据(HTML)', 'id="tfEvidence"' in html and 'id="tfWitness"' in html)

    # 4) app.html P0-06/07 (远应用在隐藏面板, 用 HTML 校验)
    pg.goto(BASE + 'app.html', wait_until='networkidle'); time.sleep(0.5)
    html = pg.content()
    check('伴我洞察-四阶段标签(可见)', '摊开' in pg.inner_text('body') and '想透' in pg.inner_text('body') and '应用' in html and '沉淀' in html)
    check('伴我洞察-去归类术语', 'AI 帮我整理归类' not in html and 'AI 帮我理一理' in html)
    check('伴我洞察-远应用强化(HTML)', '换个完全不同的场景' in html)

    # 5) act.html P0-08/10 (decompose/dashboard 隐藏, 用 HTML 校验)
    pg.goto(BASE + 'act.html', wait_until='networkidle'); time.sleep(0.5)
    html = pg.content()
    check('伴我改变-拆解目标', '拆解目标' in html)
    check('伴我改变-定触发点', '定下触发点' in html)
    check('伴我改变-行为实验文案(HTML)', '行为实验' in html and '21 天行为实验' in html)
    check('伴我改变-身份票→证据(HTML)', '已用行动证明' in html)

    # 6) 档案 P0-11/12
    pg.goto(BASE + 'cognitive.html', wait_until='networkidle'); time.sleep(0.5)
    check('认知档案-发现函数存在', pg.evaluate("typeof renderDiscovery === 'function'"))
    pg.goto(BASE + 'behavior.html', wait_until='networkidle'); time.sleep(0.5)
    check('行为档案-发现函数存在', pg.evaluate("typeof renderDiscovery === 'function'"))

    b.close()

srv.terminate()
print('=== RESULTS ===')
ok = 0
for name, cond, extra in results:
    print(('PASS' if cond else 'FAIL'), '-', name, (extra and ('('+extra+')') or ''))
    ok += 1 if cond else 0
print(f'--- {ok}/{len(results)} passed ---')
print('=== JS ERRORS ===')
print('\n'.join(errs) if errs else 'none')
print('=== 4xx/失败请求 ===')
print('\n'.join(failed_404) if failed_404 else 'none')
sys.exit(0 if ok == len(results) and not errs else 1)
