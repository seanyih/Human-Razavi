/* Bilingual UI strings + helpers.
 * t(key, vars)  -> UI string in current language, {name} placeholders filled from vars
 * L(field)      -> content field from JSON: either a plain string or {"zh": "...", "jj": "...", "en": "..."}
 * setLang(lang) -> switch language everywhere, fires a "langchange" event on window
 * Languages: zh (中文), jj (晶晶體: Chinese with technical terms in English), en.
 * jj is optional everywhere and falls back to zh; UI strings have no jj set and always use zh.
 * Static markup: <el data-i18n="key"> (text) or <el data-i18n-html="key"> (HTML).
 */
const I18N = {
  zh: {
    'nav.home': '首頁',
    'nav.test': '開始測試',
    'nav.bench': 'Razavi-Bench',

    'home.kicker': '類比電路 × 大型語言模型',
    'home.title': '你的電子學成績，<br>最接近哪個 AI？',
    'home.lede': '題目改編自 Behzad Razavi 在 IEEE Solid-State Circuits Magazine 對 AI 的類比設計考題。作答後，我們用同一份排行榜，把你的正確率、耗時與時薪成本放到 {n} 個模型旁邊比較。',
    'home.cta': '開始測試',
    'home.cta2': '看模型原始排行',
    'home.ladder': '排行榜節選 · 完全正確率',
    'home.you': '你？',
    'home.how': '怎麼玩',
    'home.step1.t': '一次一題',
    'home.step1.d': '選擇、複選、填充。填充題接受常見寫法，例如 source follower / SF。',
    'home.step2.t': '計時與計價',
    'home.step2.d': '每題作答時間會被記錄，並以時薪 NT$ {wage} 換算成你的「推論成本」。',
    'home.step3.t': '找到你的模型',
    'home.step3.d': '程度最接近的是誰、它花多少錢；同樣的錢，模型能做到什麼程度。',
    'home.modes': '兩種模式',
    'home.mode.quick': '快速：每個難度抽 {min}–{max} 題，按各難度題數線性換算成全卷分數。',
    'home.mode.full': '完整：全部作答，和模型跑同一份考卷。',
    'home.credit': '題目來源與模型數據：<a href="{bench}" target="_blank" rel="noopener">Razavi-Bench</a>（Zhishuai Zhang），原題出自 B. Razavi, “Analog Design Experiments With AI,” IEEE SSC Magazine。本站與原作者無關。',

    'test.title': '測試',
    'start.title': '選擇模式',
    'start.pool': '題庫共 {n} 題',
    'start.byLevel': '各難度題數',
    'start.quick': '快速模式',
    'start.quick.d': '每個難度抽題，結果線性換算到全卷。',
    'start.perLevel': '每個難度',
    'start.unit.q': '題',
    'start.willAsk': '本次 {n} 題',
    'start.full': '完整模式',
    'start.full.d': '全部 {n} 題依題庫順序作答，結果不需換算。',
    'start.go': '開始',
    'start.empty': '題庫是空的。請在 data/questions.json 加入題目。',

    'level': '難度',
    'level.1': '入門', 'level.2': '基礎', 'level.3': '進階', 'level.4': '困難', 'level.5': '專家',
    'type.single': '單選', 'type.multi': '複選', 'type.fill': '填充',
    'quiz.progress': '第 {i} / {n} 題',
    'quiz.submit': '送出',
    'quiz.skip': '不會，跳過',
    'quiz.multiHint': '可選多項。共 n 個選項，每個選項獨立判斷；全對得 1 分，錯 k 個選項得 (n − 2k)/n 分，最低 0 分。',
    'quiz.fillPlaceholder': '輸入答案',
    'quiz.quit': '結束並看結果',
    'quiz.leave': '測試進行中，離開會遺失進度。',

    'res.kicker': '測試結果',
    'res.closest': '你的程度最接近',
    'res.closestSub': '你的正確率 {you}，它是 {model}。',
    'res.acc': '正確率',
    'res.time': '耗時',
    'res.cost': '成本',
    'res.est': '全卷換算',
    'res.actual': '實際 {v}',
    'res.answered': '得分 {c} / {n}',
    'res.sameLevel': '程度相近的模型，花多少錢',
    'res.sameCost': '花一樣的錢，模型能到什麼程度',
    'res.modelAcc': '正確率',
    'res.modelCost': '成本',
    'res.modelTime': '耗時',
    'res.cheaper': '比你便宜 {x} 倍',
    'res.pricier': '比你貴 {x} 倍',
    'res.sameish': '跟你差不多',
    'res.faster': '比你快 {x} 倍',
    'res.slower': '比你慢 {x} 倍',
    'res.higher': '比你高 {d} 個百分點',
    'res.lower': '比你低 {d} 個百分點',
    'res.equal': '和你一樣',
    'res.beat': '你的正確率高於 {p} 的模型（{k} / {m}）。',
    'res.chart': '正確率 vs. 成本',
    'res.chartNote': '成本為對數座標。你的耗時與成本已換算為全卷 {n} 題；模型數據為原始值。',
    'res.you': '你',
    'res.levels': '各難度表現',
    'res.col.level': '難度', 'res.col.asked': '作答', 'res.col.correct': '得分', 'res.col.acc': '正確率', 'res.col.avg': '平均每題', 'res.col.pool': '題庫題數',
    'res.review': '作答紀錄',
    'res.expandAll': '全部展開',
    'res.collapseAll': '全部收合',
    'res.yourAns': '你的答案',
    'res.rightAns': '正確答案',
    'res.alsoAccept': '也接受',
    'res.skipped': '（跳過）',
    'res.explain': '解析',
    'cm.1': '你的成績不如亂猜。', 'cm.2': '你的電子學教授在角落哭泣。', 'cm.3': '你即將被 AI 取代，現在去種菜還來得及。',
    'cm.4': '重修就好喔。', 'cm.5': '還行。', 'cm.6': '你不錯，但 Claude 更便宜。', 'cm.7': '偷卷。',
    'cm.8': '你電子學 A+，但 Claude 更便宜。', 'cm.9': '你是有背景的當廉價勞工。', 'cm.10': '下一個蒸餾的就是你。',
    'cm.11': '你台大電子所畢業，但 Claude 更便宜。', 'cm.12': '早安，Behzad Razavi。',
    'cm.guess': '亂猜（全選 A）',
    'share.btn': '分享成績圖片', 'share.title': '分享你的成績', 'share.save': '儲存圖片', 'share.send': '傳給朋友', 'share.close': '關閉',
    'share.closest': '我最接近的 AI', 'share.acc': '答對率', 'share.cost': '成本', 'share.tag': '你的電子學成績最接近哪個 AI？', 'share.copied': '已複製連結',
    'res.retake': '再測一次',
    'res.toBench': '看完整模型排行',
    'res.noteQuick': '快速模式：各難度正確率與平均作答時間，依題庫中各難度題數加權，線性換算為全卷結果。',
    'res.noteFull': '完整模式：全部作答，未經換算。',
    'res.noteModels': '模型數據來自 Razavi-Bench（{nm} 題、3 次取平均；正確率 = 拿到滿分 4/4 的比例）。Razavi-Bench 沒有公開耗時，模型耗時 = 輸出 token 數 ÷ 輸出速度 + 每題延遲；速度優先採用 Artificial Analysis 實測，其次為網路上的數據，都沒有時借用同系列模型。',
    'res.modelSpeed': '速度',
    'speed.measured': 'Artificial Analysis 實測',
    'speed.web': '網路數據',
    'speed.proxy': '無公開數據，借用同系列',
    'speed.fallback': '無數據，預設值',
    'res.correct': '正確', 'res.wrong': '錯誤', 'res.partial': '部分 {s}',
    'res.sec': '秒',

    'err.load': '資料載入失敗：{msg}。請用本機伺服器開啟（例如 python3 -m http.server），不要直接開檔案。',
    'lang.switch': '晶晶體',
  },
  en: {
    'nav.home': 'Home',
    'nav.test': 'Take the test',
    'nav.bench': 'Razavi-Bench',

    'home.kicker': 'Analog circuits × language models',
    'home.title': 'Which AI is your<br>electronics score closest to?',
    'home.lede': 'Questions adapted from the analog-design exam Behzad Razavi gave AI models in IEEE Solid-State Circuits Magazine. When you finish, your accuracy, time and hourly-wage cost are placed next to {n} models from the same leaderboard.',
    'home.cta': 'Take the test',
    'home.cta2': 'See the model leaderboard',
    'home.ladder': 'From the leaderboard · full-credit rate',
    'home.you': 'You?',
    'home.how': 'How it works',
    'home.step1.t': 'One question at a time',
    'home.step1.d': 'Single choice, multiple choice and fill-in. Fill-ins accept common forms, e.g. source follower / SF.',
    'home.step2.t': 'Timed and priced',
    'home.step2.d': 'Your time per question is recorded and priced at NT$ {wage}/hour as your “inference cost”.',
    'home.step3.t': 'Find your model',
    'home.step3.d': 'Which model matches your level and what it costs; and what a model achieves for your price.',
    'home.modes': 'Two modes',
    'home.mode.quick': 'Quick: {min}–{max} questions from each difficulty, linearly scaled to a full-test score.',
    'home.mode.full': 'Full: answer everything, the same paper the models took.',
    'home.credit': 'Questions and model data: <a href="{bench}" target="_blank" rel="noopener">Razavi-Bench</a> (Zhishuai Zhang); original problems from B. Razavi, “Analog Design Experiments With AI,” IEEE SSC Magazine. Not affiliated with the original authors.',

    'test.title': 'Test',
    'start.title': 'Choose a mode',
    'start.pool': '{n} questions in the pool',
    'start.byLevel': 'Questions per difficulty',
    'start.quick': 'Quick',
    'start.quick.d': 'Sample each difficulty; results scale linearly to the full test.',
    'start.perLevel': 'Per difficulty',
    'start.unit.q': 'Q',
    'start.willAsk': '{n} questions this run',
    'start.full': 'Full',
    'start.full.d': 'All {n} questions in pool order; no scaling needed.',
    'start.go': 'Start',
    'start.empty': 'The question pool is empty. Add questions to data/questions.json.',

    'level': 'Level',
    'level.1': 'Intro', 'level.2': 'Basic', 'level.3': 'Intermediate', 'level.4': 'Hard', 'level.5': 'Expert',
    'type.single': 'Single choice', 'type.multi': 'Multiple choice', 'type.fill': 'Fill in',
    'quiz.progress': 'Question {i} of {n}',
    'quiz.submit': 'Submit',
    'quiz.skip': 'Skip',
    'quiz.multiHint': 'Select all that apply. Each of the n options is judged on its own: all right scores 1, k options wrong scores (n − 2k)/n, minimum 0.',
    'quiz.fillPlaceholder': 'Your answer',
    'quiz.quit': 'Finish now',
    'quiz.leave': 'A test is in progress; leaving will lose it.',

    'res.kicker': 'Your result',
    'res.closest': 'Your closest model is',
    'res.closestSub': 'Your accuracy is {you}; theirs is {model}.',
    'res.acc': 'Accuracy',
    'res.time': 'Time',
    'res.cost': 'Cost',
    'res.est': 'full-test estimate',
    'res.actual': 'actual {v}',
    'res.answered': '{c} of {n} points',
    'res.sameLevel': 'A model at your level, and what it costs',
    'res.sameCost': 'A model at your cost, and how good it is',
    'res.modelAcc': 'Accuracy',
    'res.modelCost': 'Cost',
    'res.modelTime': 'Time',
    'res.cheaper': '{x}× cheaper than you',
    'res.pricier': '{x}× pricier than you',
    'res.sameish': 'about the same as you',
    'res.faster': '{x}× faster than you',
    'res.slower': '{x}× slower than you',
    'res.higher': '{d} points above you',
    'res.lower': '{d} points below you',
    'res.equal': 'same as you',
    'res.beat': 'You beat {p} of models ({k} of {m}).',
    'res.chart': 'Accuracy vs. cost',
    'res.chartNote': 'Cost on a log scale. Your time and cost are scaled to the full {n}-question paper; model figures are as published.',
    'res.you': 'You',
    'res.levels': 'By difficulty',
    'res.col.level': 'Level', 'res.col.asked': 'Asked', 'res.col.correct': 'Score', 'res.col.acc': 'Accuracy', 'res.col.avg': 'Avg / question', 'res.col.pool': 'In pool',
    'res.review': 'Your answers',
    'res.expandAll': 'Expand all',
    'res.collapseAll': 'Collapse all',
    'res.yourAns': 'Your answer',
    'res.rightAns': 'Correct answer',
    'res.alsoAccept': 'Also accepted',
    'res.skipped': '(skipped)',
    'res.explain': 'Explanation',
    'cm.1': 'You scored worse than random guessing.', 'cm.2': 'Your electronics professor is crying in a corner.', 'cm.3': 'AI is about to replace you. Go farm vegetables while you still can.',
    'cm.4': 'Just retake the course.', 'cm.5': 'Not bad.', 'cm.6': 'Pretty good, but Claude is cheaper.', 'cm.7': 'You cheated.',
    'cm.8': 'You got an A+ in electronics, but Claude is cheaper.', 'cm.9': 'You have connections. Cheap labor, indeed.', 'cm.10': 'You are the next one to be distilled.',
    'cm.11': 'You graduated from NTU EE, but Claude is cheaper.', 'cm.12': 'Good morning, Behzad Razavi.',
    'cm.guess': 'Random guess (always A)',
    'share.btn': 'Share result image', 'share.title': 'Share your result', 'share.save': 'Save image', 'share.send': 'Send to a friend', 'share.close': 'Close',
    'share.closest': 'My closest AI', 'share.acc': 'Accuracy', 'share.cost': 'Cost', 'share.tag': 'Which AI is your electronics score closest to?', 'share.copied': 'Link copied',
    'res.retake': 'Take it again',
    'res.toBench': 'Full model leaderboard',
    'res.noteQuick': 'Quick mode: per-difficulty accuracy and average time are weighted by how many questions each difficulty has in the pool, scaling linearly to the full test.',
    'res.noteFull': 'Full mode: every question answered, no scaling.',
    'res.noteModels': 'Model data from Razavi-Bench ({nm} questions, mean of 3 runs; accuracy = share of answers graded a full 4/4). Razavi-Bench publishes no timing, so model time = output tokens ÷ output speed + per-request latency. Speed is measured by Artificial Analysis where available, otherwise taken from a published figure or borrowed from a sibling model.',
    'res.modelSpeed': 'Speed',
    'speed.measured': 'measured by Artificial Analysis',
    'speed.web': 'published figure',
    'speed.proxy': 'no public data; sibling model',
    'speed.fallback': 'no data; default',
    'res.correct': 'Correct', 'res.wrong': 'Wrong', 'res.partial': 'Partial {s}',
    'res.sec': 's',

    'err.load': 'Could not load data: {msg}. Serve the folder over HTTP (e.g. python3 -m http.server) rather than opening the file directly.',
    'lang.switch': '中文',
  },
};
// The toggle button cycles through LANGS; its label names the next language.
const LANGS = ['zh', 'jj', 'en'];
const FALLBACK = { zh: ['zh', 'en'], jj: ['jj', 'zh', 'en'], en: ['en', 'zh'] };
const nextLang = l => LANGS[(LANGS.indexOf(l) + 1) % LANGS.length];
I18N.jj = { 'lang.switch': 'EN' };

let LANG = (() => {
  try { const s = localStorage.getItem('hr-lang'); if (LANGS.includes(s)) return s; } catch (e) {}
  return /^zh/i.test(navigator.language || '') ? 'jj' : 'en';
})();

function t(key, vars) {
  let s = key;
  for (const l of FALLBACK[LANG]) if (I18N[l] && key in I18N[l]) { s = I18N[l][key]; break; }
  if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
  return s;
}

function L(field) {
  if (field == null) return '';
  if (typeof field !== 'object' || Array.isArray(field)) return field;
  for (const l of FALLBACK[LANG]) if (field[l] != null) return field[l];
  return Object.values(field)[0] ?? '';
}

let I18N_VARS = {};
function applyStatic(root = document) {
  root.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n, I18N_VARS); });
  root.querySelectorAll('[data-i18n-html]').forEach(el => { el.innerHTML = t(el.dataset.i18nHtml, I18N_VARS); });
  document.documentElement.lang = LANG === 'en' ? 'en' : 'zh-Hant';
}

function setLang(lang) {
  LANG = lang;
  try { localStorage.setItem('hr-lang', lang); } catch (e) {}
  applyStatic();
  window.dispatchEvent(new Event('langchange'));
}

document.addEventListener('DOMContentLoaded', () => {
  applyStatic();
  document.querySelectorAll('[data-lang-toggle]').forEach(b =>
    b.addEventListener('click', () => setLang(nextLang(LANG))));
});

async function loadJSON(path) {
  const r = await fetch(path, { cache: 'no-cache' });
  if (!r.ok) throw new Error(path + ' → HTTP ' + r.status);
  return r.json();
}
