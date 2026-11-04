# RUET CSE '25 Hub — Firebase Setup Guide

## Prerequisites
- Node.js 20+
- Firebase CLI: `npm install -g firebase-tools`
- A Google/Firebase account

## 1. Create Firebase Project

1. Go to https://console.firebase.google.com
2. Click **Add project** → name it `ruet-cse-25-hub`
3. Disable Google Analytics (optional) → **Create project**

## 2. Enable Google Auth

1. In your project: **Authentication → Sign-in method**
2. Enable **Google** provider
3. Set your support email, save

## 3. Create Firestore Database

1. **Firestore Database → Create database**
2. Choose **Production mode** (rules are in `firestore.rules`)
3. Pick region: `asia-south1` (Mumbai, closest to Bangladesh)

## 4. Get Web App Config

1. **Project Settings → Your apps → Add app → Web**
2. Register the app, copy the config object
3. Copy `.env.local.example` → `.env.local` and paste values:

```bash
cp .env.local.example .env.local
# Edit .env.local with your Firebase config values
```

## 5. Deploy Firestore Rules

```bash
firebase login
firebase use --add   # select your project
firebase deploy --only firestore:rules
```

## 6. Install the Trigger Email Extension

1. Go to https://extensions.firebase.google.com
2. Search **"Trigger Email from Firestore"** → Install
3. Configure with your Gmail SMTP:
   - **SMTP URI**: `smtps://your-email@gmail.com:APP_PASSWORD@smtp.gmail.com:465`
   - Get Gmail App Password: Google Account → Security → 2-Step Verification → App passwords
   - **Mail collection**: `mail`
   - **Default from**: `RUET CSE '25 Hub <your-email@gmail.com>`
4. Click **Install extension**

## 7. Deploy Cloud Functions

```bash
cd functions
npm install
npm run build
cd ..
firebase deploy --only functions
```

## 8. Set Admin Custom Claim

To make a user an admin, run this once with the Firebase Admin SDK or in Cloud Shell:

```javascript
// In Firebase Cloud Shell or a one-off script:
const admin = require('firebase-admin');
admin.initializeApp();
// Replace with the admin user's Firebase UID (from Authentication tab)
await admin.auth().setCustomUserClaims('ADMIN_USER_UID', { admin: true });
console.log('Admin claim set.');
```

The user must sign out and sign back in for the claim to take effect.

## 9. Update Email Links

In `functions/src/index.ts`, replace `https://YOUR_APP_URL` with your actual deployed URL.

## 10. Run Locally

```bash
npm install
npm run dev
```

The app works in demo mode without Firebase configured. With `.env.local` set, it connects to real Firebase.
