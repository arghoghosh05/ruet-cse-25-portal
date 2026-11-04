import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Compass, SearchX } from "lucide-react";
import Navbar from "../components/ui/Navbar";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-transparent">
      <Navbar />

      <main className="mx-auto flex max-w-3xl flex-col px-5 pb-24 pt-14 sm:px-8 sm:pt-20">
        <div className="soft-card relative overflow-hidden px-6 py-14 text-center sm:px-12 sm:py-16">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-14 -top-20 h-56 w-56 rounded-full border border-[#2F4858]/10"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-4 -top-10 h-40 w-40 rounded-full border border-[#2F4858]/10"
          />

          <div className="relative flex flex-col items-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#2F4858] text-[#DDFBEF] shadow-lg shadow-[#2F4858]/15">
              <SearchX aria-hidden="true" size={28} strokeWidth={1.7} />
            </span>
            <p className="mt-7 text-xs font-semibold uppercase tracking-[0.2em] text-[#5E806F]">Error 404</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#2F4858] sm:text-4xl">
              This page isn’t in the directory.
            </h1>
            <p className="mt-4 max-w-md text-sm leading-7 text-[#2F4858]/70 sm:text-base">
              The link may be out of date, or the page may have moved. Head back to the portal and browse a section instead.
            </p>

            <div className="mt-9 flex w-full flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/"
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#2F4858] px-5 text-sm font-semibold text-[#DDFBEF] shadow-lg shadow-[#2F4858]/15 transition hover:-translate-y-0.5 hover:bg-[#243B49] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F4858] focus-visible:ring-offset-2 focus-visible:ring-offset-[#DDFBEF] sm:w-auto"
              >
                <ArrowLeft aria-hidden="true" size={16} /> Back to the portal
              </Link>
              <Link
                href="/#sections"
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#2F4858]/15 bg-white/40 px-5 text-sm font-semibold text-[#2F4858] transition hover:border-[#2F4858]/30 hover:bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F4858] focus-visible:ring-offset-2 focus-visible:ring-offset-[#DDFBEF] sm:w-auto"
              >
                <Compass aria-hidden="true" size={16} /> Explore sections
              </Link>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-[#2F4858]/10 py-6 text-center text-xs text-[#2F4858]/55">
        RUET CSE ’25 · Student portal
      </footer>
    </div>
  );
}
