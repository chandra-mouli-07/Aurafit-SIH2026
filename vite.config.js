import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // @tensorflow-models/pose-detection statically imports @mediapipe/pose
      // for its BlazePose backend, but AuraFit only uses MoveNet — MediaPipe
      // is never invoked at runtime. This alias points Rolldown to a stub so
      // the build succeeds without the real (incompatible) mediapipe package.
      '@mediapipe/pose': resolve('./src/stubs/mediapipe-pose.js'),
    },
  },
  build: {
    // TF.js bundles are large by design; suppress the size warning that
    // would otherwise be a false alarm for this ML-dependent app.
    chunkSizeWarningLimit: 3000,
  },
})
