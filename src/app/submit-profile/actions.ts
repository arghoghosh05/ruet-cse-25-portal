"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { BANGLADESH_DISTRICTS } from "../../lib/districts";
import { BLOOD_GROUPS, isSafeExternalUrl, getSectionFromRoll } from "../../lib/student";
import { getVerifiedProfileImageUrl, deleteAvatarFile } from "../../lib/verified-profile-image";
import { revalidatePublicDirectories } from "../../lib/revalidate-public-directories";
import { getSessionUser, createSessionFromIdToken, destroySession } from "../../lib/firebase/session";
import { adminDb, adminAuth } from "../../lib/firebase/admin";

const validBloodGroups: ReadonlySet<string> = new Set(BLOOD_GROUPS);

function getTextField(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Log in using Roll number and Password
 */
export async function requestStudentLogin(formData: FormData) {
  const roll = getTextField(formData, "roll");
  const password = getTextField(formData, "password");

  if (!/^\d{7}$/.test(roll) || Number(roll) < 2503001 || Number(roll) > 2503180 || !password) {
    redirect("/submit-profile?error=Enter your roll number and password.");
  }

  // Look up student account by roll in Firestore
  const accountDoc = await adminDb.collection("student_accounts").doc(roll).get();
  if (!accountDoc.exists) {
    redirect("/submit-profile?error=No account was found for that roll number. Please sign up or continue with Google.");
  }

  const account = accountDoc.data()!;
  if (account.status !== "approved") {
    redirect("/submit-profile?error=Your account is pending review. Please contact an admin.");
  }

  try {
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
          email: account.email,
          password,
          returnSecureToken: true,
        }),
      },
    );

    const data = await signInRes.json();
    if (!signInRes.ok || !data.idToken) {
      redirect("/submit-profile?error=The roll number or password is incorrect.");
    }

    const sessionRes = await createSessionFromIdToken(data.idToken);
    if (!sessionRes.success) {
      redirect("/submit-profile?error=Failed to establish session. Please try again.");
    }
  } catch (err: unknown) {
    if (typeof err === "object" && err !== null && "digest" in err) {
      throw err;
    }
    console.error("Student login error:", err);
    redirect("/submit-profile?error=The roll number or password is incorrect.");
  }

  redirect("/submit-profile");
}

/**
 * Link a verified Google account to a roll number
 */
export async function linkGoogleAccountWithRoll(formData: FormData) {
  const user = await getSessionUser();
  if (!user || !user.email) {
    redirect("/submit-profile?error=Please sign in with Google first.");
  }

  const roll = getTextField(formData, "roll");
  if (!/^\d{7}$/.test(roll) || Number(roll) < 2503001 || Number(roll) > 2503180) {
    redirect(`/submit-profile?link_roll=1&error=${encodeURIComponent("Enter a valid seven-digit CSE 25-series roll number.")}`);
  }

  const rollNum = Number(roll);
  const accountRef = adminDb.collection("student_accounts").doc(roll);

  // Check if roll is already claimed
  const existingAccount = await accountRef.get();
  if (existingAccount.exists) {
    const data = existingAccount.data()!;
    if (data.uid !== user.uid && data.email !== user.email) {
      redirect(`/submit-profile?link_roll=1&error=${encodeURIComponent("That roll number is already claimed by another account. Contact an admin if this is an error.")}`);
    }
  }

  // Check if user already linked another roll
  const userAccounts = await adminDb.collection("student_accounts").where("uid", "==", user.uid).get();
  if (!userAccounts.empty && userAccounts.docs[0].id !== roll) {
    redirect(`/submit-profile?error=${encodeURIComponent("Your Google account is already linked to a different roll number.")}`);
  }

  // Check if profile exists
  const profileDoc = await adminDb.collection("profiles").doc(roll).get();
  const hasProfile = profileDoc.exists;

  // Atomically save student account
  await accountRef.set(
    {
      roll: rollNum,
      uid: user.uid,
      email: user.email.toLowerCase(),
      status: "approved",
      has_profile: hasProfile,
      provider: "google",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { merge: true },
  );

  redirect("/submit-profile?success=Account successfully linked! You can now submit or manage your profile.");
}

/**
 * Create student account with email and password
 */
export async function completeStudentAccount(formData: FormData) {
  const roll = getTextField(formData, "roll");
  const email = getTextField(formData, "email").toLowerCase();
  const password = getTextField(formData, "password");
  const confirmPassword = getTextField(formData, "confirm_password");

  if (!/^\d{7}$/.test(roll) || Number(roll) < 2503001 || Number(roll) > 2503180) {
    redirect("/submit-profile?error=Enter a valid seven-digit CSE 25-series roll number.");
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    redirect(`/submit-profile?setup=1&roll=${encodeURIComponent(roll)}&error=Enter a valid email address.`);
  }
  if (password.length < 8 || password.length > 72) {
    redirect(`/submit-profile?setup=1&roll=${encodeURIComponent(roll)}&error=Choose a password between 8 and 72 characters.`);
  }
  if (password !== confirmPassword) {
    redirect(`/submit-profile?setup=1&roll=${encodeURIComponent(roll)}&error=The passwords do not match.`);
  }

  // Check if roll already exists
  const accountRef = adminDb.collection("student_accounts").doc(roll);
  const existing = await accountRef.get();
  if (existing.exists) {
    redirect("/submit-profile?error=That roll number is already registered. Please log in or contact an admin.");
  }

  try {
    // Create user in Firebase Auth
    let userRecord;
    try {
      userRecord = await adminAuth.createUser({
        email,
        password,
        emailVerified: true,
      });
    } catch (authErr: any) {
      if (authErr.code === "auth/email-already-exists") {
        redirect("/submit-profile?error=An account with this email already exists. Try logging in or use Google sign-in.");
      }
      throw authErr;
    }

    const profileDoc = await adminDb.collection("profiles").doc(roll).get();

    await accountRef.set({
      roll: Number(roll),
      uid: userRecord.uid,
      email,
      status: "approved",
      has_profile: profileDoc.exists,
      provider: "password",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  } catch (err: unknown) {
    if (typeof err === "object" && err !== null && "digest" in err) {
      throw err;
    }
    console.error("Failed to complete student account:", err);
    redirect("/submit-profile?error=Failed to create account. Please try again.");
  }

  redirect("/submit-profile?success=Account created successfully. Log in with your roll number and password.");
}

/**
 * Submit student profile for admin review
 */
export async function submitStudentProfile(formData: FormData) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/submit-profile?error=Your session has expired. Sign in again to submit your profile.");
  }

  const fullName = getTextField(formData, "full_name");
  const roll = getTextField(formData, "roll");
  const nickname = getTextField(formData, "nickname");
  const address = getTextField(formData, "address");
  const phoneNumber = getTextField(formData, "phone_number");
  const whatsappSameAsPhone = getTextField(formData, "whatsapp_same_as_phone") === "on";
  const whatsappNumber = whatsappSameAsPhone
    ? phoneNumber
    : getTextField(formData, "whatsapp_number");
  const bloodGroup = getTextField(formData, "blood_group");
  const facebookUrl = getTextField(formData, "facebook_url");
  const imagePath = getTextField(formData, "image_path");
  const publicConsent = getTextField(formData, "public_consent") === "on";

  if (fullName.length < 2 || fullName.length > 120) {
    redirect("/submit-profile?error=Enter your full name.");
  }
  if (!/^\d{7}$/.test(roll) || Number(roll) < 2503001 || Number(roll) > 2503180) {
    redirect("/submit-profile?error=Enter a valid CSE 25-series roll number.");
  }
  if (nickname.length > 40) {
    redirect("/submit-profile?error=Nickname must be 40 characters or fewer.");
  }
  if (!BANGLADESH_DISTRICTS.some((district) => district === address)) {
    redirect("/submit-profile?error=Select your district.");
  }
  if (phoneNumber.length < 5 || phoneNumber.length > 32) {
    redirect("/submit-profile?error=Enter a valid phone number.");
  }
  if (whatsappNumber.length < 5 || whatsappNumber.length > 32) {
    redirect("/submit-profile?error=Enter a valid WhatsApp number.");
  }
  if (bloodGroup && !validBloodGroups.has(bloodGroup)) {
    redirect("/submit-profile?error=Select a valid blood group.");
  }
  if (facebookUrl && (!isSafeExternalUrl(facebookUrl) || facebookUrl.length > 500)) {
    redirect("/submit-profile?error=Enter a valid Facebook profile URL (e.g. https://facebook.com/username).");
  }
  if (!publicConsent) {
    redirect("/submit-profile?error=Please confirm which profile details will be public.");
  }

  // Check if profile is already published
  const existingProfile = await adminDb.collection("profiles").doc(roll).get();
  if (existingProfile.exists) {
    redirect("/submit-profile?error=A profile with that roll number is already in the directory.");
  }

  // Verify uploaded image if present
  let verifiedImage: { url: string; storagePath: string } | null = null;
  if (imagePath) {
    verifiedImage = await getVerifiedProfileImageUrl(imagePath, user.uid);
    if (!verifiedImage) {
      redirect("/submit-profile?error=The uploaded image could not be verified.");
    }
  }

  const section = getSectionFromRoll(roll);

  // Store in student_submissions collection
  await adminDb.collection("student_submissions").add({
    user_id: user.uid,
    full_name: fullName,
    nickname: nickname || null,
    roll: Number(roll),
    section,
    address,
    phone_number: phoneNumber,
    whatsapp_number: whatsappNumber,
    blood_group: bloodGroup || null,
    email: user.email || null,
    facebook_url: facebookUrl || null,
    image_url: verifiedImage ? verifiedImage.url : null,
    image_storage_path: verifiedImage ? verifiedImage.storagePath : null,
    public_consent: publicConsent,
    status: "pending",
    submitted_at: new Date().toISOString(),
    reviewed_at: null,
  });

  revalidatePath("/submit-profile");
  revalidatePath("/admin/dashboard");
  redirect("/submit-profile?success=Your profile is submitted and waiting for admin approval.");
}

/**
 * Update student's own profile after approval
 */
export async function updateOwnStudentProfile(formData: FormData) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/submit-profile?error=Your session has expired. Sign in again to edit your profile.");
  }

  // Find student's linked account
  const accountQuery = await adminDb.collection("student_accounts").where("uid", "==", user.uid).get();
  if (accountQuery.empty) {
    redirect("/submit-profile?error=No linked student account found.");
  }

  const accountDoc = accountQuery.docs[0];
  const rollStr = accountDoc.id;

  const profileRef = adminDb.collection("profiles").doc(rollStr);
  const profileDoc = await profileRef.get();
  if (!profileDoc.exists) {
    redirect("/submit-profile?error=Your directory profile was not found.");
  }

  const currentProfile = profileDoc.data()!;

  const fullName = getTextField(formData, "full_name");
  const nickname = getTextField(formData, "nickname");
  const address = getTextField(formData, "address");
  const phoneNumber = getTextField(formData, "phone_number");
  const whatsappSameAsPhone = getTextField(formData, "whatsapp_same_as_phone") === "on";
  const whatsappNumber = whatsappSameAsPhone
    ? phoneNumber
    : getTextField(formData, "whatsapp_number");
  const bloodGroup = getTextField(formData, "blood_group");
  const facebookUrl = getTextField(formData, "facebook_url");
  const imagePath = getTextField(formData, "image_path");
  const removeImage = getTextField(formData, "remove_image") === "true";

  if (fullName.length < 2 || fullName.length > 120) {
    redirect("/submit-profile?error=Enter your full name.");
  }
  if (nickname.length > 40) {
    redirect("/submit-profile?error=Nickname must be 40 characters or fewer.");
  }
  if (!BANGLADESH_DISTRICTS.some((district) => district === address)) {
    redirect("/submit-profile?error=Select your district.");
  }
  if (phoneNumber.length < 5 || phoneNumber.length > 32) {
    redirect("/submit-profile?error=Enter a valid phone number.");
  }
  if (whatsappNumber.length < 5 || whatsappNumber.length > 32) {
    redirect("/submit-profile?error=Enter a valid WhatsApp number.");
  }
  if (bloodGroup && !validBloodGroups.has(bloodGroup)) {
    redirect("/submit-profile?error=Select a valid blood group.");
  }
  if (facebookUrl && (!isSafeExternalUrl(facebookUrl) || facebookUrl.length > 500)) {
    redirect("/submit-profile?error=Enter a valid Facebook profile URL (e.g. https://facebook.com/username).");
  }

  let newImageUrl = currentProfile.image_url;
  let newStoragePath = currentProfile.image_storage_path;

  // Handle image removal option
  if (removeImage) {
    if (currentProfile.image_storage_path) {
      await deleteAvatarFile(currentProfile.image_storage_path);
    }
    newImageUrl = null;
    newStoragePath = null;
  } else if (imagePath) {
    // Handle image update & prune previous file
    const verifiedImage = await getVerifiedProfileImageUrl(imagePath, user.uid);
    if (!verifiedImage) {
      redirect("/submit-profile?error=The uploaded image could not be verified.");
    }
    if (currentProfile.image_storage_path && currentProfile.image_storage_path !== verifiedImage.storagePath) {
      await deleteAvatarFile(currentProfile.image_storage_path);
    }
    newImageUrl = verifiedImage.url;
    newStoragePath = verifiedImage.storagePath;
  }

  await profileRef.update({
    full_name: fullName,
    nickname: nickname || null,
    address,
    phone_number: phoneNumber,
    whatsapp_number: whatsappNumber,
    blood_group: bloodGroup || null,
    facebook_url: facebookUrl || null,
    image_url: newImageUrl,
    image_storage_path: newStoragePath,
    email: user.email || currentProfile.email,
    updated_at: new Date().toISOString(),
  });

  revalidatePublicDirectories();
  revalidatePath("/submit-profile");
  redirect("/submit-profile?success=Your profile changes are saved.");
}

export async function logoutStudent() {
  await destroySession();
  redirect("/");
}
