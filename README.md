## Fundi

Fundi connects local workers with nearby job opportunities. The app includes a demo sign-in, job search and category filters, job posting, multi-person expressions of interest, employer notifications, and a personal activity view.

### Run locally

Run `npm run dev` and open [http://localhost:4173](http://localhost:4173). The static server uses Node.js built-ins and requires no package installation.

Use any valid email address and a password of at least 6 characters to enter the demo. The demo does not authenticate against a server; the session and offline job changes stay in the current browser.

By default, Fundi seeds a small set of example jobs and saves job changes in browser storage. A job stays listed as workers express interest, and its poster sees each applicant in Notifications. To use the existing JSON database instead, run `json-server --watch db.json` in a second terminal. When the API at `http://localhost:3000/jobs` is available, Fundi reads and writes jobs there.

### Notes

This is a front-end prototype, not production authentication. Do not use real passwords or sensitive data. For a production release, connect sign-in and job ownership to a secured backend.

Author: Allan Kimani