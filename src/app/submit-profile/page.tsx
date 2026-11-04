import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock3, ShieldCheck } from "lucide-react";
import Navbar from "../../components/ui/Navbar";
import StudentEmailAccess from "../../components/StudentEmailAccess";
import StudentSubmissionForm from "../../components/StudentSubmissionForm";
import StudentOwnProfileForm from "../../components/StudentOwnProfileForm";
import FirebaseSignOutButton from "../../components/FirebaseSignOutButton";
import ToastAlert from "../../components/ToastAlert";
import { getFirebaseAdmin } from "../../../lib/firebase-admin";
import { getFirebaseUser } from "../../lib/firebase-session";
import { getCanonicalDistrictName } from "../../lib/districts";

export const metadata = {
  title: "Your student profile",
  robots: { index: false, follow: false },
};

export default async function SubmitProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const [{ error, success }, user] = await Promise.all([searchParams, getFirebaseUser()]);
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
  let latestSubmission: { status: string; roll: number } | null = null;

  if (user?.uid && user.email && user.email_verified) {
    const { db } = getFirebaseAdmin();
    const uid = user.uid;
    const verifiedEmail = user.email.trim().toLowerCase();
    const existingOwner = await db.collection("profiles")
      .where("owner_uid", "==", uid)
      .limit(1)
      .get();
    let profileDoc = existingOwner.docs[0];

    if (!profileDoc) {
      const emailMatch = await db.collection("profiles")
        .where("email", "==", verifiedEmail)
        .limit(2)
        .get();
      if (emailMatch.size === 1) {
        const candidate = emailMatch.docs[0];
        const linked = await db.runTransaction(async (transaction) => {
          const current = await transaction.get(candidate.ref);
          const profile = current.data();
          if (
            current.exists &&
            profile &&
            (!profile.owner_uid || profile.owner_uid === uid) &&
            typeof profile.email === "string" &&
            profile.email.trim().toLowerCase() === verifiedEmail
          ) {
            transaction.update(candidate.ref, {
              owner_uid: uid,
              updated_at: new Date().toISOString(),
            });
            return true;
          }
          return false;
        });
        if (linked) profileDoc = candidate;
      }
    }

    if (profileDoc) {
      const profile = profileDoc.data();
      if (profile && profile.owner_uid === uid) {
        ownProfile = {
          full_name: profile.full_name ?? "",
          nickname: profile.nickname ?? null,
          roll: Number(profile.roll) || 0,
          section: profile.section ?? "",
          email: profile.email ?? user.email,
          address: getCanonicalDistrictName(profile.address ?? ""),
          phone_number: profile.phone_number ?? "",
          whatsapp_number: profile.whatsapp_number ?? "",
          blood_group: profile.blood_group ?? null,
          facebook_url: profile.facebook_url ?? null,
          image_url: profile.image_url ?? null,
        };
      }
    }

    let submission = await db.collection("student_submissions").doc(uid).get();
    if (!submission.exists || submission.data()?.status !== "pending") {
      const emailSubmissions = await db.collection("student_submissions")
        .where("email", "==", verifiedEmail)
        .where("status", "==", "pending")
        .limit(2)
        .get();
      if (emailSubmissions.size > 1) {
        throw new Error("More than one pending submission matches this verified email.");
      }
      if (emailSubmissions.size === 1) {
        const candidate = emailSubmissions.docs[0];
        const rollRef = db.collection("profile_rolls").doc(String(candidate.get("roll")));
        const linkedSubmission = await db.runTransaction(async (transaction) => {
          const [current, reservation] = await Promise.all([
            transaction.get(candidate.ref),
            transaction.get(rollRef),
          ]);
          const data = current.data();
          const reservationData = reservation.data();
          if (
            !current.exists ||
            data?.status !== "pending" ||
            typeof data.email !== "string" ||
            data.email.trim().toLowerCase() !== verifiedEmail ||
            (data.user_id && data.user_id !== uid) ||
            !reservation.exists ||
            reservationData?.status !== "pending" ||
            reservationData.submission_id !== candidate.id
          ) {
            return false;
          }
          transaction.update(candidate.ref, { user_id: uid });
          transaction.update(rollRef, { user_id: uid });
          return true;
        });
        if (linkedSubmission) submission = await candidate.ref.get();
      }
    }
    if (submission.exists) {
      const data = submission.data()!;
      latestSubmission = { status: data.status ?? "", roll: Number(data.roll) || 0 };
    }
  }

  const userIsVerified = Boolean(user?.uid && user.email && user.email_verified);

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
              {userIsVerified ? <ShieldCheck aria-hidden="true" size={23} /> : <CheckCircle2 aria-hidden="true" size={23} />}
            </div>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-[#DDFBEF]/65">RUET CSE ’25 directory</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Add your profile</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#DDFBEF]/75">
              Share your details in a few steps. Your profile appears in the directory after an admin reviews it.
            </p>
          </header>

          <div className="p-6 sm:p-9">
            {!userIsVerified ? (
              <StudentEmailAccess />
            ) : ownProfile ? (
              <div className="space-y-4">
                <StudentOwnProfileForm profile={ownProfile} />
                <Link
                  href={`/sections/${ownProfile.roll <= 2503060 ? "a" : ownProfile.roll <= 2503120 ? "b" : "c"}`}
                  className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[#2F4858]/15 px-4 text-sm font-semibold text-[#2F4858] transition hover:bg-white"
                >
                  View your section directory
                </Link>
              </div>
            ) : latestSubmission?.status === "pending" ? (
              <div className="rounded-2xl border border-[#2F4858]/10 bg-white p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <Clock3 aria-hidden="true" className="mt-0.5 shrink-0 text-[#527A64]" size={21} />
                  <div>
                    <h2 className="font-semibold text-[#2F4858]">Profile approval pending</h2>
                    <p className="mt-1 text-sm leading-6 text-[#2F4858]/70">
                      Roll {latestSubmission.roll} is submitted and private while an admin reviews it.
                    </p>
                  </div>
                </div>
                <div className="mt-5">
                  <FirebaseSignOutButton className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[#2F4858]/15 px-4 text-sm font-semibold text-[#2F4858] transition hover:bg-[#DDFBEF]/60 disabled:opacity-60" />
                </div>
              </div>
            ) : latestSubmission?.status === "approved" ? (
              <div className="rounded-2xl border border-[#B8D9C5] bg-[#F0FBF4] p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <CheckCircle2 aria-hidden="true" className="mt-0.5 shrink-0 text-[#426C55]" size={21} />
                  <div>
                    <h2 className="font-semibold text-[#2F4858]">You’re in the directory</h2>
                    <p className="mt-1 text-sm leading-6 text-[#2F4858]/70">
                      Your profile is approved. If it is not linked to your account yet, contact a portal admin.
                    </p>
                  </div>
                </div>
                <div className="mt-5">
                  <FirebaseSignOutButton className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[#2F4858]/15 px-4 text-sm font-semibold text-[#2F4858] transition hover:bg-white disabled:opacity-60" />
                </div>
              </div>
            ) : (
              <StudentSubmissionForm
                email={user?.email ?? ""}
                wasRejected={latestSubmission?.status === "rejected"}
              />
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
