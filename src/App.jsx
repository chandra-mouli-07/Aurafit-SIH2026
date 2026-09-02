import React, { useState, useEffect, useRef } from "react";
import { auth, addSquatPoints, subscribeToDepartmentLeaderboard } from "./lib/firebase";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { 
  Flame, Trophy, Droplets, Bed, Activity, User, MessageCircle, MapPin, 
  Camera, CheckCircle2, AlertTriangle, LogOut, LogIn 
} from "lucide-react";

// Mock 50-student database schema representation for Spandana's Buddy Matching
const mockBuddies = [
  { id: 1, name: "Aadi Sharma", dept: "CSE", goal: "Muscle Gain", active: "Gym", time: "Morning" },
  { id: 2, name: "Khushboo Agarwal", dept: "ECE", goal: "Weight Loss", active: "Running", time: "Evening" },
  { id: 3, name: "Sai Bharadwaj", dept: "CSE", goal: "Cardio", active: "Yoga", time: "Morning" },
  { id: 4, name: "Lalam Kalpana", dept: "CSE", goal: "Weight Loss", active: "Gym", time: "Evening" },
  { id: 5, name: "Veda Laxmi", dept: "ECE", goal: "Muscle Gain", active: "Running", time: "Morning" },
  { id: 6, name: "Kovvuri Naveena", dept: "CSE", goal: "Cardio", active: "Yoga", time: "Evening" },
  { id: 7, name: "Spandana Kasireddi", dept: "ECE", goal: "Weight Loss", active: "Gym", time: "Morning" }
];

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  // Track habit states (lost on reload unless connected to Firestore logs)
  const [steps, setSteps] = useState(7420);
  const [water, setWater] = useState(2.4);
  const [sleep, setSleep] = useState(7.2);

  // Live Firestore standings state
  const [leaderboard, setLeaderboard] = useState([
    { name: "CSE", points: 0 },
    { name: "ECE", points: 0 },
    { name: "Others", points: 0 }
  ]);

  // Auth observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Connect live department leaderboard subscription on login
        const unsubscribeLeaderboard = subscribeToDepartmentLeaderboard((data) => {
          setLeaderboard(data);
        });
        return () => unsubscribeLeaderboard();
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setAuthError("Invalid credentials. Please verify your email and password.");
    }
  };

  const handleLogout = () => {
    signOut(auth);
    setActiveTab("dashboard");
  };

  // Auth gate layout
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-6">
        <div className="bg-gray-900 border border-gray-800 p-8 rounded-2xl max-w-md w-full shadow-2xl">
          <h1 className="text-3xl font-black text-green-400 text-center tracking-wider mb-2">AURAFIT</h1>
          <p className="text-gray-400 text-xs text-center mb-6 uppercase tracking-widest">Campus Fitness Arena</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs uppercase text-gray-500 font-bold">Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@college.edu"
                className="w-full bg-gray-950 border border-gray-800 px-4 py-3 rounded-xl mt-1 text-sm focus:border-green-400 outline-none"
                required
              />
            </div>
            <div>
              <label className="text-xs uppercase text-gray-500 font-bold">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-gray-950 border border-gray-800 px-4 py-3 rounded-xl mt-1 text-sm focus:border-green-400 outline-none"
                required
              />
            </div>
            {authError && (
              <p className="text-red-400 text-xs flex items-center gap-1"><AlertTriangle size={14} /> {authError}</p>
            )}
            <button type="submit" className="w-full bg-green-400 hover:bg-green-500 text-black py-3 rounded-xl font-bold transition flex items-center justify-center gap-2">
              <LogIn size={18} /> Sign In to Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col md:flex-row">
      {/* 1. COLLAPSIBLE SIDE NAVIGATION */}
      <aside className="w-full md:w-64 bg-gray-900 p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-gray-800">
        <div>
          <h1 className="text-2xl font-black text-green-400 tracking-wider mb-8">AURAFIT</h1>
          <nav className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-x-visible pb-4 md:pb-0">
            <button 
              onClick={() => setActiveTab("dashboard")} 
              className={`flex items-center gap-3 py-2 px-4 rounded-xl text-sm font-semibold transition whitespace-nowrap ${activeTab === "dashboard" ? "bg-gray-800 text-green-400 border border-gray-750" : "text-gray-400 hover:text-white"}`}
            >
              <Activity size={18} /> Dashboard
            </button>
            <button 
              onClick={() => setActiveTab("pose")} 
              className={`flex items-center gap-3 py-2 px-4 rounded-xl text-sm font-semibold transition whitespace-nowrap ${activeTab === "pose" ? "bg-gray-800 text-green-400 border border-gray-750" : "text-gray-400 hover:text-white"}`}
            >
              <Camera size={18} /> AI Pose Arena
            </button>
            <button 
              onClick={() => setActiveTab("buddies")} 
              className={`flex items-center gap-3 py-2 px-4 rounded-xl text-sm font-semibold transition whitespace-nowrap ${activeTab === "buddies" ? "bg-gray-800 text-green-400 border border-gray-750" : "text-gray-400 hover:text-white"}`}
            >
              <User size={18} /> Buddy Finder
            </button>
          </nav>
        </div>
        <div className="hidden md:block">
          <p className="text-xs text-gray-500 mb-2 truncate">{user.email}</p>
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 font-semibold transition">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* MAIN LAYOUT CANVAS */}
      <main className="flex-1 p-8 overflow-y-auto">
        
        {/* TAB 1: USER DASHBOARD MODULE */}
        {activeTab === "dashboard" && (
          <div className="space-y-8 animate-fadeIn">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-3xl font-extrabold">Welcome back, Champ!</h2>
                <p className="text-gray-400 text-sm mt-1">Let's crush today's fitness goals on campus.</p>
              </div>
              <div className="bg-gray-900 border border-gray-800 px-5 py-3 rounded-2xl flex items-center gap-3">
                <Trophy className="text-yellow-400" />
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest">Global Rank XP</p>
                  <p className="font-bold text-lg">2,450 XP</p>
                </div>
              </div>
            </header>

            {/* Daily Metric Grid */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Daily Steps</p>
                  <h3 className="text-2xl font-black mt-2">{steps} / 10,000</h3>
                  <button onClick={() => setSteps(prev => prev + 500)} className="text-xs text-green-400 mt-2 hover:underline">Add 500 Steps</button>
                </div>
                <Flame className="text-orange-500 h-10 w-10" />
              </div>

              <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Water Intake</p>
                  <h3 className="text-2xl font-black mt-2">{water.toFixed(1)}L / 3.5L</h3>
                  <button onClick={() => setWater(prev => prev + 0.25)} className="text-xs text-blue-400 mt-2 hover:underline">Add 250ml Glass</button>
                </div>
                <Droplets className="text-blue-500 h-10 w-10" />
              </div>

              <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Sleep Logs</p>
                  <h3 className="text-2xl font-black mt-2">{sleep}h / 8.0h</h3>
                  <button onClick={() => setSleep(prev => Math.min(8.0, prev + 0.5))} className="text-xs text-purple-400 mt-2 hover:underline">Log Sleep Hour</button>
                </div>
                <Bed className="text-purple-500 h-10 w-10" />
              </div>
            </section>

            {/* Live Standings Analytics Chart */}
            <section className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h4 className="text-lg font-bold">CSE vs ECE Department Challenge Standings</h4>
                  <p className="text-xs text-gray-400">Updates live as other students complete squads!</p>
                </div>
                <span className="bg-green-450 text-black font-bold text-[10px] px-2 py-1 rounded-md uppercase tracking-wider">Live Sync</span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={leaderboard}>
                    <XAxis dataKey="name" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip contentStyle={{ backgroundColor: "#111827", border: "1px solid #1f2937", borderRadius: "10px" }} />
                    <Bar dataKey="points" fill="#10b981" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>
        )}

        {/* TAB 2: AI WEB-OPPOSED SKELETAL POSTURE ARENA */}
        {activeTab === "pose" && (
          <div className="space-y-6 animate-fadeIn">
            <header>
              <h2 className="text-3xl font-extrabold">AI Posture Corrector</h2>
              <p className="text-gray-400 text-sm mt-1">Stand 6 feet back to align your body skeleton joints.</p>
            </header>
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Webcam Simulated Component Container */}
              <div className="flex-1 bg-gray-900 border border-gray-800 p-6 rounded-2xl flex flex-col items-center">
                <div className="relative border-4 border-gray-800 rounded-xl overflow-hidden bg-black w-full max-w-lg aspect-video flex items-center justify-center">
                  <div className="absolute text-center p-4">
                    <Camera className="mx-auto text-gray-600 mb-2 h-12 w-12 animate-pulse" />
                    <p className="text-sm font-bold text-gray-400">Loading Local Pose Estimation WASM Models...</p>
                    <p className="text-[10px] text-gray-600 mt-1">@tensorflow-models/pose-detection v2.0</p>
                  </div>
                  {/* Dynamic green dots simulated overlays */}
                  <div className="absolute inset-0 bg-green-500/5 flex flex-col justify-between p-4 border border-green-500/20">
                    <span className="text-[10px] uppercase font-bold text-green-400 tracking-wider">WebAssembly Engine Loaded</span>
                  </div>
                </div>

                {/* Simulated Trigger to Verify Veda Laxmi's Firestore Hook */}
                <div className="mt-6 flex flex-col sm:flex-row gap-4 w-full justify-around items-center bg-gray-950 p-4 rounded-xl border border-gray-850">
                  <div className="text-center">
                    <p className="text-xs text-gray-500 uppercase font-bold">Completed Reps</p>
                    <h3 className="text-3xl font-black text-yellow-400 mt-1">Squat Counter</h3>
                  </div>
                  <button 
                    onClick={() => addSquatPoints(user.uid)}
                    className="bg-green-400 hover:bg-green-500 text-black px-5 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2"
                  >
                    <CheckCircle2 size={16} /> Complete Squat Rep (+10 XP)
                  </button>
                </div>
              </div>

              {/* Side Angle Guideline Matrix */}
              <div className="w-full lg:w-80 bg-gray-900 border border-gray-800 p-6 rounded-2xl h-fit">
                <h3 className="font-bold text-md mb-4">Biomechanics Angle Metrics</h3>
                <div className="space-y-4">
                  <div className="bg-gray-950 p-3 rounded-lg border border-gray-850 flex justify-between items-center">
                    <p className="text-xs text-gray-400">Flexion Threshold</p>
                    <span className="text-xs font-bold text-green-400">&lt; 90° for Squats</span>
                  </div>
                  <div className="bg-gray-950 p-3 rounded-lg border border-gray-850 flex justify-between items-center">
                    <p className="text-xs text-gray-400">State Transition Lock</p>
                    <span className="text-xs font-bold text-yellow-400">"DOWN" to "UP" logic</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SPANDANA'S TARGETED BUDDY MATCHING GRAPH */}
        {activeTab === "buddies" && (
          <div className="space-y-6 animate-fadeIn">
            <header>
              <h2 className="text-3xl font-extrabold">Workout Buddy Finder</h2>
              <p className="text-gray-400 text-sm mt-1">Connect with active peer students in your college blocks.</p>
            </header>
            
            <BuddyFinderComponent />
          </div>
        )}
      </main>
    </div>
  );
}

// Spandana's modular BuddyFinder design component
function BuddyFinderComponent() {
  const [selectedSport, setSelectedSport] = useState("All");
  const [selectedDept, setSelectedDept] = useState("All");

  const filteredBuddies = mockBuddies.filter(buddy => {
    const sportMatch = selectedSport === "All" || buddy.active === selectedSport;
    const deptMatch = selectedDept === "All" || buddy.dept === selectedDept;
    return sportMatch && deptMatch;
  });

  return (
    <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold">Interactive Match Finder</h3>
          <p className="text-xs text-gray-400">Filter students dynamically by department or preferred workouts.</p>
        </div>
        <div className="flex items-center gap-2 text-green-400 bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-xl">
          <MapPin size={16} />
          <span className="text-xs font-bold font-mono">NEHU Block 3</span>
        </div>
      </div>

      {/* State Selection Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Preferred Activity</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {["All", "Gym", "Running", "Yoga"].map((sport) => (
              <button
                key={sport}
                onClick={() => setSelectedSport(sport)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition ${selectedSport === sport ? "bg-green-400 text-black border-green-400" : "bg-transparent text-gray-400 border-gray-800 hover:text-white"}`}
              >
                {sport}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">College Department</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {["All", "CSE", "ECE"].map((dept) => (
              <button
                key={dept}
                onClick={() => setSelectedDept(dept)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition ${selectedDept === dept ? "bg-green-400 text-black border-green-400" : "bg-transparent text-gray-400 border-gray-800 hover:text-white"}`}
              >
                {dept}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Target Grid matching card outputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBuddies.map((buddy) => (
          <div key={buddy.id} className="bg-gray-950 border border-gray-850 p-4 rounded-2xl flex flex-col justify-between transition hover:border-gray-700">
            <div>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-gray-900 rounded-lg">
                    <User size={18} className="text-gray-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">{buddy.name}</h4>
                    <p className="text-[10px] text-gray-500 font-bold uppercase">{buddy.dept} Department</p>
                  </div>
                </div>
                <span className="bg-gray-900 text-green-400 border border-green-500/10 font-mono text-[9px] px-2 py-1 rounded-md font-bold uppercase tracking-wider">{buddy.active}</span>
              </div>
              <div className="mt-4 flex gap-4 text-xs text-gray-400">
                <div>
                  <p className="text-[9px] uppercase text-gray-500 font-bold tracking-wider">Goal</p>
                  <p className="font-semibold text-white mt-0.5">{buddy.goal}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase text-gray-500 font-bold tracking-wider">Schedule</p>
                  <p className="font-semibold text-white mt-0.5">{buddy.time}</p>
                </div>
              </div>
            </div>
            <button className="w-full mt-4 bg-gray-900 hover:bg-gray-850 text-green-400 border border-green-500/10 hover:border-green-500/35 font-bold text-xs py-2 rounded-xl transition flex items-center justify-center gap-1.5">
              <MessageCircle size={14} /> Send Match Request
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
