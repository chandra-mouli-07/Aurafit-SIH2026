import React, { useState, useEffect } from 'react';
import { auth, db } from './lib/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  serverTimestamp 
} from 'firebase/firestore';
import AIPoster from './AICamera';

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');

  // Workout Form States
  const [exercise, setExercise] = useState('');
  const [duration, setDuration] = useState('');
  const [workouts, setWorkouts] = useState([]);

  // Navigation State for AI Camera
  const [showCamera, setShowCamera] = useState(false);

  // Track Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchWorkouts(currentUser.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch Workouts from Firestore
  const fetchWorkouts = async (uid) => {
    try {
      const q = query(collection(db, "workouts"), where("userId", "==", uid));
      const querySnapshot = await getDocs(q);
      const workoutList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setWorkouts(workoutList);
    } catch (err) {
      console.error("Error fetching workouts: ", err);
    }
  };

  // Auth Functions
  const handleSignUp = async (e) => {
    e.preventDefault();
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setError('');
      alert('Signup Successful!');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setError('');
      alert('Login Successful!');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = async () => {
    signOut(auth);
    setUser(null);
    setWorkouts([]);
    setShowCamera(false);
  };

  const handleAddWorkout = async (e) => {
    e.preventDefault();
    if (!exercise || !duration) return;

    try {
      await addDoc(collection(db, "workouts"), {
        userId: user.uid,
        exercise,
        duration,
        createdAt: serverTimestamp()
      });
      setExercise('');
      setDuration('');
      fetchWorkouts(user.uid);
      alert('Workout Saved to Firestore! 🚀');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ padding: '30px', fontFamily: 'Arial', background: '#0b0f19', color: '#fff', minHeight: '100vh' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', background: '#111827', padding: '30px', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', border: '1px solid #1f2937' }}>
        
        {/* Header Title */}
        <h1 style={{ textAlign: 'center', color: '#10b981', fontSize: '28px', fontWeight: '800', marginBottom: '20px', letterSpacing: '1px' }}>AURAFIT DASHBOARD</h1>

        {error && <p style={{ color: '#f87171', background: '#7f1d1d', padding: '10px', borderRadius: '5px', fontSize: '14px', marginBottom: '15px' }}>{error}</p>}

        {user ? (
          <div>
            {showCamera ? (
              <AIPoster onBack={() => setShowCamera(false)} user={user}/>
            ) : (
              <div>
                {/* Top Bar with User & Logout */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', background: '#1f2937', padding: '12px 20px', borderRadius: '8px' }}>
                  <p style={{ color: '#34d399', margin: 0, fontWeight: '600' }}>👤 Welcome back, {user.email}</p>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      onClick={() => setShowCamera(true)}
                      style={{ padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      AI Pose Arena 📷
                    </button>
                    <button 
                      onClick={handleLogout}
                      style={{ padding: '8px 16px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      Logout
                    </button>
                  </div>
                </div>

                {/* Dashboard Stat Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px', marginBottom: '30px' }}>
                  <div style={{ background: '#1f2937', padding: '20px', borderRadius: '10px', border: '1px solid #374151' }}>
                    <p style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 'bold', margin: '0 0 5px 0' }}>Daily Steps</p>
                    <h3 style={{ fontSize: '22px', fontWeight: '900', margin: '0 0 5px 0', color: '#fff' }}>7,420 / 10,000</h3>
                    <p style={{ fontSize: '12px', color: '#34d399', margin: 0 }}>74% of goal completed</p>
                  </div>

                  <div style={{ background: '#1f2937', padding: '20px', borderRadius: '10px', border: '1px solid #374151' }}>
                    <p style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 'bold', margin: '0 0 5px 0' }}>Water Intake</p>
                    <h3 style={{ fontSize: '22px', fontWeight: '900', margin: '0 0 5px 0', color: '#fff' }}>2.4L / 3.5L</h3>
                    <p style={{ fontSize: '12px', color: '#60a5fa', margin: 0 }}>1.1L remaining today</p>
                  </div>

                  <div style={{ background: '#1f2937', padding: '20px', borderRadius: '10px', border: '1px solid #374151' }}>
                    <p style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 'bold', margin: '0 0 5px 0' }}>Sleep Track</p>
                    <h3 style={{ fontSize: '22px', fontWeight: '900', margin: '0 0 5px 0', color: '#fff' }}>7.2h / 8.0h</h3>
                    <p style={{ fontSize: '12px', color: '#c084fc', margin: 0 }}>90% sleep efficiency</p>
                  </div>
                </div>

                <hr style={{ borderColor: '#374151', marginBottom: '25px' }} />

                {/* Workout Logger Section */}
                <h3 style={{ color: '#38bdf8', marginBottom: '15px', fontSize: '18px' }}>Log a New Workout</h3>
                <form onSubmit={handleAddWorkout} style={{ marginBottom: '30px' }}>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <input 
                      type="text" 
                      value={exercise} 
                      onChange={(e) => setExercise(e.target.value)}
                      placeholder="Exercise Name (e.g., Pushups)"
                      style={{ flex: 2, padding: '12px', borderRadius: '6px', border: '1px solid #374151', background: '#0b0f19', color: '#fff', boxSizing: 'border-box' }}
                    />
                    <input 
                      type="text" 
                      value={duration} 
                      onChange={(e) => setDuration(e.target.value)}
                      placeholder="Duration (e.g., 30 mins)"
                      style={{ flex: 2, padding: '12px', borderRadius: '6px', border: '1px solid #374151', background: '#0b0f19', color: '#fff', boxSizing: 'border-box' }}
                    />
                    <button 
                      type="submit"
                      style={{ flex: 1, padding: '12px', background: '#10b981', color: '#000', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      Save Workout
                    </button>
                  </div>
                </form>

                {/* Saved Workouts List */}
                <h3 style={{ color: '#38bdf8', marginBottom: '15px', fontSize: '18px' }}>Your Saved Workouts</h3>
                {workouts.length === 0 ? (
                  <p style={{ color: '#9ca3af', fontSize: '14px' }}>No workouts logged yet. Add one above!</p>
                ) : (
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {workouts.map((w) => (
                      <li key={w.id} style={{ background: '#0b0f19', padding: '12px 15px', borderRadius: '6px', marginBottom: '10px', border: '1px solid #374151', display: 'flex', justifyContent: 'space-between' }}>
                        <strong style={{ color: '#fff' }}>{w.exercise}</strong> 
                        <span style={{ color: '#38bdf8', fontWeight: '600' }}>{w.duration}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Login / Signup Form */
          <form style={{ maxWidth: '400px', margin: '0 auto' }}>
            <h3 style={{ textAlign: 'center', marginBottom: '20px', color: '#9ca3af', fontSize: '16px' }}>Sign in to access your fitness hub</h3>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#9ca3af' }}>Email:</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #374151', background: '#0b0f19', color: '#fff', boxSizing: 'border-box' }}
                placeholder="Enter your email"
              />
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#9ca3af' }}>Password:</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #374151', background: '#0b0f19', color: '#fff', boxSizing: 'border-box' }}
                placeholder="Enter password"
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={handleSignUp}
                style={{ flex: 1, padding: '12px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Sign Up
              </button>
              <button 
                onClick={handleLogin}
                style={{ flex: 1, padding: '12px', background: '#10b981', color: '#000', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default App;