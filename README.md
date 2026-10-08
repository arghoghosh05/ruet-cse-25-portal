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
- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Deployment:** Vercel

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

## 🗄️ Database Migration

To enable student self-submissions and roll-number/password accounts, run
`supabase/migrations/20261002020000_student_self_submissions.sql`, followed by
`supabase/migrations/20261002030000_student_roll_password_accounts.sql`, in the
Supabase SQL Editor. In Supabase Authentication, enable the Email provider and
enable new user signups, and set the Site URL to
`https://ruetcse25.vercel.app`. Configure a custom SMTP provider under
**Supabase Dashboard → Authentication → SMTP Settings**. Supabase’s default
sender is restricted to project-team email addresses and is rate-limited.
Under **Authentication → Email Templates → Confirm signup**, include
`{{ .Token }}` in the message so students can enter the email OTP on the
portal. The account flow accepts 6–8 digit codes and verifies the OTP directly rather than following an
email link, avoiding one-time link scanners and cross-browser PKCE issues.
Students request access with their roll number and email, enter the emailed
code, then set their own password. They log in with roll number and password;
passwords are never sent by email. Students can log in immediately after email
verification and password setup; account claims do not require admin approval.
Profile submissions still require a separate admin review before publishing.
Submissions include the complete directory profile fields: nickname, district,
phone and WhatsApp numbers, blood group, Facebook link, and optional photo.
The verified email, roll, and section are tied to the account rather than
editable form fields. After profile approval, students can edit only their own
profile from the same page. Profile information stays private until approved,
and verification emails are never published.

After the roll/password account migration, also run
`supabase/migrations/20261002040000_student_complete_profiles.sql` to enable
complete student profiles and owner-only profile editing. Then run
`supabase/migrations/20261002050000_remove_student_account_approval.sql` to
remove account-claim approval and immediately enable roll/password login after
email verification and password setup. Profile submissions remain subject to
admin approval. For existing directory profiles, an admin must link ownership
to the matching verified email before that account can edit the existing data.
Then run `supabase/migrations/20261002060000_student_own_profile_read.sql` so
students can load their own linked profile without an admin session; other
students cannot read it through authenticated access.
The profile-read migration does not remove account-claim approval; migration
`20261002050000_remove_student_account_approval.sql` must also be applied.
Run `supabase/migrations/20261003010000_admin_delete_shared_profiles.sql` to
allow authorized admins to delete any directory profile, including records
created by a different admin.

Set the server-only Vercel environment variable `SUPABASE_SERVICE_ROLE_KEY`
for the environments where students log in. This allows the server to securely
map a roll number to its verified account email; never prefix it with
`NEXT_PUBLIC_` or expose it to the browser.

Before deploying student email and blood-group fields, run
`supabase/migrations/20260930010000_add_student_email_and_blood_group.sql`
in the Supabase SQL Editor for the project used by this site. Both fields are
optional; values provided for them appear in the public section directory.

To support optional student nicknames in the admin forms and public directory,
also run `supabase/migrations/20261002000000_add_student_nickname.sql` in that
same Supabase project before deploying the nickname-enabled application.

For admin access controls and directory performance, also run
`supabase/migrations/20260930020000_admin_authorization_and_directory_performance.sql`.
Run `supabase/migrations/20260930030000_shared_admin_student_records.sql` to
allow authorized admins to view and manage records created by former admins.
Run `supabase/migrations/20260930040000_admin_database_allowlist.sql` to
enforce the admin allowlist directly in Supabase. Removing an email from
`private.admin_allowlist` revokes database access immediately, including for
already-issued JWTs. Add and remove admins in that table and keep it aligned
with the server-only Vercel `ADMIN_EMAILS` variable.
Set the server-only Vercel environment variable `ADMIN_EMAILS` to the comma-separated
addresses allowed to sign in as administrators. For each approved Supabase Auth
user, set the immutable `app_metadata` field `role` to `admin` in Supabase Auth
user management; do not use editable `user_metadata` for authorization. After
changing app metadata, have the user sign out and back in so the new role is
included in their token. The database allowlist migration also grants that role
to the seven initially configured admin email addresses that already exist.

Run `supabase/migrations/20261002010000_set_avatar_upload_limit_15mb.sql` in the
Supabase SQL Editor to raise the avatar bucket limit. Images are uploaded
directly to Supabase Storage, avoiding Vercel's function request-body limit, and
are restricted to PNG, JPEG, and WebP files up to 15 MB.

The public directory query is cached for five minutes and invalidated after
student changes. Admins must provide a phone number and either a separate
WhatsApp number or confirm that both numbers are the same. A large traffic burst still depends on the Vercel and Supabase plans,
regional capacity, and database limits; it requires load testing against those
specific production quotas before a 100,000-visitor guarantee can be made.

---

## 🚀 Getting Started

Follow these steps to run the project locally:

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/arghoghosh0712-commits/ruet-cse-25-portal.git](https://github.com/arghoghosh0712-commits/ruet-cse-25-portal.git)
