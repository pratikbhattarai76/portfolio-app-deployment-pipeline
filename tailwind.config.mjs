const withOpacity = (variableName) => `rgb(var(${variableName}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}'],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: withOpacity('--color-ink-rgb'),
          card: withOpacity('--color-surface-strong-rgb'),
          accent: withOpacity('--color-accent-rgb'),
          border: withOpacity('--color-border-rgb'),
          grid: withOpacity('--color-grid-rgb'),
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
