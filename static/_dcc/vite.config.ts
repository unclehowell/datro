import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  // Crucial for correct asset paths on public root domain (dcc.datro.xyz)
  base: '/',

  plugins: [react()],

  // Path alias (optional but useful)
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),  // root of your project
      // Change to './src' if you later move code into a src/ folder
    },
  },

  // If you still need to expose the API key via process.env (legacy style)
  // Otherwise switch to import.meta.env.VITE_GEMINI_API_KEY in your code
  define: {
    'process.env.GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY),
  },
});
