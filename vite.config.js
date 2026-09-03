// vite.config.js
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
// optional: uncomment to support old browsers
// import legacy from '@vitejs/plugin-legacy'
// optional: uncomment to import SVGs as React components
// import svgr from 'vite-plugin-svgr'

export default defineConfig(({ mode }) => {
  // load .env, .env.local, .env.[mode], etc.
  const env = loadEnv(mode, process.cwd(), '')

  // Allow overriding base via VITE_BASE env var; otherwise use repo path on production
  const isProd = mode === 'production'
  const base = env.VITE_BASE || (isProd ? '/Aurafit-SIH2026/' : '/')

  return {
    plugins: [
      react(),
      // svgr(),
      // legacy({
      //   targets: ['defaults', 'not IE 11']
      // })
    ],
    base,
    resolve: {
      alias: {
        // Use "@/..." to import from src
        '@': resolve(__dirname, 'src')
      }
    },
    server: {
      port: 5173,
      open: true,
      strictPort: false,
      // Proxy API calls during development (example)
      // proxy: {
      //   '/api': {
      //     target: 'http://localhost:3000',
      //     changeOrigin: true,
      //     rewrite: (p) => p.replace(/^\/api/, '')
      //   }
      // }
    },
    preview: {
      port: 5174
    },
    build: {
      outDir: 'dist',
      sourcemap: !isProd, // generate sourcemaps for non-prod builds (useful for staging)
      target: 'es2015',
      assetsInlineLimit: 4096,
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          // Example manual chunking to improve caching for vendor libs
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react')) return 'vendor_react'
              return 'vendor'
            }
          }
        }
      },
      // reduce noisy warnings during CI
      chunkSizeWarningLimit: 2000
    },
    optimizeDeps: {
      // include: ['some-large-dep'], // pre-bundle if needed
    },
    define: {
      // make sure process.env references don't crash; prefer import.meta.env in code
      'process.env': {}
    }
  }
})
