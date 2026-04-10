/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",  // Include the root-level index.html file
    "./dashboard/**/*.html",  // This will include all HTML files within the dashboard folder and its subfolders
    "./app-store/**/*.html",   // This will include all HTML files within the app-store folder and its subfolders
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

