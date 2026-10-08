import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, UserRoundPlus, UsersRound } from "lucide-react";
import { notFound } from "next/navigation";
import Navbar from "../../../components/ui/Navbar";
import StudentDirectory from "../../../components/StudentDirectory";
import { getPublicSectionProfiles } from "../../../lib/public-students";

type SectionPageProps = {
  params: Promise<{ section: string }>;
};

const sectionNames = ["a", "b", "c"] as const;

export async function generateMetadata({ params }: SectionPageProps): Promise<Metadata> {
  const { section } = await params;
  const normalizedSection = section.toLowerCase();
  if (!sectionNames.includes(normalizedSection as (typeof sectionNames)[number])) {
    return { title: "Student directory" };
  }
  const name = normalizedSection.toUpperCase();
  return {
    title: `RUET CSE ’25 Section ${name} Student Directory`,
    description: `Browse the RUET CSE ’25 Section ${name} student directory. Find classmates by name or roll number and connect with the batch community.`,
    alternates: {
      canonical: `/sections/${normalizedSection}`,
    },
    openGraph: {
      title: `RUET CSE ’25 Section ${name} Student Directory`,
      description: `Find classmates in the RUET CSE ’25 Section ${name} directory.`,
      url: `https://ruetcse25.vercel.app/sections/${normalizedSection}`,
    },
  };
}

export default async function SectionPage({ params }: SectionPageProps) {
  const { section } = await params;
  const normalizedSection = section.toLowerCase();

  if (!sectionNames.includes(normalizedSection as (typeof sectionNames)[number])) {
    notFound();
  }

  const sectionName = normalizedSection.toUpperCase();
  const profiles = await getPublicSectionProfiles(normalizedSection);

  return (
    <div className="min-h-screen bg-transparent">
      <Navbar />

      <main className="mx-auto max-w-7xl px-5 pb-20 sm:px-8">
        <section className="relative mt-7 overflow-hidden rounded-[1.75rem] bg-[#2F4858] px-6 py-9 text-[#DDFBEF] shadow-[0_22px_55px_rgba(31,55,66,0.14)] sm:mt-10 sm:px-10 sm:py-12">
          <div className="absolute -right-10 -top-16 h-64 w-64 rounded-full border border-[#DDFBEF]/10" aria-hidden="true" />
          <div className="absolute -right-2 -top-8 h-48 w-48 rounded-full border border-[#DDFBEF]/10" aria-hidden="true" />
          <div className="relative">
            <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-[#DDFBEF]/75 transition hover:text-white">
              <ArrowLeft aria-hidden="true" size={16} /> All sections
            </Link>
            <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#DDFBEF]/60">Student directory</p>
                <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">Section {sectionName}</h1>
                <p className="mt-3 max-w-xl text-sm leading-6 text-[#DDFBEF]/72 sm:text-base">Find a classmate by name or roll number and browse the profiles shared by this section.</p>
              </div>
              <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
                <div className="flex items-center gap-3 rounded-xl border border-[#DDFBEF]/15 bg-white/5 px-4 py-3">
                  <UsersRound aria-hidden="true" size={19} className="text-[#DDFBEF]/70" />
                  <span className="text-sm font-medium">{profiles.length} {profiles.length === 1 ? "profile" : "profiles"}</span>
                </div>
                <Link
                  href="/submit-profile"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#DDFBEF] px-4 text-sm font-semibold text-[#2F4858] transition hover:bg-white"
                >
                  Your profile <UserRoundPlus aria-hidden="true" size={16} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-9">
          {profiles.length === 0 ? (
            <div className="soft-card flex flex-col items-center px-6 py-14 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#DDFBEF]">
                <Image src="/ruet-logo.png" alt="" width={36} height={36} className="h-9 w-9 object-contain opacity-75" />
              </div>
              <h2 className="mt-5 text-xl font-semibold tracking-tight">The directory is getting started</h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-[#2F4858]/65">There are no student profiles in Section {sectionName} yet. Check back as the class directory grows.</p>
              <Link href="/" className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-[#2F4858] px-4 text-sm font-semibold text-[#DDFBEF] transition hover:bg-[#243B49]">
                Back to all sections
              </Link>
            </div>
          ) : (
            <StudentDirectory profiles={profiles} />
          )}
        </div>
      </main>

      <footer className="border-t border-[#2F4858]/10 py-6 text-center text-xs text-[#2F4858]/55">
        RUET CSE ’25 · Section {sectionName}
      </footer>
    </div>
  );
}
