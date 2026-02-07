/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{html,ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#7C3AED',
        secondary: '#06B6D4',
        'background-light': '#FAFAFA',
        'background-dark': '#0f172a',
        'cyber-dark': '#0B0F1A',
        cyber: {
          bg: '#0B0F1A',
          card: '#0F1629',
          input: '#0B1022',
          dark: '#0B0F1A',
          border: 'rgba(255,255,255,0.08)',
          text: '#A1A1AA',
          primaryStart: '#8B5CF6',
          primaryEnd: '#22D3EE',
          socialBorder: '#A78BFA',
          purple: '#8B5CF6',
          cyan: '#22D3EE',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        card: '16px',
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'glow': '0 0 20px rgba(124, 58, 237, 0.08)'
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};
