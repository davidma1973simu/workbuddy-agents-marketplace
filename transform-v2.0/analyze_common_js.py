# -*- coding: utf-8 -*-
"""P2-1 JS 去重分析：79 个 byte-identical 函数的自由变量检查"""
import io, re, hashlib

def extract(path):
    s = io.open(path, encoding='utf-8').read()
    return s, '\n'.join(re.findall(r'<script(?![^>]*src=)[^>]*>([\s\S]*?)</script>', s))

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
        out[name] = src[m.start():j+1]
    return out

_, js_c = extract('cognitive.html')
_, js_b = extract('behavior.html')
fc, fb = funcs(js_c), funcs(js_b)
common_names = sorted(n for n in set(fc) & set(fb)
                      if hashlib.md5(fc[n].encode()).hexdigest() == hashlib.md5(fb[n].encode()).hexdigest())
common_src = '\n\n'.join(fc[n] for n in common_names)

BUILTINS = set(('function return if else for while do switch case break continue new typeof instanceof '
                'in of var let const try catch finally throw this null undefined true false delete void '
                'Math JSON Object Array String Number Boolean Date RegExp Error Promise Set Map Symbol '
                'parseInt parseFloat isNaN encodeURIComponent decodeURIComponent setTimeout setInterval '
                'clearTimeout clearInterval console window document localStorage location history alert '
                'confirm prompt fetch requestAnimationFrame').split())

params, locals_ = set(), set()
identifiers = set(re.findall(r'\b[A-Za-z_$][\w$]*\b', common_src))
for n in common_names:
    m = re.match(r'function\s+(\w+)\s*\(([^)]*)\)', fc[n])
    params.update(x.strip() for x in m.group(2).split(',') if x.strip())
    locals_.update(re.findall(r'(?:var|let|const)\s+([\w$]+)', fc[n]))
free = identifiers - params - locals_ - set(common_names) - BUILTINS

print("common 函数数:", len(common_names), " 总行数:", common_src.count('\n') + 1)
print("自由符号:", sorted(free))
# 检查自由符号在两页 JS 中的定义
for sym in sorted(free):
    dc = len(re.findall(r'\b' + sym + r'\b', js_c))
    db = len(re.findall(r'\b' + sym + r'\b', js_b))
    flag = 'OK' if (dc > 0 and db > 0) else 'MISSING!'
    print(f"  {sym}: cognitive={dc} behavior={db} {flag}")
