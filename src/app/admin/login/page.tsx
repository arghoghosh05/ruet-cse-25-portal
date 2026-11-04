import type { Metadata } from "next";
import Image from "next/image";
import { ArrowLeft, LockKeyhole, ShieldCheck } from "lucide-react";
import Link from "next/link";
import Navbar from "../../../components/ui/Navbar";
import StudentEmailAccess from "../../../components/StudentEmailAccess";
import ToastAlert from "../../../components/ToastAlert";
import { getFirebaseUser } from "../../../lib/firebase-session";
import { isAdminEmail } from "../../../lib/admin-auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

export default async function AdminLogin({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const user = await getFirebaseUser();
  if (isAdminEmail(user?.email)) redirect("/admin/dashboard");

  return (
    <div className="min-h-screen bg-transparent">
      <ToastAlert error={error} />
      <Navbar />

      <main className="mx-auto grid min-h-[calc(100vh-76px)] max-w-7xl items-center gap-8 px-5 py-10 sm:px-8 lg:grid-cols-[1fr_0.85fr] lg:gap-16 lg:py-16">
        <section className="hidden lg:block">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-[#2F4858]/65 transition hover:text-[#2F4858]">
            <ArrowLeft aria-hidden="true" size={16} /> Return to the portal
          </Link>
          <div className="mt-12 max-w-xl">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2F4858] text-[#DDFBEF]">
              <ShieldCheck aria-hidden="true" size={27} strokeWidth={1.7} />
            </div>
            <p className="mt-8 text-xs font-semibold uppercase tracking-[0.22em] text-[#5E806F]">Portal administration</p>
            <h1 className="mt-3 text-5xl font-semibold leading-[1.08] tracking-[-0.055em] text-[#2F4858]">
              Good to have you back.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-[#2F4858]/70">
              Sign in to manage student profiles and keep the RUET CSE ’25 directory up to date.
            </p>
          </div>
          <div className="mt-12 flex items-center gap-4 rounded-2xl border border-[#2F4858]/10 bg-white/55 p-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#DDFBEF]">
              <Image src="/ruet-logo.png" alt="" width={36} height={36} className="h-9 w-9 object-contain" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#2F4858]">RUET CSE ’25</p>
              <p className="mt-0.5 text-xs text-[#2F4858]/60">Authorized administrators only</p>
            </div>
            <LockKeyhole aria-hidden="true" className="ml-auto text-[#5E806F]" size={18} />
          </div>
        </section>

        <section className="mx-auto w-full max-w-[470px]">
          <div className="mb-6 lg:hidden">
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-[#2F4858]/65">
              <ArrowLeft aria-hidden="true" size={16} /> Back to portal
            </Link>
          </div>
          <div className="rounded-[1.75rem] border border-[#2F4858]/10 bg-[#F8FCF9] p-6 shadow-[0_24px_65px_rgba(47,72,88,0.12)] sm:p-9">
            <div className="mb-8">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#DDFBEF] text-[#2F4858]">
                <LockKeyhole aria-hidden="true" size={20} />
              </div>
              <h2 className="mt-5 text-2xl font-semibold tracking-[-0.04em] text-[#2F4858]">Admin sign in</h2>
              <p className="mt-2 text-sm leading-6 text-[#2F4858]/65">Use your authorized portal administrator account.</p>
            </div>

            <StudentEmailAccess
              title="Sign in with an administrator Google account"
              description="Use a verified Google account listed in the server-only ADMIN_EMAILS setting."
              signedInDescription={`Signed in as ${user?.email ?? "a Google account"}. This address is not on the administrator allowlist.`}
            />

            <p className="mt-6 border-t border-[#2F4858]/[0.08] pt-5 text-center text-xs leading-5 text-[#2F4858]/55">
              Access is limited to administrators approved for the RUET CSE ’25 portal.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
