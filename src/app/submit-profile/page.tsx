import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock3, ShieldCheck, UserCheck } from "lucide-react";
import Navbar from "../../components/ui/Navbar";
import StudentEmailAccess from "../../components/StudentEmailAccess";
import StudentSubmissionForm from "../../components/StudentSubmissionForm";
import StudentOwnProfileForm from "../../components/StudentOwnProfileForm";
import SubmitButton from "../../components/SubmitButton";
import ToastAlert from "../../components/ToastAlert";
import { logoutStudent, linkGoogleAccountWithRoll } from "./actions";
import { getSessionUser } from "../../lib/firebase/session";
import { adminDb } from "../../lib/firebase/admin";
import { getCanonicalDistrictName } from "../../lib/districts";

export const metadata = {
  title: "Your student profile",
  robots: { index: false, follow: false },
};

export default async function SubmitProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string; link_roll?: string }>;
}) {
  const { error, success } = await searchParams;
  const user = await getSessionUser();

  let studentAccount: { roll: number; status: string; has_profile: boolean } | null = null;
  let latestSubmission: { id: string; status: string; roll: number } | null = null;
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
    // 1. Look up student_accounts by UID
    const accountQuery = await adminDb
      .collection("student_accounts")
      .where("uid", "==", user.uid)
      .limit(1)
      .get();

    if (!accountQuery.empty) {
      const doc = accountQuery.docs[0];
      const data = doc.data();
      studentAccount = {
        roll: data.roll ?? Number(doc.id),
        status: data.status ?? "approved",
        has_profile: Boolean(data.has_profile),
      };
    } else if (user.email) {
      // Fallback: look up by verified email
      const emailQuery = await adminDb
        .collection("student_accounts")
        .where("email", "==", user.email.toLowerCase())
        .limit(1)
        .get();

      if (!emailQuery.empty) {
        const doc = emailQuery.docs[0];
        const data = doc.data();
        studentAccount = {
          roll: data.roll ?? Number(doc.id),
          status: data.status ?? "approved",
          has_profile: Boolean(data.has_profile),
        };
      }
    }

    if (studentAccount) {
      const rollStr = String(studentAccount.roll);

      // 2. Check if approved profile exists in profiles
      const profileDoc = await adminDb.collection("profiles").doc(rollStr).get();
      if (profileDoc.exists) {
        const pData = profileDoc.data()!;
        ownProfile = {
          full_name: pData.full_name ?? "",
          nickname: pData.nickname ?? null,
          roll: pData.roll ?? studentAccount.roll,
          section: pData.section ?? "",
          email: pData.email ?? user.email ?? null,
          address: getCanonicalDistrictName(pData.address ?? ""),
          phone_number: pData.phone_number ?? "",
          whatsapp_number: pData.whatsapp_number ?? "",
          blood_group: pData.blood_group ?? null,
          facebook_url: pData.facebook_url ?? null,
          image_url: pData.image_url ?? null,
        };
      } else {
        // 3. Check for pending or rejected submissions
        const subSnapshot = await adminDb
          .collection("student_submissions")
          .where("user_id", "==", user.uid)
          .orderBy("submitted_at", "desc")
          .limit(1)
          .get();

        if (!subSnapshot.empty) {
          const subDoc = subSnapshot.docs[0];
          const subData = subDoc.data();
          latestSubmission = {
            id: subDoc.id,
            status: subData.status ?? "pending",
            roll: subData.roll ?? studentAccount.roll,
          };
        }
      }
    }
  }

  return (
    <div className="min-h-screen bg-transparent">
      <ToastAlert error={error} success={success} />
      <Navbar />

      <main className="mx-auto max-w-3xl px-5 pb-20 pt-8 sm:px-8 sm:pt-12">
        <Link
          href="/"
          className="mb-6 inline-flex min-h-10 items-center gap-2 rounded-lg text-sm font-medium text-[#2F4858]/65 transition hover:text-[#2F4858] dark:text-[#e5f0ea]/70 dark:hover:text-[#e5f0ea]"
        >
          <ArrowLeft aria-hidden="true" size={16} /> Back to portal
        </Link>

        <section className="overflow-hidden rounded-[1.75rem] border border-[#2F4858]/10 bg-[#F8FCF9] shadow-[0_24px_65px_rgba(47,72,88,0.12)] dark:bg-[#1b2d36] dark:border-white/10">
          <header className="bg-[#2F4858] px-6 py-7 text-[#DDFBEF] sm:px-9 sm:py-9">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#DDFBEF]/15 bg-white/5">
              {user ? <ShieldCheck aria-hidden="true" size={23} /> : <CheckCircle2 aria-hidden="true" size={23} />}
            </div>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-[#DDFBEF]/65">RUET CSE ’25 directory</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Add your profile</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#DDFBEF]/75">
              Share your details with your classmates. Your profile appears in the directory after an admin reviews it.
            </p>
          </header>

          <div className="p-6 sm:p-9">
            {!user ? (
              <StudentEmailAccess />
            ) : !studentAccount ? (
              /* Signed in with Google or Auth, but hasn't linked roll yet */
              <div className="rounded-2xl border border-[#2F4858]/10 bg-white p-5 sm:p-6 dark:bg-[#1e3039] dark:border-white/10">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#DDFBEF] text-[#2F4858]">
                    <UserCheck aria-hidden="true" size={20} />
                  </div>
                  <div>
                    <h2 className="font-semibold text-[#2F4858] dark:text-[#e5f0ea]">Welcome! Link your roll number</h2>
                    <p className="mt-1 text-sm leading-6 text-[#2F4858]/70 dark:text-[#e5f0ea]/70">
                      Signed in as <span className="font-semibold text-[#2F4858] dark:text-white">{user.email}</span>. Enter your 7-digit roll number to complete your profile setup.
                    </p>
                  </div>
                </div>

                <form action={linkGoogleAccountWithRoll} className="mt-5 space-y-4">
                  <div>
                    <label htmlFor="link-roll" className="portal-label !text-[#2F4858] dark:!text-[#e5f0ea]">Roll number</label>
                    <input
                      id="link-roll"
                      name="roll"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]{7}"
                      maxLength={7}
                      required
                      placeholder="e.g. 2503042"
                      className="portal-field"
                    />
                    <p className="mt-1.5 text-xs text-[#2F4858]/60 dark:text-[#e5f0ea]/60">Must be a valid 25-series roll between 2503001 and 2503180.</p>
                  </div>

                  <SubmitButton
                    pendingText="Linking account…"
                    className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#2F4858] px-5 text-sm font-semibold text-[#DDFBEF] shadow-sm transition hover:bg-[#243B49] dark:bg-[#ddfbef] dark:text-[#2f4858] dark:hover:bg-white"
                  >
                    Confirm & continue
                  </SubmitButton>
                </form>

                <form action={logoutStudent} className="mt-4 border-t border-[#2F4858]/10 pt-4 dark:border-white/10">
                  <button
                    type="submit"
                    className="text-xs font-medium text-[#2F4858]/60 underline hover:text-[#2F4858] dark:text-[#e5f0ea]/60 dark:hover:text-white"
                  >
                    Sign out and use another account
                  </button>
                </form>
              </div>
            ) : ownProfile ? (
              /* Approved profile exists: allow student to view and update their own profile */
              <div className="space-y-4">
                <StudentOwnProfileForm profile={ownProfile} />
                <Link
                  href={`/sections/${ownProfile.roll <= 2503060 ? "a" : ownProfile.roll <= 2503120 ? "b" : "c"}`}
                  className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[#2F4858]/15 px-4 text-sm font-semibold text-[#2F4858] transition hover:bg-white dark:border-white/15 dark:text-[#e5f0ea] dark:hover:bg-white/10"
                >
                  View your section directory
                </Link>
              </div>
            ) : latestSubmission?.status === "pending" ? (
              /* Submission waiting for admin review */
              <div className="rounded-2xl border border-[#2F4858]/10 bg-white p-5 sm:p-6 dark:bg-[#1e3039] dark:border-white/10">
                <div className="flex items-start gap-3">
                  <Clock3 aria-hidden="true" className="mt-0.5 shrink-0 text-[#527A64] dark:text-[#b7e0c4]" size={21} />
                  <div>
                    <h2 className="font-semibold text-[#2F4858] dark:text-[#e5f0ea]">Profile approval pending</h2>
                    <p className="mt-1 text-sm leading-6 text-[#2F4858]/70 dark:text-[#e5f0ea]/70">
                      Roll {latestSubmission.roll} is safely submitted. An admin will review it before it appears in the public directory.
                    </p>
                  </div>
                </div>
                <form action={logoutStudent} className="mt-5">
                  <SubmitButton
                    pendingText="Signing out…"
                    className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[#2F4858]/15 px-4 text-sm font-semibold text-[#2F4858] transition hover:bg-[#DDFBEF]/60 dark:border-white/15 dark:text-[#e5f0ea] dark:hover:bg-white/10"
                  >
                    Sign out
                  </SubmitButton>
                </form>
              </div>
            ) : (
              /* New submission or re-submission */
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
