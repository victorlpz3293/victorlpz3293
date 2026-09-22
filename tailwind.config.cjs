/** @type {import('tailwindcss').Config} */
module.exports = {
  // Tailwind lee las clases desde la plantilla y el JS, no desde el HTML generado:
  // así el CSS se puede compilar antes de que exista public/index.html.
  content: ['./templates/**/*.mjs', './public/js/**/*.js'],
  theme: {
    extend: {
      colors: {
        marca: {
          fondo: '#0B0F19',
          hondo: '#05070B',
          azul: '#3B82F6',
          cyan: '#06B6D4',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        titulo: ['Outfit', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
