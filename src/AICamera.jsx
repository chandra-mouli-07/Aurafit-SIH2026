import { useEffect, useRef, useState } from 'react';
import { db } from './lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import * as tf from '@tensorflow/tfjs';
import * as poseDetection from '@tensorflow-models/pose-detection';

// Calculate the angle at vertex point B, formed by A-B-C
function calculateAngle(a, b, c) {
  const radians =
    Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180) / Math.PI);
  if (angle > 180) angle = 360 - angle;
  return angle;
}

export default function AIPoster({ onBack, user, onWorkoutSaved }) {
  const videoRef    = useRef(null);
  const countRef    = useRef(0);   // Mutable count used inside animation loop
  const stageRef    = useRef(null); // 'down' | 'up' | null
  const animFrameRef = useRef(null);

  const [count, setCount]           = useState(0);
  const [status, setStatus]         = useState('Starting camera…');
  const [isSaving, setIsSaving]     = useState(false);
  const [modelReady, setModelReady] = useState(false);

  useEffect(() => {
    // Reset rep tracking each time this view mounts
    countRef.current = 0;
    stageRef.current = null;

    let stream   = null;
    let detector = null;
    let mounted  = true;

    const setup = async () => {
      try {
        // ── 1. Webcam ────────────────────────────────────────────────────────
        stream = await navigator.mediaDevices.getUserMedia({ video: true });

        // Bug 4 fix: stream captured in closure so cleanup always has a reference,
        // even when videoRef.current has been nullified by React (e.g. StrictMode).
        if (!mounted) { stream.getTracks().forEach((t) => t.stop()); return; }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Wait for video metadata; reject early if the component unmounts first.
          await new Promise((resolve, reject) => {
            const vid = videoRef.current;
            if (!vid) return reject(new Error('Video element gone'));
            vid.onloadedmetadata = resolve;
            vid.onerror = reject;
          });
          if (!mounted) return;
          await videoRef.current.play();
        }

        if (!mounted) return;
        setStatus('Loading AI model…');

        // ── 2. Load MoveNet (Lightning = fastest, lowest latency) ────────────
        await tf.ready();
        detector = await poseDetection.createDetector(
          poseDetection.SupportedModels.MoveNet,
          { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING }
        );

        if (!mounted) { detector.dispose(); return; }
        setModelReady(true);
        setStatus('Ready! Stand facing the camera and start squatting 🏋️');

        // ── 3. Pose detection loop ───────────────────────────────────────────
        const detect = async () => {
          if (!mounted) return;

          if (
            videoRef.current &&
            videoRef.current.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA &&
            detector
          ) {
            try {
              const poses = await detector.estimatePoses(videoRef.current);

              if (mounted && poses.length > 0) {
                const kp = poses[0].keypoints;
                // MoveNet keypoint indices:
                //   11 = left_hip, 13 = left_knee, 15 = left_ankle
                const hip   = kp[11];
                const knee  = kp[13];
                const ankle = kp[15];

                // Only act when all three points are detected with confidence
                if (hip.score > 0.5 && knee.score > 0.5 && ankle.score > 0.5) {
                  const angle = calculateAngle(
                    { x: hip.x,   y: hip.y },
                    { x: knee.x,  y: knee.y },
                    { x: ankle.x, y: ankle.y }
                  );

                  // Squat DOWN: knee angle collapses below 90°
                  if (angle < 90 && stageRef.current !== 'down') {
                    stageRef.current = 'down';
                    if (mounted) setStatus('⬇️ Squat! Hold low…');
                  }
                  // Squat UP: angle opens back above 160° — count the rep
                  else if (angle > 160 && stageRef.current === 'down') {
                    stageRef.current = 'up';
                    countRef.current += 1;
                    const newCount = countRef.current;
                    if (mounted) {
                      setCount(newCount);
                      setStatus(`🔥 Rep ${newCount} done! Keep going!`);
                    }
                  }
                }
              }
            } catch {
              // Silently skip frames where inference fails (e.g. video not ready)
            }
          }

          if (mounted) {
            animFrameRef.current = requestAnimationFrame(detect);
          }
        };

        animFrameRef.current = requestAnimationFrame(detect);
      } catch (err) {
        if (!mounted) return;
        console.error('Camera / model setup error:', err);
        setStatus('Webcam access denied or unavailable. Please allow camera access.');
      }
    };

    setup();

    // Bug 4 fix: cleanup stops the stream via closure reference (not videoRef.current)
    // and cancels any pending animation frame.
    return () => {
      mounted = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (stream) stream.getTracks().forEach((t) => t.stop());
      if (detector) detector.dispose();
    };
  }, []);

  // Bug 14 fix: save uses the live ref value (not stale state) to get the
  // count that was accumulated inside the async animation loop.
  // Introduced-bug fix: onBack() unmounts this component, so we must NOT call
  // setIsSaving() after it. We track success with a local flag and call
  // onBack() only after the finally block has run.
  const handleSaveAIWorkout = async () => {
    setIsSaving(true);
    let saved = false;
    try {
      await addDoc(collection(db, 'workouts'), {
        userId:    user ? user.uid : 'anonymous',
        exercise:  `AI Squats (${countRef.current} reps)`,
        duration:  `${countRef.current * 15} secs`,
        createdAt: serverTimestamp(),
      });
      saved = true;
    } catch (err) {
      console.error('Error saving AI workout:', err);
    } finally {
      setIsSaving(false);
    }
    // Call onBack() and the success callback after state is settled and
    // outside the try/finally so we never setIsSaving on an unmounted tree.
    if (saved) {
      if (onWorkoutSaved) onWorkoutSaved();
      onBack();
    }
  };

  return (
    <div style={{ padding: '20px', background: '#111827', borderRadius: '12px', color: '#fff', textAlign: 'center', border: '1px solid #1f2937' }}>

      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button
          type="button"
          onClick={onBack}
          style={{ padding: '8px 16px', background: '#374151', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          ← Back to Dashboard
        </button>
        <button
          type="button"
          onClick={handleSaveAIWorkout}
          disabled={isSaving || count === 0}
          style={{
            padding: '8px 16px',
            background: count > 0 ? '#10b981' : '#374151',
            color: count > 0 ? '#000' : '#9ca3af',
            border: 'none', borderRadius: '6px',
            cursor: count > 0 ? 'pointer' : 'not-allowed',
            fontWeight: 'bold',
          }}
        >
          {isSaving ? 'Saving…' : 'Finish & Save 💾'}
        </button>
      </div>

      <h2 style={{ color: '#10b981', marginBottom: '8px', fontSize: '24px', fontWeight: '800' }}>
        AI Posture Corrector Arena
      </h2>
      <p style={{ color: '#9ca3af', marginBottom: '20px', fontSize: '14px' }}>
        {modelReady
          ? 'AI is tracking your squats in real time via MoveNet.'
          : 'Please wait while the AI model loads…'}
      </p>

      {/* Camera feed with live overlay */}
      <div style={{ position: 'relative', maxWidth: '640px', margin: '0 auto', background: '#000', borderRadius: '10px', overflow: 'hidden', border: '2px solid #10b981', boxShadow: '0 0 20px rgba(16,185,129,0.2)' }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ width: '100%', height: 'auto', display: 'block' }}
        />
        {/* HUD overlay */}
        <div style={{ position: 'absolute', top: '15px', left: '15px', background: 'rgba(15,23,42,0.85)', padding: '12px 18px', borderRadius: '8px', border: '1px solid #10b981', backdropFilter: 'blur(5px)', textAlign: 'left' }}>
          <p style={{ margin: 0, fontSize: '13px', color: '#34d399', fontWeight: 'bold' }}>
            Status: {status}
          </p>
          <p style={{ margin: '6px 0 0 0', fontSize: '20px', color: '#fff', fontWeight: '900' }}>
            Squats: {count}
          </p>
        </div>

        {/* Loading indicator shown before model is ready */}
        {!modelReady && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}>
            <p style={{ color: '#10b981', fontWeight: 'bold', fontSize: '16px' }}>
              ⏳ Loading AI…
            </p>
          </div>
        )}
      </div>
    </div>
  );
}