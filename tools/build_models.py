#!/usr/bin/env python3
"""Build data/models.json from Razavi-Bench's public site data.

Usage:
  curl -sL https://razavi-bench.tokenzhang.com/data/direct_qa/index.json -o index.json
  curl -sL https://razavi-bench.tokenzhang.com/assets/pricing.js        -o pricing.js
  python3 tools/build_models.py index.json pricing.js > data/models.json

Per model, one benchmark pass (50 questions) is recorded:
  accuracy  - % of answers with full credit (score 4/4), same definition a human gets here
  score     - Razavi-Bench headline score (mean 0-4 score as a %)
  costUSD   - API cost of ONE pass (total over 3 rollouts / 3), OpenRouter list prices
  timeSec   - ESTIMATED wall time of one pass = output tokens / --tps (bench publishes no timing)
"""
import argparse, json, re, sys
from datetime import datetime, timezone

ap = argparse.ArgumentParser()
ap.add_argument("index_json"); ap.add_argument("pricing_js")
ap.add_argument("--tps", type=float, default=60.0, help="assumed output tokens/sec for time estimate")
a = ap.parse_args()

idx = json.load(open(a.index_json, encoding="utf-8"))
js = open(a.pricing_js, encoding="utf-8").read()
price = {k: [float(x) for x in v.split(",")]
         for k, v in re.findall(r"^\s*([a-z0-9_]+):\[([0-9.,\s]+)\]", js, re.M)}

def lookup(key):
    if key in price: return price[key]
    for k in price:
        if key.startswith(k): return price[k]
    return None

qn = idx["benchmark"]["question_count"]
out = []
for m in idx["models"]:
    s = m["summary"]
    ov = s["scores"]["overall"]["active"]
    rollouts = s.get("rollout_count") or 3
    tk = s["tokens"]["totals"]
    p = lookup(m["model_key"])
    cost = None
    if p:
        cached = tk.get("cached_input_tokens") or 0
        cost = ((tk["input_tokens"] - cached) * p[0] + cached * p[2] + tk["output_tokens"] * p[1]) / 1e6 / rollouts
    out_tok = tk["output_tokens"] / rollouts
    out.append({
        "key": m["model_key"],
        "name": m["display_name"],
        "provider": m["provider"],
        "accuracy": round(100 * ov["correct_count"] / ov["response_count"], 2),
        "score": round(ov["score_percent"], 2),
        "costUSD": None if cost is None else round(cost, 4),
        "timeSec": round(out_tok / a.tps),
        "outputTokens": round(out_tok),
    })
out.sort(key=lambda x: -x["accuracy"])
json.dump({
    "source": "Razavi-Bench direct QA (https://razavi-bench.tokenzhang.com/), generated " + idx.get("generated_at", ""),
    "builtAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
    "questionCount": qn,
    "accuracyDefinition": "percent of answers graded 4/4 (full credit), averaged over rollouts",
    "costDefinition": "USD per single pass over all questions, OpenRouter list prices",
    "timeDefinition": f"ESTIMATE: output tokens per pass / {a.tps:g} tokens per second",
    "timeEstimated": True,
    "models": out,
}, sys.stdout, ensure_ascii=False, indent=1)
sys.stdout.write("\n")
