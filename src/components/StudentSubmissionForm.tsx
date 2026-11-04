import { Check, UserRoundPlus } from "lucide-react";
import { submitStudentProfile } from "../app/admin/actions";
import { BANGLADESH_DISTRICTS } from "../lib/districts";
import { BLOOD_GROUPS } from "../lib/student";
import ContactNumberFields from "./ContactNumberFields";
import StudentProfileForm from "./StudentProfileForm";

export default function StudentSubmissionForm({
  email,
  wasRejected = false,
}: {
  email: string;
  wasRejected?: boolean;
}) {
  return (
    <div>
      {wasRejected && (
        <div role="status" className="mb-5 rounded-xl border border-[#E2B7A9] bg-[#FFF3EF] px-4 py-3 text-sm leading-6 text-[#733F36]">
          Your previous submission wasn’t approved. Check your details and submit an updated profile for review.
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-lg font-semibold text-[#2F4858]">Your student details</h2>
        <p className="mt-1 text-sm leading-6 text-[#2F4858]/70">
          Complete the same profile details shown in the directory. Your verified Google email is attached to your submission, and your section is assigned from your roll number.
        </p>
      </div>

      <StudentProfileForm action={submitStudentProfile} className="space-y-5">
        <div>
          <label className="portal-label !text-[#2F4858]" htmlFor="submission-full-name">Full name <span className="text-[#527A64">*</span></label>
          <input id="submission-full-name" name="full_name" required minLength={2} maxLength={120} autoComplete="name" placeholder="Enter your full name" className="portal-field" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="portal-label !text-[#2F4858]" htmlFor="submission-roll">Roll number</label>
            <input id="submission-roll" name="roll" type="text" inputMode="numeric" pattern="[0-9]{7}" maxLength={7} required placeholder="Enter your 7-digit roll" className="portal-field" />
          </div>
          <div>
            <span className="portal-label !text-[#2F4858]">Section</span>
            <p className="portal-field bg-[#DDFBEF]/40">Automatically assigned from your roll</p>
          </div>
          <div>
            <label className="portal-label !text-[#2F4858]" htmlFor="submission-email">Verified email</label>
            <input id="submission-email" type="email" value={email} readOnly className="portal-field cursor-not-allowed" />
            <p className="mt-1.5 text-xs text-[#2F4858]/55">This verified address is attached to your account.</p>
          </div>
          <div>
            <label className="portal-label !text-[#2F4858]" htmlFor="submission-nickname">Nickname <span className="font-normal text-[#2F4858]/55">(optional)</span></label>
            <input id="submission-nickname" name="nickname" maxLength={40} placeholder="What classmates call you" className="portal-field" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="portal-label !text-[#2F4858]" htmlFor="submission-district">District <span className="text-[#527A64">*</span></label>
            <select id="submission-district" name="address" required defaultValue="" className="portal-field">
              <option value="" disabled>Select your district</option>
              {BANGLADESH_DISTRICTS.map((district) => <option key={district} value={district}>{district}</option>)}
            </select>
          </div>
          <div>
            <label className="portal-label !text-[#2F4858]" htmlFor="submission-blood-group">Blood group <span className="font-normal text-[#2F4858]/55">(optional)</span></label>
            <select id="submission-blood-group" name="blood_group" defaultValue="" className="portal-field">
              <option value="">Prefer not to share</option>
              {BLOOD_GROUPS.map((group) => <option key={group} value={group}>{group}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-[#2F4858]/10 bg-[#2F4858] p-4">
          <ContactNumberFields />
        </div>

        <div>
          <label className="portal-label !text-[#2F4858]" htmlFor="submission-facebook">Facebook profile <span className="font-normal text-[#2F4858]/55">(optional)</span></label>
          <input id="submission-facebook" name="facebook_url" type="url" maxLength={500} placeholder="https://facebook.com/…" className="portal-field" />
        </div>

        <div>
          <label className="portal-label !text-[#2F4858]" htmlFor="submission-image">Profile photo <span className="font-normal text-[#2F4858]/55">(optional · PNG, JPEG, or WebP · max 15 MB)</span></label>
          <input id="submission-image" name="image" type="file" accept="image/png, image/jpeg, image/webp" className="portal-field file:mr-3 file:rounded-lg file:border-0 file:bg-[#2F4858] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[#DDFBEF]" />
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#2F4858]/10 bg-[#DDFBEF]/45 p-4 text-sm leading-6 text-[#2F4858]">
          <input type="checkbox" name="public_consent" required className="mt-1 h-4 w-4 shrink-0 accent-[#2F4858]" />
          <span>
            I agree that my name, verified email, roll, section, district, phone and WhatsApp numbers, and any nickname, blood group, Facebook link, or photo I provide can be shown publicly after an admin approves my profile.
          </span>
        </label>

        <button type="submit" className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#2F4858] px-5 text-sm font-semibold text-[#DDFBEF] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#243B49] disabled:cursor-wait disabled:opacity-70">
          <UserRoundPlus aria-hidden="true" size={17} /> Submit for review
        </button>
        <p className="flex items-start gap-2 text-xs leading-5 text-[#2F4858]/60">
          <Check aria-hidden="true" className="mt-0.5 shrink-0 text-[#527A64]" size={14} />
          All submitted details stay private until an admin approves your profile.
        </p>
      </StudentProfileForm>
    </div>
  );
}
