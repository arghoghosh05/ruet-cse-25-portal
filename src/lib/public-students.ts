import { adminDb } from "./firebase/admin";

export type StudentProfile = {
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
};

export async function getPublicSectionProfiles(section: string): Promise<StudentProfile[]> {
  try {
    const targetSection = section.toLowerCase();
    const snapshot = await adminDb
      .collection("profiles")
      .where("section", "in", [targetSection, targetSection.toUpperCase()])
      .get();

    const profiles = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        full_name: data.full_name ?? null,
        nickname: data.nickname ?? null,
        roll: data.roll ?? (Number(doc.id) || doc.id),
        image_url: data.image_url ?? null,
        email: data.email ?? null,
        blood_group: data.blood_group ?? null,
        address: data.address ?? null,
        phone_number: data.phone_number ?? null,
        whatsapp_number: data.whatsapp_number ?? null,
        facebook_url: data.facebook_url ?? null,
      };
    });

    // In-memory sort by roll ascending to avoid requiring manual composite indexes in Firebase
    return profiles.sort((a, b) => {
      const rollA = typeof a.roll === "number" ? a.roll : parseInt(String(a.roll), 10) || 0;
      const rollB = typeof b.roll === "number" ? b.roll : parseInt(String(b.roll), 10) || 0;
      return rollA - rollB;
    });
  } catch (error) {
    console.error("Failed to load public student profiles from Firestore:", error);
    return [];
  }
}
