#!/usr/bin/env python3
# Split growth.html / growth-en.html into cognitive.html / behavior.html (and en versions)
import re
from pathlib import Path

ROOT = Path('/Users/davidma/WorkBuddy/transform')

def read(name):
    return (ROOT / name).read_text(encoding='utf-8')

def write(name, text):
    (ROOT / name).write_text(text, encoding='utf-8')

CN = read('growth.html')
EN = read('growth-en.html')

# ---- helpers ----
def between(text, start, end, keep_start=False, keep_end=False):
    """Extract the slice from start marker to end marker (exclusive by default)."""
    i = text.find(start)
    if i < 0: return '', text
    j = text.find(end, i + len(start))
    if j < 0: j = len(text)
    a = i if keep_start else i + len(start)
    b = j + len(end) if keep_end else j
    return text[a:b], text

def remove_between(text, start, end):
    i = text.find(start)
    if i < 0: return text
    j = text.find(end, i + len(start))
    if j < 0: return text[:i]
    return text[:i] + text[j + len(end):]

# ---- CN cognitive.html ----
cog = CN
# Title / page head
cog = cog.replace('<title>我的成长资产 · Transform</title>', '<title>认知档案 · Transform</title>')
cog = cog.replace('<h1>我的成长资产</h1>', '<h1>认知档案</h1>')
cog = cog.replace('<div class="page-sub">认知模型、洞察、行为实验与跨时间模式，都在这里沉淀为你的长期资产</div>',
                  '<div class="page-sub">每一次想清楚，沉淀出的长期认知资产</div>')
# Toolbar: keep only cognitive start + a link to behavior archive
cog = cog.replace(
  '''<div class="toolbar">
    <a class="act solid" href="app.html">开始一次认知提升</a>
    <a class="act solid" href="act.html">开始一次行为改变</a>
    <button class="act" onclick="downloadAll()">存数据</button>
    <button class="act" onclick="openSettings()">AI 设置</button>
  </div>''',
  '''<div class="toolbar">
    <a class="act solid" href="app.html">开始一次认知提升</a>
    <a class="act" href="behavior.html">查看行为档案</a>
    <button class="act" onclick="downloadAll()">存数据</button>
    <button class="act" onclick="openSettings()">AI 设置</button>
  </div>''')
# Remove behavior archive section entirely
cog = remove_between(cog, '<!-- 行为档案 -->', '<!-- 回收箱 -->')
# Adjust renderStats to show cognitive-only numbers
cog = cog.replace(
  '''function renderStats(){
  const archive = loadArchive();
  const actions = loadActions();
  const graduated = actions.filter(a => a.status === 'graduated').length;
  const totalDone = actions.reduce((a,b) => a + (b.totalDone || 0), 0);
  const bestStreak = Math.max(...actions.map(a => a.bestStreak || 0), 0);
  const active = actions.filter(a => a.status === 'active').length;
  $('statsArea').innerHTML = `
    <span class="item"><span class="num">${archive.length}</span>认知洞察</span>
    <span class="sep">·</span>
    <span class="item"><span class="num">${actions.length}</span>行为实验</span>
    <span class="sep">·</span>
    <span class="item"><span class="num">${graduated}</span>已毕业</span>
    <span class="sep">·</span>
    <span class="item"><span class="num">${active}</span>进行中</span>
    <span class="sep">·</span>
    <span class="item"><span class="num">${bestStreak}</span>最长连续</span>
    <span class="sep">·</span>
    <span class="item"><span class="num">${totalDone}</span>累计做到</span>
  `;
  // 设置四个展开卡的计数徽章
  const m = archive.filter(s => (s.mentalModel && s.mentalModel.trim()) || (s.reflection && s.reflection.changed && s.reflection.changed.trim())).length;
  $('modelsCount').textContent = m;
  $('insightsCount').textContent = archive.length;
  $('experimentsCount').textContent = actions.length;
  let saved = null; try { saved = JSON.parse(localStorage.getItem(LS_PATTERNS)); } catch(e){}
  $('patternsCount').textContent = (saved && saved.patterns) ? saved.patterns.length : 0;
}''',
  '''function renderStats(){
  const archive = loadArchive();
  const models = archive.filter(s => (s.mentalModel && s.mentalModel.trim()) || (s.reflection && s.reflection.changed && s.reflection.changed.trim()));
  const tags = new Set();
  archive.forEach(s => (s.tags || []).forEach(t => { if(t) tags.add(t); }));
  $('statsArea').innerHTML = `
    <span class="item"><span class="num">${archive.length}</span>认知洞察</span>
    <span class="sep">·</span>
    <span class="item"><span class="num">${models.length}</span>认知模型</span>
    <span class="sep">·</span>
    <span class="item"><span class="num">${tags.size}</span>标签</span>
  `;
  const m = models.length;
  $('modelsCount').textContent = m;
  $('insightsCount').textContent = archive.length;
}''')
# Guard renderActions / renderPatterns so they don't crash without their DOM
cog = cog.replace(
  '''function renderActions(){
  const actions = loadActions();
  renderActionFilters(actions);
  const box = $('actionList');''',
  '''function renderActions(){
  const actions = loadActions();
  renderActionFilters(actions);
  const box = $('actionList');
  if (!box) return;''')
cog = cog.replace(
  '''function renderPatterns(){
  const area = $('patternArea');''',
  '''function renderPatterns(){
  const area = $('patternArea');
  if (!area) return;''')
write('cognitive.html', cog)

# ---- CN behavior.html ----
beh = CN
beh = beh.replace('<title>我的成长资产 · Transform</title>', '<title>行为档案 · Transform</title>')
beh = beh.replace('<h1>我的成长资产</h1>', '<h1>行为档案</h1>')
beh = beh.replace('<div class="page-sub">认知模型、洞察、行为实验与跨时间模式，都在这里沉淀为你的长期资产</div>',
                   '<div class="page-sub">每一次做到，沉淀出的长期行为资产</div>')
beh = beh.replace(
  '''<div class="toolbar">
    <a class="act solid" href="app.html">开始一次认知提升</a>
    <a class="act solid" href="act.html">开始一次行为改变</a>
    <button class="act" onclick="downloadAll()">存数据</button>
    <button class="act" onclick="openSettings()">AI 设置</button>
  </div>''',
  '''<div class="toolbar">
    <a class="act solid" href="act.html">开始一次行为改变</a>
    <a class="act" href="cognitive.html">查看认知档案</a>
    <button class="act" onclick="downloadAll()">存数据</button>
    <button class="act" onclick="openSettings()">AI 设置</button>
  </div>''')
# Remove cognitive archive section
beh = remove_between(beh, '<!-- 认知档案 -->', '<!-- 行为档案 -->')
# Change archive section class from beh to something? Keep as beh for amber styling.
# Adjust renderStats to behavior-only
beh = beh.replace(
  '''function renderStats(){
  const archive = loadArchive();
  const actions = loadActions();
  const graduated = actions.filter(a => a.status === 'graduated').length;
  const totalDone = actions.reduce((a,b) => a + (b.totalDone || 0), 0);
  const bestStreak = Math.max(...actions.map(a => a.bestStreak || 0), 0);
  const active = actions.filter(a => a.status === 'active').length;
  $('statsArea').innerHTML = `
    <span class="item"><span class="num">${archive.length}</span>认知洞察</span>
    <span class="sep">·</span>
    <span class="item"><span class="num">${actions.length}</span>行为实验</span>
    <span class="sep">·</span>
    <span class="item"><span class="num">${graduated}</span>已毕业</span>
    <span class="sep">·</span>
    <span class="item"><span class="num">${active}</span>进行中</span>
    <span class="sep">·</span>
    <span class="item"><span class="num">${bestStreak}</span>最长连续</span>
    <span class="sep">·</span>
    <span class="item"><span class="num">${totalDone}</span>累计做到</span>
  `;
  // 设置四个展开卡的计数徽章
  const m = archive.filter(s => (s.mentalModel && s.mentalModel.trim()) || (s.reflection && s.reflection.changed && s.reflection.changed.trim())).length;
  $('modelsCount').textContent = m;
  $('insightsCount').textContent = archive.length;
  $('experimentsCount').textContent = actions.length;
  let saved = null; try { saved = JSON.parse(localStorage.getItem(LS_PATTERNS)); } catch(e){}
  $('patternsCount').textContent = (saved && saved.patterns) ? saved.patterns.length : 0;
}''',
  '''function renderStats(){
  const actions = loadActions();
  const graduated = actions.filter(a => a.status === 'graduated').length;
  const totalDone = actions.reduce((a,b) => a + (b.totalDone || 0), 0);
  const bestStreak = Math.max(...actions.map(a => a.bestStreak || 0), 0);
  const active = actions.filter(a => a.status === 'active').length;
  $('statsArea').innerHTML = `
    <span class="item"><span class="num">${actions.length}</span>行为实验</span>
    <span class="sep">·</span>
    <span class="item"><span class="num">${graduated}</span>已毕业</span>
    <span class="sep">·</span>
    <span class="item"><span class="num">${active}</span>进行中</span>
    <span class="sep">·</span>
    <span class="item"><span class="num">${bestStreak}</span>最长连续</span>
    <span class="sep">·</span>
    <span class="item"><span class="num">${totalDone}</span>累计做到</span>
  `;
  $('experimentsCount').textContent = actions.length;
  let saved = null; try { saved = JSON.parse(localStorage.getItem(LS_PATTERNS)); } catch(e){}
  $('patternsCount').textContent = (saved && saved.patterns) ? saved.patterns.length : 0;
}''')
# Guard renderModels / renderInsights / renderTagFilters
beh = beh.replace(
  '''function renderModels(){
  const archive = loadArchive();''',
  '''function renderModels(){
  const box = $('modelList'); if (!box) return;
  const archive = loadArchive();''')
beh = beh.replace(
  '''function renderTagFilters(){
  const archive = loadArchive();''',
  '''function renderTagFilters(){
  const archive = loadArchive();\n  const box = $(\'tagFilters\'); if (!box) return;''')
beh = beh.replace(
  '''function renderInsights(){
  let archive = loadArchive();''',
  '''function renderInsights(){
  const box = $('insightList'); if (!box) return;
  let archive = loadArchive();''')
write('behavior.html', beh)

# ---- EN cognitive-en.html ----
cog_en = EN
cog_en = cog_en.replace('<title>My Growth Assets · Transform</title>', '<title>Insight Archive · Transform</title>')
cog_en = cog_en.replace('<h1>My Growth Assets</h1>', '<h1>Insight Archive</h1>')
cog_en = cog_en.replace('<div class="page-sub">Mental models, insights, behavior experiments, and cross-time patterns \\u2014 all banked here as your long-term assets</div>',
                        '<div class="page-sub">Every time you think something through, it becomes a long-term cognitive asset</div>')
# topbar link
# EN file doesn't exist in topbar; growth-en links to index-en.html etc. keep as is.
cog_en = cog_en.replace(
  '''<div class="toolbar">
    <a class="act solid" href="app-en.html">Start an Insight Session</a>
    <a class="act solid" href="act-en.html">Start a Behavior Change</a>
    <button class="act" onclick="downloadAll()">Export Data</button>
    <button class="act" onclick="openSettings()">AI Settings</button>
  </div>''',
  '''<div class="toolbar">
    <a class="act solid" href="app-en.html">Start an Insight Session</a>
    <a class="act" href="behavior-en.html">View Behavior Archive</a>
    <button class="act" onclick="downloadAll()">Export Data</button>
    <button class="act" onclick="openSettings()">AI Settings</button>
  </div>''')
cog_en = remove_between(cog_en, '<!-- 行为档案 -->', '<!-- 回收箱 -->')
cog_en = cog_en.replace(
  '''function renderStats(){
  const archive = loadArchive();
  const actions = loadActions();
  const graduated = actions.filter(a => a.status === 'graduated').length;
  const totalDone = actions.reduce((a,b) => a + (b.totalDone || 0), 0);
  const bestStreak = Math.max(...actions.map(a => a.bestStreak || 0), 0);
  const active = actions.filter(a => a.status === 'active').length;
  $('statsArea').innerHTML = `
    <span class="item"><span class="num">${archive.length}</span>insights</span>
    <span class="sep">·</span>
    <span class="item"><span class="num">${actions.length}</span>experiments</span>
    <span class="sep">·</span>
    <span class="item"><span class="num">${graduated}</span>graduated</span>
    <span class="sep">·</span>
    <span class="item"><span class="num">${active}</span>active</span>
    <span class="sep">·</span>
    <span class="item"><span class="num">${bestStreak}</span>best streak</span>
    <span class="sep">·</span>
    <span class="item"><span class="num">${totalDone}</span>total done</span>
  `;
  // 设置四个展开卡的计数徽章
  const m = archive.filter(s => (s.mentalModel && s.mentalModel.trim()) || (s.reflection && s.reflection.changed && s.reflection.changed.trim())).length;
  $('modelsCount').textContent = m;
  $('insightsCount').textContent = archive.length;
  $('experimentsCount').textContent = actions.length;
  let saved = null; try { saved = JSON.parse(localStorage.getItem(LS_PATTERNS)); } catch(e){}
  $('patternsCount').textContent = (saved && saved.patterns) ? saved.patterns.length : 0;
}''',
  '''function renderStats(){
  const archive = loadArchive();
  const models = archive.filter(s => (s.mentalModel && s.mentalModel.trim()) || (s.reflection && s.reflection.changed && s.reflection.changed.trim()));
  const tags = new Set();
  archive.forEach(s => (s.tags || []).forEach(t => { if(t) tags.add(t); }));
  $('statsArea').innerHTML = `
    <span class="item"><span class="num">${archive.length}</span>insights</span>
    <span class="sep">·</span>
    <span class="item"><span class="num">${models.length}</span>mental models</span>
    <span class="sep">·</span>
    <span class="item"><span class="num">${tags.size}</span>tags</span>
  `;
  const m = models.length;
  $('modelsCount').textContent = m;
  $('insightsCount').textContent = archive.length;
}''')
cog_en = cog_en.replace(
  '''function renderActions(){
  const actions = loadActions();
  renderActionFilters(actions);
  const box = $('actionList');''',
  '''function renderActions(){
  const actions = loadActions();
  renderActionFilters(actions);
  const box = $('actionList');
  if (!box) return;''')
cog_en = cog_en.replace(
  '''function renderPatterns(){
  const area = $('patternArea');''',
  '''function renderPatterns(){
  const area = $('patternArea');
  if (!area) return;''')
write('cognitive-en.html', cog_en)

# ---- EN behavior-en.html ----
beh_en = EN
beh_en = beh_en.replace('<title>My Growth Assets · Transform</title>', '<title>Behavior Archive · Transform</title>')
beh_en = beh_en.replace('<h1>My Growth Assets</h1>', '<h1>Behavior Archive</h1>')
beh_en = beh_en.replace('<div class="page-sub">Mental models, insights, behavior experiments, and cross-time patterns \\u2014 all banked here as your long-term assets</div>',
                        '<div class="page-sub">Every action completed becomes a long-term behavioral asset</div>')
beh_en = beh_en.replace(
  '''<div class="toolbar">
    <a class="act solid" href="app-en.html">Start an Insight Session</a>
    <a class="act solid" href="act-en.html">Start a Behavior Change</a>
    <button class="act" onclick="downloadAll()">Export Data</button>
    <button class="act" onclick="openSettings()">AI Settings</button>
  </div>''',
  '''<div class="toolbar">
    <a class="act solid" href="act-en.html">Start a Behavior Change</a>
    <a class="act" href="cognitive-en.html">View Insight Archive</a>
    <button class="act" onclick="downloadAll()">Export Data</button>
    <button class="act" onclick="openSettings()">AI Settings</button>
  </div>''')
beh_en = remove_between(beh_en, '<!-- 认知档案 -->', '<!-- 行为档案 -->')
beh_en = beh_en.replace(
  '''function renderStats(){
  const archive = loadArchive();
  const actions = loadActions();
  const graduated = actions.filter(a => a.status === 'graduated').length;
  const totalDone = actions.reduce((a,b) => a + (b.totalDone || 0), 0);
  const bestStreak = Math.max(...actions.map(a => a.bestStreak || 0), 0);
  const active = actions.filter(a => a.status === 'active').length;
  $('statsArea').innerHTML = `
    <span class="item"><span class="num">${archive.length}</span>insights</span>
    <span class="sep">·</span>
    <span class="item"><span class="num">${actions.length}</span>experiments</span>
    <span class="sep">·</span>
    <span class="item"><span class="num">${graduated}</span>graduated</span>
    <span class="sep">·</span>
    <span class="item"><span class="num">${active}</span>active</span>
    <span class="sep">·</span>
    <span class="item"><span class="num">${bestStreak}</span>best streak</span>
    <span class="sep">·</span>
    <span class="item"><span class="num">${totalDone}</span>total done</span>
  `;
  // 设置四个展开卡的计数徽章
  const m = archive.filter(s => (s.mentalModel && s.mentalModel.trim()) || (s.reflection && s.reflection.changed && s.reflection.changed.trim())).length;
  $('modelsCount').textContent = m;
  $('insightsCount').textContent = archive.length;
  $('experimentsCount').textContent = actions.length;
  let saved = null; try { saved = JSON.parse(localStorage.getItem(LS_PATTERNS)); } catch(e){}
  $('patternsCount').textContent = (saved && saved.patterns) ? saved.patterns.length : 0;
}''',
  '''function renderStats(){
  const actions = loadActions();
  const graduated = actions.filter(a => a.status === 'graduated').length;
  const totalDone = actions.reduce((a,b) => a + (b.totalDone || 0), 0);
  const bestStreak = Math.max(...actions.map(a => a.bestStreak || 0), 0);
  const active = actions.filter(a => a.status === 'active').length;
  $('statsArea').innerHTML = `
    <span class="item"><span class="num">${actions.length}</span>experiments</span>
    <span class="sep">·</span>
    <span class="item"><span class="num">${graduated}</span>graduated</span>
    <span class="sep">·</span>
    <span class="item"><span class="num">${active}</span>active</span>
    <span class="sep">·</span>
    <span class="item"><span class="num">${bestStreak}</span>best streak</span>
    <span class="sep">·</span>
    <span class="item"><span class="num">${totalDone}</span>total done</span>
  `;
  $('experimentsCount').textContent = actions.length;
  let saved = null; try { saved = JSON.parse(localStorage.getItem(LS_PATTERNS)); } catch(e){}
  $('patternsCount').textContent = (saved && saved.patterns) ? saved.patterns.length : 0;
}''')
beh_en = beh_en.replace(
  '''function renderModels(){
  const archive = loadArchive();''',
  '''function renderModels(){
  const box = $('modelList'); if (!box) return;
  const archive = loadArchive();''')
beh_en = beh_en.replace(
  '''function renderTagFilters(){
  const archive = loadArchive();''',
  '''function renderTagFilters(){
  const archive = loadArchive();\n  const box = $(\'tagFilters\'); if (!box) return;''')
beh_en = beh_en.replace(
  '''function renderInsights(){
  let archive = loadArchive();''',
  '''function renderInsights(){
  const box = $('insightList'); if (!box) return;
  let archive = loadArchive();''')
write('behavior-en.html', beh_en)

# ---- growth.html redirect ----
redirect_cn = '''<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta http-equiv="refresh" content="0;url=cognitive.html">
<title>成长资产 · Transform</title>
<script>
(function(){
  var h = location.hash;
  if (h === '#experiments') location.replace('behavior.html');
  else location.replace('cognitive.html');
})();
</script>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "PingFang SC", sans-serif; background: #F6F5F1; color: #1E2A26; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
  .box { text-align: center; padding: 28px; }
  a { color: #0E6B50; font-weight: 600; text-decoration: none; }
</style>
</head>
<body>
<div class="box">
  成长资产已拆分为「认知档案」与「行为档案」<br>
  正在跳转…<br>
  <a href="cognitive.html">点击直达认知档案 →</a>
</div>
</body>
</html>'''
write('growth.html', redirect_cn)

# ---- growth-en.html redirect ----
redirect_en = '''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="refresh" content="0;url=cognitive-en.html">
<title>Growth Assets · Transform</title>
<script>
(function(){
  var h = location.hash;
  if (h === '#experiments') location.replace('behavior-en.html');
  else location.replace('cognitive-en.html');
})();
</script>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif; background: #F6F5F1; color: #1E2A26; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
  .box { text-align: center; padding: 28px; }
  a { color: #0E6B50; font-weight: 600; text-decoration: none; }
</style>
</head>
<body>
<div class="box">
  Growth Assets are now split into Insight Archive and Behavior Archive.<br>
  Redirecting…<br>
  <a href="cognitive-en.html">Go to Insight Archive →</a>
</div>
</body>
</html>'''
write('growth-en.html', redirect_en)

# ---- archive.html and behavior.html redirects ----
write('archive.html', '''<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta http-equiv="refresh" content="0;url=cognitive.html">
<title>认知档案 · Transform</title>
<script>try{location.replace('cognitive.html');}catch(e){}</script>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "PingFang SC", sans-serif; background: #F6F5F1; color: #1E2A26; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
  .box { text-align: center; padding: 28px; }
  a { color: #0E6B50; font-weight: 600; text-decoration: none; }
</style>
</head>
<body>
<div class="box">
  认知档案已升级为独立页面，正在跳转…<br>
  <a href="cognitive.html">点击直达 →</a>
</div>
</body>
</html>''')

# update archive.html is already done; behavior.html is now the real page so don't touch it.
print('Generated cognitive.html, behavior.html, cognitive-en.html, behavior-en.html')
print('Updated growth.html, growth-en.html, archive.html')
