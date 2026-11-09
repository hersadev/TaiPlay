import { useState } from 'react';
import CodeEditor, { ConsoleOutput } from '../components/code/CodeEditor';
import { runJs } from '../engine/js/run.js';
import { href } from '../hooks/useRoute';

// Editor libre de JavaScript: escribir y ejecutar lo que se quiera, con la
// misma consola aislada de las lecciones. El borrador se guarda en el
// navegador (si se puede) para no perderlo al recargar.

const KEY = 'taiplay:editor';

const EJEMPLOS = [
  {
    name: 'Hola, mundo',
    code: `// Escribe tu código y pulsa «Ejecutar» (o Ctrl+Intro)
const nombre = 'TAI';
console.log(\`Hola, \${nombre}\`);
console.log(2 + 2, '2' + 2, typeof null);`,
  },
  {
    name: 'Bucles y condiciones',
    code: `for (let i = 1; i <= 15; i++) {
  if (i % 15 === 0) console.log('FizzBuzz');
  else if (i % 3 === 0) console.log('Fizz');
  else if (i % 5 === 0) console.log('Buzz');
  else console.log(i);
}`,
  },
  {
    name: 'Arrays: filter, map y reduce',
    code: `const notas = [4, 7, 9, 3, 6, 8];
const aprobadas = notas.filter((n) => n >= 5);
console.log('Aprobadas:', aprobadas);
console.log('Por diez:', aprobadas.map((n) => n * 10));
const media = notas.reduce((s, n) => s + n, 0) / notas.length;
console.log('Media:', media.toFixed(2));`,
  },
  {
    name: 'Objetos y clases',
    code: `class Alumno {
  constructor(nombre, notas) {
    this.nombre = nombre;
    this.notas = notas;
  }
  media() {
    return this.notas.reduce((s, n) => s + n, 0) / this.notas.length;
  }
}

const ana = new Alumno('Ana', [8, 6, 9]);
console.log(ana);
console.log(ana.nombre, 'tiene de media', ana.media());`,
  },
  {
    name: 'fetch a la API de alumnos',
    code: `// En el editor, http://localhost:8080/alumnos es una API simulada
async function main() {
  const respuesta = await fetch('http://localhost:8080/alumnos');
  const alumnos = await respuesta.json();
  for (const a of alumnos) console.log(a.id, a.nombre);
}

main();
console.log('Esto sale antes: fetch es asíncrono');`,
  },
  {
    name: 'Errores y try/catch',
    code: `function dividir(a, b) {
  if (b === 0) throw new Error('No se puede dividir entre 0');
  return a / b;
}

try {
  console.log(dividir(10, 2));
  console.log(dividir(1, 0));
} catch (e) {
  console.error('Error capturado:', e.message);
} finally {
  console.log('Fin');
}`,
  },
];

const load = () => {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
};
const save = (v) => {
  try {
    localStorage.setItem(KEY, v);
  } catch {
    /* sin almacenamiento */
  }
};

export default function EditorPage() {
  const [code, setCode] = useState(() => load() ?? EJEMPLOS[0].code);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  const edit = (v) => {
    setCode(v);
    save(v);
  };

  const run = async () => {
    setBusy(true);
    const r = await runJs(code);
    setResult(r);
    setBusy(false);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-100">Editor de JavaScript</h1>
      <p className="mt-1 max-w-3xl text-gray-400">
        Escribe y ejecuta lo que quieras: el código corre aislado en tu navegador y lo que escribas con <code className="text-yellow-300">console.log</code> sale en la consola. Si te equivocas y haces un bucle infinito, se detiene solo. Tu código se guarda en este navegador.
      </p>

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <button type="button" onClick={run} disabled={busy} className="rounded-lg bg-yellow-400 px-4 py-1.5 font-semibold text-gray-950 hover:bg-yellow-300 disabled:opacity-60">
              {busy ? 'Ejecutando…' : '▶ Ejecutar'}
            </button>
            <label className="flex items-center gap-2 text-gray-400">
              <span className="sr-only sm:not-sr-only">Ejemplos:</span>
              <select
                value=""
                onChange={(e) => {
                  const ej = EJEMPLOS[Number(e.target.value)];
                  if (ej && (code === ej.code || window.confirm('¿Sustituir tu código por el ejemplo?'))) {
                    edit(ej.code);
                    setResult(null);
                  }
                }}
                className="rounded-lg border border-gray-600 bg-gray-900 px-2 py-1.5 text-gray-200"
              >
                <option value="">Cargar un ejemplo…</option>
                {EJEMPLOS.map((ej, i) => (
                  <option key={ej.name} value={i}>
                    {ej.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => {
                if (!code || window.confirm('¿Borrar todo el código?')) {
                  edit('');
                  setResult(null);
                }
              }}
              className="rounded-lg border border-gray-600 px-3 py-1.5 text-gray-300 hover:border-gray-400"
            >
              Vaciar
            </button>
          </div>
          <CodeEditor value={code} onChange={edit} onRun={run} rows={20} label="Editor de JavaScript" className="min-h-[18rem]" />
          <p className="text-xs text-gray-500">Ctrl+Intro ejecuta · Tab sangra · Esc sale del editor</p>
        </section>

        <section className="min-w-0 space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-300">Consola</h2>
            {result && (
              <button type="button" onClick={() => setResult(null)} className="text-xs text-gray-400 hover:text-gray-200">
                Limpiar
              </button>
            )}
          </div>
          <ConsoleOutput lines={result?.lines ?? []} empty={result ? '(No imprime nada)' : 'Pulsa «Ejecutar» para ver aquí la salida.'} className="min-h-[12rem] lg:max-h-[32rem]" />
        </section>
      </div>

      <p className="mt-6 max-w-3xl text-sm text-gray-400">
        Solo se puede ejecutar JavaScript: Java y C# necesitan un compilador que no cabe en una página web. Para practicarlos, están los retos de completar código al final de sus lecciones en la{' '}
        <a href={href('aprende/programacion')} className="text-yellow-300 hover:text-yellow-200">
          ruta de Programación
        </a>
        .
      </p>
    </div>
  );
}
