import "server-only";

import { getFirebaseAdmin } from "../../lib/firebase-admin";

export type PublicStudentProfile = {
  id: string;
  full_name: string | null;
  nickname: string | null;
  roll: number | string;
  image_url: string | null;
  email: string | null;
  blood_group: string | null;
  address: string | null;
  phone_number: string | null;
  whatsapp_number: string | null;
  facebook_url: string | null;
  section: string;
};

export async function getPublicSectionProfiles(section: string): Promise<PublicStudentProfile[]> {
  const normalized = section.trim().toLowerCase();
  if (!["a", "b", "c"].includes(normalized)) {
    throw new Error("A valid student section is required.");
  }

  const { db } = getFirebaseAdmin();
  const snapshot = await db.collection("profiles")
    .where("section", "in", [normalized, normalized.toUpperCase()])
    .limit(100)
    .get();

  const profiles = snapshot.docs.flatMap((docSnap) => {
    const data = docSnap.data();
    const roll = typeof data.roll === "number" || typeof data.roll === "string"
      ? data.roll
      : null;
    if (roll === null) return [];
    return [{
      id: docSnap.id,
      full_name: typeof data.full_name === "string" ? data.full_name : null,
      nickname: typeof data.nickname === "string" ? data.nickname : null,
      roll,
      image_url: typeof data.image_url === "string" ? data.image_url : null,
      email: typeof data.email === "string" ? data.email : null,
      blood_group: typeof data.blood_group === "string" ? data.blood_group : null,
      address: typeof data.address === "string" ? data.address : null,
      phone_number: typeof data.phone_number === "string" ? data.phone_number : null,
      whatsapp_number: typeof data.whatsapp_number === "string" ? data.whatsapp_number : null,
      facebook_url: typeof data.facebook_url === "string" ? data.facebook_url : null,
      section: typeof data.section === "string" ? data.section : normalized,
    }];
  });

  profiles.sort((a, b) => (Number(a.roll) || 0) - (Number(b.roll) || 0));
  return profiles;
}
