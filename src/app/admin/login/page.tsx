import Navbar from "../../../components/ui/Navbar";
import { loginAdmin } from "../actions";
import ToastAlert from "../../../components/ToastAlert";

export default async function AdminLogin({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  // Catch the error message from the URL
  const { error } = await searchParams;

  return (
    <div className="min-h-screen bg-slate-950 text-gray-100 flex flex-col relative">
      {/* 🚨 Inject the ToastAlert here */}
      <ToastAlert error={error} />
      
      <Navbar />
      
      <main className="flex-grow flex items-center justify-center px-6 py-12">
        <div className="bg-slate-900/80 p-8 md:p-10 rounded-2xl border border-white/5 shadow-2xl w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">Admin Access</h1>
            <p className="text-sm text-slate-400">Restricted to RUET CSE '25 portal administrators.</p>
          </div>
          
          <form action={loginAdmin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Admin Email</label>
              <input 
                name="email" 
                type="email" 
                required 
                className="w-full px-4 py-3 rounded-lg bg-slate-950 border border-white/10 text-white focus:ring-2 focus:ring-blue-500 transition-colors focus:outline-none" 
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Password</label>
              <input 
                name="password" 
                type="password" 
                required 
                className="w-full px-4 py-3 rounded-lg bg-slate-950 border border-white/10 text-white focus:ring-2 focus:ring-blue-500 transition-colors focus:outline-none" 
              />
            </div>
            
            <button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-lg transition-all shadow-lg shadow-blue-500/20"
            >
              Sign In
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}