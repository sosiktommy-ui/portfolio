import re

t = open('experience.js', 'r', encoding='utf-8-sig').read()

result = []
i = 0
in_str = None
escape_next = False
in_line_comment = False
in_block_comment = False

while i < len(t):
    c = t[i]

    if in_line_comment:
        result.append(c)
        if c == '\n':
            in_line_comment = False
        i += 1
        continue

    if in_block_comment:
        result.append(c)
        if c == '*' and i + 1 < len(t) and t[i + 1] == '/':
            result.append('/')
            i += 2
            in_block_comment = False
        else:
            i += 1
        continue

    if not in_str:
        if c == '/' and i + 1 < len(t) and t[i + 1] == '/':
            in_line_comment = True
            result.append(c)
            i += 1
            continue
        if c == '/' and i + 1 < len(t) and t[i + 1] == '*':
            in_block_comment = True
            result.append(c)
            i += 1
            continue
        if c in ('"', "'", '`'):
            in_str = c
            result.append(c)
            i += 1
            continue
        result.append(c)
        i += 1
        continue

    # inside string
    if escape_next:
        result.append(c)
        escape_next = False
        i += 1
        continue

    if c == '\\':
        escape_next = True
        result.append(c)
        i += 1
        continue

    if c == in_str:
        in_str = None
        result.append(c)
        i += 1
        continue

    if ord(c) > 127:
        result.append(f'\\u{ord(c):04X}')
    else:
        result.append(c)
    i += 1

new_t = ''.join(result)
changed = sum(1 for c in t if ord(c) > 127)
with open('experience.js', 'w', encoding='utf-8-sig') as f:
    f.write(new_t)
print(f'Replaced {changed} non-ASCII chars in JS strings')
