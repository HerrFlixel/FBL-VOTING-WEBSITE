import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f2f6ff',
          100: '#e0e9ff',
          200: '#bfd0ff',
          300: '#93aeff',
          400: '#6584ff',
          500: '#3d5bff',
          600: '#263bdb',
          700: '#1a2cb0',
          800: '#16258a',
          900: '#151f6d'
        }
      },
      fontFamily: {
        heading: ['"Futura Extra Bold Oblique"', 'Futura', 'system-ui', 'sans-serif'],
        sans: ['Futura', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
}

export default config


