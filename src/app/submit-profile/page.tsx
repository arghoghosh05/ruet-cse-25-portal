import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock3, ShieldCheck } from "lucide-react";
import Navbar from "../../components/ui/Navbar";
import StudentEmailAccess from "../../components/StudentEmailAccess";
import StudentPasswordSetup from "../../components/StudentPasswordSetup";
import StudentSubmissionForm from "../../components/StudentSubmissionForm";
import StudentOwnProfileForm from "../../components/StudentOwnProfileForm";
import SubmitButton from "../../components/SubmitButton";
import ToastAlert from "../../components/ToastAlert";
import { logoutStudent } from "./actions";
import { createClient } from "../../../utils/supabase/server";
import { getCanonicalDistrictName } from "../../lib/districts";

export const metadata = {
  title: "Your student profile",
  robots: { index: false, follow: false },
};

export default async function SubmitProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string; setup?: string; roll?: string }>;
}) {
  const { error, success, setup, roll: setupRoll } = await searchParams;
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  let user: Awaited<ReturnType<typeof supabase.auth.getUser>>["data"]["user"] = null;

  if (!claimsError && claimsData?.claims?.sub) {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error("Failed to verify student submission session:", userError.message);
      throw new Error("Your sign-in status could not be checked. Please reload the page.");
    }
    user = userData.user;
  }

  let studentAccount: { roll: number; status: string; has_profile: boolean } | null = null;
  let latestSubmission: { id: string; status: string; roll: number } | null = null;
  let profileAlreadyExists = false;
  let ownProfile: {
    full_name: string;
    nickname: string | null;
    roll: number;
    section: string;
    email: string | null;
    address: string;
    phone_number: string;
    whatsapp_number: string;
    blood_group: string | null;
    facebook_url: string | null;
    image_url: string | null;
  } | null = null;
  if (user) {
    const { data: accountData, error: accountError } = await supabase
      .from("student_accounts")
      .select("roll, status, has_profile")
      .eq("user_id", user.id)
      .maybeSingle();

    if (accountError) {
      console.error("Failed to load student account status:", accountError.message);
      throw new Error("Your account status is temporarily unavailable.");
    }
    studentAccount = accountData;

    if (studentAccount?.status === "approved" && !studentAccount.has_profile) {
      const { data: existingProfile, error: existingProfileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("roll", studentAccount.roll)
        .maybeSingle();

      if (existingProfileError) {
        console.error("Failed to check for an existing student profile:", existingProfileError.message);
        throw new Error("Your profile status is temporarily unavailable.");
      }
      profileAlreadyExists = Boolean(existingProfile);
    }

    if (studentAccount?.status === "approved" && studentAccount.has_profile) {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("full_name, nickname, roll, section, email, address, phone_number, whatsapp_number, blood_group, facebook_url, image_url")
        .eq("roll", studentAccount.roll)
        .maybeSingle();

      if (profileError) {
        console.error("Failed to load the student's own profile:", profileError.message);
        throw new Error("Your approved profile is temporarily unavailable.");
      }
      ownProfile = profileData
        ? {
            ...profileData,
            address: getCanonicalDistrictName(profileData.address),
            email: profileData.email ?? user.email ?? null,
          }
        : null;
    }

    if (studentAccount?.status === "approved" && !studentAccount.has_profile) {
      const { data, error: submissionError } = await supabase
      .from("student_submissions")
      .select("id, status, roll")
      .eq("user_id", user.id)
      .order("submitted_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();

      if (submissionError) {
        console.error("Failed to load student's submission status:", submissionError.message);
        throw new Error("Your submission status is temporarily unavailable.");
      }
      latestSubmission = data;
    }
  }

  return (
    <div className="min-h-screen bg-transparent">
      <ToastAlert error={error} success={success} />
      <Navbar />

      <main className="mx-auto max-w-3xl px-5 pb-20 pt-8 sm:px-8 sm:pt-12">
        <Link
          href="/"
          className="mb-6 inline-flex min-h-10 items-center gap-2 rounded-lg text-sm font-medium text-[#2F4858]/65 transition hover:text-[#2F4858]"
        >
          <ArrowLeft aria-hidden="true" size={16} /> Back to portal
        </Link>

        <section className="overflow-hidden rounded-[1.75rem] border border-[#2F4858]/10 bg-[#F8FCF9] shadow-[0_24px_65px_rgba(47,72,88,0.12)]">
          <header className="bg-[#2F4858] px-6 py-7 text-[#DDFBEF] sm:px-9 sm:py-9">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#DDFBEF]/15 bg-white/5">
              {user ? <ShieldCheck aria-hidden="true" size={23} /> : <CheckCircle2 aria-hidden="true" size={23} />}
            </div>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-[#DDFBEF]/65">RUET CSE ’25 directory</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Add your profile</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#DDFBEF]/75">
              Share your details in a few steps. Your profile appears in the directory after an admin reviews it.
            </p>
          </header>

          <div className="p-6 sm:p-9">
            {!user ? (
              <StudentEmailAccess />
            ) : !user.email_confirmed_at ? (
              <StudentEmailAccess />
            ) : setup === "1" && /^\d{7}$/.test(setupRoll ?? "") ? (
              <StudentPasswordSetup roll={setupRoll!} />
            ) : !studentAccount ? (
              setupRoll && /^\d{7}$/.test(setupRoll) ? (
                <StudentPasswordSetup roll={setupRoll} />
              ) : (
                <StudentEmailAccess />
              )
            ) : studentAccount.has_profile ? (
              ownProfile ? (
                <div className="space-y-4">
                  <StudentOwnProfileForm profile={ownProfile} />
                  <Link
                    href={`/sections/${studentAccount.roll <= 2503060 ? "a" : studentAccount.roll <= 2503120 ? "b" : "c"}`}
                    className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[#2F4858]/15 px-4 text-sm font-semibold text-[#2F4858] transition hover:bg-white"
                  >
                    View your section directory
                  </Link>
                </div>
              ) : (
                <div role="alert" className="rounded-xl border border-[#E2B7A9] bg-[#FFF3EF] px-4 py-3 text-sm leading-6 text-[#733F36]">
                  Your account is approved, but its profile record is not available. Please contact a portal admin.
                </div>
              )
            ) : profileAlreadyExists ? (
              <div role="status" className="rounded-2xl border border-[#2F4858]/10 bg-white p-5 sm:p-6">
                <h2 className="font-semibold text-[#2F4858]">Your account is ready</h2>
                <p className="mt-1 text-sm leading-6 text-[#2F4858]/70">
                  A directory profile already exists for this roll, but its ownership has not been linked to your verified email. Contact an admin to verify and link the profile. You can log in now; profile editing remains restricted to its verified owner.
                </p>
              </div>
            ) : latestSubmission?.status === "pending" ? (
              <div className="rounded-2xl border border-[#2F4858]/10 bg-white p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <Clock3 aria-hidden="true" className="mt-0.5 shrink-0 text-[#527A64]" size={21} />
                  <div>
                    <h2 className="font-semibold text-[#2F4858]">Profile approval pending</h2>
                    <p className="mt-1 text-sm leading-6 text-[#2F4858]/70">
                      Roll {latestSubmission.roll} is safely submitted. An admin will review it before it appears publicly. After approval, your profile details will appear here and you can edit only your own profile.
                    </p>
                  </div>
                </div>
                <form action={logoutStudent} className="mt-5">
                  <SubmitButton
                    pendingText="Signing out…"
                    className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[#2F4858]/15 px-4 text-sm font-semibold text-[#2F4858] transition hover:bg-[#DDFBEF]/60"
                  >
                    Sign out
                  </SubmitButton>
                </form>
              </div>
            ) : latestSubmission?.status === "approved" ? (
              <div className="rounded-2xl border border-[#B8D9C5] bg-[#F0FBF4] p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <CheckCircle2 aria-hidden="true" className="mt-0.5 shrink-0 text-[#426C55]" size={21} />
                  <div>
                    <h2 className="font-semibold text-[#2F4858]">You’re in the directory</h2>
                    <p className="mt-1 text-sm leading-6 text-[#2F4858]/70">
                      Your profile was approved. You can find it in the student directory.
                    </p>
                  </div>
                </div>
                <form action={logoutStudent} className="mt-5">
                  <SubmitButton
                    pendingText="Signing out…"
                    className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[#2F4858]/15 px-4 text-sm font-semibold text-[#2F4858] transition hover:bg-white"
                  >
                    Sign out
                  </SubmitButton>
                </form>
              </div>
            ) : (
              <StudentSubmissionForm
                roll={studentAccount.roll}
                email={user.email ?? ""}
                wasRejected={latestSubmission?.status === "rejected"}
              />
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
