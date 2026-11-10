import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createShell } from '../src/engine/terminal/shell.js';
import { fsUsage, cronLineError } from '../src/engine/terminal/sysadmin.js';
import { parseYaml } from '../src/engine/terminal/yaml.js';

const out = (sh) => sh.screen.map((s) => s.text).join('\n');

test('lvextend amplía el volumen pero df no cambia hasta xfs_growfs', () => {
  const sh = createShell({ dirs: ['/datos'], setup: (s) => {
    s.storage.pvs.push({ dev: '/dev/sdb', vg: 'vg', size: 100 });
    s.storage.lvs.push({ vg: 'vg', name: 'lv', size: 50 });
    s.storage.fss.push({ dev: '/dev/mapper/vg-lv', type: 'xfs', size: 50, used: 10, mount: '/datos' });
  } });
  assert.equal(sh.run('lvextend -L +10G /dev/vg/lv').code, 5, 'sin sudo falla');
  assert.equal(sh.run('sudo lvextend -L 200G /dev/vg/lv').code, 5, 'no hay tanto espacio libre');
  assert.equal(sh.run('sudo lvextend -L +30G vg/lv').code, 0);
  assert.equal(fsUsage(sh, '/datos').size, 50);
  assert.equal(sh.run('sudo resize2fs /dev/mapper/vg-lv').code, 1, 'resize2fs no sirve para XFS');
  assert.equal(sh.run('sudo xfs_growfs /datos').code, 0);
  assert.equal(fsUsage(sh, '/datos').size, 80);
  assert.equal(sh.run('sudo lvextend -r -l +100%FREE /dev/mapper/vg-lv').code, 0);
  assert.equal(fsUsage(sh, '/datos').size, 100);
});

test('fsck: se niega con el disco montado, pregunta sin -y y repara con -y', () => {
  const sh = createShell({ setup: (s) => s.storage.fss.push({ dev: '/dev/sdc1', type: 'ext4', size: 10, used: 1, mount: '/srv', errors: 2 }) });
  assert.equal(sh.run('sudo fsck -y /dev/sdc1').code, 8);
  sh.run('sudo umount /srv');
  assert.equal(sh.run('sudo fsck /dev/sdc1').code, 4);
  assert.equal(sh.run('sudo fsck -m /dev/sdc1').code, 16, 'la -m del examen no existe');
  assert.equal(sh.run('sudo fsck -y /dev/sdc1').code, 1);
  assert.equal(sh.run('sudo fsck -y /dev/sdc1').code, 0, 'ya está limpio');
});

test('du y df ven el espacio de los ficheros grandes y lo liberan al vaciarlos', () => {
  const sh = createShell({ files: { '/var/log/enorme.log': { content: 'x\n', size: 5 * 1024 ** 3 } } });
  const before = fsUsage(sh, '/var').used;
  sh.run('du -sh /var/log/enorme.log');
  assert.match(sh.log.at(-1).out, /^5G\t/);
  sh.run('sudo truncate -s 0 /var/log/enorme.log');
  assert.ok(before - fsUsage(sh, '/var').used > 4.9);
});

test('ping, traceroute y nombres', () => {
  const sh = createShell();
  assert.equal(sh.run('ping -c 2 db01').code, 0);
  assert.match(sh.log.at(-1).out, /2 packets transmitted, 2 received/);
  assert.equal(sh.run('ping -c 1 8.8.8.8').code, 1, 'sin respuesta: 100 % de pérdida');
  assert.equal(sh.run('ping noexiste').code, 2);
  sh.run('traceroute 10.30.20.30');
  assert.match(sh.log.at(-1).out, /1 {2}172\.19\.50\.2 .*\n 2 {2}db01/);
  assert.equal(sh.run('tracert 10.30.20.30').code, 127);
});

test('un servicio no arranca si otro proceso tiene su puerto, y kill lo arregla', () => {
  const sh = createShell({
    services: { app: { description: 'App', active: false, enabled: true, port: 9000 } },
    procs: [{ pid: 3001, user: 'nginx', cmd: 'nc -l 9000', cpu: 0, mem: 0, port: 9000, ignoresTerm: true }],
  });
  assert.equal(sh.run('sudo systemctl start app').code, 1);
  sh.run('journalctl -u app -p err');
  assert.match(sh.log.at(-1).out, /Address already in use/);
  assert.equal(sh.run('kill 3001').code, 1, 'un proceso de otro usuario necesita sudo');
  sh.run('sudo kill 3001');
  assert.ok(sh.procs.length === 1, 'ignora SIGTERM');
  sh.run('sudo kill -9 3001');
  assert.equal(sh.procs.length, 0);
  assert.equal(sh.run('sudo systemctl start app').code, 0);
});

test('dnf en RHEL, apt solo en Debian/Ubuntu y apt-get install necesita update', () => {
  const sh = createShell();
  assert.equal(sh.run('apt install curl').code, 127);
  assert.equal(sh.run('sudo dnf install -y noexiste').code, 1);
  sh.run('sudo dnf install -y httpd');
  assert.ok(sh.services.httpd, 'instalar httpd crea su servicio');
  const deb = createShell({ distro: 'debian' });
  assert.equal(deb.run('sudo apt-get install -y curl').code, 100);
  deb.run('sudo apt-get update');
  assert.equal(deb.run('sudo apt-get install -y curl').code, 0);
});

test('crontab valida los campos', () => {
  assert.equal(cronLineError('30 2 * * * /bin/true'), null);
  assert.equal(cronLineError('*/15 9-17 * * 1-5 /bin/true'), null);
  assert.match(cronLineError('60 2 * * * /bin/true'), /minute/);
  assert.match(cronLineError('30 2 * * /bin/true'), /faltan|bad/);
  const sh = createShell();
  assert.equal(sh.run('echo "99 2 * * * x" | crontab -').code, 1);
  assert.equal(sh.run('crontab -l').code, 1);
});

test('YAML: sangría, listas de mapas, comentarios y errores', () => {
  const doc = parseYaml('# app\nservices:\n  web:\n    image: "nginx:1.27"  # comentario\n    ports:\n    - "80:80"\n    environment:\n      - A=1\n  db: {image: mysql}\nvolumes: [datos]\n');
  assert.deepEqual(doc.services.web, { image: 'nginx:1.27', ports: ['80:80'], environment: ['A=1'] });
  assert.equal(doc.services.db.image, 'mysql');
  assert.deepEqual(doc.volumes, ['datos']);
  assert.deepEqual(parseYaml('a:\n  - x: 1\n    y: 2\n  - z\n').a, [{ x: '1', y: '2' }, 'z']);
  assert.throws(() => parseYaml('a:\n\tb: 1\n'), /tab/);
  assert.throws(() => parseYaml('a: 1\na: 2\n'), /already defined/);
});

test('docker build: COPY de carpeta copia su contenido, CMD se ejecuta al arrancar', () => {
  const H = '/home/alumno';
  const sh = createShell({ cwd: `${H}/app`, files: {
    [`${H}/app/Dockerfile`]: 'FROM ubuntu\nWORKDIR /app\nCOPY src/ .\nENV SALUDO=hola\nCMD ["cat", "mensaje.txt"]\n',
    [`${H}/app/src/mensaje.txt`]: 'hola desde la imagen\n',
    [`${H}/app/Malo`]: 'FROM ubuntu\nRUNN echo x\n',
  } });
  assert.equal(sh.run('docker build -t app .').code, 0, out(sh));
  sh.run('docker run --name a app');
  assert.match(sh.run('docker logs a').out, /hola desde la imagen/);
  assert.equal(sh.run('docker build -f Malo .').code, 1);
  assert.match(sh.log.at(-1).err, /unknown instruction: RUNN/);
  assert.equal(sh.run('docker build -t x').code, 1, 'falta el contexto');
});

test('docker compose: depends_on, nombres, recreación y down', () => {
  const H = '/home/alumno';
  const sh = createShell({ cwd: `${H}/proy`, files: {
    [`${H}/proy/docker-compose.yml`]: 'version: "3.8"\nservices:\n  web:\n    image: nginx\n    ports: ["8081:80"]\n    depends_on: [cache]\n  cache:\n    image: alpine\n    command: sleep infinity\n',
  } });
  const r = sh.run('docker-compose up -d');
  assert.equal(r.code, 0, out(sh));
  assert.match(r.out, /Container proy-cache-1 +Started\n ✔ Container proy-web-1 +Started/);
  assert.match(out(sh), /attribute `version` is obsolete/);
  assert.equal(sh.docker.containers.filter((c) => c.status === 'running').length, 2);
  assert.match(sh.run('docker compose up -d').out, /Running/);
  assert.equal(sh.run('docker compose logs noexiste').code, 1);
  sh.run('docker compose down');
  assert.equal(sh.docker.containers.length, 0);
  assert.equal(sh.docker.networks.length, 0);
  sh.run('cd /tmp');
  assert.match(sh.run('docker compose up -d').err, /no configuration file provided/);
});
