import "server-only";

import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
  type App,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

function getServiceAccount() {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (json) {
    try {
      const parsed = JSON.parse(json) as {
        project_id?: string;
        client_email?: string;
        private_key?: string;
      };
      if (!parsed.project_id || !parsed.client_email || !parsed.private_key) {
        throw new Error("The service account JSON is missing required fields.");
      }
      return {
        projectId: parsed.project_id,
        clientEmail: parsed.client_email,
        privateKey: parsed.private_key.replace(/\\n/g, "\n"),
      };
    } catch (error) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON must be valid JSON.", {
        cause: error,
      });
    }
  }

  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (clientEmail && privateKey && projectId) {
    return { clientEmail, privateKey, projectId };
  }

  return null;
}

function getFirebaseAdminApp(): App {
  const existing = getApps().find((app) => app.name === "portal-admin");
  if (existing) return existing;

  const serviceAccount = getServiceAccount();
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (serviceAccount) {
    if (projectId && serviceAccount.projectId !== projectId) {
      throw new Error("The Firebase service account project does not match NEXT_PUBLIC_FIREBASE_PROJECT_ID.");
    }
    return initializeApp(
      { credential: cert(serviceAccount), projectId },
      "portal-admin",
    );
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS && projectId) {
    return initializeApp(
      { credential: applicationDefault(), projectId },
      "portal-admin",
    );
  }

  throw new Error(
    "Firebase server credentials are not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY.",
  );
}

export function getFirebaseAdmin() {
  const app = getFirebaseAdminApp();
  return {
    auth: getAuth(app),
    db: getFirestore(app),
    bucket: getStorage(app).bucket(),
  };
}
