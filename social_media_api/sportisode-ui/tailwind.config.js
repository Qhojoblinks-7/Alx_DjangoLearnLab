// tailwind.config.js
/** @type {import('tailwindcss').Config} */
import tailwindcss from '@tailwindcss/vite'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // Scan all files in src
  ],
  darkMode: 'class', // Enable dark mode strategy
  theme: {
    extend: {
      colors: {
        'sport-accent': '#1DA1F2', // Sport accent
        'dark-bg': '#15202B',     // Near-black dark background
        'dark-card': '#1E2732',   // Slightly lighter card background
        'primary-bg': '#FFFFFF',  // Foundation primary background
        'secondary-bg': '#F7F9F9', // Secondary background
        'primary-text': '#0F1419', // Primary text
        'secondary-text': '#536471', // Secondary text
        'accent-hover': '#1A8CD8', // Accent hover
        'border-divider': '#EFF3F4', // Border / divider
        'success': '#00BA7C', // Success
        'error': '#F4212E', // Error
      },
    },
  },
  plugins: [
    tailwindcss(),
  ],
}