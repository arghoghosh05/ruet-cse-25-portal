'use client';

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider, isFirebaseConfigured } from '@/lib/firebase';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isConfigured: boolean;
  emailNotifications: boolean;
  error: string | null;
  setEmailNotifications: (enabled: boolean) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  isAdmin: false,
  isConfigured: false,
  emailNotifications: false,
  error: null,
  setEmailNotifications: async () => {},
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(isFirebaseConfigured);
  const [isAdmin, setIsAdmin] = useState(false);
  const [emailNotifications, setEmailNotificationsState] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const authChangeId = useRef(0);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) return;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      const currentChangeId = ++authChangeId.current;
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const tokenResult = await firebaseUser.getIdTokenResult();
          const nextIsAdmin = tokenResult.claims['admin'] === true;
          let notificationsActive = false;
          if (!db) throw new Error('Firebase Firestore is not configured.');
          const userRef = doc(db, 'users', firebaseUser.uid);
          const userSnap = await getDoc(userRef);
          const savedPreference = userSnap.data()?.['emailNotifications'];
          if (typeof savedPreference === 'boolean') {
            notificationsActive = savedPreference;
          }
          await setDoc(
            userRef,
            {
              uid: firebaseUser.uid,
              email: firebaseUser.email ?? '',
              displayName: firebaseUser.displayName ?? '',
              photoURL: firebaseUser.photoURL,
              lastSignIn: serverTimestamp(),
              emailNotifications: notificationsActive,
            },
            { merge: true }
          );

          if (currentChangeId !== authChangeId.current) return;
          setIsAdmin(nextIsAdmin);
          setEmailNotificationsState(notificationsActive);
          setError(null);
        } catch (authError) {
          if (currentChangeId === authChangeId.current) {
            setIsAdmin(false);
            setEmailNotificationsState(false);
            setError(
              authError instanceof Error
                ? `Your account could not be synchronized: ${authError.message}`
                : 'Your account could not be synchronized.'
            );
          }
        }
      } else {
        setIsAdmin(false);
        setEmailNotificationsState(false);
        setError(null);
      }
      if (currentChangeId === authChangeId.current) setLoading(false);
    });

    return unsubscribe;
  }, []);

  async function setEmailNotifications(enabled: boolean) {
    if (!user || !db) {
      setError('Sign in before changing notification preferences.');
      return;
    }
    try {
      await setDoc(
        doc(db, 'users', user.uid),
        { emailNotifications: enabled },
        { merge: true }
      );
      setEmailNotificationsState(enabled);
      setError(null);
    } catch (preferenceError) {
      const message = preferenceError instanceof Error
        ? preferenceError.message
        : 'The notification preference could not be saved.';
      setError(message);
    }
  }

  async function signInWithGoogle() {
    if (!isFirebaseConfigured || !auth || !googleProvider) {
      setError('Firebase is not configured for this deployment. See the Firebase setup guide.');
      return;
    }
    try {
      setError(null);
      await signInWithPopup(auth, googleProvider);
    } catch (signInError) {
      setError(signInError instanceof Error ? signInError.message : 'Google sign-in failed.');
    }
  }

  async function signOut() {
    if (!isFirebaseConfigured || !auth) return;
    try {
      await firebaseSignOut(auth);
    } catch (signOutError) {
      setError(signOutError instanceof Error ? signOutError.message : 'Sign out failed.');
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin,
        isConfigured: isFirebaseConfigured,
        emailNotifications,
        error,
        setEmailNotifications,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
