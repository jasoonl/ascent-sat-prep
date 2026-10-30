/* Skill taxonomy for the Digital SAT (domains + skills), with study tips.
   `w` = approximate share of its section on a real test (used to prioritise weak spots). */
window.DOMAINS = {
  cs:   { id: 'cs',   sec: 'rw',   name: 'Craft and Structure',          short: 'Craft & Structure', w: 0.28 },
  ii:   { id: 'ii',   sec: 'rw',   name: 'Information and Ideas',        short: 'Info & Ideas',      w: 0.26 },
  sec:  { id: 'sec',  sec: 'rw',   name: 'Standard English Conventions', short: 'Grammar',           w: 0.26 },
  eoi:  { id: 'eoi',  sec: 'rw',   name: 'Expression of Ideas',          short: 'Expression',        w: 0.20 },
  alg:  { id: 'alg',  sec: 'math', name: 'Algebra',                      short: 'Algebra',           w: 0.35 },
  adv:  { id: 'adv',  sec: 'math', name: 'Advanced Math',                short: 'Advanced Math',     w: 0.35 },
  psda: { id: 'psda', sec: 'math', name: 'Problem-Solving and Data Analysis', short: 'Data & Stats', w: 0.15 },
  geo:  { id: 'geo',  sec: 'math', name: 'Geometry and Trigonometry',    short: 'Geometry & Trig',   w: 0.15 }
};

window.SKILLS = [
  // ---- Reading & Writing ----
  { id: 'wic', dom: 'cs', sec: 'rw', name: 'Words in Context', w: 0.50,
    tip: 'Cover the blank and predict a word first. Hunt for the clue words (contrast: "although", "yet"; support: "because", "for example"). Pick the choice that fits the tone and precise meaning, not just the one that sounds smart.' },
  { id: 'tsp', dom: 'cs', sec: 'rw', name: 'Text Structure and Purpose', w: 0.30,
    tip: 'Summarise what each sentence DOES (introduces, challenges, gives an example, concludes) rather than what it says. Wrong choices usually get one sentence\'s job wrong or claim too much.' },
  { id: 'ctc', dom: 'cs', sec: 'rw', name: 'Cross-Text Connections', w: 0.20,
    tip: 'Summarise Text 1\'s claim in 5 words, then Text 2\'s. Ask: does Text 2 agree, qualify, or challenge? Answer from the second author\'s point of view.' },
  { id: 'cid', dom: 'ii', sec: 'rw', name: 'Central Ideas and Details', w: 0.35,
    tip: 'The right answer is supported by the text word-for-word or as a close paraphrase. Eliminate choices that are too broad, too extreme ("always", "never"), or true in real life but not stated.' },
  { id: 'coe', dom: 'ii', sec: 'rw', name: 'Command of Evidence', w: 0.40,
    tip: 'Match the claim to the evidence precisely. For data questions, read the chart title and axes first, then check every part of the claim against the numbers, not just the trend.' },
  { id: 'inf', dom: 'ii', sec: 'rw', name: 'Inferences', w: 0.25,
    tip: 'Pick the smallest logical step that must be true given the text. If you need an outside assumption, it is wrong.' },
  { id: 'bnd', dom: 'sec', sec: 'rw', name: 'Boundaries (punctuation)', w: 0.50,
    tip: 'Find the independent clauses (full sentences). Two of them need a period, semicolon, or comma + FANBOYS. A colon needs a full sentence BEFORE it. Never put a single comma between a subject and its verb.' },
  { id: 'fss', dom: 'sec', sec: 'rw', name: 'Form, Structure, and Sense', w: 0.50,
    tip: 'Find the real subject (ignore phrases in between) and check verb agreement, tense consistency, pronoun clarity, and modifiers. A modifier at the start of a sentence must describe the noun right after the comma.' },
  { id: 'rs',  dom: 'eoi', sec: 'rw', name: 'Rhetorical Synthesis', w: 0.55,
    tip: 'Reread the GOAL in the question first. Choose the sentence that uses only the notes needed for that goal, no more, no less.' },
  { id: 'trn', dom: 'eoi', sec: 'rw', name: 'Transitions', w: 0.45,
    tip: 'Name the relationship between the two sentences: same direction (also, moreover), opposite (however, in contrast), cause (therefore), example (for instance), or sequence (then, finally). Then choose.' },
  // ---- Math: Algebra ----
  { id: 'lin1', dom: 'alg', sec: 'math', name: 'Linear equations in one variable', w: 0.25,
    tip: 'Do the same operation to both sides. Watch for "no solution" (variables cancel, constants differ) and "infinitely many" (both sides identical).' },
  { id: 'lin2', dom: 'alg', sec: 'math', name: 'Linear equations and functions', w: 0.30,
    tip: 'Slope-intercept: y = mx + b. m is the change in y per 1 unit of x; b is the starting value. In word problems, label what each of m and b means.' },
  { id: 'sys',  dom: 'alg', sec: 'math', name: 'Systems of linear equations', w: 0.25,
    tip: 'Use elimination when coefficients line up, substitution when one variable is isolated. No solution = parallel lines (same slope, different intercept).' },
  { id: 'ineq', dom: 'alg', sec: 'math', name: 'Linear inequalities', w: 0.20,
    tip: 'Flip the inequality sign when multiplying or dividing by a negative. "At least" means ≥, "at most" means ≤.' },
  // ---- Math: Advanced ----
  { id: 'equiv', dom: 'adv', sec: 'math', name: 'Equivalent expressions', w: 0.30,
    tip: 'Factor, expand, or combine like terms. Test with a number: plug x = 2 into the original and each choice.' },
  { id: 'nl',    dom: 'adv', sec: 'math', name: 'Nonlinear equations and systems', w: 0.40,
    tip: 'Quadratics: factor, use the quadratic formula, or check the discriminant (b² − 4ac) for the number of solutions. Always check for extraneous solutions with radicals or fractions.' },
  { id: 'nlf',   dom: 'adv', sec: 'math', name: 'Nonlinear functions', w: 0.30,
    tip: 'Vertex form a(x − h)² + k shows the vertex (h, k). Exponential: y = a·bˣ, b > 1 is growth, 0 < b < 1 is decay. Use Desmos to graph when stuck.' },
  // ---- Math: PSDA ----
  { id: 'ratio', dom: 'psda', sec: 'math', name: 'Ratios, rates, and units', w: 0.20,
    tip: 'Write units next to every number and make them cancel. Set up proportions with matching units on top and bottom.' },
  { id: 'pct',   dom: 'psda', sec: 'math', name: 'Percentages', w: 0.18,
    tip: 'Percent change = (new − old) ÷ old. Increase by p% means multiply by (1 + p/100). Percent "of" means multiply.' },
  { id: 'uni',   dom: 'psda', sec: 'math', name: 'One-variable data', w: 0.16,
    tip: 'Mean is pulled by outliers; median is not. Standard deviation measures spread. Adding a value equal to the mean leaves the mean unchanged.' },
  { id: 'bi',    dom: 'psda', sec: 'math', name: 'Two-variable data and models', w: 0.18,
    tip: 'In a line of best fit, the slope is the predicted change in y per +1 in x; the intercept is the prediction when x = 0. Predictions inside the data range are more trustworthy than outside.' },
  { id: 'prob',  dom: 'psda', sec: 'math', name: 'Probability', w: 0.14,
    tip: 'Probability = favourable ÷ total. For conditional probability, shrink the "total" to only the group in the condition.' },
  { id: 'infer', dom: 'psda', sec: 'math', name: 'Inference and statistical claims', w: 0.14,
    tip: 'Only generalise to the population the sample was randomly drawn from. A margin of error gives a plausible range. Association is not causation unless it was a randomised experiment.' },
  // ---- Math: Geometry ----
  { id: 'area',  dom: 'geo', sec: 'math', name: 'Area and volume', w: 0.30,
    tip: 'Write the formula, then plug in. Volume of a cylinder = πr²h; sphere = (4/3)πr³; cone = (1/3)πr²h. Scale factor k multiplies lengths by k, areas by k², volumes by k³.' },
  { id: 'lines', dom: 'geo', sec: 'math', name: 'Lines, angles, and triangles', w: 0.30,
    tip: 'Triangle angles sum to 180°. Parallel lines + transversal give equal or supplementary angles. Similar triangles have proportional sides. Use the Pythagorean theorem for right triangles.' },
  { id: 'trig',  dom: 'geo', sec: 'math', name: 'Right triangles and trigonometry', w: 0.20,
    tip: 'SOH-CAH-TOA. sin(θ) = cos(90° − θ). Common triples: 3-4-5, 5-12-13, 8-15-17, and the 30-60-90 and 45-45-90 ratios.' },
  { id: 'circ',  dom: 'geo', sec: 'math', name: 'Circles', w: 0.20,
    tip: 'Equation: (x − h)² + (y − k)² = r². Arc length = (θ/360) · 2πr; sector area = (θ/360) · πr². Radians: arc = rθ.' }
];

window.SKILL_BY_ID = Object.fromEntries(SKILLS.map(s => [s.id, s]));
window.skillsOf = sec => SKILLS.filter(s => !sec || s.sec === sec);
