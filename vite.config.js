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

// sql.js trae una rama para Node que hace require('fs'), 'path' y 'crypto'.
// En el navegador no se ejecuta nunca, pero Vite avisa al compilar; se les
// da un módulo vacío solo cuando los pide sql.js.
const EMPTY = '\0sqljs-node-stub'
const sqlJsNodeStubs = {
  name: 'sqljs-node-stubs',
  enforce: 'pre',
  resolveId(source, importer) {
    if (['fs', 'path', 'crypto'].includes(source) && importer?.includes('/node_modules/sql.js/')) return EMPTY
  },
  load(id) {
    if (id === EMPTY) return 'export default {}'
  },
}

// https://vite.dev/config/
// BASE_PATH: en GitHub Pages la app vive en /TaiPlay/ (lo pone el workflow
// de .github/workflows/pages.yml). En local y en Docker se sirve en la raíz.
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react(), sqlJsNodeStubs],
  build: { rollupOptions: { output: { manualChunks } } },
})
