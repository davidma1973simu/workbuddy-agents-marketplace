# -*- coding: utf-8 -*-
"""P2-1 清理脚本 v2：删除三页中无引用的死 CSS 规则块。
用法：--apply 才写回；默认 dry-run 只打印将要删除的块。"""
import io, re, sys

APPLY = '--apply' in sys.argv

def find_block_end(css, brace_start):
    depth = 0
    for j in range(brace_start, len(css)):
        if css[j] == '{': depth += 1
        elif css[j] == '}':
            depth -= 1
            if depth == 0: return j
    return len(css) - 1

def is_selector_dead(sel, dead_set):
    cls = re.findall(r'\.([a-zA-Z][\w-]*)', sel)
    if not cls: return False
    if '#' in sel or '[' in sel: return False
    pseudo = {'hover','active','focus','before','after','first-child','last-child','not',
              'nth-child','checked','disabled','open','hidden','light','dark','webkit','moz'}
    words = re.findall(r'[a-zA-Z][\w-]*', sel)
    bare = [w for w in words if w not in cls and w not in pseudo and w not in ('data','theme')]
    if bare: return False
    return all(c in dead_set for c in cls)

def clean_css(css, dead_set, rest, removed):
    # 死 keyframes
    changed = True
    while changed:
        changed = False
        for m in re.finditer(r'@keyframes\s+([\w-]+)\s*\{', css):
            name = m.group(1)
            if not re.search(r'\b' + re.escape(name) + r'\b', rest):
                end = find_block_end(css, m.end() - 1)
                css = css[:m.start()] + css[end+1:]
                removed.append('@keyframes ' + name)
                changed = True
                break

    out, i, n = [], 0, len(css)
    while i < n:
        m = re.compile(r'([^{}]+)\{').search(css, i)
        if not m:
            out.append(css[i:]); break
        raw_sel = m.group(1)                      # 相对匹配，从上个 } 之后到 {
        brace_start = m.end() - 1
        end = find_block_end(css, brace_start)
        body = css[brace_start+1:end]
        sel = raw_sel.strip()
        if sel.startswith('@media'):
            inner_removed = []
            inner = clean_css(body, dead_set, rest, inner_removed)
            removed.extend(inner_removed)
            if inner.strip():
                out.append(raw_sel + '{' + inner + '}')
            else:
                removed.append('@media(空) ' + sel.replace('\n',' ')[:50])
        else:
            sels = [x.strip() for x in sel.split(',') if x.strip()]
            live = [x for x in sels if not is_selector_dead(x, dead_set)]
            if not live:
                removed.append(sel.replace('\n', ' ')[:70])
            else:
                lead_ws = raw_sel[:len(raw_sel) - len(raw_sel.lstrip())]
                out.append(lead_ws + ', '.join(live) + ' {' + body + '}')
        i = end + 1
    return ''.join(out)

FILES = ['punch.html', 'cognitive.html', 'behavior.html']
for path in FILES:
    s = io.open(path, encoding='utf-8').read()
    m = re.search(r'<style>([\s\S]*?)</style>', s)
    style = m.group(1)
    rest = s.replace(style, '')
    classes = sorted(set(re.findall(r'\.([a-zA-Z][\w-]*)', style)))
    dead = set(c for c in classes if not re.search(r'\b' + c + r'\b', rest))
    removed = []
    cleaned = clean_css(style, dead, rest, removed)
    lines_before = style.count('\n'); lines_after = cleaned.count('\n')
    print(f"{path}: 将删 {len(removed)} 块, CSS {lines_before} -> {lines_after} 行")
    for r in removed: print('   - ' + r)
    # 残留检查
    residue = [c for c in classes if c in dead and re.search(r'\.' + re.escape(c) + r'\b', cleaned)]
    if residue: print('   残留死类(保守保留):', residue)
    if APPLY:
        io.open(path, 'w', encoding='utf-8').write(s.replace(style, cleaned))
        print(f"   APPLIED {path}")
