import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminAuth } from "./admin";
import { isAdminIdentity } from "../admin-auth";

export const SESSION_COOKIE_NAME = "__session";
const FIVE_DAYS_MS = 60 * 60 * 24 * 5 * 1000;

export type SessionUser = {
  uid: string;
  email?: string;
  email_verified?: boolean;
  isAdmin: boolean;
  claims: Record<string, unknown>;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    return null;
  }

  try {
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
    const email = decodedClaims.email;
    const isAdmin = isAdminIdentity(email, decodedClaims as unknown as { role?: string });

    return {
      uid: decodedClaims.uid,
      email: decodedClaims.email,
      email_verified: Boolean(decodedClaims.email_verified),
      isAdmin,
      claims: decodedClaims,
    };
  } catch (error) {
    // If session cookie is invalid, expired or revoked
    return null;
  }
}

export async function createSessionFromIdToken(idToken: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify the ID token first
    const decodedIdToken = await adminAuth.verifyIdToken(idToken);
    
    // Create session cookie
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: FIVE_DAYS_MS,
    });

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
      maxAge: FIVE_DAYS_MS / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
    });

    return { success: true };
  } catch (error: unknown) {
    console.error("Failed to create session cookie:", error);
    const message = error instanceof Error ? error.message : "Failed to create session";
    return { success: false, error: message };
  }
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (sessionCookie) {
    try {
      const decoded = await adminAuth.verifySessionCookie(sessionCookie, false);
      await adminAuth.revokeRefreshTokens(decoded.sub);
    } catch {
      // Ignore if already invalid
    }
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function requireAdminSession(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user || !user.isAdmin) {
    redirect("/admin/login?error=Admin access is required.");
  }
  return user;
}
