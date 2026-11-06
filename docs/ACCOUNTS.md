# Turning on cloud accounts

Accounts are **off by default**. The site works exactly as before (progress saved in the browser) until you finish the steps below. Nothing breaks if you never do.

With accounts on, each student signs in with their own email and their progress follows them between phone, laptop and school computer. Sign-in uses [Supabase](https://supabase.com) (a hosted database with built-in sign-in). You do not run any servers: the site stays on GitHub Pages and Supabase hosts the accounts and data.

## Setup (about 20 minutes)

1. **Create a project.** Make a free Supabase account and a new project. Pick a region near you.
2. **Create the table.** In the dashboard open *SQL Editor*, paste the whole of `supabase/schema.sql`, and press *Run*. This creates one table where each student can read and change only their own row, plus a function that lets a student delete their own account.
3. **Tell Supabase your site address.** *Authentication > URL Configuration*: set *Site URL* to your site, for example `https://YOUR-USER.github.io/ascent-sat-prep/`, and add the same address under *Redirect URLs* (exact match, including the trailing slash). Emailed links only work for addresses on this list.
4. **Choose how email is handled** (read the next section first).
5. **Add the keys.** *Project Settings > API*: copy the *Project URL* and the *anon public* key into `js/config.js`. The anon key is meant to be public. **Never** put the `service_role` key anywhere in this repository.
6. **Publish.** Commit and push `js/config.js`. When GitHub Pages finishes deploying, a *Sign in* button appears in the sidebar and on the welcome page.

## Email: read this before you invite anyone

Supabase's built-in email sender is for testing only. It delivers **only to people on your Supabase project team**, and is limited to about 2 emails per hour. That means confirmation emails, magic links and password-reset emails will **not reach students** until you connect your own email-sending service.

You have two options:

- **Connect your own SMTP service** (*Project Settings > Authentication > SMTP*). Several email services offer free tiers; check each one's current limits. Turn off link tracking at your email provider, because it can break the links. This makes confirmation emails, magic links and password resets all work.
- **Skip email for now.** Under *Authentication > Providers > Email*, turn *Confirm email* off. Students can then create an account and sign in with email and password straight away. The trade-off: nobody proves they own the address, and magic links and password resets will not work (the app shows "Emails are not set up for this site yet" and tells students to use their password).

## What is stored, and who can see it

- Supabase stores each student's email and a hashed password. This app never sees or stores passwords.
- One row per student holds their profile: name, grade, goals, real scores, practice history and mistake notebook. Past full-test detail is slimmed before upload to keep the row small.
- A student's AI key (if they set one) is **not** uploaded. An unfinished test session is **not** uploaded.
- Row Level Security means a signed-in student can only read and write their own row. Test this yourself after setup (see the checklist).
- Students can delete their own account and cloud data in *Settings*.
- If you offer this to anyone besides your own family, you are responsible for how the data is handled. Students under 13 should have a parent create the account. Check the privacy rules that apply to you (for example COPPA in the US). This is a note, not legal advice.

## Things to know

- **Free projects pause.** Supabase pauses a free project after about a week with little activity. Data is kept and you can restore it from the dashboard. A paused project means sign-in fails until restored. Paid plans do not pause.
- **Magic links** must be opened in the same browser where they were requested.
- **Shared computers.** Signing out offers to remove the student's progress from that device. Choose that on any computer other people use.
- **Parent view** shows the student profiles saved on the device you are using. With one account per student, it cannot yet show another account's progress from your own login.
- **Backups.** *Settings > Download backup* still works and is worth doing now and then.

## Test checklist (do this once with real Supabase)

The automated tests in `tests/` use a built-in stand-in for Supabase, so they cannot prove your real project is set up correctly. Check these by hand:

1. Create an account with email and password. Confirm you land on the welcome page, then create a profile and answer a few questions.
2. In Supabase *Table Editor*, open `student_data` and confirm there is one row for your user.
3. On a second device or private window, sign in with the same email and password. Your profile and progress should appear.
4. Create a second account. Confirm it **cannot** see the first account's progress.
5. Request a magic link (needs SMTP) and open it in the same browser.
6. Sign out choosing *remove from this device*, then sign back in and confirm everything returns.
7. Delete the test account in *Settings* and confirm its row disappears from `student_data`.
