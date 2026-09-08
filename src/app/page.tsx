import Navbar from "../components/ui/Navbar";
import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  const sections = [
    { 
      id: 'a', 
      name: 'Section A', 
      description: 'Student directory for Section A',
      color: 'from-blue-400 to-cyan-400',
      glow: 'hover:shadow-[0_0_60px_rgba(56,189,248,0.3)]'
    },
    { 
      id: 'b', 
      name: 'Section B', 
      description: 'Student directory for Section B',
      color: 'from-purple-400 to-pink-400',
      glow: 'hover:shadow-[0_0_60px_rgba(192,132,252,0.3)]'
    },
    { 
      id: 'c', 
      name: 'Section C', 
      description: 'Student directory for Section C',
      color: 'from-indigo-400 to-purple-400',
      glow: 'hover:shadow-[0_0_60px_rgba(129,140,248,0.3)]'
    },
  ];

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Massive Blurred RUET Logo Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 opacity-20">
        <div className="relative w-[600px] h-[600px] md:w-[900px] md:h-[900px] filter blur-[80px] animate-pulse duration-10000">
           <Image 
             src="/ruet-logo.png" 
             alt="RUET Logo Blur" 
             fill 
             className="object-contain" 
           />
        </div>
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
          <Navbar />
          
          <header className="py-24 px-6">
            <div className="max-w-5xl mx-auto text-center">
              <h1 className="text-6xl md:text-8xl font-extrabold tracking-tighter mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500 drop-shadow-lg">
                RUET CSE '25
              </h1>
              <p className="text-xl text-indigo-100/70 max-w-2xl mx-auto font-light tracking-wide">
                The official student directory and batch portal.
              </p>
            </div>
          </header>

          <main className="max-w-5xl mx-auto pb-20 px-6 w-full flex-grow flex items-center">
            <div className="grid gap-8 md:grid-cols-3 w-full">
              {sections.map((section) => (
                <Link href={`/sections/${section.id}`} key={section.id}>
                  <div className={`group relative h-full rounded-3xl p-10 overflow-hidden transition-all duration-500 hover:-translate-y-2 bg-white/5 border border-white/10 backdrop-blur-3xl shadow-2xl z-10 ${section.glow}`}>
                    {/* Liquid Overlay Gradients */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0 pointer-events-none"></div>
                    <div className="absolute -inset-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 -z-10"></div>
                    
                    <div className="relative z-10">
                        <h3 className={`text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r ${section.color}`}>
                          {section.name}
                        </h3>
                        <p className="text-slate-300 font-light leading-relaxed group-hover:text-white transition-colors duration-300">
                          {section.description}
                        </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </main>
      </div>
    </div>
  );
}