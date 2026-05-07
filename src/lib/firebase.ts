import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, signOut, getRedirectResult, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, orderBy, onSnapshot, Timestamp, getDocFromServer } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAnalytics, logEvent, isSupported } from 'firebase/analytics';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Analytics Initialization
export let analytics: any = null;
isSupported().then(supported => {
  if (supported) {
    analytics = getAnalytics(app);
    console.log("[Firebase] Analytics initialized");
  }
});

export const logAnalyticsEvent = (eventName: string, eventParams?: any) => {
  if (analytics) {
    logEvent(analytics, eventName, eventParams);
  } else {
    // If analytics is not yet initialized or supported, we can queue it or log to console in dev
    console.debug(`[Analytics-Debug] ${eventName}`, eventParams);
  }
};

// Enable Auth persistence
setPersistence(auth, browserLocalPersistence).catch(err => console.error("Persistence failed:", err));

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testConnection() {
  try {
    // Attempt to fetch a non-existent document from a 'system' collection to test latency/auth
    await getDocFromServer(doc(db, '_connection_test_', 'ping'));
    console.log("[Firebase] Connection test: OK");
    return true;
  } catch (error: any) {
    console.warn("[Firebase] Connection test warning:", error.message);
    if (error.message.includes("offline")) {
      console.error("Please check your internet connection.");
    }
    return false;
  }
}

export const signIn = async () => {
  // Use popup for desktop, redirect for mobile
  const isMobile = /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // Also check if we are in an iframe (AI Studio environment)
  const isIframe = window.self !== window.top;

  try {
    if (isMobile || isIframe) {
      console.log("[Auth] Starting Redirect Sign-In...");
      return await signInWithRedirect(auth, googleProvider);
    }
    console.log("[Auth] Starting Popup Sign-In...");
    return await signInWithPopup(auth, googleProvider);
  } catch (error: any) {
    console.error("[Auth] Sign-In Error:", error);
    if (error.code === 'auth/popup-blocked') {
      alert("Popup blocked! Please allow popups or use 'Open in new tab'.");
    } else if (error.code === 'auth/internal-error' && error.message.includes('cross-origin')) {
      alert("Authentication blocked by iframe constraints. Please click 'Open in new tab' to manage your site.");
    } else if (error.code === 'auth/unauthorized-domain') {
      console.error("[Auth] Domain NOT authorized. Please add it to Firebase Console.");
    }
    throw error;
  }
};

export const logOut = () => signOut(auth);
export { getRedirectResult };
