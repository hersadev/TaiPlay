import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// BASE_PATH: en GitHub Pages la app vive en /TaiPlay/ (lo pone el workflow
// de .github/workflows/pages.yml). En local y en Docker se sirve en la raíz.
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react()],
})
