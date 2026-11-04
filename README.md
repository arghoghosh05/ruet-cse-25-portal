# RUET CSE '25 Portal

The portal provides a public student directory, student profile enrollment and
editing, administrator review, and a Telegram-based course-resource archive.
The interface is built with Next.js App Router, React, TypeScript, and Tailwind
CSS. Student accounts use Firebase Google sign-in; passwords are not migrated.

## Firebase setup

1. Create or select a Firebase project. Enable Google under **Authentication →
   Sign-in method**, create a Firestore database, and create a Storage bucket.
2. Copy `.env.local.example` to `.env.local` for local development. Set all
   `NEXT_PUBLIC_FIREBASE_*` values from the Firebase web app configuration.
3. Configure Firebase Admin credentials on the server. Use Application Default
   Credentials where available, or set `FIREBASE_SERVICE_ACCOUNT_JSON`, or set
   `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY`. These credentials must
   never be prefixed with `NEXT_PUBLIC_` or exposed to the browser.
4. Set `ADMIN_EMAILS` to a comma-separated allowlist of administrator email
   addresses. Admin access is checked on the server for every protected page
   and action.
5. Deploy the portal on Vercel (or another Next.js-compatible host), set the
   environment variables for each deployment environment, and add the deployed
   domain to Firebase Authentication's authorized domains.
6. Deploy the restrictive Firebase rules and indexes from the repository root:

   ```sh
   firebase deploy --only firestore:rules,firestore:indexes,storage
   ```

The root portal accesses Firestore using Firebase Admin on the server; direct
client reads and writes are denied by `firestore.rules`. Profile photos are
uploaded to the signed-in student's `avatars/{uid}/` Storage path and are
validated again by the server before use. Admin review and student enrollment
are server-authorized.

Avatar pruning is a separate, explicit maintenance task. With Firebase Admin
credentials and the project ID and Storage bucket configured in the shell, run
`npm run prune:avatars` to list objects that are not referenced by any profile
or pending submission. Review the dry-run output before using
`npm run prune:avatars -- --delete`; only files matching the generated
`avatars/{uid}/{uuid}.{jpg|jpeg|png|webp}` naming scheme are eligible, and
unrecognized objects stop the operation.

Google sign-in is a new enrollment flow. Existing passwords and Supabase Auth
accounts are not transferred. Existing directory records can be imported and
then linked to a student's newly verified Google account by matching the
verified email. Do not delete the old Supabase project or its data until an
export, import, and application-level verification have been completed.

### Importing existing records

The migration utility accepts a local JSON export. In the Supabase SQL Editor,
export each table with a query such as
`select coalesce(json_agg(t), '[]'::json) from public.profiles t;` and combine
the results in this shape:

```json
{
  "profiles": [],
  "student_submissions": [],
  "telegram_resources": []
}
```

Save the export locally and keep it private; it contains student information.
With Firebase Admin credentials available in the shell, validate it first, then
explicitly apply it:

```sh
npm run import:supabase-export -- ./supabase-export.json
npm run import:supabase-export -- ./supabase-export.json --apply
```

The default is a dry run. The import is additive and idempotent: existing
Firestore documents are not overwritten, duplicate rolls stop the import, and
pending submissions stay private until admin review. Legacy passwords and Auth
accounts are intentionally excluded; students sign in with Google and can
re-link a unique profile or pending submission using a verified matching email.
The import preserves old `image_url` references but does not copy image bytes
from Supabase Storage. Keep the old bucket accessible until images are migrated
separately and verified.

## Telegram resource bot

The bot lets students browse files by semester and category. Authorized
resource managers can upload Telegram documents in a private chat. The bot
stores Telegram `file_id` references and metadata in Firestore; file contents
remain with Telegram.

Set `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET` (32-256 characters), and
`TELEGRAM_ADMIN_USER_IDS` (comma-separated numeric Telegram user IDs) as
server-only environment variables. After deploying, register the webhook from
a trusted shell:

```sh
curl --fail-with-body "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
  --data-urlencode "url=https://YOUR_DEPLOYED_HOST/api/telegram/webhook" \
  --data-urlencode "secret_token=${TELEGRAM_WEBHOOK_SECRET}" \
  --data-urlencode 'allowed_updates=["message","callback_query"]'
```

Never put the bot token or webhook secret in a `NEXT_PUBLIC_` variable. The
webhook validates Telegram's secret-token header, accepts private-chat
interactions only, and restricts uploads to the configured Telegram user IDs.

## Local development

Use Node.js 22.12 or newer. Firebase Admin's JWKS dependency requires the
Node.js ESM interoperability available in supported runtime versions.

```sh
npm install
npm run dev
```

The separate `hub-app/` directory is an independent Next.js prototype. Its
pages still use explicitly labeled demo data and local-only admin controls; it
is not the production data interface for this portal. Deploy that application
with a Next.js host such as Vercel, not Firebase Hosting's static-file rewrite.
