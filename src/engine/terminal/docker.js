// Docker simulado. Reproduce el ciclo de vida que pregunta el examen
// (pull → images → run → ps → logs → exec → stop/kill → rm → rmi) con
// mensajes calcados de los reales, para que lo que el alumno vea aquí sea
// lo mismo que verá en una máquina con Docker de verdad.
//
// Cada contenedor recibe su propia copia del sistema de ficheros de la
// imagen: lo que se cree dentro con `docker exec` vive y muere con él.

import { getopts } from './parse.js';
import { dir, file, cloneNode } from './vfs.js';

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
  ubuntu: { size: '78.1MB', defaultCmd: 'bash', longRunning: false, shell: 'bash', fs: () => baseFs() },
  alpine: { size: '7.8MB', defaultCmd: 'sh', longRunning: false, shell: 'sh', fs: () => baseFs() },
  mysql: {
    size: '602MB',
    defaultCmd: 'mysqld',
    longRunning: true,
    exposes: 3306,
    requiresEnv: 'MYSQL_ROOT_PASSWORD',
    logs: ['[System] [MY-010931] [Server] /usr/sbin/mysqld: ready for connections. port: 3306'],
    fs: () => baseFs({ var: dir({ lib: dir({ mysql: dir() }), log: dir() }) }),
  },
  python: { size: '1.02GB', defaultCmd: 'python3', longRunning: false, shell: 'bash', fs: () => baseFs() },
};

const hex = (n) => Array.from({ length: n }, () => Math.floor(Math.random() * 16).toString(16)).join('');
const ADJ = ['agitado', 'brillante', 'curioso', 'decidido', 'eficaz', 'feliz', 'sereno', 'valiente'];
const NOUN = ['turing', 'hopper', 'lovelace', 'torvalds', 'ritchie', 'hamilton', 'knuth', 'dijkstra'];
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export function createDockerState() {
  return { images: [], containers: [] };
}

const parseRef = (ref) => {
  const [name, tag = 'latest'] = ref.split(':');
  return { name, tag };
};

function findImage(state, ref) {
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

function pullImage(state, ref, out) {
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
  build       Build an image from a Dockerfile (no disponible en el simulador)
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
        out.push(`${i.name.padEnd(13)} ${i.tag.padEnd(9)} ${i.id.padEnd(14)} 2 weeks ago   ${i.size}`);
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
          startContainer(c);
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
      return res(1, 'docker build no está disponible en el simulador (de momento). Lo verás en una lección teórica.');

    default:
      return res(1, `docker: '${sub}' is not a docker command.\nSee 'docker --help'`);
  }
}

function startContainer(c) {
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
  if (spec.longRunning && !c.customCmd) {
    c.status = 'running';
    if (!c.logs.length) c.logs.push(...(spec.logs ?? []));
  } else if (c.interactive) {
    c.status = 'running';
  } else {
    c.status = 'exited';
    c.exitCode = 0;
    c.finishedAt = Date.now();
    if (spec.output) c.logs.push(...spec.output.trim().split('\n'));
  }
}

function runContainer(sh, rest, out, createOnly) {
  const state = sh.docker;
  const { flags, ports, env, name, positional } = leadingOpts(rest);
  const [ref, ...cmd] = positional;
  if (!ref) return { out: '', err: '"docker run" requires at least 1 argument.', code: 1 };

  if (name && state.containers.some((c) => c.name === name)) {
    return {
      out: '',
      err: `docker: Error response from daemon: Conflict. The container name "/${name}" is already in use. You have to remove (or rename) that container to be able to reuse that name.`,
      code: 125,
    };
  }

  const published = [];
  for (const p of ports) {
    const m = String(p).match(/^(\d+):(\d+)$/);
    if (!m) return { out: '', err: `docker: invalid publish spec: ${p}`, code: 125 };
    const host = Number(m[1]);
    const busy =
      Object.values(sh.services).some((s) => s.active && s.port === host) ||
      state.containers.some((c) => c.status === 'running' && c.ports.some((x) => x.host === host));
    if (busy) {
      return {
        out: '',
        err: `docker: Error response from daemon: driver failed programming external connectivity: Bind for 0.0.0.0:${host} failed: port is already allocated.`,
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
    if (e) return { out: out.join('\n') + '\n', err: 'docker: ' + e, code: 125 };
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
    interactive: Boolean(flags.i && flags.t),
    ports: published,
    env,
    fs: cloneNode(image.spec.fs()),
    logs: [],
    status: 'created',
    createdAt: Date.now(),
  };
  state.containers.push(c);
  if (createOnly) {
    out.push(c.id);
    return { out: out.join('\n') + '\n', err: '', code: 0 };
  }
  startContainer(c);

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
