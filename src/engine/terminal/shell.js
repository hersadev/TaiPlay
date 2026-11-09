// La shell simulada: une el analizador, las órdenes, el sistema de ficheros
// y Docker. Es un objeto mutable; la interfaz vuelve a pintarse leyendo
// sh.screen después de cada run(). Los validadores de las lecciones leen el
// resto del estado (ficheros, servicios, contenedores, sh.log…).
//
// Sin dependencias del navegador: se prueba con `node --test`.

import { parse } from './parse.js';
import { commands, writeFile, expandGlobs } from './commands.js';
import { dockerCommand } from './docker.js';
import { dir, file, getNode, setNode, resolve, parentOf } from './vfs.js';

const USER = 'alumno';
const HOME = `/home/${USER}`;

function defaultFs() {
  return dir(
    {
      bin: dir(),
      etc: dir({
        hostname: file('web01\n'),
        'os-release': file('NAME="Red Hat Enterprise Linux"\nVERSION="8.8 (Ootpa)"\nID="rhel"\n'),
        passwd: file(`root:x:0:0:root:/root:/bin/bash\n${USER}:x:1000:1000:Alumno:${HOME}:/bin/bash\n`),
        nginx: dir({ 'nginx.conf': file('user nginx;\nworker_processes auto;\nerror_log /var/log/nginx/error.log;\n') }),
      }),
      home: dir({ [USER]: dir({}, '755', USER) }),
      root: dir({}, '700'),
      tmp: dir({}, '777'),
      usr: dir({ bin: dir(), share: dir() }),
      var: dir({
        log: dir({
          messages: file(
            'Nov  9 09:58:01 web01 systemd[1]: Started Session 12 of user alumno.\n' +
              'Nov  9 09:58:40 web01 sshd[1180]: Accepted password for alumno from 10.30.16.45 port 51544\n' +
              'Nov  9 09:59:12 web01 kernel: e1000: eth0 NIC Link is Up 1000 Mbps Full Duplex\n',
            '644',
          ),
        }),
      }),
    },
    '755',
  );
}

const DEFAULT_SERVICES = () => ({
  sshd: { description: 'OpenSSH server daemon', active: true, enabled: true, port: 22 },
  nginx: { description: 'The nginx HTTP and reverse proxy server', active: false, enabled: false, port: 80 },
  crond: { description: 'Command Scheduler', active: true, enabled: true },
});

const DEFAULT_NET = () => ({
  ifaces: [{ name: 'eth0', addr: '172.19.50.10/27' }],
  routes: [
    { dest: 'default', via: '172.19.50.1', dev: 'eth0' },
    { dest: '10.30.16.0/20', via: '172.19.50.2', dev: 'eth0' },
    { dest: '172.19.50.0/27', dev: 'eth0', src: '172.19.50.10' },
  ],
});

// setup (todo opcional), lo usan las lecciones para preparar el escenario:
//   files: { '/ruta/absoluta': 'contenido' | { content, mode, owner } }
//   dirs:  ['/ruta/a/crear', …]   (con dueño alumno si cuelgan de su home)
//   cwd, services, images (nombres de imágenes ya descargadas)
//   setup(sh): función para retoques más finos
export function createShell(setup = {}) {
  const fs = defaultFs();
  const own = (p) => (p.startsWith(HOME) ? USER : 'root');
  for (const d of setup.dirs ?? []) {
    let p = '';
    for (const seg of d.split('/').filter(Boolean)) {
      p += '/' + seg;
      if (!getNode(fs, p)) setNode(fs, p, dir({}, '755', own(p)));
    }
  }
  for (const [path, spec] of Object.entries(setup.files ?? {})) {
    const { parent } = parentOf(path);
    let p = '';
    for (const seg of parent.split('/').filter(Boolean)) {
      p += '/' + seg;
      if (!getNode(fs, p)) setNode(fs, p, dir({}, '755', own(p)));
    }
    const s = typeof spec === 'string' ? { content: spec } : spec;
    setNode(fs, path, file(s.content ?? '', s.mode ?? '644', s.owner ?? own(path)));
  }

  const hostCtx = { fs, cwd: setup.cwd ?? HOME, home: HOME, user: USER, host: 'web01' };
  const sh = {
    hostCtx,
    ctxStack: [hostCtx],
    system: { host: 'web01', kernel: '4.18.0-477.10.1.el8_8.x86_64' },
    services: { ...DEFAULT_SERVICES(), ...(setup.services ?? {}) },
    net: DEFAULT_NET(),
    docker: { images: [], containers: [] },
    history: [],
    log: [], // { line, code, out, err, cmds: [argv…] } por cada línea ejecutada
    screen: [],
    get ctx() {
      return this.ctxStack[this.ctxStack.length - 1];
    },
    prompt() {
      return promptFor(this.ctx);
    },
    run(line) {
      return runLine(this, line);
    },
  };
  for (const name of setup.images ?? []) dockerCommand(sh, ['docker', 'pull', name]);
  // Órdenes previas para dejar el escenario montado (contenedores en marcha,
  // servicios…): se ejecutan de verdad pero no quedan en pantalla, en el
  // historial ni en el log que miran los validadores.
  for (const line of setup.commands ?? []) runLine(sh, line);
  sh.screen = [];
  sh.history = [];
  sh.log = [];
  setup.setup?.(sh);
  return sh;
}

export function promptFor(ctx) {
  let where = ctx.cwd;
  if (where === ctx.home) where = '~';
  else if (where.startsWith(ctx.home + '/')) where = '~' + where.slice(ctx.home.length);
  return `${ctx.user}@${ctx.host}:${where}${ctx.user === 'root' ? '#' : '$'}`;
}

const VARS = (ctx) => ({ HOME: ctx.home, USER: ctx.user, PWD: ctx.cwd });

function expandVars(ctx, argv) {
  const vars = VARS(ctx);
  return argv.map((a) => a.replace(/\$(\w+)|\$\{(\w+)\}/g, (_, x, y) => vars[x ?? y] ?? ''));
}

function runLine(sh, rawLine) {
  const line = rawLine.trim();
  const prompt = sh.prompt();
  sh.screen.push({ kind: 'cmd', prompt, text: rawLine });
  if (!line) return { code: 0 };
  sh.history.push(line);
  const entry = { line, code: 0, out: '', err: '', cmds: [], ctxUser: sh.ctx.user, inContainer: sh.ctx.container?.id ?? null };
  sh.log.push(entry);

  let steps;
  try {
    steps = parse(line);
  } catch (e) {
    entry.code = 2;
    entry.err = e.message;
    sh.screen.push({ kind: 'err', text: `bash: ${e.message}` });
    return entry;
  }

  let last = 0;
  for (const step of steps) {
    if (step.op === '&&' && last !== 0) continue;
    last = runPipeline(sh, step.pipeline, entry);
  }
  entry.code = last;
  entry.cwd = sh.hostCtx.cwd;
  return entry;
}

function runPipeline(sh, pipeline, entry) {
  let stdin = '';
  let code = 0;
  for (let i = 0; i < pipeline.length; i++) {
    const { argv: rawArgv, redirect } = pipeline[i];
    const ctx = sh.ctx;
    const argv = expandGlobs(ctx, expandVars(ctx, rawArgv));
    entry.cmds.push(argv);
    const r = execute(sh, ctx, argv, stdin);
    code = r.code;
    if (r.clear) {
      sh.screen = [];
      continue;
    }
    if (r.err) {
      entry.err += r.err + '\n';
      sh.screen.push({ kind: 'err', text: r.err });
    }
    let out = r.out ?? '';
    if (redirect) {
      const e = writeFile(ctx, redirect.target, out, redirect.append);
      if (e) {
        sh.screen.push({ kind: 'err', text: `bash: ${e}` });
        code = 1;
      }
      out = '';
    }
    if (i < pipeline.length - 1) {
      stdin = out;
    } else if (out) {
      entry.out += out;
      sh.screen.push({ kind: 'out', text: out.replace(/\n$/, '') });
    }
    if (r.enterShell) enterContainer(sh, r.enterShell, r.removeOnExit, r.viaExec);
  }
  return code;
}

function execute(sh, ctx, argv, stdin) {
  const [name] = argv;

  if (name === 'sudo') {
    if (argv.length === 1) return { out: '', err: 'uso: sudo orden', code: 1 };
    if (ctx.container) return { out: '', err: 'bash: sudo: orden no encontrada', code: 127 };
    const prevUser = ctx.user;
    ctx.user = 'root';
    try {
      return execute(sh, ctx, argv.slice(1), stdin);
    } finally {
      ctx.user = prevUser;
    }
  }

  if (name === 'exit' || name === 'logout') {
    if (sh.ctxStack.length === 1) {
      return { out: '(Esta es la terminal principal: en el simulador no se cierra.)\n', err: '', code: 0 };
    }
    const leaving = sh.ctxStack.pop();
    const c = leaving.container;
    if (c && !leaving.viaExec) {
      // Al salir de la shell con la que arrancó (docker run -it), el
      // proceso principal del contenedor termina y el contenedor se para.
      c.status = 'exited';
      c.exitCode = 0;
      c.finishedAt = Date.now();
      if (leaving.removeOnExit) sh.docker.containers = sh.docker.containers.filter((x) => x !== c);
    }
    return { out: 'exit\n', err: '', code: 0 };
  }

  if (name === 'docker') {
    if (ctx.container) return { out: '', err: 'bash: docker: orden no encontrada (estás dentro de un contenedor: sal con «exit»)', code: 127 };
    const r = dockerCommand(sh, argv);
    if (r.execIn) {
      // docker exec contenedor orden → se ejecuta en el entorno del contenedor
      const cctx = containerCtx(r.execIn.container);
      return execute(sh, cctx, r.execIn.argv, '');
    }
    if (r.enterShell && argv[1] === 'exec') r.viaExec = true;
    return r;
  }

  // Ejecutar un fichero: ./script.sh o /ruta/script.sh
  if (name.includes('/')) return runScript(sh, ctx, name);

  const fn = commands[name];
  if (!fn) {
    const hint = { dir: ' (en Linux se usa «ls»)', cls: ' (en Linux se usa «clear»)', ipconfig: ' (en Linux se usa «ip addr»)', type: ' (en Linux se usa «cat»)', copy: ' (en Linux se usa «cp»)', del: ' (en Linux se usa «rm»)' }[name] ?? '';
    return { out: '', err: `bash: ${name}: orden no encontrada${hint}`, code: 127 };
  }
  return fn(sh, ctx, argv, stdin);
}

function runScript(sh, ctx, name) {
  const path = resolve(name, ctx.cwd, ctx.home);
  const node = getNode(ctx.fs, path);
  if (!node) return { out: '', err: `bash: ${name}: No existe el fichero o el directorio`, code: 127 };
  if (node.type === 'dir') return { out: '', err: `bash: ${name}: Es un directorio`, code: 126 };
  const digit = ctx.user === 'root' || node.owner === ctx.user ? node.mode[0] : node.mode[2];
  if (!(Number(digit) & 1)) return { out: '', err: `bash: ${name}: Permiso denegado`, code: 126 };
  let out = '';
  let err = '';
  let code = 0;
  for (const l of node.content.split('\n')) {
    const t = l.trim();
    if (!t || t.startsWith('#')) continue;
    let steps;
    try {
      steps = parse(t);
    } catch (e) {
      err += `${name}: ${e.message}\n`;
      code = 2;
      continue;
    }
    for (const step of steps) {
      if (step.op === '&&' && code !== 0) continue;
      let stdin = '';
      for (let i = 0; i < step.pipeline.length; i++) {
        const { argv, redirect } = step.pipeline[i];
        const r = execute(sh, ctx, expandGlobs(ctx, expandVars(ctx, argv)), stdin);
        code = r.code;
        if (r.err) err += r.err + '\n';
        let o = r.out ?? '';
        if (redirect) {
          const e = writeFile(ctx, redirect.target, o, redirect.append);
          if (e) err += `${name}: ${e}\n`;
          o = '';
        }
        if (i < step.pipeline.length - 1) stdin = o;
        else out += o;
      }
    }
  }
  return { out, err: err.replace(/\n$/, ''), code };
}

function containerCtx(c) {
  return { fs: c.fs, cwd: '/', home: '/root', user: 'root', host: c.id.slice(0, 12), container: c };
}

function enterContainer(sh, c, removeOnExit, viaExec) {
  sh.ctxStack.push({ ...containerCtx(c), removeOnExit, viaExec });
}

// Atajos de lectura para validadores y pruebas.
export const readHostFile = (sh, path) => {
  const n = getNode(sh.hostCtx.fs, path);
  return n?.type === 'file' ? n.content : null;
};
export const hostNode = (sh, path) => getNode(sh.hostCtx.fs, path);
export { HOME, USER };
