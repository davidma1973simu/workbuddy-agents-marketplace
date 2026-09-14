#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""R-17 验收：
   ① 等待态出现「分步进度」文案（用真实数据：N 条信息 / M 组现象 / K 轮问答）
   ② 等待结束进度必须消失（无残影）
   ③ 结果就地展开追加 —— 已有内容不被清除；「采用 / 保留」由用户决定
   ④ 首次（空）路径仍然直接填充，不增加一步点击
"""
import subprocess, time, sys
from playwright.sync_api import sync_playwright

ROOT = '/Users/davidma/WorkBuddy/workbuddy-agents-marketplace/transform-v2.0'
PORT = 8786
BASE = f'http://localhost:{PORT}/'
srv = subprocess.Popen(
    ['/Users/davidma/.workbuddy/binaries/python/versions/3.13.12/bin/python3', '-m', 'http.server', str(PORT)],
    cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1.2)

results, errs = [], []
def check(n, c, e=''): results.append((n, bool(c), e))

DELAY_MS = 2600
SETUP = """() => {
  state.data.scenario = '要不要跳槽';
  state.data.groups = [
    { label: '收入', notes: [{ text: 'a' }, { text: 'b' }] },
    { label: '成长', notes: [{ text: 'c' }] }
  ];
  state.data.insightQuestions = ['问题一', '问题二'];
  state.data.insightAnswers = ['答一', '答二'];
  state.data.insightPersonalView = '我的整体看法';
  if (!document.getElementById('__btn')) {
    const host = document.createElement('div');
    host.innerHTML = '<button id="__btn">让Transform总结</button>';
    document.body.appendChild(host);
  }
}"""

with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome')
    pg = b.new_context().new_page()
    pg.on('pageerror', lambda e: errs.append('PAGEERR ' + str(e)))
    pg.on('console', lambda m: errs.append('CONSOLE ' + m.text) if m.type == 'error' and 'favicon' not in m.text else None)

    pg.goto(BASE + 'app.html', wait_until='networkidle')
    pg.evaluate("() => { localStorage.setItem('trf_onboarded','1'); localStorage.setItem('trf_onboarded_act','1'); }")
    pg.reload(wait_until='networkidle'); time.sleep(0.5)
    pg.evaluate("() => document.querySelectorAll('.onboard-mask,.mask,.modal-mask').forEach(m => m.style.display='none')")

    # 用带延迟的桩替换真实 AI 调用（不消耗 API，不联网）
    pg.evaluate("""(d) => {
      window.aiCall = async () => {
        await new Promise(r => setTimeout(r, d));
        return '{"nature":"AI写的本质","newInsight":"AI写的洞察"}';
      };
    }""", DELAY_MS)
    pg.evaluate(SETUP)

    # ---------- ① 等待态：分步进度 ----------
    pg.evaluate("() => { state.data.essence = {}; restoreEssenceUI(); document.getElementById('__btn').onclick = function(){ aiIntegrate(this); }; }")
    pg.evaluate("() => document.getElementById('__btn').click()")
    time.sleep(1.0)
    steps = pg.evaluate("() => Array.from(document.querySelectorAll('.ai-steps .st')).map(e => e.innerText.trim())")
    cur = pg.evaluate("() => { const e = document.querySelector('.ai-steps .st.cur'); return e ? e.innerText.trim() : ''; }")
    check('R-17a 等待态出现分步进度（≥3 步）', len(steps) >= 3, f'steps={steps}')
    check('R-17b 第一步含真实条目数（3 条信息）', any('3 条信息' in s for s in steps), f'steps={steps}')
    check('R-17c 第二步含真实分组数（2 组现象）', any('2 组现象' in s for s in steps), f'steps={steps}')
    check('R-17d 有且仅有一个「当前步」高亮', bool(cur) and sum(1 for s in steps if s == cur) >= 1, f'cur={cur}')

    # ---------- ② 结束后无残影 + ④ 空路径直接填充 ----------
    time.sleep(2.6)
    left = pg.evaluate("() => document.querySelectorAll('.ai-steps').length")
    nat = pg.evaluate("() => (document.getElementById('essenceNature') || {}).value || ''")
    check('R-17e 等待结束进度无残影', left == 0, f'left={left}')
    check('R-17f 空路径：首次整合直接填充（无需多一次点击）', nat == 'AI写的本质', f'value={nat!r}')

    # ---------- ③ 非破坏：已有内容不被清除 ----------
    pg.evaluate("() => { state.data.essence = { nature: '我自己的本质', insight: '我自己的洞察' }; state.data.confirmed = false; restoreEssenceUI(); }")
    before = pg.evaluate("() => (document.getElementById('essenceNature') || {}).value || ''")
    pg.evaluate("() => document.getElementById('__btn').click()")
    time.sleep(DELAY_MS / 1000 + 0.9)
    after = pg.evaluate("() => (document.getElementById('essenceNature') || {}).value || ''")
    hasSug = pg.evaluate("() => document.querySelectorAll('.ai-suggest').length")
    sugTxt = pg.evaluate("() => { const e = document.querySelector('.ai-suggest'); return e ? e.innerText : ''; }")
    check('R-17g 已有内容在 AI 返回后依然保留', before == '我自己的本质' and after == '我自己的本质', f'before={before!r} after={after!r}')
    check('R-17h 新版建议就地展开（不覆盖）', hasSug == 1 and 'AI写的本质' in sugTxt, f'suggest={hasSug} text={sugTxt[:60]!r}')

    # 保留我的 → 建议消失，原内容不动
    pg.evaluate("() => dismissAISuggest()")
    time.sleep(0.25)
    kept = pg.evaluate("() => ({ sug: document.querySelectorAll('.ai-suggest').length, v: (document.getElementById('essenceNature')||{}).value })")
    check('R-17i 「保留我的」→ 建议收起且原内容不动', kept['sug'] == 0 and kept['v'] == '我自己的本质', f"{kept}")

    # 采用这一版 → 写入
    pg.evaluate("() => document.getElementById('__btn').click()")
    time.sleep(DELAY_MS / 1000 + 0.9)
    pg.evaluate("() => adoptAISuggest()")
    time.sleep(0.3)
    adopted = pg.evaluate("() => ({ sug: document.querySelectorAll('.ai-suggest').length, v: (document.getElementById('essenceNature')||{}).value })")
    check('R-17j 「采用这一版」→ 写入且建议收起', adopted['sug'] == 0 and adopted['v'] == 'AI写的本质', f"{adopted}")

    b.close()

srv.terminate()
ok = 0
for n, c, e in results:
    print(('PASS' if c else 'FAIL'), '-', n, (e and ('(' + str(e) + ')') or '')); ok += 1 if c else 0
print(f'--- {ok}/{len(results)} passed ---')
print('=== JS ERRORS ==='); print('\n'.join(errs) if errs else 'none')
sys.exit(0 if ok == len(results) and not errs else 1)
