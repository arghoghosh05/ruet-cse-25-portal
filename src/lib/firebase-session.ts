import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getFirebaseAdmin } from "../../lib/firebase-admin";
import { isAdminEmail } from "./admin-auth";

export const firebaseSessionCookieName = "ruet-session";
const sessionDurationMs = 5 * 24 * 60 * 60 * 1000;

export async function getFirebaseUser() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(firebaseSessionCookieName)?.value;
  if (!sessionCookie) return null;

  try {
    return await getFirebaseAdmin().auth.verifySessionCookie(sessionCookie);
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error.code === "auth/invalid-session-cookie" ||
        error.code === "auth/session-cookie-expired" ||
        error.code === "auth/session-cookie-revoked")
    ) {
      return null;
    }
    throw error;
  }
}

export async function requireFirebaseUser() {
  const user = await getFirebaseUser();
  if (!user?.uid || !user.email) {
    redirect(`/submit-profile?error=${encodeURIComponent("Sign in with Google to continue.")}`);
  }
  return user;
}

export async function requireFirebaseAdmin() {
  const user = await getFirebaseUser();
  if (!user?.uid || !user.email || !isAdminEmail(user.email)) {
    redirect(`/admin/login?error=${encodeURIComponent("Admin access is required.")}`);
  }
  return user;
}

export async function createFirebaseSession(idToken: string) {
  const adminAuth = getFirebaseAdmin().auth;
  const decoded = await adminAuth.verifyIdToken(idToken, true);
  if (!decoded.email || decoded.email_verified !== true) {
    throw new Error("Use a verified Google account to sign in.");
  }
  const sessionCookie = await adminAuth.createSessionCookie(idToken, {
    expiresIn: sessionDurationMs,
  });
  return { sessionCookie, expiresIn: sessionDurationMs };
}
