import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isFirebaseConfigured } from '../auth/firebaseConfig';

const USER_KEY = 'cric:user';

export type AuthMethod = 'phone' | 'google' | 'email';

export interface AppUser {
  uid: string;
  method: AuthMethod;
  displayName?: string;
  phone?: string;
  email?: string;
  photoURL?: string;
}

interface AuthContextValue {
  user: AppUser | null;
  initializing: boolean;
  busy: boolean;
  pendingPhone: string | null;
  usingMock: boolean;
  sendOtp: (phone: string) => Promise<void>;
  verifyOtp: (code: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string, name?: string) => Promise<void>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// The mock OTP that always works in development mode.
const MOCK_OTP = '123456';

function randomUid(): string {
  return 'u_' + Math.random().toString(36).slice(2, 12);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [busy, setBusy] = useState(false);
  const [pendingPhone, setPendingPhone] = useState<string | null>(null);

  const usingMock = !isFirebaseConfigured;

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(USER_KEY);
        if (raw && active) setUser(JSON.parse(raw) as AppUser);
      } catch {
        /* ignore */
      } finally {
        if (active) setInitializing(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const persist = async (u: AppUser | null) => {
    setUser(u);
    try {
      if (u) await AsyncStorage.setItem(USER_KEY, JSON.stringify(u));
      else await AsyncStorage.removeItem(USER_KEY);
    } catch {
      /* ignore */
    }
  };

  const sendOtp = async (phone: string) => {
    setBusy(true);
    try {
      if (usingMock) {
        // Simulate SMS latency.
        await new Promise((r) => setTimeout(r, 600));
        setPendingPhone(phone);
        return;
      }
      // === REAL FIREBASE PHONE AUTH GOES HERE ===
      // With @react-native-firebase/auth:
      //   const confirmation = await auth().signInWithPhoneNumber(phone);
      //   store `confirmation` to confirm the code later.
      setPendingPhone(phone);
    } finally {
      setBusy(false);
    }
  };

  const verifyOtp = async (code: string) => {
    setBusy(true);
    try {
      if (usingMock) {
        await new Promise((r) => setTimeout(r, 500));
        if (code.trim() !== MOCK_OTP) {
          throw new Error(`Invalid code. In demo mode use ${MOCK_OTP}.`);
        }
        await persist({
          uid: randomUid(),
          method: 'phone',
          phone: pendingPhone ?? undefined,
          displayName: 'Player',
        });
        setPendingPhone(null);
        return;
      }
      // === REAL FIREBASE: await confirmation.confirm(code) ===
      await persist({ uid: randomUid(), method: 'phone', phone: pendingPhone ?? undefined });
      setPendingPhone(null);
    } finally {
      setBusy(false);
    }
  };

  const signInWithGoogle = async () => {
    setBusy(true);
    try {
      if (usingMock) {
        await new Promise((r) => setTimeout(r, 700));
        await persist({
          uid: randomUid(),
          method: 'google',
          displayName: 'Google User',
          email: 'player@gmail.com',
        });
        return;
      }
      // === REAL GOOGLE SIGN-IN GOES HERE (see src/auth/googleAuth.ts) ===
      await persist({ uid: randomUid(), method: 'google', displayName: 'Google User' });
    } finally {
      setBusy(false);
    }
  };

  const signInWithEmail = async (email: string, _password: string, name?: string) => {
    setBusy(true);
    try {
      if (usingMock) {
        await new Promise((r) => setTimeout(r, 500));
        await persist({
          uid: randomUid(),
          method: 'email',
          email,
          displayName: name || email.split('@')[0],
        });
        return;
      }
      // === REAL FIREBASE EMAIL AUTH GOES HERE ===
      await persist({ uid: randomUid(), method: 'email', email, displayName: name });
    } finally {
      setBusy(false);
    }
  };

  const signOutUser = async () => {
    await persist(null);
    setPendingPhone(null);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      initializing,
      busy,
      pendingPhone,
      usingMock,
      sendOtp,
      verifyOtp,
      signInWithGoogle,
      signInWithEmail,
      signOutUser,
    }),
    [user, initializing, busy, pendingPhone, usingMock],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
