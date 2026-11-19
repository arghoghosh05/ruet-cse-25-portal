export function getAdminEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isAdminIdentity(
  email: string | undefined,
  claims?: { role?: string; [key: string]: unknown } | null,
): boolean {
  if (!email) return false;
  const normalizedEmail = email.trim().toLowerCase();
  const adminEmails = getAdminEmails();

  // If email is explicitly in ADMIN_EMAILS environment allowlist
  if (adminEmails.has(normalizedEmail)) {
    return true;
  }

  // If custom claim role is admin
  if (claims && claims.role === "admin") {
    return true;
  }

  return false;
}
