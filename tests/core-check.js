global.window = global;
const mem = {}; global.localStorage = { getItem: k => mem[k] || null, setItem: (k, v) => { mem[k] = v; } };
['skills','bank-rw1','bank-rw2','bank-math','gen','core'].forEach(f => require('../js/' + f + '.js'));
const p = Store.create({ name: 'Test' });
console.log('static bank', Bank.total());
// simulate a student: strong at algebra, weak at grammar
for (let i = 0; i < 300; i++) {
  const sk = SKILLS[i % SKILLS.length];
  const [q] = Engine.pickQuestions(p, [{ id: sk.id, w: 1 }], 1, 'adaptive');
  if (!q) { console.log('no question for', sk.id); continue; }
  const strong = sk.dom === 'alg' ? 0.9 : sk.dom === 'sec' ? 0.3 : 0.6;
  Engine.recordAnswer(p, q, Math.random() < strong, 60000, 'p');
}
const an = Engine.analyze(p);
console.log('focus:', an.focus.map(x => x.skill.name + ' m=' + x.m.toFixed(2)));
console.log('strong:', an.strong.map(x => x.skill.name));
console.log('est', Engine.estimate(p), 'streak', Engine.streak(p));
const used = Engine.newUsed();
for (const [sec, lvl] of [['rw','mixed'],['rw','hard'],['math','mixed'],['math','easy']]) {
  const m = Engine.buildModule(p, sec, lvl, null, used);
  const dd = [1,2,3].map(d => m.filter(q => q.d === d).length);
  console.log(sec, lvl, m.length, 'diff mix', dd, 'dup ids', m.length - new Set(m.map(q => q.id)).size);
}
const day = Engine.buildDaily(p); console.log('daily', day.qs.length, day.focus);
console.log(fmt('@f(x^2 − 25|x − 5) = x^{t/3} + @r(2) < 3'));
console.log(gradeGrid('3/2','1.5'), gradeGrid('−1.5','-3/2'), gradeGrid('7.2','7.2'), gradeGrid('7.1','7.2'));
