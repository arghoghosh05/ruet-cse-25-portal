import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "../../../../utils/supabase/server";
import { BLOOD_GROUPS } from "../../../lib/student";
import { BANGLADESH_DISTRICTS } from "../../../lib/districts";
import { isAdminIdentity } from "../../../lib/admin-auth";
import { addStudent, logoutAdmin } from "../actions";
import StudentProfileForm from "../../../components/StudentProfileForm";
import ContactNumberFields from "../../../components/ContactNumberFields";
import AdminRecords from "../../../components/AdminRecords";
import ApprovedStudentAccounts from "../../../components/ApprovedStudentAccounts";
import PendingSubmissions from "../../../components/PendingSubmissions";
import AutoSection from "../../../components/AutoSection";
import Navbar from "../../../components/ui/Navbar";
import SubmitButton from "../../../components/SubmitButton";
import ToastAlert from "../../../components/ToastAlert";
import { LogOut, Plus, ShieldCheck, UserRound } from "lucide-react";

export const metadata: Metadata = {
  title: "Admin dashboard",
  robots: { index: false, follow: false },
};

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { error, success } = await searchParams;
  const supabase = await createClient();
  const { data, error: authError } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (authError || !claims?.sub || !isAdminIdentity(claims.email, claims.app_metadata)) {
    redirect("/admin/login?error=Admin access is required.");
  }

  const { data: records, error: recordsError } = await supabase
    .from("profiles")
    .select("id, full_name, nickname, roll, section, email, blood_group, image_url, created_at")
    .order("created_at", { ascending: false });

  if (recordsError) {
    console.error("Failed to load admin student records:", recordsError.message);
    throw new Error("Admin records are temporarily unavailable.");
  }

  const { data: submissions, error: submissionsError } = await supabase
    .from("student_submissions")
    .select("id, full_name, nickname, roll, section, address, phone_number, whatsapp_number, blood_group, email, facebook_url, image_url, submitted_at")
    .eq("status", "pending")
    .order("submitted_at", { ascending: true });

  if (submissionsError) {
    console.error("Failed to load student submissions:", submissionsError.message);
    throw new Error("Student submissions are temporarily unavailable.");
  }

  const { data: approvedAccounts, error: approvedAccountsError } = await supabase
    .from("student_accounts")
    .select("roll, email, has_profile")
    .eq("status", "approved")
    .order("roll", { ascending: true });

  if (approvedAccountsError) {
    console.error("Failed to load approved student accounts:", approvedAccountsError.message);
    throw new Error("Approved student accounts are temporarily unavailable.");
  }

  return (
    <div className="min-h-screen bg-transparent">
      <ToastAlert error={error} success={success} />
      <Navbar />
      <AutoSection />

      <main className="mx-auto max-w-7xl px-5 pb-20 pt-8 sm:px-8 sm:pt-10">
        <header className="mb-8 flex flex-col gap-5 rounded-[1.5rem] bg-[#2F4858] p-5 text-[#DDFBEF] shadow-[0_18px_44px_rgba(31,55,66,0.14)] sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#DDFBEF]/15 bg-white/5">
              <ShieldCheck aria-hidden="true" className="text-[#DDFBEF]" size={23} strokeWidth={1.7} />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#DDFBEF]/55">Portal administration</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Admin dashboard</h1>
              <p className="mt-2 flex items-center gap-1.5 break-all text-xs text-[#DDFBEF]/65 sm:text-sm">
                <UserRound aria-hidden="true" size={14} className="shrink-0" />
                Signed in as {claims.email}
              </p>
            </div>
          </div>
          <form action={logoutAdmin}>
            <button type="submit" className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-lg border border-[#DDFBEF]/20 px-3.5 text-sm font-medium text-[#DDFBEF]/85 transition hover:border-[#DDFBEF]/40 hover:bg-white/5 hover:text-white sm:self-auto">
              <LogOut aria-hidden="true" size={16} /> Sign out
            </button>
          </form>
        </header>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)] lg:gap-7">
          <section aria-labelledby="add-student-heading" className="rounded-[1.5rem] bg-[#2F4858] p-5 text-[#DDFBEF] shadow-[0_18px_48px_rgba(47,72,88,0.13)] sm:p-7">
            <div className="mb-6 flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#DDFBEF] text-[#2F4858]">
                <Plus aria-hidden="true" size={20} />
              </div>
              <div>
                <h2 id="add-student-heading" className="text-lg font-semibold tracking-tight">Add a student</h2>
                <p className="mt-1 text-xs leading-5 text-[#DDFBEF]/60">Fields marked required must be completed.</p>
              </div>
            </div>

            <StudentProfileForm action={addStudent} className="space-y-4">
              <div>
                <label className="portal-label" htmlFor="full-name">Full name <span className="text-[#B9DBC8]">*</span></label>
                <input id="full-name" name="full_name" type="text" required maxLength={120} placeholder="Enter full name" className="portal-field" />
              </div>

              <div>
                <label className="portal-label" htmlFor="nickname">Nickname <span className="font-normal text-[#DDFBEF]/50">(optional)</span></label>
                <input id="nickname" name="nickname" type="text" maxLength={40} placeholder="Enter nickname" className="portal-field" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="portal-label" htmlFor="roll">Roll number <span className="text-[#B9DBC8]">*</span></label>
                  <input id="roll" name="roll" type="text" inputMode="numeric" pattern="[0-9]{7}" maxLength={7} required placeholder="Enter roll number" className="portal-field" />
                </div>
                <div>
                  <label className="portal-label" htmlFor="section">Section</label>
                  <input id="section" name="section" type="text" readOnly aria-describedby="section-hint" placeholder="Auto-assigned" className="portal-field cursor-not-allowed border-white/10 bg-white/10 font-semibold uppercase text-[#DDFBEF]/80 placeholder:text-[#DDFBEF]/40" />
                </div>
              </div>
              <p id="section-hint" className="-mt-2 text-[11px] text-[#DDFBEF]/55">Assigned automatically from the roll number.</p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="portal-label" htmlFor="email">Email</label>
                  <input id="email" name="email" type="email" maxLength={254} placeholder="name@example.com" className="portal-field" />
                </div>
                <div>
                  <label className="portal-label" htmlFor="blood-group">Blood group</label>
                  <select id="blood-group" name="blood_group" defaultValue="" className="portal-field">
                    <option value="">Select group</option>
                    {BLOOD_GROUPS.map((group) => <option key={group} value={group}>{group}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <div>
                  <label className="portal-label" htmlFor="district">District <span className="text-[#B9DBC8]">*</span></label>
                  <select id="district" name="address" required defaultValue="" className="portal-field">
                    <option value="" disabled>Select district</option>
                    {BANGLADESH_DISTRICTS.map((district) => <option key={district} value={district}>{district}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <ContactNumberFields />
              </div>

              <div>
                <label className="portal-label" htmlFor="profile-image">Profile image <span className="font-normal text-[#DDFBEF]/50">(optional · PNG, JPEG, WebP)</span></label>
                <input id="profile-image" name="image" type="file" accept="image/png, image/jpeg, image/webp" className="portal-field file:mr-3 file:rounded-lg file:border-0 file:bg-[#2F4858] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[#DDFBEF] hover:file:bg-[#243B49]" />
                <p className="mt-1.5 text-[11px] text-[#DDFBEF]/50">Maximum file size: 15 MB.</p>
              </div>

              <div>
                <label className="portal-label" htmlFor="facebook-url">Facebook profile <span className="font-normal text-[#DDFBEF]/50">(optional)</span></label>
                <input id="facebook-url" name="facebook_url" type="url" maxLength={500} placeholder="https://facebook.com/…" className="portal-field" />
              </div>

              <SubmitButton
                pendingText="Adding profile…"
                className="mt-2 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#DDFBEF] px-5 text-sm font-semibold text-[#2F4858] shadow-sm transition hover:-translate-y-0.5 hover:bg-white disabled:cursor-wait disabled:opacity-70"
              >
                <Plus aria-hidden="true" size={17} /> Add to directory
              </SubmitButton>
            </StudentProfileForm>
          </section>

          <div className="space-y-6">
            <AdminRecords records={records ?? []} />
            <ApprovedStudentAccounts accounts={approvedAccounts ?? []} />
            <PendingSubmissions submissions={submissions ?? []} />
          </div>
        </div>
      </main>
    </div>
  );
}
