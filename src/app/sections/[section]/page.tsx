import { createClient } from "../../../../utils/supabase/server";
import Navbar from "../../../components/ui/Navbar";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";

export default async function SectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const sectionName = section.toUpperCase();

  if (!["A", "B", "C"].includes(sectionName)) notFound();

  // Dynamic gradients based on the section
  const themeGradient = 
    sectionName === "A" ? "from-blue-400 to-cyan-400" :
    sectionName === "B" ? "from-purple-400 to-pink-400" :
    "from-indigo-400 to-purple-400";

  const supabase = await createClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .eq("section", section.toLowerCase())
    .order("roll", { ascending: true });

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col relative overflow-hidden">
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0 opacity-[0.15]">
        <div className="relative w-[800px] h-[800px] filter blur-[100px] animate-pulse duration-10000">
           <Image src="/ruet-logo.png" alt="Background" fill className="object-contain" />
        </div>
      </div>

      <div className="relative z-10 flex-grow">
        <Navbar />

        <header className="py-16 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <Link href="/" className="text-blue-400 hover:text-blue-300 font-medium tracking-wide mb-6 inline-block transition-colors">
              &larr; Back to Home
            </Link>
            <h1 className={`text-5xl md:text-6xl font-extrabold tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-r ${themeGradient}`}>
              Section {sectionName} Directory
            </h1>
          </div>
        </header>

        <main className="max-w-3xl mx-auto pb-24 px-6">
          {!profiles || profiles.length === 0 ? (
            <div className="bg-white/5 p-10 rounded-2xl border border-white/10 text-center backdrop-blur-xl">
              <p className="text-lg text-slate-400">No students have been added to Section {sectionName} yet.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              {profiles.map((profile: any) => (
                <div key={profile.id} className="bg-white/5 border border-white/10 backdrop-blur-2xl rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start transition-all hover:bg-white/10 hover:border-white/20">
                  
                  <div className="w-32 h-32 md:w-48 md:h-48 shrink-0 rounded-2xl overflow-hidden bg-slate-900/50 border border-white/10 flex items-center justify-center shadow-inner">
                    {profile.image_url ? (
                      <img src={profile.image_url} alt={profile.full_name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-5xl font-bold text-slate-600">
                        {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : "?"}
                      </span>
                    )}
                  </div>

                  <div className="flex-grow space-y-4 w-full text-center md:text-left">
                    <div>
                      <h3 className="text-3xl font-extrabold text-white tracking-tight mb-1">{profile.full_name}</h3>
                      <p className={`text-xl text-transparent bg-clip-text bg-gradient-to-r font-semibold ${themeGradient}`}>
                        Roll: {profile.roll}
                      </p>
                    </div>
                    
                    <div className="space-y-2 pt-1">
                      {profile.address && (
                        <p className="text-base text-slate-300">
                          <strong className="text-slate-500 font-medium tracking-wide uppercase text-xs mr-2">Location:</strong> 
                          {profile.address}
                        </p>
                      )}
                      
                      {profile.phone_number && (
                        <p className="text-base text-slate-300">
                          <strong className="text-slate-500 font-medium tracking-wide uppercase text-xs mr-2">Phone:</strong> 
                          {profile.phone_number}
                        </p>
                      )}
                      
                      {profile.whatsapp_number && profile.whatsapp_number !== profile.phone_number && (
                        <p className="text-base text-green-400">
                          <strong className="text-green-500/70 font-medium tracking-wide uppercase text-xs mr-2">WhatsApp:</strong> 
                          {profile.whatsapp_number}
                        </p>
                      )}
                    </div>

                    {profile.facebook_url && (
                      <div className="pt-3">
                        <a 
                          href={profile.facebook_url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="inline-flex items-center justify-center gap-2 bg-[#1877F2] hover:bg-[#1865D6] text-white px-6 py-2.5 rounded-lg transition-colors font-medium text-sm shadow-lg shadow-blue-900/20 w-full md:w-auto"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                          </svg>
                          Facebook ID
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
