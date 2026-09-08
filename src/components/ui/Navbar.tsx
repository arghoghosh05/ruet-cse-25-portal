import Image from "next/image";
import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between p-4 border-b border-white/10 bg-slate-950/50 backdrop-blur-md">
      <Link href="/" className="flex items-center gap-3">
        <Image 
          src="/ruet-logo.png" 
          alt="RUET Logo" 
          width={40} 
          height={40} 
          className="object-contain"
        />
        <span className="font-bold text-xl text-white tracking-tight">RUET CSE '25</span>
      </Link>
    </nav>
  );
}