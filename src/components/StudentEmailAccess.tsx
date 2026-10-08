"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, LoaderCircle, Mail, Send } from "lucide-react";
import { createClient } from "../../utils/supabase/client";
import { requestStudentLogin } from "../app/submit-profile/actions";
import SubmitButton from "./SubmitButton";

export default function StudentEmailAccess() {
  const router = useRouter();
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [error, setError] = useState("");
  const [needsSmtpSetup, setNeedsSmtpSetup] = useState(false);
  const [sending, setSending] = useState(false);
  const [pendingVerification, setPendingVerification] = useState<{ email: string; roll: string } | null>(null);

  async function requestAccountCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNeedsSmtpSetup(false);
    setSending(true);
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const roll = String(formData.get("roll") ?? "").trim();

    if (!/^\d{7}$/.test(roll) || Number(roll) < 2503001 || Number(roll) > 2503180) {
      setError("Enter your valid seven-digit CSE 25-series roll number.");
      setSending(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true },
      });

      if (authError) {
        const emailNotAuthorized = authError.message.toLowerCase().includes("email address not authorized");
        console.error("Student account verification email failed:", {
          code: authError.code,
          status: authError.status,
          message: authError.message,
        });
        setError(
          authError.status === 429
            ? "Too many email requests. Please wait a while before trying again."
            : emailNotAuthorized
              ? "Supabase’s default email sender only delivers to authorized project-team addresses. A custom SMTP sender is needed for student accounts."
              : "We couldn’t send the verification email. Please ask the portal admin to check Supabase email delivery settings, then try again.",
        );
        setNeedsSmtpSetup(emailNotAuthorized);
        return;
      }
      setPendingVerification({ email, roll });
    } catch (requestError) {
      console.error("Student account verification request failed:", requestError);
      setError("We couldn’t send the verification email. Please try again in a moment.");
    } finally {
      setSending(false);
    }
  }

  async function verifyAccountCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!pendingVerification) return;

    setError("");
    setSending(true);
    const formData = new FormData(event.currentTarget);
    const token = String(formData.get("token") ?? "").trim();

    if (!/^\d{6,8}$/.test(token)) {
      setError("Enter the 6–8 digit code from the confirmation email.");
      setSending(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: pendingVerification.email,
        token,
        type: "email",
      });

      if (verifyError) {
        console.error("Student account email verification failed:", {
          code: verifyError.code,
          status: verifyError.status,
          message: verifyError.message,
        });
        setError(
          verifyError.code === "otp_expired"
            ? "That code has expired. Go back and request a new confirmation email."
            : "That code could not be verified. Check the newest email and enter its code.",
        );
        return;
      }

      router.replace(`/submit-profile?setup=1&roll=${encodeURIComponent(pendingVerification.roll)}`);
    } catch (verifyError) {
      console.error("Student account email verification request failed:", verifyError);
      setError("We couldn’t verify that code. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex rounded-xl bg-[#DDFBEF]/60 p-1">
        <button
          type="button"
          onClick={() => {
            setIsCreatingAccount(false);
            setError("");
            setNeedsSmtpSetup(false);
            setPendingVerification(null);
          }}
          aria-pressed={!isCreatingAccount}
          className={`min-h-10 flex-1 rounded-lg px-3 text-sm font-semibold transition ${
            !isCreatingAccount ? "bg-[#2F4858] text-[#DDFBEF] shadow-sm" : "text-[#2F4858]/70 hover:text-[#2F4858]"
          }`}
        >
          Log in
        </button>
        <button
          type="button"
          onClick={() => {
            setIsCreatingAccount(true);
            setError("");
            setNeedsSmtpSetup(false);
            setPendingVerification(null);
          }}
          aria-pressed={isCreatingAccount}
          className={`min-h-10 flex-1 rounded-lg px-3 text-sm font-semibold transition ${
            isCreatingAccount ? "bg-[#2F4858] text-[#DDFBEF] shadow-sm" : "text-[#2F4858]/70 hover:text-[#2F4858]"
          }`}
        >
          Create your account
        </button>
      </div>

      {isCreatingAccount ? (
        <div className="rounded-2xl border border-[#2F4858]/10 bg-white p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#DDFBEF] text-[#2F4858]">
              <Mail aria-hidden="true" size={19} />
            </div>
            <div>
              <h2 className="font-semibold text-[#2F4858]">Create your student account</h2>
              <p className="mt-1 text-sm leading-6 text-[#2F4858]/70">
                Enter your roll and email. We’ll verify your email, then you’ll choose a password for future roll-number sign-ins.
              </p>
            </div>
          </div>

          {error && (
            <div role="alert" className="mt-4 rounded-lg border border-[#E2B7A9] bg-[#FFF3EF] px-3 py-2 text-sm leading-5 text-[#733F36]">
              <p>{error}</p>
              {needsSmtpSetup && (
                <a
                  href="https://supabase.com/docs/guides/auth/auth-smtp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block font-semibold underline underline-offset-2"
                >
                  Supabase SMTP setup guide
                </a>
              )}
            </div>
          )}
          {!pendingVerification ? (
            <form onSubmit={requestAccountCode} className="mt-5 space-y-4">
              <div>
                <label htmlFor="student-roll" className="portal-label !text-[#2F4858]">Roll number</label>
                <input
                  id="student-roll"
                  name="roll"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{7}"
                  maxLength={7}
                  required
                  placeholder="Enter your 7-digit roll number"
                  className="portal-field"
                />
              </div>
              <div>
                <label htmlFor="student-email" className="portal-label !text-[#2F4858]">Email address</label>
                <input
                  id="student-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={254}
                  placeholder="Enter your email address"
                  className="portal-field"
                />
              </div>
              <button
                type="submit"
                disabled={sending}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#2F4858] px-5 text-sm font-semibold text-[#DDFBEF] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#243B49] disabled:cursor-wait disabled:opacity-70"
              >
                {sending ? <LoaderCircle aria-hidden="true" className="animate-spin" size={17} /> : <Send aria-hidden="true" size={16} />}
                {sending ? "Sending confirmation code…" : "Email me a confirmation code"}
              </button>
            </form>
          ) : (
            <form onSubmit={verifyAccountCode} className="mt-5 space-y-4">
              <p role="status" className="rounded-lg border border-[#B8D9C5] bg-[#F0FBF4] px-3 py-2 text-sm leading-5 text-[#2F5E48]">
                We sent a confirmation code to {pendingVerification.email}. Enter it here to verify your email. Use the newest code; requesting another will invalidate the previous one.
              </p>
              {error && <p role="alert" className="rounded-lg border border-[#E2B7A9] bg-[#FFF3EF] px-3 py-2 text-sm leading-5 text-[#733F36]">{error}</p>}
              <div>
                <label htmlFor="student-email-code" className="portal-label !text-[#2F4858]">Email confirmation code</label>
                <input
                  id="student-email-code"
                  name="token"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6,8}"
                  maxLength={8}
                  autoComplete="one-time-code"
                  required
                  placeholder="Enter the code from your email"
                  className="portal-field"
                />
              </div>
              <button
                type="submit"
                disabled={sending}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#2F4858] px-5 text-sm font-semibold text-[#DDFBEF] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#243B49] disabled:cursor-wait disabled:opacity-70"
              >
                {sending ? <LoaderCircle aria-hidden="true" className="animate-spin" size={17} /> : <KeyRound aria-hidden="true" size={16} />}
                {sending ? "Verifying email…" : "Verify email"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setPendingVerification(null);
                  setError("");
                }}
                className="min-h-10 w-full rounded-lg text-sm font-semibold text-[#2F4858]/70 underline underline-offset-2 hover:text-[#2F4858]"
              >
                Use a different email or request a new code
              </button>
            </form>
          )}
          <p className="mt-5 border-t border-[#2F4858]/[0.08] pt-4 text-xs leading-5 text-[#2F4858]/60">
            Your email is verified with a one-time code. You set your own password on this site; we never email passwords.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-[#2F4858]/10 bg-white p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#DDFBEF] text-[#2F4858]">
              <KeyRound aria-hidden="true" size={19} />
            </div>
            <div>
              <h2 className="font-semibold text-[#2F4858]">Welcome back</h2>
              <p className="mt-1 text-sm leading-6 text-[#2F4858]/70">Log in with your roll number and password.</p>
            </div>
          </div>

          <form action={requestStudentLogin} className="mt-5 space-y-4">
            <div>
              <label htmlFor="login-roll" className="portal-label !text-[#2F4858]">Roll number</label>
              <input
                id="login-roll"
                name="roll"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{7}"
                maxLength={7}
                required
                autoComplete="username"
                placeholder="Enter your 7-digit roll number"
                className="portal-field"
              />
            </div>
            <div>
              <label htmlFor="login-password" className="portal-label !text-[#2F4858]">Password</label>
              <input
                id="login-password"
                name="password"
                type="password"
                minLength={8}
                required
                autoComplete="current-password"
                placeholder="Enter your password"
                className="portal-field"
              />
            </div>
            <SubmitButton
              pendingText="Signing in…"
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#2F4858] px-5 text-sm font-semibold text-[#DDFBEF] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#243B49] disabled:cursor-wait disabled:opacity-70"
            >
              <KeyRound aria-hidden="true" size={16} /> Log in
            </SubmitButton>
          </form>
          <p className="mt-5 border-t border-[#2F4858]/[0.08] pt-4 text-xs leading-5 text-[#2F4858]/60">
            New here? Choose <span className="font-semibold text-[#2F4858]">Create your account</span> above. Your email is only used to verify that you control it.
          </p>
        </div>
      )}
    </div>
  );
}
