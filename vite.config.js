import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join, relative } from 'node:path'

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

// PWA: publica sw.js a partir de pwa/sw.js con la lista de ficheros que
// debe guardar para funcionar sin conexión (lo generado más public/). Las
// rutas son relativas para que sirva igual en la raíz (Docker) que en
// /TaiPlay/ (GitHub Pages).
function pwa() {
  let publicDir
  const walk = (dir) => readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? walk(join(dir, f)) : [join(dir, f)]))
  return {
    name: 'taiplay-pwa',
    apply: 'build',
    configResolved(config) {
      publicDir = config.publicDir
    },
    generateBundle(_, bundle) {
      const files = [
        './',
        ...Object.keys(bundle).filter((f) => f !== 'index.html' && !f.endsWith('.map')),
        ...walk(publicDir).map((f) => relative(publicDir, f).split('\\').join('/')).filter((f) => !f.startsWith('.')),
      ]
      const version = createHash('sha256').update(files.join('\n')).digest('hex').slice(0, 12)
      const source = readFileSync(new URL('./pwa/sw.js', import.meta.url), 'utf8')
        .replace('self.__PRECACHE__', JSON.stringify(files))
        .replace('self.__VERSION__', JSON.stringify(version))
      this.emitFile({ type: 'asset', fileName: 'sw.js', source })
    },
  }
}

// https://vite.dev/config/
// BASE_PATH: en GitHub Pages la app vive en /TaiPlay/ (lo pone el workflow
// de .github/workflows/pages.yml). En local y en Docker se sirve en la raíz.
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react(), sqlJsNodeStubs, pwa()],
  build: { rollupOptions: { output: { manualChunks } } },
})
