# Human Razavi

A human version of [Razavi-Bench](https://razavi-bench.tokenzhang.com/): people answer the analog-circuit questions one at a time, and the result page shows which AI model their accuracy, time and cost are closest to.

Static site with no build step and no dependencies.

```
index.html          landing page
test.html           test runner (start → questions → results)
css/style.css       all styles (light + dark)
js/i18n.js          UI strings (zh / en) and helpers
js/test.js          sampling, timing, grading, scaling, results
data/config.json    wage, exchange rate, levels, quick-mode range
data/questions.json question pool   ← add questions here
data/models.json    model leaderboard (generated, see below)
img/                question figures
tools/build_models.py  regenerates data/models.json
```

Run locally (JSON is loaded with `fetch`, so `file://` will not work):

```sh
python3 -m http.server 8000   # then open http://localhost:8000
```

## Writing questions (`data/questions.json`)

```jsonc
{
  "questions": [
    {
      "id": "cs-stage-pole-count",      // optional stable slug; never a question number
      "level": 2,                       // 1–5 (see config.levels)
      "type": "fill",                   // "single" | "multi" | "fill"
      "source": "Razavi-Bench part1-011",   // optional, shown in the answer review
      "prompt": { "zh": "…", "en": "…" },   // HTML allowed (<sub>, <sup>, <b>, …)
      "image": "razavi-part1-fig08.png",    // optional, file in img/
      "imageAlt": { "zh": "…", "en": "…" },
      "explanation": { "zh": "…", "en": "…" }
    }
  ]
}
```

- **No question numbers.** Order is decided at run time and the number shown (Q1, Q2, …) is generated. Within a run, questions are grouped by level (easy first) and shuffled inside each level; set `"order": "random"` in `config.json` to shuffle everything.
- **Bilingual fields.** Any text field (`prompt`, option `text`, `explanation`, `imageAlt`, `imageCaption`, `placeholder`, even `image`) may be a plain string or `{ "zh": …, "en": … }`. Language switches at any time without losing progress.
- **Images.** `"image": "file.png"` resolves to `img/file.png`. For several figures use `"images": ["a.png", { "src": "b.png", "caption": { "zh": "…", "en": "…" } }]`. Figures are shown on a white panel, so transparent PNGs work in dark mode.

### Single choice
```jsonc
"type": "single",
"options": [ { "id": "same", "text": { "zh": "不變", "en": "Unchanged" } }, { "id": "double", "text": "…" } ],
"answer": "double",
"shuffle": false            // optional: shuffle option order per run
```
Option letters (A, B, C…) are generated; refer to options by `id`.

### Multiple choice
Same as single, but `"type": "multi"` and `"answer": ["cgd", "csb"]`. Only an exact match counts as correct.

### Fill-in
```jsonc
"type": "fill",
"accept": ["source follower", "SF", "共汲極"],     // first entry is shown as the correct answer
"numeric": { "value": 2, "tolerance": 0 },        // optional
"placeholder": { "zh": "輸入數字", "en": "Enter a number" }
```
- Text matching ignores case, spaces, underscores, full/half-width differences, hyphens between letters and trailing punctuation: `Source-Follower`, `source follower` and `sourcefollower` all match `source follower`.
- `numeric` adds number matching on top of `accept`. It understands SI prefixes and trailing units (`1.5k`, `2 kΩ`, `10 µA`, `3e-3`). `tolerance` is absolute by default; add `"relative": true` to make it a fraction of `value`.

## Modes and scoring

- **Quick:** draws `perLevel` questions from each level (the user picks 5–10; range in `config.quickMode`). Accuracy and average time per question are computed per level, then weighted by the number of questions each level has in the pool. This gives the full-test estimate.
- **Full:** every question. If the user stops early ("Finish now"), the same per-level scaling is applied to what was answered.
- **Cost** = estimated full-test time × `hourlyWageTWD` (220), converted to USD with `twdPerUSD`.
- **Model comparison:** model cost and time are scaled from the benchmark's question count to the pool size. The result page shows:
  - the closest model by accuracy, with its cost and time;
  - the closest model by cost (log distance), with its accuracy;
  - an accuracy-vs-cost scatter and the share of models the user beats.
  The scatter puts all models on one plot.
- A question counts as correct only on an exact match. On the model side, `accuracy` uses the matching definition: the share of answers that got full credit (4/4).

## Model data (`data/models.json`)

Generated from Razavi-Bench's public site data:

```sh
curl -sL https://razavi-bench.tokenzhang.com/data/direct_qa/index.json -o /tmp/index.json
curl -sL https://razavi-bench.tokenzhang.com/assets/pricing.js        -o /tmp/pricing.js
python3 tools/build_models.py /tmp/index.json /tmp/pricing.js > data/models.json
```

Each model has `accuracy` (full-credit %), `score` (the bench's headline 0–4 mean as a %), `costUSD` (one pass, OpenRouter list prices) and `timeSec`.
**Razavi-Bench publishes no timing**, so `timeSec` is an estimate: output tokens ÷ 60 tok/s (change it with `--tps`). The result page labels it as an estimate.
To supply real timings, edit `timeSec` and `timeDefinition`.

## Credits

The questions and figures come from B. Razavi, "Analog Design Experiments With AI," *IEEE Solid-State Circuits Magazine* (2025–2026), via [Razavi-Bench](https://github.com/Arcadia-1/razavi-bench) by Zhishuai Zhang. That repo licenses its code under Apache-2.0. Its benchmark materials are marked for research reference only.
