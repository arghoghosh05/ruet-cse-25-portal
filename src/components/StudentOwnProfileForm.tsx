import Image from "next/image";
import { FilePenLine, LogOut } from "lucide-react";
import { logoutStudent, updateOwnStudentProfile } from "../app/submit-profile/actions";
import { BANGLADESH_DISTRICTS } from "../lib/districts";
import { BLOOD_GROUPS } from "../lib/student";
import ContactNumberFields from "./ContactNumberFields";
import StudentProfileForm from "./StudentProfileForm";
import SubmitButton from "./SubmitButton";

type OwnProfile = {
  full_name: string;
  nickname: string | null;
  roll: number;
  section: string;
  email: string | null;
  address: string;
  phone_number: string;
  whatsapp_number: string;
  blood_group: string | null;
  facebook_url: string | null;
  image_url: string | null;
};

export default function StudentOwnProfileForm({ profile }: { profile: OwnProfile }) {
  return (
    <div className="rounded-2xl border border-[#2F4858]/10 bg-white p-5 sm:p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-[#2F4858]">Your approved profile</h2>
        <p className="mt-1 text-sm leading-6 text-[#2F4858]/70">
          Your approved details are visible in the directory. You can update only your own profile here.
        </p>
      </div>

      <StudentProfileForm action={updateOwnStudentProfile} className="space-y-5">
        <div>
          <label className="portal-label !text-[#2F4858]" htmlFor="own-full-name">Full name <span className="text-[#527A64]">*</span></label>
          <input id="own-full-name" name="full_name" defaultValue={profile.full_name} required minLength={2} maxLength={120} autoComplete="name" className="portal-field" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="portal-label !text-[#2F4858]" htmlFor="own-roll">Roll number</label>
            <input id="own-roll" value={profile.roll} readOnly className="portal-field cursor-not-allowed" />
          </div>
          <div>
            <label className="portal-label !text-[#2F4858]" htmlFor="own-section">Section</label>
            <input id="own-section" value={profile.section.toUpperCase()} readOnly className="portal-field cursor-not-allowed" />
          </div>
          <div>
            <label className="portal-label !text-[#2F4858]" htmlFor="own-email">Verified email</label>
            <input id="own-email" type="email" value={profile.email ?? ""} readOnly className="portal-field cursor-not-allowed" />
          </div>
          <div>
            <label className="portal-label !text-[#2F4858]" htmlFor="own-nickname">Nickname <span className="font-normal text-[#2F4858]/55">(optional)</span></label>
            <input id="own-nickname" name="nickname" defaultValue={profile.nickname ?? ""} maxLength={40} className="portal-field" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="portal-label !text-[#2F4858]" htmlFor="own-district">District <span className="text-[#527A64]">*</span></label>
            <select id="own-district" name="address" required defaultValue={profile.address} className="portal-field">
              <option value="" disabled>Select your district</option>
              {BANGLADESH_DISTRICTS.map((district) => <option key={district} value={district}>{district}</option>)}
            </select>
          </div>
          <div>
            <label className="portal-label !text-[#2F4858]" htmlFor="own-blood-group">Blood group <span className="font-normal text-[#2F4858]/55">(optional)</span></label>
            <select id="own-blood-group" name="blood_group" defaultValue={profile.blood_group ?? ""} className="portal-field">
              <option value="">Prefer not to share</option>
              {BLOOD_GROUPS.map((group) => <option key={group} value={group}>{group}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-[#2F4858]/10 bg-[#2F4858] p-4">
          <ContactNumberFields phoneNumber={profile.phone_number} whatsappNumber={profile.whatsapp_number} />
        </div>

        <div>
          <label className="portal-label !text-[#2F4858]" htmlFor="own-facebook">Facebook profile <span className="font-normal text-[#2F4858]/55">(optional)</span></label>
          <input id="own-facebook" name="facebook_url" type="url" defaultValue={profile.facebook_url ?? ""} maxLength={500} placeholder="https://facebook.com/…" className="portal-field" />
        </div>

        <div>
          {profile.image_url && (
            <div className="mb-3 flex items-center gap-3">
              <Image src={profile.image_url} alt="Your current profile photo" width={64} height={64} unoptimized className="h-16 w-16 rounded-xl object-cover" />
              <p className="text-xs text-[#2F4858]/60">Choose a file below to replace your photo.</p>
            </div>
          )}
          <label className="portal-label !text-[#2F4858]" htmlFor="own-image">Profile photo <span className="font-normal text-[#2F4858]/55">(optional · PNG, JPEG, or WebP · max 15 MB)</span></label>
          <input id="own-image" name="image" type="file" accept="image/png, image/jpeg, image/webp" className="portal-field file:mr-3 file:rounded-lg file:border-0 file:bg-[#2F4858] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[#DDFBEF]" />
        </div>

        <SubmitButton
          pendingText="Saving your profile…"
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#2F4858] px-5 text-sm font-semibold text-[#DDFBEF] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#243B49] disabled:cursor-wait disabled:opacity-70"
        >
          <FilePenLine aria-hidden="true" size={17} /> Save profile changes
        </SubmitButton>
      </StudentProfileForm>

      <form action={logoutStudent} className="mt-4 border-t border-[#2F4858]/10 pt-4">
        <SubmitButton
          pendingText="Signing out…"
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#2F4858]/15 px-5 text-sm font-semibold text-[#2F4858] transition hover:bg-[#DDFBEF]/60 disabled:cursor-wait disabled:opacity-70"
        >
          <LogOut aria-hidden="true" size={16} /> Sign out
        </SubmitButton>
      </form>
    </div>
  );
}
