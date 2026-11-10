// Docker Compose (v2, «docker compose …») simulado. Lee compose.yaml (o
// docker-compose.yml) del directorio actual, y up/down/ps/logs/exec crean,
// listan y borran contenedores normales del Docker simulado, con los
// nombres y mensajes de la versión real: proyecto-servicio-1, red
// proyecto_default, «✔ Container … Started».
//
// Cada contenedor guarda c.compose = { project, service, hash }: si el
// fichero cambia, el siguiente «up» recrea solo los servicios afectados.

import { getNode, resolve } from './vfs.js';
import { parseYaml, dumpYaml } from './yaml.js';
import { buildImage, createContainer, findImage, pullImage, startContainer } from './docker.js';

const FILES = ['compose.yaml', 'compose.yml', 'docker-compose.yaml', 'docker-compose.yml'];
const SHELLS = ['bash', 'sh', '/bin/bash', '/bin/sh'];

const res = (lines = [], err = '', code = 0) => ({ out: lines.length ? lines.join('\n') + '\n' : '', err, code });

function loadProject(sh, opts) {
  const host = sh.hostCtx;
  let path;
  if (opts.file) path = resolve(opts.file, host.cwd, host.home);
  else path = FILES.map((f) => `${host.cwd === '/' ? '' : host.cwd}/${f}`).find((p) => getNode(host.fs, p)?.type === 'file');
  if (!path || getNode(host.fs, path)?.type !== 'file') {
    return { error: opts.file ? `open ${path}: no such file or directory` : 'no configuration file provided: not found\n(Busca compose.yaml o docker-compose.yml en el directorio actual: entra antes en la carpeta del proyecto con cd.)' };
  }
  let doc;
  try {
    doc = parseYaml(getNode(host.fs, path).content);
  } catch (e) {
    return { error: `${path}: ${e.message}` };
  }
  const dirPath = path.split('/').slice(0, -1).join('/') || '/';
  const project = (opts.project ?? dirPath.split('/').pop() ?? 'default').toLowerCase().replace(/[^a-z0-9_-]/g, '');
  const warnings = [];
  if (doc && typeof doc === 'object' && 'version' in doc) {
    warnings.push(`WARN[0000] ${path}: the attribute \`version\` is obsolete, it will be ignored, please remove it to avoid potential confusion`);
  }
  if (!doc || typeof doc !== 'object' || !doc.services || typeof doc.services !== 'object' || Array.isArray(doc.services)) {
    return { error: `${path}: no hay sección «services:» (o está vacía)` };
  }
  const services = {};
  for (const [name, raw] of Object.entries(doc.services)) {
    const svc = raw ?? {};
    if (typeof svc !== 'object' || Array.isArray(svc)) return { error: `services.${name} must be a mapping` };
    const allowed = ['image', 'build', 'ports', 'environment', 'container_name', 'depends_on', 'command', 'restart', 'volumes', 'networks', 'env_file', 'expose', 'healthcheck', 'labels', 'working_dir', 'user', 'entrypoint', 'hostname', 'deploy'];
    for (const k of Object.keys(svc)) if (!allowed.includes(k)) return { error: `validating ${path}: services.${name} additional properties '${k}' not allowed` };
    if (!svc.image && !svc.build) return { error: `service "${name}" has neither an image nor a build context specified: invalid compose project` };
    const env = [];
    if (Array.isArray(svc.environment)) env.push(...svc.environment.map(String));
    else if (svc.environment && typeof svc.environment === 'object') for (const [k, v] of Object.entries(svc.environment)) env.push(`${k}=${v ?? ''}`);
    const ports = (Array.isArray(svc.ports) ? svc.ports : svc.ports ? [svc.ports] : []).map(String);
    for (const p of ports) if (!/^(?:[\d.]+:)?\d+:\d+(?:\/tcp)?$/.test(p)) return { error: `services.${name}.ports: «${p}» no es válido (formato «anfitrión:contenedor», por ejemplo "8080:80")` };
    const deps = Array.isArray(svc.depends_on) ? svc.depends_on : svc.depends_on ? Object.keys(svc.depends_on) : [];
    for (const d of deps) if (!(d in doc.services)) return { error: `service "${name}" depends on undefined service "${d}": invalid compose project` };
    const build = typeof svc.build === 'string' ? { context: svc.build } : svc.build ? { context: svc.build.context ?? '.', dockerfile: svc.build.dockerfile } : null;
    const command = Array.isArray(svc.command) ? svc.command.map(String) : svc.command ? String(svc.command).split(/\s+/) : [];
    services[name] = {
      name,
      image: svc.image ? String(svc.image) : `${project}-${name}`,
      build,
      ports,
      env,
      deps,
      command,
      containerName: svc.container_name ? String(svc.container_name) : `${project}-${name}-1`,
      raw: svc,
    };
  }
  // Orden de arranque: primero las dependencias.
  const order = [];
  const seen = new Set();
  const visit = (n, stack = []) => {
    if (seen.has(n)) return null;
    if (stack.includes(n)) return `dependency cycle detected: ${[...stack, n].join(' -> ')}`;
    for (const d of services[n].deps) {
      const e = visit(d, [...stack, n]);
      if (e) return e;
    }
    seen.add(n);
    order.push(n);
    return null;
  };
  for (const n of Object.keys(services)) {
    const e = visit(n);
    if (e) return { error: e };
  }
  return { path, dir: dirPath, project, services, order, doc, warnings };
}

const projectContainers = (sh, project) => sh.docker.containers.filter((c) => c.compose?.project === project);

function parseOpts(argv) {
  const opts = {};
  let i = 0;
  for (; i < argv.length; i++) {
    const a = argv[i];
    if (a === '-f' || a === '--file') opts.file = argv[++i];
    else if (a === '-p' || a === '--project-name') opts.project = argv[++i];
    else break;
  }
  return { opts, sub: argv[i], rest: argv.slice(i + 1) };
}

export function composeCommand(sh, argv) {
  const { opts, sub, rest } = parseOpts(argv);
  if (!sub || sub === '--help' || sub === 'help') {
    return res([
      'Usage:  docker compose [OPTIONS] COMMAND',
      '',
      'Define and run multi-container applications with Docker',
      '',
      'Commands:',
      '  up          Create and start containers (-d en segundo plano, --build reconstruye)',
      '  down        Stop and remove containers, networks',
      '  ps          List containers (-a también los parados)',
      '  logs        View output from containers',
      '  exec        Execute a command in a running container',
      '  build       Build or rebuild services',
      '  start/stop/restart  Start, stop or restart services',
      '  config      Parse, resolve and render compose file in canonical format',
      '  version     Show the Docker Compose version information',
    ]);
  }
  if (sub === 'version') return res(['Docker Compose version v2.29.7']);

  const p = loadProject(sh, opts);
  if (p.error) return res([], p.error, 1);
  const warn = p.warnings;
  const flags = new Set(rest.filter((a) => a.startsWith('-')));
  const names = rest.filter((a) => !a.startsWith('-'));
  for (const n of sub === 'exec' ? names.slice(0, 1) : names) {
    if (!p.services[n] && !['exec'].includes(sub)) return res(warn, `no such service: ${n}`, 1);
  }
  const targets = names.length && sub !== 'exec' ? p.order.filter((n) => names.includes(n)) : p.order;
  const all = projectContainers(sh, p.project);
  const byService = (n) => all.find((c) => c.compose.service === n);

  switch (sub) {
    case 'config':
      return res([...warn, `name: ${p.project}`, dumpYaml({ services: Object.fromEntries(p.order.map((n) => [n, p.services[n].raw])) })]);

    case 'build': {
      const out = [...warn];
      for (const n of targets) {
        const s = p.services[n];
        if (!s.build) continue;
        const r = buildImage(sh, { context: s.build.context, file: s.build.dockerfile ? `${s.build.context}/${s.build.dockerfile}` : undefined, tag: s.image, cwd: p.dir });
        out.push(...r.lines);
        if (r.error) return res(out, r.error, 1);
      }
      return res(out);
    }

    case 'up': {
      const detach = flags.has('-d') || flags.has('--detach');
      const rebuild = flags.has('--build');
      const out = [...warn];
      const done = [];
      // 1. Construir o descargar lo que falte.
      for (const n of targets) {
        const s = p.services[n];
        if (s.build && (rebuild || !findImage(sh.docker, s.image))) {
          const r = buildImage(sh, { context: s.build.context, file: s.build.dockerfile ? `${s.build.context}/${s.build.dockerfile}` : undefined, tag: s.image, cwd: p.dir });
          out.push(...r.lines);
          if (r.error) return res(out, `failed to solve: ${r.error.replace(/^ERROR: failed to solve: /, '')}`, 1);
          done.push(['Service', n, 'Built']);
        } else if (!s.build && !findImage(sh.docker, s.image)) {
          const e = pullImage(sh.docker, s.image, []);
          if (e) return res([...out, ` ✘ ${n} Error`], `Error response from daemon: pull access denied for ${s.image.split(':')[0]}, repository does not exist or may require 'docker login'`, 1);
          done.push(['', n, 'Pulled']);
        }
      }
      // 2. La red del proyecto.
      const net = `${p.project}_default`;
      if (!sh.docker.networks.includes(net)) {
        sh.docker.networks.push(net);
        done.push(['Network', net, 'Created']);
      }
      // 3. Los contenedores, en orden de dependencias.
      for (const n of targets) {
        const s = p.services[n];
        const hash = JSON.stringify([s.image, s.ports, s.env, s.command, s.containerName, findImage(sh.docker, s.image)?.id]);
        let c = byService(n);
        const recreated = Boolean(c) && c.compose.hash !== hash;
        if (recreated) {
          sh.docker.containers = sh.docker.containers.filter((x) => x !== c);
          c = null;
        }
        if (c) {
          if (c.status === 'running') done.push(['Container', c.name, 'Running']);
          else {
            startContainer(c, sh);
            done.push(['Container', c.name, 'Started']);
          }
          continue;
        }
        const made = createContainer(sh, { ref: s.image, name: s.containerName, ports: s.ports, env: s.env, cmd: s.command }, []);
        if (made.error) {
          return res([...out, ...fmtRows(done), ` ✘ Container ${s.containerName}  Error`], made.error.replace(/^docker: /, ''), 1);
        }
        c = made.container;
        c.compose = { project: p.project, service: n, hash };
        startContainer(c, sh);
        done.push(['Container', c.name, recreated ? 'Recreated' : 'Started']);
      }
      out.push(`[+] Running ${done.length}/${done.length}`, ...fmtRows(done));
      const mine = projectContainers(sh, p.project);
      const dead = mine.filter((c) => c.status === 'exited' && c.exitCode);
      if (!detach) {
        out.push(`Attaching to ${mine.map((c) => c.name).join(', ')}`);
        for (const c of mine) for (const l of c.logs) out.push(`${(c.compose.service + '-1').padEnd(8)} | ${l}`);
        for (const c of dead) out.push(`${(c.compose.service + '-1').padEnd(8)} exited with code ${c.exitCode}`);
        out.push('(Sin -d, compose se queda mostrando los logs de todos los servicios hasta pulsar Ctrl+C, y al salir los para. En el simulador siguen en marcha; lo normal es usar «docker compose up -d».)');
      } else if (dead.length) {
        out.push(`(Ojo: ${dead.map((c) => c.compose.service).join(', ')} ha arrancado pero se ha parado enseguida. Míralo con «docker compose ps -a» y «docker compose logs».)`);
      }
      return res(out);
    }

    case 'down': {
      const out = [...warn];
      const rows = [];
      for (const c of [...all].reverse()) {
        if (c.status === 'running') {
          c.status = 'exited';
          c.exitCode = 0;
          c.finishedAt = Date.now();
          rows.push(['Container', c.name, 'Removed']);
        } else rows.push(['Container', c.name, 'Removed']);
        sh.docker.containers = sh.docker.containers.filter((x) => x !== c);
      }
      const net = `${p.project}_default`;
      if (sh.docker.networks.includes(net)) {
        sh.docker.networks = sh.docker.networks.filter((x) => x !== net);
        rows.push(['Network', net, 'Removed']);
      }
      if (!rows.length) return res([...out, 'Warning: No resource found to remove for project "' + p.project + '".']);
      out.push(`[+] Running ${rows.length}/${rows.length}`, ...fmtRows(rows));
      return res(out);
    }

    case 'ps': {
      const showAll = flags.has('-a') || flags.has('--all');
      const list = all.filter((c) => showAll || c.status === 'running');
      const head = ['NAME', 'IMAGE', 'COMMAND', 'SERVICE', 'STATUS', 'PORTS'];
      const rowsT = list.map((c) => [
        c.name,
        c.image,
        `"${c.cmd.length > 20 ? c.cmd.slice(0, 19) + '…' : c.cmd}"`,
        c.compose.service,
        c.status === 'running' ? 'Up' : `Exited (${c.exitCode ?? 0})`,
        c.ports.map((x) => `0.0.0.0:${x.host}->${x.container}/tcp`).join(', '),
      ]);
      const tbl = [head, ...rowsT];
      const w = head.map((_, i) => Math.max(...tbl.map((r) => r[i].length)));
      return res([...warn, ...tbl.map((r) => r.map((x, i) => x.padEnd(w[i])).join('   ').trimEnd())]);
    }

    case 'logs': {
      const out = [...warn];
      const w = Math.max(...all.map((c) => c.compose.service.length + 2), 0);
      for (const n of targets) {
        const c = byService(n);
        if (!c) continue;
        for (const l of c.logs) out.push(`${(n + '-1').padEnd(w)} | ${l}`);
      }
      if (flags.has('-f') || flags.has('--follow')) out.push('(Con -f se quedaría mostrando los logs nuevos en directo, hasta pulsar Ctrl+C.)');
      return res(out);
    }

    case 'stop':
    case 'start':
    case 'restart': {
      const rows = [];
      for (const n of targets) {
        const c = byService(n);
        if (!c) continue;
        if (sub !== 'start' && c.status === 'running') {
          c.status = 'exited';
          c.exitCode = 0;
          c.finishedAt = Date.now();
          c.stoppedBy = 'stop';
          rows.push(['Container', c.name, 'Stopped']);
        }
        if (sub !== 'stop') {
          startContainer(c, sh);
          rows.push(['Container', c.name, 'Started']);
        }
      }
      return res([...warn, `[+] Running ${rows.length}/${rows.length}`, ...fmtRows(rows)]);
    }

    case 'exec': {
      const opts2 = rest.filter((a) => a.startsWith('-'));
      const [svc, ...cmd] = names;
      if (!svc || !cmd.length) return res([], '"docker compose exec" requires at least 2 arguments.', 1);
      if (!p.services[svc]) return res([], `service "${svc}" is not running`, 1);
      const c = byService(svc);
      if (!c || c.status !== 'running') return res([], `service "${svc}" is not running`, 1);
      if (SHELLS.includes(cmd[0])) {
        if (opts2.includes('-T')) return res();
        return { out: '', err: '', code: 0, enterShell: c, viaExec: true };
      }
      return { out: '', err: '', code: 0, execIn: { container: c, argv: cmd } };
    }

    default:
      return res([], `unknown docker command: "compose ${sub}"\n(Prueba «docker compose --help».)`, 1);
  }
}

function fmtRows(rows) {
  const names = rows.map(([label, name]) => (label ? `${label} ${name}` : name));
  const w = Math.max(...names.map((x) => x.length), 0);
  return rows.map(([, , status], i) => ` ✔ ${names[i].padEnd(w)}  ${status}`);
}
