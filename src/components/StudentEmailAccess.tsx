"use client";

import { useState } from "react";
import { KeyRound, UserPlus, Lock } from "lucide-react";
import GoogleSignInButton from "./GoogleSignInButton";
import SubmitButton from "./SubmitButton";
import { requestStudentLogin, completeStudentAccount } from "../app/submit-profile/actions";

export default function StudentEmailAccess({ initialRoll = "" }: { initialRoll?: string }) {
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");

  return (
    <div className="space-y-6">
      {/* 1-Click Google Sign In (Primary Action) */}
      <div className="rounded-2xl border border-[#2F4858]/10 bg-white p-5 shadow-sm sm:p-6 dark:bg-[#1b2d36] dark:border-white/10">
        <h2 className="text-center text-sm font-semibold text-[#2F4858] dark:text-[#e5f0ea]">
          Instant sign in with your Google account
        </h2>
        <p className="mt-1 text-center text-xs leading-5 text-[#2F4858]/65 dark:text-[#e5f0ea]/70">
          Fast and verified. Recommended for all CSE ’25 students.
        </p>

        <div className="mt-4">
          <GoogleSignInButton
            label="Continue with Google"
            redirectTo="/submit-profile"
          />
        </div>
      </div>

      <div className="relative flex items-center justify-center">
        <div className="w-full border-t border-[#2F4858]/15 dark:border-white/15" />
        <span className="absolute bg-[#F8FCF9] px-3 text-xs uppercase tracking-wider text-[#2F4858]/55 dark:bg-[#14232b] dark:text-[#e5f0ea]/55">
          or use roll & password
        </span>
      </div>

      {/* Mode Switcher */}
      <div className="flex rounded-xl bg-[#DDFBEF]/60 p-1 dark:bg-white/5">
        <button
          type="button"
          onClick={() => setActiveTab("login")}
          aria-pressed={activeTab === "login"}
          className={`min-h-10 flex-1 rounded-lg px-3 text-sm font-semibold transition ${
            activeTab === "login"
              ? "bg-[#2F4858] text-[#DDFBEF] shadow-sm dark:bg-[#ddfbef] dark:text-[#2f4858]"
              : "text-[#2F4858]/70 hover:text-[#2F4858] dark:text-[#e5f0ea]/70 dark:hover:text-[#e5f0ea]"
          }`}
        >
          Log in with Roll
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("signup")}
          aria-pressed={activeTab === "signup"}
          className={`min-h-10 flex-1 rounded-lg px-3 text-sm font-semibold transition ${
            activeTab === "signup"
              ? "bg-[#2F4858] text-[#DDFBEF] shadow-sm dark:bg-[#ddfbef] dark:text-[#2f4858]"
              : "text-[#2F4858]/70 hover:text-[#2F4858] dark:text-[#e5f0ea]/70 dark:hover:text-[#e5f0ea]"
          }`}
        >
          Register with Password
        </button>
      </div>

      {/* Tab: Log In with Roll & Password */}
      {activeTab === "login" ? (
        <div className="rounded-2xl border border-[#2F4858]/10 bg-white p-5 sm:p-6 dark:bg-[#1b2d36] dark:border-white/10">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#DDFBEF] text-[#2F4858]">
              <KeyRound aria-hidden="true" size={19} />
            </div>
            <div>
              <h3 className="font-semibold text-[#2F4858] dark:text-[#e5f0ea]">Welcome back</h3>
              <p className="mt-1 text-sm leading-6 text-[#2F4858]/70 dark:text-[#e5f0ea]/70">
                Log in with your seven-digit roll number and portal password.
              </p>
            </div>
          </div>

          <form action={requestStudentLogin} className="mt-5 space-y-4">
            <div>
              <label htmlFor="login-roll" className="portal-label !text-[#2F4858] dark:!text-[#e5f0ea]">Roll number</label>
              <input
                id="login-roll"
                name="roll"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{7}"
                maxLength={7}
                required
                defaultValue={initialRoll}
                autoComplete="username"
                placeholder="e.g. 2503042"
                className="portal-field"
              />
            </div>
            <div>
              <label htmlFor="login-password" className="portal-label !text-[#2F4858] dark:!text-[#e5f0ea]">Password</label>
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
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#2F4858] px-5 text-sm font-semibold text-[#DDFBEF] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#243B49] disabled:cursor-wait disabled:opacity-70 dark:bg-[#ddfbef] dark:text-[#2f4858] dark:hover:bg-white"
            >
              <KeyRound aria-hidden="true" size={16} /> Log in
            </SubmitButton>
          </form>
        </div>
      ) : (
        /* Tab: Register with Email & Password */
        <div className="rounded-2xl border border-[#2F4858]/10 bg-white p-5 sm:p-6 dark:bg-[#1b2d36] dark:border-white/10">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#DDFBEF] text-[#2F4858]">
              <UserPlus aria-hidden="true" size={19} />
            </div>
            <div>
              <h3 className="font-semibold text-[#2F4858] dark:text-[#e5f0ea]">Create student account</h3>
              <p className="mt-1 text-sm leading-6 text-[#2F4858]/70 dark:text-[#e5f0ea]/70">
                Register your roll number with your email and a password.
              </p>
            </div>
          </div>

          <form action={completeStudentAccount} className="mt-5 space-y-4">
            <div>
              <label htmlFor="reg-roll" className="portal-label !text-[#2F4858] dark:!text-[#e5f0ea]">Roll number</label>
              <input
                id="reg-roll"
                name="roll"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{7}"
                maxLength={7}
                required
                defaultValue={initialRoll}
                placeholder="e.g. 2503042"
                className="portal-field"
              />
            </div>
            <div>
              <label htmlFor="reg-email" className="portal-label !text-[#2F4858] dark:!text-[#e5f0ea]">Email address</label>
              <input
                id="reg-email"
                name="email"
                type="email"
                required
                maxLength={254}
                autoComplete="email"
                placeholder="your.email@example.com"
                className="portal-field"
              />
            </div>
            <div>
              <label htmlFor="reg-password" className="portal-label !text-[#2F4858] dark:!text-[#e5f0ea]">Password</label>
              <input
                id="reg-password"
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
              <label htmlFor="reg-confirm-password" className="portal-label !text-[#2F4858] dark:!text-[#e5f0ea]">Confirm password</label>
              <input
                id="reg-confirm-password"
                name="confirm_password"
                type="password"
                minLength={8}
                maxLength={72}
                required
                autoComplete="new-password"
                placeholder="Re-enter your password"
                className="portal-field"
              />
            </div>

            <SubmitButton
              pendingText="Creating account…"
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#2F4858] px-5 text-sm font-semibold text-[#DDFBEF] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#243B49] disabled:cursor-wait disabled:opacity-70 dark:bg-[#ddfbef] dark:text-[#2f4858] dark:hover:bg-white"
            >
              <Lock aria-hidden="true" size={16} /> Create account
            </SubmitButton>
          </form>
        </div>
      )}
    </div>
  );
}
