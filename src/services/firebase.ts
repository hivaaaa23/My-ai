import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeFirestore,
  getFirestore,
  Firestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  setLogLevel,
} from 'firebase/firestore';
import { getAuth, onAuthStateChanged, Auth, User } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Reduce verbose connection retry warnings in console
try {
  setLogLevel('error');
} catch {
  // Ignore
}

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Configure local cache with resilient multi-tab persistence
let localCacheSetting;
try {
  if (typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined') {
    localCacheSetting = persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    });
  }
} catch (cacheErr) {
  console.warn('Persistent cache initialization notice:', cacheErr);
}

// Initialize Firestore with auto-detect long polling for firewall/iframe network resilience
let firestoreInstance: Firestore;
try {
  const settings = {
    experimentalAutoDetectLongPolling: true,
    ignoreUndefinedProperties: true,
    ...(localCacheSetting ? { localCache: localCacheSetting } : {}),
  };

  if (firebaseConfig.firestoreDatabaseId) {
    firestoreInstance = initializeFirestore(app, settings, firebaseConfig.firestoreDatabaseId);
  } else {
    firestoreInstance = initializeFirestore(app, settings);
  }
} catch (err) {
  console.warn('Using existing or default firestore instance:', err);
  firestoreInstance = firebaseConfig.firestoreDatabaseId
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
    : getFirestore(app);
}

export const db: Firestore = firestoreInstance;
export const auth: Auth = getAuth(app);

// Safe, instantaneous user session management (Local-First + Cloud Synced)
let cachedUserId: string | null = null;

function getStoredOrNewUid(): string {
  try {
    let localUid = localStorage.getItem('studymate_firestore_uid');
    if (!localUid) {
      localUid = `student_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('studymate_firestore_uid', localUid);
    }
    return localUid;
  } catch {
    return 'student_anonymous_user';
  }
}

// Pre-warm the ID immediately so there is never an async delay
cachedUserId = getStoredOrNewUid();

export async function getStudentUserId(): Promise<string> {
  if (auth.currentUser) {
    cachedUserId = auth.currentUser.uid;
    return cachedUserId;
  }
  if (cachedUserId) {
    return cachedUserId;
  }
  cachedUserId = getStoredOrNewUid();
  return cachedUserId;
}

// Track auth changes seamlessly
onAuthStateChanged(auth, (user: User | null) => {
  if (user) {
    cachedUserId = user.uid;
    try {
      localStorage.setItem('studymate_firestore_uid', user.uid);
    } catch {
      // Ignore
    }
  }
});
