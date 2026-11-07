/* Score report details (grade, score ranges, the 1 to 7 domain bands) and the progress views built from them. */
(function () {
'use strict';
const { $, ic } = UI;
const esc = U.esc, E = Engine.EXAMS;
const ORDER = { rw: ['ii', 'cs', 'eoi', 'sec'], math: ['alg', 'adv', 'psda', 'geo'] };   // the order College Board reports use
const SECN = { rw: 'Reading and Writing', math: 'Math' };
const fmtDay = iso => new Date(iso + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
const pct = v => `${Math.round(v * 1000) / 10}%`;
const sign = n => (n > 0 ? '+' : n < 0 ? '−' : '') + Math.abs(n);
const domInfo = (d, exam) => { const sp = (DOMAIN_SPEC[exam] || DOMAIN_SPEC.sat)[d]; return `${pct(sp[0])} of section, ${sp[1]} questions`; };
UI.domInfo = domInfo;

/* ---------- form fields ---------- */
UI.reportFields = (pre, o = {}) => {
  const exam = o.exam || 'sat', rg = o.ranges || {}, dm = o.domains || {}, has = o.grade || Object.keys(rg).length || Object.keys(dm).length;
  const rng = (k, label, ph) => `<div class="field"><label for="${pre}-r-${k}">${label}</label><input id="${pre}-r-${k}" class="inp" inputmode="numeric" autocomplete="off" maxlength="11" placeholder="${ph}" value="${rg[k] ? rg[k].join('-') : ''}"></div>`;
  const band = d => `<div class="field band-f"><label for="${pre}-b-${d}">${esc(DOMAINS[d].name)} <small id="${pre}-dl-${d}">${domInfo(d, exam)}</small></label>
    <select id="${pre}-b-${d}" class="inp"><option value="">Not entered</option>${[1, 2, 3, 4, 5, 6, 7].map(n => `<option value="${n}" ${dm[d] === n ? 'selected' : ''}>${n} of 7</option>`).join('')}</select></div>`;
  return `<details class="plain report-d" id="${pre}-rep" ${has ? 'open' : ''}><summary>${ic('progress', 18)} Details from your score report <span class="opt">(optional)</span></summary><div class="report-body">
    <p class="hint">College Board score reports print these. They sharpen your progress view and tell your practice plan where to start.</p>
    <div class="form-row"><div class="field"><label for="${pre}-tgrade">Grade when you took it</label><select id="${pre}-tgrade" class="inp"><option value="">Not entered</option>${[8, 9, 10, 11, 12].map(g => `<option value="${g}" ${o.grade === g ? 'selected' : ''}>${g}th grade</option>`).join('')}</select></div></div>
    <fieldset class="field"><legend>Score ranges</legend><div class="score-fields">${rng('total', 'Total range', 'e.g. 1370-1450')}${rng('rw', 'R&amp;W range', 'e.g. 650-710')}${rng('math', 'Math range', 'e.g. 690-770')}</div>
      <p class="hint">Each score on the report comes with a range showing how much it could vary on another day. Type it as printed.</p></fieldset>
    <fieldset class="field"><legend>Knowledge and skills</legend><p class="hint" style="margin-top:0">Each area shows 7 boxes. Count the filled boxes and pick that number.</p>
      ${['rw', 'math'].map(sec => `<div class="band-sec"><h3>${SECN[sec]}</h3>${ORDER[sec].map(band).join('')}</div>`).join('')}</fieldset>
    <p class="err" id="${pre}-e-report" role="alert" hidden></p></div></details>`;
};
UI.readReport = pre => {
  if (!$(`#${pre}-rep`)) return {};
  const domains = {}; Object.keys(DOMAINS).forEach(d => { const v = $(`#${pre}-b-${d}`).value; if (v) domains[d] = +v; });
  return { grade: $(`#${pre}-tgrade`).value, ranges: { total: $(`#${pre}-r-total`).value, rw: $(`#${pre}-r-rw`).value, math: $(`#${pre}-r-math`).value }, domains };
};
UI.showReportErrors = (pre, err) => {
  const box = $(`#${pre}-e-report`); if (!box) return false;
  const msg = [err.grade, err.ranges, err.domains].filter(Boolean).join(' ');
  box.textContent = msg; box.hidden = !msg; if (msg) { $(`#${pre}-rep`).open = true; box.scrollIntoView({ block: 'nearest' }); }
  return !!msg;
};
UI.updateReportLabels = (pre, exam) => Object.keys(DOMAINS).forEach(d => { const el = $(`#${pre}-dl-${d}`); if (el) el.textContent = domInfo(d, exam); });

/* ---------- small pieces ---------- */
UI.bandBar = (band, prev, label) => {
  const delta = prev ? band - prev : 0;
  return `<span class="bands" role="img" aria-label="${esc(label)}: band ${band} of 7${prev ? `, ${delta === 0 ? 'same as' : delta > 0 ? 'up from' : 'down from'} ${prev} last time` : ''}">${[1, 2, 3, 4, 5, 6, 7].map(n => `<i class="${n <= band ? 'on' : ''}${prev && n > Math.min(band, prev) && n <= Math.max(band, prev) ? (delta > 0 ? ' up' : ' down') : ''}"></i>`).join('')}</span>${prev && delta ? `<span class="delta ${delta > 0 ? 'ok' : 'bad'}">${sign(delta)}</span>` : ''}`;
};
UI.deltaChip = (n, unit = '') => n == null ? '' : `<span class="delta ${n > 0 ? 'ok' : n < 0 ? 'bad' : ''}">${n > 0 ? ic('up', 14) : n < 0 ? ic('down', 14) : ''}${sign(n)}${unit}</span>`;
UI.rangeText = e => e.ranges && e.ranges.total ? `${e.ranges.total[0]}-${e.ranges.total[1]}` : '';
UI.benchBadges = e => {
  const b = Engine.benchmark(e); if (!b) return '';
  const one = (met, k, v) => met == null ? '' : `<span class="badge ${met ? 'd1' : 'warn'}" title="Grade ${b.grade} benchmark for ${k}: ${v}">${k} benchmark ${met ? 'met' : 'not yet'}</span>`;
  return one(b.rwMet, 'R&W', b.rw) + one(b.mathMet, 'Math', b.math);
};
/* "+80 since Oct 2025" for the Home score card. */
UI.homeDelta = p => { const r = Engine.reportProgress(p); if (!r || !r.prev) return ''; const d = r.sincePrev.total;
  return `<span class="delta ${d > 0 ? 'ok' : d < 0 ? 'bad' : ''}">${d > 0 ? ic('up', 14) : d < 0 ? ic('down', 14) : ''}${sign(d)} since ${fmtDay(r.prev.entry.date)}</span>`; };

/* ---------- improvement card ---------- */
UI.improveCard = (p, onScores) => {
  const r = Engine.reportProgress(p); if (!r) return '';
  const sc = Engine.examOf(p), L = r.latest;
  if (!r.prev) return `<section class="card improve"><div class="card-head"><h2>Improvement</h2>${onScores ? '' : '<a class="link" href="#/scores">My scores</a>'}</div>
    <p>Your ${E[L.entry.exam].name} from ${fmtDay(L.entry.date)} is your starting point: <b>${L.total}</b>${UI.rangeText(L.entry) ? ` (range ${UI.rangeText(L.entry)})` : ''}. Add your next real score to see how much you have improved.</p>${UI.benchBadges(L.entry) ? `<div class="chips">${UI.benchBadges(L.entry)}</div>` : ''}</section>`;
  const d = r.sincePrev, up = d.total > 0;
  const head = d.total === 0 ? `Same total as your ${fmtDay(r.prev.entry.date)} test` : `${sign(d.total)} points since ${fmtDay(r.prev.entry.date)}`;
  const note = r.overlap === false && up ? 'Your score ranges do not overlap, so this is very likely a real improvement, not day-to-day variation.'
    : r.overlap === true ? 'Your two score ranges overlap, so part of this change could be normal day-to-day variation. Keep practicing and compare again after your next test.'
    : d.total >= 60 ? 'That is a big jump. Add the score ranges from your reports to see how certain it is.' : '';
  const ups = r.domains.filter(x => x.change > 0), downs = r.domains.filter(x => x.change < 0);
  const domLine = r.domains.length ? `<ul class="plain-list tips">${ups.length ? `<li><b>Moved up:</b> ${ups.map(x => `${esc(DOMAINS[x.dom].name)} (${x.from} to ${x.to})`).join(', ')}.</li>` : ''}${downs.length ? `<li><b>Slipped:</b> ${downs.map(x => `${esc(DOMAINS[x.dom].name)} (${x.from} to ${x.to})`).join(', ')}. These are now part of your daily plan.</li>` : ''}${!ups.length && !downs.length ? '<li>Every knowledge and skills band stayed the same.</li>' : ''}</ul>` : '';
  return `<section class="card improve"><div class="card-head"><h2>Improvement</h2>${onScores ? '' : '<a class="link" href="#/scores">My scores</a>'}</div>
    <div class="imp-head ${up ? 'ok' : d.total < 0 ? 'bad' : ''}">${up ? ic('up', 22) : d.total < 0 ? ic('down', 22) : ''}<b>${head}</b></div>
    <div class="imp-grid"><div><span class="eyebrow">Latest</span><b>${L.total}</b><small>${E[L.entry.exam].name}, ${fmtDay(L.entry.date)}</small></div>
      <div><span class="eyebrow">Reading &amp; Writing</span><b>${L.entry.rw != null ? L.rw : '-'}</b>${UI.deltaChip(d.rw)}</div>
      <div><span class="eyebrow">Math</span><b>${L.entry.math != null ? L.math : '-'}</b>${UI.deltaChip(d.math)}</div>
      <div><span class="eyebrow">${r.sinceFirst ? `Since first test` : 'Best so far'}</span><b>${r.sinceFirst ? sign(r.sinceFirst.total) : r.best.total}</b><small>${r.sinceFirst ? `from ${r.first.total} on ${fmtDay(r.first.entry.date)}` : fmtDay(r.best.entry.date)}</small></div></div>
    ${note ? `<p class="hint">${note}</p>` : ''}${domLine}${UI.benchBadges(L.entry) ? `<div class="chips">${UI.benchBadges(L.entry)}</div>` : ''}
    ${L.total < p.target ? `<p class="hint">${p.target - L.total} points to your ${sc.name} goal of ${p.target}.</p>` : `<p class="hint">You reached your goal of ${p.target}. Consider raising it.</p>`}</section>`;
};

/* ---------- latest report card: the 8 bands ---------- */
UI.reportCard = p => {
  const list = Engine.priorScores(p).filter(e => e.domains && Object.keys(e.domains).length); if (!list.length) return '';
  const e = list[0], prev = list[1], st = Engine.skillStats(p);
  const row = d => { const b = e.domains[d]; if (!b) return ''; const [lo, hi] = Engine.bandRange(DOMAINS[d].sec, b, e.exam), pb = prev && prev.domains[d];
    const sk = SKILLS.filter(s => s.dom === d), n = sk.reduce((s, x) => s + st[x.id].n, 0), m = n ? sk.reduce((s, x) => s + st[x.id].m * st[x.id].n, 0) / n : null;
    return `<div class="band-row"><div class="br-t"><b>${esc(DOMAINS[d].name)}</b><small>${domInfo(d, e.exam)}</small></div><div class="br-v">${UI.bandBar(b, pb, DOMAINS[d].name)}<small>Band ${b} of 7, section scores ${lo} to ${hi}</small>${n >= 6 ? `<small>Practice since: ${Math.round(m * 100)}% mastery</small>` : ''}</div></div>`; };
  return `<section class="card"><div class="card-head"><h2>Knowledge and skills</h2><span class="hint">From your ${E[e.exam].name} on ${fmtDay(e.date)}${prev ? `, compared with ${fmtDay(prev.date)}` : ''}</span></div>
    ${['rw', 'math'].map(sec => `<h3 class="band-h">${SECN[sec]}</h3>${ORDER[sec].map(row).join('')}`).join('')}
    <p class="hint">Bands go from 1 to 7. Your daily plan starts with the lowest bands until practice shows where you really stand.</p></section>`;
};
}());
