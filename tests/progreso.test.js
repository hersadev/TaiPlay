import { test } from 'node:test';
import assert from 'node:assert/strict';
import { simulacroSeries, weakTemas, coverage } from '../src/engine/progreso.js';

test('serie de simulacros: en orden, sin supuestos sueltos y sin bajar de 0', () => {
  const attempts = [
    { kind: 'simulacro', at: 3, title: 'Simulacro · B', net: 50, total: 100 },
    { kind: 'supuesto', at: 2, title: 'Supuesto', net: 10, total: 20 },
    { kind: 'simulacro', at: 1, title: 'Simulacro · A', net: -2, total: 100 },
  ];
  assert.deepEqual(
    simulacroSeries(attempts).map((p) => [p.title, p.pct]),
    [
      ['A', 0],
      ['B', 0.5],
    ],
  );
});

test('temas flojos y cobertura por bloque', () => {
  const temas = [{ id: 'B1T01' }, { id: 'B1T02' }, { id: 'B2T01' }];
  const qs = ['a', 'b', 'c', 'd', 'e', 'f', 'g'].map((id, i) => ({ id, tema: i < 3 ? 'B1T01' : i < 6 ? 'B1T02' : 'B2T01' }));
  const answers = {
    a: { last: 'ko' }, b: { last: 'ko' }, c: { last: 'ok' }, // B1T01: 1/3
    d: { last: 'ok' }, e: { last: 'ok' }, f: { last: 'ok' }, // B1T02: todo bien, no es flojo
    g: { last: 'ko' }, // B2T01: solo 1 respondida, no cuenta
  };
  assert.deepEqual(weakTemas(qs, answers, temas).map((w) => [w.tema.id, w.ok, w.seen]), [['B1T01', 1, 3]]);
  const bloques = [{ n: 1, temas: temas.slice(0, 2) }, { n: 2, temas: temas.slice(2) }];
  const c = coverage(qs, answers, bloques, { B1T02: { done: true } });
  assert.deepEqual(c.map((b) => [b.preguntas.seen, b.preguntas.total, b.fichas.done, b.fichas.total]), [[6, 6, 1, 2], [1, 1, 0, 1]]);
});
