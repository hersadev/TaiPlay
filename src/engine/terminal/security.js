// Órdenes de seguridad de la terminal simulada: huellas (sha256sum,
// md5sum), propietarios (chown), cortafuegos de RHEL (firewall-cmd),
// sondas TCP (nc) y parámetros del kernel (sysctl).
//
// Se construyen con los ayudantes de commands.js (que las incorpora a su
// tabla) para no duplicar la lógica de permisos y lectura de ficheros.

import { sha256, md5 } from './hash.js';
import { getNode } from './vfs.js';

export const SECURITY_MANUAL = {
  sha256sum: 'sha256sum fichero… — calcula la huella SHA-256 de cada fichero. «sha256sum -c lista.sha256» comprueba los ficheros contra las huellas guardadas: si un solo byte cambia, la huella no coincide.',
  md5sum: 'md5sum fichero… — calcula la huella MD5 (128 bits). Está rota para seguridad: se pueden fabricar colisiones. Usa SHA-256. Admite -c como sha256sum.',
  chown: 'chown usuario[:grupo] fichero… — cambia el propietario (y el grupo). Solo root puede regalar ficheros. -R lo aplica a todo un directorio.',
  'firewall-cmd': 'firewall-cmd — gestiona firewalld, el cortafuegos de RHEL. --state, --list-all, --list-services, --list-ports, --add-service=https, --remove-service=telnet, --add-port=8080/tcp, --remove-port=… Con --permanent el cambio va a la configuración guardada (y no se aplica hasta --reload); sin él, solo al cortafuegos en marcha.',
  nc: 'nc -vz host puerto — (netcat) prueba si un puerto TCP acepta conexiones, sin enviar datos: -v explica qué pasa y -z solo comprueba (zero-I/O).',
  sysctl: 'sysctl clave — muestra un parámetro del kernel. sysctl -w clave=valor lo cambia en caliente (root). sysctl -p fichero carga los de un fichero (los de /etc/sysctl.d/*.conf sobreviven al reinicio).',
};

// Servicios que firewalld conoce, con sus puertos.
export const FW_SERVICES = {
  ssh: '22/tcp',
  http: '80/tcp',
  https: '443/tcp',
  telnet: '23/tcp',
  ftp: '21/tcp',
  mysql: '3306/tcp',
  imaps: '993/tcp',
  smtp: '25/tcp',
  dns: '53/tcp 53/udp',
  'dhcpv6-client': '546/udp',
  cockpit: '9090/tcp',
};

export const defaultFirewall = () => {
  const zone = { services: ['cockpit', 'dhcpv6-client', 'ssh'], ports: [] };
  return { running: true, zone: 'public', runtime: structuredClone(zone), permanent: structuredClone(zone) };
};

export const defaultSysctl = () => ({
  'net.ipv4.ip_forward': '0',
  'net.ipv4.conf.all.rp_filter': '0',
  'net.ipv4.conf.default.rp_filter': '0',
  'net.ipv4.tcp_syncookies': '1',
  'net.ipv4.conf.all.accept_redirects': '1',
  'net.ipv4.icmp_echo_ignore_broadcasts': '1',
  'kernel.randomize_va_space': '2',
});

// Equipos remotos a los que se puede «llamar» con nc.
export const defaultRemote = () => ({
  '10.30.20.30': { name: 'db01', ports: [22, 3306] },
  '10.30.20.5': { name: 'dhcp01', ports: [22] },
  '172.19.50.1': { name: 'gw', ports: [] },
});

const KNOWN_USERS = ['root', 'alumno', 'nginx', 'apache', 'mysql'];

export function makeSecurityCommands({ ok, fail, abs, isRoot, readFile, joinLines, lines, walk }) {
  const hashCmd = (name, fn) => (_sh, ctx, argv, stdin) => {
    const args = argv.slice(1);
    const check = args.includes('-c') || args.includes('--check');
    const files = args.filter((a) => !a.startsWith('-'));
    if (check) {
      if (!files.length) return fail(`${name}: falta el fichero con las sumas`);
      const r = readFile(ctx, files[0], name);
      if (r.error) return fail(r.error);
      const out = [];
      let bad = 0;
      let missing = 0;
      for (const l of lines(r.content)) {
        const m = l.match(/^([0-9a-fA-F]+)\s+\*?(.+)$/);
        if (!m) continue;
        const f = readFile(ctx, m[2].trim(), name);
        if (f.error) {
          out.push(`${m[2]}: FALLÓ al abrir o leer`);
          missing++;
        } else if (fn(f.content) === m[1].toLowerCase()) out.push(`${m[2]}: La suma coincide`);
        else {
          out.push(`${m[2]}: FALLÓ`);
          bad++;
        }
      }
      const warns = [];
      if (missing) warns.push(`${name}: ATENCIÓN: ${missing} fichero listado no se pudo leer`);
      if (bad) warns.push(`${name}: ATENCIÓN: ${bad} suma${bad > 1 ? 's' : ''} calculada${bad > 1 ? 's' : ''} NO coincide${bad > 1 ? 'n' : ''}`);
      return { out: joinLines(out), err: warns.join('\n'), code: bad || missing ? 1 : 0 };
    }
    if (!files.length) return ok(`${fn(stdin ?? '')}  -\n`);
    const out = [];
    const errs = [];
    for (const f of files) {
      const r = readFile(ctx, f, name);
      if (r.error) errs.push(r.error);
      else out.push(`${fn(r.content)}  ${f}`);
    }
    return { out: joinLines(out), err: errs.join('\n'), code: errs.length ? 1 : 0 };
  };

  return {
    sha256sum: hashCmd('sha256sum', sha256),
    md5sum: hashCmd('md5sum', md5),

    chown: (_sh, ctx, argv) => {
      const args = argv.slice(1);
      const recursive = args.includes('-R');
      const [spec, ...targets] = args.filter((a) => a !== '-R');
      if (!spec || !targets.length) return fail('chown: falta un operando');
      const [user, group] = spec.split(':');
      for (const u of [user, group].filter(Boolean)) {
        if (!KNOWN_USERS.includes(u)) return fail(`chown: usuario o grupo inválido: «${spec}»`);
      }
      const errs = [];
      for (const t of targets) {
        const node = getNode(ctx.fs, abs(ctx, t));
        if (!node) {
          errs.push(`chown: no se puede acceder a '${t}': No existe el fichero o el directorio`);
          continue;
        }
        if (!isRoot(ctx)) {
          errs.push(`chown: cambiando el propietario de '${t}': Operación no permitida`);
          continue;
        }
        const apply = (n) => {
          if (user) n.owner = user;
          if (group !== undefined) n.group = group || user;
        };
        if (recursive) walk(node, t, (_p, n) => apply(n));
        else apply(node);
      }
      return errs.length ? fail(errs.join('\n')) : ok();
    },

    'firewall-cmd': (sh, ctx, argv) => {
      const fw = sh.firewall;
      const opts = argv.slice(1);
      if (!opts.length) return fail('Uso: firewall-cmd [OPCIONES…]. Prueba «man firewall-cmd».', 2);
      const permanent = opts.includes('--permanent');
      const zoneOpt = opts.find((o) => o.startsWith('--zone='));
      if (zoneOpt && zoneOpt.slice(7) !== fw.zone) return fail(`Error: INVALID_ZONE: ${zoneOpt.slice(7)} (en el simulador solo existe la zona «${fw.zone}»)`, 112);
      const actions = opts.filter((o) => o !== '--permanent' && !o.startsWith('--zone='));
      if (!actions.length) return fail('Error: falta la acción (por ejemplo --list-all)', 2);
      const readOnly = ['--state', '--get-default-zone', '--list-all', '--list-services', '--list-ports', '--get-services', '--get-active-zones'];
      const needsRoot = actions.some((a) => !readOnly.includes(a));
      if (needsRoot && !isRoot(ctx)) return fail('Authorization failed.\n    Make sure polkit agent is running or run the application as superuser. (Usa sudo.)', 1);
      if (!fw.running && actions[0] !== '--state') return fail('FirewallD is not running', 252);
      const zone = permanent ? fw.permanent : fw.runtime;
      const out = [];
      for (const a of actions) {
        const [key, value] = a.split('=');
        switch (key) {
          case '--state':
            if (!fw.running) return fail('not running', 252);
            out.push('running');
            break;
          case '--get-default-zone':
            out.push(fw.zone);
            break;
          case '--get-active-zones':
            out.push(fw.zone, `  interfaces: ${sh.net.ifaces.map((i) => i.name).join(' ')}`);
            break;
          case '--get-services':
            out.push(Object.keys(FW_SERVICES).sort().join(' '));
            break;
          case '--list-services':
            out.push(zone.services.join(' '));
            break;
          case '--list-ports':
            out.push(zone.ports.join(' '));
            break;
          case '--list-all':
            out.push(
              `${fw.zone} (active)`,
              '  target: default',
              `  interfaces: ${sh.net.ifaces.map((i) => i.name).join(' ')}`,
              `  services: ${zone.services.join(' ')}`,
              `  ports: ${zone.ports.join(' ')}`,
              '  masquerade: no',
              '  forward-ports: ',
              '  rich rules: ',
            );
            break;
          case '--add-service':
          case '--remove-service': {
            if (!value) return fail(`Error: falta el servicio (${key}=nombre)`, 2);
            if (!FW_SERVICES[value]) return fail(`Error: INVALID_SERVICE: '${value}' not among existing services`, 101);
            const has = zone.services.includes(value);
            if (key === '--add-service') {
              if (has) out.push(`Warning: ALREADY_ENABLED: ${value}`);
              else {
                zone.services = [...zone.services, value].sort();
                out.push('success');
              }
            } else if (!has) out.push(`Warning: NOT_ENABLED: ${value}`);
            else {
              zone.services = zone.services.filter((s) => s !== value);
              out.push('success');
            }
            break;
          }
          case '--add-port':
          case '--remove-port': {
            if (!/^\d+(-\d+)?\/(tcp|udp)$/.test(value ?? '')) return fail(`Error: INVALID_PORT: ${value ?? ''} (formato: 8080/tcp)`, 102);
            const has = zone.ports.includes(value);
            if (key === '--add-port') {
              if (has) out.push(`Warning: ALREADY_ENABLED: ${value}`);
              else {
                zone.ports = [...zone.ports, value];
                out.push('success');
              }
            } else if (!has) out.push(`Warning: NOT_ENABLED: ${value}`);
            else {
              zone.ports = zone.ports.filter((p) => p !== value);
              out.push('success');
            }
            break;
          }
          case '--reload':
            fw.runtime = structuredClone(fw.permanent);
            out.push('success');
            break;
          case '--runtime-to-permanent':
            fw.permanent = structuredClone(fw.runtime);
            out.push('success');
            break;
          default:
            return fail(`firewall-cmd: opción no reconocida «${a}» (en el simulador: --state, --list-all, --add-service, --remove-service, --add-port, --remove-port, --reload, --permanent)`, 2);
        }
      }
      return ok(joinLines(out));
    },

    nc: (sh, _ctx, argv) => {
      const args = argv.slice(1);
      const flags = args.filter((a) => a.startsWith('-')).join('');
      const [host, portStr] = args.filter((a) => !a.startsWith('-'));
      if (!host || !portStr) return fail('Ncat: Necesitas indicar host y puerto: nc -vz host puerto. QUITTING.', 2);
      const port = Number(portStr);
      if (!Number.isInteger(port) || port < 1 || port > 65535) return fail(`Ncat: Invalid port number "${portStr}". QUITTING.`, 2);
      const verbose = flags.includes('v');
      const head = verbose ? ['Ncat: Version 7.70 ( https://nmap.org/ncat )'] : [];
      const local = ['127.0.0.1', 'localhost', ...sh.net.ifaces.map((i) => i.addr.split('/')[0])];
      let open;
      if (local.includes(host)) {
        open = Object.values(sh.services).some((s) => s.active && s.port === port) ||
          sh.docker.containers.some((c) => c.status === 'running' && c.ports.some((p) => p.host === port)) ||
          (sh.procs ?? []).some((p) => p.port === port);
      } else {
        const r = sh.net.remote[host];
        if (!r) return fail([...head, 'Ncat: TIMEOUT.'].join('\n'));
        open = r.ports.includes(port);
      }
      if (!open) return fail([...head, 'Ncat: Connection refused.'].join('\n'));
      if (!flags.includes('z')) return ok(joinLines([...head, `Ncat: Connected to ${host}:${port}.`, '(Conexión abierta: en el simulador se cierra sola. Usa -z para solo comprobar.)']));
      return ok(joinLines(verbose ? [...head, `Ncat: Connected to ${host}:${port}.`, 'Ncat: 0 bytes sent, 0 bytes received in 0.01 seconds.'] : []));
    },

    sysctl: (sh, ctx, argv) => {
      const args = argv.slice(1);
      const params = sh.sysctl;
      const set = (kv) => {
        const m = kv.match(/^\s*([\w.]+)\s*=\s*(\S+)\s*$/);
        if (!m) return { error: `sysctl: «${kv}» debe tener el formato clave=valor` };
        if (!(m[1] in params)) return { error: `sysctl: cannot stat /proc/sys/${m[1].replaceAll('.', '/')}: No existe el fichero o el directorio` };
        if (!isRoot(ctx)) return { error: `sysctl: permission denied on key "${m[1]}" (usa sudo)` };
        params[m[1]] = m[2];
        return { line: `${m[1]} = ${m[2]}` };
      };
      if (!args.length) return fail('Uso: sysctl [-w] clave[=valor] | -a | -p [fichero]');
      if (args[0] === '-a') return ok(joinLines(Object.keys(params).sort().map((k) => `${k} = ${params[k]}`)));
      if (args[0] === '-p' || args[0] === '--system') {
        const path = args[0] === '-p' ? (args[1] ?? '/etc/sysctl.conf') : null;
        const files = [];
        if (path) files.push(path);
        else {
          const d = getNode(ctx.fs, '/etc/sysctl.d');
          if (d?.type === 'dir') files.push(...Object.keys(d.children).sort().map((n) => `/etc/sysctl.d/${n}`));
          files.push('/etc/sysctl.conf');
        }
        const out = [];
        const errs = [];
        for (const f of files) {
          const r = readFile(ctx, f, 'sysctl');
          if (r.error) {
            if (path) errs.push(r.error);
            continue;
          }
          if (!path) out.push(`* Aplicando ${f} …`);
          for (const l of lines(r.content)) {
            if (!l.trim() || /^\s*[#;]/.test(l)) continue;
            const s = set(l);
            if (s.error) errs.push(s.error);
            else out.push(s.line);
          }
        }
        return { out: joinLines(out), err: errs.join('\n'), code: errs.length ? 1 : 0 };
      }
      const write = args[0] === '-w';
      const items = write ? args.slice(1) : args;
      const out = [];
      const errs = [];
      for (const it of items) {
        if (it.includes('=')) {
          const s = set(it);
          if (s.error) errs.push(s.error);
          else out.push(s.line);
        } else if (write) errs.push(`sysctl: «${it}» debe tener el formato clave=valor`);
        else if (it in params) out.push(`${it} = ${params[it]}`);
        else errs.push(`sysctl: cannot stat /proc/sys/${it.replaceAll('.', '/')}: No existe el fichero o el directorio`);
      }
      return { out: joinLines(out), err: errs.join('\n'), code: errs.length ? 255 : 0 };
    },
  };
}
