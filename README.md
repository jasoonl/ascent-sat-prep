# Ascent SAT & PSAT Prep

A free, private, no-backend SAT practice site, with PSAT/NMSQT practice and National Merit tools. The SAT is the main focus. Everything runs in the browser; progress is saved in `localStorage` per student.

## Features
- Profiles for several students (sibling-friendly) + a parent view with a printable report
- Diagnostic (27 or 54 questions) → per-skill mastery for all 27 Digital-SAT skills, weak-spot ranking, pace/rushing insights
- Adaptive practice (difficulty follows mastery), tutor mode with explanations and skill tips, optional timer
- Full-length adaptive tests (2×27 R&W, break, 2×22 Math; Module 2 routes harder/easier), section tests, mini-tests, extended-time option, Desmos calculator + reference sheet, question navigator, mark-for-review, answer elimination
- Mistake notebook with spaced repetition (1/3/7/14/30 days)
- Study plan from target score, test date and daily minutes
- Real score history: enter results from the SAT, PSAT/NMSQT, PSAT 10 or PSAT 8/9. They set the starting difficulty, fill the gap-to-goal before practice data exists, and appear on the progress chart
- Exam focus: SAT (200-800 sections, 400-1600 total) or PSAT/NMSQT / PSAT 10 (160-760 sections, 320-1520 total), with a slightly easier practice mix on the PSAT scale
- Scholarship page: National Merit Selection Index calculator, state cutoff target, and a plain-language guide to the program (figures sourced from nationalmerit.org; cutoffs are unofficial reports and change every year)
- ~230 hand-written original questions, plus generators that build new questions on demand:
  - Math: 121 templates across all 17 math skills (over 180,000 distinct questions in a 40,000-per-skill sample)
  - Reading and Writing: 18 templates for Boundaries; Form, Structure, and Sense; Transitions; Rhetorical Synthesis; quantitative Command of Evidence (over 138,000 distinct in the same sample)
  - Generated questions are computed, not stored, so the site stays small. Words in Context, Central Ideas, Inferences, Text Structure and Cross-Text questions are hand-written only.
- Skills grouped under the eight official content domains, shared by the SAT, PSAT/NMSQT and PSAT 10, with each exam's question counts
- Real score history with the details printed on College Board score reports: score ranges, grade, and the 1 to 7 knowledge and skills bands. Shows improvement between tests, PSAT/NMSQT benchmarks, and starts practice from the weakest bands
- Import your own question packs (JSON) or generate extra questions with your own AI key (optional)
- Optional cloud accounts (email and password, or an emailed sign-in link), one per student, so progress follows them between devices. Off until you set it up: see [docs/ACCOUNTS.md](docs/ACCOUNTS.md)
- Light/dark theme, keyboard accessible, works on phones, installable/offline after first load

## Run locally
    python3 -m http.server 8000     # then open http://localhost:8000

## Hosting
The site is plain static files, so it needs **no server of its own**. It is hosted on GitHub Pages. Cloud accounts (optional) use Supabase as a managed backend, which also needs no server from you.

## Host for free (any static host)
- **Vercel / Netlify / Cloudflare Pages**: drag-and-drop this folder (no build step).
- **GitHub Pages**: push the folder to a repo, Settings → Pages → deploy from branch.

Progress is stored per browser/device. Use Settings → *Download backup* to move it between devices.

## Adding questions
Edit `js/bank-rw*.js` / `js/bank-math.js` (rows: `[skill, difficulty, passage, question, correct, [3 wrong], explanation]`, correct answer first), or use Settings → *Import question pack*. Run `node tests/gen-check.js`, `node tests/rw-gen-check.js` and `node tests/bank-check.js` after changing questions or generators, and `node tests/scores-check.js` after changing score scales.

## Notes on scoring
The SAT, PSAT/NMSQT, PSAT 10 and PSAT 8/9 report scores on one shared vertical scale, so a PSAT 1100 means the same as an SAT 1100; the PSATs simply top out lower (760 per section for the PSAT/NMSQT and PSAT 10, 720 for PSAT 8/9). Earlier versions of this app added 40 points per section when converting, which was wrong and has been removed. Domain weights follow the College Board test specifications: Reading and Writing is the same on every test; on Math the SAT weights Algebra and Advanced Math 35% each and the other two domains 15% each, while the PSAT/NMSQT and PSAT 10 use 35%, 32.5%, 20% and 12.5%. The Selection Index is (2 x Reading & Writing + Math) / 10 on PSAT-scale section scores; your official index is on your PSAT/NMSQT score report.

SAT is a registered trademark of the College Board, which is not affiliated with this project. All questions are original.
