import { createClient } from "../../../../utils/supabase/server";
import { redirect } from "next/navigation";
import Navbar from "../../../components/ui/Navbar";
import Link from "next/link";
import { logoutAdmin, addStudent, deleteStudent } from "../actions";
import AutoSection from "../../../components/AutoSection";
import ToastAlert from "../../../components/ToastAlert";

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

export default async function AdminDashboard({ searchParams }: { searchParams: Promise<{ error?: string, success?: string }> }) {
  const { error, success } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) redirect("/admin/login");

  const { data: myRecords } = await supabase
    .from("profiles")
    .select("*")
    .eq("created_by", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-slate-950 text-gray-100 pb-20 relative">
      <ToastAlert error={error} success={success} />
      <Navbar />
      <AutoSection />
      
      {/* Header is no longer sticky, it will scroll away naturally */}
      <header className="border-b border-white/10 bg-slate-950/50 backdrop-blur-md py-6 px-6 z-30">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500">
              Admin Control Panel
            </h1>
            <p className="text-sm text-slate-400">Logged in as {user.email}</p>
          </div>
          <form action={logoutAdmin}>
            <button type="submit" className="px-4 py-2 border border-white/20 rounded-md text-slate-300 hover:bg-red-500/20 hover:border-red-500/50 transition-all text-sm font-medium">
              Logout
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-6xl mx-auto py-12 px-6">
        <div className="grid gap-12 lg:grid-cols-2">
          <div className="bg-white/5 p-8 rounded-3xl border border-white/10 backdrop-blur-xl h-fit">
            <h2 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              Add New Student
            </h2>
            <form action={addStudent} className="space-y-4" autoComplete="off">
              <div className="space-y-2">
                <label className="text-sm text-slate-300">Full Name</label>
                <input 
                  name="full_name" 
                  type="text" 
                  required 
                  autoComplete="off" 
                  placeholder="Enter full name" 
                  className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white placeholder-slate-600 focus:ring-2 focus:ring-blue-500" 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-slate-300">Roll Number</label>
                  <input 
                    name="roll" 
                    type="number" 
                    required 
                    autoComplete="off" 
                    placeholder="Enter roll number" 
                    className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white placeholder-slate-600 focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm text-slate-300">Section (Auto-Assigned)</label>
                  <input 
                    name="section" 
                    type="text" 
                    readOnly 
                    autoComplete="off"
                    placeholder=""
                    className="w-full px-4 py-3 rounded-xl bg-slate-900/60 border border-white/5 text-blue-400 uppercase font-bold cursor-not-allowed focus:outline-none placeholder-slate-700" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-slate-300">District (Location)</label>
                  <select name="address" required defaultValue="" autoComplete="off" className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white focus:ring-2 focus:ring-blue-500">
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
                    autoComplete="off" 
                    placeholder="Enter phone number" 
                    className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white placeholder-slate-600 focus:ring-2 focus:ring-blue-500" 
                  />
                </div>
              </div>
              
              <div className="pt-1">
                <input type="checkbox" id="add-wa" className="peer hidden" />
                <label htmlFor="add-wa" className="inline-flex items-center text-sm font-medium text-blue-400 hover:text-blue-300 cursor-pointer peer-checked:hidden transition-colors">
                  <span className="mr-1 text-lg leading-none">+</span> Add distinct WhatsApp Number
                </label>
                
                <div className="hidden peer-checked:block space-y-2 transition-all">
                  <div className="flex justify-between items-center">
                    <label className="text-sm text-green-400">WhatsApp Number</label>
                    <label htmlFor="add-wa" className="text-xs text-slate-500 hover:text-red-400 cursor-pointer">Hide</label>
                  </div>
                  <input 
                    name="whatsapp_number" 
                    type="text" 
                    autoComplete="off" 
                    placeholder="Enter WhatsApp number" 
                    className="w-full px-4 py-3 rounded-xl bg-black/50 border border-green-500/30 text-white placeholder-slate-600 focus:ring-2 focus:ring-green-500" 
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-sm text-slate-300">Profile Image</label>
                <input 
                  name="image" 
                  type="file" 
                  accept="image/png, image/jpeg, image/jpg, image/webp" 
                  className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-500/20 file:text-blue-400 hover:file:bg-blue-500/30 cursor-pointer" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-slate-300">Facebook Profile URL (Optional)</label>
                <input 
                  name="facebook_url" 
                  type="url" 
                  autoComplete="off" 
                  placeholder="https://facebook.com/..." 
                  className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white placeholder-slate-600 focus:ring-2 focus:ring-blue-500" 
                />
              </div>
              <button type="submit" className="w-full mt-4 bg-blue-600/80 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-500/20">
                Add to Directory
              </button>
            </form>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              My Uploaded Records
            </h2>
            <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2">
              {!myRecords || myRecords.length === 0 ? (
                <p className="text-slate-400">You haven't added any students yet.</p>
              ) : (
                myRecords.map((record: any) => {
                  // Determine dynamic color based on section
                  const sectionColor = 
                    record.section === "a" ? "text-cyan-400" : 
                    record.section === "b" ? "text-purple-400" : 
                    "text-indigo-400";

                  return (
                    <div key={record.id} className="bg-white/5 border border-white/10 p-5 rounded-2xl flex justify-between items-center backdrop-blur-md transition-all hover:bg-white/10">
                      <div>
                        <h3 className="font-bold text-lg text-white">{record.full_name}</h3>
                        <p className="text-sm text-slate-400 mt-1">
                          Roll: {record.roll} • <span className={`font-semibold ${sectionColor}`}>Sec: {record.section.toUpperCase()}</span>
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <Link href={`/admin/edit/${record.id}`} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors">
                          Edit
                        </Link>
                        <form action={deleteStudent}>
                          <input type="hidden" name="id" value={record.id} />
                          <input type="hidden" name="section" value={record.section} />
                          <button type="submit" className="px-4 py-2 bg-red-500/20 hover:bg-red-500/40 text-red-300 rounded-lg text-sm font-medium transition-colors">
                            Delete
                          </button>
                        </form>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}