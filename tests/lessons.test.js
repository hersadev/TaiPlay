import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createShell } from '../src/engine/terminal/shell.js';
import { ALL_LESSONS } from '../src/lessons/index.js';

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
