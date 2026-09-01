import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
const firebaseConfig = {
  apiKey: "AIzaSyADeStIGn92CD11zHwoDKaS_gUWAuAj6bo",
  authDomain: "aurafit-7a15f.firebaseapp.com",
  projectId: "aurafit-7a15f",
  storageBucket: "aurafit-7a15f.firebasestorage.app",
  messagingSenderId: "234846462868",
  appId: "1:234846462868:web:b8837f9b104dcf8c6a2581"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };