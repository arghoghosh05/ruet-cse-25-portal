"use client";

import Image from "next/image";
import { FilePenLine, LogOut, Trash2 } from "lucide-react";
import { useState } from "react";
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
  const [removePhoto, setRemovePhoto] = useState(false);

  return (
    <div className="rounded-2xl border border-[#2F4858]/10 bg-white p-5 sm:p-6 dark:bg-[#1e3039] dark:border-white/10">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-[#2F4858] dark:text-[#e5f0ea]">Your approved profile</h2>
        <p className="mt-1 text-sm leading-6 text-[#2F4858]/70 dark:text-[#e5f0ea]/70">
          Your approved details are visible in the directory. You can update only your own profile here.
        </p>
      </div>

      <StudentProfileForm action={updateOwnStudentProfile} className="space-y-5">
        <div>
          <label className="portal-label !text-[#2F4858] dark:!text-[#e5f0ea]" htmlFor="own-full-name">Full name <span className="text-[#527A64]">*</span></label>
          <input id="own-full-name" name="full_name" defaultValue={profile.full_name} required minLength={2} maxLength={120} autoComplete="name" className="portal-field" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="portal-label !text-[#2F4858] dark:!text-[#e5f0ea]" htmlFor="own-roll">Roll number</label>
            <input id="own-roll" value={profile.roll} readOnly className="portal-field cursor-not-allowed" />
          </div>
          <div>
            <label className="portal-label !text-[#2F4858] dark:!text-[#e5f0ea]" htmlFor="own-section">Section</label>
            <input id="own-section" value={profile.section.toUpperCase()} readOnly className="portal-field cursor-not-allowed" />
          </div>
          <div>
            <label className="portal-label !text-[#2F4858] dark:!text-[#e5f0ea]" htmlFor="own-email">Verified email</label>
            <input id="own-email" type="email" value={profile.email ?? ""} readOnly className="portal-field cursor-not-allowed" />
          </div>
          <div>
            <label className="portal-label !text-[#2F4858] dark:!text-[#e5f0ea]" htmlFor="own-nickname">Nickname <span className="font-normal text-[#2F4858]/55 dark:text-[#e5f0ea]/55">(optional)</span></label>
            <input id="own-nickname" name="nickname" defaultValue={profile.nickname ?? ""} maxLength={40} className="portal-field" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="portal-label !text-[#2F4858] dark:!text-[#e5f0ea]" htmlFor="own-district">District <span className="text-[#527A64]">*</span></label>
            <select id="own-district" name="address" required defaultValue={profile.address} className="portal-field">
              <option value="" disabled>Select your district</option>
              {BANGLADESH_DISTRICTS.map((district) => <option key={district} value={district}>{district}</option>)}
            </select>
          </div>
          <div>
            <label className="portal-label !text-[#2F4858] dark:!text-[#e5f0ea]" htmlFor="own-blood-group">Blood group <span className="font-normal text-[#2F4858]/55 dark:text-[#e5f0ea]/55">(optional)</span></label>
            <select id="own-blood-group" name="blood_group" defaultValue={profile.blood_group ?? ""} className="portal-field">
              <option value="">Prefer not to share</option>
              {BLOOD_GROUPS.map((group) => <option key={group} value={group}>{group}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-[#2F4858]/10 bg-[#2F4858] p-4 dark:bg-[#14232b]">
          <ContactNumberFields phoneNumber={profile.phone_number} whatsappNumber={profile.whatsapp_number} />
        </div>

        <div>
          <label className="portal-label !text-[#2F4858] dark:!text-[#e5f0ea]" htmlFor="own-facebook">Facebook profile <span className="font-normal text-[#2F4858]/55 dark:text-[#e5f0ea]/55">(optional)</span></label>
          <input id="own-facebook" name="facebook_url" type="url" defaultValue={profile.facebook_url ?? ""} maxLength={500} placeholder="https://facebook.com/…" className="portal-field" />
        </div>

        <div>
          {profile.image_url && !removePhoto && (
            <div className="mb-3 flex items-center justify-between rounded-xl border border-[#2F4858]/10 bg-[#F8FCF9] p-3 dark:bg-[#14232b] dark:border-white/10">
              <div className="flex items-center gap-3">
                <Image src={profile.image_url} alt="Your current profile photo" width={64} height={64} sizes="64px" className="h-16 w-16 rounded-xl object-cover" />
                <div>
                  <p className="text-xs font-semibold text-[#2F4858] dark:text-[#e5f0ea]">Current photo</p>
                  <p className="text-xs text-[#2F4858]/60 dark:text-[#e5f0ea]/60">Upload a new file below to replace it.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRemovePhoto(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#A74343]/20 px-3 py-1.5 text-xs font-semibold text-[#934C43] transition hover:bg-[#FFF3EF] dark:text-[#ffc8bd] dark:hover:bg-[#3a2928]"
              >
                <Trash2 aria-hidden="true" size={14} /> Remove photo
              </button>
            </div>
          )}

          {removePhoto && (
            <div className="mb-3 flex items-center justify-between rounded-xl border border-[#A74343]/20 bg-[#FFF3EF] p-3 dark:bg-[#3a2928]">
              <span className="text-xs font-medium text-[#733F36] dark:text-[#ffc8bd]">Current photo will be deleted on save.</span>
              <button
                type="button"
                onClick={() => setRemovePhoto(false)}
                className="text-xs font-semibold text-[#2F4858] underline dark:text-[#e5f0ea]"
              >
                Undo
              </button>
              <input type="hidden" name="remove_image" value="true" />
            </div>
          )}

          <label className="portal-label !text-[#2F4858] dark:!text-[#e5f0ea]" htmlFor="own-image">
            {profile.image_url ? "Replace profile photo" : "Profile photo"}{" "}
            <span className="font-normal text-[#2F4858]/55 dark:text-[#e5f0ea]/55">(optional · PNG, JPEG, or WebP · max 15 MB)</span>
          </label>
          <input
            id="own-image"
            name="image"
            type="file"
            accept="image/png, image/jpeg, image/webp"
            disabled={removePhoto}
            className="portal-field file:mr-3 file:rounded-lg file:border-0 file:bg-[#2F4858] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[#DDFBEF]"
          />
        </div>

        <SubmitButton
          pendingText="Saving your profile…"
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#2F4858] px-5 text-sm font-semibold text-[#DDFBEF] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#243B49] disabled:cursor-wait disabled:opacity-70 dark:bg-[#ddfbef] dark:text-[#2f4858] dark:hover:bg-white"
        >
          <FilePenLine aria-hidden="true" size={17} /> Save profile changes
        </SubmitButton>
      </StudentProfileForm>

      <form action={logoutStudent} className="mt-4 border-t border-[#2F4858]/10 pt-4 dark:border-white/10">
        <SubmitButton
          pendingText="Signing out…"
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#2F4858]/15 px-5 text-sm font-semibold text-[#2F4858] transition hover:bg-[#DDFBEF]/60 disabled:cursor-wait disabled:opacity-70 dark:border-white/15 dark:text-[#e5f0ea] dark:hover:bg-white/10"
        >
          <LogOut aria-hidden="true" size={16} /> Sign out
        </SubmitButton>
      </form>
    </div>
  );
}
