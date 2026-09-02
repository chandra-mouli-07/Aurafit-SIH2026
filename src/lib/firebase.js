import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  doc, 
  updateDoc, 
  increment, 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot 
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Vite-compatible environmental configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

/**
 * Safely increments a user's totalPoints in Firestore by 10 XP on a successful squat rep.
 * Uses atomic transaction increments to prevent race conditions and write loops.
 */
export async function addSquatPoints(userId) {
  if (!userId) return;
  const userRef = doc(db, "users", userId);
  try {
    await updateDoc(userRef, {
      totalPoints: increment(10) // Awards 10 XP atomically
    });
    console.log("🏆 Firestore: Successfully awarded +10 XP!");
  } catch (error) {
    console.error("❌ Firestore points update failed:", error);
  }
}

/**
 * Real-time listener for the department-wise leaderboard.
 * Fetches users sorted by points, groups/aggregates them by department, and triggers callback.
 */
export function subscribeToDepartmentLeaderboard(onUpdate) {
  const usersRef = collection(db, "users");
  const q = query(usersRef, orderBy("totalPoints", "desc"), limit(50));

  return onSnapshot(q, (snapshot) => {
    const departmentTotals = { CSE: 0, ECE: 0, Others: 0 };
    
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const dept = (data.department || "Others").toUpperCase();
      const points = data.totalPoints || 0;
      
      if (dept === "CSE") {
        departmentTotals.CSE += points;
      } else if (dept === "ECE") {
        departmentTotals.ECE += points;
      } else {
        departmentTotals.Others += points;
      }
    });

    const formattedData = [
      { name: "CSE", points: departmentTotals.CSE },
      { name: "ECE", points: departmentTotals.ECE },
      { name: "Others", points: departmentTotals.Others }
    ];
    
    onUpdate(formattedData);
  }, (error) => {
    console.error("❌ Leaderboard snapshot listener failed:", error);
  });
}

export { db, auth };
