import type { SupabaseClient } from "@supabase/supabase-js";
import {
  hasValidImageSignature,
  maxProfileImageSize,
  profileImageExtensions,
} from "./profile-image";

export async function getVerifiedProfileImageUrl(
  supabase: SupabaseClient,
  imagePath: string,
  userId: string,
) {
  if (!imagePath) return null;
  const match = imagePath.match(
    /^([0-9a-f-]{36})\/([0-9a-f-]{36})\.(jpg|png|webp)$/,
  );
  if (!match || match[1] !== userId) return null;

  const extension = match[3];
  const contentType = Object.entries(profileImageExtensions).find(([, ext]) => ext === extension)?.[0];
  if (!contentType) return null;

  const { data } = supabase.storage.from("avatars").getPublicUrl(imagePath);
  try {
    const headResponse = await fetch(data.publicUrl, { method: "HEAD", cache: "no-store" });
    const actualSize = Number(headResponse.headers.get("content-length"));
    if (
      !headResponse.ok ||
      headResponse.headers.get("content-type")?.split(";")[0] !== contentType ||
      !Number.isSafeInteger(actualSize) ||
      actualSize <= 0 ||
      actualSize > maxProfileImageSize
    ) {
      return null;
    }

    const imageResponse = await fetch(data.publicUrl, {
      headers: { Range: "bytes=0-11" },
      cache: "no-store",
    });
    if (!imageResponse.ok) return null;
    const signature = new Uint8Array(await imageResponse.arrayBuffer());
    return hasValidImageSignature(contentType, signature) ? data.publicUrl : null;
  } catch (error) {
    console.error("Failed to verify uploaded student image:", error);
    return null;
  }
}
