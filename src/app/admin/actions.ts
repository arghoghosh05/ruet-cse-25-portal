"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { BLOOD_GROUPS, isSafeExternalUrl, getSectionFromRoll } from "../../lib/student";
import { BANGLADESH_DISTRICTS } from "../../lib/districts";
import { requireAdminSession, destroySession, createSessionFromIdToken } from "../../lib/firebase/session";
import { adminDb, adminAuth } from "../../lib/firebase/admin";
import { getVerifiedProfileImageUrl, deleteAvatarFile } from "../../lib/verified-profile-image";
import { revalidatePublicDirectories } from "../../lib/revalidate-public-directories";
import { isAdminIdentity } from "../../lib/admin-auth";

const validBloodGroups: ReadonlySet<string> = new Set(BLOOD_GROUPS);

function getTextField(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

async function requireAdmin() {
  const user = await requireAdminSession();
  return { userId: user.uid, email: user.email };
}

export async function loginAdmin(formData: FormData) {
  const email = getTextField(formData, "email").toLowerCase();
  const password = getTextField(formData, "password");
  if (!email || !password) redirect("/admin/login?error=Enter your email and password.");

  if (!isAdminIdentity(email)) {
    redirect("/admin/login?error=This account is not authorized for admin access.");
  }

  try {
    // Authenticate with Firebase Auth REST API for server-side email/password
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (!apiKey) {
      throw new Error("Missing NEXT_PUBLIC_FIREBASE_API_KEY");
    }

    const signInRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          returnSecureToken: true,
        }),
      },
    );

    const data = await signInRes.json();
    if (!signInRes.ok || !data.idToken) {
      redirect("/admin/login?error=Invalid credentials");
    }

    const sessionRes = await createSessionFromIdToken(data.idToken);
    if (!sessionRes.success) {
      redirect("/admin/login?error=Failed to create admin session");
    }
  } catch (err: unknown) {
    if (typeof err === "object" && err !== null && "digest" in err) {
      throw err; // Re-throw Next.js redirects
    }
    console.error("Admin login error:", err);
    redirect("/admin/login?error=Invalid credentials");
  }

  revalidatePath("/", "layout");
  redirect("/admin/dashboard");
}

export async function logoutAdmin() {
  await destroySession();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function addStudent(formData: FormData) {
  const { userId } = await requireAdmin();

  const roll = getTextField(formData, "roll");
  const autoSection = getSectionFromRoll(roll);
  const fullName = getTextField(formData, "full_name");
  const address = getTextField(formData, "address");
  const nickname = getTextField(formData, "nickname");
  const email = getTextField(formData, "email");
  const bloodGroup = getTextField(formData, "blood_group");
  const phoneNumber = getTextField(formData, "phone_number");
  const whatsappSameAsPhone = getTextField(formData, "whatsapp_same_as_phone") === "on";
  const whatsappNumber = whatsappSameAsPhone
    ? phoneNumber
    : getTextField(formData, "whatsapp_number");

  if (autoSection === "invalid") {
    redirect("/admin/dashboard?error=Invalid Roll Number. Must be between 2503001 and 2503180.");
  }
  if (fullName.length < 2 || fullName.length > 120) {
    redirect("/admin/dashboard?error=Enter a name between 2 and 120 characters.");
  }
  if (!BANGLADESH_DISTRICTS.some((district) => district === address)) {
    redirect("/admin/dashboard?error=Select a valid district.");
  }
  if (nickname.length > 40) {
    redirect("/admin/dashboard?error=Nickname must be 40 characters or fewer.");
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    redirect("/admin/dashboard?error=Please enter a valid email address.");
  }
  if (bloodGroup && !validBloodGroups.has(bloodGroup)) {
    redirect("/admin/dashboard?error=Please select a valid blood group.");
  }
  if (phoneNumber.length < 5 || phoneNumber.length > 32) {
    redirect("/admin/dashboard?error=Enter a valid phone number.");
  }
  if (whatsappNumber.length < 5 || whatsappNumber.length > 32) {
    redirect("/admin/dashboard?error=Enter a valid WhatsApp number.");
  }
  const facebookUrl = getTextField(formData, "facebook_url");
  if (facebookUrl && (facebookUrl.length > 500 || !isSafeExternalUrl(facebookUrl))) {
    redirect("/admin/dashboard?error=Please enter a valid Facebook profile URL (e.g. https://facebook.com/username).");
  }

  // Check duplicate roll
  const profileDoc = await adminDb.collection("profiles").doc(roll).get();
  if (profileDoc.exists) {
    redirect("/admin/dashboard?error=Duplicate Entry: A student with this Roll Number is already registered.");
  }

  const imagePath = getTextField(formData, "image_path");
  let verifiedImage: { url: string; storagePath: string } | null = null;
  if (imagePath) {
    verifiedImage = await getVerifiedProfileImageUrl(imagePath, userId);
    if (!verifiedImage) {
      redirect("/admin/dashboard?error=The uploaded image could not be verified.");
    }
  }

  const studentData = {
    id: roll,
    full_name: fullName,
    roll: Number(roll),
    section: autoSection,
    address,
    phone_number: phoneNumber,
    whatsapp_number: whatsappNumber,
    nickname: nickname || null,
    email: email || null,
    blood_group: bloodGroup || null,
    image_url: verifiedImage ? verifiedImage.url : null,
    image_storage_path: verifiedImage ? verifiedImage.storagePath : null,
    facebook_url: facebookUrl || null,
    created_by: userId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  await adminDb.collection("profiles").doc(roll).set(studentData);

  revalidatePublicDirectories();
  revalidatePath("/admin/dashboard");
  redirect("/admin/dashboard?success=Student successfully added to the directory!");
}

export async function updateStudent(formData: FormData) {
  const { userId } = await requireAdmin();
  const id = getTextField(formData, "id");
  if (!id) redirect("/admin/dashboard?error=Invalid student record.");
  const editPath = `/admin/edit/${encodeURIComponent(id)}`;
  const redirectEditWithError = (message: string): never =>
    redirect(`${editPath}?error=${encodeURIComponent(message)}`);

  const roll = getTextField(formData, "roll");
  const autoSection = getSectionFromRoll(roll);
  const fullName = getTextField(formData, "full_name");
  const address = getTextField(formData, "address");
  const nickname = getTextField(formData, "nickname");
  const email = getTextField(formData, "email");
  const bloodGroup = getTextField(formData, "blood_group");
  const phoneNumber = getTextField(formData, "phone_number");
  const whatsappSameAsPhone = getTextField(formData, "whatsapp_same_as_phone") === "on";
  const whatsappNumber = whatsappSameAsPhone
    ? phoneNumber
    : getTextField(formData, "whatsapp_number");

  if (autoSection === "invalid") {
    redirectEditWithError("Invalid Roll Number. Must be between 2503001 and 2503180.");
  }
  if (fullName.length < 2 || fullName.length > 120) {
    redirectEditWithError("Enter a name between 2 and 120 characters.");
  }
  if (!BANGLADESH_DISTRICTS.some((district) => district === address)) {
    redirectEditWithError("Select a valid district.");
  }
  if (nickname.length > 40) {
    redirectEditWithError("Nickname must be 40 characters or fewer.");
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    redirectEditWithError("Please enter a valid email address.");
  }
  if (bloodGroup && !validBloodGroups.has(bloodGroup)) {
    redirectEditWithError("Please select a valid blood group.");
  }
  if (phoneNumber.length < 5 || phoneNumber.length > 32) {
    redirectEditWithError("Enter a valid phone number.");
  }
  if (whatsappNumber.length < 5 || whatsappNumber.length > 32) {
    redirectEditWithError("Enter a valid WhatsApp number.");
  }
  const facebookUrl = getTextField(formData, "facebook_url");
  if (facebookUrl && (facebookUrl.length > 500 || !isSafeExternalUrl(facebookUrl))) {
    redirectEditWithError("Please enter a valid Facebook profile URL (e.g. https://facebook.com/username).");
  }

  const profileRef = adminDb.collection("profiles").doc(id);
  const existingDoc = await profileRef.get();
  if (!existingDoc.exists) {
    redirectEditWithError("No student record was found to update.");
  }
  const existingData = existingDoc.data()!;

  // Handle new image upload & prune old avatar
  const imagePath = getTextField(formData, "image_path");
  let newImageUrl = existingData.image_url;
  let newStoragePath = existingData.image_storage_path;

  if (imagePath) {
    const verifiedImage = await getVerifiedProfileImageUrl(imagePath, userId);
    if (!verifiedImage) {
      return redirectEditWithError("The uploaded image could not be verified.");
    }
    // Delete old avatar file from Firebase Storage
    if (existingData.image_storage_path && existingData.image_storage_path !== verifiedImage.storagePath) {
      await deleteAvatarFile(existingData.image_storage_path);
    }
    newImageUrl = verifiedImage.url;
    newStoragePath = verifiedImage.storagePath;
  }

  const updateData: Record<string, unknown> = {
    full_name: fullName,
    roll: Number(roll),
    section: autoSection,
    address,
    phone_number: phoneNumber,
    whatsapp_number: whatsappNumber,
    nickname: nickname || null,
    email: email || null,
    blood_group: bloodGroup || null,
    facebook_url: facebookUrl || null,
    image_url: newImageUrl,
    image_storage_path: newStoragePath,
    updated_at: new Date().toISOString(),
  };

  // If the admin changed the roll number, migrate doc and sync student account
  if (id !== roll) {
    const checkTarget = await adminDb.collection("profiles").doc(roll).get();
    if (checkTarget.exists) {
      redirectEditWithError(`Duplicate Entry: Roll ${roll} is already taken.`);
    }

    const batch = adminDb.batch();
    // Copy to new roll doc
    batch.set(adminDb.collection("profiles").doc(roll), { ...existingData, ...updateData, id: roll });
    // Delete old roll doc
    batch.delete(profileRef);

    // Sync student_accounts if existing
    const oldAccountRef = adminDb.collection("student_accounts").doc(id);
    const oldAccount = await oldAccountRef.get();
    if (oldAccount.exists) {
      batch.set(adminDb.collection("student_accounts").doc(roll), {
        ...oldAccount.data(),
        roll: Number(roll),
      });
      batch.delete(oldAccountRef);
    }

    await batch.commit();
  } else {
    await profileRef.update(updateData);
  }

  revalidatePublicDirectories();
  revalidatePath("/admin/dashboard");
  revalidatePath(editPath);
  redirect(`${editPath}?success=${encodeURIComponent("Saved changes successfully.")}`);
}

export async function deleteStudent(formData: FormData) {
  await requireAdmin();
  const id = getTextField(formData, "id");
  if (!id) redirect("/admin/dashboard?error=Invalid student record.");

  const profileRef = adminDb.collection("profiles").doc(id);
  const doc = await profileRef.get();
  if (!doc.exists) {
    redirect("/admin/dashboard?error=The profile was not found.");
  }

  const data = doc.data()!;

  // 1. Delete avatar from Firebase Storage
  if (data.image_storage_path) {
    await deleteAvatarFile(data.image_storage_path);
  }

  const batch = adminDb.batch();
  // 2. Delete profile
  batch.delete(profileRef);

  // 3. Reset student_accounts so the student account is not bricked
  const accountRef = adminDb.collection("student_accounts").doc(id);
  const accountDoc = await accountRef.get();
  if (accountDoc.exists) {
    batch.update(accountRef, {
      has_profile: false,
    });
  }

  await batch.commit();

  revalidatePublicDirectories();
  revalidatePath("/admin/dashboard");
  redirect("/admin/dashboard?success=Student removed from the directory.");
}

export async function reviewStudentSubmission(formData: FormData) {
  const { userId } = await requireAdmin();
  const id = getTextField(formData, "id");
  const decision = getTextField(formData, "decision");

  if (!id || !["approved", "rejected"].includes(decision)) {
    redirect("/admin/dashboard?error=Invalid student submission.");
  }

  const submissionRef = adminDb.collection("student_submissions").doc(id);
  const subDoc = await submissionRef.get();
  if (!subDoc.exists || subDoc.data()?.status !== "pending") {
    redirect("/admin/dashboard?error=This student submission is no longer pending.");
  }

  const sub = subDoc.data()!;
  const rollStr = String(sub.roll);

  if (decision === "approved") {
    // Check if profile with this roll already exists
    const profileDoc = await adminDb.collection("profiles").doc(rollStr).get();
    if (profileDoc.exists) {
      redirect("/admin/dashboard?error=A profile with this roll number already exists.");
    }

    const batch = adminDb.batch();

    // Create profile
    batch.set(adminDb.collection("profiles").doc(rollStr), {
      id: rollStr,
      full_name: sub.full_name,
      nickname: sub.nickname ?? null,
      roll: sub.roll,
      section: sub.section,
      address: sub.address,
      phone_number: sub.phone_number,
      whatsapp_number: sub.whatsapp_number,
      email: sub.email ?? null,
      blood_group: sub.blood_group ?? null,
      image_url: sub.image_url ?? null,
      image_storage_path: sub.image_storage_path ?? null,
      facebook_url: sub.facebook_url ?? null,
      created_by: sub.user_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Update student account
    const accountRef = adminDb.collection("student_accounts").doc(rollStr);
    batch.set(
      accountRef,
      {
        has_profile: true,
        updated_at: new Date().toISOString(),
      },
      { merge: true },
    );

    // Update submission status
    batch.update(submissionRef, {
      status: "approved",
      reviewed_at: new Date().toISOString(),
      reviewed_by: userId,
    });

    await batch.commit();
    revalidatePublicDirectories();
  } else {
    // Rejected: delete avatar if any to free storage
    if (sub.image_storage_path) {
      await deleteAvatarFile(sub.image_storage_path);
    }

    await submissionRef.update({
      status: "rejected",
      reviewed_at: new Date().toISOString(),
      reviewed_by: userId,
    });
  }

  revalidatePath("/admin/dashboard");
  revalidatePath("/submit-profile");
  redirect(
    `/admin/dashboard?success=${encodeURIComponent(
      decision === "approved" ? "Profile approved and added to the directory." : "Submission rejected.",
    )}`,
  );
}
