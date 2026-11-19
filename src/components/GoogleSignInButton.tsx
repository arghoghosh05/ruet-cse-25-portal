"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase/client";
import { LoaderCircle } from "lucide-react";

function GoogleIcon() {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

export default function GoogleSignInButton({
  label = "Continue with Google",
  redirectTo,
  onSuccess,
  className = "",
}: {
  label?: string;
  redirectTo?: string;
  onSuccess?: (user: { uid: string; email: string | null; displayName: string | null }) => void;
  className?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGoogleSignIn() {
    setLoading(true);
    setError(null);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const idToken = await user.getIdToken();

      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to establish server session");
      }

      if (onSuccess) {
        onSuccess({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
        });
      }

      if (redirectTo) {
        router.push(redirectTo);
        router.refresh();
      } else {
        router.refresh();
      }
    } catch (err: unknown) {
      console.error("Google sign-in error:", err);
      const message =
        err instanceof Error
          ? err.message.includes("auth/popup-closed-by-user")
            ? "Sign-in cancelled. Please try again."
            : err.message
          : "Sign-in failed. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={loading}
        className={`inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border border-[#2F4858]/20 bg-white px-4 py-3 text-sm font-semibold text-[#2F4858] shadow-sm transition hover:bg-[#F4FBF6] hover:border-[#2F4858]/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#527A64] disabled:cursor-wait disabled:opacity-70 dark:border-white/15 dark:bg-[#1e3039] dark:text-[#e5f0ea] dark:hover:bg-[#263b45] ${className}`}
      >
        {loading ? (
          <LoaderCircle aria-hidden="true" className="animate-spin text-[#2F4858] dark:text-[#e5f0ea]" size={20} />
        ) : (
          <GoogleIcon />
        )}
        <span>{loading ? "Signing in with Google…" : label}</span>
      </button>

      {error && (
        <p role="alert" className="mt-2 text-center text-xs text-[#934C43] dark:text-[#ffc8bd]">
          {error}
        </p>
      )}
    </div>
  );
}
