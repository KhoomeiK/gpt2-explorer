import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Map the bare import "gpt2-webgl" straight to the file that exports your class:
      'gpt2-webgl': path.resolve(__dirname, '../gpt2-webgl/src/gpt2_webgl.ts'),
    },
  },
  server: {
    port: 5173,
    fs: {
      // Allow dev server to read the sibling folder
      allow: [
        path.resolve(__dirname),
        path.resolve(__dirname, '../gpt2-webgl'),
      ],
    },
  },
  build: { target: 'es2020' },
})
