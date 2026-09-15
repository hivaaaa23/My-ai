import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged, Auth, User } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore
let firestoreInstance: Firestore;
try {
  if (firebaseConfig.firestoreDatabaseId) {
    firestoreInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId);
  } else {
    firestoreInstance = getFirestore(app);
  }
} catch (err) {
  console.warn('Using standard firestore instance:', err);
  firestoreInstance = getFirestore(app);
}

export const db: Firestore = firestoreInstance;
export const auth: Auth = getAuth(app);

// Safe user session management
let cachedUserId: string | null = null;

export async function getStudentUserId(): Promise<string> {
  if (cachedUserId) return cachedUserId;

  // Check existing auth state
  if (auth.currentUser) {
    cachedUserId = auth.currentUser.uid;
    return cachedUserId;
  }

  // Attempt anonymous sign-in or fallback to persistent device ID
  try {
    const cred = await signInAnonymously(auth);
    cachedUserId = cred.user.uid;
    localStorage.setItem('studymate_firestore_uid', cachedUserId);
    return cachedUserId;
  } catch (err) {
    console.warn('Using persistent device ID for Firestore storage:', err);
    let localUid = localStorage.getItem('studymate_firestore_uid');
    if (!localUid) {
      localUid = `student_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('studymate_firestore_uid', localUid);
    }
    cachedUserId = localUid;
    return cachedUserId;
  }
}

// Track auth changes
onAuthStateChanged(auth, (user: User | null) => {
  if (user) {
    cachedUserId = user.uid;
    localStorage.setItem('studymate_firestore_uid', user.uid);
  }
});
