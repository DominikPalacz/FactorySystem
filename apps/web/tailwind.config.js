/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Rugged theme - high contrast, industrial look
        rugged: {
          dark: '#1a1a1a',
          gray: '#333333',
          light: '#f0f0f0',
          accent: '#ff6b35', // warning orange
          success: '#06a77d',
          danger: '#d62828',
        },
      },
      spacing: {
        // Larger buttons for gloved operation
        'button-lg': '3rem',
      },
      fontSize: {
        // Large, readable text
        'heading-xl': ['2.25rem', { lineHeight: '2.5rem' }],
      },
    },
  },
  plugins: [],
}
