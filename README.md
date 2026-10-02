## Fundi

Fundi connects local workers with nearby job opportunities. The app includes a demo sign-in, job search and category filters, job posting, multi-person expressions of interest, employer notifications, and a personal activity view.

### Run locally

Run `npm run dev` and open [http://localhost:4173](http://localhost:4173). The static server uses Node.js built-ins and requires no package installation.

Without backend credentials, use any valid email address and a password of at least 6 characters to enter local demo mode. Demo sign-ins and job changes are only stored in that browser and are not real accounts or shared with other users.

### Connect shared accounts and jobs

The frontend supports Supabase so it can stay on a static Netlify or Vercel deployment while accounts, jobs, applications, and employer notifications use shared storage.

1. Create a Supabase project and run `supabase/schema.sql` in its SQL Editor.
2. Set the project's allowed authentication redirect URLs to include the deployed Fundi URL.
3. Copy the project URL and public anon key from Supabase project settings into `backend-config.js` as `supabaseUrl` and `supabaseAnonKey`.
4. Redeploy the frontend. New users register with their name, email, mobile phone, and password; Supabase may require email confirmation before sign-in.

Do not deploy real user accounts until the schema is applied and valid project credentials are configured. An empty config deliberately keeps the app in local demo mode.

Only use the public anon key in this file. Never put a Supabase service-role key in frontend code. Row-level security in the schema limits job management to job owners and applicant details to the applicant and that job's owner.

If Supabase is not configured, Fundi seeds example jobs and uses browser storage for demo data. The optional legacy local API can also be run with `json-server --watch db.json` at `http://localhost:3000/jobs`.

### Notes

This is a front-end prototype, not production authentication. Do not use real passwords or sensitive data. For a production release, connect sign-in and job ownership to a secured backend.

Author: Allan Kimani