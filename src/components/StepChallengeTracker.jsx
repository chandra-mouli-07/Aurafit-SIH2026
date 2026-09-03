import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, onSnapshot, setDoc, increment } from 'firebase/firestore';
import { Trophy, Flame, Zap } from 'lucide-react';

export default function StepChallengeTracker() {
  const [challenge, setChallenge] = useState({
    cseSteps: 48250,
    eceSteps: 45900,
  });
  const [loading, setLoading] = useState(true);

  // Real-time Firestore sync
  useEffect(() => {
    const docRef = doc(db, 'challenges', 'weekly_battle');

    const unsubscribe = onSnapshot(docRef, async (docSnap) => {
      if (docSnap.exists()) {
        setChallenge(docSnap.data());
      } else {
        // Initialize document if it doesn't exist yet
        await setDoc(docRef, { cseSteps: 48250, eceSteps: 45900 });
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching live challenge data: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Function to add steps using setDoc with merge: true (handles creation & update)
  const handleAddSteps = async (team, amount) => {
    const docRef = doc(db, 'challenges', 'weekly_battle');
    try {
      if (team === 'CSE') {
        await setDoc(docRef, { cseSteps: increment(amount) }, { merge: true });
      } else {
        await setDoc(docRef, { eceSteps: increment(amount) }, { merge: true });
      }
    } catch (error) {
      console.error("Error updating steps: ", error);
    }
  };

  const totalSteps = (challenge.cseSteps || 0) + (challenge.eceSteps || 0);
  const csePercent = totalSteps > 0 ? Math.round((challenge.cseSteps / totalSteps) * 100) : 50;
  const ecePercent = 100 - csePercent;

  return (
    <div className="max-w-3xl mx-auto p-6 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 shadow-xl text-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-400">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-wide">Campus Step Challenge</h2>
            <p className="text-xs text-slate-400">CSE vs ECE Weekly Battle</p>
          </div>
        </div>
        <div className="flex items-center space-x-1.5 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full text-red-400 text-xs font-medium animate-pulse">
          <Flame className="w-3.5 h-3.5" />
          <span>Live Sync</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* CSE Card */}
        <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700/50 flex flex-col justify-between">
          <div>
            <div className="text-xs font-semibold text-blue-400 tracking-wider">CSE {challenge.cseSteps > challenge.eceSteps && '👑 LEADING'}</div>
            <div className="text-3xl font-black mt-1 text-white">{loading ? '...' : challenge.cseSteps.toLocaleString()}</div>
            <div className="text-xs text-slate-400 mt-0.5">Total Steps</div>
          </div>
          <button 
            onClick={() => handleAddSteps('CSE', 500)}
            className="mt-4 py-2 px-3 bg-blue-600 hover:bg-blue-500 transition-colors text-xs font-bold rounded-lg shadow-lg flex items-center justify-center space-x-1 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>+500 Steps (CSE)</span>
          </button>
        </div>

        {/* ECE Card */}
        <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700/50 flex flex-col justify-between">
          <div>
            <div className="text-xs font-semibold text-emerald-400 tracking-wider">ECE {challenge.eceSteps > challenge.cseSteps && '👑 LEADING'}</div>
            <div className="text-3xl font-black mt-1 text-white">{loading ? '...' : challenge.eceSteps.toLocaleString()}</div>
            <div className="text-xs text-slate-400 mt-0.5">Total Steps</div>
          </div>
          <button 
            onClick={() => handleAddSteps('ECE', 500)}
            className="mt-4 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 transition-colors text-xs font-bold rounded-lg shadow-lg flex items-center justify-center space-x-1 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>+500 Steps (ECE)</span>
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs font-medium text-slate-300">
          <span className="text-blue-400">CSE ({csePercent}%)</span>
          <span className="text-emerald-400">ECE ({ecePercent}%)</span>
        </div>
        <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex p-0.5 border border-slate-700">
          <div 
            className="bg-blue-500 h-full rounded-l-full transition-all duration-500" 
            style={{ width: `${csePercent}%` }}
          ></div>
          <div 
            className="bg-emerald-500 h-full rounded-r-full transition-all duration-500" 
            style={{ width: `${ecePercent}%` }}
          ></div>
        </div>
      </div>

      <div className="mt-4 text-center text-xs text-slate-500 italic">
        ⚡ Active campus rivalry in progress! Steps sync instantly via Firebase Firestore.
      </div>
    </div>
  );
}