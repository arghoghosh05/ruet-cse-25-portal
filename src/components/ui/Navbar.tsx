import Link from "next/link";
import { headers } from "next/headers";
import Image from "next/image";
import { ArrowUpRight, LockKeyhole, UserRound } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

export default async function Navbar() {
  const isAdminSignedIn =
    (await headers()).get("x-ruet-admin-authenticated") === "true";

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#2F4858] text-[#DDFBEF] shadow-[0_8px_28px_rgba(27,48,59,0.12)]">
      <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="group flex items-center gap-3 transition-opacity hover:opacity-85">
          <Image
            src="/ruet-logo.png"
            alt="RUET"
            width={40}
            height={40}
            priority
            className="h-10 w-10 object-contain"
          />
          <span className="leading-tight">
            <span className="block text-[15px] font-semibold tracking-wide sm:text-base">RUET CSE ’25</span>
            <span className="mt-0.5 block text-[10px] font-medium uppercase tracking-[0.19em] text-[#DDFBEF]/60">Student portal</span>
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle />
          <Link
            href={isAdminSignedIn ? "/admin/dashboard" : "/admin/login"}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#DDFBEF]/20 bg-[#DDFBEF] px-3 text-sm font-semibold text-[#2F4858] shadow-sm transition hover:-translate-y-0.5 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#2F4858] sm:px-5"
            aria-label={isAdminSignedIn ? "Admin Profile" : "Admin Login"}
          >
            {isAdminSignedIn ? <UserRound aria-hidden="true" size={17} /> : <LockKeyhole aria-hidden="true" size={16} />}
            <span className="hidden sm:inline">{isAdminSignedIn ? "Admin profile" : "Admin login"}</span>
            <ArrowUpRight aria-hidden="true" className="hidden opacity-55 sm:block" size={15} />
          </Link>
        </div>
      </div>
    </nav>
  );
}
