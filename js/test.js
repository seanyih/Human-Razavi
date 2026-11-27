/* Test runner: start → one question at a time → results.
 * Data: data/config.json, data/questions.json, data/models.json (see README for schemas).
 * Every view is rendered from state S, so switching language re-renders in place without losing progress.
 */
(function () {
  'use strict';

  const $ = sel => document.querySelector(sel);
  const VIEWS = ['vLoading', 'vError', 'vStart', 'vQuiz', 'vResult'];
  const S = {
    cfg: null, models: null, pool: [],
    view: 'vLoading', mode: null, perLevel: 5,
    items: [], i: 0, records: [], draft: null,
    qAccum: 0, qStart: null, tick: null,
    result: null,
  };

  // ---------- utils ----------
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const stripTags = s => String(s).replace(/<[^>]*>/g, '');
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const letter = i => String.fromCharCode(65 + i);
  const zh = () => LANG === 'zh';

  function show(id) {
    S.view = id;
    VIEWS.forEach(v => { $('#' + v).hidden = v !== id; });
    window.scrollTo(0, 0);
  }

  function fmtDur(sec) {
    sec = Math.max(0, Math.round(sec));
    const h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60;
    const p = n => String(n).padStart(2, '0');
    if (zh()) return h ? `${h} 小時 ${p(m)} 分` : m ? `${m} 分 ${p(s)} 秒` : `${s} 秒`;
    return h ? `${h}h ${p(m)}m` : m ? `${m}m ${p(s)}s` : `${s}s`;
  }
  const clock = ms => { const s = Math.floor(ms / 1000); return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; };
  const fmtUSD = v => v == null ? '—' : '$' + (v >= 100 ? Math.round(v).toLocaleString('en-US') : v >= 1 ? v.toFixed(2) : v >= 0.01 ? v.toFixed(3) : v.toPrecision(2));
  const fmtTWD = v => 'NT$ ' + (v >= 100 ? Math.round(v).toLocaleString('en-US') : v.toFixed(1));
  const fmtPct = v => { const r = Math.round(v * 10) / 10; return (Number.isInteger(r) ? r : r.toFixed(1)) + '%'; };
  const fmtScore = v => String(Math.round(v * 100) / 100);
  const fmtX = r => r >= 100 ? Math.round(r).toLocaleString('en-US') : r >= 10 ? String(Math.round(r)) : r.toFixed(1);

  function imgSrc(src) { return /^(https?:|\/|data:|img\/)/.test(src) ? src : 'img/' + src; }
  function figures(q) {
    const list = [];
    if (q.image) list.push({ src: q.image, alt: q.imageAlt, caption: q.imageCaption });
    (q.images || []).forEach(x => list.push(typeof x === 'string' || !x.src ? { src: x } : x));
    if (!list.length) return '';
    return '<div class="figs">' + list.map(f =>
      `<figure><img src="${esc(imgSrc(L(f.src)))}" alt="${esc(stripTags(L(f.alt) || ''))}" loading="lazy">${f.caption ? `<figcaption>${L(f.caption)}</figcaption>` : ''}</figure>`
    ).join('') + '</div>';
  }

  // ---------- grading ----------
  function normText(s) {
    return String(s).normalize('NFKC').toLowerCase().trim()
      .replace(/(?<=\p{L})[-‐–—](?=\p{L})/gu, '')
      .replace(/[\s_]+/g, '')
      .replace(/[。．.,，、;；:：!！?？'"“”‘’]+$/u, '');
  }
  const SI = { f: 1e-15, p: 1e-12, n: 1e-9, u: 1e-6, 'µ': 1e-6, 'μ': 1e-6, m: 1e-3, k: 1e3, K: 1e3, meg: 1e6, M: 1e6, G: 1e9 };
  function parseNum(s) {
    s = String(s).normalize('NFKC').trim().replace(/,/g, '').replace(/×10\^?/g, 'e').replace(/x10\^/gi, 'e');
    const m = s.match(/^([-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?)\s*(meg|[fpnuµμmkKMG](?![a-zA-Z]))?\s*[\p{L}Ω°%/]*$/u);
    if (!m) return null;
    return parseFloat(m[1]) * (m[2] ? SI[m[2]] : 1);
  }
  // Returns a score in [0, 1]. Single choice and fill-in are all-or-nothing.
  // Multi choice: every option is judged on its own (picking a correct one or leaving a wrong one unpicked is right).
  // With n options and k misjudged, the score is (n − 2k) / n, floored at 0. Nothing picked scores 0.
  function grade(q, resp) {
    if (resp == null) return 0;
    if (q.type === 'multi') {
      if (!resp.length) return 0;
      const want = new Set(q.answer || []), picked = new Set(resp), opts = (q.options || []).map(o => o.id);
      if (!opts.length) return 0;
      const k = opts.filter(id => want.has(id) !== picked.has(id)).length;
      return Math.max(0, (opts.length - 2 * k) / opts.length);
    }
    return gradeExact(q, resp) ? 1 : 0;
  }
  function gradeExact(q, resp) {
    if (q.type === 'single') return resp === q.answer;
    if (q.type === 'fill') {
      if (!String(resp).trim()) return false;
      if (q.numeric && typeof q.numeric.value === 'number') {
        const v = parseNum(resp);
        if (v != null) {
          const tol = q.numeric.tolerance || 0;
          const lim = q.numeric.relative ? Math.abs(q.numeric.value) * tol : tol;
          if (Math.abs(v - q.numeric.value) <= lim + 1e-12 * Math.max(1, Math.abs(q.numeric.value))) return true;
        }
      }
      const n = normText(resp);
      return (q.accept || []).some(a => normText(a) === n);
    }
    return false;
  }

  // ---------- load ----------
  async function init() {
    try {
      const cfg = await loadJSON('data/config.json');
      const [qs, ms] = await Promise.all([loadJSON(cfg.questionsFile || 'data/questions.json'), loadJSON(cfg.modelsFile || 'data/models.json')]);
      S.cfg = cfg;
      S.models = ms;
      S.pool = (qs.questions || []).map((q, k) => Object.assign({}, q, {
        id: q.id || 'q' + (k + 1),
        level: cfg.levels.includes(q.level) ? q.level : cfg.levels[0],
      })).filter(q => ['single', 'multi', 'fill'].includes(q.type));
      S.perLevel = cfg.quickMode.perLevelDefault;
      I18N_VARS = { wage: cfg.hourlyWageTWD, rate: cfg.twdPerUSD };
      renderStart(); show('vStart');
    } catch (e) {
      console.error(e);
      $('#errMsg').textContent = t('err.load', { msg: e.message });
      show('vError');
    }
  }

  // ---------- start ----------
  function levelCounts() {
    const c = {}; S.cfg.levels.forEach(l => { c[l] = 0; });
    S.pool.forEach(q => { c[q.level]++; });
    return c;
  }
  function quickCount() {
    const c = levelCounts();
    return S.cfg.levels.reduce((s, l) => s + Math.min(S.perLevel, c[l]), 0);
  }
  function renderStart() {
    const c = levelCounts(), N = S.pool.length, qm = S.cfg.quickMode;
    const strip = S.cfg.levels.map(l => `<span>${t('level.' + l)} · ${c[l]}</span>`).join('');
    $('#vStart').innerHTML = `
      <div class="start-head">
        <div><div class="kicker">${t('start.pool', { n: N })}</div><h1>${t('start.title')}</h1></div>
        <div class="levels-strip" title="${esc(t('start.byLevel'))}">${strip}</div>
      </div>
      ${N ? '' : `<div class="err">${t('start.empty')}</div>`}
      <div class="mode-grid">
        <div class="card mode">
          <h3>${t('start.quick')}</h3>
          <p>${t('start.quick.d')}</p>
          <div class="row">
            <span class="muted" style="font-size:14px">${t('start.perLevel')}</span>
            <span class="stepper" role="group">
              <button type="button" data-step="-1" aria-label="−">−</button>
              <output>${S.perLevel}</output>
              <button type="button" data-step="1" aria-label="+">+</button>
            </span>
          </div>
          <div class="row" style="padding-top:4px">
            <span class="muted" style="font-size:14px">${t('start.willAsk', { n: quickCount() })}</span>
            <button class="btn" type="button" data-go="quick" ${N ? '' : 'disabled'}>${t('start.go')} <span class="arr">→</span></button>
          </div>
        </div>
        <div class="card mode">
          <h3>${t('start.full')}</h3>
          <p>${t('start.full.d', { n: N })}</p>
          <div class="row">
            <span class="muted" style="font-size:14px">${t('start.willAsk', { n: N })}</span>
            <button class="btn" type="button" data-go="full" ${N ? '' : 'disabled'}>${t('start.go')} <span class="arr">→</span></button>
          </div>
        </div>
      </div>`;
    $('#vStart').querySelectorAll('[data-step]').forEach(b => b.onclick = () => {
      S.perLevel = Math.min(qm.perLevelMax, Math.max(qm.perLevelMin, S.perLevel + +b.dataset.step));
      renderStart();
    });
    $('#vStart').querySelectorAll('[data-go]').forEach(b => b.onclick = () => begin(b.dataset.go));
  }

  // ---------- quiz ----------
  function begin(mode) {
    S.mode = mode;
    // Full mode: every question in questions.json order. Quick mode: a random sample per level, easiest level first.
    let chosen = [];
    if (mode === 'full') chosen = S.pool.slice();
    else for (const l of S.cfg.levels) chosen = chosen.concat(shuffle(S.pool.filter(q => q.level === l)).slice(0, S.perLevel));
    // Options always keep their order from the JSON.
    S.items = chosen.map(q => ({ q, optOrder: (q.options || []).map(o => o.id).filter(Boolean) }));
    S.i = 0; S.records = [];
    startQuestion();
    show('vQuiz');
    clearInterval(S.tick);
    S.tick = setInterval(updateClock, 250);
  }

  function startQuestion() {
    const it = S.items[S.i];
    S.draft = it.q.type === 'multi' ? [] : it.q.type === 'fill' ? '' : null;
    S.qAccum = 0; S.qStart = document.hidden ? null : performance.now();
    renderQuiz(true);
  }
  function qElapsed() { return S.qAccum + (S.qStart != null ? performance.now() - S.qStart : 0); }
  function totalElapsed() { return S.records.reduce((s, r) => s + r.ms, 0) + (S.view === 'vQuiz' ? qElapsed() : 0); }
  function updateClock() { const el = $('#qClock'); if (el) el.textContent = clock(totalElapsed()); }
  document.addEventListener('visibilitychange', () => {
    if (S.view !== 'vQuiz') return;
    if (document.hidden && S.qStart != null) { S.qAccum += performance.now() - S.qStart; S.qStart = null; }
    else if (!document.hidden && S.qStart == null) S.qStart = performance.now();
  });

  function hasAnswer() {
    const d = S.draft;
    return Array.isArray(d) ? d.length > 0 : d != null && String(d).trim() !== '';
  }

  function renderQuiz(focus) {
    const it = S.items[S.i], q = it.q, n = S.items.length;
    let input = '';
    if (q.type === 'fill') {
      input = `<input class="fill" id="fillIn" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${esc(L(q.placeholder) || t('quiz.fillPlaceholder'))}" value="${esc(S.draft)}">`;
    } else {
      const multi = q.type === 'multi';
      const byId = Object.fromEntries(q.options.map(o => [o.id, o]));
      input = (multi ? `<div class="hint">${t('quiz.multiHint')}</div>` : '') + '<div class="opts" role="' + (multi ? 'group' : 'radiogroup') + '">' +
        it.optOrder.map((id, k) => {
          const sel = multi ? S.draft.includes(id) : S.draft === id;
          return `<label class="opt ${multi ? 'check' : 'radio'} ${sel ? 'sel' : ''}">
            <input type="${multi ? 'checkbox' : 'radio'}" name="opt" value="${esc(id)}" ${sel ? 'checked' : ''}>
            <span class="key">${letter(k)}</span><span>${L(byId[id].text)}</span></label>`;
        }).join('') + '</div>';
    }
    $('#vQuiz').innerHTML = `
      <div class="qbar">
        <span>${t('quiz.progress', { i: S.i + 1, n })}</span>
        <span class="chip">${t('level')} ${q.level} · ${t('level.' + q.level)}</span>
        <span class="chip">${t('type.' + q.type)}</span>
        <span class="timer" id="qClock">${clock(totalElapsed())}</span>
      </div>
      <div class="pbar"><i style="width:${(S.i / n) * 100}%"></i></div>
      <div class="card qcard">
        <div class="qnum">Q${S.i + 1}</div>
        <div class="qtext">${L(q.prompt)}</div>
        ${figures(q)}
        ${input}
        <div class="qactions">
          <button class="btn" type="button" id="bSubmit" ${hasAnswer() ? '' : 'disabled'}>${t('quiz.submit')} <span class="arr">→</span></button>
          <button class="btn ghost" type="button" id="bSkip">${t('quiz.skip')}</button>
          ${S.records.length ? `<button class="linkbtn" type="button" id="bQuit">${t('quiz.quit')}</button>` : ''}
        </div>
      </div>`;

    const refreshSubmit = () => { $('#bSubmit').disabled = !hasAnswer(); };
    if (q.type === 'fill') {
      const inp = $('#fillIn');
      inp.oninput = () => { S.draft = inp.value; refreshSubmit(); };
      inp.onkeydown = e => { if (e.key === 'Enter' && !e.isComposing && hasAnswer()) submit(false); };
      if (focus) inp.focus();
    } else {
      $('#vQuiz').querySelectorAll('.opt input').forEach(inp => inp.onchange = () => {
        if (q.type === 'multi') {
          S.draft = S.draft.includes(inp.value) ? S.draft.filter(x => x !== inp.value) : S.draft.concat(inp.value);
        } else S.draft = inp.value;
        renderQuiz(false);
        const again = $('#vQuiz').querySelector(`.opt input[value="${CSS.escape(inp.value)}"]`);
        if (again) again.focus({ preventScroll: true });
      });
    }
    $('#bSubmit').onclick = () => submit(false);
    $('#bSkip').onclick = () => submit(true);
    const bq = $('#bQuit'); if (bq) bq.onclick = finish;
  }

  // Keyboard: A–Z picks an option, Enter submits.
  document.addEventListener('keydown', e => {
    if (S.view !== 'vQuiz' || e.target.tagName === 'INPUT' && e.target.type === 'text' || e.metaKey || e.ctrlKey || e.altKey) return;
    const it = S.items[S.i]; if (!it) return;
    if (e.key === 'Enter' && hasAnswer() && e.target.tagName !== 'BUTTON') { e.preventDefault(); submit(false); return; }
    if (it.q.type === 'fill' || e.key.length !== 1) return;
    const k = e.key.toUpperCase().charCodeAt(0) - 65;
    if (k < 0 || k >= it.optOrder.length) return;
    const inp = $('#vQuiz').querySelectorAll('.opt input')[k];
    if (inp) { inp.checked = !inp.checked || it.q.type === 'single'; inp.dispatchEvent(new Event('change')); }
  });

  function submit(skipped) {
    const it = S.items[S.i];
    const resp = skipped ? null : (Array.isArray(S.draft) ? S.draft.slice() : S.draft);
    const score = skipped ? 0 : grade(it.q, resp);
    S.records.push({ item: it, resp, skipped, score, correct: score >= 1, ms: qElapsed() });
    S.i++;
    if (S.i >= S.items.length) finish(); else startQuestion();
  }

  // ---------- results ----------
  function compute() {
    const cfg = S.cfg, recs = S.records, counts = levelCounts();
    const byLevel = cfg.levels.map(l => {
      const rs = recs.filter(r => r.item.q.level === l);
      const timed = rs.filter(r => !r.unanswered);   // questions never shown (Finish now) carry no timing
      const ms = timed.reduce((s, r) => s + r.ms, 0);
      return { level: l, pool: counts[l], asked: rs.length, correct: rs.reduce((s, r) => s + r.score, 0), avgSec: timed.length ? ms / timed.length / 1000 : null };
    });
    const timedAll = recs.filter(r => !r.unanswered);
    const fallbackSec = timedAll.length ? timedAll.reduce((s, r) => s + r.ms, 0) / timedAll.length / 1000 : 0;
    // Linear scaling: each level's accuracy and avg time are weighted by that level's size in the pool.
    const used = byLevel.filter(b => b.asked > 0 && b.pool > 0);
    const W = used.reduce((s, b) => s + b.pool, 0) || 1;
    const acc = used.length ? 100 * used.reduce((s, b) => s + (b.correct / b.asked) * b.pool, 0) / W : 0;
    const poolSec = used.reduce((s, b) => s + (b.avgSec != null ? b.avgSec : fallbackSec) * b.pool, 0);
    const actualSec = recs.reduce((s, r) => s + r.ms, 0) / 1000;
    const scaled = byLevel.some(b => b.asked !== b.pool);
    // Scale the user's result up to the benchmark's paper (models stay as published).
    const N = S.models.questionCount || W;   // questions the comparison covers
    const estSec = poolSec * (N / W);
    const twd = estSec / 3600 * cfg.hourlyWageTWD;
    const usd = twd / cfg.twdPerUSD;
    const models = S.models.models.filter(m => m.costUSD != null).map(m => Object.assign({}, m, { cost: m.costUSD, time: m.timeSec }));
    const lc = x => Math.log(Math.max(x, 1e-6));
    const byAcc = models.slice().sort((a, b) => Math.abs(a.accuracy - acc) - Math.abs(b.accuracy - acc) || Math.abs(lc(a.cost) - lc(usd)) - Math.abs(lc(b.cost) - lc(usd)))[0];
    const byCost = models.slice().sort((a, b) => Math.abs(lc(a.cost) - lc(usd)) - Math.abs(lc(b.cost) - lc(usd)))[0];
    const beaten = models.filter(m => m.accuracy < acc).length;
    return { byLevel, acc, estSec, actualSec, scaled, twd, usd, N, models, byAcc, byCost, beaten,
      correct: recs.reduce((s, r) => s + r.score, 0), asked: recs.length };
  }

  function finish() {
    clearInterval(S.tick);
    // Finishing early: every question not yet answered counts as wrong.
    for (; S.i < S.items.length; S.i++) S.records.push({ item: S.items[S.i], resp: null, skipped: true, unanswered: true, score: 0, correct: false, ms: 0 });
    S.result = compute();
    show('vResult');   // show first: the chart sizes itself from its visible width
    renderResult();
  }

  function ratioPhrase(user, model, kind) {
    if (!(user > 0) || !(model > 0)) return '';
    const r = user / model;
    if (r > 1.15) return t(kind === 'cost' ? 'res.cheaper' : 'res.faster', { x: fmtX(r) });
    if (r < 1 / 1.15) return t(kind === 'cost' ? 'res.pricier' : 'res.slower', { x: fmtX(1 / r) });
    return t('res.sameish');
  }
  function accPhrase(you, model) {
    const d = model - you;
    if (Math.abs(d) < 0.5) return t('res.equal');
    return t(d > 0 ? 'res.higher' : 'res.lower', { d: Math.round(Math.abs(d)) });
  }
  function modelCard(title, m, R) {
    if (!m) return '';
    return `<div class="card cmp">
      <div class="q">${title}</div>
      <div class="name">${esc(m.name)}<span class="prov">${esc(m.provider)}</span></div>
      <dl>
        <dt>${t('res.modelAcc')}</dt><dd><b>${fmtPct(m.accuracy)}</b><span>${accPhrase(R.acc, m.accuracy)}</span></dd>
        <dt>${t('res.modelCost')}</dt><dd><b>${fmtUSD(m.cost)}</b><span>${ratioPhrase(R.usd, m.cost, 'cost')}</span></dd>
        <dt>${t('res.modelTime')}</dt><dd><b>≈ ${fmtDur(m.time)}</b><span>${ratioPhrase(R.estSec, m.time, 'time')}</span></dd>
        ${m.tps ? `<dt>${t('res.modelSpeed')}</dt><dd><b>${Math.round(m.tps)} tok/s</b><span title="${esc(m.speedNote || '')}">${t('speed.' + (m.speedBasis || 'fallback'))}</span></dd>` : ''}
      </dl></div>`;
  }

  function answerText(it, resp) {
    const q = it.q;
    if (resp == null) return `<span class="muted">${t('res.skipped')}</span>`;
    if (q.type === 'fill') return esc(resp);
    const byId = Object.fromEntries(q.options.map(o => [o.id, o]));
    const ids = Array.isArray(resp) ? it.optOrder.filter(id => resp.includes(id)) : [resp];
    return ids.map(id => `${letter(it.optOrder.indexOf(id))}. ${L(byId[id].text)}`).join('<br>');
  }
  function rightText(it) {
    const q = it.q;
    if (q.type === 'fill') return esc((q.accept || [])[0] ?? (q.numeric ? q.numeric.value : ''));
    return answerText(it, q.answer);
  }

  function renderResult() {
    const R = S.result, cfg = S.cfg;
    const open = new Set([...document.querySelectorAll('.rv[open]')].map(d => d.dataset.k));
    const top = R.byAcc;
    const lvRows = R.byLevel.map(b => `<tr><td>${b.level} · ${t('level.' + b.level)}</td><td>${b.pool}</td><td>${b.asked}</td><td>${fmtScore(b.correct)}</td>
      <td>${b.asked ? fmtPct(100 * b.correct / b.asked) : '—'}</td><td>${b.avgSec != null ? fmtDur(b.avgSec) : '—'}</td></tr>`).join('');
    const review = S.records.map((r, k) => {
      const q = r.item.q;
      const also = q.type === 'fill' && (q.accept || []).length > 1 ? `<dt>${t('res.alsoAccept')}</dt><dd>${q.accept.slice(1).map(esc).join(' · ')}</dd>` : '';
      return `<details class="rv" data-k="${k}" ${open.has(String(k)) ? 'open' : ''}>
        <summary><span class="no">Q${k + 1}</span><span class="sm">${esc(stripTags(L(q.prompt)))}</span>
          <span class="tm">${fmtDur(r.ms / 1000)}</span>
          <span class="mark ${r.score >= 1 ? 'ok' : r.score > 0 ? 'part' : 'no'}">${r.score >= 1 ? '✓ ' + t('res.correct') : r.score > 0 ? '◐ ' + t('res.partial', { s: fmtScore(r.score) }) : '✗ ' + t('res.wrong')}</span></summary>
        <div class="body">
          <div class="qtext">${L(q.prompt)}</div>
          ${figures(q)}
          <dl class="ans">
            <dt>${t('res.yourAns')}</dt><dd class="${r.score >= 1 ? 'good' : r.score > 0 ? '' : 'bad'}">${answerText(r.item, r.resp)}</dd>
            <dt>${t('res.rightAns')}</dt><dd>${rightText(r.item)}</dd>
            ${also}
            <dt>${t('level')}</dt><dd>${q.level} · ${t('level.' + q.level)} · ${t('type.' + q.type)}${q.source ? ` · <span class="muted">${esc(q.source)}</span>` : ''}</dd>
          </dl>
          ${q.explanation ? `<div class="expl"><b>${t('res.explain')}</b>${L(q.explanation)}</div>` : ''}
        </div></details>`;
    }).join('');

    $('#vResult').innerHTML = `
      <div class="res-head">
        <div class="kicker">${t('res.kicker')}</div>
        <h1>${t('res.closest')} <em>${top ? esc(top.name) : '—'}</em></h1>
        <p>${top ? t('res.closestSub', { you: fmtPct(R.acc), model: fmtPct(top.accuracy) }) : ''}</p>
      </div>
      <div class="stats">
        <div class="stat"><div class="lbl">${t('res.acc')}${R.scaled ? ' · ' + t('res.est') : ''}</div><div class="val">${fmtPct(R.acc)}</div><div class="sub">${t('res.answered', { c: fmtScore(R.correct), n: R.asked })}</div></div>
        <div class="stat"><div class="lbl">${t('res.time')}${R.scaled ? ' · ' + t('res.est') : ''}</div><div class="val">${fmtDur(R.estSec)}</div><div class="sub">${R.scaled ? t('res.actual', { v: fmtDur(R.actualSec) }) : '&nbsp;'}</div></div>
        <div class="stat"><div class="lbl">${t('res.cost')} · NT$ ${cfg.hourlyWageTWD}/h</div><div class="val">${fmtTWD(R.twd)}</div><div class="sub">≈ US${fmtUSD(R.usd)}</div></div>
      </div>
      <div class="cmp-grid">
        ${modelCard(t('res.sameLevel'), R.byAcc, R)}
        ${modelCard(t('res.sameCost'), R.byCost, R)}
      </div>
      <p class="beat">${t('res.beat', { p: fmtPct(100 * R.beaten / Math.max(1, R.models.length)), k: R.beaten, m: R.models.length })}</p>

      <div class="block">
        <h2>${t('res.chart')}</h2>
        <div class="card chartbox" id="chart"></div>
        <p class="note">${t('res.chartNote', { n: R.N })}</p>
      </div>

      <div class="block">
        <h2>${t('res.levels')}</h2>
        <div class="tblwrap"><table class="lv"><thead><tr><th>${t('res.col.level')}</th><th>${t('res.col.pool')}</th><th>${t('res.col.asked')}</th><th>${t('res.col.correct')}</th><th>${t('res.col.acc')}</th><th>${t('res.col.avg')}</th></tr></thead><tbody>${lvRows}</tbody></table></div>
        <p class="note">${R.scaled ? t('res.noteQuick') : t('res.noteFull')} ${t('res.noteModels', { nm: S.models.questionCount })}</p>
      </div>

      <div class="block">
        <h2>${t('res.review')} <button class="linkbtn" type="button" id="bExpand"></button></h2>
        <div class="review">${review}</div>
      </div>

      <div class="endrow">
        <button class="btn" type="button" id="bRetake">${t('res.retake')}</button>
        <a class="btn ghost" href="${esc(cfg.benchUrl)}" target="_blank" rel="noopener">${t('res.toBench')}</a>
      </div>`;

    drawChart($('#chart'), R);
    const bE = $('#bExpand');
    const sync = () => { const all = [...document.querySelectorAll('.rv')]; bE.textContent = all.length && all.every(d => d.open) ? t('res.collapseAll') : t('res.expandAll'); };
    bE.onclick = () => { const all = [...document.querySelectorAll('.rv')]; const to = !all.every(d => d.open); all.forEach(d => { d.open = to; }); sync(); };
    document.querySelectorAll('.rv').forEach(d => d.addEventListener('toggle', sync));
    sync();
    $('#bRetake').onclick = () => { renderStart(); show('vStart'); };
  }

  // Accuracy (y) vs cost (x, log) scatter. Grey dots = models; ink = the two matched models; accent = you.
  function drawChart(box, R) {
    const W = Math.max(300, Math.round(box.clientWidth - 24) || 960), H = W < 600 ? 300 : Math.round(Math.min(W * 0.4, 420)), m = { l: 44, r: 16, t: 16, b: 40 };
    const pts = R.models.filter(p => p.cost > 0);
    const xs = pts.map(p => p.cost).concat(R.usd > 0 ? [R.usd] : []);
    let x0 = Math.floor(Math.log10(Math.min(...xs))), x1 = Math.ceil(Math.log10(Math.max(...xs)));
    if (x1 === x0) x1++;
    const X = v => m.l + (Math.log10(Math.max(v, 10 ** x0)) - x0) / (x1 - x0) * (W - m.l - m.r);
    const Y = v => m.t + (1 - v / 100) * (H - m.t - m.b);
    let g = '<g class="grid">';
    for (let v = 0; v <= 100; v += 25) g += `<line x1="${m.l}" x2="${W - m.r}" y1="${Y(v)}" y2="${Y(v)}"/>`;
    for (let e = x0; e <= x1; e++) g += `<line x1="${X(10 ** e)}" x2="${X(10 ** e)}" y1="${m.t}" y2="${H - m.b}"/>`;
    g += '</g><g class="axis">';
    for (let v = 0; v <= 100; v += 25) g += `<text x="${m.l - 8}" y="${Y(v) + 4}" text-anchor="end">${v}%</text>`;
    const every = (W - m.l - m.r) / (x1 - x0) < 64 ? 2 : 1;
    for (let e = x0; e <= x1; e++) if ((e - x0) % every === 0) g += `<text x="${X(10 ** e)}" y="${H - m.b + 20}" text-anchor="middle">$${+(10 ** e).toPrecision(1)}</text>`;
    g += '</g>';
    const hl = new Set([R.byAcc && R.byAcc.key, R.byCost && R.byCost.key]);
    let dots = '', hits = '';
    pts.forEach((p, k) => {
      dots += `<circle class="dot ${hl.has(p.key) ? 'hl' : ''}" cx="${X(p.cost)}" cy="${Y(p.accuracy)}" r="${hl.has(p.key) ? 5.5 : 4.5}"/>`;
      hits += `<circle class="hit" data-k="${k}" cx="${X(p.cost)}" cy="${Y(p.accuracy)}" r="10"/>`;
    });
    const label = (x, y, text, cls) => {
      // Right of the dot when it fits, otherwise above it (end-anchored) so it does not run into neighbours.
      if (x + 12 + String(text).length * 7.5 < W) return `<text class="lbl lbl-bg ${cls || ''}" x="${x + 10}" y="${y + 4}">${esc(text)}</text>`;
      return `<text class="lbl lbl-bg ${cls || ''}" x="${Math.min(x + 8, W - 4)}" y="${Math.max(y - 12, 12)}" text-anchor="end">${esc(text)}</text>`;
    };
    let labels = '';
    [...hl].filter(Boolean).forEach(key => { const p = pts.find(q => q.key === key); if (p) labels += label(X(p.cost), Y(p.accuracy), p.name); });
    const you = R.usd > 0 ? `<circle class="you" cx="${X(R.usd)}" cy="${Y(R.acc)}" r="7"/>${label(X(R.usd), Y(R.acc), t('res.you'), 'you-l')}
      <circle class="hit" data-k="you" cx="${X(R.usd)}" cy="${Y(R.acc)}" r="12"/>` : '';
    box.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(t('res.chart'))}">${g}${dots}${labels}${you}${hits}</svg><div class="tip"></div>`;

    const tip = box.querySelector('.tip'), svg = box.querySelector('svg');
    box.querySelectorAll('.hit').forEach(c => {
      c.addEventListener('mouseenter', () => {
        const k = c.dataset.k;
        const p = k === 'you' ? { name: t('res.you'), accuracy: R.acc, cost: R.usd } : pts[+k];
        tip.textContent = `${p.name} · ${fmtPct(p.accuracy)} · ${fmtUSD(p.cost)}`;
        const sr = svg.getBoundingClientRect(), br = box.getBoundingClientRect(), s = sr.width / W;
        tip.style.left = (sr.left - br.left + +c.getAttribute('cx') * s) + 'px';
        tip.style.top = (sr.top - br.top + +c.getAttribute('cy') * s) + 'px';
        tip.classList.add('on');
      });
      c.addEventListener('mouseleave', () => tip.classList.remove('on'));
    });
  }

  let rz;
  window.addEventListener('resize', () => {
    clearTimeout(rz);
    rz = setTimeout(() => { if (S.view === 'vResult' && $('#chart')) drawChart($('#chart'), S.result); }, 150);
  });

  // ---------- language switch: re-render current view, keep state ----------
  window.addEventListener('langchange', () => {
    if (S.view === 'vStart') renderStart();
    else if (S.view === 'vQuiz') renderQuiz(false);
    else if (S.view === 'vResult') renderResult();
    else if (S.view === 'vError') { /* message stays in the language it failed in */ }
  });
  window.addEventListener('beforeunload', e => { if (S.view === 'vQuiz') { e.preventDefault(); e.returnValue = t('quiz.leave'); } });

  init();
})();
