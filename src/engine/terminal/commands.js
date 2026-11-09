// Órdenes de Linux de la terminal simulada. Cada orden recibe
// (sh, ctx, argv, stdin) y devuelve { out, err, code }:
//   - sh: la shell entera (servicios, red, historial, docker…)
//   - ctx: el entorno donde se ejecuta (sistema de ficheros, cwd, usuario).
//     Es el del host o, dentro de `docker exec -it`, el del contenedor.
// Los mensajes imitan a bash/coreutils en español, que es lo que el alumno
// verá en una máquina real con el sistema en castellano.

import { getopts } from './parse.js';
import {
  resolve,
  getNode,
  setNode,
  removeNode,
  parentOf,
  basename,
  cloneNode,
  walk,
  modeString,
  dir,
  file,
} from './vfs.js';

const ok = (out = '') => ({ out, err: '', code: 0 });
const fail = (err, code = 1, out = '') => ({ out, err, code });
const NOENT = 'No existe el fichero o el directorio';
const DENIED = 'Permiso denegado';

const abs = (ctx, p) => resolve(p, ctx.cwd, ctx.home);
const isRoot = (ctx) => ctx.user === 'root';

// Permisos, versión mínima: el dueño usa la primera cifra del modo y el
// resto del mundo la última. root puede con todo. Suficiente para que
// `chmod 000` impida leer y `chmod +x` permita ejecutar.
function can(ctx, node, bit) {
  if (isRoot(ctx)) return bit !== 1 || /[1357]/.test(node.mode);
  const digit = node.owner === ctx.user ? node.mode[0] : node.mode[2];
  return (Number(digit) & bit) !== 0;
}
const canWriteIn = (ctx, dirPath) => {
  const d = getNode(ctx.fs, dirPath);
  return d && can(ctx, d, 2);
};

function readFile(ctx, name, cmd) {
  const node = getNode(ctx.fs, abs(ctx, name));
  if (!node) return { error: `${cmd}: ${name}: ${NOENT}` };
  if (node.type === 'dir') return { error: `${cmd}: ${name}: Es un directorio` };
  if (!can(ctx, node, 4)) return { error: `${cmd}: ${name}: ${DENIED}` };
  return { content: node.content };
}

// Lee de los ficheros indicados o, si no hay ninguno, de la entrada
// estándar (lo que llega por una tubería).
function inputs(ctx, files, stdin, cmd) {
  if (files.length === 0) return { chunks: [{ name: '(entrada estándar)', content: stdin ?? '' }], errs: [] };
  const chunks = [];
  const errs = [];
  for (const f of files) {
    const r = readFile(ctx, f, cmd);
    if (r.error) errs.push(r.error);
    else chunks.push({ name: f, content: r.content });
  }
  return { chunks, errs };
}

const lines = (text) => {
  const ls = text.split('\n');
  if (ls[ls.length - 1] === '') ls.pop();
  return ls;
};
const joinLines = (ls) => (ls.length ? ls.join('\n') + '\n' : '');

// Escribe (o crea) un fichero comprobando permisos. Lo usan las
// redirecciones > y >> y las órdenes que crean ficheros.
export function writeFile(ctx, name, content, append = false) {
  const target = abs(ctx, name);
  const node = getNode(ctx.fs, target);
  if (node?.type === 'dir') return `${name}: Es un directorio`;
  if (node) {
    if (!can(ctx, node, 2)) return `${name}: ${DENIED}`;
    node.content = append ? node.content + content : content;
    return null;
  }
  const { parent } = parentOf(target);
  if (!getNode(ctx.fs, parent)) return `${name}: ${NOENT}`;
  if (!canWriteIn(ctx, parent)) return `${name}: ${DENIED}`;
  return setNode(ctx.fs, target, file(content, '644', ctx.user));
}

// "*.log" -> /^.*\.log$/
const globRe = (pattern) =>
  new RegExp('^' + pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.') + '$');

// Expande comodines (*, ?) contra el directorio correspondiente, como hace
// la shell antes de llamar a la orden. Sin coincidencias se deja tal cual.
export function expandGlobs(ctx, argv) {
  const outArgs = [];
  for (const a of argv) {
    if (!/[*?]/.test(a)) {
      outArgs.push(a);
      continue;
    }
    const slash = a.lastIndexOf('/');
    const dirPart = slash >= 0 ? a.slice(0, slash + 1) : '';
    const d = getNode(ctx.fs, abs(ctx, dirPart || '.'));
    const re = globRe(a.slice(slash + 1));
    const matches =
      d?.type === 'dir'
        ? Object.keys(d.children)
            .filter((n) => !n.startsWith('.') && re.test(n))
            .sort()
            .map((n) => dirPart + n)
        : [];
    outArgs.push(...(matches.length ? matches : [a]));
  }
  return outArgs;
}

const MANUAL = {
  pwd: 'pwd — muestra la ruta del directorio actual (print working directory).',
  ls: 'ls [-l] [-a] [ruta] — lista el contenido de un directorio. -l formato largo (permisos, dueño, tamaño), -a incluye ocultos (los que empiezan por punto).',
  cd: 'cd [ruta] — cambia de directorio. Sin argumentos vuelve a tu carpeta personal (~). «cd ..» sube un nivel.',
  mkdir: 'mkdir [-p] dir — crea directorios. -p crea también los intermedios que falten.',
  touch: 'touch fichero — crea un fichero vacío (o actualiza su fecha si ya existe).',
  cat: 'cat fichero… — muestra el contenido de uno o varios ficheros (concatenate).',
  echo: 'echo texto — escribe el texto en la salida. Con > lo guarda en un fichero (lo sobrescribe) y con >> lo añade al final.',
  rm: 'rm [-r] [-f] fichero… — borra ficheros. -r borra directorios con todo su contenido. ¡No hay papelera!',
  rmdir: 'rmdir dir — borra un directorio, solo si está vacío.',
  cp: 'cp [-r] origen destino — copia ficheros (-r para directorios).',
  mv: 'mv origen destino — mueve o renombra ficheros y directorios.',
  head: 'head [-n N] fichero — muestra las primeras N líneas (10 por defecto).',
  tail: 'tail [-n N] [-f] fichero — muestra las últimas N líneas (10 por defecto). -f (follow) sigue mostrando las líneas nuevas según se escriben: ideal para logs.',
  grep: 'grep [-i] [-n] [-v] [-c] [-r] patrón [fichero…] — busca líneas que contienen el patrón. -i ignora mayúsculas, -n numera, -v invierte, -c cuenta, -r recursivo.',
  wc: 'wc [-l] [-w] [-c] fichero — cuenta líneas, palabras y bytes.',
  find: 'find [ruta] [-name patrón] [-type f|d] — busca ficheros recorriendo directorios.',
  chmod: 'chmod modo fichero — cambia permisos. Octal (755, 644…) o simbólico (+x, u+w, go-r…). r=4, w=2, x=1; tres cifras: dueño, grupo, otros.',
  sudo: 'sudo orden — ejecuta la orden como administrador (root).',
  whoami: 'whoami — muestra el usuario con el que estás trabajando.',
  uname: 'uname [-a] [-r] [-s] [-o] — información del sistema. -r versión del kernel, -o sistema operativo, -a todo.',
  systemctl: 'systemctl status|start|stop|restart|enable|disable|is-active|is-enabled servicio — gestiona servicios de systemd. enable = arrancar automáticamente al iniciar el sistema; start = arrancar ahora.',
  ip: 'ip addr — muestra las interfaces y sus IP. ip route show — muestra la tabla de rutas. ip route get IP — qué ruta usaría el kernel para llegar a esa IP.',
  ss: 'ss [-l] [-t] [-u] [-n] [-p] — muestra sockets. «ss -ltn»: puertos TCP en escucha, en numérico.',
  tar: 'tar -czf archivo.tar.gz ruta… crea un comprimido (c=create, z=gzip, f=fichero). tar -xzf archivo.tar.gz lo extrae (x=extract). tar -tzf lo lista (t=list).',
  history: 'history — muestra las órdenes que has escrito.',
  clear: 'clear — limpia la pantalla.',
  man: 'man orden — muestra la ayuda de una orden.',
  sort: 'sort [-r] [-n] — ordena líneas (-r al revés, -n numéricamente).',
  uniq: 'uniq [-c] — quita líneas repetidas consecutivas (-c las cuenta).',
  docker: 'docker pull|images|run|ps|stop|start|kill|rm|rmi|exec|logs — gestiona imágenes y contenedores. Escribe «docker --help» para ver más.',
  exit: 'exit — sale de la shell actual (por ejemplo, de dentro de un contenedor).',
};

export const commands = {
  help: () =>
    ok(
      'Órdenes disponibles:\n  ' +
        Object.keys(MANUAL).sort().join('  ') +
        '\n\nEscribe «man orden» para ver qué hace cada una.\n',
    ),

  man: (_sh, _ctx, argv) => {
    const name = argv[1];
    if (!name) return fail('¿Qué página de manual desea?');
    return MANUAL[name] ? ok(MANUAL[name] + '\n') : fail(`No hay ninguna entrada de manual para ${name}`, 16);
  },

  clear: () => ({ out: '', err: '', code: 0, clear: true }),

  pwd: (_sh, ctx) => ok(ctx.cwd + '\n'),

  whoami: (_sh, ctx) => ok(ctx.user + '\n'),

  hostname: (_sh, ctx) => ok(ctx.host + '\n'),

  date: () => ok(new Date().toString() + '\n'),

  echo: (_sh, _ctx, argv) => {
    const { flags, args } = getopts(argv.slice(1));
    return ok(args.join(' ') + (flags.n ? '' : '\n'));
  },

  uname: (sh, _ctx, argv) => {
    const { flags } = getopts(argv.slice(1));
    const k = sh.system;
    if (flags.a) return ok(`Linux ${k.host} ${k.kernel} #1 SMP x86_64 GNU/Linux\n`);
    const parts = [];
    if (flags.s || Object.keys(flags).length === 0) parts.push('Linux');
    if (flags.n) parts.push(k.host);
    if (flags.r) parts.push(k.kernel);
    if (flags.m) parts.push('x86_64');
    if (flags.o) parts.push('GNU/Linux');
    return ok(parts.join(' ') + '\n');
  },

  cd: (_sh, ctx, argv) => {
    const target = argv[1] ? abs(ctx, argv[1]) : ctx.home;
    const node = getNode(ctx.fs, target);
    if (!node) return fail(`cd: ${argv[1]}: ${NOENT}`);
    if (node.type !== 'dir') return fail(`cd: ${argv[1]}: No es un directorio`);
    if (!can(ctx, node, 1)) return fail(`cd: ${argv[1]}: ${DENIED}`);
    ctx.cwd = target;
    return ok();
  },

  ls: (_sh, ctx, argv) => {
    const { flags, args } = getopts(argv.slice(1));
    const targets = args.length ? args : ['.'];
    const outParts = [];
    const errs = [];
    const fmt = (name, node) =>
      flags.l
        ? `${modeString(node)} 1 ${node.owner.padEnd(6)} ${node.owner.padEnd(6)} ${String(
            node.type === 'dir' ? 4096 : node.content.length,
          ).padStart(5)} nov  9 10:00 ${name}${node.type === 'dir' ? '/' : ''}`
        : name + (node.type === 'dir' ? '/' : '');
    for (const t of targets) {
      const node = getNode(ctx.fs, abs(ctx, t));
      if (!node) {
        errs.push(`ls: no se puede acceder a '${t}': ${NOENT}`);
        continue;
      }
      if (node.type === 'file') {
        outParts.push(fmt(t, node));
        continue;
      }
      if (!can(ctx, node, 4)) {
        errs.push(`ls: no se puede abrir el directorio '${t}': ${DENIED}`);
        continue;
      }
      let names = Object.keys(node.children).sort();
      if (!flags.a) names = names.filter((n) => !n.startsWith('.'));
      const entries = names.map((n) => fmt(n, node.children[n]));
      if (flags.a) entries.unshift(fmt('.', node), fmt('..', node));
      const block = flags.l ? entries.join('\n') : entries.join('  ');
      outParts.push(targets.length > 1 ? `${t}:\n${block}` : block);
    }
    const out = outParts.filter(Boolean).join('\n');
    return { out: out ? out + '\n' : '', err: errs.join('\n'), code: errs.length ? 2 : 0 };
  },

  mkdir: (_sh, ctx, argv) => {
    const { flags, args } = getopts(argv.slice(1));
    if (!args.length) return fail('mkdir: falta un operando');
    const errs = [];
    for (const a of args) {
      const target = abs(ctx, a);
      if (getNode(ctx.fs, target)) {
        if (!flags.p) errs.push(`mkdir: no se puede crear el directorio «${a}»: El fichero ya existe`);
        continue;
      }
      if (flags.p) {
        const parts = target.split('/').filter(Boolean);
        let p = '';
        for (const seg of parts) {
          const parent = p || '/';
          p += '/' + seg;
          if (getNode(ctx.fs, p)) continue;
          if (!canWriteIn(ctx, parent)) {
            errs.push(`mkdir: no se puede crear el directorio «${a}»: ${DENIED}`);
            break;
          }
          setNode(ctx.fs, p, dir({}, '755', ctx.user));
        }
        continue;
      }
      const { parent } = parentOf(target);
      if (!getNode(ctx.fs, parent)) errs.push(`mkdir: no se puede crear el directorio «${a}»: ${NOENT}`);
      else if (!canWriteIn(ctx, parent)) errs.push(`mkdir: no se puede crear el directorio «${a}»: ${DENIED}`);
      else setNode(ctx.fs, target, dir({}, '755', ctx.user));
    }
    return errs.length ? fail(errs.join('\n')) : ok();
  },

  rmdir: (_sh, ctx, argv) => {
    const args = argv.slice(1);
    if (!args.length) return fail('rmdir: falta un operando');
    const errs = [];
    for (const a of args) {
      const target = abs(ctx, a);
      const node = getNode(ctx.fs, target);
      if (!node) errs.push(`rmdir: fallo al borrar '${a}': ${NOENT}`);
      else if (node.type !== 'dir') errs.push(`rmdir: fallo al borrar '${a}': No es un directorio`);
      else if (Object.keys(node.children).length) errs.push(`rmdir: fallo al borrar '${a}': El directorio no está vacío`);
      else if (!canWriteIn(ctx, parentOf(target).parent)) errs.push(`rmdir: fallo al borrar '${a}': ${DENIED}`);
      else removeNode(ctx.fs, target);
    }
    return errs.length ? fail(errs.join('\n')) : ok();
  },

  touch: (_sh, ctx, argv) => {
    const args = argv.slice(1);
    if (!args.length) return fail('touch: falta un operando de archivo');
    const errs = [];
    for (const a of args) {
      if (getNode(ctx.fs, abs(ctx, a))) continue;
      const e = writeFile(ctx, a, '');
      if (e) errs.push(`touch: no se puede efectuar \`touch' sobre '${a}': ${e.split(': ').pop()}`);
    }
    return errs.length ? fail(errs.join('\n')) : ok();
  },

  cat: (_sh, ctx, argv, stdin) => {
    const { chunks, errs } = inputs(ctx, argv.slice(1), stdin, 'cat');
    return { out: chunks.map((c) => c.content).join(''), err: errs.join('\n'), code: errs.length ? 1 : 0 };
  },

  rm: (_sh, ctx, argv) => {
    const { flags, args } = getopts(argv.slice(1));
    if (!args.length) return fail('rm: falta un operando');
    const recursive = flags.r || flags.R;
    const errs = [];
    for (const a of args) {
      const target = abs(ctx, a);
      const node = getNode(ctx.fs, target);
      if (!node) {
        if (!flags.f) errs.push(`rm: no se puede borrar '${a}': ${NOENT}`);
        continue;
      }
      if (target === '/') {
        errs.push("rm: es peligroso operar recursivamente sobre '/'");
        continue;
      }
      if (node.type === 'dir' && !recursive) {
        errs.push(`rm: no se puede borrar '${a}': Es un directorio`);
        continue;
      }
      if (!canWriteIn(ctx, parentOf(target).parent)) {
        errs.push(`rm: no se puede borrar '${a}': ${DENIED}`);
        continue;
      }
      if (ctx.cwd === target || ctx.cwd.startsWith(target + '/')) ctx.cwd = parentOf(target).parent;
      removeNode(ctx.fs, target);
    }
    return errs.length ? fail(errs.join('\n')) : ok();
  },

  cp: (_sh, ctx, argv) => copyOrMove(ctx, argv, false),
  mv: (_sh, ctx, argv) => copyOrMove(ctx, argv, true),

  head: (_sh, ctx, argv, stdin) => headTail(ctx, argv, stdin, 'head'),
  tail: (_sh, ctx, argv, stdin) => headTail(ctx, argv, stdin, 'tail'),

  grep: (_sh, ctx, argv, stdin) => {
    const { flags, args } = getopts(argv.slice(1));
    const [pattern, ...files] = args;
    if (pattern === undefined) return fail('Modo de empleo: grep [OPCIÓN]... PATRONES [FICHERO]...', 2);
    let re;
    try {
      re = new RegExp(pattern, flags.i ? 'i' : '');
    } catch (_) {
      re = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags.i ? 'i' : '');
    }
    let sources = files;
    if (flags.r) {
      sources = [];
      for (const f of files.length ? files : ['.']) {
        const root = getNode(ctx.fs, abs(ctx, f));
        if (!root) continue;
        walk(root, f, (p, n) => n.type === 'file' && sources.push(p));
      }
    }
    const { chunks, errs } = inputs(ctx, sources, stdin, 'grep');
    const multi = chunks.length > 1;
    const outLines = [];
    let total = 0;
    for (const c of chunks) {
      let count = 0;
      lines(c.content).forEach((line, i) => {
        if (re.test(line) !== Boolean(flags.v)) {
          count++;
          if (!flags.c) outLines.push((multi ? c.name + ':' : '') + (flags.n ? `${i + 1}:` : '') + line);
        }
      });
      if (flags.c) outLines.push((multi ? c.name + ':' : '') + count);
      total += count;
    }
    return { out: joinLines(outLines), err: errs.join('\n'), code: errs.length ? 2 : total ? 0 : 1 };
  },

  wc: (_sh, ctx, argv, stdin) => {
    const { flags, args } = getopts(argv.slice(1));
    const { chunks, errs } = inputs(ctx, args, stdin, 'wc');
    const all = !flags.l && !flags.w && !flags.c;
    const outLines = chunks.map((c) => {
      const cols = [];
      if (all || flags.l) cols.push((c.content.match(/\n/g) || []).length);
      if (all || flags.w) cols.push(c.content.split(/\s+/).filter(Boolean).length);
      if (all || flags.c) cols.push(new TextEncoder().encode(c.content).length);
      return cols.join(' ') + (args.length ? ' ' + c.name : '');
    });
    return { out: joinLines(outLines), err: errs.join('\n'), code: errs.length ? 1 : 0 };
  },

  sort: (_sh, ctx, argv, stdin) => {
    const { flags, args } = getopts(argv.slice(1));
    const { chunks, errs } = inputs(ctx, args, stdin, 'sort');
    let ls = chunks.flatMap((c) => lines(c.content));
    ls = flags.n ? ls.sort((a, b) => parseFloat(a) - parseFloat(b)) : ls.sort((a, b) => a.localeCompare(b));
    if (flags.r) ls.reverse();
    return { out: joinLines(ls), err: errs.join('\n'), code: errs.length ? 2 : 0 };
  },

  uniq: (_sh, ctx, argv, stdin) => {
    const { flags, args } = getopts(argv.slice(1));
    const { chunks, errs } = inputs(ctx, args, stdin, 'uniq');
    const groups = [];
    for (const l of chunks.flatMap((c) => lines(c.content))) {
      const last = groups[groups.length - 1];
      if (last && last.line === l) last.n++;
      else groups.push({ line: l, n: 1 });
    }
    const outLines = groups.map((g) => (flags.c ? `${String(g.n).padStart(7)} ${g.line}` : g.line));
    return { out: joinLines(outLines), err: errs.join('\n'), code: errs.length ? 1 : 0 };
  },

  find: (_sh, ctx, argv) => {
    const rest = argv.slice(1);
    const start = rest[0] && !rest[0].startsWith('-') ? rest.shift() : '.';
    let name = null;
    let type = null;
    for (let i = 0; i < rest.length; i++) {
      if (rest[i] === '-name' || rest[i] === '-iname') {
        name = new RegExp(globRe(rest[++i] ?? '').source, rest[i - 1] === '-iname' ? 'i' : '');
      } else if (rest[i] === '-type') type = rest[++i];
      else return fail(`find: predicado desconocido «${rest[i]}»`);
    }
    const root = getNode(ctx.fs, abs(ctx, start));
    if (!root) return fail(`find: '${start}': ${NOENT}`);
    const found = [];
    walk(root, start, (p, n) => {
      if (type === 'f' && n.type !== 'file') return;
      if (type === 'd' && n.type !== 'dir') return;
      if (name && !name.test(p.split('/').pop())) return;
      found.push(p);
    });
    return ok(joinLines(found));
  },

  chmod: (_sh, ctx, argv) => {
    const [mode, ...targets] = argv.slice(1);
    if (!mode || !targets.length) return fail('chmod: falta un operando');
    const errs = [];
    for (const t of targets) {
      const node = getNode(ctx.fs, abs(ctx, t));
      if (!node) {
        errs.push(`chmod: no se puede acceder a '${t}': ${NOENT}`);
        continue;
      }
      if (!isRoot(ctx) && node.owner !== ctx.user) {
        errs.push(`chmod: cambiando los permisos de '${t}': Operación no permitida`);
        continue;
      }
      const next = applyMode(node.mode, mode);
      if (!next) return fail(`chmod: modo inválido: «${mode}»`);
      node.mode = next;
    }
    return errs.length ? fail(errs.join('\n')) : ok();
  },

  history: (sh) => ok(joinLines(sh.history.map((h, i) => `${String(i + 1).padStart(5)}  ${h}`))),

  ps: (sh) => {
    const rows = ['    PID TTY          TIME CMD', '      1 ?        00:00:02 systemd'];
    let pid = 400;
    for (const [name, s] of Object.entries(sh.services)) {
      if (s.active) rows.push(`${String(pid++).padStart(7)} ?        00:00:00 ${name}`);
    }
    rows.push('   1203 pts/0    00:00:00 bash', '   1290 pts/0    00:00:00 ps');
    return ok(joinLines(rows));
  },

  systemctl: (sh, ctx, argv) => {
    const [action, unitRaw] = argv.slice(1);
    if (!action) return fail('systemctl: falta la acción (status, start, stop, enable…)');
    if (action === 'list-units') {
      const rows = Object.entries(sh.services).map(
        ([n, s]) => `${(n + '.service').padEnd(22)} loaded ${s.active ? 'active   running' : 'inactive dead   '}`,
      );
      return ok(joinLines(rows));
    }
    if (!unitRaw) return fail(`systemctl ${action}: falta el nombre del servicio`);
    const unit = unitRaw.replace(/\.service$/, '');
    const s = sh.services[unit];
    if (!s) return fail(`Unit ${unit}.service could not be found.`, 4);
    const needsRoot = ['start', 'stop', 'restart', 'enable', 'disable', 'reload'];
    if (needsRoot.includes(action) && !isRoot(ctx)) {
      return fail(`Failed to ${action} ${unit}.service: Access denied\n(Pista: las acciones que cambian servicios necesitan sudo)`);
    }
    switch (action) {
      case 'status':
        return ok(
          `● ${unit}.service - ${s.description}\n` +
            `     Loaded: loaded (/usr/lib/systemd/system/${unit}.service; ${s.enabled ? 'enabled' : 'disabled'})\n` +
            `     Active: ${s.active ? 'active (running)' : 'inactive (dead)'}\n`,
        );
      case 'start':
      case 'restart':
      case 'reload':
        s.active = true;
        return ok();
      case 'stop':
        s.active = false;
        return ok();
      case 'enable':
        s.enabled = true;
        return ok(
          `Created symlink /etc/systemd/system/multi-user.target.wants/${unit}.service → /usr/lib/systemd/system/${unit}.service.\n`,
        );
      case 'disable':
        s.enabled = false;
        return ok(`Removed /etc/systemd/system/multi-user.target.wants/${unit}.service.\n`);
      case 'is-active':
        return s.active ? ok('active\n') : fail('', 3, 'inactive\n');
      case 'is-enabled':
        return s.enabled ? ok('enabled\n') : fail('', 1, 'disabled\n');
      default:
        return fail(`Unknown command verb ${action}.`);
    }
  },

  ip: (sh, _ctx, argv) => {
    const [obj = '', sub = 'show', target] = argv.slice(1);
    const net = sh.net;
    if ('addr'.startsWith(obj) && obj) {
      const rows = net.ifaces.flatMap((n, i) => [
        `${i + 1}: ${n.name}: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 state UP`,
        `    inet ${n.addr} scope global ${n.name}`,
      ]);
      return ok(joinLines(['1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536', '    inet 127.0.0.1/8 scope host lo', ...rows]));
    }
    if (obj === 'route' || obj === 'r') {
      if (sub === 'show' || sub === 'list' || sub === 'ls') {
        return ok(
          joinLines(
            net.routes.map((r) =>
              r.via ? `${r.dest} via ${r.via} dev ${r.dev}` : `${r.dest} dev ${r.dev} proto kernel scope link src ${r.src}`,
            ),
          ),
        );
      }
      if (sub === 'get') {
        if (!target) return fail('ip route get: falta la dirección de destino');
        const r = routeFor(net, target);
        if (!r) return fail('RTNETLINK answers: Network is unreachable', 2);
        const src = net.ifaces.find((i) => i.name === r.dev)?.addr.split('/')[0];
        return ok(`${target} ${r.via ? `via ${r.via} ` : ''}dev ${r.dev} src ${src}\n    cache\n`);
      }
      return fail(`Command "${sub}" is unknown, try "ip route help".`, 255);
    }
    return fail('Usage: ip [ OPTIONS ] OBJECT { COMMAND | help }\nwhere  OBJECT := { addr | route | … }', 255);
  },

  ss: (sh, _ctx, argv) => {
    const { flags } = getopts(argv.slice(1));
    const listening = [];
    for (const s of Object.values(sh.services)) if (s.active && s.port) listening.push(s.port);
    for (const c of sh.docker.containers) {
      if (c.status === 'running') for (const p of c.ports) listening.push(p.host);
    }
    const header = 'State   Recv-Q  Send-Q   Local Address:Port    Peer Address:Port';
    if (!flags.l) return ok(header + '\nESTAB   0       0        10.30.20.10:22        10.30.16.45:51544\n');
    const rows = [...new Set(listening)]
      .sort((a, b) => a - b)
      .map((p) => `LISTEN  0       128            0.0.0.0:${flags.n ? p : portName(p)}`.padEnd(46) + '0.0.0.0:*');
    return ok(joinLines([header, ...rows]));
  },

  tar: (_sh, ctx, argv) => {
    const raw = argv.slice(1);
    // tar acepta las letras sin guion: «tar czf x.tgz dir»
    if (raw[0] && !raw[0].startsWith('-')) raw[0] = '-' + raw[0];
    const { flags, args } = getopts(raw, 'f');
    const archive = flags.f;
    if (!archive) return fail('tar: Hay que indicar el archivo con -f');
    if (flags.c) {
      if (!args.length) return fail('tar: Cobardemente rehúso crear un archivo vacío');
      const entries = [];
      for (const a of args) {
        const node = getNode(ctx.fs, abs(ctx, a));
        if (!node) return fail(`tar: ${a}: No se puede efectuar stat: ${NOENT}`, 2);
        walk(node, a.replace(/^\/+/, '').replace(/\/+$/, ''), (p, n) =>
          entries.push({ path: p + (n.type === 'dir' ? '/' : ''), content: n.type === 'file' ? n.content : null }),
        );
      }
      const e = writeFile(ctx, archive, 'TAR' + (flags.z ? 'GZ' : '') + ':' + JSON.stringify(entries));
      if (e) return fail('tar: ' + e, 2);
      return ok(flags.v ? joinLines(entries.map((x) => x.path)) : '');
    }
    const r = readFile(ctx, archive, 'tar');
    if (r.error) return fail(r.error, 2);
    const m = r.content.match(/^TAR(GZ)?:(.*)$/s);
    if (!m) return fail('tar: Esto no parece un archivo tar', 2);
    const entries = JSON.parse(m[2]);
    if (flags.t) return ok(joinLines(entries.map((x) => x.path)));
    if (flags.x) {
      for (const x of entries) {
        const target = abs(ctx, x.path);
        if (x.content === null) {
          if (!getNode(ctx.fs, target)) setNode(ctx.fs, target, dir({}, '755', ctx.user));
        } else setNode(ctx.fs, target, file(x.content, '644', ctx.user));
      }
      return ok(flags.v ? joinLines(entries.map((x) => x.path)) : '');
    }
    return fail('tar: Debe especificar una de las opciones «-ctx»', 2);
  },
};

function copyOrMove(ctx, argv, move) {
  const cmd = move ? 'mv' : 'cp';
  const { flags, args } = getopts(argv.slice(1));
  if (args.length < 2) return fail(`${cmd}: falta el fichero de destino`);
  const dest = args.pop();
  const destAbs = abs(ctx, dest);
  const destNode = getNode(ctx.fs, destAbs);
  if (args.length > 1 && destNode?.type !== 'dir') return fail(`${cmd}: el destino '${dest}' no es un directorio`);
  const errs = [];
  for (const src of args) {
    const srcAbs = abs(ctx, src);
    const node = getNode(ctx.fs, srcAbs);
    if (!node) {
      errs.push(`${cmd}: no se puede efectuar \`stat' sobre '${src}': ${NOENT}`);
      continue;
    }
    if (node.type === 'dir' && !move && !flags.r && !flags.R) {
      errs.push(`${cmd}: -r no especificado; se omite el directorio '${src}'`);
      continue;
    }
    const target = destNode?.type === 'dir' ? `${destAbs === '/' ? '' : destAbs}/${basename(srcAbs)}` : destAbs;
    if (target === srcAbs || target.startsWith(srcAbs + '/')) {
      errs.push(`${cmd}: no se puede copiar un directorio, '${src}', dentro de sí mismo`);
      continue;
    }
    const { parent } = parentOf(target);
    if (!canWriteIn(ctx, parent) || (move && !canWriteIn(ctx, parentOf(srcAbs).parent))) {
      errs.push(`${cmd}: no se puede crear '${dest}': ${DENIED}`);
      continue;
    }
    const copy = cloneNode(node);
    if (!move) copy.owner = ctx.user;
    const e = setNode(ctx.fs, target, copy);
    if (e) {
      errs.push(`${cmd}: no se puede crear '${dest}': ${e}`);
      continue;
    }
    if (move) removeNode(ctx.fs, srcAbs);
  }
  return errs.length ? fail(errs.join('\n')) : ok();
}

function headTail(ctx, argv, stdin, cmd) {
  const { flags, args } = getopts(argv.slice(1), 'n');
  const n = flags.n === undefined ? 10 : parseInt(String(flags.n).replace(/^\+/, ''), 10);
  if (Number.isNaN(n)) return fail(`${cmd}: número de líneas inválido: «${flags.n}»`);
  const { chunks, errs } = inputs(ctx, args, stdin, cmd);
  const parts = chunks.map((c) => {
    const ls = lines(c.content);
    const picked = cmd === 'head' ? ls.slice(0, n) : n === 0 ? [] : ls.slice(-n);
    return (chunks.length > 1 ? `==> ${c.name} <==\n` : '') + joinLines(picked);
  });
  let out = parts.join('\n');
  if (cmd === 'tail' && flags.f) {
    out += '\n[tail -f] Siguiendo el fichero: en una máquina real la orden se queda esperando y va mostrando cada línea nueva que se escriba (útil para vigilar logs en vivo). Se sale con Ctrl+C.\n';
  }
  return { out, err: errs.join('\n'), code: errs.length ? 1 : 0 };
}

// chmod: octal ("640") o simbólico ("+x", "u+rw", "go-w", "a=r").
export function applyMode(current, mode) {
  if (/^[0-7]{3,4}$/.test(mode)) return mode.slice(-3);
  const digits = [...current.padStart(3, '0')].map(Number);
  for (const clause of mode.split(',')) {
    const m = clause.match(/^([ugoa]*)([+\-=])([rwx]*)$/);
    if (!m) return null;
    const who = !m[1] || m[1].includes('a') ? 'ugo' : m[1];
    const bits = [...m[3]].reduce((acc, c) => acc | { r: 4, w: 2, x: 1 }[c], 0);
    [...'ugo'].forEach((w, i) => {
      if (!who.includes(w)) return;
      if (m[2] === '+') digits[i] |= bits;
      else if (m[2] === '-') digits[i] &= ~bits;
      else digits[i] = bits;
    });
  }
  return digits.join('');
}

const PORT_NAMES = { 22: 'ssh', 25: 'smtp', 80: 'http', 443: 'https', 3306: 'mysql', 993: 'imaps' };
const portName = (p) => PORT_NAMES[p] ?? p;

const ipToInt = (ip) => ip.split('.').reduce((acc, o) => (acc << 8) + Number(o), 0) >>> 0;

export function inSubnet(ip, cidr) {
  const [net, bits] = cidr.split('/');
  const mask = Number(bits) === 0 ? 0 : (~0 << (32 - Number(bits))) >>> 0;
  return (ipToInt(ip) & mask) === (ipToInt(net) & mask);
}

function routeFor(net, ip) {
  if (!/^\d+\.\d+\.\d+\.\d+$/.test(ip)) return null;
  return net.routes.find((r) => r.dest !== 'default' && inSubnet(ip, r.dest)) ?? net.routes.find((r) => r.dest === 'default');
}
