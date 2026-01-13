import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  base: '/',  // ← This line is essential for root-domain deploys like yours

  plugins: [react()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },

  // Your define block if needed
});
