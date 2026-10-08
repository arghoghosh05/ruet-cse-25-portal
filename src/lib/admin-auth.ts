const adminEmails = new Set(
  (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
);

export function isAdminIdentity(
  email: string | undefined,
  appMetadata: object | null | undefined,
) {
  const hasAdminRole =
    appMetadata !== null &&
    typeof appMetadata === "object" &&
    "role" in appMetadata &&
    appMetadata.role === "admin";

  return Boolean(
    email &&
      adminEmails.has(email.trim().toLowerCase()) &&
      hasAdminRole,
  );
}
