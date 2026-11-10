import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Agrupa lo que se carga al arrancar en piezas de menos de 500 KB que el
// navegador descarga en paralelo y cachea por separado: React, cada examen
// y el temario. Lo demás se parte por página (App.jsx).
function manualChunks(id) {
  if (id.includes('node_modules/react') || id.includes('node_modules/scheduler') || id.includes('node_modules/zustand')) return 'react'
  const exam = id.match(/src\/data\/exams\/(tai\w+)\.json/)
  if (exam) return `examen-${exam[1]}`
  if (id.includes('/src/data/temario/')) return 'temario'
}

// https://vite.dev/config/
// BASE_PATH: en GitHub Pages la app vive en /TaiPlay/ (lo pone el workflow
// de .github/workflows/pages.yml). En local y en Docker se sirve en la raíz.
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react()],
  build: { rollupOptions: { output: { manualChunks } } },
})
