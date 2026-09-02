// Stub for @mediapipe/pose
// AuraFit uses TensorFlow MoveNet for pose detection, which does NOT use
// the MediaPipe runtime. This stub satisfies the static import that
// @tensorflow-models/pose-detection bundles for its BlazePose backend
// so Vite/Rolldown can build without the real @mediapipe/pose package.
export const Pose = undefined;
export const POSE_CONNECTIONS = undefined;
export const POSE_LANDMARKS = undefined;
export default {};
