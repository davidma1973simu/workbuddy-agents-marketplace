# -*- coding: utf-8 -*-
"""P2-1 JS 去重：把两页 byte-identical 的 79 个函数抽到 asset-common.js
用法：--apply 才写回"""
import io, re, hashlib, sys

APPLY = '--apply' in sys.argv

def funcs(src):
    out = {}
    for m in re.finditer(r'^function\s+(\w+)\s*\(([^)]*)\)\s*\{', src, re.M):
        name = m.group(1)
        i = m.end() - 1; depth = 0
        for j in range(i, len(src)):
            if src[j] == '{': depth += 1
            elif src[j] == '}':
                depth -= 1
                if depth == 0: break
        out[name] = (m.start(), j + 1, src[m.start():j+1])
    return out

def page_js(html):
    return '\n'.join(re.findall(r'<script(?![^>]*src=)[^>]*>([\s\S]*?)</script>', html))

_, js_c = page_js(io.open('cognitive.html', encoding='utf-8').read()), None
html_c = io.open('cognitive.html', encoding='utf-8').read()
html_b = io.open('behavior.html', encoding='utf-8').read()
js_c, js_b = page_js(html_c), page_js(html_b)
fc, fb = funcs(js_c), funcs(js_b)
common = sorted(n for n in set(fc) & set(fb)
                if hashlib.md5(fc[n][2].encode()).hexdigest() == hashlib.md5(fb[n][2].encode()).hexdigest())
common_src = '/* Transform v2.0 · 成长资产公共函数（cognitive/behavior 两页共用的 79 个函数，由 P2-1 去重抽取）\n' \
             '   注意：函数引用的 LS_* 常量与页面级状态在各页面自己的脚本中定义，\n' \
             '   本文件必须在页面主脚本之前加载。 */\n\n' + '\n\n'.join(fc[n][2] for n in common) + '\n'
print('common 函数:', len(common), '行数:', common_src.count('\n'))

def remove_funcs(html, fmap, names):
    """从 html 的 script 块中删除指定函数定义（按文本定位）"""
    # 定位各 script 块
    spans = [m.span() for m in re.finditer(r'<script(?![^>]*src=)[^>]*>([\s\S]*?)</script>', html)]
    # 收集删除区间（绝对坐标）
    del_spans = []
    for name in names:
        m = re.search(r'^function\s+' + re.escape(name) + r'\s*\(', html[spans[0][0]:spans[-1][1]], re.M)
        # 在整段 script 区域逐块找（函数只会在一个块里）
        found = False
        for a, b in spans:
            mm = re.search(r'^function\s+' + re.escape(name) + r'\s*\(', html[a:b], re.M)
            if mm:
                start = a + mm.start()
                i = a + mm.end() - 1; depth = 0
                for j in range(i, b):
                    if html[j] == '{': depth += 1
                    elif html[j] == '}':
                        depth -= 1
                        if depth == 0: break
                end = j + 1
                # 吃掉后面的换行
                while end < len(html) and html[end] == '\n': end += 1
                del_spans.append((start, end))
                found = True
                break
        assert found, 'function not found: ' + name
    # 从后往前删
    for start, end in sorted(del_spans, reverse=True):
        html = html[:start] + html[end:]
    return html, len(del_spans)

new_c, n1 = remove_funcs(html_c, fc, common)
new_b, n2 = remove_funcs(html_b, fb, common)
print('cognitive 删除函数块:', n1, '| behavior 删除函数块:', n2)

# 插入 <script src>：在第一个无 src 的 <script> 前
tag = '<script src="asset-common.js"></script>\n'
def insert_tag(html):
    m = re.search(r'<script(?![^>]*src=)[^>]*>', html)
    assert m
    return html[:m.start()] + tag + html[m.start():]
new_c = insert_tag(new_c)
new_b = insert_tag(new_b)

if APPLY:
    io.open('asset-common.js', 'w', encoding='utf-8').write(common_src)
    io.open('cognitive.html', 'w', encoding='utf-8').write(new_c)
    io.open('behavior.html', 'w', encoding='utf-8').write(new_b)
    print('APPLIED')
else:
    import os
    print('cognitive 字节变化:', len(html_c), '->', len(new_c))
    print('behavior 字节变化:', len(html_b), '->', len(new_b))
