/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1a5f3f',
          light: '#2a7f5f',
          dark: '#0f3d27',
        },
        secondary: {
          DEFAULT: '#d4af37',
          light: '#e4bf57',
          dark: '#b49627',
        },
      },
      fontFamily: {
        sans: ["'Inter'", 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ["'Cormorant Garamond'", "'Playfair Display'", 'Georgia', 'serif'],
      },
      boxShadow: {
        'card': '0 8px 24px -8px rgba(15,61,39,0.2)',
        'marker': '0 3px 10px rgba(0,0,0,0.35)',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-in-out',
        'slide-up': 'slideUp 0.6s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(30px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
