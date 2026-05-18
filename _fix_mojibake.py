# Fix cp1251 / cp866 mojibake on a per-cluster basis (preserves real Cyrillic)
import os, sys, io

BOM = b'\xef\xbb\xbf'
EXTS = ('.html', '.js', '.css')
SKIP = {'three.min.js', 'vanta.globe.min.js', '_fix_mojibake.py'}

def try_fix_cluster(s):
    """Try cp1251 then cp866 roundtrip. Return fixed string or None."""
    for enc in ('cp1251', 'cp866'):
        try:
            b = s.encode(enc)
            f = b.decode('utf-8')
            # Heuristic: roundtrip succeeded AND resulting string is "more sensible"
            # (contains only common punctuation, arrows, math, ASCII, or
            # Cyrillic — but not the same garbage)
            if f == s:
                continue
            # Reject if the result still contains gibberish (rare punct)
            ok = True
            for c in f:
                o = ord(c)
                if o < 32 and c not in '\n\r\t': ok = False; break
            if ok:
                return f
        except Exception:
            continue
    return None

def fix_file(path):
    with open(path, 'rb') as f:
        raw = f.read()
    had_bom = raw.startswith(BOM)
    if had_bom:
        raw = raw[3:]
    try:
        text = raw.decode('utf-8')
    except UnicodeDecodeError:
        return False, 'not-utf8'
    # Walk through and fix non-ASCII clusters
    out = []
    i = 0
    fixed_count = 0
    while i < len(text):
        c = text[i]
        if ord(c) > 127:
            j = i
            while j < len(text) and ord(text[j]) > 127:
                j += 1
            cluster = text[i:j]
            fixed = try_fix_cluster(cluster)
            if fixed is not None and fixed != cluster:
                # Sanity: only accept if the fixed cluster contains
                # mostly common punctuation/symbols/Cyrillic-OK chars
                # (avoid blindly accepting weird transforms)
                acceptable = all(
                    (ord(ch) < 128) or
                    (0x0400 <= ord(ch) <= 0x04FF) or  # Cyrillic
                    ch in '—–·°±×÷≈≠≤≥∞→←↑↓↔“”‘’«»…•◦‣†‡§¶‰‹›' for ch in fixed
                )
                if acceptable:
                    out.append(fixed)
                    fixed_count += 1
                    i = j
                    continue
            out.append(cluster)
            i = j
        else:
            out.append(c)
            i += 1
    new_text = ''.join(out)
    new_bytes = (BOM if had_bom or any(ord(ch) > 127 for ch in new_text) else b'') + new_text.encode('utf-8')
    if new_bytes != (BOM if had_bom else b'') + text.encode('utf-8') or not had_bom:
        with open(path, 'wb') as f:
            f.write(new_bytes)
        return True, f'fixed {fixed_count} clusters'
    return False, 'unchanged'

if __name__ == '__main__':
    for fn in sorted(os.listdir('.')):
        if not fn.endswith(EXTS): continue
        if fn in SKIP: continue
        changed, msg = fix_file(fn)
        if changed:
            print(f'{fn}: {msg}')
        else:
            print(f'{fn}: {msg}')
