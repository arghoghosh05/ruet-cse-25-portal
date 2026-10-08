export const maxProfileImageSize = 15_000_000;

export const profileImageExtensions: Readonly<Record<string, string>> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

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
