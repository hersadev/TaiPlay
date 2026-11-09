import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSwitch, parseIface } from '../src/engine/ios/ios.js';

const out = (sw, line) => {
  const from = sw.screen.length;
  sw.run(line);
  return sw.screen.slice(from + 1).map((l) => l.text).join('\n');
};

test('nombres de interfaz y abreviaturas', () => {
  assert.deepEqual(parseIface('gi1/0/3'), ['GigabitEthernet1/0/3']);
  assert.deepEqual(parseIface('GigabitEthernet 1/0/3'), ['GigabitEthernet1/0/3']);
  assert.deepEqual(parseIface('vlan 10'), ['Vlan10']);
  assert.equal(parseIface('range g1/0/1 - 3').length, 3);
  assert.equal(parseIface('fa0/1'), null);
  const sw = createSwitch({ hostname: 'SW1' });
  assert.equal(sw.prompt(), 'SW1>');
  sw.run('en');
  assert.equal(sw.prompt(), 'SW1#');
  sw.run('conf t');
  assert.equal(sw.prompt(), 'SW1(config)#');
  sw.run('int range gi1/0/1 - 2');
  assert.equal(sw.prompt(), 'SW1(config-if-range)#');
  sw.run('vlan 30');
  assert.equal(sw.prompt(), 'SW1(config-vlan)#', 'las órdenes globales valen en los submodos');
  sw.run('end');
  assert.equal(sw.prompt(), 'SW1#');
});

test('errores al estilo IOS', () => {
  const sw = createSwitch({ hostname: 'SW1' });
  assert.match(out(sw, 'configure terminal'), /Invalid input[\s\S]*enable/);
  sw.run('enable');
  assert.match(out(sw, 'co'), /Ambiguous/);
  assert.match(out(sw, 'configure'), /Incomplete/);
  sw.run('conf t');
  assert.match(out(sw, 'show vlan brief'), /antepón «do»/);
  sw.run('int gi1/0/1');
  assert.match(out(sw, 'switchport port-security'), /dynamic port/);
  assert.match(out(sw, 'switchport access vlan 40'), /Creating vlan 40/);
  assert.equal(sw.vlans[40].name, 'VLAN0040');
});

test('SVI, helper, troncal, sticky y guardado', () => {
  const sw = createSwitch({ hostname: 'SW1', connected: { 'gi1/0/1': { mac: '0050.7966.6801' }, 'gi1/0/24': {} } });
  for (const l of ['en', 'conf t', 'vlan 10', 'int gi1/0/1', 'sw mo acc', 'sw acc vl 10', 'sw port-sec', 'sw port-sec mac sticky', 'int vlan 10', 'ip add 10.30.16.1 255.255.255.128', 'ip helper 10.30.20.5', 'no sh', 'int gi1/0/24', 'sw mo tr', 'sw tr all vl 10,20']) {
    assert.ok(sw.run(l).ok, l);
  }
  const run = out(sw, 'do sh run');
  assert.match(run, /interface Vlan10\n ip address 10.30.16.1 255.255.255.128\n ip helper-address 10.30.20.5/);
  assert.match(run, /switchport port-security mac-address sticky 0050.7966.6801/);
  assert.match(out(sw, 'do sh int trunk'), /Gi1\/0\/24\s+10,20/);
  assert.match(out(sw, 'do sh ip int br'), /Vlan10\s+10.30.16.1\s+YES manual up\s+up/);
  assert.ok(!sw.saved());
  sw.run('do wr');
  assert.ok(sw.saved());
  sw.run('int gi1/0/2');
  sw.run('shutdown');
  assert.ok(!sw.saved());
  assert.match(out(sw, 'end'), /Configured from console/);
  assert.match(out(sw, 'copy run start'), /\[OK\]/);
  assert.ok(sw.saved());
});

test('Tab y ?', () => {
  const sw = createSwitch();
  assert.deepEqual(sw.complete('en'), { line: 'enable ' });
  sw.run('enable');
  assert.deepEqual(sw.complete('sh vl'), { line: 'sh vlan ' });
  assert.match(out(sw, 'show ?'), /running-config/);
});
