import { createClient } from "@supabase/supabase-js";

export async function getPublicSectionProfiles(section: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase public environment variables are not configured.");
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, full_name, nickname, roll, image_url, email, blood_group, address, phone_number, whatsapp_number, facebook_url",
    )
    .eq("section", section)
    .order("roll", { ascending: true });

  if (error) {
    console.error("Failed to load public student profiles:", error.message);
    throw new Error("Student directory is temporarily unavailable.");
  }

  return data ?? [];
}
