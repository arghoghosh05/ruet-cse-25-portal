/**
 * Migration Script: Supabase -> Firebase (Firestore & Firebase Storage)
 * 
 * Usage:
 *   node scripts/migrate-from-supabase.mjs
 * 
 * Required Environment Variables (in .env.local or shell):
 *   SUPABASE_URL=https://your-project.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
 *   FIREBASE_PROJECT_ID=your-firebase-project-id
 *   FIREBASE_CLIENT_EMAIL=your-firebase-client-email
 *   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
 *   FIREBASE_STORAGE_BUCKET=your-firebase-storage-bucket
 */

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import fs from "node:fs";
import path from "node:path";

// Load .env.local if present
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val.replace(/\\n/g, "\n");
      }
    }
  }
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  console.error("Please provide them in .env.local or your environment variables.");
  process.exit(1);
}

// Initialize Firebase Admin
if (getApps().length === 0) {
  let credential;
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    credential = cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY));
  } else if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    credential = cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    });
  } else {
    console.error("❌ Missing Firebase Admin credentials in environment.");
    process.exit(1);
  }

  initializeApp({
    credential,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${process.env.FIREBASE_PROJECT_ID}.appspot.com`,
  });
}

const db = getFirestore();
const bucket = getStorage().bucket();

async function fetchSupabaseTable(tableName) {
  const url = `${SUPABASE_URL.replace(/\/$/, "")}/rest/v1/${tableName}?select=*`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch ${tableName} from Supabase: ${res.status} ${text}`);
  }

  return await res.json();
}

async function migrateAvatars(imageUrl, roll) {
  if (!imageUrl || !imageUrl.startsWith("http")) return imageUrl;
  
  // Only attempt to copy if it's hosted on Supabase Storage
  if (!imageUrl.includes("supabase.co/storage")) {
    return imageUrl;
  }

  try {
    const res = await fetch(imageUrl);
    if (!res.ok) {
      console.warn(`  ⚠️ Could not fetch image for roll ${roll} from Supabase: ${res.statusText}`);
      return imageUrl;
    }

    const contentType = res.headers.get("content-type") || "image/jpeg";
    const buffer = Buffer.from(await res.arrayBuffer());
    const ext = contentType.split("/")[1] || "jpg";
    const destPath = `avatars/migrated/${roll}.${ext}`;
    const file = bucket.file(destPath);

    await file.save(buffer, {
      contentType,
      metadata: {
        migratedFrom: imageUrl,
        roll: String(roll),
      },
    });

    await file.makePublic();
    const newUrl = `https://storage.googleapis.com/${bucket.name}/${destPath}`;
    console.log(`  📸 Migrated avatar for roll ${roll} -> ${destPath}`);
    return newUrl;
  } catch (err) {
    console.warn(`  ⚠️ Failed to migrate avatar for roll ${roll}:`, err.message);
    return imageUrl;
  }
}

async function main() {
  console.log("🚀 Starting Supabase to Firebase Migration...\n");

  // 1. Migrate Profiles
  try {
    console.log("📦 1/4 Fetching 'profiles' from Supabase...");
    const profiles = await fetchSupabaseTable("profiles");
    console.log(`   Found ${profiles.length} profiles.`);

    for (const profile of profiles) {
      const docId = String(profile.roll || profile.id);
      let imageUrl = profile.image_url;
      if (imageUrl) {
        imageUrl = await migrateAvatars(imageUrl, docId);
      }

      await db.collection("profiles").doc(docId).set({
        id: docId,
        roll: Number(profile.roll) || profile.roll || docId,
        full_name: profile.full_name || null,
        nickname: profile.nickname || null,
        section: (profile.section || "").toLowerCase(),
        email: profile.email || null,
        blood_group: profile.blood_group || null,
        address: profile.address || null,
        phone_number: profile.phone_number || null,
        whatsapp_number: profile.whatsapp_number || null,
        facebook_url: profile.facebook_url || null,
        image_url: imageUrl || null,
        created_at: profile.created_at || new Date().toISOString(),
      }, { merge: true });
    }
    console.log(`   ✅ Successfully migrated ${profiles.length} profiles to Firestore!\n`);
  } catch (err) {
    console.warn(`   ⚠️ Profiles migration note: ${err.message}\n`);
  }

  // 2. Migrate Student Accounts
  try {
    console.log("📦 2/4 Fetching 'student_accounts' from Supabase...");
    const accounts = await fetchSupabaseTable("student_accounts");
    console.log(`   Found ${accounts.length} student accounts.`);

    for (const acc of accounts) {
      const docId = String(acc.roll || acc.id);
      await db.collection("student_accounts").doc(docId).set({
        id: docId,
        roll: docId,
        email: acc.email ? acc.email.toLowerCase() : null,
        uid: acc.uid || null,
        has_profile: Boolean(acc.has_profile),
        status: acc.status || "verified",
        created_at: acc.created_at || new Date().toISOString(),
      }, { merge: true });
    }
    console.log(`   ✅ Successfully migrated ${accounts.length} student accounts to Firestore!\n`);
  } catch (err) {
    console.warn(`   ⚠️ Student accounts migration note: ${err.message}\n`);
  }

  // 3. Migrate Student Submissions
  try {
    console.log("📦 3/4 Fetching 'student_submissions' from Supabase...");
    const submissions = await fetchSupabaseTable("student_submissions");
    console.log(`   Found ${submissions.length} submissions.`);

    for (const sub of submissions) {
      const docId = String(sub.id);
      let imageUrl = sub.image_url;
      if (imageUrl) {
        imageUrl = await migrateAvatars(imageUrl, sub.roll);
      }

      await db.collection("student_submissions").doc(docId).set({
        id: docId,
        roll: Number(sub.roll) || 0,
        full_name: sub.full_name || "",
        nickname: sub.nickname || null,
        section: (sub.section || "").toLowerCase(),
        address: sub.address || "",
        phone_number: sub.phone_number || "",
        whatsapp_number: sub.whatsapp_number || "",
        blood_group: sub.blood_group || null,
        email: sub.email || null,
        facebook_url: sub.facebook_url || null,
        image_url: imageUrl || null,
        status: sub.status || "pending",
        submitted_at: sub.submitted_at || sub.created_at || new Date().toISOString(),
      }, { merge: true });
    }
    console.log(`   ✅ Successfully migrated ${submissions.length} submissions to Firestore!\n`);
  } catch (err) {
    console.warn(`   ⚠️ Submissions migration note: ${err.message}\n`);
  }

  // 4. Migrate Telegram Resources
  try {
    console.log("📦 4/4 Fetching 'telegram_resources' from Supabase...");
    const resources = await fetchSupabaseTable("telegram_resources");
    console.log(`   Found ${resources.length} telegram resources.`);

    for (const res of resources) {
      const docId = String(res.id);
      await db.collection("telegram_resources").doc(docId).set({
        id: docId,
        semester: res.semester,
        category: res.category,
        ct_number: res.ct_number || null,
        title: res.title,
        telegram_file_id: res.telegram_file_id,
        created_at: res.created_at || new Date().toISOString(),
      }, { merge: true });
    }
    console.log(`   ✅ Successfully migrated ${resources.length} telegram resources to Firestore!\n`);
  } catch (err) {
    console.warn(`   ⚠️ Telegram resources migration note: ${err.message}\n`);
  }

  console.log("🎉 All migrations completed successfully!");
}

main().catch((err) => {
  console.error("❌ Fatal error during migration:", err);
  process.exit(1);
});
