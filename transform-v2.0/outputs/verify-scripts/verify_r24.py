#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""R-24 每日改变 = 一张「改变任务清单」

David 的判定：原来的形态是「一天一张仪式卡」的打卡机 ——
天天设锚点、「做到了」、弹庆祝卡、「今天闭环·明天见」、「证据」，
而真正该看见的四件东西全丢了：要改变的任务、7 天拆解、逐日打勾、每天做了什么与产出物。

本脚本验证新形态：
  ① 要改变的任务常显  ② 7 天微行动清单常显  ③ 逐日打勾（checklist）
  ④ 每天记录「做了什么 + 产出物」（产出物可留空）
  ⑤ 锚点一次性设定、清单里每天提醒
  ⑥ 旧仪式已下线（做到了/今天闭环·明天见/独立证据按钮/身份确认步骤）
  ⑦ 硬约束仍在（tfEvidence/tfWitness id、升级链接带 goal+micro+fail、localFailTip）
"""
import subprocess, time, json
from playwright.sync_api import sync_playwright

ROOT = '/Users/davidma/WorkBuddy/workbuddy-agents-marketplace/transform-v2.0'
PORT = 8806
BASE = f'http://localhost:{PORT}/'
srv = subprocess.Popen(
    ['/Users/davidma/.workbuddy/binaries/python/versions/3.13.12/bin/python3', '-m', 'http.server', str(PORT)],
    cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1.2)

GOAL = '每天记录一个工作中高效协作的瞬间'
DAYS = [
    '写下今天一次协作，记一句我做了什么',
    '回忆今天一次自己参与的协作，写下一句：我做了什么让事情更顺。',
    '把一次协作拆成三个动作，各写一句',
    '换一个协作对象，再记一次',
    '找出一个让事情变慢的环节',
    '主动补上一句进度同步',
    '回看这一周，写下最有用的一招',
]
ANCHOR = '在我吃完午饭后'

SEED = """
() => {
  const iso = d => new Date(Date.now() - d * 864e5).toISOString();
  const days = %s;
  const plan = days.map((m, i) => ({ day: i + 1, micro: m, sub: [], subDone: [] }));
  const action = {
    id: 'r24a', input: %s, createdAt: iso(4), targetDays: 7, currentDay: 3,
    plan: plan,
    logs: [
      { day: 1, date: iso(2), done: true, note: '我在站会上把阻塞点说清楚了', output: '一段 3 行记录', difficulty: null, rescued: false, reason: null },
      { day: 2, date: iso(1), done: true, note: '我把手上的进度同步给了同事', output: '', difficulty: null, rescued: false, reason: null }
    ],
    status: 'active', streak: 2, totalDone: 2, bestStreak: 2,
    anchor: { after: %s }, reminder: '', identity: '', celebration: '',
    support: { people: [], tools: [], info: [] }, source: 'punch', insight: '', scenario: ''
  };
  localStorage.setItem('trf_actions', JSON.stringify([action]));
  localStorage.setItem('trf_archive', JSON.stringify([]));
  localStorage.setItem('trf_trash', JSON.stringify([]));
  localStorage.setItem('trf_profile', JSON.stringify({ identityStatements: [] }));
  localStorage.setItem('trf_onboarded', '1');
  localStorage.setItem('trf_onboarded_act', '1');
  localStorage.removeItem('trf_ai_config_v1');
  localStorage.removeItem('trf_ui');
  localStorage.removeItem('trf_session_draft');
  localStorage.removeItem('trf_punch_rd_date');
  localStorage.removeItem('trf_actions_seed');
}
""" % (json.dumps(DAYS, ensure_ascii=False), json.dumps(GOAL, ensure_ascii=False), json.dumps(ANCHOR, ensure_ascii=False))

# 全 7 天已完成的种子（毕业态）
SEED_GRAD = SEED.replace("currentDay: 3", "currentDay: 8").replace("status: 'active'", "status: 'graduated'").replace(
    """    logs: [
      { day: 1, date: iso(2), done: true, note: '我在站会上把阻塞点说清楚了', output: '一段 3 行记录', difficulty: null, rescued: false, reason: null },
      { day: 2, date: iso(1), done: true, note: '我把手上的进度同步给了同事', output: '', difficulty: null, rescued: false, reason: null }
    ],""",
    "logs: " + json.dumps([{"day": d, "date": "2026-09-0%dT10:00:00.000Z" % min(d, 9), "done": True,
                            "note": "第 %d 天的记录" % d, "output": "产出 %d" % d,
                            "difficulty": None, "rescued": False, "reason": None} for d in range(1, 8)], ensure_ascii=False) + ",")

results = []
def check(n, c, e=''): results.append((n, bool(c), e))


def seed(pg, js, url='punch.html'):
    pg.goto(BASE + 'punch.html', wait_until='networkidle')
    pg.evaluate(js)
    pg.goto(BASE + url, wait_until='networkidle')
    time.sleep(0.6)


with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome')
    ctx = b.new_context(viewport={'width': 1280, 'height': 1000})
    pg = ctx.new_page()
    errs = []
    pg.on('pageerror', lambda e: errs.append('PAGEERR ' + str(e)))
    pg.on('console', lambda m: errs.append('CONSOLE ' + m.text)
          if m.type == 'error' and 'favicon' not in m.text and 'Failed to load resource' not in m.text else None)

    # ================== A. 清单形态 ==================
    seed(pg, SEED)

    goal = pg.evaluate("() => { const e = document.querySelector('.ck-head .ck-goal'); return e ? e.innerText.trim() : null; }")
    check('R-24a 要改变的任务常显（清单顶部）', goal == GOAL, repr(goal))

    atag = pg.evaluate("() => { const e = document.querySelector('.ck-anchor-tag'); return e ? e.innerText.trim() : null; }")
    check('R-24b 锚点一次性设定后常显在任务头（展示已归一化）',
          atag and '我吃完午饭后' in atag and '在「在' not in atag, repr(atag))

    segs = pg.evaluate("() => Array.from(document.querySelectorAll('.ck-prog .ck-seg')).map(s => s.className.replace('ck-seg','').trim())")
    check('R-24c 进度 = 7 段，已完成 2 段 + 今天 1 段',
          len(segs) == 7 and segs.count('on') == 2 and segs.count('cur') == 1, str(segs))

    rows = pg.evaluate("""() => Array.from(document.querySelectorAll('.ck-list .ck-row')).map(r => ({
        cls: r.className, day: (r.querySelector('.ck-dnum') || {}).innerText || '',
        txt: (r.querySelector('.ck-txt') || {}).innerText || '',
        micro: (r.querySelector('.ck-micro') || {}).innerText || '' }))""")
    check('R-24d 7 天微行动全部常显（清单一次看全）', len(rows) == 7, f'{len(rows)} 行')
    texts = [r['txt'] or r['micro'] for r in rows]
    missing = [d for d in DAYS[2:] if not any(d[:12] in t for t in texts)]
    check('R-24e 每一天的微任务文本都在清单里', not missing, f'缺失 {missing}')
    check('R-24f 已完成 2 行 + 今天 1 行',
          sum(1 for r in rows if 'done' in r['cls']) == 2 and sum(1 for r in rows if 'today' in r['cls']) == 1,
          str([r['cls'] for r in rows]))

    # ================== B. 每天记录「做了什么 + 产出物」 ==================
    has = pg.evaluate("""() => ({
        note: !!document.getElementById('ckNote'),
        out: !!document.getElementById('ckOutput'),
        btn: !!document.getElementById('ckDoBtn'),
        btnDisabled: (document.getElementById('ckDoBtn') || {}).disabled })""")
    check('R-24g 今天行有「我做了什么」「产出物」两个输入框', has['note'] and has['out'], str(has))
    check('R-24h 未填「做了什么」时打勾按钮禁用', has['btnDisabled'] is True, str(has))

    pg.fill('#ckOutput', '一份发给对方的清单')
    time.sleep(0.2)
    check('R-24i 只填产出物、没填做了什么 → 仍禁用',
          pg.evaluate("() => document.getElementById('ckDoBtn').disabled") is True, '')

    pg.fill('#ckNote', '午饭时我把手上的进度同步给了对方')
    time.sleep(0.3)
    check('R-24j 写了「做了什么」→ 打勾可用',
          pg.evaluate("() => document.getElementById('ckDoBtn').disabled") is False, '')

    # ================== C. 打勾 → 逐日推进 + 记录落库 ==================
    pg.click('#ckDoBtn')
    time.sleep(0.8)

    after = pg.evaluate("""() => {
        const segs = Array.from(document.querySelectorAll('.ck-prog .ck-seg')).map(s => s.className);
        const rows = Array.from(document.querySelectorAll('.ck-list .ck-row')).map(r => r.className);
        const d3 = document.getElementById('ck-day-3');
        return { on: segs.filter(c => c.includes('on')).length,
                 cur: segs.filter(c => c.includes('cur')).length,
                 d3: d3 ? d3.className : null,
                 d3open: d3 ? d3.hasAttribute('open') : false,
                 d3text: d3 ? d3.innerText.replace(/\\n/g, ' ') : '',
                 doneCount: rows.filter(c => c.includes('done')).length,
                 todayCount: rows.filter(c => c.includes('today')).length };
    }""")
    check('R-24k 打勾后进度变 3 段已完成', after['on'] == 3, str(after))
    check('R-24l 打勾后 Day3 变为已完成', after['d3'] and 'done' in after['d3'], str(after['d3']))
    check('R-24m 打勾后「今天」自动移到 Day4',
          after['todayCount'] == 1 and after['doneCount'] == 3, str(after))
    check('R-24n 刚打勾那天就地展开、看得到自己写的记录',
          after['d3open'] and '午饭时我把手上的进度同步给了对方' in after['d3text']
          and '一份发给对方的清单' in after['d3text'], after['d3text'][:120])

    logs = pg.evaluate("() => (JSON.parse(localStorage.getItem('trf_actions'))[0] || {}).logs || []")
    d3 = [l for l in logs if l.get('day') == 3 and l.get('done')]
    check('R-24o 记录已落库：day3 有 note + output',
          len(d3) == 1 and d3[0].get('note') == '午饭时我把手上的进度同步给了对方'
          and d3[0].get('output') == '一份发给对方的清单', json.dumps(d3, ensure_ascii=False)[:160])

    # ================== D. 已完成行可展开回看当天记录 ==================
    rec = pg.evaluate("""() => {
        const d1 = document.getElementById('ck-day-1');
        if (!d1) return null;
        d1.setAttribute('open', '');
        return { text: d1.innerText.replace(/\\n/g, ' '), hasK: !!d1.querySelector('.ck-rec-k') };
    }""")
    check('R-24p 已完成行可展开看当天记录（做了什么 + 产出物）',
          rec and rec['hasK'] and '我在站会上把阻塞点说清楚了' in rec['text'] and '一段 3 行记录' in rec['text'],
          (rec or {}).get('text', '')[:120])

    # ================== E. 旧仪式已下线 ==================
    gone = pg.evaluate("""() => ({
        ctaDone: document.querySelectorAll('.cta-done').length,
        ctaMiss: document.querySelectorAll('.cta-miss').length,
        ctaOk: document.querySelectorAll('.cta-ok').length,
        doneBtn: !!document.getElementById('doneBtn'),
        identityInput: !!document.getElementById('identityInput'),
        bodyHasClose: document.body.innerText.includes('今天闭环'),
        bodyHasTomorrow: document.body.innerText.includes('明天见'),
        evidBtn: Array.from(document.querySelectorAll('a,button')).filter(e => (e.innerText || '').trim() === '证据').length,
        steps: Array.from(document.querySelectorAll('#punchStepsBarWrap .p-label')).map(e => e.innerText.trim())
    })""")
    check('R-24q 「做到了」大按钮已下线', gone['ctaDone'] == 0 and not gone['doneBtn'], str(gone))
    check('R-24r 「今天没做到」改为清单内的轻链接',
          gone['ctaMiss'] == 0 and pg.evaluate("() => !!document.querySelector('.ck-miss-link')") is True, str(gone))
    check('R-24s 「今天闭环 · 明天见」已下线',
          gone['ctaOk'] == 0 and not gone['bodyHasClose'] and not gone['bodyHasTomorrow'], str(gone))
    check('R-24t 独立的「证据」按钮已下线（改为清单底部复盘出口）', gone['evidBtn'] == 0, str(gone['evidBtn']))
    check('R-24u 创建流程去掉身份确认与每天设锚点（有实验时不显示步骤条）',
          not gone['identityInput'] and gone['steps'] == [], str(gone['steps']))

    # ================== F. 硬约束（既有验收依赖） ==================
    hard = pg.evaluate("""() => ({
        ev: !!document.getElementById('tfEvidence'),
        wi: !!document.getElementById('tfWitness'),
        link: (document.querySelector('.tu-link') || {}).getAttribute ? document.querySelector('.tu-link').getAttribute('href') : null,
        tip: typeof localFailTip === 'function'
    })""")
    check('R-24v 保留 id=tfEvidence / id=tfWitness（P0 身份票→证据）', hard['ev'] and hard['wi'], str(hard))
    ok_link = bool(hard['link']) and 'act.html?' in hard['link'] and 'goal=' in hard['link'] and 'micro=' in hard['link']
    check('R-24w 升级链接仍在（底部复盘出口）且带 goal/micro', ok_link, str(hard['link']))
    check('R-24x localFailTip 仍在（无 AI key 的本地降级）', hard['tip'] is True, str(hard))

    # ================== G. 「没做到」支路仍可用（干净状态单独验） ==================
    seed(pg, SEED)
    pg.click('.ck-miss-link')
    time.sleep(0.4)
    vis = pg.evaluate("() => { const b = document.getElementById('blockBox'); return b && getComputedStyle(b).display !== 'none'; }")
    check('R-24y 点「今天没做到」→ 出现原因选择（帮助而非审判）', vis is True, str(vis))
    pg.evaluate("() => pickBlock('忘了')")
    time.sleep(0.4)
    rescue = pg.evaluate("() => { const r = document.getElementById('blockRescue'); return r ? r.innerText.replace(/\\n/g,' ') : ''; }")
    check('R-24z 选原因后当场给出「最小版」', '最小版' in rescue, rescue[:120])
    pg.evaluate("() => markDoneRescued('忘了')")
    time.sleep(0.8)
    lg = pg.evaluate("() => (JSON.parse(localStorage.getItem('trf_actions'))[0] || {}).logs || []")
    rr = [l for l in lg if l.get('rescued')]
    check('R-24aa 最小版补做记为完成（接住比完美重要）', len(rr) == 1 and rr[0].get('done') is True, json.dumps(rr, ensure_ascii=False)[:140])

    # ================== H. 7 天走完 → 清单留存 + 出口去复盘 ==================
    seed(pg, SEED_GRAD, 'punch.html?id=r24a')
    grad = pg.evaluate("""() => {
        const segs = Array.from(document.querySelectorAll('.ck-prog .ck-seg')).map(s => s.className);
        const rows = Array.from(document.querySelectorAll('.ck-list .ck-row')).map(r => r.className);
        return { on: segs.filter(c => c.includes('on')).length,
                 doneRows: rows.filter(c => c.includes('done')).length,
                 goal: (document.querySelector('.ck-head .ck-goal') || {}).innerText || '',
                 link: (document.querySelector('.tu-link') || {}).getAttribute ? document.querySelector('.tu-link').getAttribute('href') : null,
                 text: document.body.innerText };
    }""")
    check('R-24ab 走完 7 天：清单留存、全部打勾', grad['on'] == 7 and grad['doneRows'] == 7, str({k: grad[k] for k in ('on', 'doneRows')}))
    check('R-24ac 走完 7 天：任务仍在眼前（清单就是记录）', grad['goal'] == GOAL, repr(grad['goal']))
    check('R-24ad 走完 7 天：有「去复盘沉淀」出口', bool(grad['link']) and 'act.html?' in grad['link'], str(grad['link']))
    check('R-24ae 走完 7 天：整轮记录可回看', '第 1 天的记录' in grad['text'] or pg.evaluate(
        "() => { const d=document.getElementById('ck-day-1'); if(!d) return false; d.setAttribute('open',''); return d.innerText.includes('第 1 天的记录'); }") is True, '')

    # ================== H2. 锚点措辞归一化（避免「在「在…」之后做」） ==================
    at = pg.evaluate("() => [anchorText('在早上打开电脑之后'), anchorText('在我吃完午饭后'), anchorText('在晚上睡前'), anchorText('在午饭后'), anchorText('')]")
    check('R-24ag 锚点措辞归一化：去掉重复的「在」「之后」',
          at == ['早上打开电脑', '我吃完午饭后', '晚上睡前', '午饭后', ''], str(at))
    seed(pg, SEED)
    hdr = pg.evaluate("() => (document.querySelector('.ck-anchor-tag') || {}).innerText || ''")
    tip = pg.evaluate("() => (document.querySelector('.ck-anchor-tip') || {}).innerText || ''")
    check('R-24ah 任务头锚点不再出现「在「在…」」', '在「在' not in hdr and '我吃完午饭后' in hdr, repr(hdr))
    check('R-24ai 今天行锚点提示不再出现「在「在…」」', '在「在' not in tip and '我吃完午饭后' in tip, repr(tip))

    # ================== I. 无 JS 错误 ==================
    real = [e for e in errs if 'favicon' not in e and 'Failed to load resource' not in e]
    check('R-24af 全程 0 JS 错误', not real, '; '.join(real[:3]))

    # 证据截图由 shot_r24.py 统一产出（见 outputs/rev-r24-2026-09-14/）
    b.close()

srv.terminate()

ok = sum(1 for _, c, _ in results if c)
print(f'\n=== R-24 每日改变清单形态：{ok}/{len(results)} passed ===')
for n, c, e in results:
    if not c:
        print(f'  FAIL  {n}   {e}')
