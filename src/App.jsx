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