"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { auth, isFirebaseConfigured } from "@/lib/firebase";

type FirebaseAuthContextValue = {
  user: User | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const FirebaseAuthContext = createContext<FirebaseAuthContextValue | null>(null);

export function FirebaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(isFirebaseConfigured);
  const [error, setError] = useState<string | null>(null);
  const sessionSync = useRef<Promise<void>>(Promise.resolve());
  const authChangeId = useRef(0);

  const establishServerSession = useCallback((firebaseUser: User | null) => {
    const pending = sessionSync.current.catch(() => undefined).then(async () => {
      const response = firebaseUser
        ? await fetch("/api/auth/session", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ idToken: await firebaseUser.getIdToken() }),
            credentials: "same-origin",
          })
        : await fetch("/api/auth/session", { method: "DELETE", credentials: "same-origin" });
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(result?.error ?? "Could not synchronize your sign-in session.");
      }
    });
    sessionSync.current = pending;
    return pending;
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) return;

    let active = true;
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!active) return;
      const currentChangeId = ++authChangeId.current;
      setUser(firebaseUser);
      setError(null);
      try {
        await establishServerSession(firebaseUser);
      } catch (sessionError) {
        if (active && currentChangeId === authChangeId.current) {
          setError(
            sessionError instanceof Error
              ? sessionError.message
              : "Could not synchronize your sign-in session.",
          );
        }
      } finally {
        if (active && currentChangeId === authChangeId.current) setLoading(false);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [establishServerSession]);

  const signInWithGoogle = useCallback(async () => {
    if (!auth || !isFirebaseConfigured) {
      throw new Error("Firebase is not configured for this deployment.");
    }
    setError(null);
    const result = await signInWithPopup(auth, new GoogleAuthProvider());
    await establishServerSession(result.user);
  }, [establishServerSession]);

  const signOut = useCallback(async () => {
    if (!auth) return;
    setError(null);
    await firebaseSignOut(auth);
    await establishServerSession(null);
  }, [establishServerSession]);

  const value = useMemo(
    () => ({ user, loading, error, signInWithGoogle, signOut }),
    [user, loading, error, signInWithGoogle, signOut],
  );

  return <FirebaseAuthContext.Provider value={value}>{children}</FirebaseAuthContext.Provider>;
}

export function useFirebaseAuth() {
  const context = useContext(FirebaseAuthContext);
  if (!context) throw new Error("useFirebaseAuth must be used within FirebaseAuthProvider.");
  return context;
}
