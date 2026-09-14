#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""R-18 act.html（做到 · 完整四步）逐屏走通：
   写下 → 拆解细分 → 行动锚定 → 反馈强化 → 产出（复盘沉淀）
   每个阶段断言「唯一可见阶段 + 数据已持久化」，全程截图存证，最后断言入档成功。
   全程用带延迟的桩替换 aiCall（不联网、不消耗 Key），验证真实代码路径。
"""
import subprocess, time, sys
from playwright.sync_api import sync_playwright

ROOT = '/Users/davidma/WorkBuddy/workbuddy-agents-marketplace/transform-v2.0'
OUT = ROOT + '/outputs/rev-b4-2026-09-14'
PORT = 8802
BASE = f'http://localhost:{PORT}/'
srv = subprocess.Popen(
    ['/Users/davidma/.workbuddy/binaries/python/versions/3.13.12/bin/python3', '-m', 'http.server', str(PORT)],
    cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1.2)

HELPERS = """
window.__h = {
  stages: () => ['input','decompose','anchor','dashboard','reflection'].map(s => {
    const el = document.getElementById('stage-' + s);
    return (!el || el.classList.contains('hidden')) ? null : s;
  }).filter(Boolean),
  act: () => JSON.parse(localStorage.getItem('trf_actions') || '[]')[0] || null,
  acts: () => JSON.parse(localStorage.getItem('trf_actions') || '[]'),
  profile: () => JSON.parse(localStorage.getItem('trf_profile') || '{}')
};
"""

results, errs = [], []
def check(n, c, e=''): results.append((n, bool(c), e))

with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome')
    ctx = b.new_context(viewport={'width': 1280, 'height': 960}, device_scale_factor=2)
    pg = ctx.new_page()
    pg.on('pageerror', lambda e: errs.append('PAGEERR ' + str(e)))
    badresp = []
    pg.on('console', lambda m: errs.append('CONSOLE ' + m.text) if m.type == 'error' and 'favicon' not in m.text and 'Failed to load resource' not in m.text else None)
    pg.on('response', lambda r: badresp.append((r.status, r.url)) if r.status >= 400 and 'favicon' not in r.url else None)

    pg.goto(BASE + 'act.html', wait_until='networkidle')
    pg.evaluate("""() => {
      localStorage.clear();
      localStorage.setItem('trf_onboarded','1');
      localStorage.setItem('trf_onboarded_act','1');
    }""")
    pg.reload(wait_until='networkidle'); time.sleep(0.6)
    pg.evaluate(HELPERS)
    pg.evaluate("() => document.querySelectorAll('.onboard-mask,.mask,.modal-mask').forEach(m => m.style.display='none')")

    # 桩：按提示词形态返回合法文本（不联网）
    pg.evaluate("""() => {
      window.aiCall = async (prompt) => {
        await new Promise(r => setTimeout(r, 350));
        if (/每行格式：天数/.test(prompt)) {
          const m = prompt.match(/第 (\\d+)[–-](\\d+) 天/);
          const a = m ? parseInt(m[1], 10) : 1, z = m ? parseInt(m[2], 10) : 7;
          const out = [];
          for (let i = a; i <= z; i++) out.push(i + '|写' + i + '0' + '0字并留一句');
          return out.join('\\n');
        }
        return '写下一句今天的收获';
      };
    }""")

    # ---------- ① 写下 ----------
    v = pg.evaluate("() => window.__h.stages()")
    check('R-18a 起始停在「写下」阶段（唯一可见）', v == ['input'], f"stages={v}")
    pg.screenshot(path=OUT + '/r18_1_input.png')

    # ---------- ② 拆解细分 ----------
    pg.evaluate("""() => {
      document.getElementById('changeInput').value = '每天写作 300 字，坚持一周';
      setDays(7);
      startChange();
    }""")
    time.sleep(0.5)
    v = pg.evaluate("() => window.__h.stages()")
    a = pg.evaluate("() => window.__h.act()")
    check('R-18b 进入「拆解细分」且已落库（7 天计划）', v == ['decompose'] and a and a['targetDays'] == 7 and len(a['plan']) == 7, f"stages={v} targetDays={(a or {}).get('targetDays')} plan={len((a or {}).get('plan') or [])}")
    pg.screenshot(path=OUT + '/r18_2_decompose.png')

    # ---------- ③ AI 排计划（桩）----------
    pg.evaluate("() => aiGeneratePlan()")
    time.sleep(1.6)
    a = pg.evaluate("() => window.__h.act()")
    filled = len([d for d in a['plan'] if (d.get('micro') or '').strip()])
    ai_txt = pg.evaluate("() => (document.getElementById('aiPlanResult')||{}).innerText || ''")
    check('R-18c AI 排满 7 天微行动并落库', filled == 7 and '已为你排好' in ai_txt, f"filled={filled} ai={ai_txt[:40]!r}")
    pg.screenshot(path=OUT + '/r18_3_plan_ai.png', full_page=True)

    # ---------- ④ 行动锚定 ----------
    pg.evaluate("""() => {
      pickAnchor('早餐之后');
      document.getElementById('identityInput').value = '一个每天写作的人';
      goAnchor();
    }""")
    time.sleep(0.5)
    v = pg.evaluate("() => window.__h.stages()")
    a = pg.evaluate("() => window.__h.act()")
    check('R-18d 进入「行动锚定」，锚点与身份已落库', v == ['anchor'] and a['stage'] == 'anchor' and a['identity'] == '一个每天写作的人', f"stages={v} stage={(a or {}).get('stage')} identity={(a or {}).get('identity')!r}")
    pg.screenshot(path=OUT + '/r18_4_anchor.png')

    # ---------- ⑤ 反馈强化（第 1 天）----------
    pg.evaluate("() => doFirstTime()")
    time.sleep(1.0)
    v = pg.evaluate("() => window.__h.stages()")
    a = pg.evaluate("() => window.__h.act()")
    prof = pg.evaluate("() => window.__h.profile()")
    votes = ((prof.get('identityStatements') or [{}])[0] or {}).get('votes')
    check('R-18e 进入「反馈强化」，第 1 天计入 + 身份票 +1', v == ['dashboard'] and a['totalDone'] == 1 and a['currentDay'] == 2 and votes == 1, f"stages={v} totalDone={(a or {}).get('totalDone')} day={(a or {}).get('currentDay')} votes={votes}")
    pg.screenshot(path=OUT + '/r18_5_dashboard.png', full_page=True)

    # ---------- ⑥ 走完剩余天数 → 毕业 ----------
    for _ in range(12):
        st = pg.evaluate("() => (window.__h.act()||{}).status")
        if st == 'graduated':
            break
        pg.evaluate("() => markDone()")
        time.sleep(0.45)
    a = pg.evaluate("() => window.__h.act()")
    v = pg.evaluate("() => window.__h.stages()")
    check('R-18f 走满 7 天 → 毕业并自动进入「产出」', a['status'] == 'graduated' and a['totalDone'] == 7 and v == ['reflection'], f"status={(a or {}).get('status')} totalDone={(a or {}).get('totalDone')} stages={v}")
    pg.screenshot(path=OUT + '/r18_6_reflection.png', full_page=True)

    # ---------- ⑦ 复盘沉淀 → 入档 ----------
    pg.evaluate("""() => {
      document.getElementById('reBWhat').value = '我做到了连续 7 天写作';
      document.getElementById('reBLearned').value = '把动作切到 30 秒内就能开始';
      document.getElementById('reBChanged').value = '我不再等有灵感才动笔';
      document.getElementById('reBResultText').value = '写完了 2100 字';
      document.getElementById('reBHabit').value = '早餐后先写 300 字再开电脑';
      saveReflectionB();
    }""")
    time.sleep(0.6)
    a = pg.evaluate("() => window.__h.act()")
    ok_visible = pg.evaluate("() => { const b = document.getElementById('archiveSuccess'); return !!b && !b.classList.contains('hidden'); }")
    print_ok = pg.evaluate("() => { const b = document.getElementById('reflSaveBtn'); return b ? b.textContent.trim() : ''; }")
    check('R-18g 复盘写入并落库（reflection/result/habit）',
          bool(a.get('reflection')) and a['reflection'].get('what') == '我做到了连续 7 天写作'
          and a.get('result') == '写完了 2100 字' and a.get('habit') == '早餐后先写 300 字再开电脑',
          f"reflection={(a or {}).get('reflection')} result={(a or {}).get('result')!r}")
    check('R-18h 入档成功提示可见 + 主按钮切为「继续调整复盘」', ok_visible and '继续调整复盘' in print_ok, f"success={ok_visible} btn={print_ok!r}")
    pg.screenshot(path=OUT + '/r18_7_archived.png', full_page=True)

    # ---------- ⑧ 入档结果可被「我的资产 · 证据」读到 ----------
    listed = pg.evaluate("() => window.__h.acts().length")
    rec = pg.evaluate("() => { const a = window.__h.act(); return { id: a.id, status: a.status, totalDone: a.totalDone, reflectedAt: !!a.reflectedAt, loggedDays: (a.logs||[]).filter(l=>l.done).length }; }")
    check('R-18i 入档成功：实验可在数据层被读到且字段完整',
          listed == 1 and rec['status'] == 'graduated' and rec['totalDone'] == 7 and rec['reflectedAt'] and rec['loggedDays'] == 7,
          f"n={listed} {rec}")

    # 去 behavior.html 确认真实可见
    pg.goto(BASE + 'behavior.html', wait_until='networkidle'); time.sleep(0.6)
    pg.evaluate("() => document.querySelectorAll('.onboard-mask,.mask,.modal-mask').forEach(m => m.style.display='none')")
    pg.evaluate("() => document.querySelectorAll('.fold-card').forEach(c => c.classList.add('open'))")
    time.sleep(0.3)
    txt = pg.evaluate("() => (document.getElementById('actionList')||{}).innerText || ''")
    check('R-18j 「证据」页读到该实验（无断点）', '每天写作 300 字' in txt and ('交付' in txt or '已完成全部' in txt or '已毕业' in txt or '7' in txt), f"txt={txt[:90]!r}")
    pg.screenshot(path=OUT + '/r18_8_behavior_evidence.png', full_page=True)

    check('R-18k 无真实资源 4xx/5xx', len(badresp) == 0, f"{badresp[:3]}")

    b.close()

srv.terminate()
ok = 0
for n, c, e in results:
    print(('PASS' if c else 'FAIL'), '-', n, (e and ('(' + str(e) + ')') or '')); ok += 1 if c else 0
print(f'--- {ok}/{len(results)} passed ---')
print('=== JS ERRORS ==='); print('\n'.join(errs) if errs else 'none')
sys.exit(0 if ok == len(results) and not errs else 1)
