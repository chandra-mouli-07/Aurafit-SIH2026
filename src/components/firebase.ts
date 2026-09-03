import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY", // Retrieve from Firebase Console > Project Settings
  authDomain: "aurafit-7a15f.firebaseapp.com",
  projectId: "aurafit-7a15f",
  storageBucket: "aurafit-7a15f.firebasestorage.app",
  messagingSenderId: "234846462868",
  appId: "YOUR_APP_ID" 
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

// Sign in the user
const userCredential = await signInWithEmailAndPassword(auth, email, password);
const user = userCredential.user;

// Save user's fitness profile under their unique UID
await setDoc(doc(db, "users", user.uid), {
  displayName: "AuraFit Athlete",
  dailyStepGoal: 10000,
  createdAt: new Date()
});
