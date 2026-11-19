# RUET CSE '25 Portal 🎓

A dedicated web platform designed for the students of the Computer Science & Engineering department (25 series) at Rajshahi University of Engineering & Technology (RUET).

---

## 📌 Features
- 🧑‍🎓 **Student Directory:** Browse classmates across Sections A, B, and C.
- 🔎 **Directory Search:** Find students by name or roll number.
- 🔐 **Student Accounts:** Students verify their email once, set a password, and log in with roll number and password.
- 📚 **Student Resources:** Quick access to the CSE student resources archive.
- 🖼️ **Profile Photos:** Open student photos in an accessible larger-view dialog.
- ☎️ **Quick Contact:** Open phone numbers in the device dialer and WhatsApp numbers in WhatsApp.
- 🌙 **Dark Mode:** Switch between light and dark themes with the persistent navigation toggle.
- 🛡️ **Admin Workspace:** Authorized administrators can add, update, and remove student profiles.
- 📱 **Responsive Design:** A consistent slate-and-mint interface for desktop and mobile.

---

## 🛠️ Tech Stack
- **Framework:** Next.js (App Router, Turbopack)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database & Auth & Storage:** Google Firebase (Cloud Firestore, Firebase Auth, Cloud Storage)
- **Deployment:** Vercel

---

## 🔐 Authentication & Database

The portal uses **Google Firebase**:
- **Authentication:** Supports 1-click **"Continue with Google"** and Roll Number / Email authentication for students and administrators.
- **Database (Cloud Firestore):** Schema-less NoSQL document store with instant writes and zero manual SQL migrations.
- **Storage (Cloud Storage):** 5 GB free storage for optimized student profile photos with client-side canvas compression and server-side magic byte validation.

For the complete setup or migration instructions, see [FIREBASE_SETUP_AND_MIGRATION_GUIDE.md](FIREBASE_SETUP_AND_MIGRATION_GUIDE.md).

---

## 🤖 CSE ’25 Telegram Resources Bot

The bot is dedicated to course resources. Students can browse by semester
(1-1 through 4-2), then by CT questions, semester final questions, handnotes,
or books. CT questions are further grouped into CT 1-4. Authorized resource
managers upload from a private Telegram chat using `/upload`; the bot prompts
for each label, title, and document. `/cancel` stops an upload. Files are kept
by Telegram and referenced by `file_id`; this app does not proxy or store file
contents.

1. Create the bot with Telegram’s `@BotFather` and keep its token private.
2. Run `supabase/migrations/20261003230000_telegram_resource_bot.sql` in the
   production Supabase SQL Editor.
3. Add these server-only variables to the `ruet-cse-25` Vercel project:
   `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET` (a random 32-256 character
   value using Telegram’s allowed letters, digits,
   `_`, or `-`), and
   `TELEGRAM_ADMIN_USER_IDS` (comma-separated numeric Telegram user IDs allowed
   to upload). The bot will remain browse-only if no uploader IDs are set.
   Never expose the bot token or webhook secret in a `NEXT_PUBLIC_` variable.
4. Deploy the app, then register its webhook from a trusted shell where the
   token and secret are already set:

   ```sh
   curl --fail-with-body "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
     --data-urlencode "url=https://ruetcse25.vercel.app/api/telegram/webhook" \
     --data-urlencode "secret_token=${TELEGRAM_WEBHOOK_SECRET}" \
     --data-urlencode 'allowed_updates=["message","callback_query"]'
   ```

The webhook validates Telegram’s secret-token header, ignores group chats,
and restricts uploads to the configured uploader IDs. Students can browse and
receive files in private chat without signing in to the website.

## 🗄️ Firebase Setup & Migration

Everything you need to configure a new Firebase project or migrate an existing Supabase instance is documented in [FIREBASE_SETUP_AND_MIGRATION_GUIDE.md](FIREBASE_SETUP_AND_MIGRATION_GUIDE.md).

- **Automated Migration Script:** If you have existing data in Supabase, run `node scripts/migrate-from-supabase.mjs` to automatically transfer all profiles, student accounts, submissions, telegram resources, and avatars to Firebase.
- **Rules Deployment:** Security rules are configured in `firestore.rules` and `storage.rules`.
- **Avatar Pruning:** Clean up orphaned storage objects with `node scripts/prune-avatars.mjs`.

---

---

## 🚀 Getting Started

Follow these steps to run the project locally:

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/arghoghosh0712-commits/ruet-cse-25-portal.git](https://github.com/arghoghosh0712-commits/ruet-cse-25-portal.git)
