/* Procedural SAT-style math question generators.
   Every template returns a fresh, numerically-computed question, so there is effectively an unlimited supply.
   Text markup understood by the renderer:  x^2  x^{n+1}  @f(num|den)  @r(radicand)  */
(function () {
const R = {
  int: (a, b) => Math.floor(Math.random() * (b - a + 1)) + a,
  pick: a => a[Math.floor(Math.random() * a.length)],
  nz: (a, b) => { let v = 0; while (!v) v = R.int(a, b); return v; },
  chance: p => Math.random() < p,
  shuffle: a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
};
const gcd = (a, b) => b ? gcd(b, a % b) : Math.abs(a);
const M = '−';
const S = n => n < 0 ? M + (-n) : String(n);                   // signed number
const sg = n => n < 0 ? ` ${M} ${-n}` : ` + ${n}`;             // " + 5" / " − 5"
const co = (c, v) => c === 1 ? v : c === -1 ? M + v : `${S(c)}${v}`;
const L = (a, b) => co(a, 'x') + (b ? sg(b) : '');             // ax + b
const P2 = (a, b, c) => {                                        // ax^2 + bx + c
  let s = a === 1 ? 'x^2' : a === -1 ? M + 'x^2' : `${S(a)}x^2`;
  if (b) s += (b < 0 ? ` ${M} ` : ' + ') + (Math.abs(b) === 1 ? '' : Math.abs(b)) + 'x';
  if (c) s += sg(c);
  return s;
};
const N = x => { const r = Math.round(x * 10000) / 10000; return S(r); };
const fr = (n, d) => { const g = gcd(n, d) || 1; n /= g; d /= g; if (d < 0) { n = -n; d = -d; } return d === 1 ? S(n) : `${S(n)}/${d}`; };
const FR = (n, d) => { const g = gcd(n, d) || 1; n /= g; d /= g; return d === 1 ? S(n) : `@f(${n}|${d})`; };

/* Pick `k` unique wrong answers from candidate list (strings), padding numerically if needed. */
function wrongs(correct, cands, k = 3, pad) {
  const out = [], seen = new Set([String(correct)]);
  for (const c of R.shuffle(cands)) { const s = String(c); if (!seen.has(s) && !/NaN|Infinity|undefined/.test(s)) { seen.add(s); out.push(s); if (out.length === k) return out; } }
  let i = 1; const base = typeof pad === 'number' ? pad : parseFloat(String(correct).replace(M, '-'));
  while (out.length < k && i < 50) { for (const sgn of [1, -1]) { const s = N(base + sgn * i); if (!seen.has(s) && out.length < k) { seen.add(s); out.push(s); } } i++; }
  return out;
}
/* Numeric-answer helper: becomes a grid-in (student-produced response) about `gp` of the time. */
function numQ(o, gp = 0.4) {
  const correct = o.fmt ? o.fmt(o.v) : N(o.v);
  const q = { d: o.d, p: o.p || null, q: o.q, e: o.e, table: o.table, fig: o.fig };
  if (R.chance(gp) && !o.noGrid) { q.grid = true; q.a = String(Math.round(o.v * 1e6) / 1e6); q.show = correct; }
  else { q.a = correct; const ws = (o.wrong || []).filter(w => !Number.isInteger(o.v) || Number.isInteger(w)); q.w = wrongs(correct, ws.map(w => o.fmt ? o.fmt(w) : N(w)), 3, o.v); }
  return q;
}
function mcQ(o) { return { d: o.d, p: o.p || null, q: o.q, a: o.a, w: wrongs(o.a, o.w, 3), e: o.e, table: o.table, fig: o.fig }; }

/* ---------- SVG helpers ---------- */
function svgScatter(m, b, xmax, ymax, pts) {
  const W = 360, H = 240, l = 40, r = 12, t = 12, bt = 34, pw = W - l - r, ph = H - t - bt;
  const X = x => l + x / xmax * pw, Y = y => t + ph - y / ymax * ph;
  let s = `<svg viewBox="0 0 ${W} ${H}" class="fig" role="img" aria-label="Scatterplot with a line of best fit">`;
  for (let i = 0; i <= xmax; i += 2) s += `<line class="grid" x1="${X(i)}" x2="${X(i)}" y1="${t}" y2="${t + ph}"/><text class="tick" x="${X(i)}" y="${t + ph + 14}" text-anchor="middle">${i}</text>`;
  const ys = Math.max(2, Math.round(ymax / 5)); for (let i = 0; i <= ymax; i += ys) s += `<line class="grid" y1="${Y(i)}" y2="${Y(i)}" x1="${l}" x2="${l + pw}"/><text class="tick" x="${l - 6}" y="${Y(i) + 4}" text-anchor="end">${i}</text>`;
  s += `<line class="axis" x1="${l}" x2="${l}" y1="${t}" y2="${t + ph}"/><line class="axis" x1="${l}" x2="${l + pw}" y1="${t + ph}" y2="${t + ph}"/>`;
  s += `<text class="tick" x="${l + pw / 2}" y="${H - 4}" text-anchor="middle">x</text><text class="tick" x="10" y="${t + ph / 2}" text-anchor="middle" transform="rotate(-90 10 ${t + ph / 2})">y</text>`;
  const x2 = Math.min(xmax, (ymax - b) / m); s += `<line class="fitline" x1="${X(0)}" y1="${Y(b)}" x2="${X(x2)}" y2="${Y(m * x2 + b)}"/>`;
  pts.forEach(([x, y]) => { s += `<circle class="pt" cx="${X(x)}" cy="${Y(y)}" r="4"/>`; });
  return s + '</svg>';
}
function svgTri(labels, sides) {
  return `<svg viewBox="0 0 220 150" class="fig" role="img" aria-label="Right triangle"><polygon class="shape" points="30,120 190,120 30,25"/><rect class="axis" x="30" y="105" width="15" height="15" fill="none"/>` +
    `<text class="tick" x="14" y="126">${labels[0]}</text><text class="tick" x="192" y="132">${labels[1]}</text><text class="tick" x="22" y="20">${labels[2]}</text>` +
    (sides ? `<text class="tick" x="105" y="138" text-anchor="middle">${sides[0]}</text><text class="tick" x="16" y="76" text-anchor="end">${sides[1]}</text><text class="tick" x="120" y="66">${sides[2]}</text>` : '') + '</svg>';
}

const G = {};   // skill -> [{d, f}]
const T = (skill, d, f) => (G[skill] = G[skill] || []).push({ d, f });

/* ===================== ALGEBRA ===================== */
T('lin1', 1, () => { const x = R.int(2, 12), a = R.int(2, 9), b = R.nz(-15, 15), c = a * x + b;
  return numQ({ d: 1, q: `If ${L(a, b)} = ${S(c)}, what is the value of x?`, v: x, wrong: [x + 1, x - 1, (c + b) / a, c - b, c / a],
    e: `Undo the ${b < 0 ? 'subtraction' : 'addition'} first: ${co(a, 'x')} = ${S(c)}${sg(-b)} = ${S(c - b)}. Then divide by ${a}: x = ${x}.` }); });
T('lin1', 2, () => { const k = R.int(2, 6), n = R.int(1, 8), m = R.int(1, 10), x = R.int(1, 9), c = k * (x + n) - m;
  return numQ({ d: 2, q: `${k}(x + ${n}) ${M} ${m} = ${S(c)}. What is the value of x?`, v: x, wrong: [x + n, x - 1, x + 2, (c - m) / k - n + 1],
    e: `Add ${m} to both sides: ${k}(x + ${n}) = ${c + m}. Divide by ${k}: x + ${n} = ${(c + m) / k}. So x = ${x}.` }); });
T('lin1', 2, () => { const dd = R.int(2, 6), x = dd * R.int(2, 9), a = R.int(1, 9), b = x / dd + a;
  return numQ({ d: 2, q: `If @f(x|${dd}) + ${a} = ${b}, what is the value of x?`, v: x, wrong: [x / dd, b - a + dd, x + dd, (b + a) * dd],
    e: `Subtract ${a}: @f(x|${dd}) = ${b - a}. Multiply both sides by ${dd}: x = ${x}.` }); });
T('lin1', 3, () => { const m = R.int(2, 7), n = R.int(2, 9), k = m * n;
  return numQ({ d: 3, q: `If ${m}(x + ${n}) = ${m}x + k has infinitely many solutions, what is the value of k?`, v: k, wrong: [n, m + n, k + m, k - n],
    e: `Distribute: ${m}x + ${k} = ${m}x + k. The equation is true for every x only if the constants match, so k = ${k}.` }, 0.5); });
T('lin1', 3, () => { const a = R.int(2, 6), c = a + R.int(1, 4), x = R.int(2, 9), b = R.int(1, 12), d = (a - c) * x + b;
  return numQ({ d: 3, q: `${a}x + ${b} = ${c}x + ${S(d)}. What is the value of x?`, v: x, wrong: [-x, x + 1, b - d, (b - d) / (a + c)],
    e: `Move the x-terms to one side: ${b} ${M} ${S(d)} = (${c} ${M} ${a})x, so ${b - d} = ${c - a}x and x = ${x}.` }); });

T('lin2', 1, () => { const r = R.int(12, 60), f = R.int(15, 90), ctx = R.pick([['A plumber charges a service fee of', 'per hour of work', 'hours', 'C'], ['A gym charges a one-time sign-up fee of', 'per month', 'months', 'C'], ['A tutoring center charges a registration fee of', 'per session', 'sessions', 'C']]);
  const t = ctx[2][0], a = `C = ${r}${t} + ${f}`;
  return mcQ({ d: 1, q: `${ctx[0]} $${f} plus $${r} ${ctx[1]}. Which equation gives the total cost C, in dollars, for ${t} ${ctx[2]}?`, a, w: [`C = ${f}${t} + ${r}`, `C = ${r + f}${t}`, `C = ${r}${t} ${M} ${f}`, `C = ${r}(${t} + ${f})`], e: `The fee is paid once ($${f}, the constant). The rate ($${r}) multiplies the number of ${ctx[2]}, so C = ${r}${t} + ${f}.` }); });
T('lin2', 2, () => { const m = R.nz(-4, 5), b = R.int(-9, 9), x1 = R.int(1, 4), x2 = x1 + R.int(1, 3), y1 = m * x1 + b, y2 = m * x2 + b;
  return numQ({ d: 2, q: `A line in the xy-plane passes through the points (${x1}, ${S(y1)}) and (${x2}, ${S(y2)}). What is the y-intercept of the line?`, v: b, wrong: [m, -b, y1, y2, b + m],
    e: `Slope = (${S(y2)} ${M} ${S(y1)}) / (${x2} ${M} ${x1}) = ${S(m)}. Then b = y ${M} mx = ${S(y1)} ${M} (${S(m)})(${x1}) = ${S(b)}.` }); });
T('lin2', 2, () => { const s = R.int(1, 3), x1 = R.int(1, 4), x2 = x1 + s, k = R.pick([1, 2]), m = R.nz(-5, 6), b = R.int(-8, 8), y1 = m * x1 + b, y2 = m * x2 + b, x3 = x2 + k * s, y3 = m * x3 + b;
  return numQ({ d: 2, q: `The function f is linear. f(${x1}) = ${S(y1)} and f(${x2}) = ${S(y2)}. What is f(${x3})?`, v: y3, wrong: [y2 + m, y3 + m, y2 + k * (y2 - y1) + 1, y1 + y2],
    e: `The slope is (${S(y2)} ${M} ${S(y1)}) / ${s} = ${S(m)}. From x = ${x2} to x = ${x3} is ${x3 - x2} units, so f(${x3}) = ${S(y2)} + ${S(m)}(${x3 - x2}) = ${S(y3)}.` }); });
T('lin2', 2, () => { const c = R.pick([['A taxi’s fare F, in dollars, for a ride of m miles is F = %m%m + %b%', 'miles', 'fare'], ['The height h, in centimeters, of a candle after t hours of burning is h = %b% %S%%m%t', 'hours', 'height']]);
  const askSlope = R.chance(0.5), mm = R.int(2, 5), bb = R.int(3, 25);
  if (c[2] === 'fare') {
    const ok = askSlope ? 'The increase in the fare for each additional mile traveled' : 'The fare for a ride of 0 miles (the initial charge)';
    return mcQ({ d: 2, q: `A taxi’s fare F, in dollars, for a ride of m miles is F = ${mm}m + ${bb}. What does ${askSlope ? mm : bb} represent in this context?`, a: ok,
      w: askSlope ? ['The fare for a ride of 0 miles', 'The total number of miles traveled', 'The total fare for the ride'] : ['The increase in the fare for each additional mile', 'The total number of miles traveled', 'The total fare for the ride'],
      e: askSlope ? `In F = mm + b form, the coefficient of m (${mm}) is the rate of change: dollars per mile.` : `The constant ${bb} is the value of F when m = 0: the initial charge.` });
  }
  const ok = askSlope ? 'The candle burns down by this many centimeters each hour' : 'The height of the candle before it is lit';
  return mcQ({ d: 2, q: `The height h, in centimeters, of a candle after t hours of burning is h = ${bb + 10} ${M} ${mm}t. What does ${askSlope ? mm : bb + 10} represent in this context?`, a: ok,
    w: askSlope ? ['The height of the candle before it is lit', 'The total time the candle burns', 'The height of the candle after one hour'] : ['The candle burns down by this many centimeters each hour', 'The total time the candle burns', 'The height of the candle after one hour'],
    e: askSlope ? `The coefficient of t (${M}${mm}) is the rate of change; the negative sign means the height decreases ${mm} cm per hour.` : `When t = 0 the height is ${bb + 10}: the starting height.` });
});

T('sys', 2, () => { let x, y, a, b, d, e; do { x = R.int(1, 8); y = R.int(1, 8); a = R.int(1, 5); b = R.nz(-4, 5); d = R.int(1, 5); e = R.nz(-4, 5); } while (a * e - b * d === 0 || a / d === b / e);
  const c = a * x + b * y, f = d * x + e * y, which = R.pick(['x', 'y', 'x + y']), v = which === 'x' ? x : which === 'y' ? y : x + y;
  const term = (c, v, first) => (first ? (c === 1 ? '' : c < 0 ? M + (c === -1 ? '' : -c) : c) : (c < 0 ? ` ${M} ` : ' + ') + (Math.abs(c) === 1 ? '' : Math.abs(c))) + v;
  return numQ({ d: 2, q: `${term(a, 'x', true)}${term(b, 'y')} = ${c}\n${term(d, 'x', true)}${term(e, 'y')} = ${f}\n\nThe solution to the system of equations above is (x, y). What is the value of ${which}?`,
    v, wrong: [x, y, x + y, x - y, y + 1].filter(w => w !== v),
    e: `Solving the system (by elimination or substitution) gives x = ${x} and y = ${y}. Check in the first equation: ${a}(${x}) ${b < 0 ? M : '+'} ${Math.abs(b)}(${y}) = ${c} ✓. So ${which} = ${v}.` }); });
T('sys', 2, () => { const pa = R.int(8, 20), pc = R.int(4, pa - 2), na = R.int(20, 80), nc = R.int(20, 80), ev = R.pick(['a school play', 'a community concert', 'a science fair']);
  return numQ({ d: 2, q: `Tickets to ${ev} cost $${pa} for adults and $${pc} for children. A total of ${na + nc} tickets were sold for $${pa * na + pc * nc}. How many adult tickets were sold?`, v: na, wrong: [nc, (na + nc) / 2, na + 5, na - 5],
    e: `Let a = adult tickets and c = child tickets: a + c = ${na + nc} and ${pa}a + ${pc}c = ${pa * na + pc * nc}. Substituting c = ${na + nc} ${M} a gives ${pa - pc}a = ${pa * na + pc * nc - pc * (na + nc)}, so a = ${na}.` }); });
T('sys', 3, () => { const a = R.int(2, 6), b = R.int(3, 7), m = R.int(2, 5), c = R.int(5, 15), noSol = R.chance(0.5), k = b * m;
  return noSol ? numQ({ d: 3, q: `${a}x + ${b}y = ${c}\n${a * m}x + ky = ${c * m + R.int(1, 9)}\n\nIn the system above, k is a constant. If the system has no solution, what is the value of k?`, v: k, wrong: [k + m, b, a * m, k - m],
      e: `No solution means the lines are parallel: the x- and y-coefficients are proportional but the constants are not. The second equation’s x-coefficient is ${m} times the first, so k = ${m}(${b}) = ${k}.` }, 0.5)
    : numQ({ d: 3, q: `${a}x + ${b}y = ${c}\n${a * m}x + ky = ${c * m}\n\nIn the system above, k is a constant. If the system has infinitely many solutions, what is the value of k?`, v: k, wrong: [k + m, b, c * m, k - m],
      e: `Infinitely many solutions means the second equation is a multiple of the first. Multiplying by ${m} gives ${a * m}x + ${k}y = ${c * m}, so k = ${k}.` }, 0.5); });

T('ineq', 1, () => { const f = R.int(20, 60), r = R.int(5, 20), B = R.int(150, 400), th = R.pick(['at most', 'no more than']);
  return mcQ({ d: 1, q: `A delivery service charges a $${f} base fee plus $${r} per package. A business can spend ${th} $${B} on a single delivery. Which inequality represents the number of packages, p, the business can send?`, a: `${r}p + ${f} ≤ ${B}`, w: [`${r}p + ${f} ≥ ${B}`, `${f}p + ${r} ≤ ${B}`, `${r}p ${M} ${f} ≤ ${B}`],
    e: `Total cost = $${r} per package times p, plus the $${f} base fee. "${th}" means ≤, so ${r}p + ${f} ≤ ${B}.` }); });
T('ineq', 2, () => { const a = R.int(2, 7), b = R.int(-10, 15), c = R.int(20, 60), neg = R.chance(0.5);
  let ans = null; const test = neg ? (x => -a * x + b > c - 70) : (x => a * x + b <= c);
  for (let x = -200; x <= 200; x++) if (test(x)) ans = ans === null ? x : Math.max(ans, x);
  if (neg) { let mx = null; for (let x = -200; x <= 200; x++) if (test(x)) mx = x; ans = mx; }
  return numQ({ d: 2, q: neg ? `What is the greatest integer value of x that satisfies ${M}${a}x + ${b} > ${c - 70}?` : `What is the greatest integer value of x that satisfies ${a}x ${b < 0 ? M : '+'} ${Math.abs(b)} ≤ ${c}?`, v: ans, wrong: [ans + 1, ans - 1, Math.round((c - b) / a)],
    e: neg ? `Subtract ${b}: ${M}${a}x > ${c - 70 - b}. Dividing by ${M}${a} flips the sign: x < ${N((c - 70 - b) / -a)}. The greatest integer below that is ${ans}.` : `Subtract ${b}: ${a}x ≤ ${c - b}, so x ≤ ${N((c - b) / a)}. The greatest integer value is ${ans}.` }); });
T('ineq', 2, () => { const B = R.int(40, 120), p = R.int(2, 6), s = R.int(8, 25), n = Math.floor((B - s) / p);
  return numQ({ d: 2, q: `Jada has $${B} to spend on school supplies. She buys a backpack for $${s} and then spends the rest on notebooks that cost $${p} each. What is the maximum number of notebooks she can buy?`, v: n, wrong: [n + 1, n - 1, Math.floor(B / p)],
    e: `${p}n + ${s} ≤ ${B} → n ≤ ${N((B - s) / p)}. She can only buy whole notebooks, so the maximum is ${n}.` }); });
T('ineq', 3, () => { let tries = 0, pts, ok, m, b, k;
  do { m = R.pick([1, 2, 3, -1, -2]); b = R.int(-4, 4); k = R.int(-2, 3); pts = []; const seen = new Set();
    while (pts.length < 4 && tries++ < 200) { const p = [R.int(-5, 8), R.int(-8, 12)]; if (!seen.has(p + '')) { seen.add(p + ''); pts.push(p); } }
    ok = pts.filter(([x, y]) => y > m * x + b && x >= k); } while (ok.length !== 1 && tries < 2000);
  if (ok.length !== 1) return G.ineq[0].f();
  const right = ok[0], fmt = p => `(${S(p[0])}, ${S(p[1])})`, ineq = `y > ${co(m, 'x')}${b ? sg(b) : ''}`;
  return { d: 3, q: `Which of the following points (x, y) is a solution to the system of inequalities below?\n\n${ineq}\nx ≥ ${S(k)}`, a: fmt(right), w: pts.filter(p => p !== right).map(fmt),
    e: `A point must satisfy both inequalities. Testing each: only ${fmt(right)} has x ≥ ${S(k)} and y > ${co(m, 'x')}${b ? sg(b) : ''} (here ${S(right[1])} > ${S(m * right[0] + b)}).` }; });

/* ===================== ADVANCED MATH ===================== */
T('equiv', 1, () => { let a, b; do { a = R.nz(-6, 6); b = R.nz(-6, 6); } while (a === b || a === -b); const s = a + b, pr = a * b;
  return mcQ({ d: 1, q: `Which expression is equivalent to (x ${a < 0 ? M : '+'} ${Math.abs(a)})(x ${b < 0 ? M : '+'} ${Math.abs(b)})?`, a: P2(1, s, pr), w: [P2(1, pr, s), P2(1, s, s), P2(1, s, -pr), P2(1, -s, pr)],
    e: `Use FOIL: x² + (${S(a)} + ${S(b)})x + (${S(a)})(${S(b)}) = ${P2(1, s, pr)}.` }); });
T('equiv', 2, () => { const a = R.int(1, 5), b = R.int(1, 5);
  return mcQ({ d: 2, q: `Which expression is equivalent to (${a === 1 ? '' : a}x + ${b})^2 ${M} (${a === 1 ? '' : a}x ${M} ${b})^2?`, a: `${4 * a * b}x`, w: [`${2 * a * b}x`, `${a * b}x`, `${2 * a * a}x^2 + ${2 * b * b}`, `${4 * a * b}x^2`],
    e: `Expand: (${a}x + ${b})² = ${a * a}x² + ${2 * a * b}x + ${b * b} and (${a}x ${M} ${b})² = ${a * a}x² ${M} ${2 * a * b}x + ${b * b}. Subtracting leaves ${4 * a * b}x.` }); });
T('equiv', 2, () => { const a = R.int(2, 9);
  return mcQ({ d: 2, q: `For x ≠ ${a}, which expression is equivalent to @f(x^2 ${M} ${a * a}|x ${M} ${a})?`, a: `x + ${a}`, w: [`x ${M} ${a}`, `x^2 ${M} ${a}`, `${a}x`, `x + ${a * a}`],
    e: `Factor the numerator as a difference of squares: x² ${M} ${a * a} = (x ${M} ${a})(x + ${a}). Cancel the common factor to get x + ${a}.` }); });
T('equiv', 2, () => { const a = R.int(1, 4), b = R.nz(-6, 6), c = R.int(1, 4), d = R.nz(-6, 6), q = a * d + b * c;
  return numQ({ d: 2, q: `When the expression (${a === 1 ? '' : a}x ${b < 0 ? M : '+'} ${Math.abs(b)})(${c === 1 ? '' : c}x ${d < 0 ? M : '+'} ${Math.abs(d)}) is written in the form px² + qx + r, what is the value of q?`, v: q, wrong: [a * c, b * d, a * d - b * c, a * d],
    e: `The x-terms come from the outer and inner products: (${a}x)(${S(d)}) + (${S(b)})(${c}x) = ${S(a * d)}x + ${S(b * c)}x = ${S(q)}x. So q = ${S(q)}.` }); });
T('equiv', 3, () => { let a, b; do { a = R.int(1, 7); b = R.nz(-7, 7); } while (a === Math.abs(b));
  const B = a + b, C = a * b, f = (p, q) => `(x ${p < 0 ? M : '+'} ${Math.abs(p)})(x ${q < 0 ? M : '+'} ${Math.abs(q)})`;
  return mcQ({ d: 3, q: `Which expression is equivalent to ${P2(1, B, C)}?`, a: f(a, b), w: [f(-a, -b), f(a, -b), f(C, 1), f(-a, b)],
    e: `Find two numbers whose product is ${S(C)} and whose sum is ${S(B)}: ${S(a)} and ${S(b)}. So the expression factors as ${f(a, b)}.` }); });

T('nl', 2, () => { const r1 = R.int(-9, 9), r2 = R.int(-9, 9), B = -(r1 + r2), C = r1 * r2, sumQ = R.chance(0.5);
  return numQ({ d: 2, q: `What is the ${sumQ ? 'sum' : 'product'} of the solutions to ${P2(1, B, C)} = 0?`, v: sumQ ? r1 + r2 : C, wrong: sumQ ? [-(r1 + r2), C, B] : [r1 + r2, -C, B],
    e: `For x² + bx + c = 0, the sum of the solutions is ${M}b and the product is c. Here the roots are ${S(r1)} and ${S(r2)}, so the ${sumQ ? 'sum' : 'product'} is ${S(sumQ ? r1 + r2 : C)}.` }); });
T('nl', 2, () => { const r1 = -R.int(1, 7), r2 = R.int(1, 9);
  return numQ({ d: 2, q: `What is the positive solution to ${P2(1, -(r1 + r2), r1 * r2)} = 0?`, v: r2, wrong: [-r1, r1 + r2, r1 * r2, -r2],
    e: `Factor: (x ${M} ${S(r2)})(x ${r1 < 0 ? M : '+'} ${Math.abs(r1)}) = 0, so x = ${r2} or x = ${r1}. The positive solution is ${r2}.` }); });
T('nl', 3, () => { const b = 2 * R.int(2, 8), c = (b / 2) ** 2;
  return numQ({ d: 3, q: `In the equation x^2 + ${b}x + k = 0, k is a constant. If the equation has exactly one real solution, what is the value of k?`, v: c, wrong: [b, b / 2, 2 * b, b * b],
    e: `One real solution means the discriminant is zero: b² ${M} 4ac = ${b}² ${M} 4k = 0, so k = ${b * b}/4 = ${c}.` }, 0.5); });
T('nl', 3, () => { const m = R.int(2, 6), q = R.int(1, 4), p = q + 1, s = m + p, e = m - q, k = m * m - s * e;
  const kk = k === 0 ? '' : k < 0 ? ` ${M} ${-k}` : ` + ${k}`;
  return mcQ({ d: 3, q: `What is the solution to the equation @r(x${kk}) = x ${M} ${m}?`, a: String(s), w: [String(e), `${s} and ${e}`, String(m), String(s + 1)],
    e: `Square both sides: x${kk} = (x ${M} ${m})², which gives x² ${M} ${2 * m + 1}x + ${m * m - k} = 0, so x = ${s} or x = ${e}. Check: x = ${e} makes the right side ${e - m} (negative), but a square root can’t be negative, so ${e} is extraneous. The only solution is ${s}.` }); });
T('nl', 2, () => { const h = R.int(1, 6), k = R.int(h + 1, 12);
  return numQ({ d: 2, q: `If (x + ${h})^2 = ${k * k}, what is the positive value of x?`, v: k - h, wrong: [k + h, k * k - h, k, -k - h],
    e: `Take square roots: x + ${h} = ±${k}. So x = ${k - h} or x = ${-k - h}. The positive value is ${k - h}.` }); });

T('nlf', 1, () => { const a = R.int(1, 5), h = R.int(1, 9), k = R.int(-9, 12), askX = R.chance(0.5);
  return numQ({ d: 1, q: `The function f is defined by f(x) = ${a === 1 ? '' : a}(x ${M} ${h})^2 ${k < 0 ? M : '+'} ${Math.abs(k)}. ${askX ? 'For what value of x does f(x) reach its minimum?' : 'What is the minimum value of f(x)?'}`, v: askX ? h : k, wrong: askX ? [-h, k, a * h, h + 1] : [h, -k, a * k, k + 1],
    e: `This is vertex form a(x ${M} h)² + k with a > 0, so the vertex (${h}, ${S(k)}) is the minimum point. The minimum occurs at x = ${h} and the minimum value is ${S(k)}.` }); });
T('nlf', 2, () => { const n0 = R.pick([50, 100, 200, 500]), d = R.pick([2, 3, 4, 6]);
  return mcQ({ d: 2, q: `A culture starts with ${n0} bacteria, and the population doubles every ${d} hours. Which function gives the number of bacteria, P, after t hours?`, a: `P(t) = ${n0}(2)^{t/${d}}`, w: [`P(t) = ${n0}(2)^{${d}t}`, `P(t) = ${n0}(${d})^{t}`, `P(t) = ${n0}(${2 * d})^{t}`],
    e: `Doubling happens once per ${d} hours, so the exponent counts the number of ${d}-hour periods: t/${d}. That gives P(t) = ${n0}(2)^{t/${d}}.` }); });
T('nlf', 1, () => { const a = R.int(1, 4), b = R.nz(-6, 6), c = R.nz(-9, 9), k = R.int(-3, 4), v = a * k * k + b * k + c;
  return numQ({ d: 1, q: `The function g is defined by g(x) = ${P2(a, b, c)}. What is the value of g(${S(k)})?`, v, wrong: [a * k * k - b * k + c, a * k + b * k + c, v + a, v - c],
    e: `Substitute x = ${S(k)}: ${a}(${S(k)})² + (${S(b)})(${S(k)}) + (${S(c)}) = ${S(a * k * k)} + ${S(b * k)} + ${S(c)} = ${S(v)}.` }); });
T('nlf', 2, () => { const n = R.pick([2, 3]), V = n === 2 ? R.pick([25, 50, 75, 100, 200]) * 25 : R.pick([125, 250, 375, 500, 1000, 1250]), r = 20, v = V * Math.pow(0.8, n);
  return numQ({ d: 2, q: `A machine is purchased for $${V}. Its value decreases by ${r}% each year. According to this model, what is the value of the machine, in dollars, after ${n} years?`, v, wrong: [V * (1 - 0.2 * n), V * 0.8, V * Math.pow(1.2, n), V - r * n],
    e: `Each year the value is multiplied by 0.80: ${V}(0.80)^${n} = ${N(v)}.` }); });
T('nlf', 2, () => { const a = R.int(1, 3), h = R.int(-6, 6), b = -2 * a * h, c = R.int(-6, 6);
  return numQ({ d: 2, q: `The graph of y = ${P2(a, b, c)} in the xy-plane is a parabola. What is the x-coordinate of its vertex?`, v: h, wrong: [-h, b, b / 2, a * h],
    e: `The vertex has x-coordinate ${M}b/(2a) = ${M}(${S(b)})/(2·${a}) = ${S(h)}.` }); });

/* ===================== PROBLEM-SOLVING & DATA ANALYSIS ===================== */
T('ratio', 1, () => { const m = R.pick([5, 10, 12, 15, 20, 30]), b = R.int(3, 12), h = R.int(2, 6), ans = b * (60 / m) * h;
  return numQ({ d: 1, q: `A machine packs ${b} boxes every ${m} minutes. At this rate, how many boxes will it pack in ${h} hours?`, v: ans, wrong: [b * h, b * m * h, ans / 2, b * (60 / m)],
    e: `In 1 hour there are 60/${m} = ${60 / m} intervals, so the machine packs ${b}·${60 / m} = ${b * 60 / m} boxes per hour. In ${h} hours: ${ans}.` }); });
T('ratio', 1, () => { const s = R.pick([5, 8, 12, 20, 25, 40]), d = R.int(3, 24) / 2;
  return numQ({ d: 1, q: `On a map, 1 inch represents ${s} miles. Two towns are ${N(d)} inches apart on the map. What is the actual distance, in miles, between the towns?`, v: s * d, wrong: [s + d, s / d, d / s],
    e: `Multiply the map distance by the scale: ${N(d)} × ${s} = ${N(s * d)} miles.` }); });
T('ratio', 2, () => { const k = R.int(1, 8), kmh = 18 * k, ms = 5 * k;
  return numQ({ d: 2, q: `A cyclist rides at a constant speed of ${kmh} kilometers per hour. What is the cyclist’s speed, in meters per second?`, v: ms, wrong: [kmh * 1000 / 60, kmh / 60, kmh * 3.6, kmh / 1000],
    e: `${kmh} km/h = ${kmh * 1000} m per 3600 s = ${ms} m/s (dividing km/h by 3.6).` }); });
T('ratio', 2, () => { const L1 = R.pick([10, 20, 25, 40]), W = R.pick([5, 8, 10]), Hh = R.pick([2, 4, 5]), rho = R.pick([2.5, 2.7, 7.8, 8.9, 1.2]), mg = L1 * W * Hh * rho;
  return numQ({ d: 2, q: `A solid block measures ${L1} cm by ${W} cm by ${Hh} cm and is made of a material with a density of ${rho} grams per cubic centimeter. What is the mass of the block, in kilograms?`, v: mg / 1000, wrong: [mg, mg / 100, L1 * W * Hh / 1000, mg * 10],
    e: `Volume = ${L1}·${W}·${Hh} = ${L1 * W * Hh} cm³. Mass = ${L1 * W * Hh} × ${rho} = ${N(mg)} g = ${N(mg / 1000)} kg.` }); });
T('ratio', 3, () => { const [a, b] = R.pick([[6, 3], [12, 6], [10, 15], [4, 12], [20, 30], [15, 10], [8, 24]]), t = 1 / (1 / a + 1 / b);
  return numQ({ d: 3, q: `Working alone, Priya can paint a fence in ${a} hours and Marcus can paint the same fence in ${b} hours. Working together at these constant rates, how many hours will it take them to paint the fence?`, v: t, wrong: [(a + b) / 2, a + b, Math.abs(a - b), a * b / 2],
    e: `Rates add: 1/${a} + 1/${b} fence per hour = ${N(1 / a + 1 / b)}. Time = 1 ÷ that = ${N(t)} hours.` }); });
T('ratio', 1, () => { const a = R.int(2, 5), b = R.int(2, 7), c = b * R.int(2, 6), ans = a * c / b;
  return numQ({ d: 1, q: `A recipe uses ${a} cups of flour for every ${b} cups of sugar. If a baker uses ${c} cups of sugar, how many cups of flour should be used?`, v: ans, wrong: [c + a - b, a + c, c / a, b * c / a],
    e: `${a} flour : ${b} sugar. Sugar was multiplied by ${c / b}, so flour is ${a} × ${c / b} = ${ans} cups.` }); });

T('pct', 1, () => { const p = R.pick([10, 15, 20, 25, 30, 40, 60, 75]), n = R.pick([40, 60, 80, 120, 160, 200, 240]), v = n * p / 100;
  return numQ({ d: 1, q: `A store has ${n} items in stock, and ${p}% of them are on sale. How many items are on sale?`, v, wrong: [n - v, p + n, n / p, v + 10],
    e: `${p}% of ${n} = ${p / 100} × ${n} = ${v}.` }); });
T('pct', 2, () => { let P, p, q, f, tries = 0; do { P = R.pick([100, 200, 250, 400, 500, 800]); p = R.pick([10, 20, 25, 30, 50]); q = R.pick([10, 20, 25, 40, 50]); f = P * (1 + p / 100) * (1 - q / 100); } while ((!Number.isInteger(Math.round(f * 1e6) / 1e6) || f === P) && tries++ < 200);
  return numQ({ d: 2, q: `The price of a jacket was $${P}. The store first increased the price by ${p}%, then decreased the new price by ${q}%. What is the final price, in dollars?`, v: f, wrong: [P, P * (1 + (p - q) / 100), P * (1 + p / 100), P * (1 - q / 100)],
    e: `After the increase: ${P} × ${1 + p / 100} = ${P * (1 + p / 100)}. After the decrease: ${P * (1 + p / 100)} × ${1 - q / 100} = ${f}. (The two percents don’t simply subtract, because they apply to different base prices.)` }); });
T('pct', 1, () => { const old = R.pick([20, 40, 50, 80, 120, 200]), p = R.pick([10, 15, 20, 25, 30, 50, 60]), up = R.chance(0.6), nw = old * (up ? 1 + p / 100 : 1 - p / 100);
  if (!Number.isInteger(nw)) return G.pct[0].f();
  return numQ({ d: 1, q: `A town’s ${up ? 'population grew' : 'average rainfall dropped'} from ${old} to ${nw}. By what percent did it ${up ? 'increase' : 'decrease'}?`, v: p, wrong: [nw - old, up ? p + 10 : p - 5, (old / nw) * 100 - 100 > 0 ? Math.round((old / nw) * 100 - 100) : 5, 100 - p].filter(w => w > 0),
    e: `Percent change = (new ${M} old) ÷ old × 100 = (${nw} ${M} ${old}) ÷ ${old} × 100 = ${S((nw - old) / old * 100)}%. That is a ${p}% ${up ? 'increase' : 'decrease'}.` }); });
T('pct', 2, () => { const O = R.pick([40, 60, 80, 100, 120, 160, 200]), p = R.pick([10, 20, 25, 30, 40]), D = O * (1 - p / 100);
  if (!Number.isInteger(D)) return G.pct[0].f();
  return numQ({ d: 2, q: `After a ${p}% discount, a pair of headphones sells for $${D}. What was the original price, in dollars?`, v: O, wrong: [D * (1 + p / 100), D + p, D / (p / 100), Math.round(D * 1.1)],
    e: `The sale price is ${100 - p}% of the original: 0.${100 - p < 100 ? String(100 - p).padStart(2, '0') : '00'} × original = ${D}. Original = ${D} ÷ ${(100 - p) / 100} = ${O}.` }); });

T('uni', 1, () => { const n = 7, a = Array.from({ length: n }, () => R.int(3, 40)), med = a.slice().sort((x, y) => x - y)[3];
  return numQ({ d: 1, q: `What is the median of the data set ${a.join(', ')}?`, v: med, wrong: [Math.round(a.reduce((s, x) => s + x, 0) / n), a[3], Math.max(...a)],
    e: `Order the values: ${a.slice().sort((x, y) => x - y).join(', ')}. With 7 values the median is the 4th: ${med}.` }); });
T('uni', 2, () => { const m = R.int(10, 30), n = 5, a = Array.from({ length: n - 1 }, () => R.int(m - 8, m + 8)), last = m * n - a.reduce((s, x) => s + x, 0);
  if (last < 0) return G.uni[0].f();
  return numQ({ d: 2, q: `The mean of five numbers is ${m}. Four of the numbers are ${a.join(', ')}. What is the fifth number?`, v: last, wrong: [m, m * n, a.reduce((s, x) => s + x, 0) / 4, last + 5],
    e: `The sum of all five is ${m} × 5 = ${m * n}. The four known numbers sum to ${a.reduce((s, x) => s + x, 0)}, so the fifth is ${m * n} ${M} ${a.reduce((s, x) => s + x, 0)} = ${last}.` }); });
T('uni', 2, () => { const a = Array.from({ length: 7 }, () => R.int(5, 30)).sort((x, y) => x - y), shown = R.shuffle(a), inc = R.pick([30, 40, 50]);
  return mcQ({ d: 2, q: `A data set consists of the values ${shown.join(', ')}. If the greatest value is increased by ${inc} and all other values stay the same, which of the following statistics will NOT change?`, a: 'Median', w: ['Mean', 'Range', 'Standard deviation'],
    e: `The median is the middle value (${a[3]}), which doesn’t depend on how large the maximum is. The mean, range, and standard deviation all increase.` }); });
T('uni', 2, () => { const vals = [1, 2, 3, 4, 5], fr_ = [0, 0, 0, 0, 0]; let tot;
  do { for (let i = 0; i < 5; i++) fr_[i] = R.int(1, 9); tot = fr_.reduce((s, x) => s + x, 0); } while (tot % 2 === 0);
  const pos = (tot + 1) / 2; let c = 0, med = 0; for (let i = 0; i < 5; i++) { c += fr_[i]; if (c >= pos) { med = vals[i]; break; } }
  return numQ({ d: 2, q: `The table shows the number of books ${tot} students read last month. What is the median number of books read?`, table: { head: ['Books read', ...vals], rows: [['Number of students', ...fr_]] }, v: med, wrong: [3, vals[fr_.indexOf(Math.max(...fr_))], Math.round(vals.reduce((s, v, i) => s + v * fr_[i], 0) / tot)],
    e: `There are ${tot} students, so the median is the ${pos}th value. Counting up through the cumulative frequencies, the ${pos}th student read ${med} book${med > 1 ? 's' : ''}.` }); });
T('uni', 3, () => { const m = R.int(60, 90), n9 = m + R.nz(-5, 5), x = 9 * n9 - 8 * m;
  return numQ({ d: 3, q: `The mean score of 8 students on a quiz is ${m}. A ninth student takes the quiz and scores ${x}. What is the mean score of all 9 students?`, v: n9, wrong: [(m + x) / 2, m, n9 + 1, x],
    e: `Total of the first 8 = 8 × ${m} = ${8 * m}. New total = ${8 * m} + ${x} = ${9 * n9}. New mean = ${9 * n9} ÷ 9 = ${n9}.` }); });
T('uni', 2, () => { const m = R.int(40, 70), A = [-1, -1, 0, 1, 1].map(d => m + d), B = [-5, -2, 0, 2, 5].map(d => m + d), swap = R.chance(0.5);
  const X = swap ? B : A, Y = swap ? A : B;
  return mcQ({ d: 2, q: `Data set X: ${X.join(', ')}\nData set Y: ${Y.join(', ')}\n\nBoth data sets have a mean of ${m}. Which statement about their standard deviations is true?`, a: swap ? 'Data set X has the greater standard deviation.' : 'Data set Y has the greater standard deviation.',
    w: [swap ? 'Data set Y has the greater standard deviation.' : 'Data set X has the greater standard deviation.', 'The standard deviations are equal because the means are equal.', 'The standard deviations cannot be compared without the medians.'],
    e: `Standard deviation measures how spread out the values are from the mean. ${swap ? 'X' : 'Y'} has values farther from ${m} (${Math.min(...(swap ? X : Y))} to ${Math.max(...(swap ? X : Y))}), so it has the greater standard deviation.` }); });

const BI_CTX = [['hours studied', 'test score, in points', 'hour of study', 'points'], ['daily high temperature, in °C', 'number of ice cream cones sold', 'degree Celsius', 'cones'], ['distance from the city center, in km', 'rent, in dollars', 'kilometer', 'dollars'], ['age of a car, in years', 'resale value, in hundreds of dollars', 'year of age', 'hundreds of dollars']];
T('bi', 1, () => { const c = R.pick(BI_CTX), up = R.chance(0.5), m = R.int(2, 9) * (up ? 1 : -1), b = R.int(10, 60), slopeQ = R.chance(0.6), mm = Math.abs(m);
  const eq = `y = ${m < 0 ? M : ''}${mm}x + ${b}`;
  return mcQ({ d: 1, q: `A scatterplot relates ${c[0]} (x) to ${c[1]} (y). The line of best fit has the equation ${eq}. Which statement is the best interpretation of the ${slopeQ ? 'number ' + mm : 'number ' + b} in this context?`,
    a: slopeQ ? `For each additional ${c[2]}, the predicted value of y ${up ? 'increases' : 'decreases'} by ${mm} ${c[3]}.` : `When x is 0, the predicted value of y is ${b}.`,
    w: slopeQ ? [`When x is 0, the predicted value of y is ${mm}.`, `For each additional ${c[3].replace(/s$/, '')}, the predicted value of x ${up ? 'increases' : 'decreases'} by ${mm}.`, `The predicted value of y is always ${mm}.`] : [`For each additional ${c[2]}, the predicted value of y increases by ${b}.`, `The predicted value of y is always ${b}.`, `When y is 0, the predicted value of x is ${b}.`],
    e: slopeQ ? `The slope is the predicted change in y for each 1-unit increase in x.` : `The y-intercept is the predicted y-value when x = 0.` }); });
T('bi', 1, () => { const m = R.pick([1.5, 2, 2.5, 3, 4]), b = R.int(5, 30), x = R.int(4, 14), v = m * x + b;
  return numQ({ d: 1, q: `A line of best fit for a data set is y = ${m}x + ${b}. According to this model, what is the predicted value of y when x = ${x}?`, v, wrong: [m * x - b, m + x + b, (m + b) * x, v + m],
    e: `y = ${m}(${x}) + ${b} = ${N(m * x)} + ${b} = ${N(v)}.` }); });
T('bi', 2, () => { const m = R.pick([2, 3, 4]), b = R.int(4, 20), x = R.int(3, 9), pred = m * x + b, res = R.nz(-9, 9), y = pred + res;
  return numQ({ d: 2, q: `The line of best fit for a data set is y = ${m}x + ${b}. A data point has x = ${x} and y = ${y}. What is the residual for this point? (residual = actual y ${M} predicted y)`, v: res, wrong: [-res, y, pred, res + 2],
    e: `Predicted y = ${m}(${x}) + ${b} = ${pred}. Residual = ${y} ${M} ${pred} = ${S(res)}.` }, 0.5); });
T('bi', 2, () => { const m = R.pick([1, 2, 3]), b = R.int(2, 8), xmax = 8, ymax = Math.ceil((m * xmax + b + 3) / 2) * 2, pts = [];
  for (let x = 1; x <= 8; x++) pts.push([x, Math.max(1, m * x + b + R.pick([-1.5, -1, -0.5, 0, 0.5, 1, 1.5]))]);
  const eq = (mm, bb) => `y = ${mm}x + ${bb}`, a = eq(m, b), wr = [eq(m + 1, b), eq(Math.max(1, m - 1), b + 5), eq(m, b + 6), eq(m + 2, b - (b > 3 ? 3 : 0))];
  return mcQ({ d: 2, fig: svgScatter(m, b, xmax, ymax, pts), q: 'The scatterplot shows a data set with a line of best fit. Which of the following is the equation of the line of best fit?', a, w: wr,
    e: `Read the line’s y-intercept: it crosses the y-axis at ${b}. Then find the slope from two points on the line: the line rises ${m} unit${m > 1 ? 's' : ''} for each 1 unit of x. So the equation is ${a}.` }); });

T('prob', 1, () => { const r = R.int(3, 10), bl = R.int(3, 10), g = R.int(2, 10), tot = r + bl + g;
  return mcQ({ d: 1, q: `A bag contains ${r} red marbles, ${bl} blue marbles, and ${g} green marbles. One marble is drawn at random. What is the probability that it is NOT blue?`, a: fr(r + g, tot), w: [fr(bl, tot), fr(r, tot), fr(g, tot), fr(r + g, tot + bl)],
    e: `There are ${tot} marbles in total, and ${r + g} are not blue. So the probability is ${r + g}/${tot}${gcd(r + g, tot) > 1 ? ' = ' + fr(r + g, tot) : ''}.` }); });
T('prob', 2, () => { const a = R.int(15, 40), b = R.int(15, 40), c = R.int(15, 40), d = R.int(15, 40), ct = a + c, rt = a + b, gt = a + b + c + d;
  const rows = ['Freshmen', 'Sophomores'], cols = ['Biology', 'Chemistry'], cell = [[a, b], [c, d]];
  const givenCol = R.chance(0.5), ci = R.int(0, 1), ri = R.int(0, 1);
  const colTot = [a + c, b + d], rowTot = [a + b, c + d], q = givenCol ? `If a student enrolled in ${cols[ci]} is selected at random, what is the probability that the student is a ${rows[ri].slice(0, -1).toLowerCase()}?` : `If a ${rows[ri].slice(0, -1).toLowerCase()} is selected at random, what is the probability that the student is enrolled in ${cols[ci]}?`;
  const num = cell[ri][ci], den = givenCol ? colTot[ci] : rowTot[ri], f = (n, dd) => `${n}/${dd}`;
  const alt = givenCol ? rowTot[ri] : colTot[ci];
  return mcQ({ d: 2, table: { head: ['', ...cols, 'Total'], rows: [[rows[0], a, b, a + b], [rows[1], c, d, c + d], ['Total', a + c, b + d, gt]] }, q: `The table shows the numbers of freshmen and sophomores enrolled in two science electives. ${q}`,
    a: f(num, den), w: [f(num, gt), f(num, alt), f(cell[1 - ri][ci], den), f(cell[ri][1 - ci], den)].filter(x => x !== f(num, den)),
    e: `This is a conditional probability, so the "given" group becomes the total. Here the group is ${givenCol ? 'the ' + cols[ci] + ' column' : 'the ' + rows[ri] + ' row'} with ${den} students, of whom ${num} fit the condition: ${num}/${den}.` }); });
T('prob', 2, () => { const a = R.pick([20, 30, 40, 50, 60, 70]), b = R.pick([20, 30, 40, 50, 60, 80]), v = a * b / 10000;
  return numQ({ d: 2, q: `Events A and B are independent. The probability of A is ${a / 100} and the probability of B is ${b / 100}. What is the probability that both A and B occur?`, v, wrong: [(a + b) / 100, a / 100 + b / 100 - v, Math.abs(a - b) / 100, v * 10],
    e: `For independent events, P(A and B) = P(A) × P(B) = ${a / 100} × ${b / 100} = ${N(v)}.` }); });
T('prob', 1, () => { const k = R.int(1, 4);
  return mcQ({ d: 1, q: `A fair six-sided number cube, with faces numbered 1 through 6, is rolled once. What is the probability that the number rolled is greater than ${k}?`, a: fr(6 - k, 6), w: [fr(k, 6), fr(7 - k, 6), fr(6 - k, 5), fr(1, 6)],
    e: `The numbers greater than ${k} are ${Array.from({ length: 6 - k }, (_, i) => k + 1 + i).join(', ')}: ${6 - k} outcomes out of 6, which is ${fr(6 - k, 6)}.` }); });

const POPS = [['registered voters in Marlow', 'support the new transit plan'], ['students at Northgate High School', 'prefer a later start time'], ['households in the Eastside neighborhood', 'recycle every week'], ['members of the Riverview Library', 'would use a weekend computer lab']];
T('infer', 2, () => { const [pop, act] = R.pick(POPS), n = R.pick([400, 600, 800, 1200]), p = R.int(30, 70), e = R.int(2, 5);
  return mcQ({ d: 2, q: `In a random sample of ${n} ${pop}, ${p}% said they ${act}. The margin of error for this estimate is ${e} percentage points. Which of the following is the most appropriate conclusion?`, a: `It is plausible that between ${p - e}% and ${p + e}% of all ${pop} ${act}.`,
    w: [`Exactly ${p}% of all ${pop} ${act}.`, `Between ${p - e}% and ${p + e}% of the ${n} people sampled ${act}.`, `More than ${p + e}% of all ${pop} definitely ${act}.`],
    e: `A margin of error describes a plausible range for the population value: ${p}% ± ${e}% = ${p - e}% to ${p + e}%. It applies to the whole population, not just the sample, and it does not guarantee certainty.` }); });
const SAMPLES = [['a randomly selected group of 150 sophomores at Lincoln High School', 'sophomores at Lincoln High School'], ['a random sample of 300 patrons of the Oak Street Cafe', 'patrons of the Oak Street Cafe'], ['a random sample of 80 customers who bought running shoes at one outlet store', 'customers who bought running shoes at that store'], ['a random sample of 500 residents of Greenfield County', 'residents of Greenfield County']];
T('infer', 2, () => { const [s, tgt] = R.pick(SAMPLES);
  return mcQ({ d: 2, q: `A researcher surveyed ${s} about their weekend activities. The results can most appropriately be generalized to which group?`, a: `All ${tgt}`, w: ['All teenagers in the United States', 'Only the people who answered the survey', 'All people in the world who are the same age'],
    e: `Results from a random sample generalize to the population the sample was drawn from — here, ${tgt} — and no larger group.` }); });
T('infer', 3, () => { const randomized = R.chance(0.5);
  return randomized ? mcQ({ d: 3, q: 'A researcher recruited 60 volunteers and randomly assigned half to use a new study method and half to use their usual method. The group using the new method scored significantly higher on a later test. Which conclusion is best supported?', a: 'The new study method caused the higher scores among volunteers like those in the study.', w: ['The new method will raise scores for all students everywhere.', 'The difference is not meaningful because only volunteers took part.', 'Higher scores caused students to choose the new method.'], e: 'Random assignment lets us conclude cause and effect, but because the participants were volunteers (not a random sample of all students), the conclusion applies only to similar volunteers.' })
    : mcQ({ d: 3, q: 'A survey found that students who eat breakfast daily have higher GPAs than students who do not. Students chose for themselves whether to eat breakfast. Which conclusion is best supported?', a: 'Eating breakfast is associated with higher GPAs, but the survey does not show that it causes higher GPAs.', w: ['Eating breakfast causes higher GPAs.', 'Higher GPAs cause students to eat breakfast.', 'There is no relationship between breakfast and GPA.'], e: 'This was an observational study with self-selected groups, so other factors (sleep, family routines, motivation) could explain the difference. Only an association can be claimed.' }); });

/* ===================== GEOMETRY & TRIGONOMETRY ===================== */
T('area', 1, () => { const L1 = R.int(3, 12), W = R.int(2, 9), H = R.int(2, 10), V = L1 * W * H;
  return numQ({ d: 1, q: `A rectangular prism has a volume of ${V} cubic centimeters. The base of the prism is a rectangle with length ${L1} cm and width ${W} cm. What is the height of the prism, in centimeters?`, v: H, wrong: [V / L1, V - L1 * W, L1 + W, H + 1],
    e: `Volume = length × width × height, so ${V} = ${L1}·${W}·h and h = ${V} ÷ ${L1 * W} = ${H}.` }); });
T('area', 1, () => { const r = R.int(2, 9), h = R.int(2, 12);
  return mcQ({ d: 1, q: `What is the volume of a right circular cylinder with a radius of ${r} and a height of ${h}?`, a: `${r * r * h}π`, w: [`${2 * r * h}π`, `${r * h}π`, `${r * r * h * 3}π`, `${r * r + h}π`],
    e: `V = πr²h = π(${r})²(${h}) = ${r * r * h}π.` }); });
T('area', 3, () => { const k = R.pick([2, 3, 4]), vol = R.chance(0.5), base = R.int(2, 9) * (vol ? 3 : 1), ans = base * (vol ? k ** 3 : k ** 2);
  return mcQ({ d: 3, q: vol ? `Two similar solids have corresponding lengths in the ratio 1 : ${k}. The smaller solid has a volume of ${base} cubic units. What is the volume of the larger solid?` : `Two similar figures have corresponding side lengths in the ratio 1 : ${k}. The smaller figure has an area of ${base} square units. What is the area of the larger figure?`,
    a: `${ans} ${vol ? 'cubic' : 'square'} units`, w: [`${base * k} ${vol ? 'cubic' : 'square'} units`, `${base * (vol ? k ** 2 : k ** 3)} ${vol ? 'cubic' : 'square'} units`, `${base + k} ${vol ? 'cubic' : 'square'} units`],
    e: `If lengths scale by ${k}, areas scale by ${k}² = ${k * k} and volumes by ${k}³ = ${k ** 3}. Here we need ${vol ? 'volume' : 'area'}: ${base} × ${vol ? k ** 3 : k ** 2} = ${ans}.` }); });
T('area', 2, () => { const b1 = R.int(4, 12), b2 = b1 + R.int(2, 8), h = 2 * R.int(2, 7), A = (b1 + b2) * h / 2;
  return numQ({ d: 2, q: `A trapezoid has parallel sides of length ${b1} and ${b2} and a height of ${h}. What is its area?`, v: A, wrong: [(b1 + b2) * h, b1 * b2 * h / 2, (b1 + b2 + h) / 2, A + h],
    e: `Area = ½(b₁ + b₂)h = ½(${b1} + ${b2})(${h}) = ${A}.` }); });
T('area', 2, () => { const k = R.int(2, 9);
  return mcQ({ d: 2, q: `A square has a diagonal of length ${k}@r(2). What is the area of the square?`, a: String(k * k), w: [String(2 * k * k), String(k), String(k * k * 4), `${k}@r(2)`],
    e: `A square’s diagonal is s@r(2), so s = ${k}. The area is s² = ${k * k}.` }); });
T('area', 2, () => { const r = 3 * R.int(1, 3);
  return mcQ({ d: 2, q: `What is the volume of a sphere with a radius of ${r}? (The volume of a sphere is V = @f(4|3)πr^3.)`, a: `${4 * r ** 3 / 3}π`, w: [`${4 * r * r}π`, `${r ** 3}π`, `${4 * r ** 3}π`, `${2 * r ** 3 / 3 * 1}π`],
    e: `V = (4/3)π(${r})³ = (4/3)π(${r ** 3}) = ${4 * r ** 3 / 3}π.` }); });

T('lines', 1, () => { const a = R.int(30, 80), b = R.int(30, 90);
  return numQ({ d: 1, q: `In triangle ABC, the measure of angle A is ${a}° and the measure of angle B is ${b}°. What is the measure, in degrees, of angle C?`, v: 180 - a - b, wrong: [a + b, 90 - a, 360 - a - b],
    e: `The angles of a triangle sum to 180°: 180 ${M} ${a} ${M} ${b} = ${180 - a - b}.` }); });
T('lines', 1, () => { const v = R.pick([20, 30, 40, 50, 80, 100, 120]), base = (180 - v) / 2;
  return numQ({ d: 1, q: `Triangle PQR is isosceles with PQ = PR. The measure of angle P is ${v}°. What is the measure, in degrees, of angle Q?`, v: base, wrong: [v, 180 - v, 90 - v, base + 10],
    e: `Angles Q and R are equal. So 2Q = 180 ${M} ${v} = ${180 - v}, giving Q = ${base}°.` }); });
T('lines', 2, () => { const x = R.int(15, 40), a = R.int(2, 4), b = R.int(10, 30), c = a + 1, dd = c * x - (a * x + b);
  return numQ({ d: 2, q: `Lines l and m are parallel and are cut by a transversal. Two alternate interior angles measure (${a}x + ${b})° and (${c}x ${dd < 0 ? '+' : M} ${Math.abs(dd)})°. What is the measure, in degrees, of one of these angles?`, v: a * x + b, wrong: [x, 180 - (a * x + b), c * x, a * x],
    e: `Alternate interior angles are equal: ${a}x + ${b} = ${c}x ${dd < 0 ? '+' : M} ${Math.abs(dd)}, so x = ${x}. The angle is ${a}(${x}) + ${b} = ${a * x + b}°.` }, 0.5); });
T('lines', 2, () => { const k = R.int(2, 4), a = R.int(3, 8), b = R.int(4, 9), c = R.int(5, 10);
  return numQ({ d: 2, q: `Triangle ABC is similar to triangle DEF, with AB corresponding to DE, BC to EF, and AC to DF. AB = ${a}, BC = ${b}, and DE = ${a * k}. What is the length of EF?`, v: b * k, wrong: [b + k, b + (a * k - a), a * k, b / k].filter(x => x > 0),
    e: `The scale factor from ABC to DEF is DE/AB = ${a * k}/${a} = ${k}. So EF = ${k} × BC = ${k} × ${b} = ${b * k}.` }); });
T('lines', 1, () => { const [a, b, c] = R.pick([[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25]]), k = R.int(1, 3), findHyp = R.chance(0.5);
  return numQ({ d: 1, q: findHyp ? `A right triangle has legs of length ${a * k} and ${b * k}. What is the length of its hypotenuse?` : `A right triangle has a hypotenuse of length ${c * k} and one leg of length ${a * k}. What is the length of the other leg?`, v: findHyp ? c * k : b * k, wrong: findHyp ? [a * k + b * k, c * k + 1, c * k - 1, (a + b) * k / 2] : [c * k - a * k, b * k + 1, b * k - 1, Math.round(Math.sqrt(c * c * k * k + a * a * k * k))],
    e: findHyp ? `Pythagorean theorem: ${a * k}² + ${b * k}² = ${(a * a + b * b) * k * k} = ${c * k}², so the hypotenuse is ${c * k}.` : `Pythagorean theorem: other leg² = ${c * k}² ${M} ${a * k}² = ${(c * c - a * a) * k * k}, so the other leg is ${b * k}.` }); });
T('lines', 2, () => { const a = R.int(30, 80), b = R.int(30, 70);
  return numQ({ d: 2, q: `In triangle ABC, angle A measures ${a}° and angle B measures ${b}°. Side BC is extended past C to point D. What is the measure, in degrees, of angle ACD?`, v: a + b, wrong: [180 - a - b, 180 - a, 180 - b, 360 - a - b],
    e: `An exterior angle equals the sum of the two remote interior angles: ${a}° + ${b}° = ${a + b}°.` }, 0.5); });

T('trig', 2, () => { const [a, b, c] = R.pick([[3, 4, 5], [5, 12, 13], [8, 15, 17]]), k = R.int(1, 4), fn = R.pick(['sin', 'cos', 'tan']), at = R.pick(['A', 'B']);
  const opp = at === 'A' ? b : a, adj = at === 'A' ? a : b, [n, d] = fn === 'sin' ? [opp, c] : fn === 'cos' ? [adj, c] : [opp, adj];
  const sA = at === 'A' ? `AC = ${a * k}, BC = ${b * k}` : `AC = ${a * k}, BC = ${b * k}`;
  return mcQ({ d: 2, fig: svgTri(['C', 'A', 'B'], [`${a * k}`, `${b * k}`, `${c * k}`]), q: `In right triangle ABC, the right angle is at C, AC = ${a * k}, BC = ${b * k}, and AB = ${c * k}. What is the value of ${fn}(${at})?`.replace(/AC = (\d+), BC = (\d+)/, 'AC = $1, BC = $2'),
    a: fr(n, d), w: [fr(d, n), fr(opp + adj, c), fr(adj === n ? opp : adj, d), fr(c, d)].filter(x => x !== fr(n, d)),
    e: `With the right angle at C, the leg opposite angle A is BC = ${b * k} and the leg adjacent to A is AC = ${a * k}; for angle B they swap. ${fn} = ${fn === 'sin' ? 'opposite/hypotenuse' : fn === 'cos' ? 'adjacent/hypotenuse' : 'opposite/adjacent'} = ${fr(n, d)}.` }); });
T('trig', 1, () => { const x = R.int(10, 80);
  return numQ({ d: 1, q: `In a right triangle, the sine of one acute angle is equal to the cosine of the other. If sin(${x}°) = cos(y°), where 0 < y < 90, what is the value of y?`, v: 90 - x, wrong: [x, 180 - x, 90 + x, 45],
    e: `sin(x°) = cos(90° ${M} x°), so y = 90 ${M} ${x} = ${90 - x}.` }); });
T('trig', 2, () => { const k = R.int(2, 9);
  return mcQ({ d: 2, q: `A right triangle has two angles each measuring 45°. If each leg has length ${k}, what is the length of the hypotenuse?`, a: `${k}@r(2)`, w: [`${k}@r(3)`, `${2 * k}`, `${k}`, `${k * k}`],
    e: `A 45°-45°-90° triangle has sides in the ratio 1 : 1 : @r(2). With legs of ${k}, the hypotenuse is ${k}@r(2).` }); });
T('trig', 2, () => { const s = R.int(2, 9);
  return mcQ({ d: 2, q: `A right triangle has angles of 30°, 60°, and 90°. The shorter leg has length ${s}. What is the length of the longer leg?`, a: `${s}@r(3)`, w: [`${s}@r(2)`, `${2 * s}`, `${s}`, `${3 * s}`],
    e: `A 30°-60°-90° triangle has sides in the ratio 1 : @r(3) : 2. The shorter leg is ${s}, so the longer leg is ${s}@r(3) (and the hypotenuse is ${2 * s}).` }); });
T('trig', 3, () => { const [a, b, c] = R.pick([[5, 12, 13], [8, 15, 17], [3, 4, 5], [7, 24, 25]]), k = R.int(2, 5);
  return numQ({ d: 3, q: `In right triangle ABC, the right angle is at C and cos(A) = ${a}/${c}. If AB = ${c * k}, what is the length of AC?`, v: a * k, wrong: [b * k, c * k - a * k, a + k, c * k / a],
    e: `cos(A) = adjacent/hypotenuse = AC/AB. So AC = AB × cos(A) = ${c * k} × ${a}/${c} = ${a * k}.` }); });

T('circ', 1, () => { const h = R.int(1, 9), k = R.int(1, 9), r = R.int(3, 9), askD = R.chance(0.5);
  return numQ({ d: 1, q: `In the xy-plane, the equation of a circle is (x ${M} ${h})² + (y + ${k})² = ${r * r}. What is the ${askD ? 'diameter' : 'radius'} of the circle?`, v: askD ? 2 * r : r, wrong: askD ? [r, r * r, r / 2, 2 * r * r] : [r * r, 2 * r, r / 2, h + k],
    e: `In (x ${M} h)² + (y ${M} k)² = r², r² = ${r * r}, so r = ${r}${askD ? ` and the diameter is 2r = ${2 * r}` : ''}.` }); });
T('circ', 3, () => { const p = R.int(1, 6) * (R.chance(0.5) ? 1 : -1), q = R.int(1, 6) * (R.chance(0.5) ? 1 : -1), r = R.int(3, 9), c = p * p + q * q - r * r;
  const rhs = c; const fmtc = rhs < 0 ? ` ${M} ${-rhs}` : ` + ${rhs}`;
  return numQ({ d: 3, q: `The equation x^2 + y^2 ${2 * p < 0 ? M : '+'} ${Math.abs(2 * p)}x ${2 * q < 0 ? M : '+'} ${Math.abs(2 * q)}y${fmtc} = 0 defines a circle in the xy-plane. What is the radius of the circle?`, v: r, wrong: [r * r, Math.abs(c), Math.sqrt(Math.abs(c)), r + 1],
    e: `Complete the square: (x ${p < 0 ? M : '+'} ${Math.abs(p)})² + (y ${q < 0 ? M : '+'} ${Math.abs(q)})² = ${p * p} + ${q * q} ${c < 0 ? '+' : M} ${Math.abs(c)} = ${r * r}. So r² = ${r * r} and r = ${r}.` }); });
T('circ', 2, () => { const r = R.int(2, 12), deg = R.pick([30, 45, 60, 90, 120, 135, 150, 180, 270]);
  const coef = deg * r / 180;
  return mcQ({ d: 2, q: `A circle has a radius of ${r}. What is the length of an arc of this circle that is intercepted by a central angle of ${deg}°?`, a: `${FR(deg * r, 180)}π`, w: [`${FR(deg * r * r, 360)}π`, `${FR(deg * r, 360)}π`, `${FR(deg * 2 * r * r, 180)}π`, `${deg}π`],
    e: `Arc length = (${deg}/360)(2πr) = (${deg}/360)(2π·${r}) = ${FR(deg * r, 180)}π.` }); });
T('circ', 2, () => { const arc = 2 * R.int(15, 80), inscribed = R.chance(0.5);
  return numQ({ d: 2, q: inscribed ? `In a circle, an inscribed angle intercepts an arc measuring ${arc}°. What is the measure, in degrees, of the inscribed angle?` : `In a circle, an inscribed angle measures ${arc / 2}°. What is the measure, in degrees, of the arc it intercepts?`, v: inscribed ? arc / 2 : arc, wrong: inscribed ? [arc, arc * 2, 180 - arc / 2] : [arc / 2, arc / 4, 180 - arc],
    e: `An inscribed angle is half the measure of its intercepted arc. ${inscribed ? `${arc}° ÷ 2 = ${arc / 2}°` : `2 × ${arc / 2}° = ${arc}°`}.` }); });
T('circ', 2, () => { const r = R.int(3, 10), deg = R.pick([30, 45, 60, 90, 120, 180]);
  return mcQ({ d: 2, q: `A sector of a circle with radius ${r} has a central angle of ${deg}°. What is the area of the sector?`, a: `${FR(deg * r * r, 360)}π`, w: [`${FR(deg * r, 180)}π`, `${FR(deg * r * r, 180)}π`, `${r * r}π`, `${FR(deg * r * r, 720)}π`],
    e: `Sector area = (${deg}/360)πr² = (${deg}/360)π(${r * r}) = ${FR(deg * r * r, 360)}π.` }); });
T('circ', 1, () => { const h = R.nz(-8, 8), k = R.nz(-8, 8), r = R.int(2, 9), c = (a, v) => `(${a} ${v < 0 ? '+' : M} ${Math.abs(v)})`;
  return mcQ({ d: 1, q: `A circle in the xy-plane has the equation ${c('x', h)}² + ${c('y', k)}² = ${r * r}. What are the coordinates of the center of the circle?`, a: `(${S(h)}, ${S(k)})`, w: [`(${S(-h)}, ${S(-k)})`, `(${S(h)}, ${S(-k)})`, `(${S(-h)}, ${S(k)})`].filter(x => x !== `(${S(h)}, ${S(k)})`),
    e: `In (x ${M} h)² + (y ${M} k)² = r² the center is (h, k). The signs in the parentheses are opposite to the center’s coordinates, so the center is (${S(h)}, ${S(k)}).` }); });

/* ---------- public API ---------- */
let SEQ = 0;
window.Gen = {
  has: skill => !!G[skill],
  skills: () => Object.keys(G),
  count: skill => (G[skill] || []).length,
  /** make(skill, diff?) -> question object in internal row format */
  make(skill, diff) {
    const list = G[skill]; if (!list) return null;
    let pool = diff ? list.filter(t => t.d === diff) : list;
    if (!pool.length) pool = list.filter(t => Math.abs(t.d - diff) <= 1);
    if (!pool.length) pool = list;
    const t = R.pick(pool), o = t.f();
    return Object.assign({ id: `g:${skill}:${list.indexOf(t)}:${Date.now().toString(36)}${(SEQ++).toString(36)}`, s: skill, gen: true }, o);
  }
};
}());
