import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildMixedExam, REPARTO, RESERVAS } from '../src/engine/simulacro.js';
import { scoreExam } from '../src/utils/scoring.js';
import { seeded } from '../src/engine/drills/random.js';

const EXAMS = ['tai2025A', 'tai2025X', 'tai2024A', 'tai2022', 'tai2019'].map((id) =>
  JSON.parse(readFileSync(new URL(`../src/data/exams/${id}.json`, import.meta.url))),
);
const ALL = EXAMS.flatMap((e) =>
  e.parts.flatMap((p) => p.questions.map((q) => ({ ...q, examId: e.id, examTitle: e.title, partId: p.id, partTitle: p.title }))),
);

test('el reparto por bloques suma 80 preguntas', () => {
  assert.equal(Object.values(REPARTO).reduce((a, b) => a + b, 0), 80);
});

for (const supuesto of ['supuesto1', 'supuesto2']) {
  test(`simulacro mezclado con ${supuesto}`, () => {
    const rng = seeded(supuesto.length);
    const seen = new Set();
    for (let i = 0; i < 50; i++) {
      const { title, questions } = buildMixedExam(ALL, EXAMS, { supuesto, rng });
      const first = questions.filter((q) => q.partId === 'primera');
      const main = first.filter((q) => !q.reserve);
      const reserves = first.filter((q) => q.reserve);
      assert.equal(main.length, 80);
      assert.equal(reserves.length, RESERVAS);
      for (const [b, n] of Object.entries(REPARTO)) assert.equal(main.filter((q) => q.tema.startsWith(`B${b}`)).length, n);
      assert.equal(new Set(questions.map((q) => q.id)).size, questions.length, 'sin repetidas');
      assert.ok(first.every((q) => q.answer && !q.annulled), 'sin anuladas en la primera parte');
      assert.deepEqual(main.map((q) => q.seq), Array.from({ length: 80 }, (_, k) => k + 1));
      const second = questions.filter((q) => q.partId !== 'primera');
      assert.ok(second.length >= 20 && second.every((q) => q.partId === supuesto && q.examId === second[0].examId));
      assert.match(title, new RegExp(EXAMS.find((e) => e.id === second[0].examId).title));
      // Se corrige igual que un examen real: 80 + las preguntas del supuesto.
      const r = scoreExam(questions, Object.fromEntries(questions.map((q) => [q.id, q.answer])), 1 / 3);
      assert.equal(r.parts.primera.total, 80);
      seen.add(main.map((q) => q.id).join());
    }
    assert.equal(seen.size, 50, 'cada simulacro es distinto');
  });
}
