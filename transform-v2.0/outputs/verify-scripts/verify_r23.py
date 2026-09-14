#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""R-23 成长资产卡出口的「名字 ↔ 去处」修正

David 定名：
  第一个按钮 = 深入洞察  → app.html（深入洞察页）
  第二个按钮 = 拿它去用  → punch.html（每日改变 · 简单版），并把这条想法作为「认知起点」带过去

本脚本不只查文案，而是**真点一次**，验证到了 punch 之后起点确实带过去了。
注：behavior.html（成长资产·证据）的标记里没有 #insightList/#modelList 容器，
    其 renderInsights/renderModels 为遗留死代码，故该页改用「直接调用 assetActions() 检视返回 HTML」验证。
"""
import subprocess, time
from playwright.sync_api import sync_playwright

ROOT = '/Users/davidma/WorkBuddy/workbuddy-agents-marketplace/transform-v2.0'
PORT = 8803
BASE = f'http://localhost:{PORT}/'
srv = subprocess.Popen(
    ['/Users/davidma/.workbuddy/binaries/python/versions/3.13.12/bin/python3', '-m', 'http.server', str(PORT)],
    cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1.2)

SEED = """
() => {
  const iso = d => new Date(Date.now() - d * 864e5).toISOString();
  const archive = [
    { id: 'i1', scenario: '工作里的控制感', tags: ['控制感'],
      essence: { nature: '我把别人的期待当成了自己的责任', insight: '我一直在超载' },
      reflection: { learned: '先分清哪些是我的事' },
      completedAt: iso(3), createdAt: iso(3) },
    { id: 'i2', scenario: '家庭沟通', tags: [],
      essence: { nature: '我对家人没耐心' }, completedAt: iso(2), createdAt: iso(2) },
    { id: 'i3', scenario: '空的一条', tags: [], essence: {},
      completedAt: iso(1), createdAt: iso(1) }
  ];
  localStorage.setItem('trf_archive', JSON.stringify(archive));
  localStorage.setItem('trf_actions', JSON.stringify([]));
  localStorage.setItem('trf_trash', JSON.stringify([]));
  localStorage.setItem('trf_profile', JSON.stringify({ identityStatements: [] }));
  localStorage.setItem('trf_onboarded', '1');
  localStorage.setItem('trf_onboarded_act', '1');
  localStorage.removeItem('trf_ai_config_v1');
  localStorage.removeItem('trf_ui');
  localStorage.removeItem('trf_session_draft');
}
"""

results = []
def check(n, c, e=''): results.append((n, bool(c), e))

READ_BTNS = """(id) => {
  const c = document.getElementById('ins-' + id);
  if (!c) return null;
  c.classList.add('open');
  const a1 = c.querySelector('.asset-actions a.use-btn.solid');
  const a2 = c.querySelector('.asset-actions a.use-btn:not(.solid)');
  return {
    card: (c.innerText || '').replace(/\\n/g, ' ').slice(0, 40),
    b1: a1 ? a1.innerText.trim() : null, b1h: a1 ? a1.getAttribute('href') : null,
    b2: a2 ? a2.innerText.trim() : null, b2h: a2 ? a2.getAttribute('href') : null
  };
}"""

with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome')
    ctx = b.new_context(viewport={'width': 1280, 'height': 900})
    pg = ctx.new_page()
    errs = []
    pg.on('pageerror', lambda e: errs.append('PAGEERR ' + str(e)))
    pg.on('console', lambda m: errs.append('CONSOLE ' + m.text)
          if m.type == 'error' and 'Failed to load resource' not in m.text else None)

    # ================= cognitive.html（成长资产 · 想法）：真卡片 =================
    pg.goto(BASE + 'cognitive.html', wait_until='networkidle')
    pg.evaluate(SEED)
    pg.reload(wait_until='networkidle'); time.sleep(0.6)
    pg.evaluate("() => document.querySelectorAll('.onboard-mask,.mask,.modal-mask,.ob-mask').forEach(m => m.style.display='none')")
    info = pg.evaluate(READ_BTNS, 'i1')
    check('R-23 [cognitive] 定位到 i1 洞察卡（含本质/洞察）', info and '工作里的控制感' in info['card'], f"{info and info['card']}")
    check('R-23 [cognitive] 第一个按钮文案 = 深入洞察 →', info and info['b1'] == '深入洞察 →', f"{info and info['b1']}")
    check('R-23 [cognitive] 第一个按钮指向 app.html（深入洞察页）', info and info['b1h'].startswith('app.html?from='), f"{info and info['b1h']}")
    check('R-23 [cognitive] 第二个按钮文案 = 拿它去用 →', info and info['b2'] == '拿它去用 →', f"{info and info['b2']}")
    check('R-23 [cognitive] 第二个按钮指向 punch.html（每日改变简单版）', info and info['b2h'].startswith('punch.html'), f"{info and info['b2h']}")
    check('R-23 [cognitive] 第二个按钮带上认知起点（insight/nature/scenario）',
          info and all(k in info['b2h'] for k in ('insight=', 'nature=', 'scenario=')), f"{info and info['b2h']}")
    check('R-23 [cognitive] 页面已无「用它开一个实验」', pg.evaluate("() => !document.body.innerText.includes('用它开一个实验')"), '')
    check('R-23 [cognitive] 页面已无指向 act.html?from= 的入口',
          pg.evaluate("() => Array.from(document.querySelectorAll('a')).every(a => !(a.getAttribute('href')||'').includes('act.html?from='))"), '')
    check('R-23 [cognitive] 页面已无「去用 →」旧标签（精确匹配，排除「拿它去用 →」子串）',
          pg.evaluate("() => Array.from(document.querySelectorAll('a')).every(a => a.innerText.trim() !== '去用 →')"), '')
    def head_state(opened):
        pg.evaluate(f"""() => {{
          const c = document.getElementById('ins-i1');
          c.classList.toggle('open', {str(opened).lower()});
        }}"""); time.sleep(0.2)
        return pg.evaluate("""() => {
          const c = document.getElementById('ins-i1');
          const a = c.querySelector('.fold-head .head-use');
          if (!a) return null;
          const r = a.getBoundingClientRect();
          return {text: a.innerText.trim(), href: a.getAttribute('href'), vis: r.height > 0};
        }""")
    hc = head_state(False)
    ho = head_state(True)
    check('R-23 [cognitive] 折叠态头部药丸 = 深入洞察 →（同一去处，一名到底）',
          hc and hc['vis'] and hc['text'] == '深入洞察 →' and hc['href'].startswith('app.html?from='), f"{hc}")
    check('R-23 [cognitive] 展开态头部药丸收起（避免同屏两个同名入口）',
          ho and ho['vis'] is False, f"{ho}")
    pg.evaluate("() => document.getElementById('ins-i1').classList.add('open')"); time.sleep(0.15)

    # ================= 真点一次：跳到每日改变，验证起点带过去了 =================
    pg.evaluate("""() => document.getElementById('ins-i1').querySelector('.asset-actions a.use-btn:not(.solid)').click()""")
    try:
        pg.wait_for_url('**/punch.html*', timeout=6000)
    except Exception as ex:
        pass
    pg.wait_for_load_state('networkidle'); time.sleep(0.8)
    url = pg.url
    check('R-23 [跳转] 点击后进入 punch.html', 'punch.html' in url, f"url={url}")
    check('R-23 [跳转] URL 带上了 insight / nature / scenario',
          all(k in url for k in ('insight=', 'nature=', 'scenario=')), f"url={url}")
    cvis = pg.evaluate("""() => {
      const c = document.querySelector('.ctx-card'); if (!c) return null;
      const st = getComputedStyle(c);
      return {vis: st.display !== 'none' && st.visibility !== 'hidden', txt: c.innerText};
    }""")
    check('R-23 [跳转] 「认知起点」卡出现', cvis and cvis['vis'], f"{cvis}")
    check('R-23 [跳转] 起点卡带的是这条想法的本质 + 洞察',
          cvis and '我一直在超载' in cvis['txt'] and '我把别人的期待' in cvis['txt'], f"{cvis and cvis['txt'][:90]!r}")
    inval = pg.evaluate("() => (document.getElementById('changeInput')||{}).value || ''")
    check('R-23 [跳转] 输入框预填为这条想法的场景', inval == '工作里的控制感', f"value={inval!r}")
    used = pg.evaluate("""() => {
      const a = JSON.parse(localStorage.getItem('trf_archive') || '[]');
      const it = a.find(s => s.id === 'i1') || {};
      return ((it.uses || []).slice(-1)[0] || {}).where || '';
    }""")
    check('R-23 [跳转] 使用痕迹 where = punch.html', used == 'punch.html', f"where={used!r}")

    # ================= behavior.html：assetActions 返回的 HTML（不依赖容器）=================
    pg.goto(BASE + 'behavior.html', wait_until='networkidle')
    pg.evaluate(SEED)
    pg.reload(wait_until='networkidle'); time.sleep(0.6)
    hb = pg.evaluate("""() => {
      const d = document.createElement('div');
      d.innerHTML = assetActions('insight', 'i1');
      const a1 = d.querySelector('a.use-btn.solid'), a2 = d.querySelector('a.use-btn:not(.solid)');
      return {
        b1: a1 && a1.innerText.trim(), b1h: a1 && a1.getAttribute('href'),
        b2: a2 && a2.innerText.trim(), b2h: a2 && a2.getAttribute('href'),
        p1: d.querySelector('.more-btn') ? 'hasMore' : 'noMore'
      };
    }""")
    check('R-23 [behavior] assetActions 第一个按钮 = 深入洞察 → app.html',
          hb and hb['b1'] == '深入洞察 →' and hb['b1h'].startswith('app.html?from='), f"{hb and (hb['b1'],hb['b1h'])}")
    check('R-23 [behavior] assetActions 第二个按钮 = 拿它去用 → punch.html',
          hb and hb['b2'] == '拿它去用 →' and hb['b2h'].startswith('punch.html?insight='), f"{hb and (hb['b2'],hb['b2h'])}")
    check('R-23 [behavior] 「更多」菜单仍在（未误删）', hb and hb['p1'] == 'hasMore', f"{hb and hb['p1']}")
    check('R-23 [behavior] 源码里已无「用它开一个实验」',
          pg.evaluate("() => !document.documentElement.outerHTML.includes('用它开一个实验')"), '')
    # 记录一处遗留：该页没有洞察/模型容器（死代码），仅作信息记录，不计失败
    legacy = pg.evaluate("() => ({il: !!document.getElementById('insightList'), ml: !!document.getElementById('modelList')})")
    print(f"\n  ℹ️  behavior.html 遗留观察：insightList={legacy['il']} modelList={legacy['ml']}（renderInsights/renderModels 在该页为死代码）")

    # ================= 纯函数边界：punchHandoffUrl =================
    u2 = pg.evaluate("() => punchHandoffUrl({ id:'i2', scenario:'家庭沟通', essence:{ nature:'我对家人没耐心' } })")
    check('R-23 [边界] 只有本质时：nature 充当起点且不重复出现',
          u2.startswith('punch.html?insight=') and 'nature=' not in u2 and 'scenario=' in u2, f"{u2}")
    u3 = pg.evaluate("() => punchHandoffUrl({ id:'i3', scenario:'', essence:{} })")
    check('R-23 [边界] 无任何正文时：退化为纯 punch.html（不带空参数）', u3 == 'punch.html', f"{u3}")
    check('R-23 [边界] 传入 null 不报错', pg.evaluate("() => punchHandoffUrl(null)") == 'punch.html', '')
    u5 = pg.evaluate("() => punchHandoffUrl({ id:'i9', scenario:'含&和?的场景', essence:{ insight:'洞察里有 & 和 = 号' } })")
    check('R-23 [边界] 特殊字符被正确编码', '&amp;' not in u5 and 'insight=%E6' in u5 and 'scenario=%E5%90%AB' in u5, f"{u5}")
    # learn 回退
    u6 = pg.evaluate("() => punchHandoffUrl({ id:'i9', scenario:'', essence:{}, reflection:{ learned:'只有学到了什么' } })")
    check('R-23 [边界] 只有 reflection.learned 时也能带上起点', 'insight=' in u6, f"{u6}")

    b.close()

print()
ok = 0
for n, c, e in results:
    print(('  ✅ ' if c else '  ❌ ') + n + (f'   [{e}]' if (e and not c) else ''))
    ok += 1 if c else 0
print(f'\n{ok}/{len(results)} passed')
print('JS 错误: ' + (str(errs[:6]) if errs else '0'))
srv.terminate()
