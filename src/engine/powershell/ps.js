// PowerShell simulado (Windows 11 o Windows Server 2019). Lo justo para
// lo que pregunta el examen y un poco más:
//   - cmdlets Verbo-Sustantivo con sus parámetros de verdad, abreviables
//     («-Rec») y con los errores reales cuando no existen («-Recursive»);
//     alias (ls, cd, cp, cat, rm…) y Get-Help / Get-Command.
//   - ficheros: Get-ChildItem, Set-Location, New-Item, Copy-Item (con la
//     diferencia entre copiar la carpeta y copiar su contenido), Move-Item,
//     Remove-Item, Get-Content, Set-Content…
//   - roles: Get/Install-WindowsFeature, Install-ADDSDomainController,
//     Install-ADDSForest; servicios: Get/Start/Stop-Service.
//   - red y cortafuegos: netsh advfirewall, New-NetFirewallRule,
//     Test-NetConnection, ipconfig, ping, tracert.
//   - diagnóstico: repadmin, dcdiag, netdom, nltest, sfc y DISM.
//
// Misma interfaz que la shell de Linux (run, prompt, screen, history, log)
// para reutilizar el componente Terminal. Sin dependencias del navegador.

// ── Sistema de ficheros (sin distinguir mayúsculas, como NTFS) ─────────

const dirNode = (name, children = []) => {
  const n = { type: 'dir', name, children: {} };
  for (const c of children) n.children[c.name.toLowerCase()] = c;
  return n;
};
const fileNode = (name, content = '', size) => ({ type: 'file', name, content, size });
const sizeOf = (n) => (n.type === 'file' ? (n.size ?? n.content.length) : 0);
const clone = (n) => (n.type === 'file' ? { ...n } : { ...n, children: Object.fromEntries(Object.entries(n.children).map(([k, v]) => [k, clone(v)])) });

function defaultFs(user, server) {
  const home = dirNode(user, [dirNode('Desktop'), dirNode('Documents'), dirNode('Downloads')]);
  return dirNode('C:', [
    dirNode('PerfLogs'),
    dirNode('Program Files', [dirNode('Windows Defender'), dirNode('WindowsPowerShell')]),
    dirNode('Users', [home, dirNode('Public')]),
    dirNode('Windows', [
      dirNode('System32', [
        dirNode('drivers', [dirNode('etc', [fileNode('hosts', '# Copyright (c) 1993-2009 Microsoft Corp.\n127.0.0.1       localhost\n')])]),
        fileNode('notepad.exe', '(binario)', 201216),
        fileNode('cmd.exe', '(binario)', 289792),
      ]),
      dirNode('Logs', [dirNode('CBS', [fileNode('CBS.log', '')])]),
      ...(server ? [dirNode('NTDS'), dirNode('SYSVOL')] : []),
    ]),
  ]);
}

const splitPath = (p) => p.replace(/\//g, '\\').split('\\').filter(Boolean);

// Ruta escrita por el alumno → lista de segmentos desde C:\ (o null si es otra unidad).
function toSegs(st, raw) {
  let p = String(raw).replace(/\//g, '\\').trim();
  if (p === '~' || p.startsWith('~\\')) p = st.home + p.slice(1);
  let segs;
  if (/^[a-z]:/i.test(p)) {
    if (p[0].toUpperCase() !== 'C') return null;
    segs = [];
    p = p.slice(2);
  } else if (p.startsWith('\\')) segs = [];
  else segs = splitPath(st.cwd).slice(1);
  for (const s of splitPath(p)) {
    if (s === '.') continue;
    if (s === '..') segs.pop();
    else segs.push(s);
  }
  return segs;
}

function nodeAt(st, segs) {
  let n = st.fs;
  for (const s of segs) {
    if (n?.type !== 'dir') return null;
    n = n.children[s.toLowerCase()];
    if (!n) return null;
  }
  return n;
}

// Ruta con las mayúsculas de verdad de los nodos que existen.
function display(st, segs) {
  let n = st.fs;
  const out = ['C:'];
  for (const s of segs) {
    const next = n?.type === 'dir' ? n.children[s.toLowerCase()] : null;
    out.push(next ? next.name : s);
    n = next;
  }
  return out.length === 1 ? 'C:\\' : out.join('\\');
}

const wildRe = (pat) => new RegExp('^' + pat.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.') + '$', 'i');

// Expande comodines del último segmento: C:\DirectorioA\* → sus hijos.
function expand(st, raw) {
  const segs = toSegs(st, raw);
  if (!segs) return { error: `No se encuentra la unidad. No existe ninguna unidad con el nombre '${String(raw)[0]}'.` };
  const last = segs[segs.length - 1] ?? '';
  if (!/[*?]/.test(last)) return { items: [{ segs, node: nodeAt(st, segs) }] };
  const parent = nodeAt(st, segs.slice(0, -1));
  if (parent?.type !== 'dir') return { items: [] };
  const re = wildRe(last);
  return {
    items: Object.values(parent.children)
      .filter((c) => re.test(c.name))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((c) => ({ segs: [...segs.slice(0, -1), c.name], node: c })),
  };
}

// ── Estado inicial ──────────────────────────────────────────────────────

const FEATURES = () => ({
  'AD-Domain-Services': { display: 'Servicios de dominio de Active Directory', installed: false, tools: 'RSAT-ADDS' },
  'AD-Certificate': { display: 'Servicios de certificados de Active Directory', installed: false },
  DHCP: { display: 'Servidor DHCP', installed: false, tools: 'RSAT-DHCP' },
  DNS: { display: 'Servidor DNS', installed: false, tools: 'RSAT-DNS-Server' },
  'File-Services': { display: 'Servicios de archivos y almacenamiento', installed: true },
  'FS-FileServer': { display: 'Servidor de archivos', installed: true, parent: 'File-Services' },
  'Web-Server': { display: 'Servidor web (IIS)', installed: false, tools: 'Web-Mgmt-Console' },
  'Hyper-V': { display: 'Hyper-V', installed: false },
  'RSAT-ADDS': { display: 'Herramientas de AD DS y AD LDS', installed: false, tool: true },
  'RSAT-DHCP': { display: 'Herramientas del servidor DHCP', installed: false, tool: true },
  'RSAT-DNS-Server': { display: 'Herramientas del servidor DNS', installed: false, tool: true },
  'Web-Mgmt-Console': { display: 'Consola de administración de IIS', installed: false, tool: true },
  'Windows-Defender': { display: 'Antivirus de Microsoft Defender', installed: true },
  'Telnet-Client': { display: 'Cliente Telnet', installed: false },
});

const SERVICES = (server) => ({
  BITS: { display: 'Servicio de transferencia inteligente en segundo plano (BITS)', status: 'Running' },
  Dnscache: { display: 'Cliente DNS', status: 'Running' },
  EventLog: { display: 'Registro de eventos de Windows', status: 'Running' },
  LanmanServer: { display: 'Servidor', status: 'Running' },
  MpsSvc: { display: 'Firewall de Windows Defender', status: 'Running' },
  Spooler: { display: 'Cola de impresión', status: server ? 'Stopped' : 'Running' },
  W32Time: { display: 'Hora de Windows', status: 'Running' },
  WinRM: { display: 'Administración remota de Windows (WS-Management)', status: server ? 'Running' : 'Stopped' },
  wuauserv: { display: 'Windows Update', status: 'Running' },
});

const DEFAULT_RULES = () => [
  { name: 'Escritorio remoto - Modo de usuario (TCP de entrada)', dir: 'in', action: 'allow', protocol: 'TCP', localport: '3389', enabled: true },
  { name: 'Compartir archivos e impresoras (eco ICMPv4 de entrada)', dir: 'in', action: 'allow', protocol: 'ICMPv4', localport: 'Any', enabled: true },
];

export function createPowerShell(setup = {}) {
  const server = setup.os !== 'win11';
  const user = setup.user ?? (server ? 'Administrador' : 'alumno');
  const st = {
    os: server ? 'Microsoft Windows Server 2019 Standard' : 'Microsoft Windows 11 Pro',
    version: server ? '10.0.17763' : '10.0.22631',
    server,
    host: setup.host ?? (server ? 'SRV-DC02' : 'PC-TAI-07'),
    user,
    domain: 'TAI',
    elevated: setup.elevated ?? server,
    home: `C:\\Users\\${user}`,
    cwd: setup.cwd ?? (setup.elevated ?? server ? 'C:\\Windows\\system32' : `C:\\Users\\${user}`),
    fs: defaultFs(user, server),
    features: FEATURES(),
    services: SERVICES(server),
    firewall: { profiles: { Domain: true, Private: true, Public: true }, rules: DEFAULT_RULES() },
    // replication.broken: hubo un corte; vuelve a estar bien cuando el DNS
    // funciona y se fuerza la sincronización (repadmin /syncall).
    ad: { domain: 'tai.local', role: 'member', dcs: ['SRV-DC01'], replication: { broken: false, synced: false } },
    sfc: { corrupt: [], storeCorrupt: false, repaired: false },
    net: { ip: server ? '10.30.20.12' : '10.30.16.45', mask: server ? '255.255.255.0' : '255.255.240.0', gw: server ? '10.30.20.1' : '10.30.16.1', dns: server ? '10.30.20.10' : '10.30.20.10' },
    remote: {
      '10.30.20.10': { name: 'SRV-DC01', ports: [53, 88, 135, 389, 445, 3389] },
      '10.30.20.30': { name: 'db01', ports: [22, 3306] },
      '10.30.20.12': { name: 'SRV-DC02', ports: [135, 445, 3389] },
      '10.30.16.1': { name: 'gw-usuarios', ports: [] },
      '10.30.20.1': { name: 'gw-servidores', ports: [] },
    },
  };
  for (const d of setup.dirs ?? []) mkdirP(st, toSegs(st, d));
  for (const [p, spec] of Object.entries(setup.files ?? {})) {
    const segs = toSegs(st, p);
    mkdirP(st, segs.slice(0, -1));
    const s = typeof spec === 'string' ? { content: spec } : spec;
    nodeAt(st, segs.slice(0, -1)).children[segs.at(-1).toLowerCase()] = fileNode(segs.at(-1), s.content ?? '', s.size);
  }
  setup.setup?.(st);

  const ps = {
    kind: 'powershell',
    state: st,
    screen: [],
    history: [],
    log: [],
    get title() {
      return `${st.elevated ? 'Administrador: ' : ''}Windows PowerShell — ${st.host}`;
    },
    prompt: () => `PS ${st.cwd}>`,
    run: (line) => runLine(ps, line),
    complete: (line) => complete(st, line),
  };
  return ps;
}

function mkdirP(st, segs) {
  let n = st.fs;
  for (const s of segs) {
    if (!n.children[s.toLowerCase()]) n.children[s.toLowerCase()] = dirNode(s);
    n = n.children[s.toLowerCase()];
  }
  return n;
}

// ── Análisis de la línea ────────────────────────────────────────────────

function tokenize(line, st) {
  const text = line.replace(/[“”„]/g, '"').replace(/[‘’]/g, "'");
  const statements = [[[]]];
  let cur = '';
  let has = false;
  let quoted = false;
  let quote = null;
  const pipeline = () => statements[statements.length - 1];
  const push = () => {
    if (has) {
      const p = pipeline();
      p[p.length - 1].push({ text: quoted ? cur : expandVars(cur, st), quoted });
    }
    cur = '';
    has = false;
    quoted = false;
  };
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quote) {
      if (ch === quote) quote = null;
      else cur += ch;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      has = true;
      quoted = true;
      if (ch === '"') {
        // Las comillas dobles expanden variables; las simples, no.
        const end = text.indexOf('"', i + 1);
        if (end > i) {
          cur += expandVars(text.slice(i + 1, end), st);
          i = end;
          quote = null;
        }
      }
    } else if (ch === ' ' || ch === '\t') push();
    else if (ch === '|') {
      push();
      pipeline().push([]);
    } else if (ch === ';') {
      push();
      statements.push([[]]);
    } else if (ch === '#' && !has) break;
    else {
      cur += ch;
      has = true;
    }
  }
  if (quote) throw new Error('Falta el terminador de cadena: ' + quote);
  push();
  // «DNS, NTDS» es una sola lista: se juntan los trozos separados por comas.
  for (const p of statements) {
    for (const cmd of p) {
      for (let i = cmd.length - 2; i >= 0; i--) {
        if (cmd[i].text.endsWith(',') || cmd[i + 1].text.startsWith(',')) {
          cmd.splice(i, 2, { text: cmd[i].text + cmd[i + 1].text, quoted: cmd[i].quoted || cmd[i + 1].quoted });
        }
      }
    }
  }
  return statements.filter((p) => p.some((c) => c.length));
}

function expandVars(s, st) {
  return s.replace(/\$(env:)?(\w+)/gi, (m, env, name) => {
    const k = name.toLowerCase();
    if (env) return { userprofile: st.home, computername: st.host, username: st.user, windir: 'C:\\Windows', systemroot: 'C:\\Windows', userdomain: st.domain, temp: `${st.home}\\AppData\\Local\\Temp` }[k] ?? '';
    return { home: st.home, pwd: st.cwd, true: 'True', false: 'False', null: '' }[k] ?? m;
  });
}

// ── Errores con el formato de PowerShell ────────────────────────────────

function psError(line, cmd, msg, { col = 1, len, category, id }) {
  const marker = ' '.repeat(Math.max(0, col - 1)) + '~'.repeat(Math.max(1, len ?? cmd.length));
  return [
    `${cmd} : ${msg}`,
    `En línea: 1 Carácter: ${col}`,
    `+ ${line}`,
    `+ ${marker}`,
    `    + CategoryInfo          : ${category}`,
    `    + FullyQualifiedErrorId : ${id}`,
  ].join('\n');
}

class PsFail extends Error {
  constructor(text) {
    super(text);
    this.text = text;
  }
}

// ── Cmdlets ─────────────────────────────────────────────────────────────
// params: [nombre, tipo ('s' texto, 'b' modificador, 'l' lista), posición]

const CMDLETS = {
  'Get-ChildItem': { params: [['Path', 's', 0], ['Filter', 's', 1], ['Recurse', 'b'], ['Force', 'b'], ['Name', 'b'], ['File', 'b'], ['Directory', 'b'], ['Include', 'l'], ['Exclude', 'l'], ['Depth', 's']], aliases: ['gci', 'ls', 'dir'], synopsis: 'Obtiene los elementos (ficheros y carpetas) de una ubicación.' },
  'Set-Location': { params: [['Path', 's', 0]], aliases: ['cd', 'sl', 'chdir'], synopsis: 'Cambia la ubicación (directorio) de trabajo.' },
  'Get-Location': { params: [], aliases: ['pwd', 'gl'], synopsis: 'Muestra la ubicación (directorio) actual.' },
  'New-Item': { params: [['Path', 'l', 0], ['ItemType', 's'], ['Name', 's'], ['Value', 's'], ['Force', 'b']], aliases: ['ni'], synopsis: 'Crea un elemento nuevo: un fichero (-ItemType File) o una carpeta (-ItemType Directory).' },
  'Remove-Item': { params: [['Path', 'l', 0], ['Recurse', 'b'], ['Force', 'b'], ['Confirm', 'b'], ['WhatIf', 'b']], aliases: ['rm', 'del', 'erase', 'rd', 'rmdir', 'ri'], synopsis: 'Elimina ficheros y carpetas. Las carpetas con contenido necesitan -Recurse.' },
  'Copy-Item': { params: [['Path', 'l', 0], ['Destination', 's', 1], ['Recurse', 'b'], ['Force', 'b'], ['Container', 'b'], ['PassThru', 'b'], ['Filter', 's'], ['WhatIf', 'b']], aliases: ['cp', 'copy', 'cpi'], synopsis: 'Copia elementos de una ubicación a otra. Para incluir subcarpetas y su contenido hace falta -Recurse.' },
  'Move-Item': { params: [['Path', 'l', 0], ['Destination', 's', 1], ['Force', 'b'], ['PassThru', 'b']], aliases: ['mv', 'move', 'mi'], synopsis: 'Mueve elementos a otra ubicación.' },
  'Rename-Item': { params: [['Path', 's', 0], ['NewName', 's', 1], ['Force', 'b']], aliases: ['ren', 'rni'], synopsis: 'Cambia el nombre de un elemento.' },
  'Get-Content': { params: [['Path', 'l', 0], ['Tail', 's'], ['TotalCount', 's'], ['Wait', 'b']], aliases: ['gc', 'cat', 'type'], synopsis: 'Muestra el contenido de un fichero. -Tail N las últimas N líneas; -Wait lo sigue en directo (como tail -f).' },
  'Set-Content': { params: [['Path', 's', 0], ['Value', 's', 1]], aliases: ['sc'], synopsis: 'Escribe (sustituye) el contenido de un fichero.' },
  'Add-Content': { params: [['Path', 's', 0], ['Value', 's', 1]], aliases: ['ac'], synopsis: 'Añade contenido al final de un fichero.' },
  'Test-Path': { params: [['Path', 's', 0]], aliases: [], synopsis: 'Devuelve True si la ruta existe.' },
  'Write-Output': { params: [['InputObject', 'rest', 0]], aliases: ['echo', 'write'], synopsis: 'Escribe objetos (texto) en la salida.' },
  'Write-Host': { params: [['Object', 'rest', 0], ['ForegroundColor', 's']], aliases: [], synopsis: 'Escribe texto directamente en la pantalla.' },
  'Get-Help': { params: [['Name', 's', 0], ['Examples', 'b'], ['Full', 'b'], ['Detailed', 'b'], ['Online', 'b']], aliases: ['help', 'man'], synopsis: 'Muestra la ayuda de un cmdlet: qué hace, su sintaxis y ejemplos.' },
  'Get-Command': { params: [['Name', 's', 0], ['Verb', 's'], ['Noun', 's'], ['Module', 's']], aliases: ['gcm'], synopsis: 'Busca cmdlets por nombre, verbo o sustantivo (admite comodines: Get-Command *Firewall*).' },
  'Get-Alias': { params: [['Name', 's', 0]], aliases: ['gal'], synopsis: 'Muestra los alias: nombres cortos de los cmdlets (ls → Get-ChildItem).' },
  'Clear-Host': { params: [], aliases: ['cls', 'clear'], synopsis: 'Limpia la pantalla.' },
  'Get-History': { params: [], aliases: ['h', 'history', 'ghy'], synopsis: 'Muestra las órdenes escritas en esta sesión.' },
  'Get-Service': { params: [['Name', 'l', 0], ['DisplayName', 's']], aliases: ['gsv'], synopsis: 'Muestra los servicios de Windows y su estado.' },
  'Start-Service': { params: [['Name', 'l', 0], ['PassThru', 'b']], aliases: ['sasv'], synopsis: 'Arranca uno o varios servicios (como administrador).' },
  'Stop-Service': { params: [['Name', 'l', 0], ['Force', 'b'], ['PassThru', 'b']], aliases: ['spsv'], synopsis: 'Detiene uno o varios servicios (como administrador).' },
  'Restart-Service': { params: [['Name', 'l', 0], ['Force', 'b'], ['PassThru', 'b']], aliases: [], synopsis: 'Reinicia uno o varios servicios (como administrador).' },
  'Get-WindowsFeature': { params: [['Name', 'l', 0]], aliases: [], server: true, synopsis: 'Lista los roles y características de Windows Server; [X] = instalado.' },
  'Install-WindowsFeature': { params: [['Name', 'l', 0], ['IncludeManagementTools', 'b'], ['IncludeAllSubFeature', 'b'], ['Restart', 'b'], ['WhatIf', 'b']], aliases: ['Add-WindowsFeature'], server: true, synopsis: 'Instala roles o características en Windows Server. -IncludeManagementTools añade sus consolas y cmdlets de administración.' },
  'Uninstall-WindowsFeature': { params: [['Name', 'l', 0], ['IncludeManagementTools', 'b'], ['Restart', 'b']], aliases: ['Remove-WindowsFeature'], server: true, synopsis: 'Desinstala roles o características.' },
  'Install-ADDSDomainController': { params: [['DomainName', 's'], ['InstallDns', 'b'], ['Credential', 's'], ['SafeModeAdministratorPassword', 's'], ['SiteName', 's'], ['Force', 'b'], ['NoRebootOnCompletion', 'b']], aliases: [], server: true, needs: 'AD-Domain-Services', synopsis: 'Promociona este servidor a controlador de dominio ADICIONAL de un dominio que ya existe.' },
  'Install-ADDSForest': { params: [['DomainName', 's'], ['DomainNetbiosName', 's'], ['InstallDns', 'b'], ['SafeModeAdministratorPassword', 's'], ['ForestMode', 's'], ['DomainMode', 's'], ['Force', 'b']], aliases: [], server: true, needs: 'AD-Domain-Services', synopsis: 'Crea un bosque de Active Directory NUEVO, con este servidor como su primer controlador de dominio.' },
  'Get-ADDomainController': { params: [['Identity', 's', 0], ['Filter', 's']], aliases: [], server: true, needs: 'RSAT-ADDS', synopsis: 'Muestra los controladores de dominio.' },
  'New-NetFirewallRule': { params: [['DisplayName', 's'], ['Name', 's'], ['Direction', 's'], ['Protocol', 's'], ['LocalPort', 's'], ['RemotePort', 's'], ['Action', 's'], ['Profile', 's'], ['Enabled', 's']], aliases: [], synopsis: 'Crea una regla del Firewall de Windows Defender.' },
  'Get-NetFirewallRule': { params: [['DisplayName', 's', 0], ['Name', 's'], ['Enabled', 's'], ['Direction', 's']], aliases: [], synopsis: 'Muestra reglas del cortafuegos.' },
  'Remove-NetFirewallRule': { params: [['DisplayName', 's', 0], ['Name', 's']], aliases: [], synopsis: 'Borra reglas del cortafuegos.' },
  'Test-NetConnection': { params: [['ComputerName', 's', 0], ['Port', 's', 1], ['TraceRoute', 'b'], ['InformationLevel', 's']], aliases: ['tnc'], synopsis: 'Prueba la conectividad con un equipo: ping o, con -Port, si un puerto TCP acepta conexiones.' },
  'Get-NetIPAddress': { params: [['AddressFamily', 's']], aliases: [], synopsis: 'Muestra las direcciones IP del equipo.' },
  'Start-Process': { params: [['FilePath', 's', 0], ['ArgumentList', 'l', 1], ['Verb', 's'], ['Wait', 'b']], aliases: ['start', 'saps'], synopsis: 'Arranca un programa. Con -Verb RunAs lo abre como administrador (elevado).' },
  'Get-ComputerInfo': { params: [['Property', 'l', 0]], aliases: [], synopsis: 'Información del sistema operativo y del equipo.' },
  'Restart-Computer': { params: [['Force', 'b']], aliases: [], synopsis: 'Reinicia el equipo.' },
};

const NATIVE = ['netsh', 'repadmin', 'dcdiag', 'netdom', 'nltest', 'sfc', 'dism', 'ipconfig', 'ping', 'tracert', 'whoami', 'hostname', 'chkdsk', 'gpupdate', 'robocopy', 'xcopy'];

const ALIASES = {};
for (const [name, def] of Object.entries(CMDLETS)) for (const a of def.aliases) ALIASES[a.toLowerCase()] = name;
const CMDLET_BY_LOWER = Object.fromEntries(Object.keys(CMDLETS).map((n) => [n.toLowerCase(), n]));

// Comandos que existen en Linux y no aquí: pista al alumno.
const LINUX_HINT = {
  sudo: 'En Windows no hay sudo: abre PowerShell como administrador (Start-Process powershell -Verb RunAs).',
  grep: 'En PowerShell se usa Select-String (o findstr).',
  touch: 'En PowerShell se usa New-Item -ItemType File nombre.',
  ifconfig: 'En Windows se usa ipconfig.',
  traceroute: 'En Windows se usa tracert.',
  systemctl: 'En Windows: Get-Service, Start-Service, Stop-Service.',
  'Copy-Path': null,
  'Add-ADDSRole': null,
  'New-ADDomainService': null,
};

function bind(def, tokens, line, cmdName) {
  const out = {};
  const names = def.params.map((p) => p[0]);
  const positional = def.params.filter((p) => p.length > 2).sort((a, b) => a[2] - b[2]);
  const free = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (!t.quoted && /^-[A-Za-z]/.test(t.text)) {
      const [rawName, inline] = t.text.slice(1).split(/:(.*)/s);
      const lower = rawName.toLowerCase();
      const exact = names.find((n) => n.toLowerCase() === lower);
      const matches = exact ? [exact] : names.filter((n) => n.toLowerCase().startsWith(lower));
      const col = line.toLowerCase().indexOf(t.text.toLowerCase()) + 1;
      if (matches.length === 0) {
        throw new PsFail(psError(line, cmdName, `No se encuentra ningún parámetro que coincida con el nombre del parámetro '${rawName}'.`, { col, len: t.text.length, category: `InvalidArgument: (:) [${cmdName}], ParameterBindingException`, id: `NamedParameterNotFound,Microsoft.PowerShell.Commands.${cmdName.replace('-', '')}Command` }));
      }
      if (matches.length > 1) {
        throw new PsFail(psError(line, cmdName, `No se puede procesar el parámetro porque el nombre de parámetro '${rawName}' es ambiguo. Las posibles coincidencias son: ${matches.map((m) => '-' + m).join(' ')}.`, { col, len: t.text.length, category: `InvalidArgument: (:) [${cmdName}], ParameterBindingException`, id: `AmbiguousParameter,Microsoft.PowerShell.Commands.${cmdName.replace('-', '')}Command` }));
      }
      const [pname, ptype] = def.params.find((p) => p[0] === matches[0]);
      if (ptype === 'b') {
        out[pname] = inline === undefined ? true : !/^\$?false$/i.test(inline);
        continue;
      }
      const value = inline ?? tokens[++i]?.text;
      if (value === undefined) {
        throw new PsFail(psError(line, cmdName, `Falta un argumento para el parámetro '${pname}'. Especifique un parámetro del tipo 'System.String' e inténtelo de nuevo.`, { col, len: t.text.length, category: `InvalidArgument: (:) [${cmdName}], ParameterBindingException`, id: `MissingArgument,Microsoft.PowerShell.Commands.${cmdName.replace('-', '')}Command` }));
      }
      out[pname] = ptype === 'l' ? value.split(',').filter(Boolean) : value;
    } else free.push(t.text);
  }
  for (const p of positional) {
    if (out[p[0]] !== undefined) continue;
    if (p[1] === 'rest') {
      if (free.length) out[p[0]] = free.splice(0).join(' ');
      continue;
    }
    if (!free.length) break;
    const v = free.shift();
    out[p[0]] = p[1] === 'l' ? v.split(',').filter(Boolean) : v;
  }
  if (free.length) {
    throw new PsFail(psError(line, cmdName, `No se encuentra ningún parámetro de posición que acepte el argumento '${free[0]}'.`, { col: line.indexOf(free[0]) + 1, len: free[0].length, category: `InvalidArgument: (:) [${cmdName}], ParameterBindingException`, id: `PositionalParameterNotFound,Microsoft.PowerShell.Commands.${cmdName.replace('-', '')}Command` }));
  }
  return out;
}

// ── Ejecución ───────────────────────────────────────────────────────────

function runLine(ps, raw) {
  const st = ps.state;
  const line = raw.trim();
  ps.screen.push({ kind: 'cmd', prompt: ps.prompt(), text: raw });
  if (!line) return { ok: true, code: 0 };
  ps.history.push(line);
  let statements;
  try {
    statements = tokenize(line, st);
  } catch (e) {
    const entry = { line, ok: false, code: 1, out: '', err: e.message, cmds: [] };
    ps.log.push(entry);
    ps.screen.push({ kind: 'err', text: `En línea: 1 Carácter: ${line.length}\n+ ${line}\n${e.message}` });
    return entry;
  }
  const entry = { line, ok: true, code: 0, out: '', err: '', cmds: [] };
  ps.log.push(entry);
  for (const pipeline of statements) {
    let text = '';
    let failed = false;
    for (let i = 0; i < pipeline.length; i++) {
      const [head, ...args] = pipeline[i];
      if (!head) continue;
      try {
        if (i === 0) {
          const r = execute(ps, head.text, args, line, entry);
          if (r.clear) {
            ps.screen = [];
            continue;
          }
          text = r.out ?? '';
          if (r.err) {
            entry.err += r.err + '\n';
            ps.screen.push({ kind: 'err', text: r.err });
          }
          if (r.code) {
            entry.code = r.code;
            entry.ok = false;
          }
        } else text = pipeFilter(head.text, args, text, line);
      } catch (e) {
        if (!(e instanceof PsFail)) throw e;
        entry.ok = false;
        entry.code = 1;
        entry.err += e.text + '\n';
        ps.screen.push({ kind: 'err', text: e.text });
        failed = true;
        break;
      }
    }
    if (!failed && text) {
      entry.out += text;
      ps.screen.push({ kind: 'out', text: text.replace(/\n+$/, '') });
    }
  }
  return entry;
}

function pipeFilter(name, args, text, line) {
  const n = name.toLowerCase();
  if (['format-table', 'ft', 'format-list', 'fl', 'out-host', 'out-default', 'more', 'out-string'].includes(n)) return text;
  if (['select-string', 'sls', 'findstr'].includes(n)) {
    const pat = args.find((a) => !a.text.startsWith('-') && !a.text.startsWith('/'))?.text ?? '';
    const re = new RegExp(pat.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*'), 'i');
    return text.split('\n').filter((l) => l && re.test(l)).join('\n') + '\n';
  }
  if (['select-object', 'select'].includes(n)) {
    const first = args.findIndex((a) => /^-f/i.test(a.text));
    if (first >= 0) return text.split('\n').slice(0, Number(args[first + 1]?.text ?? 10) + 3).join('\n') + '\n';
    return text;
  }
  throw new PsFail(`${name} : en el simulador las tuberías solo admiten Format-Table, Format-List, Select-String y Select-Object -First N.\n(${line})`);
}

function notRecognized(line, name) {
  const col = line.indexOf(name) + 1;
  let msg = psError(line, name, `El término '${name}' no se reconoce como nombre de un cmdlet, función, archivo de script o programa ejecutable. Compruebe si escribió correctamente el nombre o, si incluyó una ruta de acceso, compruebe que dicha ruta es correcta e inténtelo de nuevo.`, { col, len: name.length, category: `ObjectNotFound: (${name}:String) [], CommandNotFoundException`, id: 'CommandNotFoundException' });
  const hint = LINUX_HINT[name] ?? LINUX_HINT[name.toLowerCase()];
  if (hint) msg += `\n(${hint})`;
  return msg;
}

function execute(ps, name, args, line, entry) {
  const st = ps.state;
  const lower = name.toLowerCase();
  if (lower === 'exit') return { out: '(Esta es la consola principal: en el simulador no se cierra.)\n' };
  if (lower === 'mkdir' || lower === 'md') {
    entry.cmds.push({ name: 'New-Item', params: { Path: args.filter((a) => !a.text.startsWith('-')).map((a) => a.text), ItemType: 'Directory' } });
    return cmdlets['New-Item'](st, { Path: args.filter((a) => !a.text.startsWith('-')).map((a) => a.text), ItemType: 'Directory' }, line);
  }
  const exe = lower.replace(/\.exe$/, '');
  if (NATIVE.includes(exe)) {
    const argv = args.map((a) => a.text);
    entry.cmds.push({ name: exe, args: argv });
    return natives[exe](st, argv, line);
  }
  const canonical = CMDLET_BY_LOWER[lower] ?? ALIASES[lower];
  if (!canonical) throw new PsFail(notRecognized(line, name));
  const def = CMDLETS[canonical];
  if ((def.server && !st.server) || (def.needs && !st.features[def.needs]?.installed)) throw new PsFail(notRecognized(line, name));
  const params = bind(def, args, line, canonical);
  entry.cmds.push({ name: canonical, params, alias: canonical.toLowerCase() === lower ? null : name });
  return cmdlets[canonical](st, params, line, ps);
}

const ok = (out = '') => ({ out, code: 0 });
const lines = (arr) => (arr.length ? arr.join('\n') + '\n' : '');
const errOut = (line, cmd, msg, category, id) => ({ out: '', err: psError(line, cmd, msg, { category, id }), code: 1 });
const notFoundPath = (line, cmd, p) =>
  errOut(line, cmd, `No se encuentra la ruta de acceso '${p}' porque no existe.`, `ObjectNotFound: (${p}:String) [${cmd}], ItemNotFoundException`, `PathNotFound,Microsoft.PowerShell.Commands.${cmd.replace('-', '')}Command`);
const needElevation = (line, cmd) =>
  errOut(line, cmd, 'Acceso denegado. La operación requiere elevación: abre PowerShell como administrador (Start-Process powershell -Verb RunAs).', `PermissionDenied: (:) [${cmd}], UnauthorizedAccessException`, `UnauthorizedAccess,${cmd}`);

const DATE = '10/11/2026      9:00';

function listing(st, segs, node, opts) {
  const kids = Object.values(node.children)
    .filter((c) => (!opts.File || c.type === 'file') && (!opts.Directory || c.type === 'dir'))
    .filter((c) => !opts.Filter || wildRe(opts.Filter).test(c.name))
    .sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'dir' ? -1 : 1));
  const out = [];
  if (opts.Name) return { out: kids.map((k) => (opts.prefix ?? '') + k.name), recurse: kids };
  if (kids.length) {
    out.push('', `    Directorio: ${display(st, segs)}`, '', '', 'Mode                 LastWriteTime         Length Name', '----                 -------------         ------ ----');
    for (const k of kids) out.push(`${k.type === 'dir' ? 'd-----' : '-a----'}        ${DATE}${k.type === 'dir' ? ''.padStart(15) : String(sizeOf(k)).padStart(15)} ${k.name}`);
  }
  return { out, recurse: kids };
}

const cmdlets = {
  'Get-Location': (st) => ok(`\nPath\n----\n${st.cwd}\n\n`),

  'Set-Location': (st, p, line) => {
    const target = p.Path ?? st.home;
    const segs = toSegs(st, target);
    const n = segs && nodeAt(st, segs);
    if (!n) return notFoundPath(line, 'Set-Location', segs ? display(st, segs) : target);
    if (n.type !== 'dir') return errOut(line, 'Set-Location', `No se encuentra la ruta de acceso '${display(st, segs)}' porque no es un directorio.`, 'InvalidArgument', 'ItemNotContainer');
    st.cwd = display(st, segs);
    return ok();
  },

  'Get-ChildItem': (st, p, line) => {
    const { items, error } = expand(st, p.Path ?? '.');
    if (error) return errOut(line, 'Get-ChildItem', error, 'ObjectNotFound', 'DriveNotFound');
    if (!items.length || !items[0].node) return notFoundPath(line, 'Get-ChildItem', display(st, toSegs(st, p.Path ?? '.')));
    const out = [];
    let rootLen = null;
    const walkDir = (segs, node) => {
      rootLen ??= segs.length;
      const prefix = segs.slice(rootLen).map((x) => x + '\\').join('');
      const r = listing(st, segs, node, { ...p, prefix });
      out.push(...r.out);
      if (p.Recurse) for (const k of r.recurse) if (k.type === 'dir') walkDir([...segs, k.name], k);
      if (p.Recurse && !p.Name) {
        for (const k of Object.values(node.children)) if (k.type === 'dir' && !r.recurse.includes(k)) walkDir([...segs, k.name], k);
      }
    };
    if (items.length === 1 && items[0].node.type === 'dir' && !/[*?]$/.test(p.Path ?? '')) walkDir(items[0].segs, items[0].node);
    else {
      const parentSegs = items[0].segs.slice(0, -1);
      const fake = dirNode('x', items.map((i) => i.node));
      const r = listing(st, parentSegs, fake, p);
      out.push(...r.out);
      if (p.Recurse) for (const i of items) if (i.node.type === 'dir') walkDir(i.segs, i.node);
    }
    return ok(lines(out) + (p.Name ? '' : '\n'));
  },

  'New-Item': (st, p, line) => {
    const paths = p.Path ?? (p.Name ? ['.'] : []);
    if (!paths.length) return errOut(line, 'New-Item', 'Falta la ruta (-Path) o el nombre (-Name) del elemento.', 'InvalidArgument', 'MissingPath');
    const type = (p.ItemType ?? 'File').toLowerCase();
    if (!['file', 'directory', 'dir', 'folder'].includes(type)) return errOut(line, 'New-Item', `El tipo '${p.ItemType}' no es válido. Usa -ItemType File o -ItemType Directory.`, 'InvalidArgument', 'NewItemTypeNotSupported');
    const isDir = type !== 'file';
    const out = [];
    for (const raw of paths) {
      const segs = toSegs(st, p.Name ? `${raw}\\${p.Name}` : raw);
      if (!segs?.length) return errOut(line, 'New-Item', 'Ruta no válida.', 'InvalidArgument', 'InvalidPath');
      let parent = nodeAt(st, segs.slice(0, -1));
      // Las carpetas intermedias se crean solas; para un fichero hace falta -Force.
      if (!parent && (isDir || p.Force)) parent = mkdirP(st, segs.slice(0, -1));
      if (parent?.type !== 'dir') return errOut(line, 'New-Item', `No se encuentra una parte de la ruta de acceso '${display(st, segs)}'.`, 'WriteError', 'NewItemIOError');
      const name = segs.at(-1);
      let node = parent.children[name.toLowerCase()];
      if (node && !p.Force) {
        return errOut(line, 'New-Item', `Ya existe un elemento con el nombre especificado: ${display(st, segs)}.`, `ResourceExists: (${display(st, segs)}:String) [New-Item], IOException`, 'DirectoryExist,Microsoft.PowerShell.Commands.NewItemCommand');
      }
      if (node && node.type === 'file' && !isDir) {
        node.content = p.Value !== undefined ? p.Value + '\n' : '';
        delete node.size;
      } else if (!node) {
        node = isDir ? dirNode(name) : fileNode(name, p.Value !== undefined ? p.Value + '\n' : '');
        parent.children[name.toLowerCase()] = node;
      }
      out.push(...listing(st, segs.slice(0, -1), dirNode('x', [node]), {}).out);
    }
    return ok(lines(out) + '\n');
  },

  'Remove-Item': (st, p, line) => {
    for (const raw of p.Path ?? []) {
      const { items } = expand(st, raw);
      if (!items?.length || !items[0].node) return notFoundPath(line, 'Remove-Item', display(st, toSegs(st, raw)));
      for (const { segs, node } of items) {
        if (!segs.length) return errOut(line, 'Remove-Item', 'No se puede eliminar la raíz de la unidad.', 'PermissionDenied', 'RemoveItemUnauthorizedAccessError');
        if (node.type === 'dir' && Object.keys(node.children).length && !p.Recurse) {
          return errOut(line, 'Remove-Item', `El elemento en ${display(st, segs)} tiene elementos secundarios y no se especificó el parámetro Recurse. Si continúa, se quitarán todos los elementos secundarios junto con el elemento. (Usa -Recurse para borrar la carpeta con todo su contenido.)`, 'InvalidOperation', 'RemoveItemRecurseRequired');
        }
        if (segs[0]?.toLowerCase() === 'windows' && !st.elevated) return needElevation(line, 'Remove-Item');
        if (p.WhatIf) continue;
        delete nodeAt(st, segs.slice(0, -1)).children[segs.at(-1).toLowerCase()];
        if (st.cwd.toLowerCase().startsWith(display(st, segs).toLowerCase())) st.cwd = display(st, segs.slice(0, -1));
      }
    }
    return ok();
  },

  'Copy-Item': (st, p, line) => copyMove(st, p, line, false),
  'Move-Item': (st, p, line) => copyMove(st, { ...p, Recurse: true }, line, true),

  'Rename-Item': (st, p, line) => {
    if (!p.Path || !p.NewName) return errOut(line, 'Rename-Item', 'Faltan -Path o -NewName.', 'InvalidArgument', 'MissingArgument');
    const segs = toSegs(st, p.Path);
    const n = nodeAt(st, segs);
    if (!n) return notFoundPath(line, 'Rename-Item', display(st, segs));
    const parent = nodeAt(st, segs.slice(0, -1));
    delete parent.children[n.name.toLowerCase()];
    n.name = p.NewName;
    parent.children[p.NewName.toLowerCase()] = n;
    return ok();
  },

  'Get-Content': (st, p, line) => {
    let text = '';
    for (const raw of p.Path ?? []) {
      const segs = toSegs(st, raw);
      const n = nodeAt(st, segs);
      if (!n) return notFoundPath(line, 'Get-Content', display(st, segs));
      if (n.type === 'dir') return errOut(line, 'Get-Content', `No se puede encontrar el contenido de '${display(st, segs)}' porque es un directorio.`, 'ReadError', 'GetContentReaderUnauthorizedAccessError');
      let ls = n.content.split('\n');
      if (ls.at(-1) === '') ls.pop();
      if (p.Tail) ls = ls.slice(-Number(p.Tail));
      if (p.TotalCount) ls = ls.slice(0, Number(p.TotalCount));
      text += lines(ls);
    }
    if (p.Wait) text += '(Con -Wait, Get-Content se queda esperando y muestra cada línea nueva: el «tail -f» de Windows. Se sale con Ctrl+C.)\n';
    return ok(text);
  },

  'Set-Content': (st, p, line) => writeContent(st, p, line, false),
  'Add-Content': (st, p, line) => writeContent(st, p, line, true),

  'Test-Path': (st, p) => {
    const segs = toSegs(st, p.Path ?? '');
    return ok(segs && nodeAt(st, segs) ? 'True\n' : 'False\n');
  },

  'Write-Output': (_st, p) => ok((p.InputObject ?? '') + '\n'),
  'Write-Host': (_st, p) => ok((p.Object ?? '') + '\n'),

  'Clear-Host': () => ({ clear: true, code: 0 }),

  'Get-History': (_st, _p, _line, ps) => ok(lines(['', '  Id CommandLine', '  -- -----------', ...ps.history.slice(0, -1).map((h, i) => `${String(i + 1).padStart(4)} ${h}`), ''])),

  'Get-Help': (st, p) => {
    if (!p.Name) {
      return ok(lines([
        'TEMA',
        '    Sistema de ayuda de Windows PowerShell',
        '',
        'DESCRIPCIÓN BREVE',
        '    Muestra ayuda sobre los cmdlets y conceptos de PowerShell.',
        '',
        '    Los cmdlets se llaman Verbo-Sustantivo: Get-ChildItem, Copy-Item, Install-WindowsFeature…',
        '    Get-Help nombre     ayuda de un cmdlet (Get-Help Copy-Item)',
        '    Get-Help nombre -Examples   solo los ejemplos',
        '    Get-Command *texto* busca cmdlets (Get-Command *Firewall*)',
        '    Get-Alias           los nombres cortos (ls, cd, cp, cat…)',
      ]));
    }
    const canonical = CMDLET_BY_LOWER[p.Name.toLowerCase()] ?? ALIASES[p.Name.toLowerCase()];
    if (!canonical) {
      const hits = Object.keys(CMDLETS).filter((n) => wildRe(p.Name.includes('*') ? p.Name : `*${p.Name}*`).test(n));
      if (!hits.length) return { out: '', err: `Get-Help : No se encontró ayuda para «${p.Name}». Busca el nombre con Get-Command *${p.Name}*.`, code: 1 };
      return ok(lines(['', 'Name                              Category  Synopsis', '----                              --------  --------', ...hits.map((h) => `${h.padEnd(33)} Cmdlet    ${CMDLETS[h].synopsis}`)]));
    }
    const def = CMDLETS[canonical];
    const syntax = `${canonical} ${def.params.map(([n, t, pos]) => {
      const part = t === 'b' ? `-${n}` : pos !== undefined ? `[-${n}] <${t === 'l' ? 'String[]' : 'String'}>` : `-${n} <String>`;
      return `[${part}]`;
    }).join(' ')}`;
    const examples = HELP_EXAMPLES[canonical] ?? [];
    if (p.Examples) return ok(lines(['', 'NOMBRE', `    ${canonical}`, '', 'SINOPSIS', `    ${def.synopsis}`, '', ...examples.flatMap((e, i) => [`    -------------------------- EJEMPLO ${i + 1} --------------------------`, '', `    PS C:\\> ${e[0]}`, '', `    ${e[1]}`, ''])]));
    return ok(lines([
      '',
      'NOMBRE',
      `    ${canonical}`,
      '',
      'SINOPSIS',
      `    ${def.synopsis}`,
      '',
      'SINTAXIS',
      `    ${syntax}`,
      '',
      ...(def.aliases.length ? ['ALIAS', `    ${def.aliases.join(', ')}`, ''] : []),
      ...(examples.length ? ['EJEMPLO', `    PS C:\\> ${examples[0][0]}`, `    ${examples[0][1]}`, ''] : []),
      'NOTAS',
      `    Para ver los ejemplos, escriba: "get-help ${canonical} -examples".`,
    ]));
  },

  'Get-Command': (st, p) => {
    let names = Object.keys(CMDLETS).filter((n) => (!CMDLETS[n].server || st.server) && (!CMDLETS[n].needs || st.features[CMDLETS[n].needs]?.installed));
    if (p.Name) names = names.filter((n) => wildRe(p.Name).test(n));
    if (p.Verb) names = names.filter((n) => wildRe(p.Verb).test(n.split('-')[0]));
    if (p.Noun) names = names.filter((n) => wildRe(p.Noun).test(n.split('-')[1]));
    if (p.Name && !names.length) {
      const exe = NATIVE.find((x) => wildRe(p.Name.replace(/\.exe$/i, '')).test(x));
      if (exe) return ok(lines(['', 'CommandType     Name                Version    Source', '-----------     ----                -------    ------', `Application     ${(exe + '.exe').padEnd(19)} 10.0.1...  C:\\Windows\\system32\\${exe}.exe`, '']));
      return { out: '', err: `Get-Command : El término '${p.Name}' no se reconoce como nombre de un cmdlet, función, archivo de script o programa ejecutable.`, code: 1 };
    }
    return ok(lines(['', 'CommandType     Name                                Version    Source', '-----------     ----                                -------    ------', ...names.sort().map((n) => `Cmdlet          ${n.padEnd(35)} 3.1.0.0    ${MODULE[n] ?? 'Microsoft.PowerShell.Management'}`), '']));
  },

  'Get-Alias': (_st, p) => {
    let rows = Object.entries(ALIASES).map(([a, c]) => [a, c]);
    if (p.Name) rows = rows.filter(([a]) => wildRe(p.Name).test(a));
    return ok(lines(['', 'CommandType     Name', '-----------     ----', ...rows.sort().map(([a, c]) => `Alias           ${a} -> ${c}`), '']));
  },

  'Get-Service': (st, p, line) => {
    let rows = Object.entries(st.services);
    if (p.Name) {
      const res = [];
      for (const n of p.Name) {
        const hit = rows.filter(([k]) => wildRe(n).test(k));
        if (!hit.length && !n.includes('*')) return errOut(line, 'Get-Service', `No se encuentra ningún servicio con el nombre de servicio '${n}'.`, `ObjectNotFound: (${n}:String) [Get-Service], ServiceCommandException`, 'NoServiceFoundForGivenName,Microsoft.PowerShell.Commands.GetServiceCommand');
        res.push(...hit);
      }
      rows = res;
    }
    if (p.DisplayName) rows = rows.filter(([, s]) => wildRe(p.DisplayName).test(s.display));
    return ok(lines(['', 'Status   Name               DisplayName', '------   ----               -----------', ...rows.map(([k, s]) => `${s.status.padEnd(8)} ${k.padEnd(18)} ${s.display}`), '']));
  },

  'Start-Service': (st, p, line) => serviceAction(st, p, line, 'Start-Service', 'Running'),
  'Stop-Service': (st, p, line) => serviceAction(st, p, line, 'Stop-Service', 'Stopped'),
  'Restart-Service': (st, p, line) => serviceAction(st, p, line, 'Restart-Service', 'Running'),

  'Get-WindowsFeature': (st, p) => {
    let rows = Object.entries(st.features);
    if (p.Name) rows = rows.filter(([k, f]) => p.Name.some((n) => wildRe(n).test(k) || wildRe(n).test(f.display)));
    return ok(lines(['', 'Display Name                                            Name                       Install State', '------------                                            ----                       -------------', ...rows.map(([k, f]) => `${f.installed ? '[X]' : '[ ]'} ${(f.parent || f.tool ? '    ' : '') + f.display}`.padEnd(56) + k.padEnd(27) + (f.installed ? 'Installed' : 'Available')), '']));
  },

  'Install-WindowsFeature': (st, p, line) => {
    if (!p.Name?.length) return errOut(line, 'Install-WindowsFeature', 'Falta el parámetro -Name (por ejemplo: Install-WindowsFeature -Name AD-Domain-Services -IncludeManagementTools).', 'InvalidArgument', 'MissingName');
    if (!st.elevated) return needElevation(line, 'Install-WindowsFeature');
    const done = [];
    for (const n of p.Name) {
      const key = Object.keys(st.features).find((k) => k.toLowerCase() === n.toLowerCase());
      if (!key) return errOut(line, 'Install-WindowsFeature', `ArgumentNotValid: El nombre de rol, servicio de rol o característica no es válido: '${n}'. No se encontró el nombre.`, `InvalidArgument: (${n}:String) [Install-WindowsFeature], Exception`, 'NameDoesNotExist,Microsoft.Windows.ServerManager.Commands.AddWindowsFeatureCommand');
      const f = st.features[key];
      if (!f.installed) done.push(f.display);
      f.installed = true;
      if (p.IncludeManagementTools && f.tools && !st.features[f.tools].installed) {
        st.features[f.tools].installed = true;
        done.push(st.features[f.tools].display);
      }
      if (key === 'DNS') st.services.DNS ??= { display: 'Servidor DNS', status: 'Running' };
    }
    const list = done.length ? `{${done.join(', ')}}` : '{}';
    const warn = p.Name.some((n) => n.toLowerCase() === 'ad-domain-services') && !p.IncludeManagementTools
      ? ['ADVERTENCIA: Sin -IncludeManagementTools no se instalan las herramientas de administración (la consola dsa.msc ni el módulo ADDSDeployment para promocionar el servidor). ¿Seguro?']
      : [];
    return ok(lines(['', 'Success Restart Needed Exit Code      Feature Result', '------- -------------- ---------      --------------', `True    No             ${done.length ? 'Success' : 'NoChangeNeeded'}        ${list.length > 60 ? list.slice(0, 57) + '...' : list}`, ...warn, '']));
  },

  'Uninstall-WindowsFeature': (st, p, line) => {
    if (!st.elevated) return needElevation(line, 'Uninstall-WindowsFeature');
    for (const n of p.Name ?? []) {
      const key = Object.keys(st.features).find((k) => k.toLowerCase() === n.toLowerCase());
      if (key) st.features[key].installed = false;
    }
    return ok('\nSuccess Restart Needed Exit Code      Feature Result\n------- -------------- ---------      --------------\nTrue    Yes            SuccessRest... {…}\n\n');
  },

  'Install-ADDSDomainController': (st, p, line) => promote(st, p, line, 'Install-ADDSDomainController'),
  'Install-ADDSForest': (st, p, line) => promote(st, p, line, 'Install-ADDSForest'),

  'Get-ADDomainController': (st) => {
    const dcs = [...st.ad.dcs, ...(st.ad.role === 'dc' ? [st.host] : [])];
    return ok(lines(dcs.flatMap((d) => ['', `Domain          : ${st.ad.domain}`, `HostName        : ${d}.${st.ad.domain}`, `IsGlobalCatalog : True`, `Name            : ${d}`, `Site            : Default-First-Site-Name`])) + '\n');
  },

  'New-NetFirewallRule': (st, p, line) => {
    if (!st.elevated) return { out: '', err: psError(line, 'New-NetFirewallRule', 'Acceso denegado.', { category: 'PermissionDenied: (MSFT_NetFirewallRule:root/standardcimv2/MSFT_NetFirewallRule) [New-NetFirewallRule], CimException', id: 'Windows System Error 5,New-NetFirewallRule' }) + '\n(Abre PowerShell como administrador: Start-Process powershell -Verb RunAs)', code: 1 };
    const name = p.DisplayName ?? p.Name;
    if (!name) return errOut(line, 'New-NetFirewallRule', 'Falta -DisplayName (el nombre de la regla).', 'InvalidArgument', 'MissingDisplayName');
    const dir = { inbound: 'in', outbound: 'out' }[(p.Direction ?? 'Inbound').toLowerCase()];
    const action = { allow: 'allow', block: 'block' }[(p.Action ?? 'Allow').toLowerCase()];
    if (!dir) return errOut(line, 'New-NetFirewallRule', `No se puede enlazar el parámetro 'Direction'. El valor «${p.Direction}» no es válido: usa Inbound u Outbound.`, 'InvalidArgument', 'ParameterArgumentValidationError');
    if (!action) return errOut(line, 'New-NetFirewallRule', `No se puede enlazar el parámetro 'Action'. El valor «${p.Action}» no es válido: usa Allow o Block.`, 'InvalidArgument', 'ParameterArgumentValidationError');
    const rule = { name, dir, action, protocol: (p.Protocol ?? 'Any').toUpperCase(), localport: p.LocalPort ?? 'Any', remoteport: p.RemotePort ?? 'Any', enabled: true, via: 'powershell' };
    st.firewall.rules.push(rule);
    return ok(lines(['', `Name                  : {${hexId()}}`, `DisplayName           : ${name}`, 'Enabled               : True', 'Profile               : Any', `Direction             : ${dir === 'in' ? 'Inbound' : 'Outbound'}`, `Action                : ${action === 'allow' ? 'Allow' : 'Block'}`, 'PrimaryStatus         : OK', 'Status                : Se analizó la regla correctamente desde el almacén. (65536)', '']));
  },

  'Get-NetFirewallRule': (st, p, line) => {
    let rules = st.firewall.rules;
    if (p.DisplayName) rules = rules.filter((r) => wildRe(p.DisplayName).test(r.name));
    if (p.DisplayName && !rules.length) return errOut(line, 'Get-NetFirewallRule', `No se encontraron objetos MSFT_NetFirewallRule con la propiedad 'DisplayName' igual a '${p.DisplayName}'.`, 'ObjectNotFound', 'CmdletizationQuery_NotFound_DisplayName,Get-NetFirewallRule');
    return ok(lines(rules.flatMap((r) => ['', `DisplayName   : ${r.name}`, `Enabled       : ${r.enabled ? 'True' : 'False'}`, `Direction     : ${r.dir === 'in' ? 'Inbound' : 'Outbound'}`, `Action        : ${r.action === 'allow' ? 'Allow' : 'Block'}`, `Protocol      : ${r.protocol}`, `LocalPort     : ${r.localport}`])) + '\n');
  },

  'Remove-NetFirewallRule': (st, p, line) => {
    if (!st.elevated) return needElevation(line, 'Remove-NetFirewallRule');
    const before = st.firewall.rules.length;
    st.firewall.rules = st.firewall.rules.filter((r) => !wildRe(p.DisplayName ?? p.Name ?? '').test(r.name));
    return before === st.firewall.rules.length ? errOut(line, 'Remove-NetFirewallRule', `No se encontraron reglas con DisplayName '${p.DisplayName}'.`, 'ObjectNotFound', 'NotFound') : ok();
  },

  'Test-NetConnection': (st, p) => {
    const target = p.ComputerName ?? 'internetbeacon.msedge.net';
    const ip = resolveHost(st, target);
    const out = [''];
    if (!ip) return ok(lines([`ADVERTENCIA: No se pudo resolver el nombre: ${target}`, '', `ComputerName   : ${target}`, 'RemoteAddress  :', 'PingSucceeded  : False', '']));
    const r = st.remote[ip];
    out.push(`ComputerName     : ${target}`, `RemoteAddress    : ${ip}`);
    if (p.Port) {
      const open = Boolean(r?.ports.includes(Number(p.Port)));
      if (!open) out.unshift(`ADVERTENCIA: TCP connect to (${ip} : ${p.Port}) failed`);
      out.push(`RemotePort       : ${p.Port}`, 'InterfaceAlias   : Ethernet', `SourceAddress    : ${st.net.ip}`, `TcpTestSucceeded : ${open ? 'True' : 'False'}`);
    } else {
      out.push('InterfaceAlias         : Ethernet', `SourceAddress          : ${st.net.ip}`, `PingSucceeded          : ${r ? 'True' : 'False'}`, `PingReplyDetails (RTT) : ${r ? '1 ms' : '0 ms'}`);
    }
    return ok(lines([...out, '']));
  },

  'Get-NetIPAddress': (st) => ok(lines(['', `IPAddress         : ${st.net.ip}`, 'InterfaceAlias    : Ethernet', 'AddressFamily     : IPv4', `PrefixLength      : ${st.net.mask === '255.255.255.0' ? 24 : 20}`, 'PrefixOrigin      : Manual', '', 'IPAddress         : 127.0.0.1', 'InterfaceAlias    : Loopback Pseudo-Interface 1', 'AddressFamily     : IPv4', 'PrefixLength      : 8', ''])),

  'Start-Process': (st, p, line) => {
    const prog = (p.FilePath ?? '').toLowerCase().replace(/\.exe$/, '');
    if (!prog) return errOut(line, 'Start-Process', 'Falta -FilePath (el programa que se quiere abrir).', 'InvalidArgument', 'MissingFilePath');
    const isShell = ['powershell', 'pwsh', 'cmd'].includes(prog);
    if ((p.Verb ?? '').toLowerCase() === 'runas') {
      if (!isShell) return ok(`(Se abriría ${p.FilePath} como administrador.)\n`);
      if (st.elevated) return ok('(Ya estás en una consola de administrador.)\n');
      st.elevated = true;
      st.cwd = 'C:\\Windows\\system32';
      return ok(lines(['[Control de cuentas de usuario] ¿Quieres permitir que esta aplicación haga cambios en el dispositivo?  → Sí', '', 'Se abre una ventana nueva: «Administrador: Windows PowerShell». En el simulador, esta misma consola pasa a ser la de administrador (fíjate en el título y en la ruta C:\\Windows\\system32).']));
    }
    return ok(`(Se abriría ${p.FilePath}${isShell ? ' sin privilegios de administrador; para elevar: -Verb RunAs' : ''}.)\n`);
  },

  'Get-ComputerInfo': (st) => ok(lines(['', `WindowsProductName : ${st.os.replace('Microsoft ', '')}`, `WindowsVersion     : ${st.server ? '1809' : '23H2'}`, `OsBuildNumber      : ${st.version.split('.').pop()}`, `CsName             : ${st.host}`, `CsDomain           : ${st.ad.domain}`, ''])),

  'Restart-Computer': () => ok('(En el simulador el equipo no se reinicia de verdad; los cambios ya están aplicados.)\n'),
};

const MODULE = {
  'Get-WindowsFeature': 'ServerManager',
  'Install-WindowsFeature': 'ServerManager',
  'Uninstall-WindowsFeature': 'ServerManager',
  'Install-ADDSDomainController': 'ADDSDeployment',
  'Install-ADDSForest': 'ADDSDeployment',
  'Get-ADDomainController': 'ActiveDirectory',
  'New-NetFirewallRule': 'NetSecurity',
  'Get-NetFirewallRule': 'NetSecurity',
  'Remove-NetFirewallRule': 'NetSecurity',
  'Test-NetConnection': 'NetTCPIP',
  'Get-NetIPAddress': 'NetTCPIP',
};

const HELP_EXAMPLES = {
  'Copy-Item': [
    ['Copy-Item -Path "C:\\Origen\\*" -Destination "C:\\Destino" -Recurse', 'Copia TODO el contenido de C:\\Origen (también sus subcarpetas) dentro de C:\\Destino.'],
    ['Copy-Item -Path "C:\\Origen" -Destination "C:\\Destino" -Recurse', 'Copia la carpeta Origen entera: si Destino ya existe, queda como C:\\Destino\\Origen.'],
    ['Copy-Item "informe.docx" "C:\\Copias"', 'Copia un fichero. Los dos primeros parámetros pueden ir sin nombre: -Path y -Destination.'],
  ],
  'Get-ChildItem': [['Get-ChildItem C:\\Users -Recurse -Filter *.docx', 'Busca los .docx en C:\\Users y en todas sus subcarpetas.']],
  'New-Item': [['New-Item -Path C:\\Datos -ItemType Directory', 'Crea la carpeta C:\\Datos.'], ['New-Item -Path notas.txt -ItemType File -Value "hola"', 'Crea un fichero con contenido.']],
  'Install-WindowsFeature': [['Install-WindowsFeature -Name AD-Domain-Services -IncludeManagementTools', 'Instala el rol de AD DS con sus herramientas. Después hay que promocionar el servidor (Install-ADDSDomainController o Install-ADDSForest).']],
  'Install-ADDSDomainController': [['Install-ADDSDomainController -DomainName tai.local -InstallDns', 'Añade este servidor como controlador de dominio adicional de tai.local, con DNS.']],
  'Install-ADDSForest': [['Install-ADDSForest -DomainName nuevo.local -InstallDns', 'Crea un bosque nuevo. ¡No es para añadir un DC a un dominio que ya existe!']],
  'New-NetFirewallRule': [['New-NetFirewallRule -DisplayName "Puerto8443" -Direction Inbound -Protocol TCP -LocalPort 8443 -Action Allow', 'Permite conexiones TCP entrantes al puerto 8443.']],
  'Test-NetConnection': [['Test-NetConnection db01 -Port 3306', 'Comprueba si el puerto 3306 de db01 acepta conexiones TCP (como «nc -vz» en Linux).']],
  'Start-Process': [['Start-Process powershell -Verb RunAs', 'Abre una consola de PowerShell como administrador.']],
  'Get-Service': [['Get-Service -Name DNS, NTDS', 'Muestra el estado de esos dos servicios.']],
};

function copyMove(st, p, line, move) {
  const cmd = move ? 'Move-Item' : 'Copy-Item';
  if (!p.Path?.length) return errOut(line, cmd, 'Falta -Path (lo que se quiere copiar).', 'InvalidArgument', 'MissingPath');
  if (!p.Destination) return errOut(line, cmd, 'Falta -Destination (adónde se copia).', 'InvalidArgument', 'MissingDestination');
  const destSegs = toSegs(st, p.Destination);
  let destNode = nodeAt(st, destSegs);
  const sources = [];
  for (const raw of p.Path) {
    const { items, error } = expand(st, raw);
    if (error) return errOut(line, cmd, error, 'ObjectNotFound', 'DriveNotFound');
    if (!items.length || !items[0].node) return notFoundPath(line, cmd, display(st, toSegs(st, raw)));
    sources.push(...items);
  }
  if (!nodeAt(st, destSegs.slice(0, -1))) return errOut(line, cmd, `No se encuentra una parte de la ruta de acceso '${display(st, destSegs)}'.`, 'WriteError', 'CopyDirectoryInfoItemIOError');
  if (sources.length > 1 && !destNode) {
    destNode = dirNode(destSegs.at(-1));
    nodeAt(st, destSegs.slice(0, -1)).children[destSegs.at(-1).toLowerCase()] = destNode;
  }
  for (const { segs, node } of sources) {
    const srcDisplay = display(st, segs);
    const destDisplay = display(st, destSegs);
    if ((destDisplay.toLowerCase() + '\\').startsWith(srcDisplay.toLowerCase() + '\\') && node.type === 'dir') {
      return errOut(line, cmd, `No se puede copiar el elemento ${srcDisplay} sobre sí mismo.`, 'WriteError', 'CopyError');
    }
    let parent;
    let name;
    if (destNode?.type === 'dir') {
      parent = destNode;
      name = node.name;
    } else {
      parent = nodeAt(st, destSegs.slice(0, -1));
      name = destSegs.at(-1);
    }
    const existing = parent.children[name.toLowerCase()];
    if (node.type === 'file') {
      if (existing?.type === 'dir') return errOut(line, cmd, `No se puede sobrescribir el elemento ${destDisplay}\\${name}: es un directorio.`, 'WriteError', 'CopyError');
      parent.children[name.toLowerCase()] = { ...clone(node), name };
    } else if (p.Recurse) {
      if (existing?.type === 'dir') {
        // Fusiona el contenido con la carpeta que ya existe.
        for (const [k, v] of Object.entries(node.children)) existing.children[k] = clone(v);
      } else parent.children[name.toLowerCase()] = { ...clone(node), name };
    } else if (!existing) {
      // Sin -Recurse, Copy-Item copia la carpeta pero NO lo que tiene dentro.
      parent.children[name.toLowerCase()] = dirNode(name);
    }
    if (move) delete nodeAt(st, segs.slice(0, -1)).children[node.name.toLowerCase()];
  }
  return ok();
}

function writeContent(st, p, line, append) {
  const cmd = append ? 'Add-Content' : 'Set-Content';
  if (!p.Path) return errOut(line, cmd, 'Falta -Path.', 'InvalidArgument', 'MissingPath');
  const segs = toSegs(st, p.Path);
  const parent = nodeAt(st, segs.slice(0, -1));
  if (!parent) return errOut(line, cmd, `No se encuentra una parte de la ruta de acceso '${display(st, segs)}'.`, 'WriteError', 'WriteError');
  const n = parent.children[segs.at(-1).toLowerCase()];
  const text = (p.Value ?? '') + '\n';
  if (n?.type === 'dir') return errOut(line, cmd, `No se puede escribir en '${display(st, segs)}' porque es un directorio.`, 'WriteError', 'WriteError');
  if (n) {
    n.content = append ? n.content + text : text;
    delete n.size;
  } else parent.children[segs.at(-1).toLowerCase()] = fileNode(segs.at(-1), text);
  return ok();
}

function serviceAction(st, p, line, cmd, target) {
  if (!st.elevated) return { out: '', err: psError(line, cmd, `El servicio '${p.Name?.[0]}' no se puede ${target === 'Running' ? 'iniciar' : 'detener'} debido al error siguiente: No se puede abrir el servicio ${p.Name?.[0]} en el equipo '.'.`, { category: `OpenError: (System.ServiceProcess.ServiceController:ServiceController) [${cmd}], ServiceCommandException`, id: `CouldNotStartService,Microsoft.PowerShell.Commands.${cmd.replace('-', '')}Command` }) + '\n(Hace falta una consola de administrador.)', code: 1 };
  for (const n of p.Name ?? []) {
    const key = Object.keys(st.services).find((k) => k.toLowerCase() === n.toLowerCase());
    if (!key) return errOut(line, cmd, `No se encuentra ningún servicio con el nombre de servicio '${n}'.`, `ObjectNotFound: (${n}:String) [${cmd}], ServiceCommandException`, `NoServiceFoundForGivenName,Microsoft.PowerShell.Commands.${cmd.replace('-', '')}Command`);
    st.services[key].status = target;
  }
  return ok(p.PassThru ? lines(['', 'Status   Name               DisplayName', '------   ----               -----------', ...p.Name.map((n) => `${target.padEnd(8)} ${n.padEnd(18)} ${st.services[Object.keys(st.services).find((k) => k.toLowerCase() === n.toLowerCase())].display}`), '']) : '');
}

function promote(st, p, line, cmd) {
  if (!st.elevated) return needElevation(line, cmd);
  if (st.ad.role === 'dc') return errOut(line, cmd, 'Error de comprobación de requisitos previos: este servidor ya es un controlador de dominio.', 'InvalidOperation', 'Test.VerifyDcPromoCore.DCPromo.General.20');
  if (!p.DomainName) return errOut(line, cmd, 'Falta -DomainName (el dominio, por ejemplo tai.local).', 'InvalidArgument', 'MissingDomainName');
  const forest = cmd === 'Install-ADDSForest';
  if (!forest && p.DomainName.toLowerCase() !== st.ad.domain) return errOut(line, cmd, `Error de comprobación de requisitos previos: no se encuentra el dominio '${p.DomainName}'. (El dominio que existe es ${st.ad.domain}.)`, 'InvalidOperation', 'Test.VerifyDcPromoCore.DCPromo.General.77');
  if (forest && p.DomainName.toLowerCase() === st.ad.domain) return errOut(line, cmd, `Error de comprobación de requisitos previos: el dominio '${p.DomainName}' ya existe en la red. Install-ADDSForest crea un bosque NUEVO; para añadir un DC a un dominio existente se usa Install-ADDSDomainController.`, 'InvalidOperation', 'Test.VerifyDcPromoCore.DCPromo.General.25');
  st.ad.role = 'dc';
  st.ad.promotedWith = cmd;
  if (forest) {
    st.ad.domain = p.DomainName.toLowerCase();
    st.ad.dcs = [];
  }
  const dns = p.InstallDns !== false;
  st.services.NTDS = { display: 'Servicios de dominio de Active Directory', status: 'Running' };
  st.services.Netlogon = { display: 'Net Logon', status: 'Running' };
  st.services.DFSR = { display: 'Replicación DFS', status: 'Running' };
  if (dns) {
    st.services.DNS = { display: 'Servidor DNS', status: 'Running' };
    st.features.DNS.installed = true;
  }
  return ok(lines([
    p.SafeModeAdministratorPassword ? '' : 'SafeModeAdministratorPassword: ********   (contraseña del modo de restauración de servicios de directorio, DSRM; el simulador la da por escrita)',
    'Confirmar SafeModeAdministratorPassword: ********',
    '',
    `El servidor de destino se configurará como controlador de dominio ${forest ? `del bosque nuevo ${p.DomainName}` : `adicional de ${p.DomainName}`} y se reiniciará cuando se complete esta operación.`,
    '¿Desea continuar con esta operación? [S] Sí  [O] Sí a todo  [N] No: S',
    '',
    'Message                                                    Context           RebootRequired  Status',
    '-------                                                    -------           --------------  ------',
    'Operación completada correctamente.                        DCPromo.General.1           False Success',
    '',
    '(El servidor se reinicia… y vuelve como controlador de dominio.)',
  ].filter((l, i) => i || l)));
}

const hexId = () => Array.from({ length: 8 }, (_, i) => '0123456789abcdef'[(i * 7 + 3) % 16]).join('') + '-1c2d-4e5f-8a9b-0c1d2e3f4a5b';

function resolveHost(st, h) {
  if (/^\d+\.\d+\.\d+\.\d+$/.test(h)) return h;
  const lower = h.toLowerCase().replace(/\.tai\.local$/, '');
  return Object.entries(st.remote).find(([, r]) => r.name.toLowerCase() === lower)?.[0] ?? null;
}

// ── Programas nativos (.exe) ────────────────────────────────────────────

const needAdminExe = (msg) => ({ out: '', err: msg, code: 1 });

const natives = {
  whoami: (st) => ok(`${st.domain.toLowerCase()}\\${st.user.toLowerCase()}\n`),
  hostname: (st) => ok(`${st.host}\n`),

  ipconfig: (st, argv) => {
    const all = argv.some((a) => a.toLowerCase() === '/all');
    return ok(lines([
      '',
      'Configuración IP de Windows',
      '',
      ...(all ? [`   Nombre de host. . . . . . . . . : ${st.host}`, `   Sufijo DNS principal  . . . . . : ${st.ad.domain}`, ''] : []),
      'Adaptador de Ethernet Ethernet:',
      '',
      `   Sufijo DNS específico para la conexión. . : ${st.ad.domain}`,
      `   Dirección IPv4. . . . . . . . . . . . . . : ${st.net.ip}`,
      `   Máscara de subred . . . . . . . . . . . . : ${st.net.mask}`,
      `   Puerta de enlace predeterminada . . . . . : ${st.net.gw}`,
      ...(all ? [`   Servidores DNS. . . . . . . . . . . . . . : ${st.net.dns}`, '   DHCP habilitado . . . . . . . . . . . . . : No'] : []),
    ]));
  },

  ping: (st, argv) => {
    const nIdx = argv.findIndex((a) => a.toLowerCase() === '-n');
    const count = nIdx >= 0 ? Number(argv[nIdx + 1]) : 4;
    const host = argv.filter((a, i) => !a.startsWith('-') && i !== nIdx + 1)[0];
    if (!host) return { out: '', err: 'Debe especificarse la dirección IP o el nombre de host.', code: 1 };
    const ip = resolveHost(st, host);
    if (!ip) return { out: `La solicitud de ping no pudo encontrar el host ${host}. Compruebe el nombre y vuelva a intentarlo.\n`, err: '', code: 1 };
    const r = st.remote[ip];
    const out = ['', `Haciendo ping a ${host === ip ? ip : `${host} [${ip}]`} con 32 bytes de datos:`];
    for (let i = 0; i < count; i++) out.push(r ? `Respuesta desde ${ip}: bytes=32 tiempo<1m TTL=127` : 'Tiempo de espera agotado para esta solicitud.');
    out.push('', `Estadísticas de ping para ${ip}:`, `    Paquetes: enviados = ${count}, recibidos = ${r ? count : 0}, perdidos = ${r ? 0 : count}`, `    (${r ? 0 : 100}% perdidos),`);
    return { out: lines(out), err: '', code: r ? 0 : 1 };
  },

  tracert: (st, argv) => {
    const host = argv.find((a) => !a.startsWith('-') && !a.startsWith('/'));
    if (!host) return { out: '', err: 'Uso: tracert [-d] [-h saltos_máximos] nombre_destino', code: 1 };
    const ip = resolveHost(st, host);
    if (!ip) return { out: `No se puede resolver el nombre de sistema de destino ${host}.\n`, err: '', code: 1 };
    const sameNet = ip.split('.').slice(0, 3).join('.') === st.net.ip.split('.').slice(0, 3).join('.');
    const hops = sameNet ? [ip] : [st.net.gw, ip];
    return ok(lines(['', `Traza a ${host === ip ? ip : `${host} [${ip}]`} sobre caminos de 30 saltos como máximo:`, '', ...hops.map((h, i) => `  ${i + 1}    <1 ms    <1 ms    <1 ms  ${h}`), '', 'Traza completa.']));
  },

  netsh: (st, argv) => netsh(st, argv),

  repadmin: (st, argv) => {
    const sub = (argv[0] ?? '').toLowerCase();
    if (!st.server || st.ad.role !== 'dc' && !st.features['RSAT-ADDS'].installed) return { out: '', err: notRecognized(line0(argv, 'repadmin'), 'repadmin'), code: 1 };
    const rep = st.ad.replication;
    rep.ok = replicationOk(st);
    const partners = [...st.ad.dcs];
    const errLine = (dc) => `  ${dc.padEnd(16)} 03h:12m:41s    5 /   5  100  (8524) La operación DSA no puede continuar debido a un error de búsqueda DNS.`;
    const okLine = (dc) => `  ${dc.padEnd(16)}      :00m:46s    0 /   5    0`;
    if (sub === '/replsummary') {
      rep.checkedAfterFix = rep.ok && rep.synced;
      return ok(lines([
        'Hora de inicio del resumen de replicación: 2026-11-10 10:15:02',
        '',
        'Iniciando la recopilación de datos para el resumen de replicación. Esto puede tardar un poco:',
        '  .....',
        '',
        'DSA de origen     delta mayor    con error/total %%  error',
        ...[...partners, st.host].map((d) => (rep.ok ? okLine(d) : errLine(d))),
        '',
        'DSA de destino    delta mayor    con error/total %%  error',
        ...[st.host, ...partners].map((d) => (rep.ok ? okLine(d) : errLine(d))),
        ...(rep.ok ? [] : ['', 'Errores de operación experimentados al intentar recuperar la información de replicación:', '      58 - SRV-DC02.tai.local']),
      ]));
    }
    if (sub === '/showrepl') {
      return ok(lines([
        'Repadmin: ejecutando el comando /showrepl en el controlador de dominio completo localhost',
        `Default-First-Site-Name\\${st.host}`,
        'Opciones de DSA: IS_GC',
        '',
        '==== VECINOS DE ENTRADA ======================================',
        '',
        'DC=tai,DC=local',
        `    Default-First-Site-Name\\${partners[0] ?? 'SRV-DC01'} vía RPC`,
        rep.ok ? '        El último intento @ 2026-11-10 10:15:40 fue correcto.' : '        El último intento @ 2026-11-10 07:02:21 produjo un error, resultado 8524 (0x214c):\n            La operación DSA no puede continuar debido a un error de búsqueda DNS.\n        5 errores consecutivos.',
      ]));
    }
    if (sub === '/syncall') {
      if (!st.elevated) return needAdminExe('repadmin: acceso denegado (ejecuta la consola como administrador).');
      if (st.services.DNS?.status !== 'Running') {
        return { out: lines(['CALLBACK MESSAGE: Error al contactar con el servidor SRV-DC01.tai.local (error de red): 8524 (0x214c):', '    La operación DSA no puede continuar debido a un error de búsqueda DNS.', 'CALLBACK MESSAGE: Se produjo un error durante la sincronización.', '', 'SyncAll terminó con errores.']), err: '', code: 1 };
      }
      rep.synced = true;
      rep.ok = true;
      return ok(lines(['CALLBACK MESSAGE: Se está replicando lo siguiente:', `    De: SRV-DC01.tai.local`, `    A:  ${st.host}.tai.local`, 'CALLBACK MESSAGE: Se completó la siguiente replicación:', `    De: SRV-DC01.tai.local`, `    A:  ${st.host}.tai.local`, 'CALLBACK MESSAGE: SyncAll terminó.', 'SyncAll se completó sin errores.']));
    }
    return ok(lines(['Uso: repadmin <orden> <argumentos> [/u:{dominio\\usuario}] [/pw:{contraseña|*}]', '', '  /replsummary   resumen del estado de replicación entre los DC', '  /showrepl      detalle de la replicación de entrada de este DC', '  /syncall       fuerza la sincronización con los asociados (/AdeP: todas las particiones, empresa, push)', '  /queue         operaciones de replicación pendientes']));
  },

  dcdiag: (st, argv) => {
    if (!st.server || st.ad.role !== 'dc') return { out: '', err: 'Ldap search capability attribute search failed on server localhost, return value = 81\n(dcdiag se ejecuta en un controlador de dominio o con las herramientas RSAT-ADDS.)', code: 1 };
    const quiet = argv.some((a) => a.toLowerCase() === '/q');
    const test = argv.find((a) => /^\/test:/i.test(a))?.slice(6).toLowerCase();
    const dnsBad = st.services.DNS?.status !== 'Running';
    const repBad = !replicationOk(st);
    const results = [
      ['Connectivity', true, ''],
      ['Advertising', !dnsBad, 'Advertencia: SRV-DC02 no anuncia como servidor de hora ni de LDAP: el servicio DNS no está en marcha.'],
      ['Replications', !repBad, `[Replications Check,${st.host}] Error en un intento reciente de replicación:\n            De SRV-DC01 a ${st.host}\n            Contexto de nombres: DC=tai,DC=local\n            La replicación generó el error (8524): La operación DSA no puede continuar debido a un error de búsqueda DNS.`],
      ['Services', !dnsBad, `            DNS Service is stopped on [${st.host}]`],
      ['DNS', !dnsBad, '            El servicio DNS «Servidor DNS» no se está ejecutando en SRV-DC02.\n            Error de la prueba de servidor DNS: el servidor DNS no responde.'],
      ['NetLogons', true, ''],
      ['SysVolCheck', true, ''],
    ].filter(([n]) => !test || n.toLowerCase() === test);
    if (test && !results.length) return { out: '', err: `La prueba «${test}» no es válida. Pruebas: Connectivity, Advertising, Replications, Services, DNS, NetLogons, SysVolCheck.`, code: 1 };
    const out = quiet ? [] : ['', 'Diagnóstico del servidor de directorio', '', 'Ejecutando la configuración inicial:', `   Se ha encontrado el servidor de directorio principal: ${st.host}`, '', 'Realizando pruebas del servidor principal: ' + st.host];
    for (const [n, good, detail] of results) {
      if (quiet && good) continue;
      if (!quiet) out.push(`      Iniciando prueba: ${n}`);
      if (!good) out.push(detail);
      if (!quiet) out.push(`         ......................... ${st.host} ${good ? 'superó' : 'no superó'} la prueba ${n}`);
      else out.push(`         ......................... ${st.host} no superó la prueba ${n}`);
    }
    if (quiet && !out.length) out.push('(dcdiag /q solo muestra los errores: no hay ninguno.)');
    return ok(lines(out));
  },

  netdom: (st, argv) => {
    if (argv.map((a) => a.toLowerCase()).join(' ') !== 'query fsmo') return ok('Uso: netdom query fsmo — muestra qué DC tiene cada uno de los cinco roles FSMO.\n');
    return ok(lines(['Maestro de esquema               SRV-DC01.tai.local', 'Maestro de nombres de dominio     SRV-DC01.tai.local', 'PDC                               SRV-DC01.tai.local', 'Administrador de grupos de RID    SRV-DC01.tai.local', 'Maestro de infraestructura        SRV-DC01.tai.local', 'El comando se completó correctamente.', '(netdom query fsmo dice quién tiene los roles FSMO, no el estado de la replicación.)']));
  },

  nltest: (st, argv) => {
    const a = (argv[0] ?? '').toLowerCase();
    if (a.startsWith('/sc_verify')) return ok(lines(['Flags: b0 HAS_IP  HAS_TIMESERV', `Trusted DC Name \\\\SRV-DC01.${st.ad.domain}`, 'Trusted DC Connection Status Status = 0 0x0 NERR_Success', 'Trust Verification Status = 0 0x0 NERR_Success', 'El comando se completó correctamente', '(nltest /sc_verify comprueba el canal seguro con el dominio, no la replicación entre DC.)']));
    if (a.startsWith('/dclist')) return ok(lines([`Obtener lista de DC en el dominio '${st.ad.domain}' de '\\\\SRV-DC01'.`, `    SRV-DC01.${st.ad.domain} [PDC]  [DS] Sitio: Default-First-Site-Name`, ...(st.ad.role === 'dc' ? [`    ${st.host}.${st.ad.domain}        [DS] Sitio: Default-First-Site-Name`] : []), 'El comando se completó correctamente']));
    return ok('Uso: nltest /sc_verify:dominio | /dclist:dominio\n');
  },

  sfc: (st, argv) => {
    const a = (argv[0] ?? '').toLowerCase();
    if (!['/scannow', '/verifyonly'].includes(a)) {
      return ok(lines(['', 'Microsoft (R) Windows (R) Resource Checker, versión 6.0', '', 'Examina la integridad de todos los archivos protegidos del sistema y reemplaza las versiones incorrectas por las versiones correctas de Microsoft.', '', 'SFC [/SCANNOW] [/VERIFYONLY] [/SCANFILE=<archivo>]', '', '/SCANNOW        Examina la integridad de todos los archivos protegidos del sistema y repara los archivos con problemas cuando es posible.', '/VERIFYONLY     Examina la integridad de todos los archivos protegidos del sistema, sin repararlos.']));
    }
    if (!st.elevated) return { out: 'Debe ser administrador y ejecutar una sesión de consola para poder usar la utilidad sfc.\n', err: '', code: 1 };
    const s = st.sfc;
    const head = ['', 'Iniciando examen del sistema. Este proceso tardará algún tiempo.', '', 'Iniciando la fase de comprobación del examen del sistema.', 'Comprobación 100% completada.', ''];
    s.runs = (s.runs ?? 0) + 1;
    if (!s.corrupt.length) return ok(lines([...head, 'Protección de recursos de Windows no encontró ninguna infracción de integridad.']));
    if (a === '/verifyonly') return ok(lines([...head, 'Protección de recursos de Windows encontró infracciones de integridad.', 'Para obtener más información, consulte CBS.Log en windir\\Logs\\CBS\\CBS.log.']));
    if (s.storeCorrupt) {
      s.failedOnce = true;
      return ok(lines([...head, 'Protección de recursos de Windows encontró archivos dañados, pero no pudo', 'corregir algunos de ellos. Para obtener más información, consulte CBS.Log en', 'windir\\Logs\\CBS\\CBS.log. Por ejemplo, C:\\Windows\\Logs\\CBS\\CBS.log.', '', '(sfc repara con la copia en caché del almacén de componentes, y esa copia también está dañada. Repara antes el almacén con DISM.)']));
    }
    s.corrupt = [];
    s.repaired = true;
    return ok(lines([...head, 'Protección de recursos de Windows encontró archivos dañados y los reparó', 'correctamente. Para obtener más información, consulte CBS.Log en', 'windir\\Logs\\CBS\\CBS.log.']));
  },

  dism: (st, argv) => {
    const a = argv.map((x) => x.toLowerCase());
    if (!st.elevated) return { out: '\nError: 740\n\nSe requieren permisos elevados para ejecutar DISM.\nUse un símbolo del sistema con permisos elevados para completar estas tareas.\n', err: '', code: 740 };
    if (!a.includes('/online') || !a.includes('/cleanup-image')) return ok('\nHerramienta Administración y mantenimiento de imágenes de implementación\nVersión: 10.0.17763.1\n\nUso: DISM /Online /Cleanup-Image {/CheckHealth | /ScanHealth | /RestoreHealth}\n');
    const head = ['', 'Herramienta Administración y mantenimiento de imágenes de implementación', 'Versión: 10.0.17763.1', '', 'Versión de imagen: 10.0.17763.5329', ''];
    const s = st.sfc;
    if (a.includes('/checkhealth') || a.includes('/scanhealth')) {
      return ok(lines([...head, '[==========================100.0%==========================]', s.storeCorrupt ? 'El almacén de componentes se puede reparar.' : 'No se ha detectado ningún daño en el almacén de componentes.', 'La operación se completó correctamente.']));
    }
    if (a.includes('/restorehealth')) {
      s.storeCorrupt = false;
      s.dismDone = true;
      return ok(lines([...head, '[==========================100.0%==========================]', 'La operación de restauración se completó correctamente.', 'La operación se completó correctamente.', '(DISM ha reparado el almacén de componentes desde Windows Update. Ahora sfc /scannow ya puede reparar los ficheros.)']));
    }
    return ok('Uso: DISM /Online /Cleanup-Image {/CheckHealth | /ScanHealth | /RestoreHealth}\n');
  },

  chkdsk: (st, argv) => {
    const fix = argv.some((a) => /^\/[fr]$/i.test(a));
    if (fix && !st.elevated) return { out: 'Acceso denegado porque no tiene privilegios suficientes o el disco puede estar bloqueado por otro proceso.\nTiene que invocar esta utilidad con privilegios elevados.\n', err: '', code: 1 };
    if (fix) return ok('No se puede ejecutar Chkdsk porque otro proceso ya está usando el volumen.\n¿Desea que se prepare este volumen para que sea comprobado\nla próxima vez que se reinicie el sistema? (S/N) S\n\nEste volumen se comprobará la próxima vez que se reinicie el sistema.\n');
    return ok('El tipo del sistema de archivos es NTFS.\n\nFase 1: examinando la estructura básica del sistema de archivos...\nFase 2: examinando la vinculación de nombres de archivos...\nFase 3: examinando los descriptores de seguridad...\n\nWindows examinó el sistema de archivos sin encontrar problemas.\nNo se requieren más acciones.\n');
  },

  gpupdate: () => ok('Actualizando directiva...\n\nLa actualización de la directiva de equipo se completó correctamente.\nLa actualización de la directiva de usuario se completó correctamente.\n'),

  robocopy: (st, argv) => ok(`(robocopy ${argv.join(' ')}: copia robusta de carpetas de cmd; /E incluye subcarpetas, también vacías. En el simulador practica con Copy-Item.)\n`),
  xcopy: (st, argv) => ok(`(xcopy ${argv.join(' ')}: copia de cmd heredada; /E /I incluye subcarpetas. En el simulador practica con Copy-Item.)\n`),
};

const line0 = (argv, name) => [name, ...argv].join(' ');

export const replicationOk = (st) => st.services.DNS?.status === 'Running' && (!st.ad.replication.broken || st.ad.replication.synced);

// netsh advfirewall …
function netsh(st, argv) {
  const a = argv.map((x) => x.toLowerCase());
  const usageAdd = [
    '',
    'Uso: add rule name=<cadena>',
    '      dir=in|out',
    '      action=allow|block|bypass',
    '      [program=<ruta del programa>]',
    '      [service=<nombre corto del servicio>|any]',
    '      [description=<cadena>]',
    '      [enable=yes|no (predeterminado=yes)]',
    '      [profile=public|private|domain|any[,...]]',
    '      [localip=any|<dirección IPv4>|<subred>|<intervalo>]',
    '      [remoteip=any|localsubnet|dns|dhcp|wins|defaultgateway|<dirección IPv4>]',
    '      [localport=0-65535|<intervalo de puertos>[,...]|RPC|RPC-EPMap|any (predeterminado=any)]',
    '      [remoteport=0-65535|<intervalo de puertos>[,...]|any (predeterminado=any)]',
    '      [protocol=0-255|icmpv4|icmpv6|tcp|udp|any (predeterminado=any)]',
    '',
    'Ejemplo:',
    '      netsh advfirewall firewall add rule name="Abrir 80" dir=in action=allow protocol=TCP localport=80',
  ];
  if (a[0] === 'firewall') {
    // El contexto antiguo: funciona, pero está en desuso desde Vista.
    return ok(lines(['', 'IMPORTANTE: el comando se ejecutó correctamente.', 'Sin embargo, "netsh firewall" está en desuso;', 'use "netsh advfirewall firewall" en su lugar.', 'Para obtener más información acerca de cómo usar los comandos de "netsh advfirewall firewall"', 'en lugar de "netsh firewall", vea el artículo 947709 de Knowledge Base', 'en https://go.microsoft.com/fwlink/?linkid=121488 .', '', '(En el simulador no se ha creado ninguna regla: usa netsh advfirewall firewall add rule …)']));
  }
  if (a[0] !== 'advfirewall') return ok('\nComandos disponibles en este contexto (los que se practican aquí):\nadvfirewall    - Cambia al contexto «netsh advfirewall».\nfirewall       - (en desuso) Cambia al contexto «netsh firewall».\n');
  const kv = {};
  for (const x of argv.slice(3)) {
    const m = x.match(/^([\w-]+)=(.*)$/);
    if (m) kv[m[1].toLowerCase()] = m[2];
  }
  if (a[1] === 'show' && /^(allprofiles|currentprofile|domainprofile|privateprofile|publicprofile)$/.test(a[2] ?? '')) {
    const profs = a[2] === 'allprofiles' ? ['Domain', 'Private', 'Public'] : a[2] === 'currentprofile' ? ['Domain'] : [{ domainprofile: 'Domain', privateprofile: 'Private', publicprofile: 'Public' }[a[2]]];
    const name = { Domain: 'Dominio', Private: 'Privado', Public: 'Público' };
    return ok(lines(profs.flatMap((p) => ['', `Configuración de Perfil ${name[p]}:`, '----------------------------------------------------------------------', `Estado                                ${st.firewall.profiles[p] ? 'ACTIVAR' : 'DESACTIVAR'}`, 'Directiva de firewall                 BlockInbound,AllowOutbound']).concat(['', 'Aceptar.'])));
  }
  if (a[1] === 'set' && a[2] && /profiles?$/.test(a[2])) {
    if (!st.elevated) return { out: 'La operación solicitada requiere elevación (Ejecutar como administrador).\n', err: '', code: 1 };
    if (a[3] !== 'state' || !['on', 'off'].includes(a[4])) return ok('Uso: netsh advfirewall set allprofiles state on|off\n');
    for (const p of Object.keys(st.firewall.profiles)) st.firewall.profiles[p] = a[4] === 'on';
    return ok('Aceptar.\n\n');
  }
  if (a[1] === 'firewall') {
    const verb = a[2];
    if (verb === 'show' && a[3] === 'rule') {
      const name = kv.name;
      if (!name) return ok('Uso: show rule name=<cadena>|all [dir=in|out] [verbose]\n');
      const rules = name.toLowerCase() === 'all' ? st.firewall.rules : st.firewall.rules.filter((r) => r.name.toLowerCase() === name.toLowerCase());
      if (!rules.length) return { out: '\nNinguna regla coincide con los criterios especificados.\n\n', err: '', code: 1 };
      return ok(lines(rules.flatMap((r) => ['', `Nombre de regla:                      ${r.name}`, '----------------------------------------------------------------------', `Habilitada:                           ${r.enabled ? 'Sí' : 'No'}`, `Dirección:                            ${r.dir === 'in' ? 'Dentro' : 'Fuera'}`, 'Perfiles:                             Dominio,Privado,Público', 'LocalIP:                              Cualquiera', 'RemoteIP:                             Cualquiera', `Protocolo:                            ${r.protocol}`, `LocalPort:                            ${r.localport === 'Any' ? 'Cualquiera' : r.localport}`, `RemotePort:                           ${(r.remoteport ?? 'Any') === 'Any' ? 'Cualquiera' : r.remoteport}`, `Acción:                               ${r.action === 'allow' ? 'Permitir' : 'Bloquear'}`]).concat(['Aceptar.'])));
    }
    if (verb === 'add' && a[3] === 'rule') {
      if (!st.elevated) return { out: 'La operación solicitada requiere elevación (Ejecutar como administrador).\n', err: '', code: 1 };
      const bad = (param) => ({ out: lines([`Se especificó un valor no válido para el parámetro «${param}».`, '(Revisa la sintaxis de abajo.)', ...usageAdd]), err: '', code: 1 });
      if (!kv.name || !kv.dir || !kv.action) return { out: lines(['Faltan parámetros obligatorios: name, dir y action.', ...usageAdd]), err: '', code: 1 };
      if (!['in', 'out'].includes(kv.dir.toLowerCase())) return bad('dir');
      if (!['allow', 'block', 'bypass'].includes(kv.action.toLowerCase())) return bad('action');
      const protocol = (kv.protocol ?? 'any').toUpperCase();
      if (!['TCP', 'UDP', 'ANY', 'ICMPV4', 'ICMPV6'].includes(protocol) && !/^\d+$/.test(protocol)) return bad('protocol');
      if (kv.localport && !['TCP', 'UDP'].includes(protocol)) return { out: lines(['Los puertos solo se pueden indicar con protocol=TCP o protocol=UDP.', ...usageAdd]), err: '', code: 1 };
      st.firewall.rules.push({ name: kv.name, dir: kv.dir.toLowerCase(), action: kv.action.toLowerCase(), protocol: protocol === 'ANY' ? 'Any' : protocol, localport: kv.localport ?? 'Any', remoteport: kv.remoteport ?? 'Any', enabled: (kv.enable ?? 'yes').toLowerCase() !== 'no', via: 'netsh' });
      return ok('Aceptar.\n\n');
    }
    if (verb === 'delete' && a[3] === 'rule') {
      if (!st.elevated) return { out: 'La operación solicitada requiere elevación (Ejecutar como administrador).\n', err: '', code: 1 };
      const before = st.firewall.rules.length;
      st.firewall.rules = st.firewall.rules.filter((r) => r.name.toLowerCase() !== (kv.name ?? '').toLowerCase());
      const n = before - st.firewall.rules.length;
      return n ? ok(`\n${n} regla(s) eliminada(s).\nAceptar.\n\n`) : { out: '\nNinguna regla coincide con los criterios especificados.\n\n', err: '', code: 1 };
    }
    if (verb === 'set' && a[3] === 'rule') {
      if (!st.elevated) return { out: 'La operación solicitada requiere elevación (Ejecutar como administrador).\n', err: '', code: 1 };
      const rule = st.firewall.rules.find((r) => r.name.toLowerCase() === (kv.name ?? '').toLowerCase());
      if (!rule) return { out: '\nNinguna regla coincide con los criterios especificados.\n(«set rule» modifica una regla que YA existe; para crearla se usa «add rule».)\n\n', err: '', code: 1 };
      const iNew = a.indexOf('new');
      if (iNew < 0) return ok('Uso: set rule name=<cadena> new enable=yes|no | action=allow|block | localport=…\n');
      for (const x of argv.slice(iNew + 1)) {
        const [k, v] = x.split('=');
        if (k.toLowerCase() === 'enable') rule.enabled = v.toLowerCase() !== 'no';
        if (k.toLowerCase() === 'action') rule.action = v.toLowerCase();
        if (k.toLowerCase() === 'localport') rule.localport = v;
      }
      return ok('\n1 regla(s) actualizada(s).\nAceptar.\n\n');
    }
  }
  return ok(`\nEl siguiente comando no se encontró: ${argv.join(' ')}.\n(En el simulador: netsh advfirewall show allprofiles · netsh advfirewall firewall add|show|delete|set rule …)\n`);
}

// ── Autocompletado con Tab ──────────────────────────────────────────────

function complete(st, line) {
  const m = line.match(/^(.*?)(\S*)$/);
  const before = m[1];
  const word = m[2];
  const words = before.trim().split(/\s+/).filter(Boolean);
  let candidates;
  if (!words.length) {
    const all = [...Object.keys(CMDLETS).filter((n) => (!CMDLETS[n].server || st.server) && (!CMDLETS[n].needs || st.features[CMDLETS[n].needs]?.installed)), ...NATIVE];
    candidates = all.filter((c) => c.toLowerCase().startsWith(word.toLowerCase()));
  } else if (word.startsWith('-')) {
    const canonical = CMDLET_BY_LOWER[words[0].toLowerCase()] ?? ALIASES[words[0].toLowerCase()];
    candidates = (CMDLETS[canonical]?.params ?? []).map((p) => '-' + p[0]).filter((p) => p.toLowerCase().startsWith(word.toLowerCase()));
  } else {
    const clean = word.replace(/^["']/, '');
    const slash = Math.max(clean.lastIndexOf('\\'), clean.lastIndexOf('/'));
    const dirPart = slash >= 0 ? clean.slice(0, slash + 1) : '';
    const prefix = clean.slice(slash + 1).toLowerCase();
    const segs = toSegs(st, dirPart || '.');
    const d = segs && nodeAt(st, segs);
    if (d?.type !== 'dir') return null;
    candidates = Object.values(d.children)
      .filter((c) => c.name.toLowerCase().startsWith(prefix))
      .map((c) => {
        const full = dirPart + c.name + (c.type === 'dir' ? '\\' : '');
        return /\s/.test(full) ? `"${full}"` : full;
      });
  }
  if (!candidates.length) return null;
  if (candidates.length === 1) {
    const c = candidates[0];
    return { line: before + c + (c.endsWith('\\') ? '' : ' ') };
  }
  let common = candidates[0];
  for (const c of candidates) while (!c.toLowerCase().startsWith(common.toLowerCase())) common = common.slice(0, -1);
  return common.length > word.length ? { line: before + common } : { options: candidates };
}

export { CMDLETS };

// Para validadores y pruebas: el nodo de una ruta de Windows (o null).
export function psNode(ps, path) {
  const segs = toSegs(ps.state, path);
  return segs ? nodeAt(ps.state, segs) : null;
}
