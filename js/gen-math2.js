/* More procedural math templates, mostly for skills that had only a few hundred variations.
   Every answer is computed from the generated numbers, and tests/gen-check.js plus tests/gen-verify.js check them. */
(function () {
'use strict';
const T = Gen.add, { R, S, M, N, fr, FR, L, P2, co, sg, gcd, numQ, mcQ } = Gen.h;
const piF = (n, d) => { const g = gcd(n, d) || 1; n /= g; d /= g; const top = n === 1 ? 'π' : `${n}π`; return d === 1 ? top : `@f(${top}|${d})`; };
const simp = n => { let k = 1; for (let i = 2; i * i <= n; i++) while (n % (i * i) === 0) { n /= i * i; k *= i; } return [k, n]; };   // n = k^2 * r
const rad = n => { const [k, r] = simp(n); return r === 1 ? String(k) : `${k === 1 ? '' : k}@r(${r})`; };
const until = (make, ok) => { let v; for (let i = 0; i < 500; i++) { v = make(); if (ok(v)) return v; } return v; };
const TRIPLES = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29], [9, 40, 41]];

/* ===================== TRIGONOMETRY ===================== */
T('trig', 2, () => { const [a, b, c] = R.pick(TRIPLES), flip = R.chance(0.5), opp = flip ? a : b, adj = flip ? b : a;
  return mcQ({ d: 2, q: `In right triangle ABC, angle C is the right angle and sin(A) = @f(${opp}|${c}). What is the value of tan(A)?`, a: FR(opp, adj), w: [FR(adj, opp), FR(adj, c), FR(c, adj), FR(c, opp)],
    e: `sin(A) = opposite/hypotenuse = ${opp}/${c}, so the side opposite A is ${opp}k and the hypotenuse is ${c}k. The adjacent leg is @r(${c}^2 ${M} ${opp}^2)k = ${adj}k. tan(A) = opposite/adjacent = ${opp}/${adj}.` }); });
T('trig', 1, () => { const D = R.pick([30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330, 360]);
  return mcQ({ d: 1, q: `An angle measures ${D}°. What is the measure of the angle in radians?`, a: piF(D, 180), w: [piF(D, 360), piF(D, 90), piF(180, D), piF(2 * D, 45)],
    e: `Multiply degrees by π/180: ${D} × π/180 = ${piF(D, 180).replace(/@f\((.*)\|(.*)\)/, '$1/$2')}.` }); });
T('trig', 3, () => { const [n, d] = R.pick([[1, 6], [1, 4], [1, 3], [1, 2], [2, 3], [3, 4], [5, 6], [7, 6], [5, 4], [4, 3], [3, 2], [5, 3], [7, 4], [11, 6]]), deg = 180 * n / d;
  return numQ({ d: 3, q: `An angle measures ${piF(n, d)} radians. What is the measure of the angle in degrees?`, v: deg, wrong: [deg / 2, deg * 2, 360 - deg, 90 * n / d],
    e: `Multiply radians by 180/π: (${n === 1 ? '' : n}π/${d}) × 180/π = ${180 * n}/${d} = ${deg}°.` }); });
T('trig', 2, () => { const [a, b, c] = R.pick(TRIPLES.slice(0, 4)), k = R.int(2, 6), what = R.pick([['A wheelchair ramp rises', 'over a horizontal distance of', 'the ramp', 'inches'], ['A kite string is staked to the ground. The kite flies directly above a point', 'from the stake at a height of', 'the string', 'feet']]);
  const rise = a * k, run = b * k, len = c * k;
  const q = what[2] === 'the ramp' ? `A wheelchair ramp rises ${rise} inches over a horizontal distance of ${run} inches. What is the length, in inches, of the ramp?` : `A kite flies ${rise} feet above the ground, directly above a point that is ${run} feet from where its string is staked. If the string is straight, how long is it, in feet?`;
  return numQ({ d: 2, q, v: len, wrong: [rise + run, run - rise, Math.round(Math.sqrt(run * run - rise * rise)), len + k],
    e: `The ${what[3] === 'inches' ? 'rise and run' : 'height and ground distance'} are the legs of a right triangle and ${what[2]} is the hypotenuse: @r(${rise}^2 + ${run}^2) = @r(${rise * rise + run * run}) = ${len}.` }); });
T('trig', 3, () => { const [a, b, c] = R.pick(TRIPLES), p = R.chance(0.5) ? a : b, q2 = p === a ? b : a;
  return mcQ({ d: 3, q: `In triangle RST, angle T measures 90° and sin(R) = @f(${p}|${c}). What is the value of cos(S)?`, a: FR(p, c), w: [FR(q2, c), FR(p, q2), FR(q2, p), FR(c, p)],
    e: `R and S are complementary (they add to 90°), and the sine of an angle equals the cosine of its complement. So cos(S) = sin(R) = ${p}/${c}.` }); });
T('trig', 2, () => { const s = R.int(2, 12), given = R.pick(['hyp', 'long']);
  if (given === 'hyp') return numQ({ d: 2, q: `In a 30°-60°-90° triangle, the hypotenuse has length ${2 * s}. What is the length of the side opposite the 30° angle?`, v: s, wrong: [2 * s, s + 1, s * 3, 4 * s],
    e: `The sides are in the ratio 1 : @r(3) : 2. The side opposite 30° is half the hypotenuse: ${2 * s} ÷ 2 = ${s}.` });
  return mcQ({ d: 2, q: `In a 30°-60°-90° triangle, the side opposite the 60° angle has length ${s}@r(3). What is the length of the hypotenuse?`, a: String(2 * s), w: [`${2 * s}@r(3)`, String(s), `${s}@r(2)`, String(3 * s)],
    e: `The sides are in the ratio 1 : @r(3) : 2. The longer leg is ${s}@r(3), so the short leg is ${s} and the hypotenuse is 2 × ${s} = ${2 * s}.` }); });
T('trig', 3, () => { let a, b; do { a = R.int(1, 9); b = R.int(1, 9); } while (Number.isInteger(Math.sqrt(a * a + b * b)) || a === b);
  const h = a * a + b * b;
  return mcQ({ d: 3, q: `A right triangle has legs of length ${a} and ${b}. What is the length of the hypotenuse?`, a: rad(h), w: [String(a + b), `@r(${a + b})`, rad(Math.abs(a * a - b * b) || 2), String(h)],
    e: `By the Pythagorean theorem, c^2 = ${a}^2 + ${b}^2 = ${a * a} + ${b * b} = ${h}, so c = @r(${h})${rad(h) !== `@r(${h})` ? ` = ${rad(h)}` : ''}.` }); });

T('trig', 1, () => { const [m, n] = until(() => [R.int(2, 30), R.int(2, 30)], ([m, n]) => m !== n && !Number.isInteger(Math.sqrt(m * m + n * n))), fn = R.pick(['tan', 'sin', 'cos']), h2 = m * m + n * n;
  if (fn === 'tan') return mcQ({ d: 1, q: `In right triangle ABC, angle C is the right angle, AC = ${m}, and BC = ${n}. What is the value of tan(A)?`, a: FR(n, m), w: [FR(m, n), FR(n, m + n), FR(m, m + n), FR(n + 1, m)],
    e: `For angle A, the opposite leg is BC = ${n} and the adjacent leg is AC = ${m}. tan(A) = opposite/adjacent = ${fr(n, m)}.` });
  const hyp = rad(h2).replace(/@r\((\d+)\)/, '√$1'), pick = fn === 'sin' ? n : m;
  return mcQ({ d: 2, q: `In right triangle ABC, angle C is the right angle, AC = ${m}, and BC = ${n}. What is the value of ${fn}(B)?`, a: `@f(${fn === 'sin' ? m : n}|${hyp})`, w: [`@f(${fn === 'sin' ? n : m}|${hyp})`, FR(m, n), FR(n, m), `@f(${hyp}|${fn === 'sin' ? m : n})`],
    e: `The hypotenuse is AB = @r(${m}^2 + ${n}^2) = ${hyp === `√${h2}` ? hyp : `√${h2} = ${hyp}`}. For angle B, the opposite leg is AC = ${m} and the adjacent leg is BC = ${n}, so ${fn}(B) = ${fn === 'sin' ? m : n}/${hyp}.` }); });

/* ===================== PERCENTAGES ===================== */
T('pct', 1, () => { const [p, n] = until(() => [R.pick([5, 10, 12, 15, 20, 25, 30, 35, 40, 45, 60, 75, 80]), 20 * R.int(2, 30)], ([p, n]) => Number.isInteger(n * p / 100)), v = n * p / 100;
  return numQ({ d: 1, q: `${v} is ${p}% of what number?`, v: n, wrong: [v * p / 100, v + p, v * (1 + p / 100), n / 2],
    e: `${p}% of n is ${v}, so ${p / 100}n = ${v} and n = ${v} ÷ ${p / 100} = ${n}.` }); });
T('pct', 1, () => { const [n, p] = until(() => [R.pick([40, 50, 80, 120, 150, 200, 250, 300, 400, 500, 600, 800]), R.pick([2, 4, 5, 10, 15, 20, 25, 30, 40, 45, 60, 70, 80, 90])], ([n, p]) => Number.isInteger(n * p / 100)), v = n * p / 100;
  const ctx = R.pick([['A survey asked', 'people', 'said they read the news daily'], ['A school has', 'students', 'take a foreign language'], ['A farm has', 'trees', 'are apple trees'], ['A club has', 'members', 'voted for the new logo']]);
  return numQ({ d: 1, q: `${ctx[0]} ${n} ${ctx[1]}, and ${v} of them ${ctx[2]}. What percent of the ${ctx[1]} ${ctx[2]}?`, v: p, wrong: [100 - p, v, Math.round(n / v), p + 10],
    e: `Percent = part ÷ whole × 100 = ${v} ÷ ${n} × 100 = ${p}%.` }); });
T('pct', 2, () => { const [p, q, n] = until(() => [R.pick([10, 20, 25, 40, 50, 60, 75, 80]), R.pick([10, 20, 25, 40, 50]), R.pick([200, 400, 800, 1000, 1200, 1600, 2000])], ([p, q, n]) => Number.isInteger(n * p * q / 10000)), v = n * p * q / 10000;
  return numQ({ d: 2, q: `What is ${p}% of ${q}% of ${n}?`, v, wrong: [n * (p + q) / 100, n * p / 100, n * q / 100, v * 10],
    e: `${q}% of ${n} is ${n * q / 100}. Then ${p}% of ${n * q / 100} is ${v}. (Equivalently, ${p / 100} × ${q / 100} × ${n} = ${v}.)` }); });
T('pct', 2, () => { const P = R.pick([200, 500, 800, 1200, 1500, 2400, 5000]), r = R.pick([2, 3, 4, 5, 6, 8, 12, 15]), up = R.chance(0.6), what = up ? R.pick(['population of a town', 'value of an investment', 'number of members in a club']) : R.pick(['value of a car', 'population of a fish species in a lake', 'amount of a medicine in the bloodstream']);
  const f = up ? (1 + r / 100) : (1 - r / 100), fs = N(f), other = up ? N(1 - r / 100) : N(1 + r / 100);
  return mcQ({ d: 2, q: `The ${what} is ${P} and ${up ? 'increases' : 'decreases'} by ${r}% each year. Which expression gives the ${what} after t years?`, a: `${P}(${fs})^t`, w: [`${P}(${other})^t`, `${P}(${r})^t`, `${P}(${N(r / 100)})^t`, `${P} ${up ? '+' : M} ${r}t`],
    e: `Each year the amount is multiplied by 1 ${up ? '+' : M} ${r / 100} = ${fs}. After t years that happens t times: ${P}(${fs})^t.` }); });
T('pct', 2, () => { const C = 20 * R.int(1, 9), t = R.pick([5, 10]), g = R.pick([15, 20]), tot = C * (100 + t + g) / 100;
  return numQ({ d: 2, q: `A dinner bill is $${C} before tax and tip. A ${t}% sales tax and a ${g}% tip are each calculated on the $${C} amount. What is the total cost, in dollars?`, v: tot, wrong: [C + t + g, C * (1 + t / 100) * (1 + g / 100), C * (100 + g) / 100, C * (100 + t) / 100].map(x => Math.round(x * 100) / 100),
    e: `Tax: ${t}% of ${C} = ${C * t / 100}. Tip: ${g}% of ${C} = ${C * g / 100}. Total = ${C} + ${C * t / 100} + ${C * g / 100} = ${tot}.` }); });
T('pct', 3, () => { const p = R.pick([10, 20, 30, 40, 50]), v = 100 - p * p / 100;
  return numQ({ d: 3, q: `The number of visitors to a park increased by ${p}% from 2022 to 2023, then decreased by ${p}% from 2023 to 2024. The number of visitors in 2024 was what percent of the number in 2022?`, v, wrong: [100, 100 - p, 100 + p, 100 + p * p / 100],
    e: `Multiply the two changes: (1 + ${p / 100})(1 ${M} ${p / 100}) = ${N((1 + p / 100) * (1 - p / 100))}. So 2024 was ${v}% of 2022. Equal percent increases and decreases do not cancel, because the decrease applies to a larger amount.` }); });
T('pct', 3, () => { const p = R.pick([20, 25, 40, 50, 60, 75]), base = R.pick([40, 80, 120, 160, 200]), bigger = base * (1 + p / 100);
  return numQ({ d: 3, q: `The value of b is ${p}% greater than the value of a, and b = ${bigger}. What is the value of a?`, v: base, wrong: [bigger * (1 - p / 100), bigger - p, bigger / (p / 100), bigger * p / 100],
    e: `"${p}% greater" means b = ${N(1 + p / 100)}a. So a = ${bigger} ÷ ${N(1 + p / 100)} = ${base}. Subtracting ${p}% of b would use the wrong base.` }); });

/* ===================== RATIOS, RATES, UNITS ===================== */
T('ratio', 1, () => { const a = R.int(2, 6), b = R.pick([8, 10, 12, 16, 20, 24]), m = R.int(2, 6), c = b * m, ans = a * m;
  const ctx = R.pick([['A recipe uses', 'cups of flour', 'to make', 'muffins'], ['A painter uses', 'liters of paint', 'to cover', 'square meters of wall'], ['A park worker uses', 'scoops of seed', 'to fill', 'bird feeders'], ['A gardener uses', 'bags of soil', 'to fill', 'planters']]);
  return numQ({ d: 1, q: `${ctx[0]} ${a} ${ctx[1]} ${ctx[2]} ${b} ${ctx[3]}. At this rate, how many ${ctx[1]} are needed ${ctx[2]} ${c} ${ctx[3]}?`, v: ans, wrong: [c / a, a + m, ans + a, b * a / m],
    e: `${c} is ${m} times ${b}, so multiply ${a} by ${m}: ${a} × ${m} = ${ans}.` }); });
T('ratio', 2, () => { let v, m, d, t = 0; do { v = R.pick([24, 30, 36, 40, 45, 48, 54, 60, 72]); m = R.pick([10, 15, 20, 25, 35, 40, 45, 50]); d = v * m / 60; } while (!Number.isInteger(d) && t++ < 50);
  if (!Number.isInteger(d)) { v = 60; m = 20; d = 20; }
  return numQ({ d: 2, q: `A bus travels at a constant speed of ${v} miles per hour. How many miles does it travel in ${m} minutes?`, v: d, wrong: [v * m, v / m, v * 60 / m, d * 2],
    e: `${m} minutes is ${m}/60 of an hour. Distance = ${v} × ${m}/60 = ${d} miles.` }); });
T('ratio', 2, () => { const [a, b] = until(() => [R.int(1, 7), R.int(1, 7)], ([a, b]) => a !== b && gcd(a, b) === 1);
  const k = R.int(3, 15), Tt = k * (a + b), askB = R.chance(0.5), items = R.pick([['red', 'blue', 'marbles in a bag', 'marbles'], ['fiction', 'nonfiction', 'books on a shelf', 'books'], ['adult', 'student', 'tickets sold', 'tickets'], ['oak', 'maple', 'trees in a park', 'trees']]);
  const ans = askB ? k * b : k * a;
  return numQ({ d: 2, q: `The ratio of ${items[0]} to ${items[1]} ${items[2]} is ${a} to ${b}. If there are ${Tt} ${items[3]} in total, how many are ${askB ? items[1] : items[0]} ${items[3]}?`, v: ans, wrong: [askB ? k * a : k * b, Tt / (askB ? b : a), Tt - ans + 1, k],
    e: `The ratio has ${a} + ${b} = ${a + b} parts, so each part is ${Tt} ÷ ${a + b} = ${k}. ${askB ? items[1] : items[0]}: ${askB ? b : a} × ${k} = ${ans}.` }); });
T('ratio', 3, () => { const [s, km, dcm] = until(() => [R.pick([1, 2, 4, 5]), R.pick([5, 10, 20, 25, 50]), R.int(4, 30) / 2], ([s, km, dcm]) => Number.isInteger(dcm * km / s) && dcm !== s), ans = dcm * km / s;
  return numQ({ d: 3, q: `On a map, ${s} centimeter${s === 1 ? '' : 's'} represent${s === 1 ? 's' : ''} ${km} kilometers. Two towns are ${N(dcm)} centimeters apart on the map. What is the actual distance between the towns, in kilometers?`, v: ans, wrong: [dcm * km, dcm * s / km, dcm + km, ans / 2],
    e: `Set up a proportion: ${s}/${km} = ${N(dcm)}/d, so d = ${N(dcm)} × ${km} ÷ ${s} = ${ans} kilometers.` }); });
T('ratio', 3, () => { const Lf = 3 * R.int(3, 8), Wf = 3 * R.int(2, 6), ans = Lf * Wf / 9;
  return numQ({ d: 3, q: `A rectangular floor measures ${Lf} feet by ${Wf} feet. What is the area of the floor in square yards? (1 yard = 3 feet)`, v: ans, wrong: [Lf * Wf / 3, Lf * Wf, (Lf + Wf) / 3, Lf * Wf / 6],
    e: `Convert each side first: ${Lf} ft = ${Lf / 3} yd and ${Wf} ft = ${Wf / 3} yd. Area = ${Lf / 3} × ${Wf / 3} = ${ans} square yards. (A square yard is 3 × 3 = 9 square feet, so dividing ${Lf * Wf} by 9 gives the same answer.)` }); });
T('ratio', 2, () => { const ppm = R.pick([12, 15, 20, 25, 30, 40]), h = R.pick([2, 3, 4, 5, 6]), N2 = ppm * 60 * h;
  return numQ({ d: 2, q: `A printer prints ${ppm} pages per minute. At this rate, how many hours will it take to print ${N2.toLocaleString('en-US')} pages?`, v: h, wrong: [N2 / ppm, h * 60, N2 / (ppm * 100), h + 1],
    e: `${ppm} pages per minute is ${ppm} × 60 = ${ppm * 60} pages per hour. ${N2} ÷ ${ppm * 60} = ${h} hours.` }); });

/* ===================== NONLINEAR EQUATIONS ===================== */
T('nl', 1, () => { const k = R.int(2, 15);
  return numQ({ d: 1, q: `What is the positive solution to x^2 ${M} ${k * k} = 0?`, v: k, wrong: [k * k, k * k / 2, 2 * k, k + 1],
    e: `x^2 = ${k * k}, so x = ±${k}. The positive solution is ${k}.` }); });
T('nl', 2, () => { const h = R.int(-6, 9), k = R.int(2, 8), ask = R.pick(['sum', 'greater']);
  const v = ask === 'sum' ? 2 * h : h + k;
  return numQ({ d: 2, q: `(x ${h < 0 ? '+' : M} ${Math.abs(h)})^2 = ${k * k}. What is the ${ask === 'sum' ? 'sum of the solutions' : 'greater solution'} to the equation?`.replace(/\(x [+−] 0\)/, 'x'), v, wrong: ask === 'sum' ? [2 * k, h, -2 * h, h + k] : [h - k, k, h + k * k, -h + k],
    e: `Take square roots: x ${h < 0 ? '+' : M} ${Math.abs(h)} = ±${k}, so x = ${h + k} or x = ${h - k}. ${ask === 'sum' ? `Their sum is ${2 * h}.` : `The greater one is ${h + k}.`}` }); });
T('nl', 3, () => { const a = R.int(1, 4) * (R.chance(0.3) ? -1 : 1), b = R.nz(-10, 10), c = R.int(-12, 12), D = b * b - 4 * a * c;
  const ans = D > 0 ? 'Exactly two real solutions' : D === 0 ? 'Exactly one real solution' : 'No real solutions';
  return mcQ({ d: 3, q: `How many real solutions does the equation ${P2(a, b, c)} = 0 have?`, a: ans, w: ['Exactly two real solutions', 'Exactly one real solution', 'No real solutions', 'Infinitely many real solutions'].filter(x => x !== ans),
    e: `Use the discriminant b^2 ${M} 4ac = (${S(b)})^2 ${M} 4(${S(a)})(${S(c)}) = ${S(D)}. ${D > 0 ? 'Positive means two real solutions.' : D === 0 ? 'Zero means exactly one real solution.' : 'Negative means no real solutions.'}` }); });
T('nl', 3, () => { const r1 = R.int(1, 7), r2 = -R.int(0, 6), m = R.nz(-4, 4), n = R.int(-8, 8), b = m - (r1 + r2), c = n + r1 * r2;
  return numQ({ d: 3, q: `y = ${P2(1, b, c)}\ny = ${L(m, n)}\nIf (x, y) is a solution to the system of equations above and x > 0, what is the value of x?`, v: r1, wrong: [r2, -r1, r1 + 1, m],
    e: `Set the expressions equal: ${P2(1, b, c)} = ${L(m, n)}, so ${P2(1, b - m, c - n)} = 0. This factors as (x ${M} ${r1})(x ${r2 < 0 ? '+' : M} ${Math.abs(r2)}) = 0, giving x = ${r1} or x = ${r2}. The positive one is ${r1}.`.replace(/\(x \+ 0\)|\(x − 0\)/, 'x') }, 0.5); });
T('nl', 3, () => { const [s, bb] = until(() => [R.int(2, 5), R.int(0, 5)], ([s, bb]) => s * s - (bb + s) !== 0), x0 = bb + s, a = s * s - x0;
  const x1 = 2 * bb + 1 - x0;
  return mcQ({ d: 3, q: `What is the solution to the equation @r(x ${a < 0 ? M : '+'} ${Math.abs(a)}) = x${bb ? ` ${M} ${bb}` : ''}?`, a: x1 !== x0 ? `${x0} only` : String(x0), w: [`${S(x1)} only`, `${x0} and ${S(x1)}`, 'There is no solution.'],
    e: `Square both sides: x ${a < 0 ? M : '+'} ${Math.abs(a)} = (x${bb ? ` ${M} ${bb}` : ''})^2, which gives x = ${x0} or x = ${S(x1)}. Check both: at x = ${S(x1)}, the right side is ${S(x1 - bb)}, but a square root cannot be negative, so ${S(x1)} is extraneous. Only x = ${x0} works.` }); });

/* ===================== EQUIVALENT EXPRESSIONS ===================== */
T('equiv', 2, () => { const a = R.int(1, 5), b = R.nz(-9, 9), c = R.int(1, 5), d = R.nz(-9, 9);
  return mcQ({ d: 2, q: `Which expression is equivalent to (${L(a, b)})(${L(c, d)})?`, a: P2(a * c, a * d + b * c, b * d), w: [P2(a * c, a * d, b * d), P2(a * c, b * c, b * d), P2(a * c, a * d + b * c, b + d), P2(a + c, a * d + b * c, b * d), P2(a * c, a * d - b * c, b * d)],
    e: `Multiply every term: ${co(a, 'x')}·${co(c, 'x')} = ${co(a * c, 'x^2')}, the middle terms ${co(a * d, 'x')} and ${co(b * c, 'x')} combine to ${co(a * d + b * c, 'x')}, and ${S(b)}·${S(d)} = ${S(b * d)}.`.replace(/0x/g, '0x') }); });
T('equiv', 2, () => { const a = R.int(1, 7), b = R.int(2, 9);
  return mcQ({ d: 2, q: `Which expression is equivalent to ${a * a === 1 ? '' : a * a}x^2 ${M} ${b * b}?`, a: `(${co(a, 'x')} ${M} ${b})(${co(a, 'x')} + ${b})`, w: [`(${co(a, 'x')} ${M} ${b})^2`, `(${co(a, 'x')} + ${b})^2`, `(${co(a * a, 'x')} ${M} ${b})(x + ${b})`, `(${co(a, 'x')} ${M} ${b * b})(${co(a, 'x')} + 1)`],
    e: `This is a difference of squares: ${a === 1 ? 'x' : `(${co(a, 'x')})`}^2 ${M} ${b}^2 = (${co(a, 'x')} ${M} ${b})(${co(a, 'x')} + ${b}).` }); });
T('equiv', 3, () => { const a = R.int(2, 6), b = R.int(2, 5), c = R.int(1, 9), ans = a * b + c;
  return mcQ({ d: 3, q: `Which expression is equivalent to (x^${a})^${b} · x^${c}, where x > 0?`, a: `x^{${ans}}`, w: [a + b + c, a * b * c, (a + b) * c, a * (b + c), a * b - c, a + b, a * c + b, ans + a, ans * 2].filter(v => v !== ans).map(v => `x^{${v}}`),
    e: `A power of a power multiplies exponents: (x^${a})^${b} = x^{${a * b}}. Multiplying powers of the same base adds exponents: x^{${a * b}} · x^${c} = x^{${ans}}.` }); });
T('equiv', 3, () => { const k = R.int(2, 12);
  return mcQ({ d: 3, q: `Which expression is equivalent to @f(x^2 ${M} ${k * k}|x ${M} ${k}) for x ≠ ${k}?`, a: `x + ${k}`, w: [`x ${M} ${k}`, `x ${M} ${k * k}`, `x + ${k * k}`, `x^2 + ${k}`],
    e: `Factor the numerator: x^2 ${M} ${k * k} = (x ${M} ${k})(x + ${k}). Cancel the common factor (x ${M} ${k}) to get x + ${k}.` }); });

/* ===================== AREA AND VOLUME ===================== */
T('area', 1, () => { const Lr = R.int(4, 20), W = R.int(2, Lr - 1), P = 2 * (Lr + W);
  return numQ({ d: 1, q: `A rectangle has a length of ${Lr} centimeters and a perimeter of ${P} centimeters. What is the area of the rectangle, in square centimeters?`, v: Lr * W, wrong: [Lr * P, P - Lr, Lr * (P / 2), W * W],
    e: `Perimeter = 2(length + width), so ${P} = 2(${Lr} + w) and w = ${W}. Area = ${Lr} × ${W} = ${Lr * W}.` }); });
T('area', 2, () => { const r = R.int(2, 9), h = R.int(2, 12);
  return mcQ({ d: 2, q: `A right circular cylinder has a radius of ${r} inches and a height of ${h} inches. What is the volume of the cylinder, in cubic inches?`, a: `${r * r * h}π`, w: [`${2 * r * h}π`, `${r * h}π`, `${2 * r * r * h}π`, `${r * r * h}`, `${Math.round(r * r * h / 3)}π`],
    e: `V = πr^2h = π(${r})^2(${h}) = ${r * r * h}π.` }); });
T('area', 3, () => { const k = R.int(2, 5), dim = R.pick(['side length of a cube', 'radius of a sphere', 'each dimension of a rectangular box']);
  return numQ({ d: 3, q: `If the ${dim} is multiplied by ${k}, the volume is multiplied by what number?`, v: k ** 3, wrong: [k, k * k, 3 * k, k ** 3 / k + k],
    e: `Volume depends on three lengths multiplied together, so scaling every length by ${k} multiplies the volume by ${k}^3 = ${k ** 3}.` }); });
T('area', 2, () => { const [b, h] = until(() => [R.int(3, 16), R.int(2, 15)], ([b, h]) => (b * h) % 2 === 0), A = b * h / 2;
  return numQ({ d: 2, q: `A triangle has a base of ${b} meters and an area of ${A} square meters. What is the height of the triangle, in meters?`, v: h, wrong: [A / b, A - b, 2 * A, h * 2],
    e: `Area = (1/2)bh, so ${A} = (1/2)(${b})h, and h = 2 × ${A} ÷ ${b} = ${h}.` }); });
T('area', 3, () => { const r = R.int(1, 9), num = 4 * r ** 3;
  return mcQ({ d: 3, q: `A sphere has a radius of ${r} centimeters. What is the volume of the sphere, in cubic centimeters?`, a: piF(num, 3), w: [piF(4 * r * r, 1), piF(r ** 3, 1), piF(4 * r ** 3, 1), piF(r ** 3, 3), piF(2 * r ** 3, 3)],
    e: `V = (4/3)πr^3 = (4/3)π(${r ** 3}) = ${piF(num, 3).replace(/@f\((.*)\|(.*)\)/, '$1/$2')}.` }); });
T('area', 2, () => { const s = R.int(3, 25);
  return numQ({ d: 2, q: `A square has an area of ${s * s} square feet. What is the perimeter of the square, in feet?`, v: 4 * s, wrong: [s, s * s / 4, 2 * s, 4 * s * s],
    e: `Side = @r(${s * s}) = ${s}. Perimeter = 4 × ${s} = ${4 * s}.` }); });
T('area', 3, () => { const r = R.int(2, 9), h = 3 * R.int(1, 6);
  return mcQ({ d: 3, q: `A right circular cone has a radius of ${r} and a height of ${h}. What is the volume of the cone?`, a: `${r * r * h / 3}π`, w: [`${r * r * h}π`, `${2 * r * h / 3}π`, `${r * h}π`, `${r * r * h / 3}`],
    e: `V = (1/3)πr^2h = (1/3)π(${r * r})(${h}) = ${r * r * h / 3}π.` }); });

/* ===================== INFERENCE AND STATISTICAL CLAIMS ===================== */
T('infer', 2, () => { const ctx = R.pick([['students', 'at a high school', 'at the school', 'said they bike to school', 'bike to school'], ['households', 'in a town', 'in the town', 'reported owning a dog', 'own a dog'], ['employees', 'at a company', 'at the company', 'said they work from home at least once a week', 'work from home at least once a week'], ['customers', 'of a bookstore', 'of the bookstore', 'said they prefer e-books', 'prefer e-books']]);
  const [n, k, Tt] = until(() => { const n = R.pick([40, 50, 80, 100, 120, 200, 250]); return [n, R.int(2, Math.round(n * 0.7)), n * R.int(5, 30)]; }, ([n, k, Tt]) => Number.isInteger(Tt * k / n)), ans = Tt * k / n;
  return numQ({ d: 2, q: `A random sample of ${n} ${ctx[0]} ${ctx[1]} was surveyed, and ${k} of them ${ctx[3]}. There are ${Tt.toLocaleString('en-US')} ${ctx[0]} ${ctx[2]} in all. Based on the sample, about how many of the ${ctx[0]} ${ctx[2]} ${ctx[4]}?`, v: ans, wrong: [k, Tt - ans, Math.round(Tt / k), ans * 2],
    e: `The sample proportion is ${k}/${n}. Apply it to the whole group: ${Tt} × ${k}/${n} = ${ans}. This works because the sample was chosen at random from that group.` }); });
const STUDIES = [   // [units, treatment, control, result, treatment noun, outcome, population, observational sentence]
  ['volunteers', 'listen to music while studying', 'study in silence', 'scored higher on a memory test', 'listening to music while studying', 'memory test scores', 'adults in a city', 'Those who said they usually listen to music while studying scored higher on a memory test than those who said they study in silence.'],
  ['volunteers', 'use a standing desk', 'use a regular desk', 'reported less back pain', 'using a standing desk', 'back pain', 'office workers in a city', 'Those who use a standing desk reported less back pain than those who use a regular desk.'],
  ['tomato plants', 'receive a new fertilizer', 'receive no fertilizer', 'produced more fruit', 'the new fertilizer', 'fruit production', 'tomato farms in a region', 'Farms that use the new fertilizer reported more fruit per plant than farms that use no fertilizer.'],
  ['volunteers', 'take a 20-minute afternoon nap', 'stay awake', 'had faster reaction times', 'a 20-minute nap', 'reaction time', 'adults in a city', 'Those who said they take a 20-minute afternoon nap had faster reaction times than those who said they do not nap.'],
  ['classrooms', 'use a new reading app', 'use the usual lessons', 'showed larger gains in reading scores', 'the reading app', 'reading gains', 'elementary schools in a state', 'Schools that chose to use the reading app showed larger gains in reading scores than schools that did not.']];
T('infer', 3, () => { const [who, x, y, res, xn, outc, pop, obs] = R.pick(STUDIES), n = 20 * R.int(5, 20), cap = t => t[0].toUpperCase() + t.slice(1);
  if (R.chance(0.5)) return mcQ({ d: 3, q: `Researchers recruited ${n} ${who}. They randomly assigned half to ${x} and the other half to ${y}. The group assigned to ${x} ${res}. Which conclusion is best supported?`,
    a: `${cap(xn)} likely caused the difference in ${outc} for ${who} like those in the study.`,
    w: [`${cap(xn)} would cause the same difference for all ${who} everywhere.`, `No conclusion about cause is possible, because the study did not survey a random sample.`, `The difference in ${outc} caused the ${who} to be placed in each group.`],
    e: `Random assignment to groups supports a cause-and-effect conclusion. But the ${who} were recruited, not randomly sampled from a larger population, so the result should not be extended to all ${who}.` });
  return mcQ({ d: 3, q: `A researcher surveyed a random sample of ${n} ${pop}. ${obs} Which conclusion is best supported?`,
    a: `There is an association between ${xn} and ${outc} among ${pop}, but the survey cannot show that one causes the other.`,
    w: [`${cap(xn)} causes a change in ${outc} among ${pop}.`, `The results apply only to the ${n} surveyed and say nothing about other ${pop}.`, `There is no association between ${xn} and ${outc}.`],
    e: `A random sample lets the result be generalized to all ${pop}. But no one was assigned to a group, so this is an observational study: it shows an association, not cause and effect.` }); });
T('infer', 3, () => { const n1 = R.pick([100, 200, 300, 400]), n2 = n1 * R.pick([3, 4, 5]), p = R.int(30, 70);
  return mcQ({ d: 3, q: `Two random samples were taken from the same population of voters. Sample A had ${n1} voters and Sample B had ${n2} voters. In both samples, ${p}% supported a new park. Which statement about the margins of error is most likely true?`,
    a: 'The margin of error for Sample B is smaller than for Sample A.', w: ['The margin of error for Sample B is larger than for Sample A.', 'The two margins of error are equal, because the percentages are equal.', 'Neither sample has a margin of error, because both are random.'],
    e: `Larger random samples give more precise estimates, so the larger sample (B, with ${n2} voters) has the smaller margin of error.` }); });
}());
