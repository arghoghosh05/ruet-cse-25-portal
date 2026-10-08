import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, FilePenLine } from "lucide-react";
import { createClient } from "../../../../../utils/supabase/server";
import { redirect } from "next/navigation";
import Navbar from "../../../../components/ui/Navbar";
import { updateStudent } from "../../actions";
import AutoSection from "../../../../components/AutoSection";
import SubmitButton from "../../../../components/SubmitButton";
import ToastAlert from "../../../../components/ToastAlert";
import StudentProfileForm from "../../../../components/StudentProfileForm";
import ContactNumberFields from "../../../../components/ContactNumberFields";
import { BLOOD_GROUPS } from "../../../../lib/student";
import { BANGLADESH_DISTRICTS, getCanonicalDistrictName } from "../../../../lib/districts";
import { isAdminIdentity } from "../../../../lib/admin-auth";

export const metadata: Metadata = {
  title: "Edit student record",
  robots: { index: false, follow: false },
};

export default async function EditStudentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const [{ id }, { error: actionError, success }] = await Promise.all([params, searchParams]);
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (error || !claims?.sub || !isAdminIdentity(claims.email, claims.app_metadata)) {
    redirect("/admin/login?error=Admin access is required.");
  }

  const { data: student, error: studentError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (studentError && studentError.code !== "PGRST116") {
    console.error("Failed to load student record for editing:", studentError.message);
    throw new Error("Student record is temporarily unavailable.");
  }
  if (!student) redirect("/admin/dashboard");

  return (
    <div className="min-h-screen bg-transparent">
      <ToastAlert error={actionError} success={success} />
      <Navbar />
      <AutoSection />

      <main className="mx-auto max-w-4xl px-5 pb-20 pt-8 sm:px-8 sm:pt-10">
        <Link href="/admin/dashboard" className="mb-6 inline-flex min-h-10 items-center gap-2 rounded-lg text-sm font-medium text-[#2F4858]/65 transition hover:text-[#2F4858]">
          <ArrowLeft aria-hidden="true" size={16} /> Back to dashboard
        </Link>

        <section className="overflow-hidden rounded-[1.5rem] bg-[#2F4858] text-[#DDFBEF] shadow-[0_20px_58px_rgba(31,55,66,0.17)]">
          <header className="border-b border-[#DDFBEF]/10 px-5 py-6 sm:px-8 sm:py-7">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#DDFBEF]/15 bg-white/5">
                <FilePenLine aria-hidden="true" size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.19em] text-[#DDFBEF]/55">Student record</p>
                <h1 className="mt-1 break-words text-2xl font-semibold tracking-tight sm:text-3xl">Edit profile</h1>
                <p className="mt-2 text-sm text-[#DDFBEF]/65">{student.full_name} <span className="px-1.5">·</span> Roll {student.roll}</p>
              </div>
            </div>
          </header>

          <StudentProfileForm action={updateStudent} className="space-y-7 p-5 sm:p-8">
            <input type="hidden" name="id" value={student.id} />

            <section>
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-[#DDFBEF]/65">Student details</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="portal-label" htmlFor="full-name">Full name <span className="text-[#B9DBC8]">*</span></label>
                  <input id="full-name" name="full_name" type="text" defaultValue={student.full_name || ""} maxLength={120} required className="portal-field" />
                </div>
                <div className="sm:col-span-2">
                  <label className="portal-label" htmlFor="nickname">Nickname <span className="font-normal text-[#DDFBEF]/50">(optional)</span></label>
                  <input id="nickname" name="nickname" type="text" defaultValue={student.nickname || ""} maxLength={40} placeholder="Enter nickname" className="portal-field" />
                </div>
                <div>
                  <label className="portal-label" htmlFor="roll">Roll number <span className="text-[#B9DBC8]">*</span></label>
                  <input id="roll" name="roll" type="text" inputMode="numeric" pattern="[0-9]{7}" maxLength={7} defaultValue={String(student.roll)} required className="portal-field" />
                </div>
                <div>
                  <label className="portal-label" htmlFor="section">Section</label>
                  <input id="section" name="section" type="text" defaultValue={student.section} readOnly className="portal-field cursor-not-allowed border-white/10 bg-white/10 font-semibold uppercase text-[#DDFBEF]/80" />
                  <p className="mt-1.5 text-[11px] text-[#DDFBEF]/50">Assigned automatically from the roll number.</p>
                </div>
                <div>
                  <label className="portal-label" htmlFor="email">Email</label>
                  <input id="email" name="email" type="email" defaultValue={student.email || ""} maxLength={254} className="portal-field" />
                </div>
                <div>
                  <label className="portal-label" htmlFor="blood-group">Blood group</label>
                  <select id="blood-group" name="blood_group" defaultValue={student.blood_group || ""} className="portal-field">
                    <option value="">Select group</option>
                    {BLOOD_GROUPS.map((group) => <option key={group} value={group}>{group}</option>)}
                  </select>
                </div>
              </div>
            </section>

            <section className="border-t border-[#DDFBEF]/10 pt-6">
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-[#DDFBEF]/65">Contact & location</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="portal-label" htmlFor="district">District <span className="text-[#B9DBC8]">*</span></label>
                  <select id="district" name="address" defaultValue={getCanonicalDistrictName(student.address || "")} required className="portal-field">
                    <option value="" disabled>Select district</option>
                    {BANGLADESH_DISTRICTS.map((district) => <option key={district} value={district}>{district}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2 space-y-3">
                  <ContactNumberFields
                    phoneNumber={student.phone_number || ""}
                    whatsappNumber={student.whatsapp_number || ""}
                  />
                </div>
                <div>
                  <label className="portal-label" htmlFor="facebook-url">Facebook profile</label>
                  <input id="facebook-url" name="facebook_url" type="url" defaultValue={student.facebook_url || ""} maxLength={500} placeholder="https://facebook.com/…" className="portal-field" />
                </div>
              </div>
            </section>

            <section className="border-t border-[#DDFBEF]/10 pt-6">
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-[#DDFBEF]/65">Profile photo</h2>
              {student.image_url && (
                <div className="mb-4 flex items-center gap-4 rounded-xl border border-[#DDFBEF]/10 bg-white/5 p-3">
                  <Image
                    src={student.image_url}
                    alt={`Current profile photo for ${student.full_name || "student"}`}
                    width={64}
                    height={64}
                    unoptimized
                    className="h-16 w-16 rounded-xl object-cover"
                  />
                  <div>
                    <p className="text-sm font-medium">Current photo</p>
                    <p className="mt-1 text-xs text-[#DDFBEF]/55">Choose a new file to replace it.</p>
                  </div>
                </div>
              )}
              <label htmlFor="profile-image" className="portal-label">Upload a new image <span className="font-normal text-[#DDFBEF]/50">(optional · max 15 MB)</span></label>
              <input id="profile-image" name="image" type="file" accept="image/png, image/jpeg, image/webp" className="portal-field file:mr-3 file:rounded-lg file:border-0 file:bg-[#2F4858] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[#DDFBEF]" />
            </section>

            <div className="flex flex-col-reverse gap-3 border-t border-[#DDFBEF]/10 pt-6 sm:flex-row sm:justify-end">
              <Link href="/admin/dashboard" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#DDFBEF]/20 px-5 text-sm font-semibold text-[#DDFBEF]/80 transition hover:bg-white/5 hover:text-white">
                Cancel
              </Link>
              <SubmitButton
                pendingText="Saving changes…"
                className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#DDFBEF] px-6 text-sm font-semibold text-[#2F4858] shadow-sm transition hover:-translate-y-0.5 hover:bg-white disabled:cursor-wait disabled:opacity-70"
              >
                <FilePenLine aria-hidden="true" size={17} /> Save changes
              </SubmitButton>
            </div>
          </StudentProfileForm>
        </section>
      </main>
    </div>
  );
}
