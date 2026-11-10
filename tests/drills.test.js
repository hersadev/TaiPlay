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

// --- Ejercicios de cálculo: numeración, almacenamiento, IPv6, puertos y crontab.

test('bases: formas equivalentes de escribir un número', () => {
  const hex = { fields: [{ key: 'v', type: 'hex', answer: '2C' }] };
  for (const ok of ['2C', '2c', '0x2C', '002C', '2Ch']) assert.ok(checkExercise(hex, { v: ok }).ok, ok);
  assert.ok(!checkExercise(hex, { v: '2G' }).ok);
  const bin = { fields: [{ key: 'v', type: 'bin', answer: '00101100' }] };
  for (const ok of ['101100', '0010 1100', '0b101100']) assert.ok(checkExercise(bin, { v: ok }).ok, ok);
  assert.ok(!checkExercise(bin, { v: '101102' }).ok);
});

test('bases y bits: la solución cuadra con el cálculo de JavaScript', () => {
  const rng = seeded(7);
  for (let i = 0; i < 300; i++) {
    const a = makeExercise('a-decimal', rng);
    const [, shown, base] = [null, a.prompt.match(/\*\*([0-9A-F ]+)\*\*/)[1].replace(/ /g, ''), a.prompt.includes('binario') ? 2 : a.prompt.includes('octal') ? 8 : 16];
    assert.equal(a.fields[0].answer, parseInt(shown, base));
    const b = makeExercise('bits', rng);
    const m = b.prompt.match(/\*\*([01]{8}) (AND|OR|XOR) ([01]{8})\*\*/);
    if (m) {
      const [x, y] = [parseInt(m[1], 2), parseInt(m[3], 2)];
      const r = { AND: x & y, OR: x | y, XOR: x ^ y }[m[2]];
      assert.equal(parseInt(b.fields[0].answer, 2), r);
    }
  }
});

test('IPv6: abreviar y expandir son inversos y siguen la RFC 5952', async () => {
  const { expandIpv6, compressIpv6 } = await import('../src/engine/drills/ipv6.js');
  const full = (s) => expandIpv6(s).join(':');
  assert.equal(compressIpv6(expandIpv6('2001:0db8:0000:0000:0000:0000:0000:0001')), '2001:db8::1');
  assert.equal(compressIpv6(expandIpv6('2001:db8:0:0:1:0:0:1')), '2001:db8::1:0:0:1'); // empate: la primera
  assert.equal(compressIpv6(expandIpv6('2001:db8:0:1:2:3:4:5')), '2001:db8:0:1:2:3:4:5'); // un solo 0 no se comprime
  assert.equal(compressIpv6(expandIpv6('::')), '::');
  assert.equal(full('fe80::1'), 'fe80:0000:0000:0000:0000:0000:0000:0001');
  for (const bad of ['1::2::3', '2001:db8', '12345::', '2001:db8:0:0:0:0:0:0:1', 'g::1']) assert.equal(expandIpv6(bad), null, bad);
  const ex = { fields: [{ key: 'v', type: 'ipv6short', answer: '2001:db8::1:0:0:1' }] };
  assert.ok(checkExercise(ex, { v: '2001:DB8::1:0:0:1' }).ok);
  assert.ok(checkExercise(ex, { v: '2001:db8:0:0:1::1' }).ok, 'la otra racha, igual de corta');
  assert.ok(!checkExercise(ex, { v: '2001:db8:0:0:1:0:0:1' }).ok, 'sin abreviar');
  const rng = seeded(3);
  for (let i = 0; i < 300; i++) {
    const e = makeExercise('ipv6-expandir', rng);
    const short = e.prompt.match(/\*\*([0-9a-f:]+)\*\*/)[1];
    assert.equal(full(short), e.fields[0].answer);
  }
});

test('puertos: cada puerto una vez y las opciones no se repiten', async () => {
  const { PUERTOS } = await import('../src/engine/drills/puertos.js');
  assert.equal(new Set(PUERTOS.map((p) => p.port)).size, PUERTOS.length);
  const rng = seeded(5);
  for (let i = 0; i < 300; i++) {
    const e = makeExercise('puerto-servicio', rng);
    assert.equal(new Set(e.choices).size, 4);
    assert.ok(e.choices.includes(e.fields[0].answer));
  }
});

test('crontab: descripciones, opciones distintas y respuestas equivalentes', async () => {
  const { describeCron } = await import('../src/engine/drills/crontab.js');
  assert.equal(describeCron({ min: '0', hour: '5', dom: '8', mon: '11', dow: '*' }), 'A las 05:00, el día 8 de noviembre');
  assert.equal(describeCron({ min: '30', hour: '2', dom: '*', mon: '*', dow: '1-5' }), 'A las 02:30, de lunes a viernes');
  assert.equal(describeCron({ min: '*/15', hour: '*', dom: '*', mon: '*', dow: '*' }), 'Cada 15 minutos, todos los días');
  const ex = { fields: [{ key: 'c', type: 'cron', answer: '5 0 * * 0' }] };
  for (const ok of ['5 0 * * 0', '05 00 * * 7', '5 0 * * 0 /root/copia.sh', '  5   0 * * 0 ']) assert.ok(checkExercise(ex, { c: ok }).ok, ok);
  for (const bad of ['0 5 * * 0', '5 0 * *', '5 0 * * lunes']) assert.ok(!checkExercise(ex, { c: bad }).ok, bad);
  const rng = seeded(9);
  for (let i = 0; i < 300; i++) {
    const e = makeExercise('cron-leer', rng);
    assert.equal(new Set(e.choices).size, 4, e.prompt);
    assert.ok(e.choices.includes(e.fields[0].answer));
  }
});

test('RAID y unidades: cifras de referencia', () => {
  const rng = seeded(11);
  for (let i = 0; i < 300; i++) {
    const e = makeExercise('raid', rng);
    const [, level, n, size] = e.prompt.match(/RAID (\d+)\*\* con \*\*(\d+) discos de (\d+) TB/).map(Number);
    const cap = { 0: n * size, 1: size, 5: (n - 1) * size, 6: (n - 2) * size, 10: (n * size) / 2 }[level];
    const fail = { 0: 0, 1: n - 1, 5: 1, 6: 2, 10: 1 }[level];
    assert.deepEqual([e.fields[0].answer, e.fields[1].answer], [cap, fail], e.prompt);
    assert.ok(Number.isInteger(makeExercise('unidades', rng).fields[0].answer));
    assert.ok(Number.isInteger(makeExercise('velocidad', rng).fields[0].answer));
  }
});
