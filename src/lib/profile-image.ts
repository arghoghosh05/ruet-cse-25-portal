export const maxProfileImageSize = 15_000_000;

// Uploads are shrunk to this longest edge before they leave the browser. A
// 1200 px photo still fills the directory avatar and the enlarged photo dialog,
// while a 15 MB camera original previously cost every visitor a full-size
// download of the image. Nothing above this edge adds visible detail.
export const storedProfileImageMaxEdge = 1200;
const storedProfileImageQuality = 0.85;

export const profileImageExtensions: Readonly<Record<string, string>> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function canvasToBlob(canvas: HTMLCanvasElement, type: string) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob && blob.type === type ? blob : null),
      type,
      storedProfileImageQuality,
    );
  }).catch(() => null);
}

/**
 * Re-encodes a chosen photo to a small WebP (JPEG where the browser cannot
 * encode WebP) so stored avatars stay in the tens of kilobytes instead of
 * megabytes. Returns the original file whenever resizing is unavailable or
 * would not make the file smaller, so uploads never fail because of this.
 */
export async function compressProfileImage(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(
      1,
      storedProfileImageMaxEdge / Math.max(bitmap.width, bitmap.height),
    );
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) {
      bitmap.close();
      return file;
    }

    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    let blob = await canvasToBlob(canvas, "image/webp");
    if (!blob) {
      // JPEG carries no alpha channel: paint white behind the photo so a
      // transparent PNG does not come out with a black backdrop.
      context.globalCompositeOperation = "destination-over";
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, width, height);
      blob = await canvasToBlob(canvas, "image/jpeg");
    }

    if (!blob || blob.size === 0 || blob.size >= file.size) return file;

    const extension = blob.type === "image/webp" ? "webp" : "jpg";
    const baseName = file.name.replace(/\.[^./\\]+$/, "") || "profile-photo";
    return new File([blob], `${baseName}.${extension}`, { type: blob.type });
  } catch (error) {
    console.error("Profile image compression failed:", error);
    return file;
  }
}

export function hasValidImageSignature(type: string, signature: Uint8Array) {
  return (
    (type === "image/png" &&
      signature[0] === 0x89 && signature[1] === 0x50 &&
      signature[2] === 0x4e && signature[3] === 0x47) ||
    (type === "image/jpeg" &&
      signature[0] === 0xff && signature[1] === 0xd8 && signature[2] === 0xff) ||
    (type === "image/webp" &&
      String.fromCharCode(...signature.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...signature.slice(8, 12)) === "WEBP")
  );
}
