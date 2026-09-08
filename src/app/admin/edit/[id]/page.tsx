import { createClient } from "../../../../../utils/supabase/server";
import { redirect } from "next/navigation";
import Navbar from "../../../../components/ui/Navbar";
import { updateStudent } from "../../actions";
import Link from "next/link";
import AutoSection from "../../../../components/AutoSection";

const DISTRICTS = [
  "Bagerhat", "Bandarban", "Barguna", "Barisal", "Bhola", "Bogra", "Brahmanbaria", 
  "Chandpur", "Chapai Nawabganj", "Chattogram", "Chuadanga", "Comilla", "Cox's Bazar", 
  "Dhaka", "Dinajpur", "Faridpur", "Feni", "Gaibandha", "Gazipur", "Gopalganj", 
  "Habiganj", "Jamalpur", "Jashore", "Jhalokati", "Jhenaidah", "Joypurhat", "Khagrachari", 
  "Khulna", "Kishoreganj", "Kurigram", "Kushtia", "Lakshmipur", "Lalmonirhat", "Madaripur", 
  "Magura", "Manikganj", "Meherpur", "Moulvibazar", "Munshiganj", "Mymensingh", "Naogaon", 
  "Narail", "Narayanganj", "Narsingdi", "Natore", "Netrokona", "Nilphamari", "Noakhali", 
  "Pabna", "Panchagarh", "Patuakhali", "Pirojpur", "Rajbari", "Rajshahi", "Rangamati", 
  "Rangpur", "Satkhira", "Shariatpur", "Sherpur", "Sirajganj", "Sunamganj", "Sylhet", 
  "Tangail", "Thakurgaon"
];

export default async function EditStudentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) redirect("/admin/login");

  const { data: student } = await supabase
    .from("profiles")
    .select("*")
    .match({ id: id, created_by: user.id })
    .single();

  if (!student) redirect("/admin/dashboard");

  return (
    <div className="min-h-screen bg-slate-950 text-gray-100 pb-20">
      <Navbar />
      <AutoSection />
      
      <main className="max-w-2xl mx-auto py-12 px-6">
        <Link href="/admin/dashboard" className="text-blue-400 mb-6 inline-flex items-center hover:text-blue-300 transition-colors">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Back to Dashboard
        </Link>
        
        <div className="bg-white/5 p-8 rounded-3xl border border-white/10 backdrop-blur-xl">
          <h2 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
            Edit Record: {student.full_name}
          </h2>
          
          <form action={updateStudent} className="space-y-4" autoComplete="new-password">
            <input type="hidden" name="id" value={student.id} />
            
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Full Name</label>
              <input 
                name="full_name" 
                type="text" 
                defaultValue={student.full_name} 
                required 
                autoComplete="new-password"
                className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white focus:ring-2 focus:ring-blue-500" 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-slate-300">Roll Number</label>
                <input 
                  name="roll" 
                  type="number" 
                  defaultValue={student.roll} 
                  required 
                  autoComplete="new-password"
                  className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm text-slate-300">Section (Auto-Assigned)</label>
                <input 
                  name="section" 
                  type="text" 
                  readOnly 
                  defaultValue={student.section}
                  autoComplete="new-password"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/60 border border-white/5 text-blue-400 uppercase font-bold cursor-not-allowed focus:outline-none" 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-slate-300">District (Location)</label>
                <select name="address" defaultValue={student.address || ""} required autoComplete="new-password" className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white focus:ring-2 focus:ring-blue-500">
                  <option value="" disabled>Select a District</option>
                  {DISTRICTS.map((district) => (
                    <option key={district} value={district}>{district}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-slate-300">Primary Phone</label>
                <input 
                  name="phone_number" 
                  type="text" 
                  defaultValue={student.phone_number || ""} 
                  autoComplete="new-password"
                  className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white focus:ring-2 focus:ring-blue-500" 
                />
              </div>
            </div>
            
            <div className="space-y-2">
               <label className="text-sm text-green-400">WhatsApp Number</label>
               <input 
                 name="whatsapp_number" 
                 type="text" 
                 defaultValue={student.whatsapp_number || ""} 
                 autoComplete="new-password"
                 className="w-full px-4 py-3 rounded-xl bg-black/50 border border-green-500/30 text-white focus:ring-2 focus:ring-green-500" 
               />
            </div>

            {/* 🔥 NEW: Image Preview System */}
            <div className="space-y-2 pt-2">
              <label className="text-sm text-slate-300">Profile Image</label>
              
              {student.image_url && (
                <div className="mb-3 flex items-center gap-4 p-3 bg-black/30 rounded-xl border border-white/5">
                  <img src={student.image_url} alt="Current profile" className="w-16 h-16 rounded-xl object-cover border border-white/10 shadow-inner" />
                  <div>
                    <p className="text-sm font-medium text-slate-300">Current Image</p>
                    <p className="text-xs text-slate-500">Leave this input blank to keep the current image.</p>
                  </div>
                </div>
              )}

              <input 
                name="image" 
                type="file" 
                accept="image/png, image/jpeg, image/jpg, image/webp" 
                className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-500/20 file:text-blue-400 hover:file:bg-blue-500/30 cursor-pointer" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-300">Facebook URL</label>
              <input 
                name="facebook_url" 
                type="url" 
                defaultValue={student.facebook_url || ""} 
                autoComplete="new-password"
                className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white focus:ring-2 focus:ring-blue-500" 
              />
            </div>
            
            <button type="submit" className="w-full mt-4 bg-blue-600/80 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-500/20">
              Save Changes
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}