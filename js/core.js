/* Core: utilities, storage, question bank, adaptive engine, scoring and analytics. No DOM here. */
(function () {
'use strict';
const DAY = 86400000;

/* ================= utils ================= */
const U = {
  esc: s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'),
  uid: () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
  rnd: (a, b) => Math.floor(Math.random() * (b - a + 1)) + a,
  pick: a => a[Math.floor(Math.random() * a.length)],
  shuffle: a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
  clamp: (x, a, b) => Math.max(a, Math.min(b, x)),
  sigmoid: x => 1 / (1 + Math.exp(-x)),
  dayKey: t => { const d = new Date(t); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); },
  today: () => U.dayKey(Date.now()),
  mmss: s => { s = Math.max(0, Math.round(s)); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); },
  pct: x => Math.round(x * 100) + '%',
  median: a => { if (!a.length) return 0; const s = a.slice().sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; },
  daysUntil: iso => { if (!iso) return null; const d = new Date(iso + 'T00:00:00'); return Math.ceil((d - new Date(new Date().toDateString())) / DAY); },
  hash: str => { let h = 5381; for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0; return (h >>> 0).toString(36); }
};

/* Render question text: escapes HTML, then supports x^2, x^{n}, @f(a|b), @r(x) */
function fmt(text) {
  let s = U.esc(text == null ? '' : text);
  // fractions with balanced parens
  let out = '', i = 0;
  while (i < s.length) {
    if (s.startsWith('@f(', i) || s.startsWith('@r(', i)) {
      const kind = s[i + 1]; let depth = 1, j = i + 3, bar = -1;
      while (j < s.length && depth) { const c = s[j]; if (c === '(') depth++; else if (c === ')') depth--; else if (c === '|' && depth === 1 && kind === 'f' && bar < 0) bar = j; j++; }
      const inner = s.slice(i + 3, j - 1);
      if (kind === 'f' && bar > 0) { const num = s.slice(i + 3, bar), den = s.slice(bar + 1, j - 1); out += `<span class="frac"><span>${num}</span><span>${den}</span></span>`; }
      else if (kind === 'r') out += `√<span class="rad">${inner}</span>`;
      else out += s.slice(i, j);
      i = j;
    } else out += s[i++];
  }
  out = out.replace(/\^(\{([^}]*)\}|[A-Za-z0-9]+)/g, (m, a, b) => `<sup>${b !== undefined ? b : a}</sup>`);
  return out;
}

/* Parse a student-produced response */
function parseGrid(str) {
  if (str == null) return NaN;
  let s = String(str).trim().replace(/−/g, '-').replace(/\s+/g, '');
  if (!s) return NaN;
  if (/^-?\d+\/-?\d+$/.test(s)) { const [a, b] = s.split('/').map(Number); return b ? a / b : NaN; }
  if (/^-?(\d+\.?\d*|\.\d+)$/.test(s)) return parseFloat(s);
  return NaN;
}
function gradeGrid(input, answer) {
  const x = parseGrid(input), y = parseGrid(answer);
  if (isNaN(x) || isNaN(y)) return false;
  return Math.abs(x - y) < 1e-9 || (!Number.isInteger(y) && Math.abs(x - y) <= 0.005);
}

/* ================= exams, score scales, prior scores ================= */
/* Digital SAT: sections 200-800 (total 400-1600). Digital PSAT/NMSQT and PSAT 10: sections 160-760 (total 320-1520).
   PSAT 8/9: sections 120-720 (total 240-1440). `offset` is the approximate SAT-equivalent shift per section. */
const EXAMS = {
  sat:    { id: 'sat',    name: 'SAT',        min: 400, max: 1600, secMin: 200, secMax: 800, offset: 0 },
  psat:   { id: 'psat',   name: 'PSAT/NMSQT', min: 320, max: 1520, secMin: 160, secMax: 760, offset: 40 },
  psat10: { id: 'psat10', name: 'PSAT 10',    min: 320, max: 1520, secMin: 160, secMax: 760, offset: 40 },
  psat89: { id: 'psat89', name: 'PSAT 8/9',   min: 240, max: 1440, secMin: 120, secMax: 720, offset: 80 }
};
const examOf = p => EXAMS[(p && p.exam) || 'sat'] || EXAMS.sat;
const toSat = (score, exam) => U.clamp(score + EXAMS[exam].offset, 200, 800);
const fromSat = (score, exam) => { const e = EXAMS[exam] || EXAMS.sat; return U.clamp(Math.round((score - e.offset) / 10) * 10, e.secMin, e.secMax); };
const selectionIndex = (rw, math) => Math.round((2 * rw + math) / 10);   // National Merit Selection Index, 48-228

/* Validate a score a student typed in. Returns { ok, err: {field: message}, entry }. */
function validateScore(o) {
  const ex = EXAMS[o.exam], err = {}, num = v => (v === '' || v == null) ? null : Number(v);
  if (!ex) { err.exam = 'Choose which test this was.'; return { ok: false, err }; }
  let rw = num(o.rw), math = num(o.math), total = num(o.total);
  const sec = (v, k, label) => { if (v !== null && (!Number.isInteger(v) || v % 10 !== 0 || v < ex.secMin || v > ex.secMax)) err[k] = `${label} is a multiple of 10 from ${ex.secMin} to ${ex.secMax}.`; };
  sec(rw, 'rw', 'Reading & Writing'); sec(math, 'math', 'Math');
  if (total !== null && (!Number.isInteger(total) || total % 10 !== 0 || total < ex.min || total > ex.max)) err.total = `Total is a multiple of 10 from ${ex.min} to ${ex.max}.`;
  if (!o.date) err.date = 'Add the date you took it (a month and year is fine, pick any day).';
  else if (o.date > U.today()) err.date = 'That date is in the future.';
  if (!Object.keys(err).length) {
    if (rw !== null && math !== null) { if (total !== null && total !== rw + math) err.total = `Total should equal Reading & Writing + Math (${rw + math}).`; else total = rw + math; }
    else if (total !== null && (rw !== null || math !== null)) { const other = total - (rw !== null ? rw : math), k = rw !== null ? 'math' : 'rw'; if (other < ex.secMin || other > ex.secMax) err.total = 'Those numbers do not add up. Check the total and section scores.'; else if (k === 'math') math = other; else rw = other; }
    else if (total === null) err.total = 'Enter the total score, or both section scores.';
  }
  if (Object.keys(err).length) return { ok: false, err };
  return { ok: true, err, entry: { id: o.id || U.uid(), exam: o.exam, date: o.date, total, rw, math } };
}
const priorScores = p => ((p && p.prior) || []).slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
/* A prior score converted to the SAT scale ({rw, math, total}); total-only scores split evenly. */
function satEquivalent(e) {
  const half = Math.round(e.total / 20) * 10, rw = e.rw != null ? e.rw : half, math = e.math != null ? e.math : e.total - half;
  const r = toSat(rw, e.exam), m = toSat(math, e.exam); return { rw: r, math: m, total: r + m, sectionsKnown: e.rw != null && e.math != null };
}
/* Most recent real score, as SAT-scale numbers (used to start difficulty and fill the gap before practice data exists). */
function baseline(p) { const e = priorScores(p)[0]; if (!e) return null; return Object.assign({ entry: e }, satEquivalent(e)); }
/* Same entry converted onto the profile's own scale (for charts and gap-to-goal). */
function inProfileScale(p, e) { const sat = satEquivalent(e), x = examOf(p).id; const rw = fromSat(sat.rw, x), math = fromSat(sat.math, x); return { rw, math, total: rw + math }; }
/* PSAT-scale sections and Selection Index from practice (if enough data) or the latest real score. */
function nmEstimate(p) {
  const est = estimateSat(p); let rw, math, source;
  if (est.enough) { rw = fromSat(est.rw, 'psat'); math = fromSat(est.math, 'psat'); source = 'practice'; }
  else { const b = baseline(p); if (!b) return null; rw = fromSat(b.rw, 'psat'); math = fromSat(b.math, 'psat'); source = 'real'; }
  return { rw, math, index: selectionIndex(rw, math), source };
}

/* ================= storage ================= */
const KEY = 'ascent.sat.v1';
let state = null, saveTimer = null;
function blank() { return { v: 1, activeId: null, profiles: {}, settings: { theme: 'auto' }, custom: [], ai: [], aiCfg: { provider: 'gemini', model: '', key: '' } }; }
function fixProfile(p) { // profiles saved by older versions get the newer fields
  if (!EXAMS[p.exam]) p.exam = 'sat'; if (!Array.isArray(p.prior)) p.prior = []; if (p.nmTarget == null) p.nmTarget = 0; return p;
}
function load() {
  try { const raw = localStorage.getItem(KEY); state = raw ? Object.assign(blank(), JSON.parse(raw)) : blank(); }
  catch (e) { state = blank(); }
  Object.values(state.profiles).forEach(fixProfile);
  return state;
}
function save(now) {
  const run = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { Store.saveError = true; } };
  if (now) { clearTimeout(saveTimer); run(); } else { clearTimeout(saveTimer); saveTimer = setTimeout(run, 150); }
}
const Store = {
  saveError: false,
  get: () => state || load(),
  save,
  profile: () => { const s = Store.get(); return s.activeId ? s.profiles[s.activeId] : null; },
  create(o) {
    const s = Store.get(), id = U.uid();
    s.profiles[id] = Object.assign({ id, name: 'Student', grade: 11, target: 1300, testDate: '', dailyMin: 30, createdAt: Date.now(),
      hist: [], missed: {}, flagged: {}, seen: {}, tests: [], session: null, extended: false, showTimer: true, doneTasks: {}, exam: 'sat', prior: [], nmTarget: 0 }, o);
    s.activeId = id; save(true); return s.profiles[id];
  },
  switchTo(id) { const s = Store.get(); if (s.profiles[id]) { s.activeId = id; save(true); } },
  remove(id) { const s = Store.get(); delete s.profiles[id]; if (s.activeId === id) s.activeId = Object.keys(s.profiles)[0] || null; save(true); },
  exportAll: () => JSON.stringify(Store.get(), null, 1),
  importAll(json) { const o = JSON.parse(json); if (!o || typeof o !== 'object' || !o.profiles) throw new Error('Not an Ascent backup file.'); state = Object.assign(blank(), o); save(true); },
  reset() { state = blank(); save(true); }
};

/* ================= question bank ================= */
const DEFQ = {
  wic: 'Which choice completes the text with the most logical and precise word or phrase?',
  bnd: 'Which choice completes the text so that it conforms to the conventions of Standard English?',
  fss: 'Which choice completes the text so that it conforms to the conventions of Standard English?',
  trn: 'Which choice completes the text with the most logical transition?'
};
const STATIC = [];
function addRow(r) {
  let [s, d, p, q, a, w, e] = r; const sk = SKILL_BY_ID[s]; if (!sk) return;
  if (sk.sec === 'rw' && q && q.includes('\n\n')) { const i = q.lastIndexOf('\n\n'); p = (p ? p + '\n\n' : '') + q.slice(0, i); q = q.slice(i + 2); }
  const o = { s, d, p, q: q || DEFQ[s] || 'Which choice is best?', a: String(a), e, sec: sk.sec, dom: sk.dom };
  if (w) o.w = w.map(String); else o.grid = true;
  o.id = 'q' + U.hash(s + '|' + (p || '') + '|' + o.q + '|' + o.a);
  STATIC.push(o);
}
(window.RAW_RW || []).forEach(addRow);
(window.RAW_MATH || []).forEach(addRow);

function customToRow(o) {
  const sk = SKILL_BY_ID[o.skill || o.s]; if (!sk) throw new Error('Unknown skill: ' + (o.skill || o.s));
  const d = U.clamp(parseInt(o.d || o.difficulty || 2, 10) || 2, 1, 3);
  if (!o.q || o.a == null) throw new Error('Each question needs "q" and "a".');
  const w = Array.isArray(o.w) ? o.w.map(String) : null;
  if (w && (w.length !== 3 || new Set([String(o.a), ...w]).size !== 4)) throw new Error('Multiple-choice questions need exactly 3 distinct wrong answers in "w".');
  if (!w && isNaN(parseGrid(o.a))) throw new Error('A grid-in answer must be a number.');
  return [sk.id, d, o.p || null, String(o.q), String(o.a), w, o.e || 'No explanation provided.'];
}
function customBank() {
  const out = [];
  for (const o of Store.get().custom.concat(Store.get().ai)) {
    try { const before = STATIC.length; addRow(customToRow(o)); const q = STATIC.pop(); STATIC.length = before; q.custom = true; if (o.ai) q.ai = true; out.push(q); } catch (e) { /* skip invalid */ }
  }
  return out;
}
let customCache = null, customKey = '';
function allStatic() {
  const s = Store.get(), k = s.custom.length + ':' + s.ai.length;
  if (customCache === null || k !== customKey) { customCache = customBank(); customKey = k; }
  return STATIC.concat(customCache);
}
const Bank = {
  statics: allStatic,
  poolFor: skill => allStatic().filter(q => q.s === skill),
  staticCount: skill => allStatic().filter(q => q.s === skill).length,
  total: () => allStatic().length,
  validate: customToRow,
  hasGen: skill => Gen.has(skill),
  prepare(q) {
    const o = { id: q.id, s: q.s, sec: q.sec || SKILL_BY_ID[q.s].sec, dom: SKILL_BY_ID[q.s].dom, d: q.d, p: q.p || null, q: q.q, e: q.e, table: q.table || null, fig: q.fig || null, gen: !!q.gen, ai: !!q.ai };
    if (q.grid) { o.grid = true; o.a = q.a; o.show = q.show || q.a; }
    else { const all = U.shuffle([q.a, ...q.w]); o.choices = all; o.ci = all.indexOf(q.a); o.a = q.a; }
    return o;
  }
};

/* ================= analytics: mastery (Elo-style per skill) ================= */
const statsCache = new WeakMap();
/* Per-skill mastery: recency-weighted, difficulty-aware accuracy shrunk toward 50% (prior of 1 right + 1 wrong). */
function skillStats(prof) {
  const cached = statsCache.get(prof); if (cached && cached.n === prof.hist.length) return cached.v;
  const st = {}; SKILLS.forEach(s => { st[s.id] = { id: s.id, n: 0, ok: 0, ms: [], last: 0, byD: { 1: [0, 0], 2: [0, 0], 3: [0, 0] }, items: [], recent: [] }; });
  for (const h of prof.hist) {
    const x = st[h.s]; if (!x) continue;
    x.n++; if (h.ok) x.ok++; if (h.ms) x.ms.push(h.ms); x.last = h.t;
    x.byD[h.d || 2][0] += h.ok ? 1 : 0; x.byD[h.d || 2][1]++;
    x.items.push([h.ok ? 1 : 0, h.d || 2]);
    x.recent.push(h.ok ? 1 : 0); if (x.recent.length > 8) x.recent.shift();
  }
  for (const k in st) {
    const x = st[k], arr = x.items; let num = 0, den = 0;
    for (let i = 0; i < arr.length; i++) { const dec = Math.pow(0.92, arr.length - 1 - i), [ok, d] = arr[i], w = dec * (ok ? [0.8, 1, 1.2][d - 1] : [1.2, 1, 0.8][d - 1]); num += w * ok; den += w; }
    x.m = (num + 1) / (den + 2); x.acc = x.n ? x.ok / x.n : null; x.conf = Math.min(1, x.n / 8); delete x.items;
  }
  statsCache.set(prof, { n: prof.hist.length, v: st });
  return st;
}
function sectionEstimate(prof, sec) {
  const st = skillStats(prof); let num = 0, den = 0, n = 0;
  for (const s of SKILLS) if (s.sec === sec) { const wgt = s.w * DOMAINS[s.dom].w; num += wgt * st[s.id].m; den += wgt; n += st[s.id].n; }
  const p = den ? num / den : 0.5, score = Math.round((200 + 600 * U.clamp((p - 0.25) / 0.7, 0, 1)) / 10) * 10;
  return { score, p, n };
}
function estimateSat(prof) {
  const rw = sectionEstimate(prof, 'rw'), m = sectionEstimate(prof, 'math');
  const enough = rw.n >= 8 && m.n >= 8;
  return { rw: rw.score, math: m.score, total: rw.score + m.score, n: rw.n + m.n, enough, rwN: rw.n, mathN: m.n };
}
/* Practice-based estimate shown on the student's own exam scale (SAT by default). */
function estimate(prof) {
  const e = estimateSat(prof), x = examOf(prof).id, rw = fromSat(e.rw, x), math = fromSat(e.math, x);
  return Object.assign({}, e, { rw, math, total: rw + math });
}
/* What to show as "current level": practice estimate once there is enough data, otherwise the latest real score. */
function currentLevel(prof) {
  const est = estimate(prof); if (est.enough) return { source: 'practice', rw: est.rw, math: est.math, total: est.total, est };
  const b = priorScores(prof)[0]; if (!b) return { source: 'none', est };
  const v = inProfileScale(prof, b); return { source: 'real', rw: v.rw, math: v.math, total: v.total, entry: b, est };
}
const TARGET_MS = { rw: 71000, math: 95000 };

function analyze(prof) {
  const st = skillStats(prof), list = SKILLS.map(s => Object.assign({ skill: s }, st[s.id]));
  const answered = list.filter(x => x.n >= 1);
  const prio = x => (1 - x.m) * (0.5 + DOMAINS[x.skill.dom].w + x.skill.w * 0.3) * (0.5 + 0.5 * x.conf);
  const ranked = answered.slice().sort((a, b) => prio(b) - prio(a));
  const focus = ranked.filter(x => x.m < 0.62).slice(0, 3);
  const unassessed = list.filter(x => x.n < 1);
  const strong = answered.slice().sort((a, b) => b.m - a.m).filter(x => x.m >= 0.72 && x.n >= 3).slice(0, 3);
  const notes = [];
  const recent = prof.hist.slice(-120);
  if (recent.length >= 12) {
    const fast = recent.filter(h => h.ms && h.ms < 0.25 * TARGET_MS[SKILL_BY_ID[h.s].sec]);
    if (fast.length >= 6 && fast.filter(h => !h.ok).length / fast.length > 0.5) notes.push({ k: 'rush', t: 'You are answering some questions very quickly and missing most of those. Slow down on the first read, underline the question’s ask before you look at choices.' });
    const easy = recent.filter(h => h.d === 1);
    if (easy.length >= 8 && easy.filter(h => h.ok).length / easy.length < 0.7) notes.push({ k: 'easy', t: 'You are missing too many easy questions. That usually means a few rules or formulas need review, not more hard practice. Open the Skill Guide for your focus areas.' });
    const slow = recent.filter(h => h.ms && h.ms > 1.8 * TARGET_MS[SKILL_BY_ID[h.s].sec]);
    if (slow.length / recent.length > 0.3) notes.push({ k: 'slow', t: 'More than a third of your answers take much longer than the real test allows. Try timed sets and practice skipping and returning.' });
    const a = recent.slice(-30), b = recent.slice(-60, -30);
    if (a.length >= 20 && b.length >= 20) {
      const da = a.filter(h => h.ok).length / a.length, db = b.filter(h => h.ok).length / b.length;
      if (da - db >= 0.1) notes.push({ k: 'up', t: `Nice. Your accuracy is up ${Math.round((da - db) * 100)} points over your last 30 questions.` });
      else if (db - da >= 0.1) notes.push({ k: 'down', t: 'Accuracy dipped recently. If you are tired, take a break; otherwise revisit the explanations for missed questions.' });
    }
  }
  const byDiff = { 1: [0, 0], 2: [0, 0], 3: [0, 0] }; prof.hist.forEach(h => { const b = byDiff[h.d || 2]; b[0] += h.ok ? 1 : 0; b[1]++; });
  const bySec = { rw: { ms: [], ok: 0, n: 0 }, math: { ms: [], ok: 0, n: 0 } };
  prof.hist.forEach(h => { const b = bySec[SKILL_BY_ID[h.s].sec]; b.n++; if (h.ok) b.ok++; if (h.ms) b.ms.push(h.ms); });
  return { list, ranked, focus, unassessed, strong, notes, byDiff, bySec, total: prof.hist.length };
}
function reasonFor(x) {
  const parts = [];
  if (x.acc != null) parts.push(`${Math.round(x.acc * 100)}% correct over ${x.n} question${x.n === 1 ? '' : 's'}`);
  const [e, en] = x.byD[1]; if (en >= 2 && e / en < 0.7) parts.push('missing easy ones, so review the basics');
  else { const [h, hn] = x.byD[3]; if (hn >= 2 && h === 0) parts.push('hard questions not landing yet'); }
  const med = U.median(x.ms); if (med && med > 1.6 * TARGET_MS[x.skill.sec]) parts.push('slower than test pace');
  return parts.join(' · ');
}
function streak(prof) {
  const days = new Set(prof.hist.map(h => U.dayKey(h.t))); let n = 0, t = Date.now();
  if (!days.has(U.dayKey(t))) t -= DAY;
  while (days.has(U.dayKey(t))) { n++; t -= DAY; }
  return n;
}
function activityDays(prof, count) {
  const m = {}; prof.hist.forEach(h => { const k = U.dayKey(h.t); m[k] = (m[k] || 0) + 1; });
  return Array.from({ length: count }, (_, i) => { const t = Date.now() - (count - 1 - i) * DAY; return { key: U.dayKey(t), n: m[U.dayKey(t)] || 0, dow: new Date(t).getDay() }; });
}
function todayStats(prof) {
  const k = U.today(), hs = prof.hist.filter(h => U.dayKey(h.t) === k);
  return { n: hs.length, ok: hs.filter(h => h.ok).length, ms: hs.reduce((s, h) => s + (h.ms || 60000), 0) };
}

/* ================= question selection ================= */
const SEEN_DAYS = 14;
function targetDiff(prof, skill) {
  const x = skillStats(prof)[skill];
  if (x.n < 2) {
    const b = baseline(prof); if (!b) return 2;
    const sc = SKILL_BY_ID[skill].sec === 'rw' ? b.rw : b.math;
    return sc < 480 ? U.pick([1, 1, 2]) : sc > 650 ? U.pick([2, 3]) : 2;
  }
  const m = x.m;
  return m < 0.4 ? U.pick([1, 1, 2]) : m < 0.65 ? U.pick([1, 2, 2]) : m < 0.85 ? U.pick([2, 2, 3]) : U.pick([2, 3, 3]);
}
function getOne(prof, skill, diff, used) {
  const pool = Bank.poolFor(skill), now = Date.now();
  const fresh = q => !used.ids.has(q.id) && !(prof && prof.seen[q.id] && now - prof.seen[q.id] < SEEN_DAYS * DAY);
  const ok = q => !used.ids.has(q.id);
  const canGen = Gen.has(skill);
  const cands = pool.filter(q => fresh(q) && q.d === diff);
  const near = pool.filter(q => fresh(q) && Math.abs(q.d - diff) <= 1);
  const genChance = canGen ? (near.length ? 0.55 : 1) : 0;
  if (Math.random() < genChance) {
    for (let t = 0; t < 8; t++) { const g = Gen.make(skill, diff); if (g && !used.txt.has(g.q + (g.p || ''))) { used.txt.add(g.q + (g.p || '')); used.ids.add(g.id); return Bank.prepare(g); } }
  }
  let pickFrom = cands.length ? cands : near.length ? near : pool.filter(fresh);
  if (!pickFrom.length) pickFrom = pool.filter(ok);
  if (!pickFrom.length && canGen) { const g = Gen.make(skill, diff); if (g) { used.ids.add(g.id); return Bank.prepare(g); } }
  if (!pickFrom.length) return null;
  const q = U.pick(pickFrom); used.ids.add(q.id); return Bank.prepare(q);
}
function newUsed() { return { ids: new Set(), txt: new Set() }; }
/** weights: [{id, w}] ; diff: 'adaptive' | 1 | 2 | 3 | 'mixed' */
function pickQuestions(prof, weights, n, diff, used) {
  used = used || newUsed(); const out = []; let last = null, guard = 0;
  const total = weights.reduce((s, x) => s + x.w, 0);
  while (out.length < n && guard++ < n * 12) {
    let r = Math.random() * total, sk = weights[0].id;
    for (const x of weights) { r -= x.w; if (r <= 0) { sk = x.id; break; } }
    if (weights.length > 1 && sk === last && Math.random() < 0.7) continue;
    const d = diff === 'adaptive' ? targetDiff(prof, sk) : diff === 'mixed' ? U.pick([1, 2, 2, 3]) : diff;
    const q = getOne(prof, sk, d, used); if (q) { out.push(q); last = sk; }
  }
  return out;
}

/* ---------- full-length test construction ---------- */
const MOD_COUNT = { rw: 27, math: 22 };
const ALLOC = { rw: { cs: 8, ii: 7, sec: 7, eoi: 5 }, math: { alg: 8, adv: 7, psda: 4, geo: 3 } };
const MIX = { mixed: [0.3, 0.5, 0.2], easy: [0.5, 0.4, 0.1], hard: [0.15, 0.35, 0.5] };
const MIXP = { mixed: [0.4, 0.45, 0.15], easy: [0.55, 0.38, 0.07], hard: [0.2, 0.4, 0.4] };   // PSAT is a little easier
function buildModule(prof, sec, level, count, used) {
  count = count || MOD_COUNT[sec]; used = used || newUsed();
  const alloc = ALLOC[sec], scale = count / Object.values(alloc).reduce((a, b) => a + b, 0), qs = [];
  for (const dom in alloc) {
    const k = Math.max(1, Math.round(alloc[dom] * scale)), sks = SKILLS.filter(s => s.dom === dom).map(s => ({ id: s.id, w: s.w }));
    for (let i = 0; i < k; i++) {
      const r = Math.random(), mix = (prof && prof.exam && prof.exam !== 'sat' ? MIXP : MIX)[level], d = r < mix[0] ? 1 : r < mix[0] + mix[1] ? 2 : 3;
      const got = pickQuestions(prof, sks, 1, d, used); if (got[0]) qs.push(got[0]);
    }
  }
  while (qs.length > count) qs.pop();
  const allSk = SKILLS.filter(s => s.sec === sec).map(s => ({ id: s.id, w: s.w }));
  while (qs.length < count) { const g = pickQuestions(prof, allSk, 1, 2, used); if (!g[0]) break; qs.push(g[0]); }
  // order: easier first within module, like real exams trend, but lightly shuffled
  return qs.sort((a, b) => (a.d + Math.random() * 1.4) - (b.d + Math.random() * 1.4));
}
const DW = { 1: 0.8, 2: 1, 3: 1.3 };
function weightedPct(qs, oks) { let e = 0, t = 0; qs.forEach((q, i) => { t += DW[q.d]; if (oks[i]) e += DW[q.d]; }); return t ? e / t : 0; }
const ROUTE_UP = 0.62;
function scoreSection(m1pct, m2pct, hardRoute) {
  const raw = hardRoute ? 360 + 440 * (0.35 * m1pct + 0.65 * m2pct) : 200 + 400 * (0.4 * m1pct + 0.6 * m2pct);
  return U.clamp(Math.round(raw / 10) * 10, 200, 800);
}

/* ================= spaced repetition for missed questions ================= */
const BOX_DAYS = [1, 3, 7, 14, 30];
function recordMissed(prof, q, ok, ans) {
  const m = prof.missed[q.id];
  if (!ok) { prof.missed[q.id] = { q, n: (m ? m.n : 0) + 1, box: 0, due: Date.now() + DAY, last: Date.now(), ans }; }
  else if (m) { m.box++; m.last = Date.now(); if (m.box >= BOX_DAYS.length) delete prof.missed[q.id]; else m.due = Date.now() + BOX_DAYS[m.box] * DAY; }
}
function dueMissed(prof) { const now = Date.now(); return Object.values(prof.missed).filter(m => m.due <= now); }
function recordAnswer(prof, q, ok, ms, mode, ans) {
  prof.hist.push({ t: Date.now(), q: q.id, s: q.s, d: q.d, ok: !!ok, ms: Math.round(ms || 0), m: mode });
  if (prof.hist.length > 6000) prof.hist.splice(0, prof.hist.length - 6000);
  prof.seen[q.id] = Date.now();
  if (Object.keys(prof.seen).length > 3000) { const ent = Object.entries(prof.seen).sort((a, b) => a[1] - b[1]).slice(0, 800); ent.forEach(([k]) => delete prof.seen[k]); }
  if (!ok || prof.missed[q.id]) recordMissed(prof, q, ok, ans);
}

/* ================= study plan ================= */
function buildDaily(prof) {
  const n = U.clamp(Math.round(prof.dailyMin / 1.6), 8, 45), used = newUsed();
  const due = dueMissed(prof).slice(0, Math.round(n * 0.25));
  const qs = due.map(m => { used.ids.add(m.q.id); return Object.assign({}, m.q, { fromReview: true }); });
  const an = analyze(prof);
  const focus = an.focus.length ? an.focus.map((x, i) => ({ id: x.skill.id, w: 3 - i })) : [];
  const unass = an.unassessed.slice(0, 4).map(x => ({ id: x.skill.id, w: 1 }));
  const rest = n - qs.length;
  const wk = focus.concat(unass); const allw = SKILLS.map(s => ({ id: s.id, w: 0.25 }));
  const weights = wk.length ? wk.concat(allw) : allw;
  return { qs: qs.concat(pickQuestions(prof, weights, rest, 'adaptive', used)), focus: an.focus.map(x => x.skill.name), n };
}
function weekPlan(prof) {
  const an = analyze(prof), f = an.focus.map(x => x.skill), rwF = f.find(s => s.sec === 'rw'), mF = f.find(s => s.sec === 'math');
  const rwN = rwF ? rwF.name : 'Reading & Writing mix', mN = mF ? mF.name : 'Math mix';
  return [
    { d: 'Mon', t: `Focus: ${rwN}`, k: 'rw' }, { d: 'Tue', t: `Focus: ${mN}`, k: 'math' }, { d: 'Wed', t: 'Mixed timed set + review mistakes', k: 'mix' },
    { d: 'Thu', t: `Focus: ${rwF ? rwF.name : 'Grammar & Boundaries'}`, k: 'rw' }, { d: 'Fri', t: `Focus: ${mF ? mF.name : 'Algebra'}`, k: 'math' },
    { d: 'Sat', t: 'Full-length practice test (or one section)', k: 'test' }, { d: 'Sun', t: 'Review the week’s mistakes · rest', k: 'rest' }];
}

window.U = U; window.fmt = fmt; window.gradeGrid = gradeGrid; window.parseGrid = parseGrid;
window.Store = Store; window.Bank = Bank;
window.Engine = { EXAMS, examOf, toSat, fromSat, selectionIndex, validateScore, priorScores, satEquivalent, baseline, inProfileScale, nmEstimate, currentLevel, estimateSat,
  toScale: (p, satScore) => fromSat(satScore, examOf(p).id), skillStats, estimate, sectionEstimate, analyze, reasonFor, streak, activityDays, todayStats, pickQuestions, buildModule, newUsed, weightedPct, scoreSection,
  ROUTE_UP, MOD_COUNT, TARGET_MS, recordAnswer, dueMissed, buildDaily, weekPlan, targetDiff, BOX_DAYS };
}());
