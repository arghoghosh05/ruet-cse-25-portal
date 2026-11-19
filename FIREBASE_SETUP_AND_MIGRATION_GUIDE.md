# 🚀 Firebase Setup & Migration Guide

This guide walks you through setting up a **new Firebase project from scratch** or **migrating your existing Supabase database and storage** to Google Firebase.

---

## Part 1: Setting Up a Brand New Firebase Project

Follow these steps if you are starting fresh or setting up a new environment.

### 1. Create a Firebase Project
1. Navigate to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** (or **Create a project**).
3. Name your project (e.g. `ruet-cse-25`).
4. (Optional) Google Analytics can be enabled or disabled as preferred. Click **Create project**.

---

### 2. Register Your Web App
1. On the Project Overview page, click the **Web** icon (`</>`) to add an app.
2. Give your app a nickname (e.g., `RUET CSE 25 Portal`).
3. Click **Register app**.
4. You will see a `firebaseConfig` object with keys like:
   * `apiKey`
   * `authDomain`
   * `projectId`
   * `storageBucket`
   * `messagingSenderId`
   * `appId`
5. Keep these handy for your `.env.local` file.

---

### 3. Enable Authentication (Google & Email/Password)
1. In the left navigation menu, go to **Build > Authentication**.
2. Click **Get started**.
3. Under the **Sign-in method** tab:
   * **Google**:
     * Click **Google** -> Toggle **Enable**.
     * Select your Project support email -> Click **Save**.
   * **Email/Password**:
     * Click **Email/Password** -> Toggle **Enable** -> Click **Save**.
4. Under the **Settings > Authorized domains** tab:
   * `localhost` is authorized by default.
   * When you deploy to production (e.g., `ruetcse25.vercel.app`), click **Add domain** and enter your production domain.

---

### 4. Enable Cloud Firestore Database
1. In the left navigation menu, go to **Build > Firestore Database**.
2. Click **Create database**.
3. Choose a Database Location (e.g., `asia-south1` Mumbai/Delhi or closest to your users).
4. For security rules, select **Start in production mode** -> Click **Create**.
5. *Note: Firestore is schema-less. You do not need to create any collections or tables manually; the app automatically creates them on first write.*

---

### 5. Enable Cloud Storage (For Student Photos)
1. In the left navigation menu, go to **Build > Storage**.
2. Click **Get started**.
3. Select **Start in production mode** -> Click **Next**.
4. Keep the default Cloud Storage location (matches Firestore) -> Click **Done**.

---

### 6. Generate Firebase Admin Private Key
1. Click the **Gear icon (⚙️)** next to *Project Overview* -> **Project settings**.
2. Go to the **Service accounts** tab.
3. Select **Node.js** and click **Generate new private key**.
4. A JSON file will download to your computer.
5. Note the following three fields from this JSON file:
   * `project_id`
   * `client_email`
   * `private_key`

---

### 7. Configure Environment Variables
Create a `.env.local` file in your project root:

```ini
# Firebase Client Configuration (From Step 2)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=ruet-cse-25.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=ruet-cse-25
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=ruet-cse-25.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1234567890
NEXT_PUBLIC_FIREBASE_APP_ID=1:1234567890:web:abcdef

# Firebase Admin SDK (From Step 6 JSON file)
FIREBASE_PROJECT_ID=ruet-cse-25
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@ruet-cse-25.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
FIREBASE_STORAGE_BUCKET=ruet-cse-25.firebasestorage.app

# Portal Administrators (Comma-separated admin emails)
ADMIN_EMAILS=arghoghosh0712@gmail.com,admin2@gmail.com

# Telegram Course Resources Bot (Optional)
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_WEBHOOK_SECRET=your-random-32-character-webhook-secret-token
TELEGRAM_ADMIN_USER_IDS=12345678,87654321
```

---

### 8. Apply Security Rules
In the project root, you will find:
* `firestore.rules`
* `storage.rules`

You can deploy them in two ways:
* **Option A (Firebase Console - Easiest)**:
  * Open Firestore in Firebase Console -> Click the **Rules** tab -> Paste contents of `firestore.rules` -> Click **Publish**.
  * Open Storage in Firebase Console -> Click the **Rules** tab -> Paste contents of `storage.rules` -> Click **Publish**.
* **Option B (Firebase CLI)**:
  ```bash
  npm install -g firebase-tools
  firebase login
  firebase use --add <your-project-id>
  firebase deploy --only firestore:rules,storage
  ```

---

## Part 2: Migrating from an Existing Supabase Project

If you already have data in Supabase (`profiles`, `student_accounts`, `student_submissions`, `telegram_resources`, and avatar photos in Supabase Storage), we have built an automated migration script.

### 1. Add Supabase Credentials to `.env.local`
Temporarily add your Supabase credentials to `.env.local`:
```ini
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJh...
```

### 2. Run the Migration Script
Run the automated migration command:
```bash
node scripts/migrate-from-supabase.mjs
```

### What this script does automatically:
1. **Profiles**: Fetches all rows from `profiles` in Supabase, normalizes data, and sets documents in Firestore `profiles/{roll}`.
2. **Student Accounts**: Fetches `student_accounts` and writes them to Firestore `student_accounts/{roll}`.
3. **Pending Submissions**: Fetches `student_submissions` and writes them to Firestore `student_submissions/{id}`.
4. **Telegram Resources**: Fetches `telegram_resources` and transfers them to Firestore `telegram_resources/{id}`.
5. **Avatars Transfer**: Downloads every student avatar from Supabase Storage, uploads it directly into Firebase Cloud Storage (`avatars/migrated/{roll}.jpg`), makes it public, and updates the Firestore profile URL seamlessly.

---

## Part 3: Deploying to Production (Vercel)

1. Push your repository to GitHub.
2. In the **Vercel Dashboard** -> Go to your project -> **Settings > Environment Variables**.
3. Add all the environment variables from your `.env.local`:
   * `NEXT_PUBLIC_FIREBASE_API_KEY`
   * `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   * `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   * `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   * `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   * `NEXT_PUBLIC_FIREBASE_APP_ID`
   * `FIREBASE_PROJECT_ID`
   * `FIREBASE_CLIENT_EMAIL`
   * `FIREBASE_PRIVATE_KEY`
   * `FIREBASE_STORAGE_BUCKET`
   * `ADMIN_EMAILS`
   * (Optional) `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, `TELEGRAM_ADMIN_USER_IDS`
4. Trigger a new deployment in Vercel.
5. Add your Vercel production URL (e.g., `ruetcse25.vercel.app`) to **Firebase Console > Authentication > Settings > Authorized domains**.

---

## Part 4: Maintenance & Pruning

To prune old orphaned avatar images from Firebase Storage that are no longer referenced by any profile or submission:
```bash
node scripts/prune-avatars.mjs
```
