import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createShell, readHostFile, hostNode } from '../src/engine/terminal/shell.js';
import { parse } from '../src/engine/terminal/parse.js';
import { applyMode, inSubnet } from '../src/engine/terminal/commands.js';

const run = (sh, line) => sh.run(line);

test('parse: comillas, tuberías, redirecciones y &&', () => {
  const steps = parse('echo "hola mundo" | grep hola > salida.txt && cat salida.txt');
  assert.equal(steps.length, 2);
  assert.deepEqual(steps[0].pipeline[0].argv, ['echo', 'hola mundo']);
  assert.deepEqual(steps[0].pipeline[1].redirect, { append: false, target: 'salida.txt' });
  assert.equal(steps[1].op, '&&');
  assert.throws(() => parse('echo "sin cerrar'));
  assert.throws(() => parse('| grep x'));
});

test('navegación y ficheros', () => {
  const sh = createShell();
  assert.equal(run(sh, 'pwd').out, '/home/alumno\n');
  run(sh, 'mkdir -p proyectos/web/css');
  run(sh, 'cd proyectos/web');
  assert.equal(sh.ctx.cwd, '/home/alumno/proyectos/web');
  run(sh, 'echo "linea 1" > notas.txt');
  run(sh, 'echo "linea 2" >> notas.txt');
  assert.equal(readHostFile(sh, '/home/alumno/proyectos/web/notas.txt'), 'linea 1\nlinea 2\n');
  assert.equal(run(sh, 'cat notas.txt | wc -l').out, '2\n');
  run(sh, 'cd ..');
  run(sh, 'cp -r web copia && mv copia/notas.txt ~/n.txt');
  assert.ok(hostNode(sh, '/home/alumno/n.txt'));
  assert.equal(run(sh, 'rmdir web').code, 1);
  run(sh, 'rm -r web');
  assert.equal(hostNode(sh, '/home/alumno/proyectos/web'), null);
  run(sh, 'cd');
  assert.equal(sh.ctx.cwd, '/home/alumno');
});

test('permisos, sudo y scripts', () => {
  const sh = createShell({ files: { '/home/alumno/hola.sh': '#!/bin/bash\necho hola desde el script' } });
  assert.match(run(sh, 'touch /etc/prueba').err, /Permiso denegado/);
  assert.equal(run(sh, 'sudo touch /etc/prueba').code, 0);
  assert.match(run(sh, './hola.sh').err, /Permiso denegado/);
  run(sh, 'chmod +x hola.sh');
  assert.equal(run(sh, './hola.sh').out, 'hola desde el script\n');
  run(sh, 'chmod 000 hola.sh');
  assert.match(run(sh, 'cat hola.sh').err, /Permiso denegado/);
  assert.equal(applyMode('644', 'u+x'), '744');
  assert.equal(applyMode('755', 'go-rx'), '700');
  assert.equal(applyMode('644', '755'), '755');
});

test('head, tail, grep, find, tar', () => {
  const log = Array.from({ length: 20 }, (_, i) => `${i % 3 === 0 ? 'ERROR' : 'INFO'} evento ${i + 1}`).join('\n') + '\n';
  const sh = createShell({ files: { '/home/alumno/app.log': log } });
  assert.equal(run(sh, 'head -n 2 app.log').out, 'ERROR evento 1\nINFO evento 2\n');
  assert.equal(run(sh, 'tail -3 app.log').out, 'ERROR evento 19\nINFO evento 20\n'.replace(/^/, 'INFO evento 18\n'));
  assert.match(run(sh, 'tail -f app.log').out, /Ctrl\+C/);
  assert.equal(run(sh, 'grep -c ERROR app.log').out, '7\n');
  assert.equal(run(sh, 'grep -i error app.log | wc -l').out, '7\n');
  assert.equal(run(sh, 'find . -name "*.log"').out, './app.log\n');
  run(sh, 'tar -czf backup.tar.gz app.log');
  run(sh, 'rm app.log');
  run(sh, 'tar -xzf backup.tar.gz');
  assert.equal(readHostFile(sh, '/home/alumno/app.log'), log);
});

test('systemctl, ip, ss y uname', () => {
  const sh = createShell();
  assert.match(run(sh, 'systemctl enable nginx').err, /Access denied/);
  run(sh, 'sudo systemctl enable nginx');
  run(sh, 'sudo systemctl start nginx');
  assert.equal(sh.services.nginx.enabled, true);
  assert.match(run(sh, 'ss -ltn').out, /0\.0\.0\.0:80 /);
  assert.match(run(sh, 'ip route get 10.30.20.30').out, /via 172\.19\.50\.2 dev eth0/);
  assert.match(run(sh, 'ip route show').out, /^default via 172\.19\.50\.1/);
  assert.equal(run(sh, 'uname -r').out, '4.18.0-477.10.1.el8_8.x86_64\n');
  assert.ok(inSubnet('10.30.20.30', '10.30.16.0/20'));
  assert.ok(!inSubnet('10.30.32.1', '10.30.16.0/20'));
});

test('docker: ciclo de vida completo', () => {
  const sh = createShell();
  assert.match(run(sh, 'docker images').out, /^REPOSITORY/);
  run(sh, 'docker pull nginx');
  assert.equal(sh.docker.images.length, 1);
  const r = run(sh, 'docker run -d --name web -p 8080:80 nginx');
  assert.match(r.out, /^[0-9a-f]{64}\n$/);
  const web = sh.docker.containers[0];
  assert.equal(web.status, 'running');
  assert.equal(web.name, 'web');
  assert.match(run(sh, 'docker ps').out, /0\.0\.0\.0:8080->80\/tcp\s+web/);
  assert.match(run(sh, 'docker exec web cat /usr/share/nginx/html/index.html').out, /Welcome to nginx/);
  // por prefijo de ID, como en el examen («docker kill 3f7»)
  run(sh, `docker kill ${web.id.slice(0, 3)}`);
  assert.equal(web.status, 'exited');
  assert.equal(web.exitCode, 137);
  assert.match(run(sh, 'docker rmi nginx').err, /must force/);
  run(sh, 'docker rm web');
  assert.equal(sh.docker.containers.length, 0);
  run(sh, 'docker rmi nginx');
  assert.equal(sh.docker.images.length, 0);
});

test('docker: run descarga si falta, -it entra y exit sale', () => {
  const sh = createShell();
  const r = run(sh, 'docker run hello-world');
  assert.match(r.out, /Unable to find image 'hello-world:latest' locally/);
  assert.match(r.out, /Hello from Docker!/);
  run(sh, 'docker run -it --name caja ubuntu bash');
  assert.equal(sh.prompt().startsWith('root@'), true);
  run(sh, 'touch /tmp/dentro');
  assert.match(run(sh, 'docker ps').err, /orden no encontrada/);
  run(sh, 'exit');
  assert.equal(sh.ctx, sh.hostCtx);
  assert.equal(sh.docker.containers.find((c) => c.name === 'caja').status, 'exited');
  // mysql sin contraseña se para con error en los logs
  run(sh, 'docker run -d --name db mysql');
  assert.equal(sh.docker.containers.find((c) => c.name === 'db').status, 'exited');
  assert.match(run(sh, 'docker logs db').out, /MYSQL_ROOT_PASSWORD/);
  // puerto ocupado
  run(sh, 'docker run -d -p 8080:80 nginx');
  assert.match(run(sh, 'docker run -d -p 8080:80 nginx').err, /port is already allocated/);
});

test('seguridad: sha256sum, md5sum y -c', async () => {
  const { createHash } = await import('node:crypto');
  const sh = createShell({ files: { '/home/alumno/a.txt': 'hola\n' } });
  const sum = createHash('sha256').update('hola\n').digest('hex');
  assert.equal(run(sh, 'sha256sum a.txt').out, `${sum}  a.txt\n`);
  assert.equal(run(sh, 'md5sum a.txt').out, `${createHash('md5').update('hola\n').digest('hex')}  a.txt\n`);
  assert.equal(run(sh, 'echo hola | sha256sum').out, `${sum}  -\n`);
  run(sh, 'sha256sum a.txt > SUMS');
  assert.equal(run(sh, 'sha256sum -c SUMS').code, 0);
  run(sh, 'echo adios > a.txt');
  const r = run(sh, 'sha256sum -c SUMS');
  assert.equal(r.code, 1);
  assert.match(r.out, /a.txt: FALLÓ/);
});

test('seguridad: find -perm, chown, firewall-cmd, nc y sysctl', () => {
  const sh = createShell({ files: { '/srv/x': { content: '', mode: '666' }, '/srv/y': { content: '', mode: '644' } } });
  assert.equal(run(sh, 'find /srv -perm -o+w').out, '/srv/x\n');
  assert.equal(run(sh, 'find /srv -perm 644').out, '/srv/y\n');
  assert.notEqual(run(sh, 'chown nginx /srv/y').code, 0);
  run(sh, 'sudo chown nginx:nginx /srv/y');
  assert.equal(hostNode(sh, '/srv/y').owner, 'nginx');
  assert.match(run(sh, 'ls -l /srv').out, /nginx {2}nginx/);

  assert.notEqual(run(sh, 'firewall-cmd --add-service=https').code, 0);
  run(sh, 'sudo firewall-cmd --permanent --add-service=https');
  assert.ok(!sh.firewall.runtime.services.includes('https'), '--permanent no toca lo que está en marcha');
  run(sh, 'sudo firewall-cmd --reload');
  assert.ok(sh.firewall.runtime.services.includes('https'));
  assert.match(run(sh, 'firewall-cmd --list-all').out, /services: .*https/);
  assert.equal(run(sh, 'sudo firewall-cmd --add-service=noexiste').code, 101);

  assert.equal(run(sh, 'nc -vz 10.30.20.30 3306').code, 0);
  assert.equal(run(sh, 'nc -vz 10.30.20.30 5432').code, 1);
  assert.equal(run(sh, 'nc -vz 8.8.8.8 53').code, 1);

  assert.equal(run(sh, 'sysctl net.ipv4.conf.all.rp_filter').out, 'net.ipv4.conf.all.rp_filter = 0\n');
  assert.notEqual(run(sh, 'sysctl -w net.ipv4.conf.all.rp_filter=1').code, 0);
  run(sh, 'sudo sysctl -w net.ipv4.conf.all.rp_filter=1');
  assert.equal(sh.sysctl['net.ipv4.conf.all.rp_filter'], '1');
});
