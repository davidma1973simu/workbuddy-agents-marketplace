#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Transform v2.0 验收：中英双语 + P0-09/11/12/14 功能实测"""
import subprocess, time, sys, json
from playwright.sync_api import sync_playwright

ROOT = '/Users/davidma/WorkBuddy/transform-v2.0'
PORT = 8772
BASE = f'http://localhost:{PORT}/'
srv = subprocess.Popen(
    ['/Users/davidma/.workbuddy/binaries/python/versions/3.13.12/bin/python3', '-m', 'http.server', str(PORT)],
    cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1.2)

results, errs, bad = [], [], []


def check(name, cond, extra=''):
    results.append((name, bool(cond), extra))


SEED_ARCHIVE = json.dumps([
    {"id": "s%d" % i, "scenario": "工作选择 %d" % i, "tags": ["控制感"], "insight": "x" * 20,
     "date": "2026-09-0%d" % (i % 9 + 1)} for i in range(1, 6)
], ensure_ascii=False)

SEED_ACTIONS = json.dumps([
    {"id": "seed1", "input": "每天读一页书", "targetDays": 7, "currentDay": 1,
     "plan": [{"day": 1, "micro": "读一页书", "seconds": 30, "sub": [], "subDone": []}],
     "anchor": {"after": "早餐"}, "identity": "一个说到做到的人", "status": "active",
     "stage": "dashboard", "logs": [], "streak": 0, "bestStreak": 0, "totalDone": 0,
     "support": {"people": [], "tools": [], "info": []}}
], ensure_ascii=False)

with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome')
    ctx = b.new_context()
    pg = ctx.new_page()
    pg.on('pageerror', lambda e: errs.append('PAGEERR ' + str(e)))
    pg.on('console', lambda m: errs.append('CONSOLE ' + m.text) if m.type == 'error' and 'favicon' not in m.text else None)
    pg.on('response', lambda r: bad.append(r.url + ' -> ' + str(r.status)) if r.status >= 400 else None)

    # ---------------- 首页：阈值以下不显示 ----------------
    pg.goto(BASE + 'index.html', wait_until='networkidle'); time.sleep(0.4)
    body = pg.inner_text('body')
    check('ZH 首页-每日/深度分层', '今天，我想做什么？' in body and '有件重要的事' in body)
    check('ZH 首页-设置移出主导航', '设置' not in (pg.inner_text('.nav-links') or ''))
    check('ZH 首页-页脚保留 AI 设置', 'AI 设置' in body)
    check('ZH 首页-发现容器存在', pg.query_selector('#homeDiscovery') is not None)
    check('ZH 首页-数据不足不显示发现卡', pg.query_selector('#homeDiscovery .hd-card') is None)

    # ---------------- 首页：洞察 ≥5 触发 ----------------
    pg.evaluate("a => localStorage.setItem('trf_archive', a)", SEED_ARCHIVE)
    pg.reload(wait_until='networkidle'); time.sleep(0.4)
    card = pg.query_selector('#homeDiscovery .hd-card')
    check('ZH 首页-洞察≥5 出现发现卡', card is not None)
    if card:
        txt = card.inner_text()
        check('ZH 首页-发现卡文案真实', '洞察' in txt and '认知档案' in txt, txt.replace('\n', ' ')[:80])

    # ---------------- 首页：行为实验 ≥3 触发（EN） ----------------
    # 注意：同一 origin 下 localStorage 跨页共享，先清空再测，避免前序 archive 种子污染
    pg.goto(BASE + 'index-en.html', wait_until='networkidle'); time.sleep(0.3)
    body = pg.inner_text('body')
    check('EN 首页-每日/深度分层', 'What would I like to do today?' in body and 'Something important' in body)
    check('EN 首页-设置移出主导航', 'Settings' not in (pg.inner_text('.nav-links') or ''))
    pg.evaluate("() => localStorage.removeItem('trf_archive')")
    pg.reload(wait_until='networkidle'); time.sleep(0.3)
    check('EN 首页-无数据不显示', pg.query_selector('#homeDiscovery .hd-card') is None)
    pg.evaluate("() => localStorage.removeItem('trf_archive')")
    pg.evaluate("""a => localStorage.setItem('trf_actions', a)""", json.dumps([
        {"id": "e%d" % i, "input": "t%d" % i, "status": "graduated", "totalDone": 3,
         "logs": [{"day": 1, "done": False, "reason": "忘了", "date": "2026-09-01"},
                  {"day": 2, "done": True, "date": "2026-09-02"}]} for i in range(1, 4)
    ], ensure_ascii=False))
    pg.reload(wait_until='networkidle'); time.sleep(0.4)
    card = pg.query_selector('#homeDiscovery .hd-card')
    check('EN 首页-行为实验≥3 出现发现卡', card is not None)
    if card:
        check('EN 首页-发现卡指向行为档案', 'Behavior Archive' in card.inner_text())

    # ---------------- 每日洞察 ----------------
    for f, lang, eyebrow, up in [
        ('think.html', 'ZH', '每日洞察 · 几分钟想清楚一件事', '值得认真处理'),
        ('think-en.html', 'EN', 'Daily Insight · See one thing clearly in minutes', 'Does this deserve a proper look?'),
    ]:
        pg.goto(BASE + f, wait_until='networkidle'); time.sleep(0.3)
        html = pg.content()
        check(f'{lang} 每日洞察-眉标', eyebrow in html)
        check(f'{lang} 每日洞察-升级入口', up in html)
        check(f'{lang} 每日洞察-语音预留常量', pg.evaluate("typeof VOICE_ENABLED !== 'undefined' && VOICE_ENABLED === false"))
        check(f'{lang} 每日洞察-语音插槽', pg.query_selector('#voiceSlot') is not None)

    # ---------------- 每日改变 ----------------
    for f, lang, kw, proof in [
        ('punch.html', 'ZH', '一直知道该怎么做', '已用行动证明'),
        ('punch-en.html', 'EN', 'You know exactly what to do', 'Proven by action'),
    ]:
        pg.goto(BASE + f, wait_until='networkidle'); time.sleep(0.3)
        html = pg.content()
        check(f'{lang} 每日改变-升级入口', kw in html)
        check(f'{lang} 每日改变-身份票→证据', proof in html)
        check(f'{lang} 每日改变-失败本地降级函数', pg.evaluate("typeof localFailAdvice === 'function'"))

    # ---------------- 伴我洞察 ----------------
    pg.goto(BASE + 'app.html', wait_until='networkidle'); time.sleep(0.4)
    html = pg.content(); body = pg.inner_text('body')
    check('ZH 伴我洞察-三阶段', '摊开' in body and '想透' in body and ('试试看' in html))
    check('ZH 伴我洞察-去术语', 'AI 帮我理一理' in html)
    check('ZH 伴我洞察-远应用强化', '换个完全不同的场景' in html)
    pg.goto(BASE + 'app-en.html', wait_until='networkidle'); time.sleep(0.4)
    html = pg.content()
    check('EN 伴我洞察-三阶段', 'Lay It Out' in html and 'See Through' in html and 'Try It' in html and 'Bank It' in html)
    check('EN 伴我洞察-远应用强化', 'A completely different scenario' in html)
    check('EN 伴我洞察-去术语', 'AI, help me sort these out' in html)

    # ---------------- 伴我改变 ----------------
    pg.goto(BASE + 'act.html', wait_until='networkidle'); time.sleep(0.4)
    html = pg.content()
    check('ZH 伴我改变-行为实验叙事', '行为实验' in html and '拆解目标' in html and '定下触发点' in html)
    check('ZH 伴我改变-身份证据化', '已用行动证明' in html)
    check('ZH 伴我改变-失败本地降级函数', pg.evaluate("typeof localFailAdvice === 'function'"))
    pg.goto(BASE + 'act-en.html', wait_until='networkidle'); time.sleep(0.4)
    html = pg.content()
    check('EN 伴我改变-行为实验叙事', 'behavior experiment' in html and 'Set the Trigger' in html)
    check('EN 伴我改变-身份证据化', 'Proven by action' in html)
    check('EN 伴我改变-失败本地降级函数', pg.evaluate("typeof localFailAdvice === 'function'"))

    # ---------------- 档案：主动发现 ----------------
    pg.goto(BASE + 'cognitive.html', wait_until='networkidle'); time.sleep(0.3)
    pg.evaluate("a => localStorage.setItem('trf_archive', a)", SEED_ARCHIVE)
    pg.reload(wait_until='networkidle'); time.sleep(0.4)
    check('ZH 认知档案-发现函数', pg.evaluate("typeof renderDiscovery === 'function'"))
    check('ZH 认知档案-发现卡出现', pg.query_selector('#discoveryBox .discovery-card') is not None)
    pg.goto(BASE + 'cognitive-en.html', wait_until='networkidle'); time.sleep(0.4)
    check('EN 认知档案-发现函数', pg.evaluate("typeof renderDiscovery === 'function'"))
    check('EN 认知档案-发现卡出现', pg.query_selector('#discoveryBox .discovery-card') is not None)
    check('EN 认知档案-页面完整(有脚本)', pg.evaluate("typeof renderAll === 'function'"))
    pg.goto(BASE + 'behavior-en.html', wait_until='networkidle'); time.sleep(0.4)
    check('EN 行为档案-发现函数', pg.evaluate("typeof renderDiscovery === 'function'"))
    check('EN 行为档案-发现容器', pg.query_selector('#discoveryBox') is not None)
    # ZH 行为档案：行为实验 ≥3 出现发现卡
    pg.goto(BASE + 'behavior.html', wait_until='networkidle'); time.sleep(0.3)
    pg.evaluate("""a => localStorage.setItem('trf_actions', a)""", json.dumps([
        {"id": "e%d" % i, "input": "t%d" % i, "status": "graduated", "totalDone": 3,
         "logs": [{"day": 1, "done": False, "reason": "忘了", "date": "2026-09-01"},
                  {"day": 2, "done": True, "date": "2026-09-02"}]} for i in range(1, 4)
    ], ensure_ascii=False))
    pg.reload(wait_until='networkidle'); time.sleep(0.5)
    check('ZH 行为档案-发现卡出现', pg.query_selector('#discoveryBox .discovery-card') is not None)

    # ---------------- 功能实测：没做到 → 本地降级建议 ----------------
    for f, lang, miss_txt, reason_txt, expect in [
        ('act.html', 'ZH', '今天没做到', '忘了', '调整建议'),
        ('act-en.html', 'EN', 'Missed today', 'Forgot', 'Adjustment'),
    ]:
        pg.goto(BASE + f, wait_until='networkidle'); time.sleep(0.3)
        pg.evaluate("""a => { localStorage.setItem('trf_actions', a);
            localStorage.setItem('trf_onboarded_act', '1');
            localStorage.setItem('trf_onboarded', '1'); }""", SEED_ACTIONS)
        pg.goto(BASE + f + '?id=seed1', wait_until='networkidle'); time.sleep(0.6)
        pg.evaluate("() => { const m = document.getElementById('onboardMask'); if (m) m.classList.remove('show'); }")
        btn = pg.query_selector(f"button:has-text('{miss_txt}')")
        check(f'{lang} 失败流-找到「{miss_txt}」按钮', btn is not None)
        if btn:
            btn.click(); time.sleep(0.3)
            r = pg.query_selector(f"button.reason:has-text('{reason_txt}')")
            check(f'{lang} 失败流-找到原因「{reason_txt}」', r is not None)
            if r:
                r.click(); time.sleep(1.6)
                box = pg.query_selector('#aiBlockResult')
                txt = box.inner_text() if box else ''
                check(f'{lang} 失败流-无 API Key 也给出建议', expect in txt and len(txt) > len(expect) + 10,
                      txt.replace('\n', ' ')[:70])
                check(f'{lang} 失败流-不显示报错文案', 'API' not in txt and '503' not in txt)

    b.close()

srv.terminate()
print('=== RESULTS ===')
ok = 0
for name, cond, extra in results:
    print(('PASS' if cond else 'FAIL'), '-', name, (('(' + extra + ')') if extra else ''))
    ok += 1 if cond else 0
print(f'--- {ok}/{len(results)} passed ---')
real_js = [e for e in errs if not e.startswith('CONSOLE Failed to load resource')]
print('=== JS ERRORS (real page errors only) ===')
print('\n'.join(real_js) if real_js else 'none')
print('=== 4xx ===')
print('\n'.join(bad) if bad else 'none')
sys.exit(0 if ok == len(results) and not real_js else 1)
