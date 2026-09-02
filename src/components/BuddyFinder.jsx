import React, { useState } from 'react';
import { User, MessageCircle, MapPin, Search } from 'lucide-react';

const mockBuddies = [
  { id: 1, name: 'Lalam Sai Bharadwaj', dept: 'CSE', goal: 'Muscle Gain', sport: 'Gym', time: '5:00 PM' },
  { id: 2, name: 'Kandregula Veda Laxmi', dept: 'ECE', goal: 'Cardio Endurance', sport: 'Running', time: '6:00 AM' },
  { id: 3, name: 'Kasireddi Spandana', dept: 'CSE', goal: 'General Fitness', sport: 'Yoga', time: '6:30 PM' },
  { id: 4, name: 'Kovvuri Naveena', dept: 'EEE', goal: 'Weight Loss', sport: 'Badminton', time: '5:30 PM' },
  { id: 5, name: 'Lalam Chandramouli', dept: 'CSE', goal: 'Muscle Gain', sport: 'Gym', time: '5:00 PM' }
];

export default function BuddyFinder() {
  const [selectedGoal, setSelectedGoal] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Dual filtering: filter by goal category and search box (by name or department)
  const filteredBuddies = mockBuddies.filter((buddy) => {
    const matchesGoal = selectedGoal === 'All' || buddy.goal === selectedGoal;
    const matchesSearch = 
      buddy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      buddy.dept.toLowerCase().includes(searchQuery.toLowerCase()) ||
      buddy.sport.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGoal && matchesSearch;
  });

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-md w-full text-white shadow-2xl">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-sky-400">Find a Workout Buddy</h3>
        <MapPin className="text-emerald-400 h-5 w-5" />
      </div>

      {/* Search Bar Input */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-2.5 text-slate-500 h-4 w-4" />
        <input 
          type="text"
          placeholder="Search by name, department, or sport..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-300 placeholder-slate-500 focus:outline-none focus:border-sky-500"
        />
      </div>

      {/* Goal Horizontal Filter Category Tags */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-800">
        {['All', 'Weight Loss', 'Muscle Gain', 'Cardio Endurance', 'General Fitness'].map((goal) => (
          <button
            key={goal}
            onClick={() => setSelectedGoal(goal)}
            className={`px-3 py-1.5 text-[10px] whitespace-nowrap rounded-full font-bold border transition duration-200 ${
              selectedGoal === goal 
                ? 'bg-sky-500 text-black border-sky-500' 
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            {goal}
          </button>
        ))}
      </div>

      {/* Dynamic Results Card Lists */}
      <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
        {filteredBuddies.length > 0 ? (
          filteredBuddies.map((buddy) => (
            <div key={buddy.id} className="flex items-center justify-between p-3.5 bg-slate-950 border border-slate-850 rounded-xl hover:border-slate-700 transition">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-900 border border-slate-800 rounded-full text-sky-400 font-extrabold text-xs">
                  {buddy.dept}
                </div>
                <div>
                  <p className="font-bold text-xs text-white">{buddy.name}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{buddy.sport} • {buddy.time} • <span className="text-emerald-400">{buddy.goal}</span></p>
                </div>
              </div>
              <button 
                onClick={() => alert(`Connecting with ${buddy.name}! Let's workout together!`)}
                className="flex items-center gap-1 text-[10px] font-black text-black bg-emerald-400 py-1.5 px-3 rounded-lg hover:bg-emerald-300 transition"
              >
                Connect
              </button>
            </div>
          ))
        ) : (
          <p className="text-center text-slate-500 text-xs py-4">No campus partners match your search criteria.</p>
        )}
      </div>
    </div>
  );
}