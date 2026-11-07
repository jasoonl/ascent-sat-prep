/* Procedural Reading & Writing questions in the style of the digital SAT and PSAT.
   Covers Standard English Conventions (Boundaries; Form, Structure, and Sense), Expression of Ideas
   (Rhetorical Synthesis, Transitions) and quantitative Command of Evidence.
   Rules every template follows:
   - the correct choice uses only information printed in the notes, passage or table;
   - wrong choices are wrong for one clear reason (wrong goal, wrong relationship, wrong punctuation or form);
   - people, towns and institutions are invented, so no real-world fact can be wrong.
   tests/gen-check.js checks the format and tests/rw-gen-check.js checks the rules above. */
(function () {
'use strict';
const T = Gen.add, { R, mcQ } = Gen.h;
const STD = 'Which choice completes the text so that it conforms to the conventions of Standard English?';
const TRQ = 'Which choice completes the text with the most logical transition?';
const RSQ = 'Which choice most effectively uses relevant information from the notes to accomplish this goal?';
const NOTES = 'While researching a topic, a student has taken the following notes:';
const BLANK = '______';
const cap = s => s[0].toUpperCase() + s.slice(1);
const FIRST = ['Amara', 'Diego', 'Mei', 'Tomás', 'Priya', 'Kwame', 'Lena', 'Hiro', 'Sofia', 'Malik', 'Inés', 'Ravi', 'Nadia', 'Omar', 'Yuki', 'Elena', 'Jamal', 'Ana', 'Kofi', 'Marta', 'Arjun', 'Leila', 'Mateo', 'Hana', 'Samuel', 'Zara', 'Felix', 'Noor', 'Lucas', 'Aiko', 'Grace', 'Ibrahim', 'Rosa', 'Daniel', 'Fatima', 'Erik'];
const LAST = ['Okafor', 'Reyes', 'Chen', 'Alvarez', 'Sharma', 'Mensah', 'Novak', 'Tanaka', 'Rossi', 'Haddad', 'Costa', 'Iyer', 'Petrova', 'Farouk', 'Sato', 'Moreno', 'Baptiste', 'Lindqvist', 'Owusu', 'Kowalski', 'Nair', 'Abbasi', 'Ortiz', 'Kim', 'Adeyemi', 'Dubois', 'Halvorsen', 'Rahman', 'Silva', 'Mori', 'Byrne', 'Castillo', 'Hughes', 'Yilmaz', 'Mbeki', 'Park'];
const TOWNS = ['Ashford', 'Brookhaven', 'Cedarville', 'Dunmore', 'Elmwood', 'Fairview', 'Glenrock', 'Harlow', 'Ivydale', 'Juniper Bay', 'Kingsbridge', 'Larkspur', 'Maplewood', 'Northfield', 'Oakridge', 'Pinecrest', 'Riverton', 'Stonebridge', 'Tamarack', 'Westbrook', 'Willow Creek', 'Bayport', 'Clearwater', 'Millbrook'];
const person = () => { const f = R.pick(FIRST), l = R.pick(LAST); return { full: `${f} ${l}`, sur: l }; };
const twoTowns = () => { const a = R.pick(TOWNS); let b; do { b = R.pick(TOWNS); } while (b === a); return [a, b]; };
const yr = (a = 1995, b = 2023) => R.int(a, b);
const num = n => n.toLocaleString('en-US');
const pickN = (arr, k) => R.shuffle(arr).slice(0, k);
const notes = (bullets, goal) => `${NOTES}\n${bullets.map(b => '• ' + b).join('\n')}\n\nThe student wants to ${goal}`;

/* ===================== RHETORICAL SYNTHESIS ===================== */
/* Research studies: four sentences each meet a different goal, so exactly one choice fits the goal asked. */
const STUDIES = [
  { job: 'ecologist', aim: 'whether streetlights change where bats feed', method: (n) => `recorded bat calls at ${n} lit and ${n} unlit sites`, find: (p) => `bat activity was ${p}% lower at lit sites than at unlit sites`, where: (t) => `in parks around ${t}` },
  { job: 'marine biologist', aim: 'how water temperature affects the growth of young sea stars', method: (n) => `raised ${n} young sea stars in tanks kept at different temperatures`, find: (p) => `sea stars in the warmest tanks grew ${p}% faster than those in the coolest tanks`, where: (t) => `at a laboratory in ${t}` },
  { job: 'sociologist', aim: 'whether public libraries help people find jobs', method: (n) => `interviewed ${n} library visitors who were looking for work`, find: (p) => `${p}% of the visitors said they had used library computers to apply for a job`, where: (t) => `at branch libraries in ${t}` },
  { job: 'soil scientist', aim: 'whether planting clover between crop rows improves soil', method: (n) => `measured soil nitrogen on ${n} farm plots with and without clover`, find: (p) => `plots with clover had ${p}% more soil nitrogen than plots without it`, where: (t) => `on farms near ${t}` },
  { job: 'psychologist', aim: 'whether short breaks improve students’ focus', method: (n) => `gave ${n} students a reading task with or without a five-minute break`, find: (p) => `students who took a break answered ${p}% more comprehension questions correctly`, where: (t) => `at a high school in ${t}` },
  { job: 'urban planner', aim: 'how tree cover affects summer street temperatures', method: (n) => `placed temperature sensors on ${n} city blocks with different amounts of tree cover`, find: (p) => `blocks with the most tree cover were on average ${Math.max(2, Math.round(p / 6))} degrees Celsius cooler than blocks with the least`, where: (t) => `in ${t}` },
  { job: 'ornithologist', aim: 'whether backyard feeders change when songbirds lay their eggs', method: (n) => `tracked ${n} nests in yards with and without feeders`, find: (p) => `birds near feeders laid eggs about ${Math.max(3, Math.round(p / 5))} days earlier than birds in yards without feeders`, where: (t) => `in neighborhoods of ${t}` },
  { job: 'economist', aim: 'how a new bus line affected local shops', method: (n) => `compared sales records from ${n} shops before and after the line opened`, find: (p) => `sales at shops within one block of a stop rose by ${p}%`, where: (t) => `along the main road in ${t}` },
  { job: 'botanist', aim: 'whether wildflower strips attract more pollinators to farms', method: (n) => `counted bees and butterflies on ${n} fields with and without wildflower strips`, find: (p) => `fields with strips had ${p}% more pollinator visits`, where: (t) => `in the hills outside ${t}` },
  { job: 'linguist', aim: 'how quickly young children learn words from picture books', method: (n) => `read picture books with unfamiliar words to ${n} preschoolers`, find: (p) => `after three readings, the children recognized ${p}% of the new words`, where: (t) => `at preschools in ${t}` },
  { job: 'hydrologist', aim: 'whether rain gardens reduce flooding on city streets', method: (n) => `measured runoff from ${n} streets with and without rain gardens`, find: (p) => `streets with rain gardens had ${p}% less runoff during heavy storms`, where: (t) => `in ${t}` },
  { job: 'archaeologist', aim: 'when people first settled the river valley', method: (n) => `dated charcoal from ${n} ancient cooking hearths`, find: (p) => `the oldest hearths were about ${num(2000 + p * 40)} years old`, where: (t) => `in the river valley near ${t}` }
];
T('rs', 2, () => {
  const s = R.pick(STUDIES), who = person(), n = R.int(12, 240), p = R.int(12, 68), y = yr(), town = R.pick(TOWNS), job = s.job, Job = cap(job);
  const where = s.where(town), aimS = `In ${y}, ${who.sur} set out to learn ${s.aim}.`, methS = `${who.sur} ${s.method(n)} ${where}.`, findS = `${who.sur} found that ${s.find(p)}.`;
  const bullets = [`${who.full} is a ${job}.`, aimS, methS, findS];
  const goals = [
    ['present the aim of the study.', `${who.full} wanted to learn ${s.aim}.`, 'The aim is what the researcher set out to learn, so the right choice states that question.'],
    ['describe the methods the researcher used.', `To conduct the study, ${who.sur} ${s.method(n)}.`, 'Methods are how the study was done, so the right choice explains what the researcher did to collect data.'],
    ['present the study’s finding to an audience unfamiliar with the researcher.', `${Job} ${who.full} found that ${s.find(p)}.`, `An unfamiliar audience needs to know who ${who.sur} is (a ${job}), and the goal also requires the finding. Only one choice gives both.`],
    ['specify when and where the study took place.', `${who.sur}’s study took place ${where} in ${y}.`, 'When and where means the year and the location. Only one choice gives both.']
  ];
  const aimD = goals[0][1], methD = goals[1][1], findD = `${who.sur} found that ${s.find(p)}.`, whenD = goals[3][1];
  const gi = R.int(0, 3), [goal, a, why] = goals[gi];
  const wrongs = [[methD, findD, whenD], [aimD, findD, whenD], [findD, `${Job} ${who.full} wanted to learn ${s.aim}.`, methD], [`${who.sur}’s study took place in ${y}.`, `${who.sur}’s study took place ${where}.`, aimD]][gi];
  return mcQ({ d: gi >= 2 ? 3 : 2, p: notes(bullets, goal), q: RSQ, a, w: wrongs,
    e: `${why} ${gi === 2 ? `“${who.sur} found that…” gives the finding but never says who ${who.sur} is.` : gi === 3 ? 'The other choices give only the year, only the place, or neither.' : 'The other choices are accurate but describe a different part of the study.'}` });
});
/* Two places compared: a difference goal or a similarity goal. */
const PROGRAMS = [
  { kind: 'bike-share program', pl: 'bike-share programs', unit: 'bikes', started: 'launched', lo: 150, hi: 4000 },
  { kind: 'community garden program', pl: 'community garden programs', unit: 'garden plots', started: 'started', lo: 20, hi: 600 },
  { kind: 'public library', pl: 'public libraries', unit: 'books', started: 'opened', lo: 8000, hi: 250000, round: 1000 },
  { kind: 'wind farm', pl: 'wind farms', unit: 'turbines', started: 'began operating', lo: 8, hi: 180 },
  { kind: 'youth orchestra', pl: 'youth orchestras', unit: 'members', started: 'was founded', lo: 25, hi: 140, passive: true },
  { kind: 'recycling program', pl: 'recycling programs', unit: 'collection bins', started: 'started', lo: 40, hi: 900 }
];
T('rs', 2, () => {
  const k = R.pick(PROGRAMS), [A, B] = twoTowns(), rnd = v => k.round ? Math.round(v / k.round) * k.round : v;
  let na = rnd(R.int(k.lo, k.hi)), nb; do { nb = rnd(R.int(k.lo, k.hi)); } while (Math.abs(nb - na) < (k.hi - k.lo) / 8);
  const sameYear = R.chance(0.5), ya = yr(1990, 2020), yb = sameYear ? ya : (() => { let v; do { v = yr(1990, 2020); } while (v === ya); return v; })();
  const stIn = y => k.passive ? `was founded in ${y}` : `${k.started} in ${y}`;
  const bullets = [`${A}’s ${k.kind} ${stIn(ya)}.`, `It has ${num(na)} ${k.unit}.`, `${B}’s ${k.kind} ${stIn(yb)}.`, `It has ${num(nb)} ${k.unit}.`];
  const bigger = na > nb ? A : B, smaller = na > nb ? B : A, nBig = Math.max(na, nb), nSmall = Math.min(na, nb);
  const diffS = `${bigger}’s ${k.kind} has ${num(nBig)} ${k.unit}, while ${smaller}’s has only ${num(nSmall)}.`;
  const single = [`${A}’s ${k.kind} has ${num(na)} ${k.unit}.`, `${B}’s ${k.kind} ${stIn(yb)}.`, `${A}’s ${k.kind} ${stIn(ya)}.`, `${B}’s ${k.kind} has ${num(nb)} ${k.unit}.`];
  if (sameYear && R.chance(0.6)) {
    const a = `Both ${A} and ${B} have ${k.pl} that ${k.passive ? 'were founded' : k.started} in ${ya}.`;
    return mcQ({ d: 2, p: notes(bullets, `emphasize a similarity between the two ${k.pl}.`), q: RSQ, a, w: [diffS, ...pickN(single, 2)],
      e: `A similarity is something true of both. The notes give the same year for both ${k.pl}, and only one choice says so. The choice about numbers of ${k.unit} states a difference, and the others mention just one town.` });
  }
  return mcQ({ d: 2, p: notes(bullets, `emphasize a difference in size between the two ${k.pl}.`), q: RSQ, a: diffS, w: [`Both ${A} and ${B} have ${k.pl}.`, ...pickN(single, 2)],
    e: `Size here is the number of ${k.unit}. The right choice gives both numbers and contrasts them with “while.” Saying both towns have one is a similarity, and the other choices describe only one town.` });
});

/* ===================== COMMAND OF EVIDENCE (QUANTITATIVE) ===================== */
const MEASURES = [
  { what: 'average number of bird species seen per survey', unit: 'species', sites: 'wetlands', names: ['Heron Marsh', 'Cattail Flats', 'Reed Lake', 'Willow Bog', 'Sandpiper Cove'], lo: 6, hi: 40, job: 'ecologist' },
  { what: 'nitrate level in the water', unit: 'mg/L', sites: 'streams', names: ['Mill Creek', 'Fox Run', 'Stony Brook', 'Alder Creek', 'Bear Run'], lo: 2, hi: 18, job: 'hydrologist' },
  { what: 'number of visitors', unit: 'thousands', sites: 'state parks', names: ['Eagle Ridge', 'Pine Hollow', 'Lake Vista', 'Red Canyon', 'Maple Falls'], lo: 40, hi: 320, job: 'parks researcher' },
  { what: 'average daily ridership', unit: 'thousands of riders', sites: 'bus routes', names: ['Route 4', 'Route 9', 'Route 12', 'Route 15', 'Route 22'], lo: 3, hi: 30, job: 'transit analyst' },
  { what: 'tomato yield per plant', unit: 'kg', sites: 'test plots', names: ['Plot A', 'Plot B', 'Plot C', 'Plot D', 'Plot E'], lo: 2, hi: 12, job: 'agronomist' }
];
T('coe', 3, () => {
  const m = R.pick(MEASURES), who = person(), y1 = yr(2005, 2014), y2 = y1 + R.pick([4, 5, 6, 8, 10]), names = pickN(m.names, 4), type = R.pick(['rise', 'top']);
  const rows = names.map(nm => { const a = R.int(m.lo, m.hi); return { nm, a, b: a }; });
  const usedB = new Set();
  rows.forEach(r => { let b, tries = 0; do { b = type === 'rise' ? r.a + R.int(1, Math.max(2, Math.round((m.hi - m.lo) / 3))) : R.int(m.lo, m.hi); } while ((b === r.a || usedB.has(b)) && tries++ < 50); r.b = b; usedB.add(b); });
  if (type === 'top') { const top = rows.reduce((x, y) => (y.b > x.b ? y : x)); rows.forEach(r => { if (r !== top && r.b === top.b) r.b -= 1; }); }
  const table = { head: [cap(m.sites.replace(/s$/, '')), `${y1} (${m.unit})`, `${y2} (${m.unit})`], rows: rows.map(r => [r.nm, String(r.a), String(r.b)]) };
  const intro = `${cap(m.job)} ${who.full} recorded the ${m.what} at four ${m.sites} in ${y1} and ${y2}.`;
  if (type === 'rise') {
    const claim = `the ${m.what} rose at every one of the four ${m.sites} between ${y1} and ${y2}`;
    const top = rows.reduce((x, y) => (y.b > x.b ? y : x)), one = R.pick(rows), lowA = rows.reduce((x, y) => (y.a < x.a ? y : x));
    return mcQ({ d: 3, p: `${intro} ${who.sur} claims that ${claim}.`, table, q: `Which choice most effectively uses data from the table to support ${who.sur}’s claim?`,
      a: `At each of the four ${m.sites}, the value in ${y2} was higher than the value in ${y1}.`,
      w: [`${one.nm} went from ${one.a} in ${y1} to ${one.b} in ${y2}.`, `In ${y2}, ${top.nm} had the highest value of the four ${m.sites}, at ${top.b}.`, `In ${y1}, ${lowA.nm} had the lowest value of the four ${m.sites}, at ${lowA.a}.`],
      e: `The claim is about every site. Only the first choice covers all four. One site rising is true but not enough, and the other two choices compare sites within a single year instead of showing change over time.` });
  }
  const top = rows.reduce((x, y) => (y.b > x.b ? y : x)), others = rows.filter(r => r !== top), rose = rows.filter(r => r.b > r.a), fell = rows.filter(r => r.b < r.a);
  const w = [`In ${y1}, ${top.nm} had a value of ${top.a}.`];
  if (rose.length) { const r = R.pick(rose); w.push(`${r.nm}’s value rose from ${r.a} in ${y1} to ${r.b} in ${y2}.`); }
  if (fell.length) { const r = R.pick(fell); w.push(`${r.nm}’s value fell from ${r.a} in ${y1} to ${r.b} in ${y2}.`); }
  const o2 = R.pick(others); w.push(`In ${y2}, ${o2.nm} had a value of ${o2.b}.`);
  return mcQ({ d: 3, p: `${intro} ${who.sur} claims that in ${y2}, ${top.nm} had the highest ${m.what} of the four ${m.sites}.`, table, q: `Which choice most effectively uses data from the table to support ${who.sur}’s claim?`,
    a: `In ${y2}, ${top.nm}’s value (${top.b}) was higher than the values for ${others.map(r => `${r.nm} (${r.b})`).join(', ').replace(/, ([^,]*)$/, ', and $1')}.`, w,
    e: `The claim compares all four ${m.sites} in ${y2}. Only the correct choice gives ${top.nm}’s ${y2} value next to the other three. The other choices are accurate readings of the table, but each describes one site, a different year, or a change over time.` });
});

/* ===================== TRANSITIONS ===================== */
const TR = { contrast: ['However,', 'In contrast,', 'By contrast,'], similar: ['Similarly,', 'Likewise,'], cause: ['As a result,', 'Therefore,', 'Consequently,'], example: ['For example,', 'For instance,'], addition: ['Moreover,', 'Additionally,', 'Furthermore,'], concession: ['Nevertheless,', 'Even so,'], sequence: ['Afterward,', 'Later,'] };
const CLASH = { contrast: ['concession'], similar: ['addition'], cause: ['sequence'], example: ['addition', 'similar'], addition: ['similar', 'example'], concession: ['contrast'], sequence: ['cause', 'addition'] };
const trWrongs = rel => pickN(Object.keys(TR).filter(k => k !== rel && !CLASH[rel].includes(k)), 3).map(k => R.pick(TR[k]));
const trQ = (d, text, rel, e) => mcQ({ d, p: text, q: TRQ, a: R.pick(TR[rel]), w: trWrongs(rel), e });
const SPECIES = ['great blue herons', 'monarch butterflies', 'red-winged blackbirds', 'sea turtles', 'bald eagles', 'barn owls', 'river otters', 'bumblebees'];
T('trn', 1, () => {
  const [A, B] = twoTowns(), sp = R.pick(SPECIES), y1 = yr(2000, 2012), y2 = y1 + R.int(5, 10), p = R.int(8, 60), q = R.int(5, 55), same = R.chance(0.5);
  return trQ(1, `Between ${y1} and ${y2}, the number of ${sp} counted near ${A} rose by ${p}%. ${BLANK} the number counted near ${B} ${same ? `rose by ${q}%` : `fell by ${q}%`} over the same period.`, same ? 'similar' : 'contrast',
    same ? `Both counts rose, so the second sentence describes a similar trend. A similarity transition fits.` : `One count rose and the other fell, so the second sentence contrasts with the first.`);
});
const CAUSES = [
  [t => `A late frost in April damaged most of the apple blossoms in ${t}.`, () => `the orchards’ harvest that fall was ${R.int(30, 70)}% smaller than usual.`],
  [t => `${t} lowered bus fares to one dollar in ${yr(2010, 2022)}.`, () => `the number of daily riders nearly doubled within a year.`],
  [t => `Heavy rains washed out the only road into ${t} for two weeks.`, () => `grocery stores there ran low on fresh food.`],
  [t => `The ${t} school district added ${R.int(2, 6)} new bus routes last year.`, () => `fewer students arrived late to class.`],
  [t => `A new dam upstream of ${t} reduced the river’s flow.`, () => `fish that need fast-moving water became harder to find there.`],
  [t => `The ${t} library extended its hours to 10 p.m.`, () => `many more students began studying there in the evening.`],
  [t => `The bakery in ${t} switched to a cheaper brand of flour.`, () => `it was able to lower the price of its bread.`]
];
T('trn', 1, () => { const [f, g] = R.pick(CAUSES), t = R.pick(TOWNS);
  return trQ(1, `${f(t)} ${BLANK} ${g()}`, 'cause', 'The second sentence describes a result of the first, so a cause-and-effect transition fits.'); });
const EXAMPLES = [
  [() => 'Several towns in the region have found new uses for empty buildings.', t => `${t} turned a closed factory into a public library.`],
  [() => 'Many small museums now offer programs for families.', t => `the museum in ${t} hosts a free science night every month.`],
  [() => 'Some cities have started paying residents to plant trees.', t => `${t} gives homeowners fifty dollars for each tree they plant.`],
  [() => 'Researchers have found creative ways to track wild animals.', () => `one team glued tiny radio tags, each lighter than a paper clip, onto bumblebees.`],
  [() => 'A number of schools have changed their schedules to give students more sleep.', t => `the high school in ${t} now starts classes at 8:45 a.m. instead of 7:30 a.m.`]
];
T('trn', 2, () => { const [f, g] = R.pick(EXAMPLES), t = R.pick(TOWNS);
  return trQ(2, `${f()} ${BLANK} ${g(t)}`, 'example', 'The first sentence makes a general statement and the second gives one specific case of it, so an example transition fits.'); });
const CONCEDE = [
  [t => `The new community center in ${t} cost ${R.int(2, 9)} million dollars more than planned.`, () => `the town council voted to finish building it.`],
  [t => `The hiking trail near ${t} was closed for most of the summer.`, () => `the park still had more visitors than in any previous year.`],
  [() => 'The experiment’s first three trials failed.', () => `the team decided to run it a fourth time.`],
  [t => `Tickets for the ${t} film festival sold out in under an hour.`, () => `organizers chose not to add more screenings.`],
  [() => 'Critics found the novel’s ending confusing.', () => `the book became the year’s best seller.`]
];
T('trn', 2, () => { const [f, g] = R.pick(CONCEDE), t = R.pick(TOWNS);
  return trQ(2, `${f(t)} ${BLANK} ${g()}`, 'concession', 'The second sentence happens despite the problem in the first, so a transition that means “despite this” fits.'); });
const ADDS = [
  [t => `The new park in ${t} gives residents a place to walk and play.`, () => `it soaks up rainwater that once flooded nearby streets.`],
  [t => `The ${t} farmers market sells produce grown within 50 miles.`, () => `it gives local farmers a place to sell directly to customers.`],
  [() => 'The solar panels on the school roof lower its electricity bills.', () => `students use data from the panels in science class.`],
  [t => `The ${t} ferry cuts the trip across the bay to twenty minutes.`, () => `it runs every hour, even on weekends.`]
];
T('trn', 2, () => { const [f, g] = R.pick(ADDS), t = R.pick(TOWNS);
  return trQ(2, `${f(t)} ${BLANK} ${g()}`, 'addition', 'The second sentence adds another benefit in the same direction as the first, so an addition transition fits.'); });
const STEPS = [
  [(w, n) => `${w.full} first collected soil samples from ${n} sites.`, w => `${w.sur} tested each sample for tiny plastic particles.`],
  [(w, n) => `${w.full} spent ${n} days photographing the old mill before it was torn down.`, w => `${w.sur} used the photographs to build a digital model of the building.`],
  [(w, n) => `${w.full} first interviewed ${n} longtime residents about the flood.`, w => `${w.sur} compared their accounts with newspaper reports from the time.`]
];
T('trn', 1, () => { const [f, g] = R.pick(STEPS), w = person(), n = R.int(6, 40);
  return trQ(1, `${f(w, n)} ${BLANK} ${g(w)}`, 'sequence', 'The sentences describe steps in time order, so a sequence transition fits.'); });

/* ===================== BOUNDARIES ===================== */
const PAIRS = [   // two complete sentences, plus the logical relationship between them
  [t => `In ${yr()}, ${t} replaced its streetlights with LED bulbs`, () => `the town’s lighting costs dropped by ${R.int(20, 60)} percent`, 'so'],
  [() => `The trail to the summit is only ${R.int(3, 6)} miles long`, () => `it climbs more than ${num(R.int(2, 4) * 1000)} feet`, 'but'],
  [t => `The ${t} museum added a new wing for local artists`, () => `attendance rose sharply the following year`, 'so'],
  [() => `Many visitors expected the old bridge to be closed`, () => `engineers found that it was still safe`, 'but'],
  [w => `The orchestra performed ${R.int(12, 40)} concerts last season`, () => `it recorded its first album`, 'and'],
  [t => `Farmers near ${t} planted cover crops last fall`, () => `their fields lost far less soil during the spring rains`, 'so'],
  [() => `The rover was designed to last ninety days`, () => `it kept sending data for more than ${R.int(3, 9)} years`, 'but'],
  [t => `The ${t} library lends tools as well as books`, () => `it offers free classes on home repair`, 'and']
];
const ADV = { so: 'therefore', but: 'however', and: 'moreover' };
const split = (c1, c2) => { const i = c1.lastIndexOf(' '), j = c2.indexOf(' '); return { head: c1.slice(0, i), lw: c1.slice(i + 1), fw: c2.slice(0, j), tail: c2.slice(j + 1) }; };
T('bnd', 2, () => { const [f, g, rel] = R.pick(PAIRS), t = R.pick(TOWNS), x = split(f(t), g()), kind = R.int(0, 2), text = `${x.head} ${BLANK} ${x.tail}.`;
  if (kind === 0) { const period = R.chance(0.5);
    return mcQ({ d: 1, p: text, q: STD, a: period ? `${x.lw}. ${cap(x.fw)}` : `${x.lw}; ${x.fw}`, w: [`${x.lw}, ${x.fw}`, `${x.lw} ${x.fw}`, `${x.lw} and ${x.fw}`],
      e: `Both parts are complete sentences. They can be separated with a ${period ? 'period' : 'semicolon'}. A comma alone creates a comma splice, no punctuation creates a run-on, and “and” without a comma before it does not correctly join two long independent clauses.` }); }
  if (kind === 1) return mcQ({ d: 2, p: text, q: STD, a: `${x.lw}, ${rel} ${x.fw}`, w: [`${x.lw} ${rel} ${x.fw}`, `${x.lw}, ${x.fw}`, `${x.lw}; ${rel}, ${x.fw}`],
    e: `Two complete sentences can be joined with a comma plus a coordinating conjunction (“${rel}”). Leaving out the comma, using a comma alone, or putting a semicolon and comma around “${rel}” breaks the rule.` });
  const adv = ADV[rel];
  return mcQ({ d: 3, p: text, q: STD, a: `${x.lw}; ${adv}, ${x.fw}`, w: [`${x.lw}, ${adv}, ${x.fw}`, `${x.lw}; ${adv} ${x.fw}`, `${x.lw} ${adv}, ${x.fw}`],
    e: `“${cap(adv)}” is a conjunctive adverb, not a conjunction, so it cannot join two sentences with commas alone. Put a semicolon before it and a comma after it.` });
});
const SUBJ = [   // a long subject, then its verb: no punctuation belongs between them
  [(w, t) => `The ${yr()} survey of ${R.int(200, 900)} ${t} residents conducted by sociologist ${w.full}`, 'found', 'that most of them wanted more bike lanes.'],
  [(w, t) => `A collection of letters written by ${t}’s first schoolteacher`, 'reveals', 'how the town grew during the 1880s.'],
  [(w) => `The team of engineers led by ${w.full}`, 'designed', 'a bridge that can be assembled in a single day.'],
  [(w, t) => `Photographs taken by ${w.full} during the ${t} flood`, 'show', 'how quickly the water rose.'],
  [(w) => `The method that ${w.full} developed for testing water quality`, 'requires', 'only a phone camera and a paper strip.']
];
T('bnd', 2, () => { const [f, v, rest] = R.pick(SUBJ), w = person(), t = R.pick(TOWNS), sub = f(w, t), i = sub.lastIndexOf(' '), lw = sub.slice(i + 1);
  return mcQ({ d: 2, p: `${sub.slice(0, i)} ${BLANK} ${rest}`, q: STD, a: `${lw} ${v}`, w: [`${lw}, ${v}`, `${lw}; ${v}`, `${lw}: ${v}`],
    e: `Everything before “${v}” is the subject of the sentence. No punctuation should separate a subject from its verb, however long the subject is.` }); });
const APPOS = [[w => w.full, 'a geologist at Westbrook University', 'has spent a decade mapping the region’s caves.'], [w => w.full, 'the architect who designed the new train station', 'grew up in a house beside the old one.'],
  [() => 'The Riverton Bridge', 'the longest footbridge in the state', 'reopened after repairs last spring.'], [w => w.full, 'a nurse and amateur astronomer', 'discovered a comet from a backyard in Fairview.'], [w => `${w.full}’s first novel`, 'a mystery set on a fishing boat', 'won a regional book prize.']];
T('bnd', 2, () => { const [f, ap, pred] = R.pick(APPOS), w = person(), dash = R.chance(0.35), open = dash ? '—' : ', ', i = ap.lastIndexOf(' '), lw = ap.slice(i + 1), fw = pred.slice(0, pred.indexOf(' ')), tail = pred.slice(pred.indexOf(' ') + 1);
  const a = `${lw}${dash ? '—' : ','} ${fw}`.replace('— ', '—');
  return mcQ({ d: 2, p: `${f(w)}${open}${ap.slice(0, i)} ${BLANK} ${tail}`, q: STD, a, w: dash ? [`${lw}, ${fw}`, `${lw}; ${fw}`, `${lw} ${fw}`] : [`${lw}; ${fw}`, `${lw} ${fw}`, `${lw}: ${fw}`],
    e: `“${ap}” is extra information inserted into the sentence. It opens with a ${dash ? 'dash' : 'comma'}, so it must close with a matching ${dash ? 'dash' : 'comma'} before the sentence continues.` }); });
const LISTS = [[(w, t) => `${t}’s recycling program accepts three materials`, 'glass, aluminum, and paper'], [() => 'The research station has two main goals', 'tracking sea ice and measuring ocean temperatures'],
  [w => `${w.sur}’s recipe calls for just four ingredients`, 'flour, water, salt, and yeast'], [(w, t) => `The ${t} marathon route passes three landmarks`, 'the old mill, the harbor, and the clock tower']];
T('bnd', 3, () => { const [f, list] = R.pick(LISTS), w = person(), t = R.pick(TOWNS), c1 = f(w, t), i = c1.lastIndexOf(' '), lw = c1.slice(i + 1), fw = list.slice(0, list.indexOf(' ')), tail = list.slice(list.indexOf(' ') + 1);
  return mcQ({ d: 3, p: `${c1.slice(0, i)} ${BLANK} ${tail}.`, q: STD, a: `${lw}: ${fw}`, w: [`${lw}; ${fw}`, `${lw} ${fw}`, `${lw}, these are ${fw}`],
    e: `The words before the blank form a complete sentence, and what follows spells out the items it mentions. A colon introduces that list. A semicolon needs a complete sentence after it, and “these are” after a comma creates a comma splice.` }); });

/* ===================== FORM, STRUCTURE, AND SENSE ===================== */
const VERBS = [['reveal', 'reveals', 'revealing', 'revealed', 'how daily life changed during the 1920s.'], ['document', 'documents', 'documenting', 'documented', 'the construction of the town’s first railway.'],
  ['include', 'includes', 'including', 'included', 'several items historians believed were lost.'], ['show', 'shows', 'showing', 'shown', 'the harbor before the great storm of 1906.']];
const SG_HEADS = ['The collection of', 'The box of', 'An album of', 'The archive of', 'A series of'], PL_ITEMS = ['letters', 'photographs', 'maps', 'diaries', 'sketches'];
T('fss', 2, () => { const [b, s, ing, pp, rest] = R.pick(VERBS), item = R.pick(PL_ITEMS), t = R.pick(TOWNS), w = person(), sg = R.chance(0.5);
  const subj = sg ? `${R.pick(SG_HEADS)} ${item} donated to the ${t} museum by ${w.full}` : `The ${item} in the ${t} museum’s ${R.pick(['collection', 'archive'])}, which ${w.full} donated in ${yr()},`;
  return mcQ({ d: sg ? 3 : 2, p: `${subj} ${BLANK} ${rest}`, q: STD, a: sg ? s : b, w: sg ? [b, `are ${ing}`, `have ${pp}`] : [s, `is ${ing}`, `has ${pp}`],
    e: sg ? `The subject is “${subj.split(' ').slice(0, 2).join(' ')},” which is singular; “${item}” belongs to the phrase that describes it. A singular subject takes “${s}.”` : `The subject is the plural “${item},” so the verb must be plural: “${b}.” The clause set off by commas does not change the subject.` }); });
const ORGS_SG = ['The museum', 'The city council', 'The research team', 'The orchestra', 'The company', 'The school board'], ORGS_PL = ['The two museums', 'Both city councils', 'The researchers', 'The members of the orchestra', 'The partner companies'];
const THINGS = [['annual budget', 'would grow by', '%'], ['ticket prices', 'would rise by', '%'], ['staff', 'would expand by', ' people']];
T('fss', 1, () => { const sg = R.chance(0.5), org = R.pick(sg ? ORGS_SG : ORGS_PL), [th, ch, u] = R.pick(THINGS), n = R.int(3, 25), y = yr(2015, 2024);
  return mcQ({ d: 1, p: `In ${y}, ${org.replace(/^The /, 'the ').replace(/^Both /, 'both ')} announced that ${BLANK} ${th} ${ch} ${n}${u}.`, q: STD, a: sg ? 'its' : 'their', w: sg ? ['their', 'it’s', 'they’re'] : ['its', 'it’s', 'they’re'],
    e: `The pronoun refers to “${org.toLowerCase().replace(/^the /, '')},” which is ${sg ? 'singular' : 'plural'}, and it shows possession, so the answer is “${sg ? 'its' : 'their'}.” “It’s” means “it is” and “they’re” means “they are.”` }); });
const TENSE = [['publish', 'publishes', 'published', 'published', 'publishing', 'a report on the town’s water supply'], ['collect', 'collects', 'collected', 'collected', 'collecting', 'water samples from Clear Lake'], ['lead', 'leads', 'led', 'led', 'leading', 'a survey of the region’s wetlands'],
  ['write', 'writes', 'wrote', 'written', 'writing', 'articles about the old shipyard'], ['teach', 'teaches', 'taught', 'taught', 'teaching', 'a summer course on local plants'], ['build', 'builds', 'built', 'built', 'building', 'floats for the town parade']];
T('fss', 2, () => { const [b, s, past, pp, ing, obj] = R.pick(TENSE), w = person(), kind = R.int(0, 2), y = yr(1990, 2012);
  if (kind === 0) return mcQ({ d: 1, p: `In ${y}, ${w.full} ${BLANK} ${obj}.`, q: STD, a: past, w: [`has ${pp}`, `will ${b}`, s], e: `“In ${y}” marks a finished time in the past, so the simple past “${past}” is correct.` });
  if (kind === 1) return mcQ({ d: 2, p: `Since ${y}, ${w.full} ${BLANK} ${obj} every year.`, q: STD, a: `has ${pp}`, w: [past, `will ${b}`, ing],
    e: `“Since ${y}” describes an action that began in the past and continues now, which calls for the present perfect “has ${pp}.”` });
  return mcQ({ d: 1, p: `Next year, ${w.full} ${BLANK} ${obj} for the first time.`, q: STD, a: `will ${b}`, w: [past, `has ${pp}`, `had ${pp}`], e: `“Next year” points to the future, so “will ${b}” is correct.` }); });
const JOBS = ['researcher', 'geologist', 'historian', 'engineer', 'architect', 'biologist', 'journalist', 'astronomer'], WORK = ['findings', 'proposal', 'design', 'report'];
T('fss', 2, () => { const j = R.pick(JOBS), wk = R.pick(WORK), n = R.int(2, 12), pl = R.chance(0.5), verb = wk === 'findings' ? 'were' : 'was';
  const p = pl ? `After working together for ${n} years, the two ${BLANK} ${wk} ${verb} published in a national journal.` : `After working alone for ${n} years, the ${BLANK} ${wk} ${verb} published in a national journal.`;
  return mcQ({ d: 2, p, q: STD, a: pl ? `${j}s’` : `${j}’s`, w: pl ? [`${j}’s`, `${j}s`, j] : [`${j}s’`, `${j}s`, j],
    e: `The ${wk} belong to ${pl ? 'two people, so the plural possessive' : 'one person, so the singular possessive'} “${pl ? j + 's’' : j + '’s'}” is needed. “${j}s” without an apostrophe is a plural that shows no ownership.` }); });
const MODS = [
  [n => `Having studied coral reefs for ${n} years`, w => `marine biologist ${w.full}`, 'wrote a field guide to the reefs of the Caribbean', 'a field guide to the reefs of the Caribbean was written by'],
  [n => `After testing ${n} different designs`, w => `engineer ${w.full}`, 'chose a curved frame for the new bridge', 'a curved frame was chosen for the new bridge by'],
  [n => `Working with ${n} volunteers`, w => `historian ${w.full}`, 'recorded the memories of the town’s oldest residents', 'the memories of the town’s oldest residents were recorded by'],
  [n => `Trained as a painter for ${n} years`, w => `designer ${w.full}`, 'brought bold colors to the city’s new subway maps', 'bold colors were brought to the city’s new subway maps by']
];
T('fss', 3, () => { const [intro, actor, act, passive] = R.pick(MODS), w = person(), n = R.int(3, 30), who = actor(w);
  return mcQ({ d: 3, p: `${intro(n)}, ${BLANK}`, q: STD, a: `${who} ${act}.`, w: [`${passive} ${who}.`, `${who}’s ${R.pick(['work', 'project'])} ${act}.`, `the result was that ${who} ${act}.`],
    e: `An introductory phrase describes whoever comes right after the comma. “${intro(n)}” describes a person, so the person, ${who}, must come first.` }); });
}());
