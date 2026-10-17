import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { cpSync, existsSync, mkdirSync } from 'node:fs'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-public-media',
      apply: 'build',
      closeBundle() {
        // Timeline scenes and the Open Graph card reference /media/* URLs.
        // Keep the canonical files in the repository's media/ directory and
        // copy them into the deployed Pages output on every production build.
        const source = resolve(__dirname, 'media')
        const destination = resolve(__dirname, 'dist', 'media')
        if (existsSync(source)) {
          mkdirSync(destination, { recursive: true })
          cpSync(source, destination, { recursive: true, force: true })
          console.log('Copied storyboard media into dist/media')
        } else {
          throw new Error('Required storyboard media directory is missing: ' + source)
        }
      }
    }
  ],
  root: '.',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: { main: resolve(__dirname, 'index.html') },
      output: {
        entryFileNames: 'assets/index-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  },
  server: { port: 3000, open: true }
})
