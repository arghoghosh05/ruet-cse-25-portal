"use server";

import { createClient } from "../../../utils/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function loginAdmin(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect("/admin/login?error=Invalid credentials");
  redirect("/admin/dashboard");
}

export async function logoutAdmin() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

async function uploadImage(supabase: any, imageFile: File | null) {
  if (!imageFile || imageFile.size === 0) return null;
  const fileExt = imageFile.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  
  const { error } = await supabase.storage.from("avatars").upload(fileName, imageFile);
  if (error) throw new Error(`Image upload failed: ${error.message}`);
  
  const { data } = supabase.storage.from("avatars").getPublicUrl(fileName);
  return data.publicUrl;
}

// 🚨 AUTOMATION CORE: Calculates the correct section
function getSectionFromRoll(rollStr: string) {
  const roll = parseInt(rollStr, 10);
  if (roll >= 2503001 && roll <= 2503060) return "a";
  if (roll >= 2503061 && roll <= 2503120) return "b";
  if (roll >= 2503121 && roll <= 2503180) return "c";
  return "invalid"; 
}

export async function addStudent(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const roll = formData.get("roll") as string;
  const autoSection = getSectionFromRoll(roll);

  if (autoSection === "invalid") {
    redirect(`/admin/dashboard?error=Invalid Roll Number. Must be between 2503001 and 2503180.`);
  }
  
  const imageFile = formData.get("image") as File;
  const imageUrl = await uploadImage(supabase, imageFile);
  
  const studentData = {
    full_name: formData.get("full_name") as string,
    roll: roll,
    section: autoSection, // Hardcoded from math, cannot be spoofed
    address: formData.get("address") as string,
    phone_number: formData.get("phone_number") as string,
    whatsapp_number: formData.get("whatsapp_number") as string,
    image_url: imageUrl, 
    facebook_url: formData.get("facebook_url") as string,
    created_by: user?.id, 
  };

  const { error } = await supabase.from("profiles").insert(studentData);
  
  if (error) {
    if (error.code === "23505" || error.message.includes("duplicate key")) {
      redirect("/admin/dashboard?error=Duplicate Entry: A student with this Roll Number is already registered.");
    }
    redirect(`/admin/dashboard?error=Failed to save: ${error.message}`);
  }
  
  revalidatePath("/");
  revalidatePath(`/sections/${studentData.section}`);
  redirect("/admin/dashboard?success=Student successfully added to the directory!");
}

export async function updateStudent(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const id = formData.get("id") as string;
  
  const roll = formData.get("roll") as string;
  const autoSection = getSectionFromRoll(roll);

  if (autoSection === "invalid") {
    redirect(`/admin/dashboard?error=Invalid Roll Number. Must be between 2503001 and 2503180.`);
  }
  
  const updateData: any = {
    full_name: formData.get("full_name") as string,
    roll: roll,
    section: autoSection, // Hardcoded from math, cannot be spoofed
    address: formData.get("address") as string,
    phone_number: formData.get("phone_number") as string,
    whatsapp_number: formData.get("whatsapp_number") as string,
    facebook_url: formData.get("facebook_url") as string,
  };

  const imageFile = formData.get("image") as File;
  if (imageFile && imageFile.size > 0) {
    updateData.image_url = await uploadImage(supabase, imageFile);
  }

  const { error } = await supabase
    .from("profiles")
    .update(updateData)
    .match({ id: id, created_by: user?.id }); 

  if (error) {
    if (error.code === "23505") {
      redirect(`/admin/dashboard?error=Duplicate Entry: Roll ${updateData.roll} is already taken.`);
    }
    redirect(`/admin/dashboard?error=Update failed: ${error.message}`);
  }
  
  revalidatePath("/");
  revalidatePath(`/sections/${updateData.section}`);
  redirect("/admin/dashboard?success=Student record updated successfully.");
}

export async function deleteStudent(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const id = formData.get("id") as string;
  const section = formData.get("section") as string;

  const { error } = await supabase
    .from("profiles")
    .delete()
    .match({ id: id, created_by: user?.id }); 

  if (error) redirect(`/admin/dashboard?error=Delete failed: ${error.message}`);
  
  revalidatePath("/");
  revalidatePath(`/sections/${section}`);
  redirect("/admin/dashboard?success=Student removed from the directory.");
}