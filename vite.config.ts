import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Caminhos relativos: o mesmo build funciona em usuario.github.io/<repositório>/ ou em qualquer subpasta.
  base: './',
  plugins: [react()],
  server: {
    port: 5173,
    host: true
  }
})
