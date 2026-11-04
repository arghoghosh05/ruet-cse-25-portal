"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, LogOut, ShieldCheck } from "lucide-react";
import { useFirebaseAuth } from "./FirebaseAuthProvider";

export default function StudentEmailAccess({
  title = "Sign in to create your profile",
  description = "Use a verified Google account. Existing portal accounts need to sign in again and enroll with Firebase.",
  signedInDescription,
}: {
  title?: string;
  description?: string;
  signedInDescription?: string;
}) {
  const router = useRouter();
  const { user, loading, error: sessionError, signInWithGoogle, signOut } = useFirebaseAuth();
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSignIn() {
    setPending(true);
    setActionError(null);
    try {
      await signInWithGoogle();
      router.refresh();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Google sign-in failed.");
    } finally {
      setPending(false);
    }
  }

  async function handleSignOut() {
    setPending(true);
    setActionError(null);
    try {
      await signOut();
      router.refresh();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Sign-out failed.");
    } finally {
      setPending(false);
    }
  }

  if (loading) {
    return <p role="status" className="text-sm text-[#2F4858]/65">Checking your sign-in…</p>;
  }

  return (
    <div className="rounded-2xl border border-[#2F4858]/10 bg-white p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#DDFBEF] text-[#2F4858]">
          <ShieldCheck aria-hidden="true" size={19} />
        </div>
        <div>
          <h2 className="font-semibold text-[#2F4858]">
            {user ? "Google account connected" : title}
          </h2>
          <p className="mt-1 text-sm leading-6 text-[#2F4858]/70">
            {user
              ? signedInDescription ?? `Signed in as ${user.email ?? user.displayName ?? "Google user"}.`
              : description}
          </p>
        </div>
      </div>

      {(actionError || sessionError) && (
        <p role="alert" className="mt-4 rounded-lg border border-[#E2B7A9] bg-[#FFF3EF] px-3 py-2 text-sm leading-5 text-[#733F36]">
          {actionError ?? sessionError}
        </p>
      )}

      {user ? (
        <button
          type="button"
          disabled={pending}
          onClick={handleSignOut}
          className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#2F4858]/15 px-4 text-sm font-semibold text-[#2F4858] disabled:opacity-60"
        >
          <LogOut aria-hidden="true" size={16} /> {pending ? "Signing out…" : "Sign out"}
        </button>
      ) : (
        <button
          type="button"
          disabled={pending}
          onClick={handleSignIn}
          className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#2F4858] px-5 text-sm font-semibold text-[#DDFBEF] shadow-sm transition hover:bg-[#243B49] disabled:cursor-wait disabled:opacity-70"
        >
          <LogIn aria-hidden="true" size={17} /> {pending ? "Connecting to Google…" : "Continue with Google"}
        </button>
      )}
    </div>
  );
}
