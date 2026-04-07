module.exports = {
  content: [
    './index.html',
    './index.tsx',
    './App.tsx',
    './**/*.{ts,tsx,js,jsx,html}',
  ],
  theme: {
    extend: {
      colors: {
        'justice-red': '#991b1b',
        'legal-blue': '#1e293b',
        'paper': '#f8fafc',
        'ink': '#0f172a',
        'muted': '#64748b',
      }
    }
  },
  plugins: [],
}
