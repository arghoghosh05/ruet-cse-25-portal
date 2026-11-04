"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useFirebaseAuth } from "./FirebaseAuthProvider";

export default function FirebaseSignOutButton({ className }: { className: string }) {
  const router = useRouter();
  const { signOut } = useFirebaseAuth();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignOut() {
    setPending(true);
    setError(null);
    try {
      await signOut();
      router.refresh();
    } catch (signOutError) {
      setError(signOutError instanceof Error ? signOutError.message : "Sign-out failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <button type="button" onClick={handleSignOut} disabled={pending} className={className}>
        <LogOut aria-hidden="true" size={16} /> {pending ? "Signing out…" : "Sign out"}
      </button>
      {error && <p role="alert" className="mt-2 text-xs text-[#934C43]">{error}</p>}
    </div>
  );
}
