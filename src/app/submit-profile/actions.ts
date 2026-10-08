"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "../../../utils/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { BANGLADESH_DISTRICTS } from "../../lib/districts";
import { BLOOD_GROUPS, isSafeExternalUrl } from "../../lib/student";
import { getVerifiedProfileImageUrl } from "../../lib/verified-profile-image";
import { revalidatePublicDirectories } from "../../lib/revalidate-public-directories";

const validBloodGroups: ReadonlySet<string> = new Set(BLOOD_GROUPS);

function createStudentAuthAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Student authentication requires the server-only SUPABASE_SERVICE_ROLE_KEY environment variable.");
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}

function getTextField(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export async function requestStudentLogin(formData: FormData) {
  const roll = getTextField(formData, "roll");
  const password = getTextField(formData, "password");

  if (!/^\d{7}$/.test(roll) || Number(roll) < 2503001 || Number(roll) > 2503180 || !password) {
    redirect("/submit-profile?error=Enter your roll number and password.");
  }

  let authAdmin: ReturnType<typeof createStudentAuthAdminClient>;
  try {
    authAdmin = createStudentAuthAdminClient();
  } catch (error) {
    console.error("Student login is not configured:", error);
    redirect("/submit-profile?error=Student login setup is incomplete. Please contact the portal admin.");
  }

  const { data: account, error: accountError } = await authAdmin
    .from("student_accounts")
    .select("email, status")
    .eq("roll", Number(roll))
    .maybeSingle();

  if (accountError) {
    console.error("Failed to look up student login:", accountError.message);
    redirect("/submit-profile?error=Student login is temporarily unavailable. Please try again later.");
  }
  if (!account || account.status !== "approved") {
    redirect("/submit-profile?error=No account was found for that roll. Create your account first.");
  }

  const supabase = await createClient();
  const { error: loginError } = await supabase.auth.signInWithPassword({
    email: account.email,
    password,
  });

  if (loginError) {
    redirect("/submit-profile?error=The roll number or password is incorrect.");
  }
  redirect("/submit-profile");
}

export async function completeStudentAccount(formData: FormData) {
  const roll = getTextField(formData, "roll");
  const password = getTextField(formData, "password");
  const confirmPassword = getTextField(formData, "confirm_password");

  if (!/^\d{7}$/.test(roll) || Number(roll) < 2503001 || Number(roll) > 2503180) {
    redirect("/submit-profile?error=Your verified account is missing a valid roll number. Start account creation again.");
  }
  if (password.length < 8 || password.length > 72) {
    redirect(`/submit-profile?setup=1&roll=${encodeURIComponent(roll)}&error=Choose a password between 8 and 72 characters.`);
  }
  if (password !== confirmPassword) {
    redirect(`/submit-profile?setup=1&roll=${encodeURIComponent(roll)}&error=The passwords do not match.`);
  }

  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData.user;
  if (userError || !user || !user.email_confirmed_at) {
    redirect("/submit-profile?error=Verify your email again before setting a password.");
  }

  const { data: accountStatus, error: accountError } = await supabase.rpc(
    "register_student_account",
    { p_roll: roll },
  );
  if (accountError) {
    if (accountError.code === "23505") {
      redirect("/submit-profile?error=That roll number is already linked to another student account. Contact an admin if this is a mistake.");
    }
    console.error("Failed to register student roll account:", accountError.message);
    redirect("/submit-profile?error=Your account could not be created. Please try again.");
  }

  const { error: passwordError } = await supabase.auth.updateUser({ password });
  if (passwordError) {
    console.error("Failed to set student account password:", passwordError.message);
    redirect(`/submit-profile?setup=1&roll=${encodeURIComponent(roll)}&error=Your password could not be saved. Please try again.`);
  }

  const { error: signOutError } = await supabase.auth.signOut({ scope: "local" });
  if (signOutError) {
    console.error("Failed to finish student account setup sign-out:", signOutError.message);
    redirect(`/submit-profile?success=${encodeURIComponent("Password created. Sign out, then log in with your roll number and password.")}`);
  }

  if (accountStatus !== "approved") {
    console.error("Student account registration returned an unexpected status:", accountStatus);
    redirect("/submit-profile?error=Your account status could not be confirmed. Please contact the portal admin.");
  }
  redirect(`/submit-profile?success=${encodeURIComponent("Account created. Log in with your roll number and new password.")}`);
}

export async function submitStudentProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData.user;

  if (userError || !user || !user.email_confirmed_at) {
    redirect("/submit-profile?error=Verify your email before submitting a profile.");
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
    redirect("/submit-profile?error=Enter a valid Facebook profile URL.");
  }
  if (!publicConsent) {
    redirect("/submit-profile?error=Please confirm which profile details will be public.");
  }

  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) {
    redirect("/submit-profile?error=Your session has expired. Sign in again and retry.");
  }
  const imageUrl = await getVerifiedProfileImageUrl(supabase, imagePath, userId);
  if (imagePath && !imageUrl) {
    redirect("/submit-profile?error=The uploaded image could not be verified.");
  }

  const { error } = await supabase.rpc("submit_student_profile", {
    p_full_name: fullName,
    p_roll: roll,
    p_nickname: nickname || null,
    p_address: address,
    p_phone_number: phoneNumber,
    p_whatsapp_number: whatsappNumber,
    p_blood_group: bloodGroup || null,
    p_public_consent: publicConsent,
    p_facebook_url: facebookUrl || null,
    p_image_url: imageUrl,
  });

  if (error) {
    if (error.code === "23505") {
      redirect("/submit-profile?error=A profile with that roll number is already registered or awaiting review.");
    }
    console.error("Failed to submit student profile:", error.message);
    redirect("/submit-profile?error=Your profile could not be submitted. Please try again.");
  }

  revalidatePath("/submit-profile");
  revalidatePath("/admin/dashboard");
  redirect("/submit-profile?success=Your profile is submitted and waiting for admin approval.");
}

export async function updateOwnStudentProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) {
    redirect("/submit-profile?error=Your session has expired. Sign in again to edit your profile.");
  }

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
    redirect("/submit-profile?error=Enter a valid Facebook profile URL.");
  }

  const imageUrl = await getVerifiedProfileImageUrl(supabase, imagePath, userId);
  if (imagePath && !imageUrl) {
    redirect("/submit-profile?error=The uploaded image could not be verified.");
  }

  const { error } = await supabase.rpc("update_own_student_profile", {
    p_full_name: fullName,
    p_nickname: nickname || null,
    p_address: address,
    p_phone_number: phoneNumber,
    p_whatsapp_number: whatsappNumber,
    p_blood_group: bloodGroup || null,
    p_facebook_url: facebookUrl || null,
    p_image_url: imageUrl,
  });
  if (error) {
    console.error("Failed to update own student profile:", error.message);
    redirect("/submit-profile?error=Your profile could not be updated. Please try again.");
  }

  revalidatePublicDirectories();
  revalidatePath("/submit-profile");
  redirect("/submit-profile?success=Your profile changes are saved.");
}

export async function logoutStudent() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut({ scope: "local" });
  if (error) {
    console.error("Failed to sign out student:", error.message);
    redirect("/submit-profile?error=Sign out failed. Please try again.");
  }
  redirect("/");
}
