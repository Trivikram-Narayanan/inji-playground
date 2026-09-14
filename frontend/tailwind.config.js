/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        void: '#08090C',
        panel: '#101318',
        panelLit: '#171B22',
        line: '#242A33',
        ink: '#EDEFF3',
        inkDim: '#7C8494',
        accent: '#5B7FFF',
        sealGold: '#C9A24B',
        verified: '#3FCC8F',
        pending: '#D8A63D',
        rejected: '#E4574F',
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        ui: ['Inter', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
