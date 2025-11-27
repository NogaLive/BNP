/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Colores institucionales
        primary: '#D91023', // Rojo BNP para acentos y botones principales
        secondary: '#003B5C', // Azul Marino BNP para branding y headers
        accent: '#1D72C2', // Azul estándar para links y acciones secundarias
        neutral: {
          50: '#F7F7F7', // Fondo principal
          100: '#EAEAEA',
          200: '#D3D3D3', // Bordes
          800: '#333333', // Texto principal
          900: '#1A1A1A', // Headers
        },
      },
      boxShadow: {
        'card': '0 4px 12px rgba(0, 0, 0, 0.06)',
        'elevate': '0 10px 30px rgba(0, 0, 0, 0.1)',
      }
    },
  },
  plugins: [],
}