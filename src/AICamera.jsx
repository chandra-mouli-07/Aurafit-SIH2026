import React, { useEffect, useRef, useState } from 'react';
import { db } from './lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function AIPoster({ onBack, user }) {
  const videoRef = useRef(null);
  const [count, setCount] = useState(0);
  const [status, setStatus] = useState("Get Ready! Position Yourself.");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Start Webcam
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch((err) => {
        console.error("Webcam error: ", err);
        setStatus("Webcam access denied or unavailable.");
      });

    // Cleanup stream on unmount
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  // Save AI Workout to Firestore
  const handleSaveAIWorkout = async () => {
    if (count === 0) {
      alert("No reps recorded yet!");
      return;
    }
    setIsSaving(true);
    try {
      await addDoc(collection(db, "workouts"), {
        userId: user ? user.uid : "anonymous",
        exercise: `AI Squats (${count} reps)`,
        duration: `${count * 15} secs`,
        createdAt: serverTimestamp()
      });
      alert('AI Workout Saved to Dashboard Successfully! 🔥🚀');
      onBack();
    } catch (err) {
      console.error("Error saving AI workout: ", err);
      alert("Failed to save workout.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ padding: '20px', background: '#111827', borderRadius: '12px', color: '#fff', textAlign: 'center', border: '1px solid #1f2937' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button 
          onClick={onBack}
          style={{ padding: '8px 16px', background: '#374151', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', transition: '0.2s' }}
        >
          ← Back to Dashboard
        </button>
        <button 
          onClick={handleSaveAIWorkout}
          disabled={isSaving}
          style={{ padding: '8px 16px', background: '#10b981', color: '#000', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          {isSaving ? 'Saving...' : 'Finish & Save to DB 💾'}
        </button>
      </div>

      <h2 style={{ color: '#10b981', marginBottom: '10px', fontSize: '24px', fontWeight: '800' }}>AI Posture Corrector Arena</h2>
      <p style={{ color: '#9ca3af', marginBottom: '20px', fontSize: '14px' }}>Position yourself in front of the camera and start your squats!</p>

      <div style={{ position: 'relative', maxWidth: '640px', margin: '0 auto', background: '#000', borderRadius: '10px', overflow: 'hidden', border: '2px solid #10b981', boxShadow: '0 0 20px rgba(16, 185, 129, 0.2)' }}>
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          style={{ width: '100%', height: 'auto', display: 'block' }}
        />
        <div style={{ position: 'absolute', top: '15px', left: '15px', background: 'rgba(15, 23, 42, 0.85)', padding: '12px 18px', borderRadius: '8px', border: '1px solid #10b981', backdropFilter: 'blur(5px)', textAlign: 'left' }}>
          <p style={{ margin: 0, fontSize: '13px', color: '#34d399', fontWeight: 'bold' }}>Status: {status}</p>
          <p style={{ margin: '6px 0 0 0', fontSize: '20px', color: '#fff', fontWeight: '900' }}>Squats Count: {count}</p>
        </div>
      </div>

      <div style={{ marginTop: '25px' }}>
        <button 
          onClick={() => { setCount(c => c + 1); setStatus("Perfect Posture! 🔥 Keep Going!"); }}
          style={{ padding: '12px 24px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)' }}
        >
          Simulate Rep (+1 Squat) ⚡
        </button>
      </div>
    </div>
  );
}