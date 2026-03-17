/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}'],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: '#020617',
          card: 'rgba(15, 23, 42, 0.8)',
          accent: '#22d3ee',
          border: 'rgba(34, 211, 238, 0.2)',
          grid: 'rgba(34, 211, 238, 0.05)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'Roboto Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};

