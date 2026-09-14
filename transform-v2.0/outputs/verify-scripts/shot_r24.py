#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""R-24 证据截图：清单默认态 / 填写态 / 打勾后回看 / 7 天走完 / 窄屏 375"""
import subprocess, time, json
from playwright.sync_api import sync_playwright

ROOT = '/Users/davidma/WorkBuddy/workbuddy-agents-marketplace/transform-v2.0'
OUT = f'{ROOT}/outputs/rev-r24-2026-09-14'
PORT = 8807
BASE = f'http://localhost:{PORT}/'
srv = subprocess.Popen(
    ['/Users/davidma/.workbuddy/binaries/python/versions/3.13.12/bin/python3', '-m', 'http.server', str(PORT)],
    cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1.2)

GOAL = '每天记录一个工作中高效协作的瞬间'
DAYS = ['写下今天一次协作，记一句我做了什么',
        '回忆今天一次自己参与的协作，写下一句：我做了什么让事情更顺。',
        '把一次协作拆成三个动作，各写一句',
        '换一个协作对象，再记一次',
        '找出一个让事情变慢的环节',
        '主动补上一句进度同步',
        '回看这一周，写下最有用的一招']

SEED = """
() => {
  const iso = d => new Date(Date.now() - d * 864e5).toISOString();
  const days = %s;
  const plan = days.map((m, i) => ({ day: i + 1, micro: m, sub: [], subDone: [] }));
  localStorage.setItem('trf_actions', JSON.stringify([{
    id: 'r24a', input: %s, createdAt: iso(4), targetDays: 7, currentDay: 3, plan: plan,
    logs: [
      { day: 1, date: iso(2), done: true, note: '我在站会上把阻塞点说清楚了', output: '一段 3 行记录', difficulty: null, rescued: false, reason: null },
      { day: 2, date: iso(1), done: true, note: '', output: '', difficulty: null, rescued: false, reason: null }
    ],
    status: 'active', streak: 2, totalDone: 2, bestStreak: 2,
    anchor: { after: '在我吃完午饭后' }, reminder: '', identity: '', celebration: '',
    support: { people: [], tools: [], info: [] }, source: 'punch', insight: '', scenario: ''
  }]));
  localStorage.setItem('trf_archive', '[]'); localStorage.setItem('trf_trash', '[]');
  localStorage.setItem('trf_profile', JSON.stringify({ identityStatements: [] }));
  localStorage.setItem('trf_onboarded', '1'); localStorage.setItem('trf_onboarded_act', '1');
  localStorage.removeItem('trf_ai_config_v1'); localStorage.removeItem('trf_ui'); localStorage.removeItem('trf_punch_rd_date');
}
""" % (json.dumps(DAYS, ensure_ascii=False), json.dumps(GOAL, ensure_ascii=False))

SEED_GRAD = """
() => {
  const days = %s;
  const plan = days.map((m, i) => ({ day: i + 1, micro: m, sub: [], subDone: [] }));
  const logs = days.map((_, i) => ({ day: i + 1, date: '2026-09-0' + (i + 1) + 'T10:00:00.000Z', done: true,
    note: '第 ' + (i + 1) + ' 天我实际做了什么', output: i %% 2 ? '' : ('产出 ' + (i + 1)), difficulty: null, rescued: false, reason: null }));
  localStorage.setItem('trf_actions', JSON.stringify([{
    id: 'r24a', input: %s, createdAt: '2026-09-05T10:00:00.000Z', targetDays: 7, currentDay: 8, plan: plan, logs: logs,
    status: 'graduated', streak: 7, totalDone: 7, bestStreak: 7, graduatedAt: '2026-09-11T10:00:00.000Z',
    anchor: { after: '在我吃完午饭后' }, reminder: '', identity: '', celebration: '',
    support: { people: [], tools: [], info: [] }, source: 'punch', insight: '', scenario: ''
  }]));
  localStorage.setItem('trf_archive', '[]'); localStorage.setItem('trf_trash', '[]');
  localStorage.setItem('trf_profile', JSON.stringify({ identityStatements: [] }));
  localStorage.setItem('trf_onboarded', '1'); localStorage.setItem('trf_onboarded_act', '1');
  localStorage.removeItem('trf_ai_config_v1'); localStorage.removeItem('trf_ui'); localStorage.removeItem('trf_punch_rd_date');
}
""" % (json.dumps(DAYS, ensure_ascii=False), json.dumps(GOAL, ensure_ascii=False))

with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome')

    # 桌面：默认清单态
    ctx = b.new_context(viewport={'width': 900, 'height': 1100})
    pg = ctx.new_page()
    pg.goto(BASE + 'punch.html', wait_until='networkidle')
    pg.evaluate(SEED)
    pg.goto(BASE + 'punch.html', wait_until='networkidle'); time.sleep(0.7)
    pg.screenshot(path=f'{OUT}/r24_1_list_default.png', full_page=True)

    # 填写态
    pg.fill('#ckNote', '午饭时我把手上的进度同步给了对方')
    pg.fill('#ckOutput', '一份 3 行的进度清单')
    time.sleep(0.4)
    pg.evaluate("() => document.getElementById('ck-do-placeholder') || document.querySelector('.ck-row.today').scrollIntoView({block:'center'})")
    time.sleep(0.4)
    pg.screenshot(path=f'{OUT}/r24_2_today_filled.png', full_page=True)

    # 打勾后（Day3 记完，就地展开回看 + 轻反馈）
    pg.click('#ckDoBtn'); time.sleep(1.0)
    pg.evaluate("() => { const d=document.getElementById('ck-day-3'); if(d) d.scrollIntoView({block:'center'}); }")
    time.sleep(0.5)
    pg.screenshot(path=f'{OUT}/r24_3_day_done_record.png', full_page=True)

    # 窄屏 375
    pg2 = ctx.new_page()
    pg2.set_viewport_size({'width': 375, 'height': 900})
    pg2.goto(BASE + 'punch.html', wait_until='networkidle')
    pg2.evaluate(SEED)
    pg2.goto(BASE + 'punch.html', wait_until='networkidle'); time.sleep(0.7)
    ov = pg2.evaluate("""() => ({ iw: window.innerWidth, sw: document.documentElement.scrollWidth })""")
    pg2.screenshot(path=f'{OUT}/r24_5_mobile_375.png', full_page=True)
    print('窄屏:', ov)

    # 毕业态
    pg3 = ctx.new_page()
    pg3.goto(BASE + 'punch.html', wait_until='networkidle')
    pg3.evaluate(SEED_GRAD)
    pg3.goto(BASE + 'punch.html?id=r24a', wait_until='networkidle'); time.sleep(0.8)
    pg3.screenshot(path=f'{OUT}/r24_4_graduated.png', full_page=True)

    b.close()
srv.terminate()
print('截图完成 ->', OUT)
