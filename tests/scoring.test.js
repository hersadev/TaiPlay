import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scoreExam } from '../src/utils/scoring.js';

const q = (id, answer, extra = {}) => ({ id, answer, partId: 'p', topic: 't', reserve: false, ...extra });

test('penalización por error y blancos', () => {
  const qs = [q('1', 'a'), q('2', 'b'), q('3', 'c'), q('4', 'd')];
  const r = scoreExam(qs, { 1: 'a', 2: 'b', 3: 'a' }, 1 / 3);
  assert.equal(r.correct, 2);
  assert.equal(r.wrong, 1);
  assert.equal(r.blank, 1);
  assert.ok(Math.abs(r.net - (2 - 1 / 3)) < 1e-9);
});

test('las reservas sustituyen a las anuladas, en orden', () => {
  const qs = [
    q('1', 'a'),
    q('2', null, { annulled: true }),
    q('r1', null, { reserve: true, annulled: true }),
    q('r2', 'b', { reserve: true }),
    q('r3', 'c', { reserve: true }),
  ];
  const r = scoreExam(qs, { 1: 'a', r2: 'b', r3: 'a' }, 0);
  assert.deepEqual(r.countedIds, ['1', 'r2']);
  assert.equal(r.correct, 2);
  assert.equal(r.total, 2);
});
