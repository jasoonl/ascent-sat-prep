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
- ~230 hand-written original questions + 60 procedural math generators (unlimited variants)
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
Edit `js/bank-rw*.js` / `js/bank-math.js` (rows: `[skill, difficulty, passage, question, correct, [3 wrong], explanation]`, correct answer first), or use Settings → *Import question pack*. Run `node tests/gen-check.js` after changing generators, and `node tests/scores-check.js` after changing score scales.

## Notes on scoring
PSAT scores are converted to an approximate SAT equivalent by adding 40 points per section (80 for PSAT 8/9). These are rough guides, not official concordance tables. The Selection Index is (2 x Reading & Writing + Math) / 10 on PSAT-scale section scores; your official index is on your PSAT/NMSQT score report.

SAT is a registered trademark of the College Board, which is not affiliated with this project. All questions are original.
