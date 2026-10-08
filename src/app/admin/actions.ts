"use server";

import { createClient } from "../../../utils/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { BLOOD_GROUPS, isSafeExternalUrl } from "../../lib/student";
import { BANGLADESH_DISTRICTS } from "../../lib/districts";
import { isAdminIdentity } from "../../lib/admin-auth";
import {
  getVerifiedProfileImageUrl,
} from "../../lib/verified-profile-image";
import { revalidatePublicDirectories } from "../../lib/revalidate-public-directories";

const validBloodGroups: ReadonlySet<string> = new Set(BLOOD_GROUPS);

function getTextField(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

async function requireAdmin() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (error || !claims?.sub || !isAdminIdentity(claims.email, claims.app_metadata)) {
    redirect("/admin/login?error=Admin access is required.");
  }

  return { supabase, userId: claims.sub };
}

export async function loginAdmin(formData: FormData) {
  const email = getTextField(formData, "email").trim();
  const password = getTextField(formData, "password");
  if (!email || !password) redirect("/admin/login?error=Enter your email and password.");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect("/admin/login?error=Invalid credentials");
  if (!isAdminIdentity(data.user.email, data.user.app_metadata)) {
    const { error: signOutError } = await supabase.auth.signOut({ scope: "local" });
    if (signOutError) {
      console.error("Failed to clear an unauthorized Supabase session:", signOutError.message);
    }
    redirect("/admin/login?error=This account is not authorized for admin access.");
  }
  revalidatePath("/", "layout");
  redirect("/admin/dashboard");
}

export async function logoutAdmin() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut({ scope: "local" });
  if (error) {
    console.error("Failed to sign out admin:", error.message);
    redirect("/admin/dashboard?error=Sign out failed. Please try again.");
  }
  revalidatePath("/", "layout");
  redirect("/");
}

function getSectionFromRoll(rollStr: string) {
  if (!/^\d{7}$/.test(rollStr)) return "invalid";
  const roll = Number(rollStr);
  if (roll >= 2503001 && roll <= 2503060) return "a";
  if (roll >= 2503061 && roll <= 2503120) return "b";
  if (roll >= 2503121 && roll <= 2503180) return "c";
  return "invalid"; 
}

export async function addStudent(formData: FormData) {
  const { supabase, userId } = await requireAdmin();
  
  const roll = getTextField(formData, "roll");
  const autoSection = getSectionFromRoll(roll);
  const fullName = getTextField(formData, "full_name").trim();
  const address = getTextField(formData, "address").trim();
  const nickname = getTextField(formData, "nickname").trim();
  const email = getTextField(formData, "email").trim();
  const bloodGroup = getTextField(formData, "blood_group");
  const phoneNumber = getTextField(formData, "phone_number").trim();
  const whatsappSameAsPhone = getTextField(formData, "whatsapp_same_as_phone") === "on";
  const whatsappNumber = whatsappSameAsPhone
    ? phoneNumber
    : getTextField(formData, "whatsapp_number").trim();

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
  const facebookUrl = getTextField(formData, "facebook_url").trim();
  if (facebookUrl && (facebookUrl.length > 500 || !isSafeExternalUrl(facebookUrl))) {
    redirect("/admin/dashboard?error=Please enter a valid Facebook profile URL.");
  }
  
  const imagePath = getTextField(formData, "image_path");
  const imageUrl = await getVerifiedProfileImageUrl(supabase, imagePath, userId);
  if (imagePath && !imageUrl) {
    redirect("/admin/dashboard?error=The uploaded image could not be verified.");
  }
  
  const studentData = {
    full_name: fullName,
    roll: roll,
    section: autoSection, // Hardcoded from math, cannot be spoofed
    address,
    phone_number: phoneNumber,
    whatsapp_number: whatsappNumber,
    nickname: nickname || null,
    email: email || null,
    blood_group: bloodGroup || null,
    image_url: imageUrl, 
    facebook_url: facebookUrl || null,
    created_by: userId,
  };

  const { error } = await supabase.from("profiles").insert(studentData);
  
  if (error) {
    if (error.code === "23505") {
      redirect("/admin/dashboard?error=Duplicate Entry: A student with this Roll Number is already registered.");
    }
    console.error("Failed to insert student profile:", error.message);
    redirect("/admin/dashboard?error=Failed to save the student record.");
  }
  
  revalidatePublicDirectories();
  revalidatePath("/admin/dashboard");
  redirect("/admin/dashboard?success=Student successfully added to the directory!");
}

export async function updateStudent(formData: FormData) {
  const { supabase, userId } = await requireAdmin();
  const id = getTextField(formData, "id");
  if (!id) redirect("/admin/dashboard?error=Invalid student record.");
  const editPath = `/admin/edit/${encodeURIComponent(id)}`;
  const redirectEditWithError = (message: string): never =>
    redirect(`${editPath}?error=${encodeURIComponent(message)}`);
  
  const roll = getTextField(formData, "roll");
  const autoSection = getSectionFromRoll(roll);
  const fullName = getTextField(formData, "full_name").trim();
  const address = getTextField(formData, "address").trim();
  const nickname = getTextField(formData, "nickname").trim();
  const email = getTextField(formData, "email").trim();
  const bloodGroup = getTextField(formData, "blood_group");
  const phoneNumber = getTextField(formData, "phone_number").trim();
  const whatsappSameAsPhone = getTextField(formData, "whatsapp_same_as_phone") === "on";
  const whatsappNumber = whatsappSameAsPhone
    ? phoneNumber
    : getTextField(formData, "whatsapp_number").trim();

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
  const facebookUrl = getTextField(formData, "facebook_url").trim();
  if (facebookUrl && (facebookUrl.length > 500 || !isSafeExternalUrl(facebookUrl))) {
    redirectEditWithError("Please enter a valid Facebook profile URL.");
  }
  
  const updateData = {
    full_name: fullName,
    roll: roll,
    section: autoSection,
    address,
    phone_number: phoneNumber,
    whatsapp_number: whatsappNumber,
    nickname: nickname || null,
    email: email || null,
    blood_group: bloodGroup || null,
    facebook_url: facebookUrl || null,
  };

  const imagePath = getTextField(formData, "image_path");
  const imageUrl = await getVerifiedProfileImageUrl(supabase, imagePath, userId);
  if (imagePath && !imageUrl) {
    redirectEditWithError("The uploaded image could not be verified.");
  }
  const data = imageUrl ? { ...updateData, image_url: imageUrl } : updateData;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (typeof supabaseUrl !== "string" || typeof serviceRoleKey !== "string") {
    console.error("Admin profile editing requires the server-only SUPABASE_SERVICE_ROLE_KEY environment variable.");
    return redirectEditWithError("Profile editing is temporarily unavailable. Please contact the portal admin.");
  }

  const adminSupabase = createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
  const { data: updatedProfile, error } = await adminSupabase
    .from("profiles")
    .update(data)
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      redirectEditWithError(`Duplicate Entry: Roll ${roll} is already taken.`);
    }
    console.error("Failed to update student profile:", error.message);
    redirectEditWithError("Failed to update the student record.");
  }
  if (!updatedProfile) {
    redirectEditWithError("No student record was updated. Refresh the page and try again.");
  }
  
  revalidatePublicDirectories();
  revalidatePath("/admin/dashboard");
  revalidatePath(editPath);
  redirect(`${editPath}?success=${encodeURIComponent("Saved changes successfully.")}`);
}

export async function deleteStudent(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = getTextField(formData, "id");
  if (!id) redirect("/admin/dashboard?error=Invalid student record.");

  const { data: deletedRecord, error } = await supabase
    .from("profiles")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Failed to delete student profile:", error.message);
    redirect("/admin/dashboard?error=Failed to delete the student record.");
  }
  if (!deletedRecord) {
    redirect("/admin/dashboard?error=The profile was not deleted. Refresh the page and try again.");
  }
  
  revalidatePublicDirectories();
  revalidatePath("/admin/dashboard");
  redirect("/admin/dashboard?success=Student removed from the directory.");
}

export async function reviewStudentSubmission(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = getTextField(formData, "id");
  const decision = getTextField(formData, "decision");

  if (!id || !["approved", "rejected"].includes(decision)) {
    redirect("/admin/dashboard?error=Invalid student submission.");
  }

  const { error } = await supabase.rpc("review_student_submission", {
    p_submission_id: id,
    p_decision: decision,
  });

  if (error) {
    if (error.code === "23505") {
      redirect("/admin/dashboard?error=A profile with this roll number already exists.");
    }
    console.error("Failed to review student submission:", error.message);
    redirect("/admin/dashboard?error=The student submission could not be reviewed.");
  }

  if (decision === "approved") {
    revalidatePublicDirectories();
  }
  revalidatePath("/admin/dashboard");
  revalidatePath("/submit-profile");
  redirect(`/admin/dashboard?success=${encodeURIComponent(decision === "approved" ? "Profile approved and added to the directory." : "Submission rejected.")}`);
}
