/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0E0E0F',
        surface: { DEFAULT: '#151517', 2: '#1D1D20' },
        line: '#2A2A2E',               // `border` in the .pen file; renamed to avoid clashing with Tailwind's `border` utility
        ink: { DEFAULT: '#F2F1EE', 2: '#A3A19C', 3: '#6E6C68' },
        accent: { DEFAULT: '#FF7A1A', ink: '#1A0D03', soft: '#FF7A1A1F' },
        ok: '#5BD68A',
        danger: '#FF6B5E',
      },
      fontFamily: {
        sans: ['Geist', 'system-ui', 'sans-serif'],
        mono: ['"Geist Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
}
