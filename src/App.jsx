<<<<<<< HEAD
import React from 'react';
import BuddyFinder from './components/BuddyFinder';
import StepChallengeTracker from './components/StepChallengeTracker';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 font-sans">
      {/* App Header */}
<header className="max-w-5xl mx-auto mb-8 text-center">
  <h1 className="text-3xl font-black tracking-wider" style={{ color: '#ffffff' }}>
    AuraFit Campus Hub
  </h1>
  <p className="text-xs text-slate-400 mt-1">Smart Fitness & Community Engagement Platform</p>
</header>
      {/* Main Dashboard Grid */}
      <main className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 justify-items-center">
        {/* Component 1: Buddy Finder */}
        <BuddyFinder />

        {/* Component 2: Step Challenge Tracker */}
        <StepChallengeTracker />
      </main>
    </div>
  );
}
=======
import React, { useState, useEffect, useCallback } from 'react';
import { 
  auth, 
  db, 
  subscribeToDepartmentLeaderboard 
} from './lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, where, getDocs, doc, onSnapshot } from 'firebase/firestore';

import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import AICamera from './components/AICamera';
import DepartmentWars from './components/DepartmentWars';
import BuddyFinder from './components/BuddyFinder';
import AuthModal from './components/AuthModal';
import { ToastProvider } from './components/ToastContext';

const INITIAL_DEPARTMENTS = [
  { department: 'CSE', points: 340 },
  { department: 'ECE', points: 290 },
  { department: 'EEE', points: 190 },
  { department: 'MECH', points: 120 }
];

const DEMO_WORKOUTS = [
  { id: 'w1', exercise: 'AI Squats (20 reps)', duration: '3m 20s', pointsEarned: 200 },
  { id: 'w2', exercise: '5km Campus Track Run', duration: '24 mins', pointsEarned: 50 },
  { id: 'w3', exercise: 'Morning Core Yoga', duration: '15 mins', pointsEarned: 30 }
];

export default function App() {
  // Auth & User State
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // UI State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Realtime Data State
  const [deptLeaderboard, setDeptLeaderboard] = useState(INITIAL_DEPARTMENTS);
  const [topAthletes, setTopAthletes] = useState([]);
  const [workouts, setWorkouts] = useState(DEMO_WORKOUTS);

  /**
   * Fetch user's workouts from Firebase
   */
  const fetchUserWorkouts = useCallback(async (uid) => {
    if (!uid) return;
    try {
      const q = query(collection(db, 'workouts'), where('userId', '==', uid));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setWorkouts(list.reverse());
      }
    } catch (err) {
      console.warn('Failed to fetch workouts:', err);
      // Keep demo data as fallback
    }
  }, []);

  /**
   * Initialize auth state and listeners
   */
  useEffect(() => {
    let unsubProfile = null;
    let unsubLeaderboard = null;

    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      try {
        setUser(currentUser);
        setAuthError(null);

        if (currentUser) {
          // Fetch initial workouts
          fetchUserWorkouts(currentUser.uid);

          // Listen to user profile changes
          unsubProfile = onSnapshot(
            doc(db, 'users', currentUser.uid),
            (docSnap) => {
              if (docSnap.exists()) {
                setUserProfile(docSnap.data());
              } else {
                // Create default profile if doesn't exist
                const defaultProfile = {
                  email: currentUser.email || 'guest@campus.edu',
                  department: 'CSE',
                  totalPoints: 140,
                  displayName: currentUser.displayName || 
                               currentUser.email?.split('@')[0] || 
                               'Athlete',
                  squatCount: 0,
                  createdAt: new Date()
                };
                setUserProfile(defaultProfile);
              }
            },
            (err) => {
              console.warn('Profile listener error:', err);
              setAuthError('Failed to load profile');
            }
          );
        } else {
          setUserProfile(null);
          setWorkouts(DEMO_WORKOUTS);
        }
        setIsLoading(false);
      } catch (err) {
        console.error('Auth state change error:', err);
        setAuthError('Authentication failed');
        setIsLoading(false);
      }
    });

    // Subscribe to department leaderboard updates
    unsubLeaderboard = subscribeToDepartmentLeaderboard((data) => {
      if (data?.departments) {
        setDeptLeaderboard(data.departments);
        if (data.topAthletes) {
          setTopAthletes(data.topAthletes);
        }
      }
    });

    // Cleanup all subscriptions
    return () => {
      unsubAuth();
      if (unsubProfile) unsubProfile();
      if (unsubLeaderboard) unsubLeaderboard();
    };
  }, [fetchUserWorkouts]);

  /**
   * Handle user logout
   */
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
      setWorkouts(DEMO_WORKOUTS);
      setTopAthletes([]);
      setDeptLeaderboard(INITIAL_DEPARTMENTS);
      setActiveTab('dashboard');
      setAuthError(null);
    } catch (err) {
      console.error('Logout error:', err);
      setAuthError('Failed to logout');
    }
  };

  /**
   * Handle guest/demo session
   */
  const handleGuestSession = (demoData) => {
    setUser({ uid: demoData.uid, email: demoData.email, isGuest: true });
    setUserProfile(demoData);
    setShowAuthModal(false);
  };

  /**
   * Update local state when points are earned
   * Avoids waiting for Firebase sync for better UX
   */
  const handlePointsEarned = (pointsGained, repsGained) => {
    setUserProfile(prev => {
      if (!prev) return prev;

      const updatedProfile = {
        ...prev,
        totalPoints: (prev.totalPoints || 0) + pointsGained,
        squatCount: (prev.squatCount || 0) + repsGained
      };

      // Update department leaderboard with the updated profile
      setDeptLeaderboard(prevLeaderboard => {
        const userDept = updatedProfile.department || 'CSE';
        return prevLeaderboard
          .map(d =>
            d.department === userDept
              ? { ...d, points: d.points + pointsGained }
              : d
          )
          .sort((a, b) => b.points - a.points);
      });

      return updatedProfile;
    });
  };

  /**
   * Handle new workout logged
   */
  const handleWorkoutSaved = (newWorkout) => {
    setWorkouts(prev => [newWorkout, ...prev]);
  };

  // Show loading state while auth is initializing
  if (isLoading) {
    return (
      <ToastProvider>
        <div className="app-container loading-container">
          <div className="spinner">
            <p>Loading...</p>
          </div>
        </div>
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <div className="app-container">
        {/* Navbar Header */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          user={user}
          userProfile={userProfile}
          onLogout={handleLogout}
          onOpenAuth={() => setShowAuthModal(true)}
        />

        {/* Error Banner */}
        {authError && (
          <div className="error-banner">
            <p>{authError}</p>
            <button onClick={() => setAuthError(null)}>Dismiss</button>
          </div>
        )}

        {/* Main Tab Views */}
        <main>
          {activeTab === 'camera' ? (
            <AICamera
              onBack={() => setActiveTab('dashboard')}
              user={user}
              userProfile={userProfile}
              onPointsEarned={handlePointsEarned}
              onWorkoutSaved={handleWorkoutSaved}
              onOpenAuth={() => setShowAuthModal(true)}
            />
          ) : activeTab === 'leaderboard' ? (
            <DepartmentWars
              departments={deptLeaderboard}
              topAthletes={topAthletes}
              userProfile={userProfile}
              onLaunchArena={() => setActiveTab('camera')}
            />
          ) : activeTab === 'buddies' ? (
            <BuddyFinder user={user} />
          ) : (
            <Dashboard
              user={user}
              userProfile={userProfile}
              workouts={workouts}
              onRefreshWorkouts={() => user && fetchUserWorkouts(user.uid)}
              onLaunchArena={() => setActiveTab('camera')}
              onOpenLeaderboard={() => setActiveTab('leaderboard')}
              onOpenBuddies={() => setActiveTab('buddies')}
              onLocalWorkoutLogged={handleWorkoutSaved}
            />
          )}
        </main>

        {/* Auth Modal */}
        {showAuthModal && (
          <AuthModal
            onClose={() => setShowAuthModal(false)}
            onGuestLogin={handleGuestSession}
          />
        )}
      </div>
    </ToastProvider>
  );
}
>>>>>>> c988a3074fb234ae46e0636452e4223a70d8f5dd
