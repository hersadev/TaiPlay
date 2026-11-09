import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { formatValue, MAX_LINES, FAKE_API } from '../src/engine/js/format.js';
import { LIMIT } from '../src/engine/js/run.js';
import { ALL_LESSONS } from '../src/lessons/index.js';

// Réplica en Node del Worker de engine/js/run.js: mismo formateo, mismo
// límite de líneas y el mismo fetch simulado.
async function runNode(code) {
  const lines = [];
  let n = 0;
  const report = (e) => lines.push({ kind: e?.message === LIMIT ? 'limit' : 'error', name: e?.name, text: `${e?.name}: ${e?.message}` });
  const out = (kind) => (...args) => {
    if (++n > MAX_LINES) throw new Error(LIMIT);
    lines.push({ kind, text: args.map((a) => formatValue(a)).join(' ') });
  };
  const ctx = vm.createContext({
    console: { log: out('log'), info: out('log'), warn: out('warn'), error: out('error') },
    setTimeout: (fn, ms, ...a) => setTimeout(() => { try { fn(...a); } catch (e) { report(e); } }, ms),
    fetch: (url) => new Promise((ok, ko) => setTimeout(() => (FAKE_API[url] ? ok({ ok: true, status: 200, json: () => Promise.resolve(structuredClone(FAKE_API[url])) }) : ko(new TypeError('Failed to fetch'))), 20)),
  });
  let timedOut = false;
  try {
    vm.runInContext(`(function () {\n${code}\n})()`, ctx, { timeout: 500 });
  } catch (e) {
    if (e.code === 'ERR_SCRIPT_EXECUTION_TIMEOUT') timedOut = true;
    else report(e);
  }
  await new Promise((r) => setTimeout(r, 150));
  return { lines, timedOut };
}

const codeLessons = ALL_LESSONS.filter((l) => l.type === 'code');

for (const lesson of codeLessons) {
  test(`lección ${lesson.id}: ejercicios bien formados`, async () => {
    assert.ok(lesson.exercises.length >= 4);
    for (const [i, ex] of lesson.exercises.entries()) {
      const where = `${lesson.id} #${i + 1}`;
      assert.ok(['js', 'java', 'csharp'].includes(ex.lang), where);
      assert.ok(ex.why && ex.q && ex.code, where);
      const nLines = ex.code.split('\n').length;
      if (ex.task === 'line') {
        for (const l of [ex.answer].flat()) assert.ok(l >= 1 && l <= nLines, `${where}: línea ${l}`);
        assert.ok(['compilación', 'ejecución'].includes(ex.error), where);
      } else {
        assert.ok(ex.options.length === 4 && ex.answer >= 0 && ex.answer < 4, where);
        assert.equal(new Set(ex.options).size, 4, `${where}: opciones repetidas`);
      }
      if (ex.lang !== 'js') continue;
      const r = await runNode(ex.code);
      const logs = r.lines.filter((l) => l.kind === 'log').map((l) => l.text).join('\n');
      if (ex.endless) {
        assert.ok(r.timedOut || r.lines.some((l) => l.kind === 'limit'), `${where}: debería no terminar`);
      } else if (ex.error) {
        assert.equal(logs, ex.output, where);
        assert.ok(r.lines.some((l) => l.kind === 'error' && l.name === ex.error), `${where}: falta el ${ex.error}`);
      } else {
        assert.ok(!r.lines.some((l) => l.kind === 'error'), `${where}: ${JSON.stringify(r.lines)}`);
        assert.equal(logs, ex.output ?? ex.options[ex.answer], where);
      }
    }
  });
}

test('formatValue imita la consola', () => {
  assert.equal(formatValue([1, 'a', [2]]), "[ 1, 'a', [ 2 ] ]");
  assert.equal(formatValue({ a: 1, 'b-c': 'x' }), "{ a: 1, 'b-c': 'x' }");
  assert.equal(formatValue('texto'), 'texto');
  assert.equal(formatValue(null), 'null');
  assert.equal(formatValue(new Map([[1, 2]])), 'Map(1) { 1 => 2 }');
  // Se serializa para el Worker: no puede depender de nada externo.
  const copy = new Function(`return ${formatValue.toString()}`)();
  assert.equal(copy({ x: [1] }), '{ x: [ 1 ] }');
});

// Retos: la solución de referencia pasa todas las pruebas y el código de
// partida no (si no, el reto se resolvería sin hacer nada).
import { deepEqual } from '../src/engine/js/format.js';
import { RETOS, gapOk } from '../src/lessons/_retos.js';

async function runChallenge(code, fn, tests) {
  const ctx = vm.createContext({
    console: { log() {}, error() {}, warn() {} },
    setTimeout,
    fetch: (url) => new Promise((ok, ko) => setTimeout(() => (FAKE_API[url] ? ok({ json: () => Promise.resolve(structuredClone(FAKE_API[url])) }) : ko(new TypeError('Failed to fetch'))), 5)),
  });
  const f = vm.runInContext(`(function () {\n${code}\n;return typeof ${fn} === 'function' ? ${fn} : undefined;\n})()`, ctx, { timeout: 500 });
  if (typeof f !== 'function') return [false];
  const out = [];
  for (const t of tests) {
    try {
      // Los valores creados dentro de vm son de otro «realm»: se pasan a JSON
      // para comparar.
      const got = await f(...structuredClone(t.args));
      out.push(deepEqual(got === undefined ? undefined : JSON.parse(JSON.stringify(got)), t.expect));
    } catch {
      out.push(false);
    }
  }
  return out;
}

test('todas las lecciones de código tienen retos', () => {
  for (const l of codeLessons) assert.ok(l.challenges.length >= 2, l.id);
  assert.deepEqual(Object.keys(RETOS).sort(), codeLessons.map((l) => l.id).sort());
});

for (const [id, retos] of Object.entries(RETOS)) {
  test(`retos de ${id}`, async () => {
    for (const r of retos) {
      assert.ok(r.title && r.task, id);
      if (r.kind === 'js') {
        const ok = await runChallenge(r.solution, r.fn, r.tests);
        assert.ok(ok.every(Boolean), `${r.title}: la solución falla (${ok})`);
        const starter = await runChallenge(r.starter, r.fn, r.tests);
        assert.ok(!starter.every(Boolean), `${r.title}: el código de partida ya pasa`);
      } else {
        const n = (r.code.match(/\{\{\d+\}\}/g) ?? []).length;
        assert.equal(n, r.gaps.length, `${r.title}: huecos`);
        for (const g of r.gaps) assert.ok(g.accept.every((a) => gapOk(g, a)) && !gapOk(g, ''), r.title);
      }
    }
  });
}

test('huecos: da igual el espaciado, pero no dentro de las comillas', () => {
  const g = { accept: ['"Hola, "+nombre', 'i<notas.length'] };
  assert.ok(gapOk(g, '"Hola, " + nombre;'));
  assert.ok(gapOk(g, ' i <  notas.length '));
  assert.ok(!gapOk(g, '"Hola," + nombre'));
  assert.ok(!gapOk(g, 'i <= notas.length'));
});

test('el código del Worker es JavaScript válido', async () => {
  const { WORKER_SRC } = await import('../src/engine/js/run.js');
  assert.doesNotThrow(() => new vm.Script(WORKER_SRC));
});
