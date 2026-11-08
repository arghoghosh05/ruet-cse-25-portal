"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getFirebaseAdmin } from "../../../lib/firebase-admin";
import { requireFirebaseAdmin, requireFirebaseUser } from "../../lib/firebase-session";
import { BANGLADESH_DISTRICTS } from "../../lib/districts";
import { isSafeExternalUrl, BLOOD_GROUPS } from "../../lib/student";
import { getVerifiedProfileImageUrl } from "../../lib/verified-profile-image";
import { revalidatePublicDirectories } from "../../lib/revalidate-public-directories";

const validBloodGroups: ReadonlySet<string> = new Set(BLOOD_GROUPS);

function getTextField(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function getSectionFromRoll(roll: string) {
  if (!/^\d{7}$/.test(roll)) return null;
  const number = Number(roll);
  if (number >= 2503001 && number <= 2503060) return "a";
  if (number >= 2503061 && number <= 2503120) return "b";
  if (number >= 2503121 && number <= 2503180) return "c";
  return null;
}

function validatedProfileFields(formData: FormData) {
  const roll = getTextField(formData, "roll");
  const section = getSectionFromRoll(roll);
  const fullName = getTextField(formData, "full_name");
  const address = getTextField(formData, "address");
  const nickname = getTextField(formData, "nickname");
  const email = getTextField(formData, "email").toLowerCase();
  const bloodGroup = getTextField(formData, "blood_group");
  const phoneNumber = getTextField(formData, "phone_number");
  const whatsappNumber =
    getTextField(formData, "whatsapp_same_as_phone") === "on"
      ? phoneNumber
      : getTextField(formData, "whatsapp_number");
  const facebookUrl = getTextField(formData, "facebook_url");

  if (!section) return { error: "Enter a valid CSE '25 roll number.", section };
  if (fullName.length < 2 || fullName.length > 120) {
    return { error: "Enter a name between 2 and 120 characters.", section };
  }
  if (!BANGLADESH_DISTRICTS.includes(address as (typeof BANGLADESH_DISTRICTS)[number])) {
    return { error: "Select a valid district.", section };
  }
  if (nickname.length > 40) return { error: "Nickname must be 40 characters or fewer.", section };
  if (email && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)) {
    return { error: "Enter a valid email address.", section };
  }
  if (bloodGroup && !validBloodGroups.has(bloodGroup)) {
    return { error: "Select a valid blood group.", section };
  }
  if (phoneNumber.length < 5 || phoneNumber.length > 32) {
    return { error: "Enter a valid phone number.", section };
  }
  if (whatsappNumber.length < 5 || whatsappNumber.length > 32) {
    return { error: "Enter a valid WhatsApp number.", section };
  }
  if (facebookUrl && (facebookUrl.length > 500 || !isSafeExternalUrl(facebookUrl))) {
    return { error: "Enter a valid Facebook profile URL.", section };
  }

  return {
    section,
    data: {
      full_name: fullName,
      nickname: nickname || null,
      roll: Number(roll),
      section,
      address,
      phone_number: phoneNumber,
      whatsapp_number: whatsappNumber,
      email: email || null,
      blood_group: bloodGroup || null,
      facebook_url: facebookUrl || null,
    },
  };
}

async function getImageUrl(formData: FormData, uid: string) {
  const imagePath = getTextField(formData, "image_path");
  if (!imagePath) return null;
  try {
    return await getVerifiedProfileImageUrl(imagePath, uid);
  } catch (error) {
    console.error("Profile photo verification failed:", error);
    throw new Error("The uploaded profile photo could not be verified.");
  }
}

function redirectActionError(path: string, error: unknown): never {
  const message = error instanceof Error ? error.message : "The request could not be completed.";
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function isDuplicateRollError(error: unknown) {
  return error instanceof Error && error.message === "DUPLICATE_ROLL";
}

export async function addStudent(formData: FormData) {
  const admin = await requireFirebaseAdmin();
  const parsed = validatedProfileFields(formData);
  if ("error" in parsed) redirectActionError("/admin/dashboard", parsed.error);

  let imageUrl: string | null;
  try {
    imageUrl = await getImageUrl(formData, admin.uid);
  } catch (error) {
    redirectActionError("/admin/dashboard", error);
  }

  const { db } = getFirebaseAdmin();
  const profileRef = db.collection("profiles").doc();
  const rollRef = db.collection("profile_rolls").doc(String(parsed.data.roll));
  try {
    await db.runTransaction(async (transaction) => {
      const [existing, matchingProfiles] = await Promise.all([
        transaction.get(rollRef),
        transaction.get(
          db.collection("profiles").where("roll", "==", parsed.data.roll).limit(1),
        ),
      ]);
      if (existing.exists || !matchingProfiles.empty) throw new Error("DUPLICATE_ROLL");
      const now = new Date().toISOString();
      transaction.create(profileRef, {
        ...parsed.data,
        image_url: imageUrl,
        owner_uid: null,
        created_by: admin.uid,
        created_at: now,
        updated_at: now,
      });
      transaction.create(rollRef, { profile_id: profileRef.id, status: "approved" });
    });
  } catch (error) {
    if (isDuplicateRollError(error)) {
      redirectActionError("/admin/dashboard", "A profile with this roll number already exists.");
    }
    console.error("Failed to add a Firestore student profile:", error);
    redirectActionError("/admin/dashboard", "The student record could not be saved.");
  }

  revalidatePublicDirectories();
  revalidatePath("/admin/dashboard");
  redirect("/admin/dashboard?success=Student successfully added to the directory.");
}

export async function updateStudent(formData: FormData) {
  const admin = await requireFirebaseAdmin();
  const id = getTextField(formData, "id");
  if (!/^[A-Za-z0-9_-]{1,150}$/.test(id)) {
    redirectActionError("/admin/dashboard", "Invalid student record.");
  }
  const editPath = `/admin/edit/${encodeURIComponent(id)}`;
  const parsed = validatedProfileFields(formData);
  if ("error" in parsed) redirectActionError(editPath, parsed.error);

  let imageUrl: string | null;
  try {
    imageUrl = await getImageUrl(formData, admin.uid);
  } catch (error) {
    redirectActionError(editPath, error);
  }

  const { db } = getFirebaseAdmin();
  const profileRef = db.collection("profiles").doc(id);
  const newRollRef = db.collection("profile_rolls").doc(String(parsed.data.roll));
  try {
    await db.runTransaction(async (transaction) => {
      const [profileSnap, newRollSnap, matchingProfiles] = await Promise.all([
        transaction.get(profileRef),
        transaction.get(newRollRef),
        transaction.get(
          db.collection("profiles").where("roll", "==", parsed.data.roll).limit(2),
        ),
      ]);
      if (!profileSnap.exists) throw new Error("PROFILE_NOT_FOUND");
      const profile = profileSnap.data();
      if (!profile) throw new Error("PROFILE_NOT_FOUND");
      if (matchingProfiles.docs.some((match) => match.id !== id)) {
        throw new Error("DUPLICATE_ROLL");
      }
      if (newRollSnap.exists && newRollSnap.data()?.profile_id !== id) {
        throw new Error("DUPLICATE_ROLL");
      }

      const oldRollRef = db.collection("profile_rolls").doc(String(profile.roll));
      const oldRollSnap = profile.roll === parsed.data.roll
        ? newRollSnap
        : await transaction.get(oldRollRef);
      if (profile.roll !== parsed.data.roll && oldRollSnap.data()?.profile_id === id) {
        transaction.delete(oldRollRef);
      }
      transaction.set(newRollRef, { profile_id: id, status: "approved" });
      transaction.update(profileRef, {
        ...parsed.data,
        ...(imageUrl ? { image_url: imageUrl } : {}),
        updated_at: new Date().toISOString(),
      });
    });
  } catch (error) {
    if (isDuplicateRollError(error)) {
      redirectActionError(editPath, "That roll number is already assigned to another student.");
    }
    if (error instanceof Error && error.message === "PROFILE_NOT_FOUND") {
      redirectActionError("/admin/dashboard", "Student record not found.");
    }
    console.error("Failed to update a Firestore student profile:", error);
    redirectActionError(editPath, "The student record could not be updated.");
  }

  revalidatePublicDirectories();
  revalidatePath("/admin/dashboard");
  revalidatePath(editPath);
  redirect(`${editPath}?success=${encodeURIComponent("Saved changes successfully.")}`);
}

export async function deleteStudent(formData: FormData) {
  await requireFirebaseAdmin();
  const id = getTextField(formData, "id");
  if (!/^[A-Za-z0-9_-]{1,150}$/.test(id)) {
    redirectActionError("/admin/dashboard", "Invalid student record.");
  }

  const { db } = getFirebaseAdmin();
  const profileRef = db.collection("profiles").doc(id);
  try {
    await db.runTransaction(async (transaction) => {
      const profileSnap = await transaction.get(profileRef);
      if (!profileSnap.exists) throw new Error("PROFILE_NOT_FOUND");
      const profile = profileSnap.data();
      if (!profile) throw new Error("PROFILE_NOT_FOUND");
      const rollRef = db.collection("profile_rolls").doc(String(profile.roll));
      const rollSnap = await transaction.get(rollRef);
      transaction.delete(profileRef);
      if (rollSnap.data()?.profile_id === id) transaction.delete(rollRef);
    });
  } catch (error) {
    console.error("Failed to delete a Firestore student profile:", error);
    redirectActionError("/admin/dashboard", "The student record could not be deleted.");
  }

  revalidatePublicDirectories();
  revalidatePath("/admin/dashboard");
  redirect("/admin/dashboard?success=Student removed from the directory.");
}

export async function reviewStudentSubmission(formData: FormData) {
  await requireFirebaseAdmin();
  const id = getTextField(formData, "id");
  const decision = getTextField(formData, "decision");
  if (!/^[A-Za-z0-9_-]{1,150}$/.test(id) || !["approved", "rejected"].includes(decision)) {
    redirectActionError("/admin/dashboard", "Invalid student submission.");
  }

  const { db } = getFirebaseAdmin();
  const submissionRef = db.collection("student_submissions").doc(id);
  try {
    await db.runTransaction(async (transaction) => {
      const submissionSnap = await transaction.get(submissionRef);
      if (!submissionSnap.exists || submissionSnap.data()?.status !== "pending") {
        throw new Error("SUBMISSION_NOT_PENDING");
      }
      const submission = submissionSnap.data()!;
      const rollRef = db.collection("profile_rolls").doc(String(submission.roll));
      const [rollSnap, matchingProfiles] = await Promise.all([
        transaction.get(rollRef),
        transaction.get(
          db.collection("profiles").where("roll", "==", submission.roll).limit(1),
        ),
      ]);

      if (decision === "approved") {
        const ownsPendingReservation =
          rollSnap.data()?.status === "pending" &&
          rollSnap.data()?.submission_id === id &&
          (!rollSnap.data()?.user_id || rollSnap.data()?.user_id === submission.user_id);
        if ((rollSnap.exists && !ownsPendingReservation) || !matchingProfiles.empty) {
          throw new Error("DUPLICATE_ROLL");
        }
        const profileRef = db.collection("profiles").doc();
        transaction.create(profileRef, {
          full_name: submission.full_name,
          nickname: submission.nickname ?? null,
          roll: submission.roll,
          section: submission.section,
          address: submission.address,
          phone_number: submission.phone_number,
          whatsapp_number: submission.whatsapp_number,
          email: submission.email ?? null,
          blood_group: submission.blood_group ?? null,
          image_url: submission.image_url ?? null,
          facebook_url: submission.facebook_url ?? null,
          owner_uid: submission.user_id,
          created_by: submission.user_id,
          created_at: submission.submitted_at,
          updated_at: new Date().toISOString(),
        });
        transaction.set(rollRef, { profile_id: profileRef.id, status: "approved" });
      } else if (
        rollSnap.data()?.status === "pending" &&
        rollSnap.data()?.submission_id === id &&
        (!rollSnap.data()?.user_id || rollSnap.data()?.user_id === submission.user_id)
      ) {
        transaction.delete(rollRef);
      }

      transaction.update(submissionRef, {
        status: decision,
        reviewed_at: new Date().toISOString(),
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "DUPLICATE_ROLL") {
      redirectActionError("/admin/dashboard", "A profile with this roll number already exists.");
    }
    if (error instanceof Error && error.message === "SUBMISSION_NOT_PENDING") {
      redirectActionError("/admin/dashboard", "This submission has already been reviewed.");
    }
    console.error("Failed to review a Firestore student submission:", error);
    redirectActionError("/admin/dashboard", "The student submission could not be reviewed.");
  }

  if (decision === "approved") revalidatePublicDirectories();
  revalidatePath("/admin/dashboard");
  revalidatePath("/submit-profile");
  redirect(`/admin/dashboard?success=${encodeURIComponent(decision === "approved" ? "Profile approved and added to the directory." : "Submission rejected.")}`);
}

export async function submitStudentProfile(formData: FormData) {
  const user = await requireFirebaseUser();
  if (!user.email_verified || !user.email) {
    redirectActionError("/submit-profile", "Sign in with a verified Google account.");
  }

  const parsed = validatedProfileFields(formData);
  if ("error" in parsed) redirectActionError("/submit-profile", parsed.error);
  if (getTextField(formData, "public_consent") !== "on") {
    redirectActionError("/submit-profile", "Confirm which details will be shared publicly.");
  }

  let imageUrl: string | null;
  try {
    imageUrl = await getImageUrl(formData, user.uid);
  } catch (error) {
    redirectActionError("/submit-profile", error);
  }

  const { db } = getFirebaseAdmin();
  const submissionRef = db.collection("student_submissions").doc(user.uid);
  const rollRef = db.collection("profile_rolls").doc(String(parsed.data.roll));
  try {
    await db.runTransaction(async (transaction) => {
      const [submissionSnap, rollSnap, matchingProfiles] = await Promise.all([
        transaction.get(submissionRef),
        transaction.get(rollRef),
        transaction.get(
          db.collection("profiles").where("roll", "==", parsed.data.roll).limit(1),
        ),
      ]);
      if (rollSnap.exists || !matchingProfiles.empty) throw new Error("DUPLICATE_ROLL");
      if (submissionSnap.exists && submissionSnap.data()?.status === "pending") {
        throw new Error("SUBMISSION_PENDING");
      }

      const now = new Date().toISOString();
      transaction.set(rollRef, {
        status: "pending",
        user_id: user.uid,
        submission_id: user.uid,
      });
      transaction.set(submissionRef, {
        ...parsed.data,
        email: user.email,
        image_url: imageUrl,
        user_id: user.uid,
        status: "pending",
        submitted_at: now,
        reviewed_at: null,
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "DUPLICATE_ROLL") {
      redirectActionError("/submit-profile", "That roll number already has a profile or submission.");
    }
    if (error instanceof Error && error.message === "SUBMISSION_PENDING") {
      redirectActionError("/submit-profile", "Your profile is already waiting for review.");
    }
    console.error("Failed to save a Firestore student submission:", error);
    redirectActionError("/submit-profile", "Your profile could not be submitted. Please try again.");
  }

  revalidatePath("/admin/dashboard");
  redirect("/submit-profile?success=Your profile is submitted and waiting for admin approval.");
}

export async function updateOwnStudentProfile(formData: FormData) {
  const user = await requireFirebaseUser();
  if (!user.email_verified || !user.email) {
    redirectActionError("/submit-profile", "Sign in with a verified Google account.");
  }

  const fullName = getTextField(formData, "full_name");
  const nickname = getTextField(formData, "nickname");
  const address = getTextField(formData, "address");
  const phoneNumber = getTextField(formData, "phone_number");
  const whatsappNumber = getTextField(formData, "whatsapp_same_as_phone") === "on"
    ? phoneNumber
    : getTextField(formData, "whatsapp_number");
  const bloodGroup = getTextField(formData, "blood_group");
  const facebookUrl = getTextField(formData, "facebook_url");

  if (fullName.length < 2 || fullName.length > 120) {
    redirectActionError("/submit-profile", "Enter a name between 2 and 120 characters.");
  }
  if (nickname.length > 40) redirectActionError("/submit-profile", "Nickname must be 40 characters or fewer.");
  if (!BANGLADESH_DISTRICTS.includes(address as (typeof BANGLADESH_DISTRICTS)[number])) {
    redirectActionError("/submit-profile", "Select a valid district.");
  }
  if (phoneNumber.length < 5 || phoneNumber.length > 32 || whatsappNumber.length < 5 || whatsappNumber.length > 32) {
    redirectActionError("/submit-profile", "Enter valid phone and WhatsApp numbers.");
  }
  if (bloodGroup && !validBloodGroups.has(bloodGroup)) {
    redirectActionError("/submit-profile", "Select a valid blood group.");
  }
  if (facebookUrl && (facebookUrl.length > 500 || !isSafeExternalUrl(facebookUrl))) {
    redirectActionError("/submit-profile", "Enter a valid Facebook profile URL.");
  }

  let imageUrl: string | null;
  try {
    imageUrl = await getImageUrl(formData, user.uid);
  } catch (error) {
    redirectActionError("/submit-profile", error);
  }

  const { db } = getFirebaseAdmin();
  const profileQuery = db.collection("profiles").where("owner_uid", "==", user.uid).limit(1);
  const profileSnap = await profileQuery.get();
  const profileDoc = profileSnap.docs[0];
  if (!profileDoc) redirectActionError("/submit-profile", "No approved profile is linked to this account.");

  try {
    await db.runTransaction(async (transaction) => {
      const current = await transaction.get(profileDoc.ref);
      if (!current.exists || current.data()?.owner_uid !== user.uid) {
        throw new Error("PROFILE_NOT_OWNED");
      }
      transaction.update(profileDoc.ref, {
        full_name: fullName,
        nickname: nickname || null,
        address,
        phone_number: phoneNumber,
        whatsapp_number: whatsappNumber,
        email: user.email,
        blood_group: bloodGroup || null,
        facebook_url: facebookUrl || null,
        ...(imageUrl ? { image_url: imageUrl } : {}),
        updated_at: new Date().toISOString(),
      });
    });
  } catch (error) {
    console.error("Failed to update the signed-in student's profile:", error);
    redirectActionError("/submit-profile", "Your profile could not be updated.");
  }

  revalidatePublicDirectories();
  revalidatePath("/submit-profile");
  redirect("/submit-profile?success=Your profile changes are saved.");
}

export async function logoutAdmin() {
  const { cookies } = await import("next/headers");
  const { firebaseSessionCookieName } = await import("../../lib/firebase-session");
  (await cookies()).delete(firebaseSessionCookieName);
  revalidatePath("/", "layout");
  redirect("/");
}

export async function logoutStudent() {
  return logoutAdmin();
}
