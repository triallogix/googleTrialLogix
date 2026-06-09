import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ,
  authDomain: "unique-conquest-497512-m7.firebaseapp.com",
  projectId: "unique-conquest-497512-m7",
  storageBucket: "unique-conquest-497512-m7.firebasestorage.app",
  messagingSenderId: "283722598220",
  appId: "1:283722598220:web:b3227c68458778bc7271e9",
  firestoreDatabaseId: "ai-studio-14a5001f-5bba-48aa-a43c-50c8cdc7e6ce"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || "(default)");
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Google Sign-In Error:", error);
    throw error;
  }
};

export const loginWithEmail = async (email: string, password: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error) {
    console.error("Email Sign-In Error:", error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout Error:", error);
  }
};

