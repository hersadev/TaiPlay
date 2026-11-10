// Docker simulado. Reproduce el ciclo de vida que pregunta el examen
// (pull → images → run → ps → logs → exec → stop/kill → rm → rmi) con
// mensajes calcados de los reales, para que lo que el alumno vea aquí sea
// lo mismo que verá en una máquina con Docker de verdad.
//
// Cada contenedor recibe su propia copia del sistema de ficheros de la
// imagen: lo que se cree dentro con `docker exec` vive y muere con él.
//
// `docker build` lee un Dockerfile de verdad (FROM, RUN, COPY, WORKDIR,
// ENV, EXPOSE, CMD…), ejecuta cada RUN con las órdenes de la terminal
// dentro del sistema de ficheros de la imagen y guarda el resultado como
// una imagen local más. `docker compose` está en compose.js.

import { getopts } from './parse.js';
import { dir, file, cloneNode, getNode, setNode, resolve, walk } from './vfs.js';
import { composeCommand } from './compose.js';

const baseFs = (extra = {}) =>
  dir({
    bin: dir(),
    etc: dir({ hostname: file('contenedor\n'), 'os-release': file('NAME="Linux"\n') }),
    home: dir(),
    root: dir({}, '700'),
    tmp: dir({}, '777'),
    usr: dir({ bin: dir(), share: dir() }),
    var: dir({ log: dir() }),
    ...extra,
  });

// Imágenes que «existen» en Docker Hub. defaultCmd es lo que ejecuta el
// contenedor si no se indica otra cosa; longRunning, si se queda en marcha
// (un servidor) o termina al acabar (un programa).
export const REGISTRY = {
  'hello-world': {
    size: '13.3kB',
    defaultCmd: '/hello',
    longRunning: false,
    output:
      '\nHello from Docker!\nThis message shows that your installation appears to be working correctly.\n\n' +
      'To generate this message, Docker took the following steps:\n' +
      ' 1. The Docker client contacted the Docker daemon.\n' +
      ' 2. The Docker daemon pulled the "hello-world" image from the Docker Hub.\n' +
      ' 3. The Docker daemon created a new container from that image which runs the\n    executable that produces the output you are currently reading.\n' +
      ' 4. The Docker daemon streamed that output to the Docker client, which sent it\n    to your terminal.\n',
    fs: () => dir({ hello: file('(binario)', '755') }),
  },
  nginx: {
    size: '192MB',
    family: 'debian',
    webroot: '/usr/share/nginx/html',
    defaultCmd: 'nginx -g daemon off;',
    longRunning: true,
    exposes: 80,
    logs: [
      '/docker-entrypoint.sh: Configuration complete; ready for start up',
      '2026/11/09 10:00:00 [notice] 1#1: nginx/1.27.2',
      '2026/11/09 10:00:00 [notice] 1#1: start worker processes',
    ],
    fs: () =>
      baseFs({
        etc: dir({
          hostname: file('contenedor\n'),
          nginx: dir({ 'nginx.conf': file('user nginx;\nworker_processes auto;\nhttp {\n    include /etc/nginx/conf.d/*.conf;\n}\n') }),
        }),
        usr: dir({
          bin: dir(),
          share: dir({
            nginx: dir({
              html: dir({ 'index.html': file('<!DOCTYPE html>\n<html>\n<head><title>Welcome to nginx!</title></head>\n<body><h1>Welcome to nginx!</h1></body>\n</html>\n') }),
            }),
          }),
        }),
      }),
  },
  ubuntu: { size: '78.1MB', family: 'debian', defaultCmd: 'bash', longRunning: false, shell: 'bash', fs: () => baseFs({ etc: dir({ hostname: file('contenedor\n'), 'os-release': file('PRETTY_NAME="Ubuntu 24.04.1 LTS"\nNAME="Ubuntu"\nVERSION_ID="24.04"\nID=ubuntu\n') }) }) },
  alpine: { size: '7.8MB', family: 'alpine', defaultCmd: 'sh', longRunning: false, shell: 'sh', fs: () => baseFs({ etc: dir({ hostname: file('contenedor\n'), 'os-release': file('NAME="Alpine Linux"\nID=alpine\nVERSION_ID=3.21.0\n') }) }) },
  mysql: {
    size: '602MB',
    family: 'rhel',
    defaultCmd: 'mysqld',
    longRunning: true,
    exposes: 3306,
    requiresEnv: 'MYSQL_ROOT_PASSWORD',
    logs: ['[System] [MY-010931] [Server] /usr/sbin/mysqld: ready for connections. port: 3306'],
    fs: () => baseFs({ var: dir({ lib: dir({ mysql: dir() }), log: dir() }) }),
  },
  python: { size: '1.02GB', family: 'debian', defaultCmd: 'python3', longRunning: false, shell: 'bash', fs: () => baseFs() },
};

const hex = (n) => Array.from({ length: n }, () => Math.floor(Math.random() * 16).toString(16)).join('');
const ADJ = ['agitado', 'brillante', 'curioso', 'decidido', 'eficaz', 'feliz', 'sereno', 'valiente'];
const NOUN = ['turing', 'hopper', 'lovelace', 'torvalds', 'ritchie', 'hamilton', 'knuth', 'dijkstra'];
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export function createDockerState() {
  return { images: [], containers: [], networks: [] };
}

const parseRef = (ref) => {
  const [name, tag = 'latest'] = ref.split(':');
  return { name, tag };
};

export function findImage(state, ref) {
  const { name, tag } = parseRef(ref);
  return state.images.find((i) => (i.name === name && i.tag === tag) || i.id.startsWith(ref));
}

// Los contenedores se pueden nombrar por nombre o por el principio de su
// ID: «docker kill 3f7» funciona si solo un contenedor empieza por 3f7.
export function findContainer(state, ref) {
  const byName = state.containers.find((c) => c.name === ref);
  if (byName) return { container: byName };
  const matches = state.containers.filter((c) => c.id.startsWith(ref));
  if (matches.length > 1) return { error: `Error response from daemon: multiple IDs found with provided prefix: ${ref}` };
  if (!matches.length) return { error: `Error response from daemon: No such container: ${ref}` };
  return { container: matches[0] };
}

export function pullImage(state, ref, out) {
  const { name, tag } = parseRef(ref);
  const spec = REGISTRY[name];
  if (!spec || (tag !== 'latest' && !/^[\w.-]+$/.test(tag))) {
    return `Error response from daemon: pull access denied for ${name}, repository does not exist or may require 'docker login'`;
  }
  out.push(`${tag}: Pulling from library/${name}`);
  out.push(`${hex(12)}: Pull complete`);
  out.push(`Digest: sha256:${hex(64)}`);
  out.push(`Status: Downloaded newer image for ${name}:${tag}`);
  out.push(`docker.io/library/${name}:${tag}`);
  const image = { name, tag, id: hex(12), size: spec.size, spec };
  state.images.push(image);
  return null;
}

const ago = (t) => {
  const s = Math.max(1, Math.round((Date.now() - t) / 1000));
  return s < 60 ? `${s} seconds ago` : `${Math.round(s / 60)} minutes ago`;
};

const statusText = (c) =>
  c.status === 'running'
    ? `Up ${ago(c.startedAt).replace(' ago', '')}`
    : c.status === 'created'
      ? 'Created'
      : `Exited (${c.exitCode}) ${ago(c.finishedAt)}`;

const HELP = `
Usage:  docker [OPTIONS] COMMAND

Common Commands:
  run         Create and run a new container from an image
  exec        Execute a command in a running container
  ps          List containers
  build       Build an image from a Dockerfile
  compose     Docker Compose: define and run multi-container applications
  pull        Download an image from a registry
  images      List images
  logs        Fetch the logs of a container
  start       Start one or more stopped containers
  stop        Stop one or more running containers
  restart     Restart one or more containers
  kill        Kill one or more running containers
  rm          Remove one or more containers
  rmi         Remove one or more images
  inspect     Return low-level information on Docker objects
  history     Show the history of an image (sus capas)
  tag         Create a tag TARGET_IMAGE that refers to SOURCE_IMAGE
  version     Show the Docker version information
`;

// Punto de entrada de la orden `docker`. Devuelve { out, err, code } como
// el resto de órdenes; para `run -it` y `exec -it` añade enterShell con el
// contenedor en el que la terminal debe «entrar».
export function dockerCommand(sh, argv) {
  const state = sh.docker;
  const [sub, ...rest] = argv.slice(1);
  const out = [];
  const res = (code = 0, err = '') => ({ out: out.length ? out.join('\n') + '\n' : '', err, code });

  switch (sub) {
    case undefined:
    case '--help':
    case 'help':
      return { out: HELP, err: '', code: 0 };

    case 'version':
    case '--version':
      return { out: 'Docker version 27.3.1, build ce12230\n', err: '', code: 0 };

    case 'pull': {
      if (!rest[0]) return res(1, '"docker pull" requires exactly 1 argument.');
      const e = pullImage(state, rest[0], out);
      return res(e ? 1 : 0, e ?? '');
    }

    case 'images':
    case 'image': {
      if (sub === 'image' && rest[0] !== 'ls') return res(1, `docker image ${rest[0] ?? ''}: no disponible en el simulador; usa «docker images».`);
      out.push('REPOSITORY    TAG       IMAGE ID       CREATED       SIZE');
      for (const i of state.images) {
        out.push(`${i.name.padEnd(13)} ${i.tag.padEnd(9)} ${i.id.padEnd(14)} ${(i.created ? ago(i.created) : '2 weeks ago').padEnd(13)} ${i.size}`);
      }
      return res();
    }

    case 'run':
    case 'create':
      return runContainer(sh, rest, out, sub === 'create');

    case 'ps':
    case 'container': {
      const args = sub === 'container' ? rest.slice(1) : rest;
      if (sub === 'container' && rest[0] !== 'ls') return res(1, 'Usa «docker ps» para listar contenedores.');
      const { flags } = getopts(args);
      const list = state.containers.filter((c) => flags.a || c.status === 'running');
      if (flags.q) {
        out.push(...list.map((c) => c.id.slice(0, 12)));
        return res();
      }
      out.push('CONTAINER ID   IMAGE     COMMAND                  CREATED          STATUS                     PORTS                  NAMES');
      for (const c of list) {
        const ports = c.ports.map((p) => `0.0.0.0:${p.host}->${p.container}/tcp`).join(', ');
        out.push(
          `${c.id.slice(0, 12)}   ${c.image.padEnd(9)} "${c.cmd.slice(0, 20)}"`.padEnd(66) +
            `${ago(c.createdAt).padEnd(17)}${statusText(c).padEnd(27)}${ports.padEnd(23)}${c.name}`,
        );
      }
      return res();
    }

    case 'stop':
    case 'kill':
    case 'start':
    case 'restart': {
      if (!rest.length) return res(1, `"docker ${sub}" requires at least 1 argument.`);
      const errs = [];
      for (const ref of rest) {
        const { container: c, error } = findContainer(state, ref);
        if (error) {
          errs.push(error);
          continue;
        }
        if (sub === 'start' || sub === 'restart') {
          startContainer(c, sh);
        } else if (c.status !== 'running') {
          if (sub === 'kill') {
            errs.push(`Error response from daemon: cannot kill container: ${ref}: container ${c.id} is not running`);
            continue;
          }
        } else {
          // stop manda SIGTERM y espera a que el proceso acabe ordenadamente;
          // kill manda SIGKILL y lo corta en seco (código de salida 137).
          c.status = 'exited';
          c.exitCode = sub === 'kill' ? 137 : 0;
          c.finishedAt = Date.now();
          c.stoppedBy = sub;
          c.logs.push(sub === 'kill' ? '(proceso terminado con SIGKILL)' : '[notice] 1#1: signal 15 (SIGTERM) received, exiting');
        }
        out.push(ref);
      }
      return res(errs.length ? 1 : 0, errs.join('\n'));
    }

    case 'rm': {
      const { flags, args } = getopts(rest);
      if (!args.length) return res(1, '"docker rm" requires at least 1 argument.');
      const errs = [];
      for (const ref of args) {
        const { container: c, error } = findContainer(state, ref);
        if (error) {
          errs.push(error);
          continue;
        }
        if (c.status === 'running' && !flags.f) {
          errs.push(
            `Error response from daemon: cannot remove container "/${c.name}": container is running: stop the container before removing or force remove`,
          );
          continue;
        }
        state.containers = state.containers.filter((x) => x !== c);
        out.push(ref);
      }
      return res(errs.length ? 1 : 0, errs.join('\n'));
    }

    case 'rmi': {
      const { flags, args } = getopts(rest);
      if (!args.length) return res(1, '"docker rmi" requires at least 1 argument.');
      const errs = [];
      for (const ref of args) {
        const img = findImage(state, ref);
        if (!img) {
          errs.push(`Error response from daemon: No such image: ${ref}`);
          continue;
        }
        const user = state.containers.find((c) => c.imageId === img.id);
        if (user && !flags.f) {
          errs.push(
            `Error response from daemon: conflict: unable to remove repository reference "${ref}" (must force) - container ${user.id.slice(0, 12)} is using its referenced image ${img.id}`,
          );
          continue;
        }
        state.images = state.images.filter((i) => i !== img);
        out.push(`Untagged: ${img.name}:${img.tag}`, `Deleted: sha256:${img.id}${hex(52)}`);
      }
      return res(errs.length ? 1 : 0, errs.join('\n'));
    }

    case 'logs': {
      const { args } = getopts(rest);
      if (!args[0]) return res(1, '"docker logs" requires exactly 1 argument.');
      const { container: c, error } = findContainer(state, args[0]);
      if (error) return res(1, error);
      out.push(...c.logs);
      return res();
    }

    case 'exec': {
      const { flags, positional } = leadingOpts(rest);
      const [ref, ...cmd] = positional;
      if (!ref || !cmd.length) return res(1, '"docker exec" requires at least 2 arguments.');
      const { container: c, error } = findContainer(state, ref);
      if (error) return res(1, error);
      if (c.status !== 'running') return res(1, `Error response from daemon: container ${c.id} is not running`);
      if (['bash', 'sh', '/bin/bash', '/bin/sh'].includes(cmd[0])) {
        if (flags.i && flags.t) return { out: '', err: '', code: 0, enterShell: c };
        return res(0, '');
      }
      return { out: '', err: '', code: 0, execIn: { container: c, argv: cmd } };
    }

    case 'inspect': {
      if (!rest[0]) return res(1, '"docker inspect" requires at least 1 argument.');
      const { container: c, error } = findContainer(state, rest[0]);
      if (error) return res(1, error);
      out.push(
        JSON.stringify(
          [
            {
              Id: c.id,
              Name: '/' + c.name,
              State: { Status: c.status, Running: c.status === 'running', ExitCode: c.exitCode ?? 0 },
              Config: { Image: c.image, Cmd: c.cmd.split(' '), Env: c.env },
              HostConfig: { PortBindings: Object.fromEntries(c.ports.map((p) => [`${p.container}/tcp`, [{ HostPort: String(p.host) }]])) },
            },
          ],
          null,
          2,
        ),
      );
      return res();
    }

    case 'build':
      return buildCommand(sh, rest);

    case 'compose':
      return composeCommand(sh, rest);

    case 'history': {
      if (!rest[0]) return res(1, '"docker history" requires exactly 1 argument.');
      const img = findImage(state, rest[0]);
      if (!img) return res(1, `Error response from daemon: No such image: ${rest[0]}`);
      out.push('IMAGE          CREATED          CREATED BY                                      SIZE');
      const layers = [...(img.spec.history ?? [])].reverse();
      for (const [i, l] of layers.entries()) {
        out.push(`${(i === 0 ? img.id : '<missing>').padEnd(14)} ${(img.created ? ago(img.created) : '2 weeks ago').padEnd(16)} ${l.by.slice(0, 47).padEnd(47)} ${l.size}`);
      }
      out.push(`<missing>      2 weeks ago      (capas de la imagen base ${img.spec.base ?? img.name})`.padEnd(80) + (img.spec.baseSize ?? img.size));
      return res();
    }

    case 'tag': {
      const [src, dst] = rest;
      if (!src || !dst) return res(1, '"docker tag" requires exactly 2 arguments.');
      const img = findImage(state, src);
      if (!img) return res(1, `Error response from daemon: No such image: ${src}`);
      const { name, tag } = parseRef(dst);
      state.images = state.images.filter((i) => !(i.name === name && i.tag === tag));
      state.images.push({ ...img, name, tag });
      return res();
    }

    case 'push':
      return res(1, `denied: requested access to the resource is denied (en el simulador no hay registro al que subir: haría falta «docker login» y una cuenta)`);

    default:
      return res(1, `docker: '${sub}' is not a docker command.\nSee 'docker --help'`);
  }
}

export function startContainer(c, sh) {
  const spec = c.spec;
  c.startedAt = Date.now();
  if (spec.requiresEnv && !c.env.some((e) => e.startsWith(spec.requiresEnv + '='))) {
    c.status = 'exited';
    c.exitCode = 1;
    c.finishedAt = Date.now();
    c.logs.push(
      '[ERROR] [Entrypoint]: Database is uninitialized and password option is not specified',
      `    You need to specify one of the following as an environment variable:\n    - ${spec.requiresEnv}`,
    );
    return;
  }
  const isShell = ['bash', 'sh', '/bin/bash', '/bin/sh'].includes(c.cmd.split(' ')[0]);
  if (spec.longRunning && !c.customCmd) {
    c.status = 'running';
    if (!c.logs.length) c.logs.push(...(spec.logs ?? []));
  } else if (c.interactive) {
    c.status = 'running';
  } else if (c.customCmd && longRunningCmd(c.cmd)) {
    c.status = 'running';
    c.logs.push(`(en marcha: ${c.cmd})`);
  } else {
    c.status = 'exited';
    c.exitCode = 0;
    c.finishedAt = Date.now();
    if (spec.output && !c.customCmd) c.logs.push(...spec.output.trim().split('\n'));
    else if (sh?.exec && !isShell && (c.customCmd || spec.built)) {
      // Un programa que termina: se ejecuta de verdad dentro del contenedor
      // y lo que escribe queda en sus logs (docker run ubuntu cat /etc/os-release).
      const r = sh.exec({ fs: c.fs, cwd: spec.workdir ?? '/', home: '/root', user: 'root', host: c.id.slice(0, 12), container: c }, c.cmd);
      const text = (r.out + (r.err ? r.err + '\n' : '')).replace(/\n$/, '');
      if (text) c.logs.push(...text.split('\n'));
      c.exitCode = r.code;
    }
  }
}

// ¿La orden se queda en marcha (un servidor) o termina?
const longRunningCmd = (cmd) => /\b(nginx|httpd|http\.server|flask|gunicorn|uvicorn|node|npm start|java -jar|mysqld|sleep infinity|tail -f|serve)\b/.test(cmd);

function runContainer(sh, rest, out, createOnly) {
  const state = sh.docker;
  const { flags, ports, env, name, positional } = leadingOpts(rest);
  const [ref, ...cmd] = positional;
  if (!ref) return { out: '', err: '"docker run" requires at least 1 argument.', code: 1 };

  const made = createContainer(sh, { ref, name, ports, env, cmd, interactive: Boolean(flags.i && flags.t) }, out);
  if (made.error) return { out: out.length ? out.join('\n') + '\n' : '', err: made.error, code: made.code ?? 125 };
  const c = made.container;
  if (createOnly) {
    out.push(c.id);
    return { out: out.join('\n') + '\n', err: '', code: 0 };
  }
  startContainer(c, sh);

  // Contenedor que entra en una shell (docker run -it ubuntu bash).
  const wantsShell = c.interactive && (!cmd.length || ['bash', 'sh', '/bin/bash', '/bin/sh'].includes(cmd[0]));
  if (wantsShell && c.status === 'running') {
    return { out: out.length ? out.join('\n') + '\n' : '', err: '', code: 0, enterShell: c, removeOnExit: Boolean(flags.rm) };
  }
  if (c.interactive && c.status === 'running' && !wantsShell) c.status = 'exited';

  if (flags.d) {
    out.push(c.id);
  } else if (c.status === 'running') {
    // Sin -d, un servidor se queda «enganchado» a la terminal mostrando sus
    // logs. En el simulador lo mostramos y lo dejamos en marcha.
    out.push(...c.logs);
    out.push('(El contenedor sigue en marcha en primer plano. En una terminal real se quedaría ocupada hasta pulsar Ctrl+C; por eso se suele usar -d.)');
  } else {
    out.push(...c.logs);
  }
  if (flags.rm && c.status === 'exited') state.containers = state.containers.filter((x) => x !== c);
  return { out: out.join('\n') + '\n', err: '', code: 0 };
}

// Crea (sin arrancar) un contenedor. Lo usan docker run/create y compose.
// ports son textos «8080:80»; si la imagen no está, se descarga.
export function createContainer(sh, { ref, name, ports = [], env = [], cmd = [], interactive = false }, out) {
  const state = sh.docker;
  if (name && state.containers.some((c) => c.name === name)) {
    return {
      error: `docker: Error response from daemon: Conflict. The container name "/${name}" is already in use. You have to remove (or rename) that container to be able to reuse that name.`,
      code: 125,
    };
  }

  const published = [];
  for (const p of ports) {
    const m = String(p).match(/^(?:[\d.]+:)?(\d+):(\d+)(?:\/tcp)?$/);
    if (!m) return { error: `docker: invalid publish spec: ${p}`, code: 125 };
    const host = Number(m[1]);
    const busy =
      Object.values(sh.services).some((s) => s.active && s.port === host) ||
      (sh.procs ?? []).some((x) => x.port === host) ||
      state.containers.some((c) => c.status === 'running' && c.ports.some((x) => x.host === host));
    if (busy) {
      return {
        error: `docker: Error response from daemon: driver failed programming external connectivity: Bind for 0.0.0.0:${host} failed: port is already allocated.`,
        code: 125,
      };
    }
    published.push({ host, container: Number(m[2]) });
  }

  let image = findImage(state, ref);
  if (!image) {
    const { name: n, tag } = parseRef(ref);
    out.push(`Unable to find image '${n}:${tag}' locally`);
    const e = pullImage(state, ref, out);
    if (e) return { error: 'docker: ' + e, code: 125 };
    image = findImage(state, ref);
  }

  const c = {
    id: hex(64),
    name: name ?? `${pick(ADJ)}_${pick(NOUN)}`,
    image: image.tag === 'latest' ? image.name : `${image.name}:${image.tag}`,
    imageId: image.id,
    spec: image.spec,
    cmd: cmd.length ? cmd.join(' ') : image.spec.defaultCmd,
    customCmd: cmd.length > 0,
    interactive,
    ports: published,
    env: [...(image.spec.env ?? []), ...env],
    fs: cloneNode(image.spec.fs()),
    logs: [],
    status: 'created',
    createdAt: Date.now(),
  };
  state.containers.push(c);
  return { container: c };
}

// ── docker build ────────────────────────────────────────────────────────

const STEP_INSTR = ['FROM', 'RUN', 'COPY', 'ADD', 'WORKDIR'];
const META_INSTR = ['ENV', 'EXPOSE', 'CMD', 'ENTRYPOINT', 'LABEL', 'USER', 'ARG', 'VOLUME', 'HEALTHCHECK', 'MAINTAINER', 'STOPSIGNAL', 'SHELL', 'ONBUILD'];
// Herramientas de construcción que el simulador no ejecuta pero da por buenas.
const FAKE_BUILD_TOOLS = ['pip', 'pip3', 'npm', 'yarn', 'useradd', 'adduser', 'groupadd', 'addgroup', 'ln', 'mvn', 'gradle', 'composer', 'go', 'make', 'apt-mark', 'update-ca-certificates', 'locale-gen'];

function buildCommand(sh, rest) {
  let tag = null;
  let file = null;
  let context = null;
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (a === '-t' || a === '--tag') tag = rest[++i];
    else if (a.startsWith('--tag=')) tag = a.slice(6);
    else if (a === '-f' || a === '--file') file = rest[++i];
    else if (a.startsWith('--file=')) file = a.slice(7);
    else if (a.startsWith('-')) continue; // --no-cache, -q, --progress=plain…
    else if (context === null) context = a;
    else return { out: '', err: 'ERROR: "docker buildx build" requires exactly 1 argument.', code: 1 };
  }
  if (context === null) return { out: '', err: 'ERROR: "docker buildx build" requires exactly 1 argument.\n(Falta el contexto: casi siempre «.», el directorio actual. Ejemplo: docker build -t mi-web:1.0 .)', code: 1 };
  const r = buildImage(sh, { context, file, tag });
  return { out: r.lines.length ? r.lines.join('\n') + '\n' : '', err: r.error ?? '', code: r.error ? 1 : 0 };
}

// Construye una imagen y la añade a las locales. Devuelve { lines, error, image }.
export function buildImage(sh, { context, file, tag, cwd }) {
  const host = sh.hostCtx;
  const base = cwd ?? host.cwd;
  const ctxDir = resolve(context, base, host.home);
  const ctxNode = getNode(host.fs, ctxDir);
  if (!ctxNode || ctxNode.type !== 'dir') return { lines: [], error: `ERROR: unable to prepare context: path "${context}" not found` };
  const dfPath = file ? resolve(file, base, host.home) : `${ctxDir}/Dockerfile`;
  const dfName = file ?? 'Dockerfile';
  const df = getNode(host.fs, dfPath);
  if (!df || df.type !== 'file') return { lines: [], error: `ERROR: failed to solve: failed to read dockerfile: open ${dfName}: no such file or directory` };

  // Instrucciones, uniendo las líneas que acaban en «\».
  const instrs = [];
  let pending = '';
  let startLine = 0;
  df.content.split('\n').forEach((raw, idx) => {
    const t = raw.trim();
    if (!pending && (!t || t.startsWith('#'))) return;
    if (!pending) startLine = idx + 1;
    if (t.endsWith('\\')) {
      pending += t.slice(0, -1) + ' ';
      return;
    }
    const full = (pending + t).trim();
    pending = '';
    const m = full.match(/^(\w+)\s*(.*)$/);
    instrs.push({ op: m[1].toUpperCase(), arg: m[2], line: startLine, text: full });
  });
  if (!instrs.length) return { lines: [], error: 'ERROR: failed to solve: the Dockerfile cannot be empty' };
  for (const ins of instrs) {
    if (!STEP_INSTR.includes(ins.op) && !META_INSTR.includes(ins.op)) {
      return { lines: [], error: `ERROR: failed to solve: dockerfile parse error on line ${ins.line}: unknown instruction: ${ins.op}` };
    }
  }
  const firstReal = instrs.find((x) => x.op !== 'ARG');
  if (firstReal.op !== 'FROM') return { lines: [], error: `ERROR: failed to solve: no build stage in current context (la primera instrucción tiene que ser FROM; aquí es ${firstReal.op})` };

  const state = sh.docker;
  const total = instrs.filter((x) => STEP_INSTR.includes(x.op)).length;
  const lines = [];
  const steps = [` => [internal] load build definition from ${dfName.split('/').pop()}`];
  let n = 0;
  let baseImg = null;
  let fsRoot = null;
  let workdir = '/';
  let env = [];
  let exposes = null;
  let cmd = null;
  let entrypoint = null;
  const history = [];
  let pkgs = null;
  const buildC = { id: hex(64), spec: null, packages: null };
  const ctxFor = () => ({ fs: fsRoot, cwd: workdir, home: '/root', user: 'root', host: 'buildkit', container: buildC });
  const execForm = (arg) => {
    try {
      const a = JSON.parse(arg);
      if (Array.isArray(a)) return a.join(' ');
    } catch (_) {
      /* forma shell */
    }
    return arg;
  };
  const failStep = (label, msg, detail) => {
    steps.push(` => ERROR ${label}`);
    return {
      lines: [`[+] Building 1.4s (${n}/${total}) FINISHED`, ...steps, '------', ` > ${label}:`, ...(detail ? detail.split('\n').map((l) => `   ${l}`) : []), '------'],
      error: `ERROR: failed to solve: ${msg}`,
    };
  };

  for (const ins of instrs) {
    const { op, arg } = ins;
    if (STEP_INSTR.includes(op)) n++;
    const label = `[${n}/${total}] ${op} ${arg}`;
    switch (op) {
      case 'FROM': {
        const ref = arg.split(/\s+/)[0];
        const { name, tag: t } = parseRef(ref);
        steps.splice(1, 0, ` => [internal] load metadata for docker.io/library/${name}:${t}`);
        let img = findImage(state, ref);
        if (!img) {
          const e = pullImage(state, ref, []);
          if (e) return failStep(label, `docker.io/library/${name}:${t}: not found`, `pull access denied, repository does not exist or may require authorization (la imagen base «${ref}» no existe)`);
          img = findImage(state, ref);
        }
        baseImg = img;
        fsRoot = cloneNode(img.spec.fs());
        buildC.spec = img.spec;
        buildC.packages = img.spec.packages ? structuredClone(img.spec.packages) : null;
        workdir = img.spec.workdir ?? '/';
        env = [...(img.spec.env ?? [])];
        exposes = img.spec.exposes ?? null;
        steps.push(` => [${n}/${total}] FROM docker.io/library/${name}:${t}`);
        break;
      }
      case 'WORKDIR': {
        workdir = resolve(arg, workdir, '/root');
        mkdirP(fsRoot, workdir);
        steps.push(` => [${n}/${total}] WORKDIR ${arg}`);
        history.push({ by: `WORKDIR ${arg}`, size: '0B' });
        break;
      }
      case 'COPY':
      case 'ADD': {
        const parts = arg.split(/\s+/).filter((x) => !x.startsWith('--'));
        if (arg.includes('--from=')) return failStep(label, 'COPY --from (construcciones multietapa) no está disponible en el simulador');
        if (parts.length < 2) return failStep(label, `dockerfile parse error on line ${ins.line}: ${op} requires at least two arguments`);
        const dest = parts.pop();
        const destAbs = resolve(dest, workdir, '/root');
        if (!steps.some((x) => x.includes('load build context'))) steps.push(' => [internal] load build context');
        let bytes = 0;
        for (const src of parts) {
          const srcAbs = resolve(src, ctxDir, host.home);
          if (srcAbs !== ctxDir && !srcAbs.startsWith(ctxDir + '/')) return failStep(label, `failed to compute cache key: "${src}": not found (fuera del contexto de construcción)`);
          const node = getNode(host.fs, srcAbs);
          if (!node) return failStep(label, `failed to compute cache key: failed to calculate checksum of ref: "/${src.replace(/^\.?\//, '')}": not found`);
          walk(node, '', (_p, x) => x.type === 'file' && (bytes += x.content.length));
          if (node.type === 'dir') {
            // COPY de un directorio copia su CONTENIDO, no el directorio.
            mkdirP(fsRoot, destAbs);
            for (const [k, child] of Object.entries(node.children)) setNode(fsRoot, `${destAbs === '/' ? '' : destAbs}/${k}`, cloneNode(child));
          } else {
            const intoDir = dest.endsWith('/') || parts.length > 1 || getNode(fsRoot, destAbs)?.type === 'dir';
            const target = intoDir ? `${destAbs === '/' ? '' : destAbs}/${srcAbs.split('/').pop()}` : destAbs;
            mkdirP(fsRoot, intoDir ? destAbs : target.split('/').slice(0, -1).join('/') || '/');
            setNode(fsRoot, target, { ...cloneNode(node), owner: 'root' });
          }
        }
        steps.push(` => [${n}/${total}] ${op} ${arg}`);
        history.push({ by: `${op} ${arg}`, size: `${Math.max(1, Math.round(bytes / 1024))}kB` });
        break;
      }
      case 'RUN': {
        const line = execForm(arg);
        steps.push(` => [${n}/${total}] RUN ${line}`);
        let output = '';
        let code = 0;
        // Se ejecuta tramo a tramo para dar por buenas las herramientas que el simulador no tiene.
        for (const part of line.split(/\s*&&\s*/)) {
          const word = part.trim().split(/\s+/)[0];
          if (FAKE_BUILD_TOOLS.includes(word) || word === 'python3' && /-m pip/.test(part)) {
            output += `(simulado) ${part.trim()}\n`;
            continue;
          }
          const r = sh.exec(ctxFor(), part);
          output += r.out + (r.err ? r.err + '\n' : '');
          code = r.code;
          if (code !== 0) break;
        }
        if (code !== 0) return failStep(`[${n}/${total}] RUN ${line}`, `process "/bin/sh -c ${line}" did not complete successfully: exit code: ${code}`, output.trimEnd());
        for (const l of output.trimEnd().split('\n').filter(Boolean).slice(-4)) steps.push(` => => # ${l}`);
        history.push({ by: `RUN /bin/sh -c ${line}`, size: /install|add /.test(line) ? '38.2MB' : '0B' });
        break;
      }
      case 'ENV': {
        const m = arg.match(/^(\w+)=(.*)$/) ?? arg.match(/^(\w+)\s+(.*)$/);
        if (!m) return failStep(label, `dockerfile parse error on line ${ins.line}: ENV must have two arguments`);
        env = [...env.filter((e) => !e.startsWith(m[1] + '=')), `${m[1]}=${m[2].replace(/^"(.*)"$/, '$1')}`];
        history.push({ by: `ENV ${arg}`, size: '0B' });
        break;
      }
      case 'EXPOSE':
        exposes = Number(arg.split(/[\s/]/)[0]);
        history.push({ by: `EXPOSE ${arg}`, size: '0B' });
        break;
      case 'CMD':
        cmd = execForm(arg);
        history.push({ by: `CMD ${arg}`, size: '0B' });
        break;
      case 'ENTRYPOINT':
        entrypoint = execForm(arg);
        history.push({ by: `ENTRYPOINT ${arg}`, size: '0B' });
        break;
      default:
        history.push({ by: `${op} ${arg}`, size: '0B' });
    }
  }
  pkgs = buildC.packages;

  const { name, tag: t } = tag ? parseRef(tag) : { name: '<none>', tag: '<none>' };
  const finalCmd = [entrypoint, cmd ?? (entrypoint ? null : baseImg.spec.defaultCmd)].filter(Boolean).join(' ');
  const snapshot = fsRoot;
  const id = hex(12);
  const spec = {
    ...baseImg.spec,
    built: true,
    base: baseImg.name,
    baseSize: baseImg.size,
    size: bumpSize(baseImg.size, history),
    defaultCmd: finalCmd,
    longRunning: cmd || entrypoint ? longRunningCmd(finalCmd) : baseImg.spec.longRunning,
    output: undefined,
    exposes,
    env,
    workdir,
    packages: pkgs,
    history: [...(baseImg.spec.history ?? []), ...history],
    fs: () => cloneNode(snapshot),
  };
  if (spec.longRunning && !spec.logs) spec.logs = [`(en marcha: ${finalCmd})`];
  const image = { name, tag: t, id, size: spec.size, spec, created: Date.now() };
  if (tag) state.images = state.images.filter((i) => !(i.name === name && i.tag === t));
  state.images.push(image);
  steps.push(' => exporting to image', ' => => exporting layers', ` => => writing image sha256:${id}${hex(52)}`);
  if (tag) steps.push(` => => naming to docker.io/library/${name}:${t}`);
  lines.push(`[+] Building 3.${n}s (${total + 3}/${total + 3}) FINISHED`, ...steps);
  if (!tag) lines.push('(Sin -t la imagen queda sin nombre, como <none>. Ponle uno: docker build -t nombre:versión .)');
  return { lines, image };
}

function mkdirP(fsRoot, abs) {
  let p = '';
  for (const seg of abs.split('/').filter(Boolean)) {
    p += '/' + seg;
    if (!getNode(fsRoot, p)) setNode(fsRoot, p, dir({}, '755', 'root'));
  }
}

function bumpSize(size, history) {
  const m = String(size).match(/^([\d.]+)(kB|MB|GB)$/);
  if (!m) return size;
  const mb = Number(m[1]) * { kB: 1 / 1000, MB: 1, GB: 1000 }[m[2]] + history.filter((h) => h.size.endsWith('MB')).length * 38.2 + 0.1;
  return mb >= 1000 ? `${(mb / 1000).toFixed(2)}GB` : `${Math.round(mb)}MB`;
}

// En `docker run` y `docker exec` las opciones solo van ANTES de la imagen
// o del contenedor: todo lo que sigue es la orden que se ejecuta dentro
// (`docker run ubuntu ls -l` → el -l es de ls, no de docker).
function leadingOpts(rest) {
  const flags = {};
  const ports = [];
  const env = [];
  let name = null;
  let i = 0;
  for (; i < rest.length; i++) {
    const a = rest[i];
    if (!a.startsWith('-')) break;
    if (a === '-p' || a === '--publish') ports.push(rest[++i]);
    else if (/^-p\d/.test(a)) ports.push(a.slice(2));
    else if (a === '-e' || a === '--env') env.push(rest[++i]);
    else if (a === '--name') name = rest[++i];
    else if (a.startsWith('--name=')) name = a.slice(7);
    else if (a.startsWith('--')) flags[a.slice(2)] = true;
    else for (const f of a.slice(1)) flags[f] = true;
  }
  return { flags, ports, env, name, positional: rest.slice(i) };
}
