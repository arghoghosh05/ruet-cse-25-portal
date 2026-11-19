import { adminStorage } from "./firebase/admin";
import {
  hasValidImageSignature,
  maxProfileImageSize,
  profileImageExtensions,
} from "./profile-image";

export async function getVerifiedProfileImageUrl(
  imagePath: string,
  userId: string,
): Promise<{ url: string; storagePath: string } | null> {
  if (!imagePath) return null;

  // Expected format: avatars/<userId>/<uuid>.<ext> or <userId>/<uuid>.<ext>
  const normalizedPath = imagePath.startsWith("avatars/")
    ? imagePath
    : `avatars/${imagePath}`;

  const match = normalizedPath.match(
    /^avatars\/([a-zA-Z0-9_-]{1,128})\/([0-9a-fA-F-]{36})\.(jpg|png|webp)$/,
  );

  if (!match || match[1] !== userId) {
    return null;
  }

  const extension = match[3].toLowerCase();
  const expectedContentType = Object.entries(profileImageExtensions).find(
    ([, ext]) => ext === extension,
  )?.[0];

  if (!expectedContentType) return null;

  try {
    const bucket = adminStorage.bucket();
    const file = bucket.file(normalizedPath);
    const [exists] = await file.exists();
    if (!exists) return null;

    const [metadata] = await file.getMetadata();
    const size = Number(metadata.size);

    if (
      !Number.isSafeInteger(size) ||
      size <= 0 ||
      size > maxProfileImageSize
    ) {
      return null;
    }

    // Verify magic bytes by reading first 12 bytes
    const buffer = await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      const stream = file.createReadStream({ start: 0, end: 11 });
      stream.on("data", (chunk: Buffer) => chunks.push(chunk));
      stream.on("end", () => resolve(Buffer.concat(chunks)));
      stream.on("error", reject);
    });

    if (!hasValidImageSignature(expectedContentType, new Uint8Array(buffer))) {
      // Remove invalid file from storage immediately
      await file.delete().catch(() => {});
      return null;
    }

    // Firebase Storage public URL format
    const bucketName = bucket.name;
    const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(normalizedPath)}?alt=media`;

    return {
      url: downloadUrl,
      storagePath: normalizedPath,
    };
  } catch (error) {
    console.error("Failed to verify uploaded profile image in Firebase Storage:", error);
    return null;
  }
}

/**
 * Safely delete an existing avatar file from Firebase Storage
 */
export async function deleteAvatarFile(storagePath?: string | null): Promise<void> {
  if (!storagePath) return;
  try {
    const bucket = adminStorage.bucket();
    const file = bucket.file(storagePath);
    const [exists] = await file.exists();
    if (exists) {
      await file.delete();
    }
  } catch (err) {
    console.warn(`Failed to delete old avatar ${storagePath}:`, err);
  }
}
