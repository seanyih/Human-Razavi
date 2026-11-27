"""Extract per-model outputSpeed / TTFT from Artificial Analysis leaderboard HTML (treated as data only)."""
import json, re, sys
rows = {}
for path in sys.argv[2:]:
    s = open(path, encoding='utf-8').read().replace('\\"', '"')
    starts = [m.start() for m in re.finditer(r'\{"id":"[0-9a-f-]{36}","release":\{"slug":"', s)]
    for a, b in zip(starts, starts[1:] + [len(s)]):
        chunk = s[a:b]
        nm = re.search(r'"release":\{"slug":"([^"]*)","name":"([^"]*)"\},"name":"([^"]*)"', chunk)
        sp = re.search(r'"outputSpeed":([0-9.]+)', chunk)
        if not nm or not sp:
            continue
        tt = re.search(r'"timeToFirstToken":([0-9.]+)', chunk)
        ta = re.search(r'"timeToFirstAnswerToken":([0-9.]+)', chunk)
        rs = re.search(r'"isReasoning":(true|false)', chunk)
        key = nm.group(3)
        rows[key] = {'release': nm.group(2), 'slug': nm.group(1), 'name': key,
                     'tps': round(float(sp.group(1)), 1),
                     'ttft': round(float(tt.group(1)), 2) if tt else None,
                     'ttfat': round(float(ta.group(1)), 2) if ta else None,
                     'reasoning': rs and rs.group(1) == 'true'}
json.dump(rows, open(sys.argv[1], 'w'), indent=1, ensure_ascii=False)
print(len(rows), 'models with outputSpeed')
