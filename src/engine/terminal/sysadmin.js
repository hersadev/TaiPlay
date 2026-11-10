// Órdenes de administración de la terminal simulada: discos y LVM (df, du,
// lsblk, pvs/vgs/lvs, lvextend, xfs_growfs, resize2fs, fsck, mount), red
// (ping, traceroute, curl), procesos (ps, top, kill, pkill), el diario de
// systemd (journalctl), tareas programadas (crontab) y paquetes (dnf/yum en
// RHEL, apt/apt-get en Debian y Ubuntu, apk en Alpine).
//
// Como security.js, se construyen con los ayudantes de commands.js. El
// estado vive en la shell: sh.storage, sh.procs, sh.journal, sh.crontabs y
// sh.packages (o c.packages dentro de un contenedor).

import { getNode, walk as walkTree } from './vfs.js';

export const SYSADMIN_MANUAL = {
  df: 'df [-h] [-T] [ruta] — espacio libre y usado de cada sistema de ficheros montado. -h en unidades legibles (G, M), -T muestra el tipo (xfs, ext4…).',
  du: 'du [-s] [-h] ruta… — cuánto ocupa cada fichero o directorio. «du -sh /var/log/*» resume cada entrada: ideal para encontrar qué llena un disco.',
  lsblk: 'lsblk — árbol de discos, particiones y volúmenes lógicos, con su tamaño y dónde están montados.',
  pvs: 'pvs — (LVM) volúmenes físicos: discos o particiones que aportan espacio a un grupo. Necesita root.',
  vgs: 'vgs — (LVM) grupos de volúmenes, con su tamaño total y el espacio libre (VFree). Necesita root.',
  lvs: 'lvs — (LVM) volúmenes lógicos de cada grupo y su tamaño. Necesita root.',
  lvextend: 'lvextend -L 600G|+100G [-r] /dev/grupo/volumen — amplía un volumen lógico con espacio libre del grupo. -l +100%FREE usa todo lo libre. Solo amplía el volumen: el sistema de ficheros se amplía aparte (xfs_growfs o resize2fs) o con -r a la vez.',
  xfs_growfs: 'xfs_growfs punto_de_montaje — amplía en caliente un sistema de ficheros XFS hasta ocupar todo su volumen. XFS solo crece: no se puede reducir.',
  resize2fs: 'resize2fs dispositivo [tamaño] — cambia el tamaño de un sistema de ficheros ext2/3/4. No sirve para XFS.',
  fsck: 'fsck [-y] [-n] dispositivo — comprueba y repara un sistema de ficheros. Debe estar DESMONTADO. -y responde «sí» a todas las reparaciones; -n solo mira, sin tocar nada.',
  mount: 'mount — lista lo montado. mount dispositivo directorio monta un sistema de ficheros; mount -a monta todo lo de /etc/fstab que falte. umount directorio lo desmonta.',
  umount: 'umount directorio|dispositivo — desmonta un sistema de ficheros.',
  ping: 'ping [-c N] host — envía paquetes ICMP de eco para ver si un equipo responde y cuánto tarda. En Linux no para solo: usa -c para indicar cuántos.',
  traceroute: 'traceroute host — muestra los routers (saltos) por los que pasan los paquetes hasta el destino. «* * *» = ese salto no responde.',
  curl: 'curl [-I] URL — hace una petición HTTP y muestra la respuesta. -I solo las cabeceras.',
  ps: 'ps — procesos de tu terminal. ps aux (o ps -ef) lista todos: usuario, PID, %CPU, %MEM y orden. --sort=-%cpu ordena por consumo de CPU.',
  top: 'top — procesos ordenados por consumo de CPU, en directo (en el simulador, una foto fija). Se sale con q.',
  kill: 'kill [-9|-15] PID… — manda una señal a un proceso. Sin opción, SIGTERM (15: «termina, por favor»); -9 es SIGKILL (lo mata en seco, sin que pueda limpiar). kill -l lista las señales.',
  pkill: 'pkill nombre — como kill, pero por nombre de proceso en vez de PID.',
  journalctl: 'journalctl [-u servicio] [-p err] [-n N] [-f] [-b] [-xe] — consulta el diario de systemd. -u filtra por servicio, -p por prioridad (err, warning…), -f lo sigue en directo y -xe salta al final con explicaciones.',
  crontab: 'crontab -l (ver) | -e (editar) | -r (borrar) | fichero (instalar) — tareas programadas del usuario. Cada línea: minuto hora día mes día_semana orden.',
  rpm: 'rpm -q paquete — ¿está instalado este paquete .rpm? rpm -qa lista todos los instalados.',
  dnf: 'dnf install|remove|list installed|search|info|check-update|upgrade [-y] paquete — gestor de paquetes de RHEL 8+ (antes, yum). Instalar y quitar necesita root.',
  yum: 'yum — el gestor clásico de RHEL/CentOS; en RHEL 8 es un alias de dnf y acepta las mismas órdenes.',
  apt: 'apt update | install [-y] | remove | list --installed | search paquete — gestor de paquetes de Debian y Ubuntu. Primero «apt update» para descargar la lista de paquetes.',
  'apt-get': 'apt-get update | install -y paquete — la versión clásica de apt, la que se usa en scripts y Dockerfiles.',
  apk: 'apk add [--no-cache] paquete — gestor de paquetes de Alpine Linux.',
  truncate: 'truncate -s 0 fichero — vacía un fichero sin borrarlo (útil con logs que un servicio tiene abiertos).',
};

// ── Estado inicial ──────────────────────────────────────────────────────

export const defaultStorage = () => ({
  disks: [
    { name: 'sda', size: 100, parts: [{ name: 'sda1', size: 1 }, { name: 'sda2', size: 99 }] },
  ],
  pvs: [{ dev: '/dev/sda2', vg: 'rhel', size: 99 }],
  lvs: [
    { vg: 'rhel', name: 'root', size: 50 },
    { vg: 'rhel', name: 'var', size: 20 },
    { vg: 'rhel', name: 'swap', size: 4, swap: true },
  ],
  fss: [
    { dev: '/dev/mapper/rhel-root', type: 'xfs', size: 50, used: 11.6, mount: '/' },
    { dev: '/dev/sda1', type: 'xfs', size: 1, used: 0.27, mount: '/boot' },
    { dev: '/dev/mapper/rhel-var', type: 'xfs', size: 20, used: 6.3, mount: '/var' },
    { dev: 'tmpfs', type: 'tmpfs', size: 3.8, used: 0, mount: '/dev/shm' },
  ],
});

const T0 = 'nov 10 09:';
const at = (m, s) => `${T0}${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

export const defaultJournal = () => [
  { t: at(0, 1), unit: 'kernel', ident: 'kernel', prio: 6, msg: 'Linux version 4.18.0-477.10.1.el8_8.x86_64' },
  { t: at(0, 2), unit: 'kernel', ident: 'kernel', prio: 4, msg: 'ACPI: no se ha encontrado el dispositivo de energía PNP0C0A' },
  { t: at(0, 5), unit: 'systemd', ident: 'systemd[1]', prio: 6, msg: 'Reached target Multi-User System.' },
  { t: at(0, 6), unit: 'sshd', ident: 'sshd[1180]', prio: 6, msg: 'Server listening on 0.0.0.0 port 22.' },
  { t: at(0, 6), unit: 'crond', ident: 'crond[1190]', prio: 6, msg: '(CRON) INFO (running with inotify support)' },
  { t: at(2, 40), unit: 'sshd', ident: 'sshd[2101]', prio: 6, msg: 'Accepted password for alumno from 10.30.16.45 port 51544 ssh2' },
  { t: at(3, 12), unit: 'sshd', ident: 'sshd[2140]', prio: 5, msg: 'Failed password for root from 185.220.101.7 port 40022 ssh2' },
  { t: at(3, 14), unit: 'sshd', ident: 'sshd[2140]', prio: 3, msg: 'error: maximum authentication attempts exceeded for root from 185.220.101.7 port 40022 ssh2' },
];

const now = (sh) => {
  sh.clock = (sh.clock ?? 600) + 7;
  return at(Math.floor(sh.clock / 60), sh.clock % 60);
};

export function journalAdd(sh, unit, msg, prio = 6, ident) {
  if (!sh.journal) return;
  const svc = sh.services?.[unit];
  sh.journal.push({ t: now(sh), unit, ident: ident ?? (svc?.pid ? `${unit}[${svc.pid}]` : 'systemd[1]'), prio, msg });
}

// Paquetes que «hay» en los repositorios, por familia de distribución.
const CATALOG = {
  rhel: {
    bash: ['5.0.17-1.el8', 'baseos', 'The GNU Bourne Again shell', '1.6 M'],
    curl: ['7.61.1-30.el8', 'baseos', 'A utility for getting files from remote servers', '351 k'],
    openssh: ['8.0p1-17.el8', 'baseos', 'An open source implementation of SSH', '523 k'],
    'openssh-server': ['8.0p1-17.el8', 'baseos', 'An open source SSH server daemon', '491 k'],
    nginx: ['1.20.1-1.el8', 'appstream', 'A high performance web server and reverse proxy server', '570 k'],
    python3: ['3.6.8-51.el8', 'baseos', 'Interpreter of the Python programming language', '81 k'],
    firewalld: ['0.9.11-1.el8', 'baseos', 'A firewall daemon with D-Bus interface', '501 k'],
    lvm2: ['2.03.14-9.el8', 'baseos', 'Userland logical volume management tools', '1.7 M'],
    'xfsprogs': ['5.0.0-11.el8', 'baseos', 'Utilities for managing the XFS filesystem', '1.1 M'],
    rsync: ['3.1.3-19.el8', 'baseos', 'A program for synchronizing files over a network', '410 k'],
    httpd: ['2.4.37-56.el8', 'appstream', 'Apache HTTP Server', '1.4 M'],
    'mariadb-server': ['10.3.39-1.el8', 'appstream', 'The MariaDB server and related files', '16 M'],
    'vim-enhanced': ['8.0.1763-19.el8', 'appstream', 'A version of the VIM editor which includes recent enhancements', '1.4 M'],
    wget: ['1.19.5-11.el8', 'appstream', 'A utility for retrieving files using the HTTP or FTP protocols', '734 k'],
    chrony: ['4.2-1.el8', 'baseos', 'An NTP client/server', '330 k'],
    tcpdump: ['4.9.3-3.el8', 'appstream', 'A network traffic monitoring tool', '453 k'],
    nmap: ['7.70-8.el8', 'appstream', 'Network exploration tool and security scanner', '5.8 M'],
    git: ['2.39.3-1.el8', 'appstream', 'Fast Version Control System', '91 k'],
    traceroute: ['2.1.0-6.el8', 'baseos', 'Traces the route taken by packets over an IPv4/IPv6 network', '64 k'],
    'nmap-ncat': ['7.70-8.el8', 'appstream', 'Nmap\'s Netcat replacement', '237 k'],
  },
  debian: {
    bash: ['5.2.21-2ubuntu4', 'main', 'GNU Bourne Again SHell', '794 kB'],
    'ca-certificates': ['20240203', 'main', 'Common CA certificates', '159 kB'],
    curl: ['8.5.0-2ubuntu10.4', 'main', 'command line tool for transferring data with URL syntax', '227 kB'],
    wget: ['1.21.4-1ubuntu4.1', 'main', 'retrieves files from the web', '334 kB'],
    vim: ['2:9.1.0016-1ubuntu7.3', 'main', 'Vi IMproved - enhanced vi editor', '1,881 kB'],
    git: ['1:2.43.0-1ubuntu7.1', 'main', 'fast, scalable, distributed revision control system', '3,679 kB'],
    'iputils-ping': ['3:20240117-1build1', 'main', 'Tools to test the reachability of network hosts', '44 kB'],
    'net-tools': ['2.10-0.1ubuntu4', 'main', 'NET-3 networking toolkit', '204 kB'],
    nginx: ['1.24.0-2ubuntu7.1', 'main', 'small, powerful, scalable web/proxy server', '520 kB'],
    'python3-pip': ['24.0+dfsg-1ubuntu1', 'universe', 'Python package installer', '1,317 kB'],
    python3: ['3.12.3-0ubuntu2', 'main', 'interactive high-level object-oriented language', '23 kB'],
    rsync: ['3.2.7-1ubuntu1', 'main', 'fast, versatile, remote (and local) file-copying tool', '436 kB'],
  },
  alpine: {
    curl: ['8.11.0-r2', 'main', 'URL retrieval utility and library', '252 KiB'],
    bash: ['5.2.37-r0', 'main', 'The GNU Bourne Again shell', '1.4 MiB'],
    git: ['2.47.1-r0', 'main', 'Distributed version control system', '13 MiB'],
    python3: ['3.12.8-r1', 'main', 'High-level scripting language', '39 MiB'],
    nginx: ['1.26.2-r4', 'main', 'HTTP and reverse proxy server', '1.2 MiB'],
    vim: ['9.1.0707-r0', 'main', 'Improved vi-style text editor', '18 MiB'],
  },
};

const BASE_INSTALLED = {
  rhel: ['bash', 'curl', 'openssh', 'openssh-server', 'nginx', 'python3', 'firewalld', 'lvm2', 'xfsprogs', 'nmap-ncat', 'traceroute'],
  debian: ['bash'],
  alpine: [],
};

// Servicios que aparecen al instalar un paquete en el host.
const PKG_SERVICES = {
  httpd: { httpd: { description: 'The Apache HTTP Server', active: false, enabled: false, port: 80 } },
  'mariadb-server': { mariadb: { description: 'MariaDB 10.3 database server', active: false, enabled: false, port: 3306 } },
  chrony: { chronyd: { description: 'NTP client/server', active: false, enabled: false } },
};

export const defaultPackages = (family = 'rhel') => ({
  family,
  installed: [...(BASE_INSTALLED[family] ?? [])],
  updated: family !== 'debian', // en Debian/Ubuntu hay que hacer «apt update» antes de instalar
});

// Paquetes del entorno donde se ejecuta la orden: el host o el contenedor.
function pkgState(sh, ctx) {
  if (!ctx.container) return sh.packages;
  const c = ctx.container;
  if (!c.packages) c.packages = c.spec?.packages ? structuredClone(c.spec.packages) : defaultPackages(c.spec?.family ?? 'debian');
  return c.packages;
}

// ── Utilidades ──────────────────────────────────────────────────────────

const GiB = 1024 ** 3;
const fmtG = (g) => {
  if (g >= 10) return `${Math.round(g)}G`;
  if (g >= 1) return `${(Math.round(g * 10) / 10).toFixed(1).replace(/\.0$/, '')}G`;
  const m = g * 1024;
  return m >= 1 ? `${Math.round(m)}M` : '0';
};
const fmtBytes = (b) => {
  if (b >= GiB) return fmtG(b / GiB);
  if (b >= 1024 ** 2) return `${Math.round(b / 1024 ** 2)}M`;
  if (b >= 1024) return `${Math.max(4, Math.ceil(b / 1024))}K`;
  return b ? '4,0K' : '0';
};
const fixed2 = (g) => g.toFixed(2);

export const nodeSize = (n) => (n.type === 'dir' ? 4096 : (n.size ?? n.content.length));

// Lo ocupado de un sistema de ficheros: su base más los ficheros «grandes»
// del árbol simulado que cuelgan de su punto de montaje (los que la lección
// crea con size). Así, borrar o vaciar un log libera espacio de verdad.
function fsUsed(sh, f) {
  if (!f.mount) return f.used;
  let extra = 0;
  const root = getNode(sh.hostCtx.fs, f.mount);
  if (root) {
    walkTree(root, f.mount, (p, n) => {
      if (n.type !== 'file' || n.size === undefined) return;
      if (mountFor(sh, p) === f) extra += n.size;
    });
  }
  return f.used + extra / GiB;
}

function mountFor(sh, path) {
  let best = null;
  for (const f of sh.storage.fss) {
    if (!f.mount) continue;
    const m = f.mount;
    if (path === m || path.startsWith(m === '/' ? '/' : m + '/')) if (!best || m.length > best.mount.length) best = f;
  }
  return best;
}

// /dev/vg/lv, /dev/mapper/vg-lv o vg/lv → el volumen lógico
function findLv(storage, ref) {
  let m = ref.match(/^\/dev\/mapper\/(.+?)-(.+)$/) ?? ref.match(/^(?:\/dev\/)?([\w.]+)\/([\w.]+)$/);
  if (!m) return null;
  return storage.lvs.find((l) => l.vg === m[1] && l.name === m[2]) ?? null;
}
const lvDev = (lv) => `/dev/mapper/${lv.vg}-${lv.name}`;
const vgFree = (storage, vg) =>
  storage.pvs.filter((p) => p.vg === vg).reduce((a, p) => a + p.size, 0) -
  storage.lvs.filter((l) => l.vg === vg).reduce((a, l) => a + l.size, 0);

function findFs(storage, ref) {
  const lv = findLv(storage, ref);
  const dev = lv ? lvDev(lv) : ref;
  return storage.fss.find((f) => f.dev === dev || (f.mount && f.mount === ref)) ?? null;
}

function parseSize(s) {
  const m = String(s).match(/^(\+)?(\d+(?:[.,]\d+)?)([kKmMgGtT]?)(?:i?[bB])?$/);
  if (!m) return null;
  const n = parseFloat(m[2].replace(',', '.'));
  const unit = (m[3] || 'm').toLowerCase();
  const g = { k: n / 1024 ** 2, m: n / 1024, g: n, t: n * 1024 }[unit];
  return { rel: Boolean(m[1]), g };
}

const isIp = (s) => /^\d{1,3}(\.\d{1,3}){3}$/.test(s);

// ── Las órdenes ─────────────────────────────────────────────────────────

export function makeSysadminCommands({ ok, fail, abs, isRoot, readFile, joinLines, lines, routeFor, getopts, writeFile }) {
  const needRoot = (ctx, name) => (isRoot(ctx) ? null : fail(`${name}: Permiso denegado (esta orden necesita sudo)`));

  // Resuelve un nombre con /etc/hosts y los equipos conocidos.
  function resolveHost(sh, ctx, host) {
    if (isIp(host)) return host;
    if (host === 'localhost') return '127.0.0.1';
    const hosts = readFile(ctx, '/etc/hosts', 'hosts');
    if (hosts.content) {
      for (const l of lines(hosts.content)) {
        const [ip, ...names] = l.replace(/#.*/, '').trim().split(/\s+/);
        if (ip && names.includes(host)) return ip;
      }
    }
    const entry = Object.entries(sh.net.remote).find(([, r]) => r.name === host);
    return entry ? entry[0] : null;
  }

  // Camino hasta una IP: la lista de saltos y si el destino responde.
  function pathTo(sh, ip) {
    const local = ['127.0.0.1', ...sh.net.ifaces.map((i) => i.addr.split('/')[0])];
    if (local.includes(ip)) return { hops: [ip], replies: true, local: true };
    const r = routeFor(sh.net, ip);
    if (!r) return null;
    const dest = sh.net.remote[ip];
    const replies = Boolean(dest) && dest.icmp !== false;
    const hops = r.via ? [r.via] : [];
    if (dest?.hops) hops.push(...dest.hops);
    hops.push(ip);
    return { hops, replies };
  }

  const ms = (n, k = 0) => (0.35 + n * 0.41 + k * 0.013).toFixed(3);

  // Procesos visibles: los de los servicios activos, los extra de la
  // lección (sh.procs) y la propia terminal.
  function processList(sh) {
    const list = [{ pid: 1, user: 'root', cmd: '/usr/lib/systemd/systemd --switched-root --system', cpu: 0.0, mem: 0.4, tty: '?' }];
    for (const [name, s] of Object.entries(sh.services)) {
      if (!s.active) continue;
      if (!s.pid) s.pid = sh.nextPid++;
      list.push({ pid: s.pid, user: s.user ?? 'root', cmd: s.cmd ?? `/usr/sbin/${name}`, cpu: s.cpu ?? 0.0, mem: s.mem ?? 0.3, tty: '?', service: name });
    }
    for (const c of sh.docker.containers) {
      if (c.status !== 'running') continue;
      list.push({ pid: c.pid ??= sh.nextPid++, user: 'root', cmd: `/usr/bin/containerd-shim-runc-v2 -id ${c.id.slice(0, 12)}`, cpu: 0.1, mem: 0.2, tty: '?' });
    }
    list.push(...sh.procs.map((p) => ({ tty: '?', ...p })));
    list.push({ pid: 1203, user: 'alumno', cmd: '-bash', cpu: 0.0, mem: 0.1, tty: 'pts/0' });
    return list.sort((a, b) => a.pid - b.pid);
  }

  const pkgMgrFor = (sh, ctx) => {
    if (ctx.container) return pkgState(sh, ctx).family;
    return sh.system.distro ?? 'rhel';
  };

  function dnfCmd(sh, ctx, argv) {
    const name = argv[0];
    if (pkgMgrFor(sh, ctx) !== 'rhel') return fail(`bash: ${name}: orden no encontrada (esta distribución usa ${pkgMgrFor(sh, ctx) === 'alpine' ? 'apk' : 'apt'})`, 127);
    const { flags, long, args } = getopts(argv.slice(1));
    const yes = flags.y || long.assumeyes;
    const [sub, ...pkgs] = args;
    const st = pkgState(sh, ctx);
    const cat = CATALOG.rhel;
    const meta = 'Última comprobación de caducidad de metadatos hecha hace 0:14:02, el lun 10 nov 2026 08:51:12.';
    const table = (title, list) => [
      '================================================================================',
      ' Paquete              Arquitectura  Versión              Repositorio      Tam.',
      '================================================================================',
      `${title}:`,
      ...list.map((p) => ` ${p.padEnd(20)} x86_64        ${cat[p][0].padEnd(20)} ${cat[p][1].padEnd(16)} ${cat[p][3]}`),
      '',
      'Resumen de la transacción',
      '================================================================================',
    ];
    switch (sub) {
      case undefined:
        return fail(`${name}: falta la orden (install, remove, list, search, info…)`);
      case 'install':
      case 'remove':
      case 'erase': {
        if (!pkgs.length) return fail('Error: Se necesita al menos un paquete');
        if (!isRoot(ctx)) return fail('Error: Este comando tiene que ejecutarse con privilegios de superusuario (bajo el usuario root en la mayoría de los sistemas).');
        const install = sub === 'install';
        const out = [meta];
        const todo = [];
        for (const p of pkgs) {
          if (!cat[p]) return fail(joinLines([...out, `No hay coincidencias para el argumento: ${p}`]) + `Error: No se encontraron coincidencias: ${p}`);
          const has = st.installed.includes(p);
          if (install && has) out.push(`El paquete ${p}-${cat[p][0]}.x86_64 ya está instalado.`);
          else if (!install && !has) out.push(`No se encontraron coincidencias para el argumento: ${p}`);
          else todo.push(p);
        }
        if (!todo.length) return ok(joinLines([...out, 'Dependencias resueltas.', 'Nada por hacer.', '¡Listo!']));
        out.push('Dependencias resueltas.', ...table(install ? 'Instalando' : 'Eliminando', todo));
        out.push(`${install ? 'Instalar' : 'Eliminar'}  ${todo.length} Paquete${todo.length > 1 ? 's' : ''}`, '');
        if (!yes) {
          out.push('¿Está de acuerdo [s/N]?: ', 'Operación abortada.', '(En una máquina real dnf esperaría tu respuesta. En el simulador no se puede contestar: repite la orden con -y.)');
          return fail('', 1, joinLines(out));
        }
        out.push(install ? 'Descargando paquetes:' : 'Ejecutando la transacción', 'Ejecutando la transacción');
        for (const p of todo) {
          if (install) {
            st.installed.push(p);
            if (!ctx.container) for (const [svc, def] of Object.entries(PKG_SERVICES[p] ?? {})) sh.services[svc] ??= { ...def };
          } else {
            st.installed = st.installed.filter((x) => x !== p);
            if (!ctx.container) for (const svc of Object.keys(PKG_SERVICES[p] ?? {})) delete sh.services[svc];
          }
        }
        out.push('', install ? 'Instalado:' : 'Eliminado:', ...todo.map((p) => `  ${p}-${cat[p][0]}.x86_64`), '', '¡Listo!');
        return ok(joinLines(out));
      }
      case 'list': {
        const which = pkgs[0] === 'installed' || pkgs[0] === 'available' ? pkgs.shift() : null;
        const names = Object.keys(cat).filter((p) =>
          (!which || (which === 'installed') === st.installed.includes(p)) && (!pkgs.length || pkgs.includes(p)),
        );
        if (!names.length) return fail('Error: No hay paquetes que coincidan en la lista');
        const groups = [];
        const inst = names.filter((p) => st.installed.includes(p));
        const avail = names.filter((p) => !st.installed.includes(p));
        if (inst.length) groups.push('Paquetes instalados', ...inst.map((p) => `${(p + '.x86_64').padEnd(30)} ${cat[p][0].padEnd(20)} @${cat[p][1]}`));
        if (avail.length && which !== 'installed') groups.push('Paquetes disponibles', ...avail.map((p) => `${(p + '.x86_64').padEnd(30)} ${cat[p][0].padEnd(20)} ${cat[p][1]}`));
        return ok(joinLines([meta, ...groups]));
      }
      case 'search': {
        if (!pkgs.length) return fail('Error: Se necesita un término de búsqueda');
        const term = pkgs.join(' ').toLowerCase();
        const hits = Object.entries(cat).filter(([p, v]) => p.includes(term) || v[2].toLowerCase().includes(term));
        if (!hits.length) return fail(joinLines([meta, `No se encontraron coincidencias para: ${term}`]), 1);
        return ok(joinLines([meta, `========================= Nombre coincidente: ${term} =========================`, ...hits.map(([p, v]) => `${p}.x86_64 : ${v[2]}`)]));
      }
      case 'info': {
        const p = pkgs[0];
        if (!cat[p]) return fail('Error: No hay paquetes que coincidan en la lista');
        const [ver, repo, desc, size] = cat[p];
        return ok(joinLines([meta, st.installed.includes(p) ? 'Paquetes instalados' : 'Paquetes disponibles', `Nombre       : ${p}`, `Versión      : ${ver.split('-')[0]}`, `Lanzamiento  : ${ver.split('-').slice(1).join('-')}`, 'Arquitectura : x86_64', `Tamaño       : ${size}`, `Repositorio  : ${st.installed.includes(p) ? '@System' : repo}`, `Resumen      : ${desc}`]));
      }
      case 'check-update':
        return ok(joinLines([meta, '', `kernel.x86_64                4.18.0-513.5.1.el8_9           baseos`, `openssh.x86_64               8.0p1-19.el8_9                 baseos`]));
      case 'update':
      case 'upgrade':
        if (!isRoot(ctx)) return fail('Error: Este comando tiene que ejecutarse con privilegios de superusuario (bajo el usuario root en la mayoría de los sistemas).');
        if (!yes) return fail('', 1, joinLines([meta, 'Dependencias resueltas.', 'Actualizar  2 Paquetes', '¿Está de acuerdo [s/N]?: ', 'Operación abortada.', '(Repite con -y: en el simulador no se puede contestar.)']));
        return ok(joinLines([meta, 'Dependencias resueltas.', 'Actualizado:', '  kernel-4.18.0-513.5.1.el8_9.x86_64', '  openssh-8.0p1-19.el8_9.x86_64', '', '¡Listo!', '(El kernel nuevo se usará tras reiniciar.)']));
      default:
        return fail(`No existe esa orden: ${sub}. Por favor, use /usr/bin/${name} --help`);
    }
  }

  function aptCmd(sh, ctx, argv) {
    const name = argv[0];
    const family = pkgMgrFor(sh, ctx);
    if (family !== 'debian') return fail(`bash: ${name}: orden no encontrada (${family === 'rhel' ? 'en RHEL el gestor de paquetes es dnf: «sudo dnf install paquete»' : 'Alpine usa apk: «apk add paquete»'})`, 127);
    const { flags, long, args } = getopts(argv.slice(1));
    const yes = flags.y || long.yes || long['assume-yes'];
    const [sub, ...pkgs] = args;
    const st = pkgState(sh, ctx);
    const cat = CATALOG.debian;
    const lock = 'E: Could not open lock file /var/lib/dpkg/lock-frontend - open (13: Permission denied)\nE: Unable to acquire the dpkg frontend lock, are you root? (usa sudo)';
    switch (sub) {
      case 'update':
        if (!isRoot(ctx)) return fail('E: Could not open lock file /var/lib/apt/lists/lock - open (13: Permission denied)', 100);
        st.updated = true;
        return ok(joinLines([
          'Get:1 http://archive.ubuntu.com/ubuntu noble InRelease [256 kB]',
          'Get:2 http://security.ubuntu.com/ubuntu noble-security InRelease [126 kB]',
          'Get:3 http://archive.ubuntu.com/ubuntu noble/main amd64 Packages [1,808 kB]',
          'Fetched 2,190 kB in 2s (1,095 kB/s)',
          'Reading package lists... Done',
        ]));
      case 'install':
      case 'remove':
      case 'purge': {
        if (!pkgs.length) return ok('Reading package lists... Done\n0 upgraded, 0 newly installed, 0 to remove and 0 not upgraded.\n');
        if (!isRoot(ctx)) return fail(lock, 100);
        const install = sub === 'install';
        const out = ['Reading package lists... Done', 'Building dependency tree... Done', 'Reading state information... Done'];
        if (install && !st.updated) return fail(`E: Unable to locate package ${pkgs[0]}`, 100, joinLines(out));
        for (const p of pkgs) if (!cat[p]) return fail(`E: Unable to locate package ${p}`, 100, joinLines(out));
        const todo = pkgs.filter((p) => install !== st.installed.includes(p));
        if (!todo.length) return ok(joinLines([...out, ...pkgs.map((p) => `${p} is already the newest version (${cat[p][0]}).`), '0 upgraded, 0 newly installed, 0 to remove and 0 not upgraded.']));
        out.push(install ? 'The following NEW packages will be installed:' : 'The following packages will be REMOVED:', '  ' + todo.join(' '));
        out.push(`0 upgraded, ${install ? todo.length : 0} newly installed, ${install ? 0 : todo.length} to remove and 0 not upgraded.`);
        if (!yes) {
          out.push('Do you want to continue? [Y/n] Abort.', '(apt pregunta antes de instalar. En scripts y Dockerfiles se usa -y para que no se quede esperando.)');
          return fail('', 1, joinLines(out));
        }
        for (const p of todo) {
          if (install) {
            st.installed.push(p);
            out.push(`Get:1 http://archive.ubuntu.com/ubuntu noble/main amd64 ${p} amd64 ${cat[p][0]} [${cat[p][3]}]`, `Setting up ${p} (${cat[p][0]}) ...`);
          } else {
            st.installed = st.installed.filter((x) => x !== p);
            out.push(`Removing ${p} (${cat[p][0]}) ...`);
          }
        }
        return ok(joinLines(out));
      }
      case 'list': {
        const only = long.installed;
        const rows = Object.keys(cat)
          .filter((p) => (!only || st.installed.includes(p)) && (!pkgs.length || pkgs.includes(p)))
          .map((p) => `${p}/noble ${cat[p][0]} amd64${st.installed.includes(p) ? ' [installed]' : ''}`);
        return ok(joinLines(['Listing... Done', ...rows]));
      }
      case 'search': {
        const term = (pkgs[0] ?? '').toLowerCase();
        const hits = Object.entries(cat).filter(([p, v]) => p.includes(term) || v[2].toLowerCase().includes(term));
        return ok(joinLines(['Sorting... Done', 'Full Text Search... Done', ...hits.flatMap(([p, v]) => [`${p}/noble ${v[0]} amd64`, `  ${v[2]}`, ''])]));
      }
      case 'clean':
      case 'autoclean':
      case 'autoremove':
        return isRoot(ctx) ? ok(sub === 'autoremove' ? 'Reading package lists... Done\n0 upgraded, 0 newly installed, 0 to remove and 0 not upgraded.\n' : '') : fail(lock, 100);
      case 'upgrade':
        if (!isRoot(ctx)) return fail(lock, 100);
        return ok('Reading package lists... Done\nCalculating upgrade... Done\n0 upgraded, 0 newly installed, 0 to remove and 0 not upgraded.\n');
      default:
        return fail(`E: Invalid operation ${sub ?? ''}`.trim(), 100);
    }
  }

  function apkCmd(sh, ctx, argv) {
    if (pkgMgrFor(sh, ctx) !== 'alpine') return fail('bash: apk: orden no encontrada (apk es el gestor de Alpine Linux)', 127);
    const args = argv.slice(1).filter((a) => !a.startsWith('-'));
    const [sub, ...pkgs] = args;
    const st = pkgState(sh, ctx);
    const cat = CATALOG.alpine;
    if (sub === 'update') return ok('fetch https://dl-cdn.alpinelinux.org/alpine/v3.21/main/x86_64/APKINDEX.tar.gz\nOK: 24161 distinct packages available\n');
    if (sub === 'add' || sub === 'del') {
      const out = ['fetch https://dl-cdn.alpinelinux.org/alpine/v3.21/main/x86_64/APKINDEX.tar.gz'];
      for (const p of pkgs) {
        if (!cat[p]) return fail(`ERROR: unable to select packages:\n  ${p} (no such package):\n    required by: world[${p}]`, 1, joinLines(out));
        if (sub === 'add' && !st.installed.includes(p)) {
          st.installed.push(p);
          out.push(`(1/1) Installing ${p} (${cat[p][0]})`);
        }
        if (sub === 'del') st.installed = st.installed.filter((x) => x !== p);
      }
      out.push(`OK: ${12 + st.installed.length * 3} MiB in ${14 + st.installed.length} packages`);
      return ok(joinLines(out));
    }
    return fail('apk: orden no reconocida (en el simulador: add, del, update)');
  }

  return {
    df: (sh, ctx, argv) => {
      if (ctx.container) return ok('S.ficheros     Tamaño Usados  Disp Uso% Montado en\noverlay           50G    12G   38G  24% /\n');
      const { flags, args } = getopts(argv.slice(1));
      let list = sh.storage.fss.filter((f) => f.mount);
      if (args.length) {
        list = [];
        for (const a of args) {
          const f = mountFor(sh, abs(ctx, a));
          if (!getNode(ctx.fs, abs(ctx, a)) && !findFs(sh.storage, a)) return fail(`df: ${a}: No existe el fichero o el directorio`);
          if (f && !list.includes(f)) list.push(f);
        }
      }
      const rows = list.map((f) => {
        const used = fsUsed(sh, f);
        const pct = f.size ? Math.ceil((used / f.size) * 100) : 0;
        const val = (g) => (flags.h ? fmtG(g) : String(Math.round(g * 1024 * 1024)));
        return [f.dev, ...(flags.T ? [f.type] : []), val(f.size), val(used), val(Math.max(0, f.size - used)), `${pct}%`, f.mount];
      });
      const head = ['S.ficheros', ...(flags.T ? ['Tipo'] : []), flags.h ? 'Tamaño' : 'bloques de 1K', 'Usados', 'Disp', 'Uso%', 'Montado en'];
      const all = [head, ...rows];
      const w = head.map((_, i) => Math.max(...all.map((r) => r[i].length)));
      return ok(joinLines(all.map((r) => r.map((c, i) => (i === 0 || i === r.length - 1 || (flags.T && i === 1) ? c.padEnd(w[i]) : c.padStart(w[i]))).join(' ').trimEnd())));
    },

    du: (_sh, ctx, argv) => {
      const { flags, args } = getopts(argv.slice(1));
      const targets = args.length ? args : ['.'];
      const out = [];
      const errs = [];
      const fmt = (b) => (flags.h ? fmtBytes(b) : String(Math.ceil(b / 1024)));
      for (const t of targets) {
        const node = getNode(ctx.fs, abs(ctx, t));
        if (!node) {
          errs.push(`du: no se puede acceder a '${t}': No existe el fichero o el directorio`);
          continue;
        }
        const sizeOf = (n) => {
          let total = 0;
          walkTree(n, '', (_p, x) => (total += nodeSize(x)));
          return total;
        };
        if (flags.s || node.type === 'file') out.push(`${fmt(sizeOf(node))}\t${t}`);
        else {
          const rows = [];
          walkTree(node, t.replace(/\/$/, '') || '/', (p, x) => x.type === 'dir' && rows.push([sizeOf(x), p]));
          rows.reverse().forEach(([b, p]) => out.push(`${fmt(b)}\t${p}`));
        }
      }
      return { out: joinLines(out), err: errs.join('\n'), code: errs.length ? 1 : 0 };
    },

    truncate: (_sh, ctx, argv) => {
      const { flags, args } = getopts(argv.slice(1), 's');
      if (flags.s === undefined || !args.length) return fail('truncate: se debe indicar el tamaño con -s (por ejemplo: truncate -s 0 fichero)');
      if (flags.s !== '0') return fail('truncate: en el simulador solo se admite -s 0 (vaciar el fichero)');
      for (const a of args) {
        const n = getNode(ctx.fs, abs(ctx, a));
        if (n?.type === 'dir') return fail(`truncate: no se puede abrir '${a}' para escritura: Es un directorio`);
        const e = writeFile(ctx, a, '');
        if (e) return fail(`truncate: no se puede abrir '${a}' para escritura: ${e.split(': ').pop()}`);
        const after = getNode(ctx.fs, abs(ctx, a));
        if (after) delete after.size;
      }
      return ok();
    },

    lsblk: (sh) => {
      const st = sh.storage;
      const rows = [['NAME', 'MAJ:MIN', 'RM', 'SIZE', 'RO', 'TYPE', 'MOUNTPOINT']];
      const mountOf = (dev) => st.fss.find((f) => f.dev === dev)?.mount ?? '';
      const lvRows = (dev, prefix) => {
        const pv = st.pvs.find((p) => p.dev === dev);
        if (!pv || st.pvs.find((p) => p.vg === pv.vg) !== pv) return;
        const lvs = st.lvs.filter((l) => l.vg === pv.vg);
        lvs.forEach((l, i) => {
          const last = i === lvs.length - 1;
          rows.push([`${prefix}${last ? '└─' : '├─'}${l.vg}-${l.name}`, `253:${st.lvs.indexOf(l)}`, '0', fmtG(l.size), '0', 'lvm', l.swap ? '[SWAP]' : mountOf(lvDev(l))]);
        });
      };
      st.disks.forEach((d, di) => {
        rows.push([d.name, `8:${di * 16}`, '0', fmtG(d.size), '0', 'disk', mountOf(`/dev/${d.name}`)]);
        lvRows(`/dev/${d.name}`, '');
        d.parts.forEach((p, i) => {
          const last = i === d.parts.length - 1;
          rows.push([`${last ? '└─' : '├─'}${p.name}`, `8:${di * 16 + i + 1}`, '0', fmtG(p.size), '0', 'part', mountOf(`/dev/${p.name}`)]);
          lvRows(`/dev/${p.name}`, last ? '  ' : '│ ');
        });
      });
      const w = rows[0].map((_, i) => Math.max(...rows.map((r) => r[i].length)));
      return ok(joinLines(rows.map((r) => r.map((c, i) => ([0, 5, 6].includes(i) ? c.padEnd(w[i]) : c.padStart(w[i]))).join(' ').trimEnd())));
    },

    pvs: (sh, ctx) => {
      const deny = needRoot(ctx, 'pvs');
      if (deny) return fail('  WARNING: Running as a non-root user. Functionality may be unavailable.\n  /run/lock/lvm/P_global:aux: open failed: Permiso denegado (usa sudo)');
      const st = sh.storage;
      const used = (vg) => st.lvs.filter((l) => l.vg === vg).reduce((a, l) => a + l.size, 0);
      // El espacio libre se reparte en orden entre los PV del grupo.
      const rows = st.pvs.map((p) => {
        const before = st.pvs.slice(0, st.pvs.indexOf(p)).filter((x) => x.vg === p.vg).reduce((a, x) => a + x.size, 0);
        const free = Math.max(0, Math.min(p.size, p.size - Math.max(0, used(p.vg) - before)));
        return `  ${p.dev.padEnd(10)} ${p.vg.padEnd(9)} lvm2 a--  ${(fixed2(p.size) + 'g').padStart(8)} ${(fixed2(free) + 'g').padStart(8)}`;
      });
      return ok(joinLines(['  PV         VG        Fmt  Attr PSize    PFree', ...rows]));
    },

    vgs: (sh, ctx) => {
      if (needRoot(ctx, 'vgs')) return fail('  WARNING: Running as a non-root user. Functionality may be unavailable.\n  /run/lock/lvm/P_global:aux: open failed: Permiso denegado (usa sudo)');
      const st = sh.storage;
      const vgs = [...new Set(st.pvs.map((p) => p.vg))];
      const rows = vgs.map((vg) => {
        const size = st.pvs.filter((p) => p.vg === vg).reduce((a, p) => a + p.size, 0);
        return `  ${vg.padEnd(9)} ${String(st.pvs.filter((p) => p.vg === vg).length).padStart(3)} ${String(st.lvs.filter((l) => l.vg === vg).length).padStart(3)}   0 wz--n- ${(fixed2(size) + 'g').padStart(8)} ${(fixed2(vgFree(st, vg)) + 'g').padStart(8)}`;
      });
      return ok(joinLines(['  VG        #PV #LV #SN Attr   VSize    VFree', ...rows]));
    },

    lvs: (sh, ctx) => {
      if (needRoot(ctx, 'lvs')) return fail('  WARNING: Running as a non-root user. Functionality may be unavailable.\n  /run/lock/lvm/P_global:aux: open failed: Permiso denegado (usa sudo)');
      const rows = sh.storage.lvs.map((l) => `  ${l.name.padEnd(14)} ${l.vg.padEnd(9)} -wi-ao---- ${(fixed2(l.size) + 'g').padStart(8)}`);
      return ok(joinLines(['  LV             VG        Attr       LSize', ...rows]));
    },

    lvextend: (sh, ctx, argv) => {
      const deny = needRoot(ctx, 'lvextend');
      if (deny) return fail('  WARNING: Running as a non-root user. Functionality may be unavailable.\n  /run/lock/lvm/P_global:aux: open failed: Permiso denegado (usa sudo)', 5);
      const rest = argv.slice(1);
      let size = null;
      let extents = null;
      let resizeFs = false;
      let target = null;
      for (let i = 0; i < rest.length; i++) {
        const a = rest[i];
        if (a === '-L' || a === '--size') size = rest[++i];
        else if (a.startsWith('-L') && a.length > 2) size = a.slice(2);
        else if (a.startsWith('--size=')) size = a.slice(7);
        else if (a === '-l' || a === '--extents') extents = rest[++i];
        else if (a === '-r' || a === '--resizefs') resizeFs = true;
        else if (/^-\w*r\w*$/.test(a) && a.includes('L')) {
          resizeFs = true;
          size = rest[++i];
        } else if (!a.startsWith('-')) target = a;
        else return fail(`lvextend: opción no reconocida «${a}» (en el simulador: -L, -l, -r)`, 3);
      }
      if (!target) return fail('  Please specify a logical volume path.\n  Run `lvextend --help\' for more information.', 3);
      const st = sh.storage;
      const lv = findLv(st, target);
      if (!lv) return fail(`  Volume group "${target.split('/').filter(Boolean).slice(-2, -1)[0] ?? target}" not found\n  Cannot process volume group ${target}`, 5);
      const free = vgFree(st, lv.vg);
      let next;
      if (extents) {
        if (!/^\+?100%FREE$/i.test(extents)) return fail('lvextend: en el simulador -l solo admite +100%FREE', 3);
        next = lv.size + free;
      } else {
        const s = parseSize(size ?? '');
        if (!s) return fail(`  Invalid argument for --size: ${size ?? ''}`, 3);
        next = s.rel ? lv.size + s.g : s.g;
      }
      const name = `${lv.vg}/${lv.name}`;
      if (next <= lv.size) return fail(`  New size given (${Math.round(next * 256)} extents) not larger than existing size (${Math.round(lv.size * 256)} extents)`, 5);
      if (next - lv.size > free + 1e-9) {
        return fail(`  Insufficient free space: ${Math.round((next - lv.size) * 256)} extents needed, but only ${Math.round(free * 256)} available`, 5);
      }
      const out = [
        `  Size of logical volume ${name} changed from ${fixed2(lv.size)} GiB (${Math.round(lv.size * 256)} extents) to ${fixed2(next)} GiB (${Math.round(next * 256)} extents).`,
        `  Logical volume ${name} successfully resized.`,
      ];
      lv.size = next;
      if (resizeFs) {
        const f = st.fss.find((x) => x.dev === lvDev(lv));
        if (f) {
          const r = growFs(f, lv);
          out.push(...r.lines);
        }
      }
      return ok(joinLines(out));
    },

    xfs_growfs: (sh, ctx, argv) => {
      const target = argv.slice(1).find((a) => !a.startsWith('-'));
      if (!target) return fail('Usage: xfs_growfs [options] mountpoint');
      if (!isRoot(ctx)) return fail(`xfs_growfs: ${target}: Permiso denegado (usa sudo)`);
      const st = sh.storage;
      const f = findFs(st, target) ?? st.fss.find((x) => x.mount === abs(ctx, target));
      if (!f) return fail(`xfs_growfs: ${target} is not a mounted XFS filesystem`);
      if (f.type !== 'xfs') return fail(`xfs_growfs: ${target} is not a mounted XFS filesystem (es ${f.type}: usa resize2fs)`);
      if (!f.mount) return fail(`xfs_growfs: ${target} is not a mounted XFS filesystem (XFS se amplía montado, en caliente)`);
      const lv = st.lvs.find((l) => lvDev(l) === f.dev);
      const r = growFs(f, lv);
      return ok(joinLines(r.lines));
    },

    resize2fs: (sh, ctx, argv) => {
      const target = argv.slice(1).find((a) => !a.startsWith('-'));
      if (!target) return fail('Modo de empleo: resize2fs [-d opciones_depuración] [-f] [-F] [-M] [-P] [-p] dispositivo [-b|-s|tamaño_nuevo]');
      if (!isRoot(ctx)) return fail(`resize2fs 1.45.6 (20-Mar-2020)\nresize2fs: Permiso denegado al intentar abrir ${target}`);
      const st = sh.storage;
      const f = findFs(st, target);
      if (!f) return fail(`resize2fs 1.45.6 (20-Mar-2020)\nopen: No existe el fichero o el directorio al intentar abrir ${target}`);
      if (f.type !== 'ext4') {
        return fail(`resize2fs 1.45.6 (20-Mar-2020)\nresize2fs: Número mágico incorrecto en el superbloque al intentar abrir ${target}\nNo se pudo encontrar un superbloque válido.\n(Es un sistema de ficheros ${f.type}: para XFS se usa xfs_growfs.)`);
      }
      const lv = st.lvs.find((l) => lvDev(l) === f.dev);
      const max = lv ? lv.size : f.size;
      if (max <= f.size) return ok(`resize2fs 1.45.6 (20-Mar-2020)\nEl sistema de ficheros ya tiene ${Math.round(f.size * 262144)} bloques (4k). ¡No hay nada que hacer!\n`);
      f.size = max;
      return ok(`resize2fs 1.45.6 (20-Mar-2020)\nFilesystem at ${f.dev} is mounted on ${f.mount}; on-line resizing required\nThe filesystem on ${f.dev} is now ${Math.round(max * 262144)} (4k) blocks long.\n`);
    },

    fsck: (sh, ctx, argv) => {
      const rest = argv.slice(1);
      const bad = rest.find((a) => a.startsWith('-') && !/^-[ynafpvV]+$/.test(a));
      if (bad) return fail(`fsck de util-linux 2.32.1\ne2fsck: opción inválida -- ${bad.slice(1).replace(/[ynafpvV]/g, '')[0] ?? bad}\nModo de empleo: e2fsck [-panyrcdfktvDFV] [-b superbloque] [-B tamaño_bloque] dispositivo`, 16);
      const opts = rest.filter((a) => a.startsWith('-')).join('');
      const dev = rest.find((a) => !a.startsWith('-'));
      if (!dev) return fail('fsck de util-linux 2.32.1\nfsck: falta el dispositivo (por ejemplo: fsck -y /dev/sda8)', 16);
      const head = 'fsck de util-linux 2.32.1';
      const f = findFs(sh.storage, dev);
      if (!f) return fail(`${head}\nfsck.ext2: No existe el fichero o el directorio al intentar abrir ${dev}`, 8);
      if (!isRoot(ctx)) return fail(`${head}\ne2fsck 1.45.6 (20-Mar-2020)\nfsck.${f.type}: Permiso denegado al intentar abrir ${dev} (usa sudo)`, 8);
      if (f.type === 'xfs') return ok(`${head}\nIf you wish to check the consistency of an XFS filesystem or\nrepair a damaged filesystem, see xfs_repair(8).\n`);
      if (f.mount) return fail(`${head}\ne2fsck 1.45.6 (20-Mar-2020)\n${dev} está montado.\ne2fsck: No se puede continuar, se aborta.\n(Desmóntalo antes con umount: reparar un sistema de ficheros en uso lo destrozaría.)`, 8);
      const e2 = 'e2fsck 1.45.6 (20-Mar-2020)';
      if (!f.errors) return ok(`${head}\n${e2}\n${dev}: limpio, 312/655360 ficheros, 81920/2621440 bloques\n`);
      const problems = [
        'Paso 1: Verificando nodos-i, bloques y tamaños',
        'El nodo-i 131074 tiene un recuento de enlaces de 1, debería ser 2.',
        'Paso 2: Verificando la estructura de directorios',
        'La entrada «informes» del directorio /srv/profesores (12) tiene un nodo-i borrado/no utilizado 131090.',
        'Paso 5: Verificando el resumen de información de grupos',
        'Diferencias del mapa de bits de bloques: -(1310720--1310727)',
      ];
      if (opts.includes('n')) {
        return fail('', 4, joinLines([head, e2, `${dev} contiene un sistema de ficheros con errores, se fuerza la revisión.`, ...problems.flatMap((p) => (p.startsWith('Paso') ? [p] : [p, '¿Corregir? no'])), '', `${dev}: ********** ATENCIÓN: El sistema de ficheros aún tiene errores **********`]));
      }
      if (!opts.includes('y') && !opts.includes('p') && !opts.includes('a')) {
        return fail('', 4, joinLines([head, e2, `${dev} contiene un sistema de ficheros con errores, se fuerza la revisión.`, problems[0], problems[1], '¿Corregir<s>? ', '(e2fsck preguntaría por CADA error y espera tu respuesta. Para reparar sin preguntar, como al arrancar un servidor: fsck -y)']));
      }
      f.errors = 0;
      return fail('', 1, joinLines([head, e2, `${dev} contiene un sistema de ficheros con errores, se fuerza la revisión.`, ...problems.flatMap((p) => (p.startsWith('Paso') ? [p] : [p, '¿Corregir? sí'])), '', `${dev}: ***** SE HA MODIFICADO EL SISTEMA DE FICHEROS *****`, `${dev}: 312/655360 ficheros (0.6% no contiguos), 81920/2621440 bloques`, '(Código de salida 1: se han corregido errores. 0 = estaba limpio; 4 = quedan errores sin corregir.)']));
    },

    mount: (sh, ctx, argv) => {
      const args = argv.slice(1);
      const st = sh.storage;
      if (!args.length) {
        return ok(joinLines(st.fss.filter((f) => f.mount).map((f) => `${f.dev} on ${f.mount} type ${f.type} (rw,relatime${f.type === 'xfs' ? ',seclabel,attr2,inode64' : ''})`)));
      }
      if (!isRoot(ctx)) return fail('mount: solo root puede hacer eso (usa sudo)', 1);
      const fstab = () => {
        const r = readFile(ctx, '/etc/fstab', 'mount');
        return r.content ? lines(r.content).filter((l) => l.trim() && !l.trim().startsWith('#')).map((l) => l.trim().split(/\s+/)) : [];
      };
      const doMount = (dev, dir) => {
        const f = findFs(st, dev);
        if (!f) return `mount: ${dir}: el dispositivo especial ${dev} no existe.`;
        const target = abs(ctx, dir);
        const d = getNode(ctx.fs, target);
        if (!d || d.type !== 'dir') return `mount: ${dir}: el punto de montaje no existe.`;
        if (f.mount === target) return `mount: ${dir}: ${dev} ya está montado en ${target}.`;
        if (f.errors) return `mount: ${dir}: wrong fs type, bad option, bad superblock on ${dev}, missing codepage or helper program, or other error.\n(El sistema de ficheros tiene errores: repáralo con fsck antes de montarlo.)`;
        f.mount = target;
        return null;
      };
      if (args[0] === '-a') {
        const errs = [];
        for (const [dev, dir, type] of fstab()) {
          if (type === 'swap' || dir === 'none') continue;
          const f = findFs(st, dev);
          if (!f || f.mount) continue;
          const e = doMount(dev, dir);
          if (e) errs.push(e);
        }
        return errs.length ? fail(errs.join('\n'), 32) : ok();
      }
      const pos = args.filter((a) => !a.startsWith('-'));
      let [dev, dir] = pos;
      if (!dir) {
        const line = fstab().find(([d, m]) => d === dev || m === abs(ctx, dev) || m === dev);
        if (!line) return fail(`mount: ${dev}: no se encuentra en /etc/fstab.`, 1);
        [dev, dir] = line;
      }
      const e = doMount(dev, dir);
      return e ? fail(e, 32) : ok();
    },

    umount: (sh, ctx, argv) => {
      const t = argv[1];
      if (!t) return fail('umount: falta el punto de montaje o el dispositivo');
      if (!isRoot(ctx)) return fail(`umount: ${t}: solo root puede desmontar (usa sudo)`, 32);
      const f = sh.storage.fss.find((x) => x.mount && (x.mount === abs(ctx, t) || x.dev === t || findLv(sh.storage, t) && x.dev === lvDev(findLv(sh.storage, t))));
      if (!f) return fail(`umount: ${t}: no montado.`, 32);
      if (f.mount === '/' || f.mount === '/var') return fail(`umount: ${f.mount}: el destino está ocupado.`, 32);
      if (ctx.cwd === f.mount || ctx.cwd.startsWith(f.mount + '/')) return fail(`umount: ${f.mount}: el destino está ocupado (estás dentro: sal con cd).`, 32);
      f.mount = null;
      return ok();
    },

    ping: (sh, ctx, argv) => {
      const { flags, args } = getopts(argv.slice(1), 'ciW');
      const host = args[0];
      if (!host) return fail('ping: dirección de destino requerida', 2);
      const ip = resolveHost(sh, ctx, host);
      if (!ip) return fail(`ping: ${host}: Nombre o servicio desconocido`, 2);
      const count = flags.c !== undefined ? parseInt(flags.c, 10) : 4;
      if (!(count > 0)) return fail(`ping: cuenta de paquetes inválida: ${flags.c}`, 2);
      const path = pathTo(sh, ip);
      if (!path) return fail('ping: connect: La red es inaccesible', 2);
      const out = [`PING ${host} (${ip}) 56(84) bytes of data.`];
      const n = path.hops.length;
      const shown = Math.min(count, 10);
      if (path.replies) for (let i = 1; i <= shown; i++) out.push(`64 bytes from ${host === ip ? ip : `${host} (${ip})`}: icmp_seq=${i} ttl=${65 - n} time=${ms(n, i)} ms`);
      if (count > shown) out.push(`(… hasta ${count} respuestas)`);
      out.push('', `--- ${host} ping statistics ---`);
      out.push(`${count} packets transmitted, ${path.replies ? count : 0} received, ${path.replies ? 0 : 100}% packet loss, time ${(count - 1) * 1001}ms`);
      if (path.replies) out.push(`rtt min/avg/max/mdev = ${ms(n, 1)}/${ms(n, 2)}/${ms(n, 3)}/0.012 ms`);
      if (flags.c === undefined) out.push('(En Linux ping no se para solo: seguiría hasta pulsar Ctrl+C. El simulador lo corta en 4; usa -c para elegir cuántos.)');
      return path.replies ? ok(joinLines(out)) : fail('', 1, joinLines(out));
    },

    traceroute: (sh, ctx, argv) => {
      const host = argv.slice(1).find((a) => !a.startsWith('-'));
      if (!host) return fail('Specify "host" missing argument.', 2);
      const ip = resolveHost(sh, ctx, host);
      if (!ip) return fail(`${host}: Nombre o servicio desconocido\nCannot handle "host" cmdline arg \`${host}' on position 1 (argc 1)`, 2);
      const path = pathTo(sh, ip);
      if (!path) return fail('connect: La red es inaccesible', 2);
      const out = [`traceroute to ${host} (${ip}), 30 hops max, 60 byte packets`];
      const hops = path.replies ? path.hops : path.hops.slice(0, -1);
      hops.forEach((h, i) => {
        const name = sh.net.remote[h]?.name;
        out.push(`${String(i + 1).padStart(2)}  ${name ?? h} (${h})  ${ms(i + 1, 1)} ms  ${ms(i + 1, 2)} ms  ${ms(i + 1, 3)} ms`);
      });
      if (!path.replies) {
        for (let i = hops.length + 1; i <= hops.length + 3; i++) out.push(`${String(i).padStart(2)}  * * *`);
        out.push('(… seguiría con «* * *» hasta 30 saltos: a partir de ahí nadie responde. El problema está después del último router que sí contestó.)');
      }
      return ok(joinLines(out));
    },

    curl: (sh, ctx, argv) => {
      const { flags, args } = getopts(argv.slice(1));
      const url = args[0];
      if (!url) return fail('curl: try \'curl --help\' for more information', 2);
      const m = url.match(/^(?:(https?):\/\/)?([^/:]+)(?::(\d+))?(\/.*)?$/);
      if (!m) return fail(`curl: (3) URL using bad/illegal format or missing URL`, 3);
      const [, scheme = 'http', host, portStr, pathPart = '/'] = m;
      const port = Number(portStr ?? (scheme === 'https' ? 443 : 80));
      const ip = resolveHost(sh, ctx, host);
      if (!ip) return fail(`curl: (6) Could not resolve host: ${host}`, 6);
      const local = ['127.0.0.1', ...sh.net.ifaces.map((i) => i.addr.split('/')[0])].includes(ip) && !ctx.container;
      const respond = (body, server = 'nginx/1.20.1') => {
        const headers = ['HTTP/1.1 200 OK', `Server: ${server}`, 'Content-Type: text/html', `Content-Length: ${body.length}`, ''];
        if (flags.I) return ok(joinLines(headers));
        return ok(flags.i ? joinLines(headers) + body : body);
      };
      const notFound = () => ok(flags.I ? 'HTTP/1.1 404 Not Found\nServer: nginx\n\n' : '<html>\n<head><title>404 Not Found</title></head>\n<body><center><h1>404 Not Found</h1></center></body>\n</html>\n');
      const refused = () => fail(`curl: (7) Failed to connect to ${host} port ${port} after 0 ms: Conexión rehusada`, 7);
      if (!local) {
        const r = sh.net.remote[ip];
        if (!r) return fail(`curl: (28) Failed to connect to ${host} port ${port} after 130000 ms: Tiempo de espera agotado para la conexión`, 28);
        return r.ports.includes(port) ? respond(`<h1>${r.name}</h1>\n`, 'Apache') : refused();
      }
      const c = sh.docker.containers.find((x) => x.status === 'running' && x.ports.some((p) => p.host === port));
      if (c) {
        const mapped = c.ports.find((p) => p.host === port).container;
        const root = c.spec.webroot;
        if (!root || mapped !== (c.spec.exposes ?? 80)) return fail(`curl: (56) Recv failure: Conexión reinicializada por la máquina remota\n(El puerto ${port} del anfitrión lleva al ${mapped} del contenedor, pero ahí no escucha nadie: el servidor del contenedor está en el ${c.spec.exposes ?? 80}.)`, 56);
        const file = getNode(c.fs, `${root}${pathPart === '/' ? '/index.html' : pathPart}`);
        return file?.type === 'file' ? respond(file.content, 'nginx/1.27.2') : notFound();
      }
      const svc = Object.entries(sh.services).find(([, s]) => s.active && s.port === port);
      if (svc) {
        const file = getNode(sh.hostCtx.fs, `/usr/share/nginx/html${pathPart === '/' ? '/index.html' : pathPart}`);
        return respond(file?.type === 'file' ? file.content : `<h1>${svc[0]} en web01</h1>\n`, svc[0] === 'nginx' ? 'nginx/1.20.1' : svc[0]);
      }
      const proc = sh.procs.find((p) => p.port === port);
      if (proc) return respond('<!DOCTYPE HTML>\n<html><head><title>Directory listing for /</title></head></html>\n', 'SimpleHTTP/0.6 Python/3.6.8');
      return refused();
    },

    ps: (sh, ctx, argv) => {
      if (ctx.container) return ok('    PID TTY          TIME CMD\n      1 pts/0    00:00:00 bash\n     12 pts/0    00:00:00 ps\n');
      const args = argv.slice(1);
      const all = args.some((a) => /^(-?a?u?x|-e|-ef|aux|-aux|ax|-A)$/.test(a) || a === '-e' || a === '-ef');
      const sortArg = args.find((a) => a.startsWith('--sort='))?.slice(7) ?? null;
      let list = processList(sh);
      if (!all) {
        return ok(joinLines(['    PID TTY          TIME CMD', '   1203 pts/0    00:00:00 bash', '   1290 pts/0    00:00:00 ps']));
      }
      list = [...list, { pid: 1290, user: ctx.user === 'root' ? 'root' : 'alumno', cmd: `ps ${args.join(' ')}`, cpu: 0, mem: 0.1, tty: 'pts/0' }];
      if (sortArg) {
        const desc = sortArg.startsWith('-');
        const key = sortArg.replace(/^[-+]/, '');
        const k = { '%cpu': 'cpu', pcpu: 'cpu', '%mem': 'mem', pmem: 'mem', pid: 'pid' }[key] ?? 'pid';
        list.sort((a, b) => (desc ? b[k] - a[k] : a[k] - b[k]));
      }
      const ef = args.some((a) => a.startsWith('-') && a.includes('f'));
      if (ef) {
        return ok(joinLines(['UID          PID    PPID  C STIME TTY          TIME CMD', ...list.map((p) => `${p.user.padEnd(8)} ${String(p.pid).padStart(7)} ${String(p.pid === 1 ? 0 : 1).padStart(7)}  ${Math.round(p.cpu)} 09:00 ${p.tty.padEnd(8)} 00:00:0${Math.min(9, Math.round(p.cpu / 10))} ${p.cmd}`)]));
      }
      return ok(
        joinLines([
          'USER         PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND',
          ...list.map((p) =>
            `${p.user.padEnd(8)} ${String(p.pid).padStart(7)} ${p.cpu.toFixed(1).padStart(4)} ${p.mem.toFixed(1).padStart(4)} ${String(20000 + p.pid * 7).padStart(6)} ${String(4000 + p.pid * 3).padStart(5)} ${p.tty.padEnd(8)} ${p.cpu > 50 ? 'R' : 'S'}s   09:00   ${p.cpu > 50 ? '12:31' : '0:00'} ${p.cmd}`,
          ),
        ]),
      );
    },

    top: (sh) => {
      const list = processList(sh).sort((a, b) => b.cpu - a.cpu).slice(0, 12);
      const total = Math.min(100, list.reduce((a, p) => a + p.cpu, 0));
      return ok(
        joinLines([
          `top - 10:12:04 up 1:12,  1 user,  load average: ${(total / 50).toFixed(2)}, ${(total / 60).toFixed(2)}, ${(total / 80).toFixed(2)}`,
          `Tasks: ${list.length + 120} total,   1 running, ${list.length + 119} sleeping,   0 stopped,   0 zombie`,
          `%Cpu(s): ${(total / 2).toFixed(1)} us,  0.7 sy,  0.0 ni, ${(100 - total / 2 - 0.7).toFixed(1)} id,  0.0 wa`,
          'MiB Mem :   7821.4 total,   4109.2 free,   1730.6 used,   1981.6 buff/cache',
          '',
          '    PID USER      PR  NI    VIRT    RES  %CPU  %MEM     TIME+ COMMAND',
          ...list.map((p) => `${String(p.pid).padStart(7)} ${p.user.padEnd(9)} 20   0 ${String(200000 + p.pid * 13).padStart(7)} ${String(8000 + p.pid * 3).padStart(6)} ${p.cpu.toFixed(1).padStart(5)} ${p.mem.toFixed(1).padStart(5)}   0:00.${String(p.pid % 100).padStart(2, '0')} ${p.cmd.split(' ')[0].split('/').pop()}`),
          '',
          '(top se actualiza cada 3 segundos hasta pulsar q. En el simulador es una foto fija.)',
        ]),
      );
    },

    kill: (sh, ctx, argv) => {
      const args = argv.slice(1);
      if (args[0] === '-l') return ok(' 1) SIGHUP\t 2) SIGINT\t 3) SIGQUIT\t 9) SIGKILL\n15) SIGTERM\t18) SIGCONT\t19) SIGSTOP\n');
      let sig = 15;
      const pids = [];
      for (let i = 0; i < args.length; i++) {
        const a = args[i];
        if (a === '-s') {
          sig = signalNum(args[++i]);
          if (!sig) return fail(`bash: kill: ${args[i]}: especificación de señal inválida`);
        } else if (a.startsWith('-')) {
          sig = signalNum(a.slice(1));
          if (!sig) return fail(`bash: kill: ${a.slice(1)}: especificación de señal inválida`);
        } else pids.push(a);
      }
      if (!pids.length) return fail('kill: uso: kill [-s spec_señal | -n num_señal | -spec_señal] pid | spec_trabajo ... o kill -l [spec_señal]', 2);
      const errs = [];
      for (const p of pids) {
        const r = signal(sh, ctx, Number(p), sig);
        if (r) errs.push(`bash: kill: (${p}) - ${r}`);
      }
      return errs.length ? fail(errs.join('\n')) : ok();
    },

    pkill: (sh, ctx, argv) => {
      const args = argv.slice(1);
      const sigArg = args.find((a) => a.startsWith('-'));
      const sig = sigArg ? signalNum(sigArg.slice(1)) : 15;
      const name = args.find((a) => !a.startsWith('-'));
      if (!name) return fail('pkill: no se ha especificado ningún criterio de coincidencia', 2);
      const hits = processList(sh).filter((p) => p.pid !== 1 && p.pid !== 1203 && p.cmd.split(' ').some((w) => w.split('/').pop().includes(name)));
      if (!hits.length) return fail('', 1);
      for (const p of hits) signal(sh, ctx, p.pid, sig);
      return ok();
    },

    journalctl: (sh, _ctx, argv) => {
      const { flags, long, args } = getopts(argv.slice(1), 'upn');
      const unit = (flags.u ?? long.unit ?? '').replace(/\.service$/, '');
      const prioArg = flags.p ?? long.priority;
      const PRIOS = { emerg: 0, alert: 1, crit: 2, err: 3, warning: 4, notice: 5, info: 6, debug: 7 };
      const maxPrio = prioArg === undefined ? 7 : (PRIOS[prioArg] ?? Number(prioArg));
      if (Number.isNaN(maxPrio)) return fail(`Failed to parse priority value: ${prioArg}`);
      let list = sh.journal.filter((e) => (!unit || e.unit === unit) && e.prio <= maxPrio);
      if (args.length && !unit) list = list.filter((e) => args.some((a) => a.includes(e.unit)));
      const n = flags.n !== undefined ? Number(flags.n) : flags.e || flags.f ? 10 : null;
      if (n !== null && !Number.isNaN(n)) list = list.slice(-n);
      const out = [`-- Logs begin at ${T0}00:01 CET, end at ${sh.journal.at(-1)?.t ?? T0 + '00:01'} CET. --`];
      if (!list.length) out.push('-- No entries --');
      for (const e of list) {
        out.push(`${e.t} web01 ${e.ident}: ${e.msg}`);
        if (flags.x && e.prio <= 3 && e.explain) out.push(`-- ${e.explain}`);
      }
      if (flags.f) out.push('(journalctl -f sigue mostrando las entradas nuevas en directo, como tail -f. Se sale con Ctrl+C.)');
      return ok(joinLines(out));
    },

    crontab: (sh, ctx, argv, stdin) => {
      const args = argv.slice(1);
      const uIdx = args.indexOf('-u');
      let user = ctx.user;
      if (uIdx >= 0) {
        user = args[uIdx + 1];
        if (!user) return fail('crontab: la opción requiere un argumento -- \'u\'');
        if (user !== ctx.user && !isRoot(ctx)) return fail('must be privileged to use -u');
        args.splice(uIdx, 2);
      }
      const tabs = sh.crontabs;
      if (args[0] === '-l') return tabs[user] ? ok(tabs[user]) : fail(`no crontab for ${user}`);
      if (args[0] === '-r') {
        if (!tabs[user]) return fail(`no crontab for ${user}`);
        delete tabs[user];
        return ok();
      }
      if (args[0] === '-e') {
        return ok(
          joinLines([
            'crontab -e abre tu crontab en el editor (vi o nano) y, al guardar y salir, la instala.',
            'En el simulador no hay editor: instala la línea desde un fichero o desde una tubería:',
            '  echo "30 2 * * * /home/alumno/backup.sh" > tareas.txt   y luego   crontab tareas.txt',
            '  echo "30 2 * * * /home/alumno/backup.sh" | crontab -',
            '(¡Ojo! Las dos formas SUSTITUYEN la crontab entera. Mira antes qué hay con crontab -l.)',
          ]),
        );
      }
      const src = args[0];
      if (!src) return fail('crontab: falta el fichero (o -l, -e, -r). Ejemplo: crontab tareas.txt');
      let content;
      if (src === '-') content = stdin ?? '';
      else {
        const r = readFile(ctx, src, 'crontab');
        if (r.error) return fail(r.error.replace('crontab: ', `crontab: ${src}: `).replace(`${src}: ${src}`, src));
        content = r.content;
      }
      const errs = [];
      lines(content).forEach((l, i) => {
        const t = l.trim();
        if (!t || t.startsWith('#') || /^\w+=/.test(t)) return;
        const e = cronLineError(t);
        if (e) errs.push(`"${src === '-' ? '-' : src}":${i + 1}: ${e}`);
      });
      if (errs.length) return fail([...errs, "errors in crontab file, can't install."].join('\n'));
      tabs[user] = content.endsWith('\n') || !content ? content : content + '\n';
      return ok();
    },

    rpm: (sh, ctx, argv) => {
      if (pkgMgrFor(sh, ctx) !== 'rhel') return fail('bash: rpm: orden no encontrada', 127);
      const args = argv.slice(1);
      const st = pkgState(sh, ctx);
      if (args.includes('-qa')) return ok(joinLines(st.installed.map((p) => `${p}-${CATALOG.rhel[p][0]}.x86_64`)));
      if (args[0] !== '-q' || !args[1]) return fail('rpm: en el simulador: rpm -q paquete | rpm -qa');
      const out = [];
      let missing = 0;
      for (const p of args.slice(1)) {
        if (st.installed.includes(p)) out.push(`${p}-${CATALOG.rhel[p][0]}.x86_64`);
        else {
          out.push(`el paquete ${p} no está instalado`);
          missing++;
        }
      }
      return missing ? fail('', missing, joinLines(out)) : ok(joinLines(out));
    },
    dnf: dnfCmd,
    yum: dnfCmd,
    apt: aptCmd,
    'apt-get': aptCmd,
    apk: apkCmd,
  };

  function signal(sh, ctx, pid, sig) {
    if (pid === 1) return 'Operación no permitida';
    if (pid === 1203) return null; // la propia terminal: en el simulador no se cierra
    const svc = Object.entries(sh.services).find(([, s]) => s.active && s.pid === pid);
    const proc = sh.procs.find((p) => p.pid === pid);
    if (!svc && !proc) return 'No existe el proceso';
    const owner = svc ? (svc[1].user ?? 'root') : proc.user;
    if (!isRoot(ctx) && owner !== ctx.user) return 'Operación no permitida';
    if (sig === 0 || sig === 18 || sig === 1) return null;
    if (proc) {
      if (sig === 15 && proc.ignoresTerm) return null;
      sh.procs = sh.procs.filter((p) => p !== proc);
      return null;
    }
    const [name, s] = svc;
    if (sig === 15 && s.ignoresTerm) return null;
    s.active = false;
    s.failed = sig === 9;
    journalAdd(sh, name, sig === 9 ? `${name}.service: Main process exited, code=killed, status=9/KILL` : `${name}.service: Succeeded.`, sig === 9 ? 4 : 6, 'systemd[1]');
    s.pid = null;
    return null;
  }
}

function growFs(f, lv) {
  const target = lv ? lv.size : f.size;
  const before = Math.round(f.size * 262144);
  const after = Math.round(target * 262144);
  const linesOut = [
    `meta-data=${f.dev} isize=512    agcount=4, agsize=${Math.round(before / 4)} blks`,
    '         =                       sectsz=512   attr=2, projid32bit=1',
    `data     =                       bsize=4096   blocks=${before}, imaxpct=25`,
    'naming   =version 2              bsize=4096   ascii-ci=0, ftype=1',
    'log      =internal log           bsize=4096   blocks=25600, version=2',
  ];
  if (after > before) {
    linesOut.push(`data blocks changed from ${before} to ${after}`);
    f.size = target;
  } else linesOut.push('(El sistema de ficheros ya ocupa todo el volumen: amplía antes el volumen lógico con lvextend.)');
  return { lines: linesOut };
}

function signalNum(s) {
  const t = String(s ?? '').toUpperCase().replace(/^SIG/, '');
  if (/^\d+$/.test(t)) return Number(t);
  return { HUP: 1, INT: 2, QUIT: 3, KILL: 9, TERM: 15, CONT: 18, STOP: 19 }[t] ?? null;
}

// Una línea de crontab: 5 campos de tiempo y la orden (o @daily, @reboot…).
export function cronLineError(line) {
  if (/^@(reboot|yearly|annually|monthly|weekly|daily|midnight|hourly)\s+\S/.test(line)) return null;
  const parts = line.split(/\s+/);
  if (parts.length < 6) return 'bad command (faltan campos: minuto hora día mes día_semana orden)';
  const names = ['minute', 'hour', 'day-of-month', 'month', 'day-of-week'];
  const ranges = [[0, 59], [0, 23], [1, 31], [1, 12], [0, 7]];
  for (let i = 0; i < 5; i++) {
    const [lo, hi] = ranges[i];
    for (const item of parts[i].split(',')) {
      const m = item.match(/^(\*|(\d+)(?:-(\d+))?)(?:\/(\d+))?$/);
      const named = i >= 3 && /^[a-z]{3}$/i.test(item);
      if (named) continue;
      if (!m) return `bad ${names[i]}`;
      for (const v of [m[2], m[3]].filter(Boolean).map(Number)) if (v < lo || v > hi) return `bad ${names[i]}`;
    }
  }
  return null;
}

// Para validadores y pruebas: tamaño, ocupado y % de uso de lo montado en mount.
export function fsUsage(sh, mount) {
  const f = sh.storage.fss.find((x) => x.mount === mount);
  if (!f) return null;
  const used = fsUsed(sh, f);
  return { size: f.size, used, pct: (used / f.size) * 100 };
}
