// Ejecuta JavaScript del alumno en un Web Worker aislado: sin acceso a la
// página, con console.log capturado, un fetch simulado y dos frenos para
// que nada cuelgue la pestaña:
//   - si el código síncrono no termina en `timeout` ms (bucle infinito), se
//     mata el Worker;
//   - si escribe más de MAX_LINES líneas, console.log lanza un error que
//     corta la ejecución.
// Devuelve { lines: [{ kind: 'log'|'warn'|'error'|'info', text }], timedOut }.

import { formatValue, deepEqual, MAX_LINES, FAKE_API } from './format.js';

export const LIMIT = '__TAIPLAY_LIMIT__';

export const WORKER_SRC = `
const __fmt = ${formatValue.toString()};
const __eq = ${deepEqual.toString()};
const __emit = (kind, text) => postMessage({ kind, text });
const __report = (e) => {
  if (e && e.message === '${LIMIT}') __emit('info', '… (salida cortada: más de ${MAX_LINES} líneas)');
  else __emit('error', 'Uncaught ' + (e && e.name ? e.name + ': ' + e.message : String(e)));
};
let __n = 0;
const __out = (kind) => (...args) => {
  if (++__n > ${MAX_LINES}) throw new Error('${LIMIT}');
  __emit(kind, args.map((a) => __fmt(a)).join(' '));
};
self.console = { log: __out('log'), info: __out('log'), warn: __out('warn'), error: __out('error') };
const __st = self.setTimeout.bind(self);
self.setTimeout = (fn, ms, ...a) => __st(() => { try { fn(...a); } catch (e) { __report(e); } }, ms);
self.fetch = (url) => new Promise((ok, ko) => __st(() => {
  const d = (${JSON.stringify(FAKE_API)})[url];
  d ? ok({ ok: true, status: 200, json: () => Promise.resolve(d) }) : ko(new TypeError('Failed to fetch'));
}, 20));
self.addEventListener('unhandledrejection', (ev) => { ev.preventDefault(); __report(ev.reason); });
self.onmessage = async (ev) => {
  if (typeof ev.data === 'string') {
    try { new Function(ev.data)(); } catch (e) { __report(e); }
    postMessage({ kind: 'sync-done' });
    return;
  }
  // Retos: se define la función del alumno y se le pasan las pruebas.
  const { code, fn, tests } = ev.data;
  let f;
  try {
    f = new Function(code + '\\n;return typeof ' + fn + " === 'function' ? " + fn + ' : undefined;')();
  } catch (e) {
    __report(e);
    postMessage({ kind: 'tests', results: null });
    return;
  }
  if (typeof f !== 'function') {
    postMessage({ kind: 'tests', results: null, missing: true });
    return;
  }
  const results = [];
  for (const t of tests) {
    try {
      const got = await f(...t.args);
      results.push({ ok: __eq(got, t.expect), got: __fmt(got, false) });
    } catch (e) {
      results.push({ ok: false, error: e && e.message === '${LIMIT}' ? 'Demasiada salida por consola' : (e && e.name ? e.name + ': ' + e.message : String(e)) });
    }
  }
  postMessage({ kind: 'tests', results });
};
`;

let workerUrl = null;

export function runJs(code, { timeout = 1500, idle = 300, max = 4000 } = {}) {
  return new Promise((resolve) => {
    workerUrl ??= URL.createObjectURL(new Blob([WORKER_SRC], { type: 'text/javascript' }));
    const worker = new Worker(workerUrl);
    const lines = [];
    let syncDone = false;
    let idleTimer = null;
    const finish = (timedOut = false) => {
      clearTimeout(idleTimer);
      clearTimeout(hardTimer);
      clearTimeout(maxTimer);
      worker.terminate();
      if (timedOut) lines.push({ kind: 'info', text: `⏱ El programa no terminó en ${timeout / 1000} s y se ha detenido: seguramente es un bucle infinito.` });
      resolve({ lines, timedOut });
    };
    const armIdle = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => finish(false), idle);
    };
    const hardTimer = setTimeout(() => !syncDone && finish(true), timeout);
    const maxTimer = setTimeout(() => finish(false), max);
    worker.onmessage = (ev) => {
      if (ev.data.kind === 'sync-done') syncDone = true;
      else lines.push(ev.data);
      if (syncDone) armIdle();
    };
    worker.onerror = (ev) => {
      ev.preventDefault();
      lines.push({ kind: 'error', text: ev.message || 'Error' });
      armIdle();
    };
    worker.postMessage(code);
  });
}

// Pasa las pruebas de un reto a la función `fn` definida en `code`.
// Devuelve { results: [{ ok, got?, error? }] | null, missing, lines, timedOut }.
export function runJsTests(code, fn, tests, { timeout = 2500 } = {}) {
  return new Promise((resolve) => {
    workerUrl ??= URL.createObjectURL(new Blob([WORKER_SRC], { type: 'text/javascript' }));
    const worker = new Worker(workerUrl);
    const lines = [];
    const done = (extra) => {
      clearTimeout(timer);
      worker.terminate();
      resolve({ lines, results: null, missing: false, timedOut: false, ...extra });
    };
    const timer = setTimeout(() => done({ timedOut: true }), timeout);
    worker.onmessage = (ev) => {
      if (ev.data.kind === 'tests') done({ results: ev.data.results, missing: Boolean(ev.data.missing) });
      else if (ev.data.kind !== 'sync-done') lines.push(ev.data);
    };
    worker.onerror = (ev) => {
      ev.preventDefault();
      lines.push({ kind: 'error', text: ev.message || 'Error' });
      done({});
    };
    worker.postMessage({ code, fn, tests });
  });
}
