import "server-only";

import { getFirebaseAdmin } from "../../lib/firebase-admin";

export async function getVerifiedProfileImageUrl(
  imagePath?: string | null,
  userId?: string,
): Promise<string | null> {
  if (!imagePath?.trim()) return null;
  if (!userId) throw new Error("An authenticated account is required to verify images.");

  const url = new URL(imagePath.trim());
  if (url.protocol !== "https:" || url.hostname !== "firebasestorage.googleapis.com") {
    throw new Error("Profile photos must be stored in this Firebase project.");
  }

  const match = url.pathname.match(/^\/v0\/b\/([^/]+)\/o\/(.+)$/);
  if (!match) throw new Error("Invalid Firebase Storage download URL.");

  const bucketName = decodeURIComponent(match[1]);
  const objectPath = decodeURIComponent(match[2]);
  if (!objectPath.startsWith(`avatars/${userId}/`) || objectPath.length > 512) {
    throw new Error("The uploaded profile photo does not belong to this account.");
  }

  const { bucket } = getFirebaseAdmin();
  if (bucket.name !== bucketName) {
    throw new Error("The uploaded profile photo belongs to another Firebase project.");
  }

  const [metadata] = await bucket.file(objectPath).getMetadata();
  const size = Number(metadata.size);
  if (
    !Number.isFinite(size) ||
    size <= 0 ||
    size > 1_500_000 ||
    !["image/jpeg", "image/png", "image/webp"].includes(metadata.contentType ?? "")
  ) {
    throw new Error("The uploaded file is not a supported profile photo.");
  }

  return url.toString();
}
