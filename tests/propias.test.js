import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PROPIAS } from '../src/data/propias/preguntas.js';
import { TEMAS } from '../src/data/temario/index.js';
import { TOPICS } from '../src/data/topics.js';
import { buildPool } from '../src/engine/repaso/pool.js';

// Las preguntas propias (no oficiales) deben estar bien formadas: si una
// tuviera la respuesta mal puesta, se aprendería algo falso.
test('preguntas propias: forma, fuente y opciones', () => {
  const ids = new Set();
  const temas = new Set(TEMAS.map((t) => t.id));
  const topics = new Set(TOPICS.map((t) => t.id));
  for (const q of PROPIAS) {
    assert.ok(!ids.has(q.id), `id repetido ${q.id}`);
    ids.add(q.id);
    assert.match(q.id, /^tp-B\dT\d\d-\d\d$/);
    assert.ok(q.id.startsWith(`tp-${q.tema}-`), q.id);
    assert.ok(temas.has(q.tema), q.id);
    assert.ok(topics.has(q.topic), q.id);
    assert.equal(q.options.length, 4, q.id);
    assert.equal(new Set(q.options).size, 4, `opciones repetidas en ${q.id}`);
    assert.ok('abcd'.includes(q.answer) && q.answer.length === 1, q.id);
    assert.ok(q.fuente && q.fuente.length > 3, `sin fuente ${q.id}`);
    assert.ok(q.explanation.length > 40, q.id);
  }
});

test('preguntas propias: 10 por cada tema elegido, y respuestas repartidas', () => {
  const porTema = {};
  for (const q of PROPIAS) porTema[q.tema] = (porTema[q.tema] ?? 0) + 1;
  assert.deepEqual(Object.values(porTema), Object.values(porTema).map(() => 10));
  // Que la correcta no sea casi siempre la misma letra.
  const letras = {};
  for (const q of PROPIAS) letras[q.answer] = (letras[q.answer] ?? 0) + 1;
  assert.ok(Math.max(...Object.values(letras)) / PROPIAS.length < 0.35, JSON.stringify(letras));
});

test('entran en los tests por tema marcadas como no oficiales', () => {
  const qs = PROPIAS.map((q) => ({ ...q, oficial: false }));
  const pool = buildPool(['B4T01'], { questions: qs, temas: [] });
  assert.equal(pool.exam.length, 10);
  assert.ok(pool.exam.every((x) => x.label.startsWith('No oficial · ')));
});
