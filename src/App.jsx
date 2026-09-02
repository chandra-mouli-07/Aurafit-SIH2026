import React, { useState, useEffect } from 'react';
import { auth, db } from './lib/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import AIPoster from './AICamera';

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');

  // Bug 12 fix: in-app toast replaces browser alert()
  const [toast, setToast] = useState(null);
  // Introduced-bug fix: keep a ref to the active toast timer so rapid calls
  // don't leave a stale timer that dismisses the latest toast too early.
  const toastTimerRef = React.useRef(null);

  // Workout Form States
  const [exercise, setExercise] = useState('');
  const [duration, setDuration] = useState('');
  const [workouts, setWorkouts] = useState([]);

  // Navigation State for AI Camera
  const [showCamera, setShowCamera] = useState(false);

  // Bug 5 fix: dashboard stats are editable state, not hardcoded values
  const [dailyStats, setDailyStats] = useState({ steps: '', water: '', sleep: '' });
  const [editingStats, setEditingStats] = useState(false);

  // Toast helper — auto-clears after 3 s; cancels any prior pending dismiss.
  const showToast = (msg, isError = false) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ msg, isError });
    toastTimerRef.current = setTimeout(() => setToast(null), 3000);
  };

  // Fetch Workouts from Firestore
  const fetchWorkouts = async (uid) => {
    try {
      const q = query(collection(db, 'workouts'), where('userId', '==', uid));
      const querySnapshot = await getDocs(q);
      const workoutList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setWorkouts(workoutList);
    } catch (err) {
      console.error('Error fetching workouts: ', err);
    }
  };

  // Track Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchWorkouts(currentUser.uid);
      } else {
        // Reset all user-specific state when signed out
        setWorkouts([]);
        setShowCamera(false);
        setDailyStats({ steps: '', water: '', sleep: '' });
      }
    });
    return () => unsubscribe();
  }, []);

  // Auth Functions
  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      // Bug 12 fix: toast instead of alert()
      showToast('Sign up successful! Welcome to AuraFit 🎉');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Bug 12 fix: toast instead of alert()
      showToast('Login successful! Welcome back 👋');
    } catch (err) {
      setError(err.message);
    }
  };

  // Bug 3 fix: await signOut() before resetting state; let onAuthStateChanged
  // handle setUser(null) to avoid race condition.
  const handleLogout = async () => {
    try {
      await signOut(auth);
      // onAuthStateChanged listener will fire with null and reset user state
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const handleAddWorkout = async (e) => {
    e.preventDefault();

    // Bug 7 fix: validate that exercise is non-empty and duration is a positive number
    if (!exercise.trim()) {
      setError('Please enter an exercise name.');
      return;
    }
    const durationNum = Number(duration);
    if (!duration || isNaN(durationNum) || durationNum <= 0) {
      setError('Duration must be a positive number (minutes).');
      return;
    }
    setError('');

    try {
      await addDoc(collection(db, 'workouts'), {
        userId: user.uid,
        exercise: exercise.trim(),
        duration: `${durationNum} min`,
        createdAt: serverTimestamp(),
      });
      setExercise('');
      setDuration('');
      await fetchWorkouts(user.uid);
      // Bug 12 fix: toast instead of alert()
      showToast('Workout logged successfully! 🚀');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleStatChange = (field, value) => {
    setDailyStats((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div style={{ padding: '30px', fontFamily: 'Arial', background: '#0b0f19', color: '#fff', minHeight: '100vh' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', background: '#111827', padding: '30px', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', border: '1px solid #1f2937' }}>

        {/* Header Title */}
        <h1 style={{ textAlign: 'center', color: '#10b981', fontSize: '28px', fontWeight: '800', marginBottom: '20px', letterSpacing: '1px' }}>
          AURAFIT DASHBOARD
        </h1>

        {/* Bug 12 fix: in-app toast notification */}
        {toast && (
          <p style={{
            color: toast.isError ? '#f87171' : '#34d399',
            background: toast.isError ? '#7f1d1d' : '#064e3b',
            padding: '10px', borderRadius: '5px', fontSize: '14px',
            marginBottom: '15px', textAlign: 'center',
          }}>
            {toast.msg}
          </p>
        )}

        {/* Error Message */}
        {error && (
          <p style={{ color: '#f87171', background: '#7f1d1d', padding: '10px', borderRadius: '5px', fontSize: '14px', marginBottom: '15px' }}>
            {error}
          </p>
        )}

        {user ? (
          <div>
            {showCamera ? (
              // Bug 6 fix: onBack now also re-fetches workouts so newly saved AI
              // workout appears in the list without requiring a page refresh.
              <AIPoster
                onBack={() => { setShowCamera(false); fetchWorkouts(user.uid); }}
                user={user}
                onWorkoutSaved={() => showToast('AI Workout saved to dashboard! 🔥')}
              />
            ) : (
              <div>
                {/* Top Bar with User & Logout */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', background: '#1f2937', padding: '12px 20px', borderRadius: '8px' }}>
                  <p style={{ color: '#34d399', margin: 0, fontWeight: '600' }}>👤 Welcome back, {user.email}</p>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {/* Bug 2/13 fix: explicit type="button" prevents accidental form submission */}
                    <button
                      type="button"
                      onClick={() => setShowCamera(true)}
                      style={{ padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      AI Pose Arena 📷
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      style={{ padding: '8px 16px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      Logout
                    </button>
                  </div>
                </div>

                {/* Bug 5 fix: Dashboard stats are now editable user state, not hardcoded */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setEditingStats((s) => !s)}
                    style={{ background: 'none', border: '1px solid #374151', color: '#9ca3af', borderRadius: '5px', padding: '4px 10px', cursor: 'pointer', fontSize: '12px' }}
                  >
                    {editingStats ? '✓ Done' : '✏️ Edit Stats'}
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px', marginBottom: '30px' }}>
                  {/* Steps Card */}
                  <div style={{ background: '#1f2937', padding: '20px', borderRadius: '10px', border: '1px solid #374151' }}>
                    <p style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 'bold', margin: '0 0 8px 0' }}>Daily Steps</p>
                    {editingStats ? (
                      <input
                        type="number" min="0" max="50000"
                        value={dailyStats.steps}
                        onChange={(e) => handleStatChange('steps', e.target.value)}
                        placeholder="Steps taken today"
                        style={{ width: '100%', background: '#0b0f19', color: '#fff', border: '1px solid #374151', borderRadius: '4px', padding: '8px', fontSize: '16px', boxSizing: 'border-box' }}
                      />
                    ) : (
                      <>
                        <h3 style={{ fontSize: '22px', fontWeight: '900', margin: '0 0 5px 0', color: '#fff' }}>
                          {dailyStats.steps ? Number(dailyStats.steps).toLocaleString() : '—'} / 10,000
                        </h3>
                        <p style={{ fontSize: '12px', color: '#34d399', margin: 0 }}>
                          {dailyStats.steps
                            ? `${Math.min(100, Math.round((Number(dailyStats.steps) / 10000) * 100))}% of goal`
                            : 'Tap "Edit Stats" to log'}
                        </p>
                      </>
                    )}
                  </div>

                  {/* Water Card */}
                  <div style={{ background: '#1f2937', padding: '20px', borderRadius: '10px', border: '1px solid #374151' }}>
                    <p style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 'bold', margin: '0 0 8px 0' }}>Water Intake (ml)</p>
                    {editingStats ? (
                      <input
                        type="number" min="0" max="10000"
                        value={dailyStats.water}
                        onChange={(e) => handleStatChange('water', e.target.value)}
                        placeholder="ml consumed today"
                        style={{ width: '100%', background: '#0b0f19', color: '#fff', border: '1px solid #374151', borderRadius: '4px', padding: '8px', fontSize: '16px', boxSizing: 'border-box' }}
                      />
                    ) : (
                      <>
                        <h3 style={{ fontSize: '22px', fontWeight: '900', margin: '0 0 5px 0', color: '#fff' }}>
                          {dailyStats.water ? `${dailyStats.water}ml` : '—'} / 3,500ml
                        </h3>
                        <p style={{ fontSize: '12px', color: '#60a5fa', margin: 0 }}>
                          {dailyStats.water
                            ? `${Math.max(0, 3500 - Number(dailyStats.water))}ml remaining`
                            : 'Tap "Edit Stats" to log'}
                        </p>
                      </>
                    )}
                  </div>

                  {/* Sleep Card */}
                  <div style={{ background: '#1f2937', padding: '20px', borderRadius: '10px', border: '1px solid #374151' }}>
                    <p style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 'bold', margin: '0 0 8px 0' }}>Sleep (hours)</p>
                    {editingStats ? (
                      <input
                        type="number" min="0" max="24" step="0.5"
                        value={dailyStats.sleep}
                        onChange={(e) => handleStatChange('sleep', e.target.value)}
                        placeholder="Hours slept"
                        style={{ width: '100%', background: '#0b0f19', color: '#fff', border: '1px solid #374151', borderRadius: '4px', padding: '8px', fontSize: '16px', boxSizing: 'border-box' }}
                      />
                    ) : (
                      <>
                        <h3 style={{ fontSize: '22px', fontWeight: '900', margin: '0 0 5px 0', color: '#fff' }}>
                          {dailyStats.sleep ? `${dailyStats.sleep}h` : '—'} / 8.0h
                        </h3>
                        <p style={{ fontSize: '12px', color: '#c084fc', margin: 0 }}>
                          {dailyStats.sleep
                            ? `${Math.min(100, Math.round((Number(dailyStats.sleep) / 8) * 100))}% sleep goal`
                            : 'Tap "Edit Stats" to log'}
                        </p>
                      </>
                    )}
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
                    {/* Bug 7 fix: type="number" enforces numeric input; min="1" blocks zero/negative */}
                    <input
                      type="number"
                      min="1"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      placeholder="Duration (minutes)"
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
                      <li
                        key={w.id}
                        style={{ background: '#0b0f19', padding: '12px 15px', borderRadius: '6px', marginBottom: '10px', border: '1px solid #374151', display: 'flex', justifyContent: 'space-between' }}
                      >
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
          /* Login / Signup — Bug 2/13 fix: buttons have explicit type="button" to prevent
             accidental form submission. Each handler calls e.preventDefault() itself. */
          <div style={{ maxWidth: '400px', margin: '0 auto' }}>
            <h3 style={{ textAlign: 'center', marginBottom: '20px', color: '#9ca3af', fontSize: '16px' }}>
              Sign in to access your fitness hub
            </h3>
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
                placeholder="Enter password (min 6 characters)"
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={handleSignUp}
                style={{ flex: 1, padding: '12px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Sign Up
              </button>
              <button
                type="button"
                onClick={handleLogin}
                style={{ flex: 1, padding: '12px', background: '#10b981', color: '#000', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Login
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;