import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-slate-950/50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        
        {/* Left Side: Logo & Brand */}
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <img 
            src="/ruet-logo.png" 
            alt="RUET Logo" 
            className="w-10 h-10 object-contain" 
          />
          <span className="text-white font-bold text-xl tracking-wide">
            RUET CSE '25
          </span>
        </Link>

        {/* Right Side: Admin Login Button */}
        <Link 
          href="/admin/login" 
          className="inline-flex items-center justify-center text-sm font-medium text-blue-400 hover:text-blue-300 px-5 py-2.5 rounded-xl border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 transition-all shadow-lg shadow-blue-500/5"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
          </svg>
          Admin Login
        </Link>
        
      </div>
    </nav>
  );
}