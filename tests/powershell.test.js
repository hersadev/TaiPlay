import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPowerShell, psNode } from '../src/engine/powershell/ps.js';

test('parámetros: abreviaturas, ambigüedad y los que no existen', () => {
  const ps = createPowerShell({ os: 'win11', files: { 'C:\\A\\x.txt': 'x' } });
  assert.equal(ps.run('Copy-Item C:\\A\\* C:\\Users -Recursive').ok, false);
  assert.match(ps.screen.at(-1).text, /No se encuentra ningún parámetro que coincida con el nombre del parámetro 'Recursive'/);
  assert.equal(ps.run('Copy-Item C:\\A C:\\B -Rec').ok, true);
  assert.ok(psNode(ps, 'c:\\b\\X.TXT'), 'las rutas no distinguen mayúsculas');
  assert.equal(ps.run('Copy-Item C:\\A C:\\C -P').ok, false);
  assert.match(ps.screen.at(-1).text, /es ambiguo.*-Path -PassThru/);
  assert.equal(ps.run('Copy-Path a b').ok, false);
});

test('Copy-Item: con \\* copia el contenido, sin él la carpeta, y sin -Recurse no entra', () => {
  const files = { 'C:\\A\\f.txt': 'f', 'C:\\A\\sub\\g.txt': 'g' };
  const a = createPowerShell({ os: 'win11', files, dirs: ['C:\\B'] });
  a.run('Copy-Item -Path "C:\\A\\*" -Destination "C:\\B" -Recurse');
  assert.ok(psNode(a, 'C:\\B\\sub\\g.txt') && !psNode(a, 'C:\\B\\A'));
  const b = createPowerShell({ os: 'win11', files, dirs: ['C:\\B'] });
  b.run('Copy-Item C:\\A C:\\B -Recurse');
  assert.ok(psNode(b, 'C:\\B\\A\\sub\\g.txt'));
  const c = createPowerShell({ os: 'win11', files, dirs: ['C:\\B'] });
  c.run('Copy-Item C:\\A\\* C:\\B');
  assert.ok(psNode(c, 'C:\\B\\f.txt') && psNode(c, 'C:\\B\\sub') && !psNode(c, 'C:\\B\\sub\\g.txt'));
});

test('netsh: elevación, sintaxis del examen y contexto antiguo', () => {
  const ps = createPowerShell({ os: 'win11' });
  const add = 'netsh advfirewall firewall add rule name="Puerto8443" dir=in action=allow protocol=TCP localport=8443';
  assert.match(ps.run(add).out, /requiere elevación/);
  ps.run('Start-Process powershell -Verb RunAs');
  for (const wrong of [
    'netsh advfirewall firewall create rule name="Puerto8443" dir=in action=permit protocol=TCP localport=8443',
    'netsh advfirewall set rule name="Puerto8443" dir=in action=allow protocol=TCP localport=8443',
    'netsh advfirewall firewall add rule name="Puerto8443" dir=in action=permit protocol=TCP localport=8443',
  ]) {
    ps.run(wrong);
    assert.equal(ps.state.firewall.rules.some((r) => r.name === 'Puerto8443'), false, wrong);
  }
  assert.match(ps.run('netsh firewall add portopening TCP 8443 "Puerto8443"').out, /en desuso/);
  assert.equal(ps.run(add).out, 'Aceptar.\n\n');
  assert.ok(ps.state.firewall.rules.some((r) => r.name === 'Puerto8443' && r.localport === '8443'));
});

test('roles: Get-WindowsFeature solo en Server y la promoción necesita el rol', () => {
  assert.equal(createPowerShell({ os: 'win11' }).run('Get-WindowsFeature').ok, false);
  const ps = createPowerShell();
  assert.equal(ps.run('Install-ADDSDomainController -DomainName tai.local').ok, false, 'sin el rol, el cmdlet no existe');
  ps.run('Install-WindowsFeature AD-Domain-Services');
  assert.equal(ps.run('Install-ADDSDomainController -DomainName tai.local').ok, true);
  assert.equal(ps.state.ad.role, 'dc');
});

test('sfc necesita administrador y DISM antes si el almacén está dañado', () => {
  const user = createPowerShell({ os: 'win11' });
  assert.match(user.run('sfc /scannow').out, /Debe ser administrador/);
  const ps = createPowerShell({ setup: (st) => Object.assign(st.sfc, { corrupt: ['x'], storeCorrupt: true }) });
  assert.match(ps.run('sfc /scannow').out, /no pudo\ncorregir/);
  ps.run('DISM /Online /Cleanup-Image /RestoreHealth');
  assert.match(ps.run('sfc /scannow').out, /los reparó/);
  assert.match(ps.run('sfc /scannow').out, /ninguna infracción/);
});

test('alias, listas con comas, comentarios y comillas tipográficas', () => {
  const ps = createPowerShell();
  assert.equal(ps.run('Get-Service DNS, NTDS').ok, false, 'no existen todavía');
  assert.match(ps.run('gsv W32Time, Spooler').out, /W32Time[\s\S]*Spooler/);
  assert.equal(ps.run('ls # comentario').ok, true);
  assert.match(ps.run('echo “hola”').out, /^hola/);
  assert.match(ps.run('Get-Command *Firewall*').out, /New-NetFirewallRule/);
});
