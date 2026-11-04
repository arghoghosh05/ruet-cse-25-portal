#!/usr/bin/env node

import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { FieldPath, getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

const PAGE_SIZE = 500;
const DELETE_BATCH_SIZE = 100;
const AVATAR_PREFIX = "avatars/";
const PATH_PATTERN =
  /^avatars\/[^/]{1,128}\/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|jpeg|png|webp)$/i;
const DELETE = process.argv.includes("--delete");

function getServiceAccount() {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (json) {
    const account = JSON.parse(json);
    if (!account.project_id || !account.client_email || !account.private_key) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is missing required fields.");
    }
    return {
      projectId: account.project_id,
      clientEmail: account.client_email,
      privateKey: account.private_key.replace(/\\n/g, "\n"),
    };
  }

  const { FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env;
  if (FIREBASE_CLIENT_EMAIL && FIREBASE_PRIVATE_KEY) {
    return {
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: FIREBASE_CLIENT_EMAIL,
      privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    };
  }
  return null;
}

function initializeFirebase() {
  const existing = getApps().find((app) => app.name === "avatar-pruner");
  if (existing) return existing;

  const account = getServiceAccount();
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || account?.projectId;
  if (!projectId) {
    throw new Error("Set NEXT_PUBLIC_FIREBASE_PROJECT_ID or provide a service account.");
  }
  if (account?.projectId && account.projectId !== projectId) {
    throw new Error("The service account project does not match NEXT_PUBLIC_FIREBASE_PROJECT_ID.");
  }

  const options = account
    ? { credential: cert(account), projectId }
    : process.env.GOOGLE_APPLICATION_CREDENTIALS
      ? { credential: applicationDefault(), projectId }
      : null;
  if (!options) {
    throw new Error(
      "Set FIREBASE_SERVICE_ACCOUNT_JSON, FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY, or GOOGLE_APPLICATION_CREDENTIALS.",
    );
  }

  return initializeApp(options, "avatar-pruner");
}

function getObjectPath(imageUrl, bucketName) {
  if (typeof imageUrl !== "string") return null;
  try {
    const url = new URL(imageUrl);
    if (url.protocol !== "https:" || url.hostname !== "firebasestorage.googleapis.com") {
      return null;
    }
    const match = url.pathname.match(/^\/v0\/b\/([^/]+)\/o\/(.+)$/);
    if (!match || decodeURIComponent(match[1]) !== bucketName) return null;
    const objectPath = decodeURIComponent(match[2]);
    return objectPath.startsWith(AVATAR_PREFIX) ? objectPath : null;
  } catch {
    return null;
  }
}

async function fetchReferencedPaths(db, bucketName, collectionName) {
  const paths = new Set();
  let query = db
    .collection(collectionName)
    .select("image_url")
    .orderBy(FieldPath.documentId())
    .limit(PAGE_SIZE);

  for (;;) {
    const snapshot = await query.get();
    for (const document of snapshot.docs) {
      const path = getObjectPath(document.get("image_url"), bucketName);
      if (path) paths.add(path);
    }
    if (snapshot.size < PAGE_SIZE) break;
    query = query.startAfter(snapshot.docs[snapshot.docs.length - 1]);
  }

  return paths;
}

async function listAvatarFiles(bucket) {
  const objects = [];
  let options = {
    prefix: AVATAR_PREFIX,
    autoPaginate: false,
    maxResults: PAGE_SIZE,
  };

  for (;;) {
    const [files, nextQuery] = await bucket.getFiles(options);
    const page = await Promise.all(
      files.map(async (file) => {
        const [metadata] = await file.getMetadata();
        return {
          file,
          name: file.name,
          size: Number(metadata.size) || 0,
          created: metadata.timeCreated,
        };
      }),
    );
    objects.push(...page);
    if (!nextQuery) break;
    options = nextQuery;
  }

  return objects;
}

function human(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

async function main() {
  const app = initializeFirebase();
  const db = getFirestore(app);
  const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  const bucket = getStorage(app).bucket(bucketName || undefined);
  if (!bucket.name) throw new Error("Firebase Storage bucket is not configured.");

  console.log(`Project: ${app.options.projectId}`);
  console.log(`Bucket:  ${bucket.name}`);
  console.log(`Mode:    ${DELETE ? "DELETE" : "dry run (nothing is removed)"}`);
  console.log("");

  const [profilePaths, submissionPaths, stored] = await Promise.all([
    fetchReferencedPaths(db, bucket.name, "profiles"),
    fetchReferencedPaths(db, bucket.name, "student_submissions"),
    listAvatarFiles(bucket),
  ]);
  const referenced = new Set([...profilePaths, ...submissionPaths]);
  const unrecognised = stored.filter((object) => !PATH_PATTERN.test(object.name));

  console.log(`Stored objects:      ${stored.length}`);
  console.log(`Referenced by docs:  ${referenced.size}`);
  console.log(
    `Orphaned:            ${stored.filter((object) => !referenced.has(object.name)).length}`,
  );

  if (unrecognised.length > 0) {
    console.error(
      `\nRefusing to continue: ${unrecognised.length} object(s) do not match ` +
        "avatars/{uid}/{uuid}.{jpg|jpeg|png|webp}. Review them first:",
    );
    for (const object of unrecognised.slice(0, 20)) console.error(`  - ${object.name}`);
    process.exitCode = 2;
    return;
  }

  const orphans = stored.filter((object) => !referenced.has(object.name));
  if (orphans.length === 0) {
    console.log("\nNothing to prune.");
    return;
  }

  const orphanBytes = orphans.reduce((sum, object) => sum + object.size, 0);
  console.log(`Orphaned size:       ${human(orphanBytes)}`);
  console.log("\nLargest orphans:");
  for (const object of [...orphans].sort((a, b) => b.size - a.size).slice(0, 15)) {
    console.log(`  ${human(object.size).padStart(9)}  ${object.name}`);
  }

  if (!DELETE) {
    console.log(`\nDry run only. Re-run with --delete to remove these ${orphans.length} files.`);
    return;
  }

  let removed = 0;
  let freed = 0;
  for (let index = 0; index < orphans.length; index += DELETE_BATCH_SIZE) {
    const batch = orphans.slice(index, index + DELETE_BATCH_SIZE);
    for (const object of batch) await object.file.delete();
    removed += batch.length;
    freed += batch.reduce((sum, object) => sum + object.size, 0);
    console.log(`  removed ${removed}/${orphans.length}`);
  }

  console.log(`\nDeleted ${removed} file(s), freeing ${human(freed)}.`);
}

main().catch((error) => {
  console.error(`\nFailed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
