import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeExercise, checkExercise, DRILL_KINDS } from '../src/engine/drills/index.js';
import { seeded } from '../src/engine/drills/random.js';
import { parsePrefix, networkOf, broadcastOf, hostsOf } from '../src/engine/drills/subnet.js';
import { toSymbolic } from '../src/engine/drills/permisos.js';

test('subnet: cálculos de referencia (los del examen)', () => {
  assert.equal(hostsOf(20), 4094);
  assert.equal(networkOf('10.30.16.77', 25), '10.30.16.0');
  assert.equal(broadcastOf('10.30.16.77', 25), '10.30.16.127');
  assert.equal(networkOf('192.168.123.71', 26), '192.168.123.64');
  assert.equal(networkOf('192.168.123.133', 26), '192.168.123.128');
  assert.equal(parsePrefix('/18'), 18);
  assert.equal(parsePrefix('255.255.192.0'), 18);
  assert.equal(parsePrefix('255.255.0.255'), null);
  assert.equal(toSymbolic('750'), 'rwxr-x---');
});

// Cada tipo, con muchas semillas: la solución propia se da por buena, una
// respuesta vacía no, y las cifras cuadran con un cálculo independiente.
for (const kind of Object.keys(DRILL_KINDS)) {
  test(`ejercicios «${kind}» coherentes`, () => {
    const rng = seeded(42);
    for (let i = 0; i < 300; i++) {
      const ex = makeExercise(kind, rng);
      const right = Object.fromEntries(ex.fields.map((f) => [f.key, String(f.answer)]));
      assert.ok(checkExercise(ex, right).ok, `${ex.prompt} → ${JSON.stringify(right)}`);
      assert.ok(!checkExercise(ex, {}).ok);
      assert.ok(ex.explain.length > 20);
      if (kind === 'red') {
        const [, ip, p] = ex.prompt.match(/\*\*([\d.]+)\/(\d+)\*\*/);
        const n = ip.split('.').reduce((a, o) => a * 256 + Number(o), 0);
        const size = 2 ** (32 - Number(p));
        const net = Math.floor(n / size) * size;
        const toIp = (x) => [24, 16, 8, 0].map((s) => Math.floor(x / 2 ** s) % 256).join('.');
        assert.equal(ex.fields[0].answer, toIp(net));
        assert.equal(ex.fields[1].answer, toIp(net + size - 1));
      }
      if (kind === 'n-subredes') {
        const n = Number(ex.prompt.match(/\*\*(\d+) subredes\*\*/)[1]);
        const base = Number(ex.prompt.match(/\/(\d+)\*\*/)[1]);
        const bits = Math.ceil(Math.log2(n));
        assert.equal(ex.fields[0].answer, base + bits);
      }
      if (kind === 'n-hosts') {
        const n = Number(ex.prompt.match(/\*\*(\d+) equipos\*\*/)[1]);
        const p = ex.fields[0].answer;
        assert.ok(2 ** (32 - p) - 2 >= n && 2 ** (31 - p) - 2 < n, `${n} → /${p}`);
      }
    }
  });
}

test('formas equivalentes de responder', () => {
  const ex = { fields: [{ key: 'p', type: 'prefix', answer: 26 }, { key: 'ip', type: 'ip', answer: '10.0.0.64' }] };
  assert.ok(checkExercise(ex, { p: '255.255.255.192', ip: ' 10.0.0.64 ' }).ok);
  assert.ok(checkExercise(ex, { p: '/26', ip: '10.0.0.064' }).ok);
  assert.ok(!checkExercise(ex, { p: '/25', ip: '10.0.0.64' }).ok);
  const perm = { fields: [{ key: 's', type: 'symbolic', answer: 'rw-r--r--' }] };
  assert.ok(checkExercise(perm, { s: '-rw-r--r--' }).ok);
});
