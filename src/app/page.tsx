import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUpRight, BookOpen, ExternalLink, UserRoundPlus, UsersRound } from "lucide-react";
import Navbar from "../components/ui/Navbar";

const sections = [
  { id: "a", name: "Section A", number: "01", note: "Browse the A section directory" },
  { id: "b", name: "Section B", number: "02", note: "Browse the B section directory" },
  { id: "c", name: "Section C", number: "03", note: "Browse the C section directory" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-transparent">
      <Navbar />

      <main className="relative isolate">
        <section className="home-content relative z-10 mx-auto grid max-w-7xl gap-12 px-5 pb-16 pt-12 sm:px-8 sm:pt-16 lg:grid-cols-[1.03fr_0.97fr] lg:items-center lg:gap-16 lg:pb-24 lg:pt-20">
          <div className="animate-float-in">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#2F4858]/10 bg-white/55 px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#2F4858]/75">
              <span className="h-2 w-2 rounded-full bg-[#5E9B7B]" />
              Rajshahi University of Engineering & Technology
            </div>
            <h1 className="max-w-3xl text-5xl font-semibold leading-[1.04] tracking-[-0.055em] text-[#2F4858] sm:text-6xl lg:text-[4.55rem]">
              RUET CSE 25
            </h1>
            <p className="mt-2 text-2xl font-normal tracking-[-0.04em] text-[#557268] sm:text-3xl">
              Student Portal &amp; Batch Directory
            </p>
            <p className="mt-6 max-w-xl text-base leading-7 text-[#2F4858]/75 sm:text-lg sm:leading-8">
              A home for the RUET CSE ’25 community. Find your classmates, explore the sections, and keep the batch connected.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="#sections"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#2F4858] px-5 text-sm font-semibold text-[#DDFBEF] shadow-lg shadow-[#2F4858]/15 transition hover:-translate-y-0.5 hover:bg-[#243B49] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F4858] focus-visible:ring-offset-2 focus-visible:ring-offset-[#DDFBEF]"
              >
                Explore the directory <ArrowRight aria-hidden="true" size={17} />
              </Link>
              <a
                href="#about"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#2F4858]/15 bg-white/40 px-5 text-sm font-semibold text-[#2F4858] transition hover:border-[#2F4858]/30 hover:bg-white/70"
              >
                About the portal <ArrowDown aria-hidden="true" size={16} />
              </a>
              <a
                href="https://ruetcsearchive.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#2F4858]/15 bg-white/40 px-5 text-sm font-semibold text-[#2F4858] transition hover:border-[#2F4858]/30 hover:bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F4858] focus-visible:ring-offset-2 focus-visible:ring-offset-[#DDFBEF]"
              >
                Student resources <ExternalLink aria-hidden="true" size={16} />
              </a>
              <Link
                href="/submit-profile"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#2F4858]/15 bg-white/40 px-5 text-sm font-semibold text-[#2F4858] transition hover:border-[#2F4858]/30 hover:bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F4858] focus-visible:ring-offset-2 focus-visible:ring-offset-[#DDFBEF]"
              >
                Your profile <UserRoundPlus aria-hidden="true" size={16} />
              </Link>
            </div>
            <p className="mt-2 text-xs leading-5 text-[#2F4858]/60">
              For student resources and study help, follow the Student Resources button.
            </p>
            <div className="mt-10 flex items-center gap-3 text-sm text-[#2F4858]/65">
              <UsersRound aria-hidden="true" size={18} className="text-[#557268]" />
              <span>Made for the CSE 25-series community</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[550px] animate-float-in [animation-delay:100ms]">
            <div className="absolute -right-3 -top-4 h-24 w-24 rounded-full border border-[#2F4858]/10 sm:-right-6 sm:-top-6 sm:h-32 sm:w-32" />
            <div className="absolute -bottom-5 -left-4 h-24 w-24 rounded-full bg-[#A9DEC3]/45 blur-2xl sm:-left-8 sm:h-36 sm:w-36" />
            <div className="relative overflow-hidden rounded-[2rem] bg-[#2F4858] p-6 text-[#DDFBEF] shadow-[0_32px_80px_rgba(31,55,66,0.22)] sm:p-9">
              <div className="absolute inset-0 opacity-[0.09]" aria-hidden="true">
                <div className="h-full w-full bg-[linear-gradient(rgba(221,251,239,0.55)_1px,transparent_1px),linear-gradient(90deg,rgba(221,251,239,0.55)_1px,transparent_1px)] bg-[size:34px_34px]" />
              </div>
              <div className="relative flex items-center justify-between">
                <span className="rounded-full border border-[#DDFBEF]/20 bg-white/5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.19em] text-[#DDFBEF]/75">Class of 2025</span>
              </div>
              <div className="relative flex min-h-[300px] flex-col items-center justify-center py-10 text-center sm:min-h-[365px]">
                <div className="absolute h-52 w-52 rounded-full border border-[#DDFBEF]/10 sm:h-64 sm:w-64" />
                <div className="absolute h-40 w-40 rounded-full border border-[#DDFBEF]/15 sm:h-48 sm:w-48" />
                <div className="relative flex h-32 w-32 items-center justify-center rounded-full border border-[#DDFBEF]/20 bg-[#DDFBEF]/10 shadow-[0_0_70px_rgba(221,251,239,0.12)] sm:h-40 sm:w-40">
                  <Image src="/ruet-logo.png" alt="RUET emblem" width={112} height={112} priority unoptimized className="h-24 w-24 object-contain sm:h-28 sm:w-28" />
                </div>
                <p className="relative mt-7 text-xs font-medium uppercase tracking-[0.28em] text-[#DDFBEF]/55">Computer Science & Engineering</p>
                <p className="relative mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">RUET CSE ’25</p>
              </div>
              <div className="relative flex items-center justify-between border-t border-[#DDFBEF]/15 pt-4 text-xs text-[#DDFBEF]/65">
                <span>Three sections. One community.</span>
                <BookOpen aria-hidden="true" size={17} />
              </div>
            </div>
          </div>
        </section>

        <section id="sections" className="home-content relative z-10 border-y border-[#2F4858]/[0.08] bg-[#F4FBF6]">
          <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
            <div className="mb-9 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-start sm:gap-10">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5E806F]">Find your people</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#2F4858] sm:text-4xl">Explore by section</h2>
              </div>
              <p className="max-w-sm text-sm leading-6 text-[#2F4858]/65">Choose a section to browse its student directory. Search by name or roll once you’re there.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {sections.map((section) => (
                <Link
                  href={`/sections/${section.id}`}
                  key={section.id}
                  prefetch={true}
                  className="group rounded-2xl border border-[#2F4858]/10 bg-white p-6 shadow-[0_10px_28px_rgba(47,72,88,0.035)] transition duration-200 hover:-translate-y-1 hover:border-[#6C9C82]/45 hover:shadow-[0_18px_38px_rgba(47,72,88,0.09)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#527A64]"
                >
                  <div className="flex items-start justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#DDFBEF] text-base font-semibold text-[#2F4858]">{section.number}</span>
                    <ArrowUpRight aria-hidden="true" size={19} className="text-[#2F4858]/45 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#2F4858]" />
                  </div>
                  <h3 className="mt-8 text-2xl font-semibold tracking-tight text-[#2F4858]">{section.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#2F4858]/65">{section.note}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section id="about" className="home-content relative z-10 mx-auto grid max-w-7xl gap-6 px-5 py-16 sm:px-8 sm:py-20 md:grid-cols-[auto_minmax(0,1fr)] md:items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#2F4858] text-[#DDFBEF] shadow-lg shadow-[#2F4858]/15">
            <BookOpen aria-hidden="true" size={27} strokeWidth={1.7} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5E806F]">A shared space</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.035em] text-[#2F4858] sm:text-3xl">Built to help classmates stay connected.</h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-[#2F4858]/70 sm:text-base">
              Browse student profiles across the three sections, find a classmate by name or roll, and reach out using the contact details they’ve chosen to share.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#2F4858]/10 bg-[#2F4858] text-[#DDFBEF]">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-6 text-xs text-[#DDFBEF]/65 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <span>RUET CSE ’25 · Student portal</span>
          <div className="flex flex-col gap-1 sm:items-end">
            <span>Rajshahi University of Engineering & Technology</span>
            <span className="text-[11px] font-medium tracking-wide text-[#DDFBEF]/45">Made by Argho</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
