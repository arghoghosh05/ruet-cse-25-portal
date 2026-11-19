export const BLOOD_GROUPS = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
] as const;

const ALLOWED_FACEBOOK_HOSTS = new Set([
  "facebook.com",
  "www.facebook.com",
  "m.facebook.com",
  "web.facebook.com",
  "fb.com",
  "www.fb.com",
  "fb.me",
]);

export function isSafeExternalUrl(value: string): boolean {
  if (!value || typeof value !== "string") return false;
  try {
    const url = new URL(value);
    const protocol = url.protocol;
    if (protocol !== "https:" && protocol !== "http:") return false;

    // Ensure it's a legitimate Facebook domain
    const hostname = url.hostname.toLowerCase();
    return ALLOWED_FACEBOOK_HOSTS.has(hostname) || hostname.endsWith(".facebook.com");
  } catch {
    return false;
  }
}

export function getSectionFromRoll(rollVal: number | string): "a" | "b" | "c" | "invalid" {
  const rollStr = String(rollVal).trim();
  if (!/^\d{7}$/.test(rollStr)) return "invalid";
  const roll = Number(rollStr);
  if (roll >= 2503001 && roll <= 2503060) return "a";
  if (roll >= 2503061 && roll <= 2503120) return "b";
  if (roll >= 2503121 && roll <= 2503180) return "c";
  return "invalid";
}
