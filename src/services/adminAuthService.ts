import {
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import { auth, googleProvider, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface AdminSession {
  email: string;
  uid: string;
  role: 'admin';
  name: string;
  photoUrl?: string;
  loginTime: number;
}

const SESSION_KEY = 'lotus_admin_auth_session';

// Whitelisted admin email addresses
const AUTHORIZED_ADMIN_EMAILS = [
  'lavesh1918@gmail.com',
  'admin@lotuswebstudio.com',
];

export async function loginAdminWithGoogle(): Promise<AdminSession> {
  // 1. Firebase Google Authentication via popup
  const result = await signInWithPopup(auth, googleProvider);
  const user: User = result.user;
  const email = (user.email || '').toLowerCase().trim();

  if (!email) {
    await signOut(auth);
    throw new Error('Unable to retrieve email from Google Account.');
  }

  // 2. Check if user is an authorized admin
  let isAuthorized = AUTHORIZED_ADMIN_EMAILS.includes(email);

  if (!isAuthorized) {
    // Check Firestore /admins/{uid} or /admins/{email} for explicit role: 'admin'
    try {
      const adminDocSnap = await getDoc(doc(db, 'admins', user.uid));
      if (adminDocSnap.exists() && adminDocSnap.data().role === 'admin') {
        isAuthorized = true;
      } else {
        const adminEmailSnap = await getDoc(doc(db, 'admins', email.replace(/[^a-zA-Z0-9_-]/g, '_')));
        if (adminEmailSnap.exists() && adminEmailSnap.data().role === 'admin') {
          isAuthorized = true;
        }
      }
    } catch (checkErr) {
      console.warn('Admin authorization check note:', checkErr);
    }
  }

  // 3. If NOT authorized, immediately sign out and deny access
  if (!isAuthorized) {
    await signOut(auth);
    sessionStorage.removeItem(SESSION_KEY);
    throw new Error('You are not authorized to access the Admin Panel.');
  }

  // 4. Authorized admin setup
  const session: AdminSession = {
    email,
    uid: user.uid,
    role: 'admin',
    name: user.displayName || 'Administrator',
    photoUrl: user.photoURL || undefined,
    loginTime: Date.now(),
  };

  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));

  // Update admin record in Firestore
  try {
    await setDoc(doc(db, 'admins', user.uid), {
      email,
      role: 'admin',
      name: user.displayName || 'Administrator',
      lastLogin: new Date().toISOString(),
    }, { merge: true });
  } catch (logErr) {
    console.warn('Admin log record note:', logErr);
  }

  return session;
}

export function getAdminSession(): AdminSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as AdminSession;
    if (session && session.role === 'admin') {
      return session;
    }
    return null;
  } catch {
    return null;
  }
}

export async function logoutAdmin(): Promise<void> {
  sessionStorage.removeItem(SESSION_KEY);
  try {
    await signOut(auth);
  } catch (err) {
    console.warn('Sign out note:', err);
  }
}
