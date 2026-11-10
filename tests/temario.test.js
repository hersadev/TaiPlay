import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { TEMAS, BLOQUES } from '../src/data/temario/index.js';
import { ALL_LESSONS, TRACKS } from '../src/lessons/index.js';

const ROOT = new URL('..', import.meta.url).pathname;

test('el temario tiene los 33 temas del programa, en orden y completos', () => {
  assert.deepEqual(
    BLOQUES.map((b) => b.temas.length),
    [9, 5, 9, 10],
  );
  for (const b of BLOQUES) {
    b.temas.forEach((t, i) => {
      assert.equal(t.id, `B${b.n}T${String(i + 1).padStart(2, '0')}`);
      assert.ok(t.short && t.title && t.body.length > 300, `${t.id} incompleto`);
      assert.ok(t.quiz.length >= 3, `${t.id}: test demasiado corto`);
      for (const q of t.quiz) assert.ok(q.answer >= 0 && q.answer < q.options.length, `${t.id}: ${q.q}`);
    });
  }
});

test('las referencias entre temario, lecciones, rutas y preguntas existen', () => {
  const temaIds = new Set(TEMAS.map((t) => t.id));
  const lessonIds = new Set(ALL_LESSONS.map((l) => l.id));
  for (const t of TEMAS) for (const l of t.lessons) assert.ok(lessonIds.has(l), `${t.id} → ${l}`);
  for (const tr of TRACKS) for (const id of tr.temas ?? []) assert.ok(temaIds.has(id), `${tr.id} → ${id}`);
  for (const id of ['tai2019', 'tai2022', 'tai2024A', 'tai2025A', 'tai2025X']) {
    const exam = JSON.parse(readFileSync(join(ROOT, `src/data/exams/${id}.json`), 'utf8'));
    for (const p of exam.parts) for (const q of p.questions) assert.ok(temaIds.has(q.tema), `${q.id} → ${q.tema}`);
  }
});

// El temario de referencia es material privado de una academia: no puede
// aparecer su nombre en nada de lo que se publica.
test('nada publicable menciona la academia del temario', () => {
  const forbidden = ['opo', 'lex'].join('');
  const skip = new Set(['node_modules', 'dist', '.git', 'TAI']);
  const hits = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      if (skip.has(name)) continue;
      const p = join(dir, name);
      if (statSync(p).isDirectory()) walk(p);
      else if (!/\.(pdf|png|jpg|svg|ico)$/i.test(name) && readFileSync(p, 'utf8').toLowerCase().includes(forbidden)) hits.push(p);
    }
  };
  walk(ROOT);
  assert.deepEqual(hits, []);
});
