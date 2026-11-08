# RUET CSE '25 Hub

Standalone, mobile-first student hub prototype. This app is isolated in
`hub-app/`; it does not share the root portal's student directory or profile
records.

## Current status

- Includes a dashboard, sample notices, weekly routine, academic work, course/teacher cards, a searchable sample directory, and an admin workspace preview.
- All displayed names, contact details, courses, notices, rooms, and schedules are fictional examples.
- Firebase Google sign-in is wired, and user profile/notification preference
  documents are owner-restricted by `firestore.rules`.
- Notices, routines, academic tasks, and directory pages still read fictional
  demo data. Admin controls are local-only previews and do not publish or
  persist changes.
- The notice-email Cloud Function queues messages only for users who explicitly
  enable email notifications. Configure `APP_URL` in
  `hub-app/functions/.env` as the deployed HTTPS origin before deploying the
  function.
- The PWA manifest is included. This prototype does not provide offline data or push notifications.

## Run locally

```bash
cd hub-app
npm install
npm run dev
```

Open `http://localhost:3000`. Build for production with `npm run build`, then run with `npm start`.

The existing student portal remains at the repository root. Deploy this app
with a Next.js host such as Vercel; Firebase Hosting's static rewrite is not
configured. Firebase Firestore rules and Functions can be deployed from this
directory with `firebase deploy --only firestore:rules,functions` after
selecting the correct Firebase project.
