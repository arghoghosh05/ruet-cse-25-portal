import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
} from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const inputPath = process.argv[2];
const applyChanges = process.argv.includes("--apply");
if (!inputPath || process.argv.slice(2).some((arg) => arg !== inputPath && arg !== "--apply")) {
  throw new Error("Usage: node scripts/import-supabase-export.mjs <export.json> [--apply]");
}

const data = JSON.parse(await readFile(resolve(process.cwd(), inputPath), "utf8"));
if (!data || typeof data !== "object" || Array.isArray(data)) {
  throw new Error("The export must be a JSON object.");
}

const rows = (name) => {
  const value = data[name] ?? [];
  if (!Array.isArray(value)) throw new Error(`The export field '${name}' must be an array.`);
  return value;
};
const text = (value) => typeof value === "string" && value.trim() ? value.trim() : null;
const validRoll = (value) => {
  const roll = Number(value);
  return Number.isInteger(roll) && roll >= 2503001 && roll <= 2503180 ? roll : null;
};
const sectionForRoll = (roll) => roll <= 2503060 ? "a" : roll <= 2503120 ? "b" : "c";
const validDate = (value, fallback) => {
  const date = value ? new Date(value) : fallback;
  return Number.isNaN(date.getTime()) ? fallback.toISOString() : date.toISOString();
};
const safeId = (value, label) => {
  const id = text(value);
  if (!id || !/^[A-Za-z0-9_-]{1,150}$/.test(id)) {
    throw new Error(`${label} is missing a Firestore-safe id.`);
  }
  return id;
};

const profiles = rows("profiles").map((row, index) => {
  const id = safeId(row?.id, `profiles[${index}]`);
  const roll = validRoll(row?.roll);
  const fullName = text(row?.full_name);
  if (!roll || !fullName || fullName.length < 2 || fullName.length > 120) {
    throw new Error(`profiles[${index}] has an invalid roll or name.`);
  }
  return {
    id,
    roll,
    section: sectionForRoll(roll),
    full_name: fullName,
    nickname: text(row.nickname),
    address: text(row.address),
    phone_number: text(row.phone_number),
    whatsapp_number: text(row.whatsapp_number),
    email: text(row.email)?.toLowerCase() ?? null,
    blood_group: text(row.blood_group),
    facebook_url: text(row.facebook_url),
    image_url: text(row.image_url),
    created_by: text(row.created_by),
    created_at: validDate(row.created_at, new Date()),
    updated_at: validDate(row.updated_at, new Date()),
    owner_uid: null,
  };
});

const submissions = rows("student_submissions").map((row, index) => {
  const id = safeId(row?.id, `student_submissions[${index}]`);
  const roll = validRoll(row?.roll);
  const status = text(row?.status);
  const fullName = text(row?.full_name);
  if (
    !roll || !fullName || fullName.length < 2 || fullName.length > 120 ||
    !["pending", "approved", "rejected"].includes(status ?? "")
  ) {
    throw new Error(`student_submissions[${index}] has invalid required fields.`);
  }
  return {
    id: `legacy_${id}`,
    legacy_id: id,
    legacy_user_id: text(row.user_id),
    user_id: null,
    roll,
    section: sectionForRoll(roll),
    full_name: fullName,
    nickname: text(row.nickname),
    address: text(row.address),
    phone_number: text(row.phone_number),
    whatsapp_number: text(row.whatsapp_number),
    email: text(row.email)?.toLowerCase() ?? null,
    blood_group: text(row.blood_group),
    facebook_url: text(row.facebook_url),
    image_url: text(row.image_url),
    status,
    submitted_at: validDate(row.submitted_at, new Date()),
    reviewed_at: row.reviewed_at ? validDate(row.reviewed_at, new Date()) : null,
  };
});

const resources = rows("telegram_resources").map((row, index) => {
  const id = safeId(row?.id, `telegram_resources[${index}]`);
  const semester = text(row?.semester);
  const category = text(row?.category);
  const title = text(row?.title);
  const uploadedBy = Number(row?.uploaded_by);
  const ctNumber = row?.ct_number === null || row?.ct_number === undefined
    ? null
    : Number(row.ct_number);
  if (
    !["1-1", "1-2", "2-1", "2-2", "3-1", "3-2", "4-1", "4-2"].includes(semester ?? "") ||
    !["ct", "final", "notes", "books"].includes(category ?? "") ||
    !title || title.length > 160 || !text(row?.file_id) ||
    !Number.isSafeInteger(uploadedBy) || uploadedBy <= 0 ||
    (category === "ct" && (!Number.isInteger(ctNumber) || ctNumber < 1 || ctNumber > 4)) ||
    (category !== "ct" && ctNumber !== null)
  ) {
    throw new Error(`telegram_resources[${index}] has invalid resource fields.`);
  }
  return {
    id,
    semester,
    category,
    ctNumber,
    title,
    fileId: text(row.file_id),
    fileName: text(row.file_name),
    mimeType: text(row.mime_type),
    uploadedBy,
    createdAt: validDate(row.created_at, new Date()),
  };
});

const profileRolls = new Set();
for (const profile of profiles) {
  if (profileRolls.has(profile.roll)) throw new Error(`Duplicate profile roll ${profile.roll} in export.`);
  profileRolls.add(profile.roll);
}
const pendingRolls = new Set();
for (const submission of submissions.filter((item) => item.status === "pending")) {
  if (profileRolls.has(submission.roll) || pendingRolls.has(submission.roll)) {
    throw new Error(`Pending roll ${submission.roll} conflicts with another exported record.`);
  }
  pendingRolls.add(submission.roll);
}

console.info(
  `Validated export: ${profiles.length} profiles, ${submissions.length} submissions, ${resources.length} Telegram resources.`,
);
if (!applyChanges) {
  console.info("Dry run only. Add --apply to import these records; existing Firestore documents are never overwritten.");
  process.exit(0);
}

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
if (!projectId) throw new Error("Set NEXT_PUBLIC_FIREBASE_PROJECT_ID before applying the import.");
const existingApp = getApps().find((app) => app.name === "supabase-import");
let credential;
if (serviceAccountJson) {
  const serviceAccount = JSON.parse(serviceAccountJson);
  if (!serviceAccount.project_id || serviceAccount.project_id !== projectId) {
    throw new Error("The service account project must match NEXT_PUBLIC_FIREBASE_PROJECT_ID.");
  }
  credential = cert(serviceAccount);
} else if (clientEmail && privateKey) {
  credential = cert({ projectId, clientEmail, privateKey });
} else {
  credential = applicationDefault();
}
const app = existingApp ?? initializeApp(
  {
    projectId,
    credential,
  },
  "supabase-import",
);
const db = getFirestore(app);
let importedProfiles = 0;
let importedSubmissions = 0;
let importedResources = 0;

for (const profile of profiles) {
  const profileRef = db.collection("profiles").doc(profile.id);
  const rollRef = db.collection("profile_rolls").doc(String(profile.roll));
  const imported = await db.runTransaction(async (transaction) => {
    const [existingProfile, reservation, matchingProfiles] = await Promise.all([
      transaction.get(profileRef),
      transaction.get(rollRef),
      transaction.get(db.collection("profiles").where("roll", "==", profile.roll).limit(1)),
    ]);
    if (existingProfile.exists) return false;
    if (reservation.exists || !matchingProfiles.empty) {
      throw new Error(`Roll ${profile.roll} already exists in Firebase; no data was overwritten.`);
    }
    transaction.create(profileRef, profile);
    transaction.create(rollRef, { profile_id: profile.id, status: "approved" });
    return true;
  });
  if (imported) importedProfiles += 1;
}

for (const submission of submissions) {
  const submissionRef = db.collection("student_submissions").doc(submission.id);
  const rollRef = db.collection("profile_rolls").doc(String(submission.roll));
  const imported = await db.runTransaction(async (transaction) => {
    const existing = await transaction.get(submissionRef);
    if (existing.exists) return false;
    if (submission.status === "pending") {
      const [reservation, matchingProfiles] = await Promise.all([
        transaction.get(rollRef),
        transaction.get(db.collection("profiles").where("roll", "==", submission.roll).limit(1)),
      ]);
      if (reservation.exists || !matchingProfiles.empty) {
        throw new Error(`Pending roll ${submission.roll} already exists in Firebase.`);
      }
      transaction.create(rollRef, {
        status: "pending",
        user_id: null,
        submission_id: submission.id,
      });
    }
    transaction.create(submissionRef, submission);
    return true;
  });
  if (imported) importedSubmissions += 1;
}

for (const resource of resources) {
  const resourceRef = db.collection("telegram_resources").doc(resource.id);
  const existing = await resourceRef.get();
  if (!existing.exists) {
    await resourceRef.create(resource);
    importedResources += 1;
  }
}

console.info(
  `Import finished: ${importedProfiles} profiles, ${importedSubmissions} submissions, ${importedResources} Telegram resources added.`,
);
