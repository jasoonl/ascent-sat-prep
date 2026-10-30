# Ascent SAT Prep

A free, private, no-backend SAT practice site. Everything runs in the browser; progress is saved in `localStorage` per student.

## Features
- Profiles for several students (sibling-friendly) + a parent view with a printable report
- Diagnostic (27 or 54 questions) → per-skill mastery for all 27 Digital-SAT skills, weak-spot ranking, pace/rushing insights
- Adaptive practice (difficulty follows mastery), tutor mode with explanations and skill tips, optional timer
- Full-length adaptive tests (2×27 R&W, break, 2×22 Math; Module 2 routes harder/easier), section tests, mini-tests, extended-time option, Desmos calculator + reference sheet, question navigator, mark-for-review, answer elimination
- Mistake notebook with spaced repetition (1/3/7/14/30 days)
- Study plan from target score, test date and daily minutes
- ~230 hand-written original questions + 60 procedural math generators (unlimited variants)
- Import your own question packs (JSON) or generate extra questions with your own AI key (optional)
- Light/dark theme, keyboard accessible, works on phones, installable/offline after first load

## Run locally
    cd sat-prep && python3 -m http.server 8000     # then open http://localhost:8000

## Host for free (any static host)
- **Vercel / Netlify / Cloudflare Pages**: drag-and-drop this folder (no build step).
- **GitHub Pages**: push the folder to a repo, Settings → Pages → deploy from branch.

Progress is stored per browser/device. Use Settings → *Download backup* to move it between devices.

## Adding questions
Edit `js/bank-rw*.js` / `js/bank-math.js` (rows: `[skill, difficulty, passage, question, correct, [3 wrong], explanation]`, correct answer first), or use Settings → *Import question pack*. Run `node tests/gen-check.js` after changing generators.

SAT is a registered trademark of the College Board, which is not affiliated with this project. All questions are original.
