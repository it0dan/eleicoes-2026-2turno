/** @type {import('tailwindcss').Config} */
const token = nome => `rgb(var(--${nome}) / <alpha-value>)`

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif']
      },
      colors: {
        fundo: token('fundo'),
        superficie: token('superficie'),
        'superficie-2': token('superficie-2'),
        linha: token('linha'),
        tinta: token('tinta'),
        'tinta-2': token('tinta-2'),
        'tinta-3': token('tinta-3'),
        lula: token('lula'),
        flavio: token('flavio'),
        'cat-1': token('cat-1'),
        'cat-2': token('cat-2'),
        'cat-3': token('cat-3'),
        'cat-4': token('cat-4'),
        destaque: token('destaque'),
        'brilho-1': token('brilho-1'),
        'brilho-2': token('brilho-2'),
        'brilho-3': token('brilho-3')
      }
    }
  },
  plugins: []
}
