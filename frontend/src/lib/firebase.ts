import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check for missing config to prevent crashes
const isConfigValid = !!firebaseConfig.apiKey && firebaseConfig.apiKey !== 'your_api_key';

// Initialize Firebase
let app;
let auth: any;
let db: any;
let googleProvider: any;

if (typeof window !== 'undefined' && isConfigValid) {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);
  googleProvider = new GoogleAuthProvider();
} else {
  if (typeof window !== 'undefined' && !isConfigValid) {
    console.warn("Firebase configuration is missing or invalid. Please check your .env.local file.");
  }
  // Mock objects to prevent property access errors on undefined
  app = {} as any;
  auth = {} as any;
  db = {} as any;
  googleProvider = {} as any;
}

export { app, auth, db, googleProvider };

