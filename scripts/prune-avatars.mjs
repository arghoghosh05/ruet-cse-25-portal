#!/usr/bin/env node
/**
 * Prune orphaned files from the Firebase Storage `avatars` folder.
 *
 * Scans Firestore collections (`profiles` and `student_submissions`)
 * for referenced avatar storage paths, and lists or deletes unreferenced files.
 *
 *   node scripts/prune-avatars.mjs
 *   node scripts/prune-avatars.mjs --delete
 */

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

const DELETE = process.argv.includes("--delete");

function initAdmin() {
  if (getApps().length > 0) return getApps()[0];

  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    return initializeApp({
      credential: cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (projectId && clientEmail && privateKey) {
    return initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  }

  return initializeApp({
    projectId: projectId || "ruet-cse-25-portal",
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

async function main() {
  const app = initAdmin();
  const db = getFirestore(app);
  const bucket = getStorage(app).bucket();

  console.log(`Bucket: ${bucket.name}`);
  console.log(`Mode:   ${DELETE ? "DELETE (removing orphaned files)" : "Dry run (nothing is removed)"}\n`);

  // 1. Collect all referenced avatar paths from profiles & submissions
  const referencedPaths = new Set();

  const profilesSnap = await db.collection("profiles").get();
  profilesSnap.forEach((doc) => {
    const data = doc.data();
    if (data.image_storage_path) referencedPaths.add(data.image_storage_path);
  });

  const subsSnap = await db.collection("student_submissions").get();
  subsSnap.forEach((doc) => {
    const data = doc.data();
    if (data.image_storage_path) referencedPaths.add(data.image_storage_path);
  });

  console.log(`Referenced paths in Firestore: ${referencedPaths.size}`);

  // 2. List files in avatars/ prefix
  const [files] = await bucket.getFiles({ prefix: "avatars/" });
  const orphanedFiles = files.filter((file) => !referencedPaths.has(file.name));

  console.log(`Stored avatar objects:         ${files.length}`);
  console.log(`Orphaned avatar objects:       ${orphanedFiles.length}`);

  if (orphanedFiles.length === 0) {
    console.log("\nNothing to prune. Storage is clean!");
    return;
  }

  console.log("\nSample orphaned files:");
  for (const file of orphanedFiles.slice(0, 10)) {
    console.log(`  - ${file.name}`);
  }

  if (!DELETE) {
    console.log(`\nDry run only. Re-run with --delete to delete these ${orphanedFiles.length} files.`);
    return;
  }

  let deletedCount = 0;
  for (const file of orphanedFiles) {
    try {
      await file.delete();
      deletedCount++;
    } catch (e) {
      console.error(`Failed to delete ${file.name}:`, e.message);
    }
  }

  console.log(`\nSuccessfully deleted ${deletedCount} orphaned files from Firebase Storage.`);
}

main().catch((err) => {
  console.error("Pruning failed:", err);
  process.exit(1);
});
