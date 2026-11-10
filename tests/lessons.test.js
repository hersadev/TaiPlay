import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createShell } from '../src/engine/terminal/shell.js';
import { ALL_LESSONS } from '../src/lessons/index.js';
import initSqlJs from 'sql.js';
import { createSqlDb } from '../src/engine/sql/db.js';
import { createSwitch } from '../src/engine/ios/ios.js';
import { createPowerShell } from '../src/engine/powershell/ps.js';
import { makeExercise } from '../src/engine/drills/index.js';
import { seeded } from '../src/engine/drills/random.js';

// Solución de referencia de cada lección de terminal: si alguna deja de
// completar sus objetivos (o alguno se cumple sin hacer nada), algo se ha
// roto en el motor o en los validadores.
const SOLUTIONS = {
  'lx-terminal': ['whoami', 'pwd', 'ls'],
  'lx-navegar': ['cd documentos', 'cd /var/log', 'cd', 'ls -a'],
  'lx-crear': ['mkdir -p proyecto/web/css', 'touch proyecto/web/index.html', 'rm basura.txt', 'rmdir vacia'],
  'lx-leer': ['cat LEEME.txt', 'head -n 5 app.log', 'tail -n 3 app.log', 'tail -f app.log'],
  'lx-copiar': ['cp config.txt copia_seguridad/', 'mv borrador.txt informe.txt', 'echo "uno" > diario.txt', 'echo "dos" >> diario.txt'],
  'lx-buscar': ['grep ERROR app.log', 'grep ERROR app.log | wc -l', 'grep ERROR app.log > errores.txt', 'find /etc -name "*.conf"'],
  'lx-permisos': ['ls -l', 'chmod +x backup.sh', './backup.sh', 'chmod 600 claves.txt', 'sudo touch /etc/taiplay.conf'],
  'lx-sistema': ['uname -r', 'sudo systemctl enable nginx', 'sudo systemctl start nginx', 'ss -ltn', 'ip route get 10.30.20.30', 'tar -czf config_backup.tar.gz /srv/app/config/'],
  'dk-imagenes': ['docker images', 'docker pull hello-world', 'docker pull nginx', 'docker images'],
  'dk-primer': ['docker run hello-world', 'docker ps -a', 'docker run -it ubuntu bash', 'ls', 'exit'],
  'dk-servicios': ['docker run -d --name web -p 8080:80 nginx', 'docker ps', 'docker logs web'],
  'dk-parar': (sh) => {
    const id = sh.docker.containers.find((c) => c.name !== 'web').id.slice(0, 4);
    return [`docker kill ${id}`, 'docker stop web', `docker rm web ${id}`, 'docker rmi nginx'];
  },
  'sg-bastionado': [
    'find /srv -perm -o+w',
    'sudo chmod o-w config/db.conf public/subir.php',
    'sudo chmod 600 config/db.conf',
    'chmod 600 ~/.ssh/id_rsa',
    'sudo chown -R nginx:nginx /srv/app/public',
  ],
  'sg-hashes': ['sha256sum microclaudia.zip', 'sha256sum -c SHA256SUMS', 'rm pilar.zip', 'echo hola | sha256sum', 'echo Hola | sha256sum', 'md5sum microclaudia.zip'],
  'sg-firewall': [
    'firewall-cmd --list-all',
    'sudo firewall-cmd --permanent --remove-service=telnet',
    'sudo firewall-cmd --permanent --add-service=https',
    'sudo firewall-cmd --permanent --add-service=http',
    'sudo firewall-cmd --reload',
    'nc -vz 10.30.20.30 3306',
    'sudo sysctl -w net.ipv4.conf.all.rp_filter=1',
  ],
  'lx-procesos': [
    'sudo systemctl start becas',
    'journalctl -u becas',
    'ss -ltnp',
    'kill 2211',
    'sudo systemctl start becas',
    'systemctl status becas',
    'ps aux --sort=-%cpu',
    'kill 2245',
  ],
  'lx-red': ['ping -c 3 172.19.50.1', 'ping -c 3 db01', 'traceroute 10.30.16.45', 'ss -ltn', 'sudo firewall-cmd --permanent --add-port=8443/tcp', 'sudo firewall-cmd --reload'],
  'lx-disco': ['df -h', 'du -sh /var/log/*', 'sudo truncate -s 0 /var/log/becas/debug.log', 'sudo mount /dev/sda8 /srv/profesores', 'sudo fsck -y /dev/sda8', 'sudo mount -a'],
  'lx-lvm': ['df -h /contenido', 'sudo vgs', 'sudo lvextend -L 600G /dev/vg_datos/lv_contenido', 'df -h /contenido', 'sudo xfs_growfs /contenido', 'df -h /contenido'],
  'lx-paquetes': ['dnf list installed rsync', 'sudo dnf install rsync', 'sudo dnf install -y rsync', 'echo "30 2 * * * /home/alumno/backup.sh" | crontab -', 'crontab -l'],
  'dk-build': [
    'cat Dockerfile',
    'docker build -t becas-web:1.0 .',
    'docker history becas-web:1.0',
    'docker run -d --name becas -p 8080:80 becas-web:1.0',
    'curl localhost:8080',
    'docker build -f Dockerfile.roto -t roto .',
  ],
  'dk-compose': [
    'docker compose up -d',
    'docker compose ps -a',
    'docker compose logs db',
    'echo "    environment:" >> compose.yaml',
    'echo "      MYSQL_ROOT_PASSWORD: Tai2026" >> compose.yaml',
    'docker compose up -d',
    'curl localhost:8080',
    'docker compose down',
  ],
  'dk-exec': [
    'docker exec web ls /usr/share/nginx/html',
    'docker exec -it web bash',
    'echo "<h1>Hola TAI</h1>" > /usr/share/nginx/html/index.html',
    'exit',
  ],
};

for (const lesson of ALL_LESSONS.filter((l) => l.type === 'terminal')) {
  test(`lección ${lesson.id} se puede completar`, () => {
    const sh = createShell(lesson.setup);
    assert.ok(
      lesson.objectives.every((o) => !o.check(sh)),
      'ningún objetivo debería cumplirse antes de empezar',
    );
    const sol = SOLUTIONS[lesson.id];
    assert.ok(sol, 'falta la solución de referencia en el test');
    // Como en la interfaz: los objetivos se evalúan tras cada orden y, una
    // vez conseguidos, se quedan conseguidos.
    const done = lesson.objectives.map(() => false);
    for (const line of typeof sol === 'function' ? sol(sh) : sol) {
      sh.run(line);
      lesson.objectives.forEach((o, i) => (done[i] ||= o.check(sh)));
    }
    const failing = lesson.objectives.filter((_, i) => !done[i]).map((o) => o.label);
    assert.deepEqual(failing, [], sh.screen.map((s) => s.text).join('\n'));
  });
}

const SQL_SOLUTIONS = {
  'sql-select': ['SELECT * FROM ALUMNO;', 'SELECT nombre, email FROM ALUMNO;', 'SELECT nombre FROM ALUMNO WHERE email IS NULL;'],
  'sql-filtros': [
    "SELECT * FROM MATRICULA WHERE estado = 'ACTIVA';",
    "SELECT nombre FROM ALUMNO WHERE fecha_nacimiento LIKE '2008%';",
    "SELECT * FROM CENTRO_EDUCATIVO WHERE provincia IN ('Madrid', 'Valencia');",
    'SELECT nombre, fecha_nacimiento FROM ALUMNO ORDER BY fecha_nacimiento DESC;',
  ],
  'sql-modificar': [
    "INSERT INTO CuerpoBecado (Codigo, Denominacion) VALUES ('TAI', 'Técnico Auxiliar de Informática');",
    'UPDATE SolicitudBeca SET IdEstado = 3 WHERE IdSolicitudBeca = 3;',
    "DELETE FROM FicheroAdjunto WHERE Denominacion = 'foto.png';",
    "DELETE FROM Interesado WHERE DocumentoIdentidad = '00000000T';",
  ],
  'sql-crear': [
    'CREATE TABLE Subsanacion (IdSubsanacion BIGINT PRIMARY KEY, IdSolicitudBeca BIGINT REFERENCES SolicitudBeca(IdSolicitudBeca), TextoFundamento VARCHAR(2000));',
    "INSERT INTO Subsanacion VALUES (1, 3, 'Falta el empadronamiento');",
    'CREATE UNIQUE INDEX idx_email ON Interesado (Email);',
  ],
  'sql-join': [
    'SELECT ALUMNO.nombre FROM ALUMNO INNER JOIN MATRICULA ON ALUMNO.id_alumno = MATRICULA.id_alumno;',
    'SELECT a.nombre, p.nombre FROM ALUMNO a JOIN MATRICULA m ON a.id_alumno = m.id_alumno JOIN PROGRAMA_FORMATIVO p ON p.id_programa = m.id_programa;',
    'SELECT a.nombre FROM ALUMNO a LEFT JOIN MATRICULA m ON a.id_alumno = m.id_alumno WHERE m.id_matricula IS NULL;',
  ],
  'sql-agrupar': [
    'SELECT COUNT(*) FROM ALUMNO;',
    'SELECT id_programa, COUNT(*) FROM MATRICULA GROUP BY id_programa;',
    "SELECT id_programa, COUNT(*) FROM MATRICULA WHERE estado = 'ACTIVA' GROUP BY id_programa HAVING COUNT(*) > 1;",
    'SELECT AVG(valor) FROM INDICADOR;',
  ],
  'sql-subconsultas': [
    "SELECT * FROM FicheroAdjunto WHERE Denominacion NOT LIKE '%.pdf' AND IdSolicitudBeca = (SELECT IdSolicitudBeca FROM SolicitudBeca WHERE AñoConvocatoria = 2024 AND IdInteresado = (SELECT IdInteresado FROM Interesado WHERE DocumentoIdentidad = '00000000T'));",
    'SELECT Nombre FROM Interesado WHERE IdInteresado IN (SELECT IdInteresado FROM SolicitudBeca WHERE IdEstado = 3);',
    'SELECT Nombre FROM Interesado WHERE IdInteresado NOT IN (SELECT IdInteresado FROM SolicitudBeca);',
  ],
  'sql-transacciones': [
    'BEGIN;',
    'DELETE FROM FicheroAdjunto;',
    'ROLLBACK;',
    "CREATE TRIGGER validar_cambio BEFORE UPDATE ON SolicitudBeca FOR EACH ROW WHEN NEW.AñoConvocatoria < 2020 BEGIN SELECT RAISE(ABORT, 'Año de convocatoria no válido'); END;",
    'UPDATE SolicitudBeca SET AñoConvocatoria = 2010 WHERE IdSolicitudBeca = 1;',
  ],
};

const IOS_SOLUTIONS = {
  'rd-ios-vlan': ['en', 'conf t', 'vlan 10', 'name ALUMNOS', 'vlan 20', 'name PROFESORES', 'int gi1/0/5', 'sw mo acc', 'sw acc vl 10', 'int range gi1/0/11 - 12', 'switchport mode access', 'switchport access vlan 20', 'do sh vlan br'],
  'rd-ios-svi': [
    'enable',
    'configure terminal',
    'ip routing',
    'interface vlan 10',
    'ip address 10.30.16.1 255.255.255.128',
    'ip helper-address 10.30.20.5',
    'no shutdown',
    'interface gi1/0/24',
    'switchport mode trunk',
    'switchport trunk allowed vlan 10,20',
    'interface gi1/0/1',
    'switchport port-security',
    'switchport port-security mac-address sticky',
    'end',
    'copy running-config startup-config',
  ],
};

for (const lesson of ALL_LESSONS.filter((l) => l.type === 'ios')) {
  test(`lección ${lesson.id} se puede completar`, () => {
    const sw = createSwitch(lesson.setup);
    assert.ok(lesson.objectives.every((o) => !o.check(sw)), 'ningún objetivo debería cumplirse antes de empezar');
    const sol = IOS_SOLUTIONS[lesson.id];
    assert.ok(sol, 'falta la solución de referencia en el test');
    const done = lesson.objectives.map(() => false);
    for (const line of sol) {
      const r = sw.run(line);
      assert.ok(r.ok, `${line}\n${sw.screen.map((x) => x.text).join('\n')}`);
      lesson.objectives.forEach((o, i) => (done[i] ||= o.check(sw)));
    }
    const failing = lesson.objectives.filter((_, i) => !done[i]).map((o) => o.label);
    assert.deepEqual(failing, []);
  });
}

// En PowerShell también hay líneas que deben fallar (para ver el error):
// se marcan con «!» delante.
const PS_SOLUTIONS = {
  'win-basico': ['Get-Location', 'ls', 'New-Item -Path Informes -ItemType Directory', 'New-Item -Path Informes\\notas.txt -ItemType File -Value "Oposición TAI"', 'Get-Command *-Item', 'Get-Alias ls'],
  'win-copiar': [
    'Get-Help Copy-Item',
    'Get-ChildItem C:\\DirectorioA -Recurse',
    '!Copy-Item “C:\\DirectorioA\\*” “C:\\DirectorioB” -Recursive',
    'Copy-Item -Path "C:\\DirectorioA\\*" -Destination "C:\\DirectorioB" -Recurse',
    'gci C:\\DirectorioB -Rec',
  ],
  'win-firewall': [
    'netsh advfirewall show allprofiles',
    '!netsh advfirewall firewall add rule name="Puerto8443" dir=in action=allow protocol=TCP localport=8443',
    'Start-Process powershell -Verb RunAs',
    '!netsh advfirewall firewall add rule name="Puerto8443" dir=in action=permit protocol=TCP localport=8443',
    'netsh advfirewall firewall add rule name="Puerto8443" dir=in action=allow protocol=TCP localport=8443',
    'netsh advfirewall firewall show rule name="Puerto8443"',
    'New-NetFirewallRule -DisplayName "Bloquear-Telnet" -Direction Outbound -Protocol TCP -RemotePort 23 -Action Block',
    'Test-NetConnection db01 -Port 3306',
  ],
  'win-dc': [
    'Get-WindowsFeature *AD*',
    '!Add-ADDSRole AD-Domain-Services -IncludeManagementTools',
    'Install-WindowsFeature -Name AD-Domain-Services -IncludeManagementTools',
    '!Install-ADDSForest -DomainName tai.local',
    'Install-ADDSDomainController -DomainName tai.local -InstallDns',
    'Get-Service NTDS, DNS',
  ],
  'win-replicacion': ['repadmin /replsummary', 'dcdiag /q', 'Get-Service DNS', '!repadmin /syncall /AdeP', 'Start-Service DNS', 'repadmin /syncall /AdeP', 'repadmin /replsummary'],
  'win-sfc': ['sfc /scannow', 'DISM /Online /Cleanup-Image /RestoreHealth', 'sfc /scannow'],
};

for (const lesson of ALL_LESSONS.filter((l) => l.type === 'powershell')) {
  test(`lección ${lesson.id} se puede completar`, () => {
    const ps = createPowerShell(lesson.setup);
    assert.ok(lesson.objectives.every((o) => !o.check(ps)), 'ningún objetivo debería cumplirse antes de empezar');
    const sol = PS_SOLUTIONS[lesson.id];
    assert.ok(sol, 'falta la solución de referencia en el test');
    const done = lesson.objectives.map(() => false);
    for (const raw of sol) {
      const mustFail = raw.startsWith('!');
      const r = ps.run(mustFail ? raw.slice(1) : raw);
      assert.equal(r.ok && !r.code, !mustFail, `${raw}\n${ps.screen.map((x) => x.text).join('\n')}`);
      lesson.objectives.forEach((o, i) => (done[i] ||= o.check(ps)));
    }
    const failing = lesson.objectives.filter((_, i) => !done[i]).map((o) => o.label);
    assert.deepEqual(failing, [], ps.screen.map((x) => x.text).join('\n'));
  });
}

// Las lecciones de ejercicios se completan acertando los que piden, y sus
// tipos existen y generan ejercicios con solución.
for (const lesson of ALL_LESSONS.filter((l) => l.type === 'drill')) {
  test(`lección ${lesson.id} se puede completar`, () => {
    const counts = {};
    assert.ok(lesson.objectives.every((o) => !o.check(counts)));
    const rng = seeded(3);
    for (const o of lesson.objectives) {
      for (let i = 0; i < o.need; i++) {
        const ex = makeExercise(o.drill, rng);
        assert.ok(ex.fields.every((f) => f.answer !== undefined && f.answer !== null), o.drill);
        counts[o.drill] = (counts[o.drill] ?? 0) + 1;
      }
    }
    assert.ok(lesson.objectives.every((o) => o.check(counts)));
  });
}

test('lecciones de emparejar: parejas completas y sin repetir', () => {
  for (const l of ALL_LESSONS.filter((x) => x.type === 'match')) {
    assert.ok(l.pairs.length >= 4, l.id);
    assert.equal(new Set(l.pairs.map((p) => p.left)).size, l.pairs.length, l.id);
    assert.equal(new Set(l.pairs.map((p) => p.right)).size, l.pairs.length, l.id);
  }
});

const SQL = await initSqlJs();

for (const lesson of ALL_LESSONS.filter((l) => l.type === 'sql')) {
  test(`lección ${lesson.id} se puede completar`, () => {
    const db = createSqlDb(SQL, lesson.seed);
    assert.ok(lesson.objectives.every((o) => !o.check(db)), 'ningún objetivo debería cumplirse antes de empezar');
    const sol = SQL_SOLUTIONS[lesson.id];
    assert.ok(sol, 'falta la solución de referencia en el test');
    const done = lesson.objectives.map(() => false);
    for (const stmt of sol) {
      db.run(stmt);
      lesson.objectives.forEach((o, i) => (done[i] ||= o.check(db)));
    }
    const failing = lesson.objectives.filter((_, i) => !done[i]).map((o) => o.label);
    assert.deepEqual(failing, [], db.log.filter((e) => !e.ok).map((e) => `${e.sql} → ${e.error}`).join('\n'));
  });
}

test('lecciones de lectura: el test tiene respuestas válidas', () => {
  for (const l of ALL_LESSONS.filter((x) => x.type === 'concept')) {
    for (const q of l.quiz) assert.ok(q.answer >= 0 && q.answer < q.options.length, `${l.id}: ${q.q}`);
  }
});

test('enlaces entre lecciones y preguntas existen', () => {
  const exams = ['tai2024A', 'tai2025A'].map((id) => JSON.parse(readFileSync(new URL(`../src/data/exams/${id}.json`, import.meta.url))));
  const qids = new Set(exams.flatMap((e) => e.parts.flatMap((p) => p.questions.map((q) => q.id))));
  const lessonIds = new Set(ALL_LESSONS.map((l) => l.id));
  for (const l of ALL_LESSONS) for (const id of l.exam ?? []) assert.ok(qids.has(id), `${l.id} → ${id}`);
  for (const e of exams)
    for (const p of e.parts)
      for (const q of p.questions) {
        if (q.learn) assert.ok(lessonIds.has(q.learn), `${q.id} → ${q.learn}`);
        assert.equal(q.options.length, 4, q.id);
        assert.ok(q.annulled ? q.answer === null : 'abcd'.includes(q.answer), q.id);
      }
});
