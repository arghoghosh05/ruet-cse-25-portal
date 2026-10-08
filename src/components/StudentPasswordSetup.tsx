import { KeyRound } from "lucide-react";
import { completeStudentAccount } from "../app/submit-profile/actions";
import SubmitButton from "./SubmitButton";

export default function StudentPasswordSetup({ roll }: { roll: string }) {
  return (
    <div className="rounded-2xl border border-[#2F4858]/10 bg-white p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#DDFBEF] text-[#2F4858]">
          <KeyRound aria-hidden="true" size={19} />
        </div>
        <div>
          <h2 className="font-semibold text-[#2F4858]">Set your password</h2>
          <p className="mt-1 text-sm leading-6 text-[#2F4858]/70">
            Email verified. Choose a password to use with roll {roll} when you log in.
          </p>
        </div>
      </div>

      <form action={completeStudentAccount} className="mt-5 space-y-4">
        <input type="hidden" name="roll" value={roll} />
        <div>
          <label htmlFor="new-password" className="portal-label !text-[#2F4858]">Create password</label>
          <input
            id="new-password"
            name="password"
            type="password"
            minLength={8}
            maxLength={72}
            required
            autoComplete="new-password"
            placeholder="At least 8 characters"
            className="portal-field"
          />
        </div>
        <div>
          <label htmlFor="confirm-password" className="portal-label !text-[#2F4858]">Confirm password</label>
          <input
            id="confirm-password"
            name="confirm_password"
            type="password"
            minLength={8}
            maxLength={72}
            required
            autoComplete="new-password"
            placeholder="Enter the same password again"
            className="portal-field"
          />
        </div>
        <SubmitButton
          pendingText="Securing your account…"
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#2F4858] px-5 text-sm font-semibold text-[#DDFBEF] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#243B49] disabled:cursor-wait disabled:opacity-70"
        >
          Set password
        </SubmitButton>
      </form>
      <p className="mt-5 border-t border-[#2F4858]/[0.08] pt-4 text-xs leading-5 text-[#2F4858]/60">
        After setting your password, you can log in immediately with your roll number. Profile details you submit are reviewed separately before they appear in the directory.
      </p>
    </div>
  );
}
