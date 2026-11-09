// Cisco IOS simulado: un switch multicapa (tipo Catalyst con IOS 15.x) con
// los modos de la CLI, abreviaturas («conf t», «sh vl br», «sw mo acc»),
// VLAN, puertos de acceso y troncales 802.1Q, SVI con ip helper-address,
// port-security con MAC «sticky» y guardado de la configuración.
//
// Expone la misma interfaz que la shell de Linux (run, prompt, screen,
// history, log) para reutilizar el componente Terminal. Los validadores
// leen el estado: sw.vlans, sw.ifaces, sw.log (con la orden ya expandida en
// canon) y sw.saved().
//
// Sin dependencias del navegador: se prueba con `node --test`.

const PORTS = 24;
const phys = (n) => `GigabitEthernet1/0/${n}`;
export const shortName = (name) => name.replace('GigabitEthernet', 'Gi');

const isIp = (s) => /^\d{1,3}(\.\d{1,3}){3}$/.test(s) && s.split('.').every((o) => Number(o) <= 255);
const isMask = (s) => {
  if (!isIp(s)) return false;
  const bits = s.split('.').map((o) => Number(o).toString(2).padStart(8, '0')).join('');
  return /^1+0*$/.test(bits);
};

// Lista de VLAN como «10,20,30-35» → [10,20,30,…,35]. null si no es válida.
function parseVlanList(s) {
  if (s === 'all') return 'all';
  const out = [];
  for (const part of s.split(',')) {
    const m = part.match(/^(\d+)(?:-(\d+))?$/);
    if (!m) return null;
    const a = Number(m[1]);
    const b = Number(m[2] ?? m[1]);
    if (a < 1 || b > 4094 || a > b) return null;
    for (let v = a; v <= b; v++) out.push(v);
  }
  return out;
}

function compactList(nums) {
  const sorted = [...new Set(nums)].sort((a, b) => a - b);
  const parts = [];
  for (let i = 0; i < sorted.length; i++) {
    let j = i;
    while (sorted[j + 1] === sorted[j] + 1) j++;
    parts.push(j > i ? `${sorted[i]}-${sorted[j]}` : String(sorted[i]));
    i = j;
  }
  return parts.join(',');
}

// Nombre de interfaz escrito por el alumno → nombres canónicos.
// Admite «gi1/0/1», «g 1/0/1», «GigabitEthernet1/0/1», «vlan 10»,
// «range gi1/0/1 - 4» y «range gi1/0/1-4».
export function parseIface(text) {
  const t = text.trim().toLowerCase();
  const range = t.match(/^range\s+([a-z]+)\s*(\d+)\/(\d+)\/(\d+)\s*-\s*(\d+)$/);
  if (range) {
    if (!'gigabitethernet'.startsWith(range[1])) return null;
    const [a, b] = [Number(range[4]), Number(range[5])];
    if (range[2] !== '1' || range[3] !== '0' || a < 1 || b > PORTS || a > b) return null;
    return Array.from({ length: b - a + 1 }, (_, i) => phys(a + i));
  }
  const m = t.match(/^([a-z]+)\s*([\d/]+)$/);
  if (!m) return null;
  if ('gigabitethernet'.startsWith(m[1])) {
    const p = m[2].match(/^1\/0\/(\d+)$/);
    return p && Number(p[1]) >= 1 && Number(p[1]) <= PORTS ? [phys(Number(p[1]))] : null;
  }
  if ('vlan'.startsWith(m[1]) && /^\d+$/.test(m[2]) && Number(m[2]) >= 1 && Number(m[2]) <= 4094) return [`Vlan${Number(m[2])}`];
  return null;
}

const newPort = () => ({
  description: '',
  mode: 'dynamic auto',
  accessVlan: 1,
  shutdown: false,
  nativeVlan: 1,
  allowed: 'all',
  encapsulation: null,
  portfast: false,
  ps: { enabled: false, sticky: false, max: 1, violation: 'shutdown', macs: [] },
});
const newSvi = () => ({ description: '', ip: null, mask: null, helpers: [], shutdown: true });

// ── Gramática ────────────────────────────────────────────────────────────
// Cada orden es una lista de palabras: literales (que se pueden abreviar
// mientras no sean ambiguas) y argumentos <…>. <text> y <iface> se comen el
// resto de la línea.

const ARGS = {
  '<vlan>': (s) => /^\d+$/.test(s) && Number(s) >= 1 && Number(s) <= 4094,
  '<vlans>': (s) => parseVlanList(s) !== null,
  '<num>': (s) => /^\d+$/.test(s) && Number(s) >= 1 && Number(s) <= 132,
  '<ip>': isIp,
  '<mask>': isMask,
  '<word>': (s) => /^[\w.-]+$/.test(s),
};
const REST = new Set(['<text>', '<iface>']);

const HELP = {
  enable: 'Pasa al modo privilegiado (#)',
  disable: 'Vuelve al modo usuario (>)',
  configure: 'Entra en el modo de configuración',
  terminal: 'Configurar desde la terminal',
  show: 'Muestra información',
  copy: 'Copia un fichero o una configuración',
  write: 'Guarda la configuración (write memory)',
  exit: 'Sale del modo actual',
  end: 'Vuelve al modo privilegiado',
  do: 'Ejecuta una orden del modo privilegiado (do show …)',
  hostname: 'Cambia el nombre del equipo',
  vlan: 'Crea o configura una VLAN',
  interface: 'Configura una interfaz',
  no: 'Deshace una orden',
  ip: 'Configuración IP',
  'spanning-tree': 'Configura Spanning Tree',
  name: 'Nombre de la VLAN',
  switchport: 'Configuración del puerto como puerto de switch',
  shutdown: 'Apaga la interfaz',
  description: 'Descripción de la interfaz',
  'running-config': 'Configuración en ejecución (RAM)',
  mode: 'Modo del puerto: access o trunk',
  access: 'Puerto de acceso (una sola VLAN)',
  trunk: 'Puerto troncal 802.1Q (varias VLAN)',
  'port-security': 'Limita qué MAC pueden usar el puerto',
  'mac-address': 'MAC permitidas (sticky: aprenderlas solas)',
  sticky: 'Aprende la MAC y la pasa a la running-config',
  maximum: 'Número máximo de MAC',
  violation: 'Qué hacer si llega una MAC no permitida',
  address: 'Dirección IP y máscara de la interfaz',
  'helper-address': 'Reenvía el DHCP a otro servidor (DHCP relay)',
  routing: 'Activa el enrutamiento entre VLAN',
  brief: 'Resumen en una tabla',
  allowed: 'VLAN permitidas en el troncal',
  native: 'VLAN nativa (sin etiqueta)',
  memory: 'En la NVRAM (startup-config)',
  portfast: 'Pasa a forwarding al momento (solo para equipos finales)',
  'startup-config': 'Configuración de arranque (NVRAM)',
};

const SHOW = [
  ['vlan', 'brief'],
  ['vlan'],
  ['running-config'],
  ['running-config', 'interface', '<iface>'],
  ['startup-config'],
  ['interfaces', 'status'],
  ['interfaces', 'trunk'],
  ['ip', 'interface', 'brief'],
  ['port-security'],
  ['version'],
  ['history'],
];

const SPECS = {
  exec: [['enable'], ['exit'], ...SHOW.map((w) => ['show', ...w])],
  priv: [
    ['configure', 'terminal'],
    ['disable'],
    ['exit'],
    ['copy', 'running-config', 'startup-config'],
    ['write', 'memory'],
    ['write'],
    ...SHOW.map((w) => ['show', ...w]),
  ],
  config: [
    ['hostname', '<word>'],
    ['vlan', '<vlans>'],
    ['no', 'vlan', '<vlans>'],
    ['interface', 'range', '<text>'],
    ['interface', '<iface>'],
    ['ip', 'routing'],
    ['no', 'ip', 'routing'],
    ['spanning-tree', 'mode', 'pvst'],
    ['spanning-tree', 'mode', 'rapid-pvst'],
    ['spanning-tree', 'mode', 'mst'],
    ['end'],
    ['exit'],
    ['do', '<text>'],
  ],
  vlan: [['name', '<word>'], ['no', 'name'], ['end'], ['exit'], ['do', '<text>']],
  port: [
    ['description', '<text>'],
    ['no', 'description'],
    ['switchport', 'mode', 'access'],
    ['switchport', 'mode', 'trunk'],
    ['switchport', 'access', 'vlan', '<vlan>'],
    ['no', 'switchport', 'access', 'vlan'],
    ['switchport', 'trunk', 'encapsulation', 'dot1q'],
    ['switchport', 'trunk', 'native', 'vlan', '<vlan>'],
    ['switchport', 'trunk', 'allowed', 'vlan', '<vlans>'],
    ['switchport', 'trunk', 'allowed', 'vlan', 'add', '<vlans>'],
    ['switchport', 'trunk', 'allowed', 'vlan', 'remove', '<vlans>'],
    ['switchport', 'port-security'],
    ['switchport', 'port-security', 'mac-address', 'sticky'],
    ['switchport', 'port-security', 'maximum', '<num>'],
    ['switchport', 'port-security', 'violation', 'shutdown'],
    ['switchport', 'port-security', 'violation', 'restrict'],
    ['switchport', 'port-security', 'violation', 'protect'],
    ['no', 'switchport', 'port-security'],
    ['no', 'switchport', 'port-security', 'mac-address', 'sticky'],
    ['spanning-tree', 'portfast'],
    ['no', 'spanning-tree', 'portfast'],
    ['ip', 'address', '<ip>', '<mask>'],
    ['shutdown'],
    ['no', 'shutdown'],
    ['end'],
    ['exit'],
    ['do', '<text>'],
  ],
  svi: [
    ['description', '<text>'],
    ['no', 'description'],
    ['ip', 'address', '<ip>', '<mask>'],
    ['no', 'ip', 'address'],
    ['ip', 'helper-address', '<ip>'],
    ['no', 'ip', 'helper-address', '<ip>'],
    ['no', 'ip', 'helper-address'],
    ['shutdown'],
    ['no', 'shutdown'],
    ['end'],
    ['exit'],
    ['do', '<text>'],
  ],
};

// Empareja los tokens con las órdenes del modo. Devuelve
// { spec, args } | { error: 'ambiguous'|'incomplete'|'invalid', at }.
function match(specs, tokens) {
  let alive = specs.map((words) => ({ words, args: [] }));
  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    const low = tok.toLowerCase();
    // Si alguna orden viva tiene aquí un argumento de «resto», se lo come.
    const rest = alive.filter((s) => REST.has(s.words[i]));
    const literals = [...new Set(alive.map((s) => s.words[i]).filter((w) => w && !w.startsWith('<')))];
    const hits = literals.filter((w) => w.startsWith(low));
    const exact = hits.includes(low);
    if (hits.length > 1 && !exact) return { error: 'ambiguous', at: i };
    const next = [];
    for (const s of alive) {
      const w = s.words[i];
      if (!w) continue;
      if (REST.has(w)) continue;
      if (w.startsWith('<')) {
        if (ARGS[w](tok)) next.push({ ...s, args: [...s.args, tok] });
      } else if (exact ? w === low : w.startsWith(low)) next.push(s);
    }
    if (!next.length) {
      if (rest.length) {
        const s = rest[0];
        return { spec: s.words, args: [...s.args, tokens.slice(i).join(' ')] };
      }
      return { error: 'invalid', at: i };
    }
    alive = next;
  }
  const complete = alive.filter((s) => s.words.length === tokens.length);
  if (complete.length) return { spec: complete[0].words, args: complete[0].args };
  return { error: 'incomplete', at: tokens.length };
}

// Palabras posibles en la posición del último token (para Tab y «?»).
function candidates(specs, tokens) {
  const before = tokens.slice(0, -1);
  const word = (tokens[tokens.length - 1] ?? '').toLowerCase();
  let alive = specs;
  for (let i = 0; i < before.length; i++) {
    const low = before[i].toLowerCase();
    alive = alive.filter((w) => w[i] && (w[i].startsWith('<') ? REST.has(w[i]) || ARGS[w[i]](before[i]) : w[i].startsWith(low)));
  }
  const i = before.length;
  return [...new Set(alive.map((w) => w[i]).filter(Boolean))].filter((w) => (w.startsWith('<') ? !word : w.startsWith(word)));
}

// ── El switch ────────────────────────────────────────────────────────────

// setup (opcional):
//   hostname, connected: { 'Gi1/0/1': { description?, mac? } }
//   commands: órdenes previas (no quedan en pantalla ni en el log)
export function createSwitch(setup = {}) {
  const ifaces = {};
  for (let n = 1; n <= PORTS; n++) ifaces[phys(n)] = newPort();
  ifaces.Vlan1 = newSvi();
  const connected = {};
  for (const [k, v] of Object.entries(setup.connected ?? {})) connected[parseIface(k)[0]] = v;

  const sw = {
    kind: 'ios',
    hostname: setup.hostname ?? 'Switch',
    mode: 'exec',
    current: [], // interfaces o VLAN que se están configurando
    vlans: { 1: { name: 'default' } },
    ifaces,
    connected,
    ipRouting: false,
    stp: 'pvst',
    startup: '',
    history: [],
    log: [],
    screen: [],
    get title() {
      return `${this.hostname} — consola (Cisco IOS simulado)`;
    },
    prompt() {
      const suffix = { exec: '>', priv: '#', config: '(config)#', vlan: '(config-vlan)#' }[this.mode];
      if (suffix) return this.hostname + suffix;
      return `${this.hostname}(config-if${this.current.length > 1 ? '-range' : ''})#`;
    },
    run(line) {
      return runLine(this, line);
    },
    complete(line) {
      return completeLine(this, line);
    },
    runningConfig() {
      return runningConfig(this);
    },
    saved() {
      return this.startup === configBody(this);
    },
  };
  sw.startup = configBody(sw);
  if (setup.commands?.length) {
    sw.mode = 'priv';
    for (const l of setup.commands) runLine(sw, l);
    sw.mode = 'exec';
    sw.current = [];
    if (setup.saveSetup !== false) sw.startup = configBody(sw);
  }
  sw.screen = [];
  sw.history = [];
  sw.log = [];
  return sw;
}

const modeSpecs = (sw) => {
  if (sw.mode === 'if') return sw.current[0].startsWith('Vlan') ? SPECS.svi : SPECS.port;
  return SPECS[sw.mode];
};

function runLine(sw, rawLine) {
  const prompt = sw.prompt();
  sw.screen.push({ kind: 'cmd', prompt, text: rawLine });
  const line = rawLine.trim();
  if (!line) return { ok: true };
  sw.history.push(line);
  const entry = { line, mode: sw.mode, ok: false, canon: null, out: '' };
  sw.log.push(entry);
  const say = (text) => {
    entry.out += text + '\n';
    sw.screen.push({ kind: 'out', text });
  };
  const err = (text) => {
    entry.out += text + '\n';
    sw.screen.push({ kind: 'err', text });
  };

  if (line.endsWith('?')) {
    entry.ok = true;
    const tokens = line.slice(0, -1).trim().split(/\s+/).filter(Boolean);
    const trailing = /\s\?$/.test(line) || line === '?';
    const opts = candidates(modeSpecs(sw), trailing ? [...tokens, ''] : tokens);
    if (!opts.length) err('% Unrecognized command');
    else say(opts.map((o) => `  ${o.padEnd(18)}${HELP[o] ?? ''}`).join('\n'));
    return entry;
  }

  const tokens = line.split(/\s+/);
  let result = execute(sw, tokens, say, err);
  // En los submodos también valen las órdenes globales (interface, vlan…),
  // que cambian de submodo directamente, como en IOS.
  if (result.error && ['if', 'vlan'].includes(sw.mode)) {
    const global = match(SPECS.config, tokens);
    if (!global.error) result = apply(sw, global, say, err, 'config');
  }
  if (result.error) {
    const msg = {
      ambiguous: `% Ambiguous command:  "${line}"`,
      incomplete: '% Incomplete command.',
      invalid: "% Invalid input detected at '^' marker.",
    }[result.error];
    if (result.error === 'invalid') {
      // El circunflejo apunta a la palabra que no se entiende.
      let col = rawLine.length - rawLine.trimStart().length;
      for (let i = 0; i < result.at; i++) col = rawLine.indexOf(tokens[i], col) + tokens[i].length;
      col = rawLine.indexOf(tokens[result.at], col);
      err(' '.repeat(prompt.length + 1 + Math.max(0, col)) + '^');
    }
    err(msg + (result.hint ? `\n${result.hint}` : ''));
    return entry;
  }
  entry.ok = !result.rejected;
  entry.canon = result.canon;
  return entry;
}

function execute(sw, tokens, say, err) {
  const m = match(modeSpecs(sw), tokens);
  if (m.error) {
    const hint = hintFor(sw, tokens);
    return { ...m, hint };
  }
  return apply(sw, m, say, err, sw.mode);
}

// Pistas para los errores típicos de quien empieza.
function hintFor(sw, tokens) {
  const first = tokens[0].toLowerCase();
  const inConfig = ['config', 'if', 'vlan'].includes(sw.mode);
  if (sw.mode === 'exec' && ['configure', 'conf', 'config', 'write', 'wr', 'copy'].includes(first)) return '(Estás en modo usuario «>». Escribe «enable» para pasar al privilegiado «#».)';
  if (sw.mode === 'priv' && ['vlan', 'interface', 'int', 'hostname', 'switchport'].includes(first)) return '(Eso se configura en el modo de configuración: escribe «configure terminal».)';
  if (inConfig && ['show', 'sh', 'write', 'wr', 'copy'].includes(first)) return '(En modo configuración, antepón «do»: do show vlan brief.)';
  if (sw.mode === 'config' && ['switchport', 'sw', 'ip', 'shutdown', 'no'].includes(first) && tokens.length > 1 && /^(sw|switchport|shut|shutdown)/.test(tokens[first === 'no' ? 1 : 0]))
    return '(Eso va dentro de una interfaz: primero «interface gi1/0/…».)';
  if (sw.mode === 'if' && !sw.current[0].startsWith('Vlan') && first.startsWith('ip') && tokens[1]?.startsWith('h')) return '(ip helper-address se configura en la SVI de la VLAN: interface vlan 10.)';
  return null;
}

function apply(sw, { spec, args }, say, err, fromMode) {
  const values = [...args];
  let k = 0;
  const canon = spec.map((w) => (w.startsWith('<') ? values[k++] : w)).join(' ');
  const key = spec.filter((w) => !w.startsWith('<')).join(' ');
  const restArg = REST.has(spec[spec.length - 1]) ? values[values.length - 1] : null;
  const r = { canon };
  const toConfig = () => {
    sw.mode = 'config';
    sw.current = [];
  };

  if (key.startsWith('show')) {
    say(show(sw, spec.slice(1), restArg));
    return r;
  }

  switch (`${fromMode}:${key}`) {
    case 'exec:enable':
      sw.mode = 'priv';
      return r;
    case 'exec:exit':
      say(`\n${sw.hostname} con0 is now available\n\nPress RETURN to get started.`);
      return r;
    case 'priv:disable':
      sw.mode = 'exec';
      return r;
    case 'priv:exit':
      sw.mode = 'exec';
      say(`\n${sw.hostname} con0 is now available\n\nPress RETURN to get started.`);
      return r;
    case 'priv:configure terminal':
      sw.mode = 'config';
      say('Enter configuration commands, one per line.  End with CNTL/Z.');
      return r;
    case 'priv:copy running-config startup-config':
      sw.startup = configBody(sw);
      say('Destination filename [startup-config]? \nBuilding configuration...\n[OK]');
      return r;
    case 'priv:write':
    case 'priv:write memory':
      sw.startup = configBody(sw);
      say('Building configuration...\n[OK]');
      return r;
  }

  // Órdenes de configuración (global y submodos).
  if (key === 'end') {
    sw.mode = 'priv';
    sw.current = [];
    say('%SYS-5-CONFIG_I: Configured from console by console');
    return r;
  }
  if (key === 'exit') {
    if (sw.mode === 'config') sw.mode = 'priv';
    else toConfig();
    return r;
  }
  if (key === 'do') {
    const inner = restArg.split(/\s+/);
    const m = match(SPECS.priv, inner);
    if (m.error || !/^(show|copy|write)/.test(m.spec[0])) return { error: m.error ?? 'invalid', at: 1 };
    return { canon: `do ${apply(sw, m, say, err, 'priv').canon}` };
  }

  // Globales
  switch (key) {
    case 'hostname':
      sw.hostname = values[0];
      toConfig();
      return r;
    case 'vlan': {
      const ids = parseVlanList(values[0]);
      for (const id of ids) if (!sw.vlans[id]) sw.vlans[id] = { name: `VLAN${String(id).padStart(4, '0')}` };
      sw.mode = 'vlan';
      sw.current = ids.map(String);
      return r;
    }
    case 'no vlan': {
      const ids = parseVlanList(values[0]);
      if (ids.includes(1)) {
        err('%Default VLAN 1 may not be deleted.');
        return { ...r, rejected: true };
      }
      for (const id of ids) delete sw.vlans[id];
      toConfig();
      return r;
    }
    case 'interface':
    case 'interface range': {
      const names = parseIface(key === 'interface range' ? `range ${restArg}` : restArg);
      if (!names) {
        const looksFast = /^f/i.test(restArg);
        return { error: 'invalid', at: 1, hint: looksFast ? '(Este switch tiene puertos GigabitEthernet1/0/1 a 1/0/24: interface gi1/0/1.)' : '(Interfaces: gi1/0/1 … gi1/0/24, vlan N, o range gi1/0/1 - 4.)' };
      }
      for (const n of names) {
        if (n.startsWith('Vlan') && !sw.ifaces[n]) {
          sw.ifaces[n] = newSvi();
        }
      }
      sw.mode = 'if';
      sw.current = names;
      return { canon: `interface ${names.length > 1 ? `range ${shortName(names[0])} - ${names[names.length - 1].split('/').pop()}` : names[0]}` };
    }
    case 'ip routing':
      sw.ipRouting = true;
      toConfig();
      return r;
    case 'no ip routing':
      sw.ipRouting = false;
      toConfig();
      return r;
    case 'spanning-tree mode pvst':
    case 'spanning-tree mode rapid-pvst':
    case 'spanning-tree mode mst':
      sw.stp = spec[2];
      toConfig();
      return r;
  }

  // Submodo VLAN
  if (sw.mode === 'vlan') {
    for (const id of sw.current) {
      if (key === 'name') sw.vlans[id].name = values[0];
      if (key === 'no name') sw.vlans[id].name = `VLAN${String(id).padStart(4, '0')}`;
    }
    return r;
  }

  // Submodo interfaz
  for (const name of sw.current) {
    const res = applyIface(sw, name, key, values, restArg, say, err);
    if (res?.error) return res;
    if (res?.rejected) return { ...r, rejected: true };
  }
  return r;
}

function applyIface(sw, name, key, values, restArg, say, err) {
  const i = sw.ifaces[name];
  const svi = name.startsWith('Vlan');
  switch (key) {
    case 'description':
      i.description = restArg;
      return null;
    case 'no description':
      i.description = '';
      return null;
    case 'shutdown':
      if (!i.shutdown) {
        i.shutdown = true;
        say(`%LINK-5-CHANGED: Interface ${name}, changed state to administratively down`);
      }
      return null;
    case 'no shutdown':
      if (i.shutdown) {
        i.shutdown = false;
        const up = svi ? sviUp(sw, name) : Boolean(sw.connected[name]);
        say(`%LINK-5-CHANGED: Interface ${name}, changed state to ${up || !svi ? 'up' : 'down'}`);
        if (up) say(`%LINEPROTO-5-UPDOWN: Line protocol on Interface ${name}, changed state to up`);
      }
      return null;
  }
  if (svi) {
    switch (key) {
      case 'ip address': {
        const [ip, mask] = values;
        i.ip = ip;
        i.mask = mask;
        return null;
      }
      case 'no ip address':
        i.ip = null;
        i.mask = null;
        return null;
      case 'ip helper-address':
        if (!i.helpers.includes(values[0])) i.helpers.push(values[0]);
        return null;
      case 'no ip helper-address':
        i.helpers = values[0] ? i.helpers.filter((h) => h !== values[0]) : [];
        return null;
    }
    return { error: 'invalid', at: 0 };
  }
  switch (key) {
    case 'ip address':
      err(`% Invalid input: ${name} es un puerto de switch (capa 2). La IP de una VLAN va en su SVI: interface vlan N.`);
      return { rejected: true };
    case 'switchport mode access':
      i.mode = 'access';
      return null;
    case 'switchport mode trunk':
      i.mode = 'trunk';
      if (i.ps.enabled) {
        err(`Command rejected: ${name} is not an access port.`);
        i.mode = 'access';
        return { rejected: true };
      }
      return null;
    case 'switchport access vlan': {
      const v = Number(values[0]);
      if (!sw.vlans[v]) {
        say(`% Access VLAN does not exist. Creating vlan ${v}`);
        sw.vlans[v] = { name: `VLAN${String(v).padStart(4, '0')}` };
      }
      i.accessVlan = v;
      return null;
    }
    case 'no switchport access vlan':
      i.accessVlan = 1;
      return null;
    case 'switchport trunk encapsulation dot1q':
      i.encapsulation = 'dot1q';
      return null;
    case 'switchport trunk native vlan':
      i.nativeVlan = Number(values[0]);
      return null;
    case 'switchport trunk allowed vlan': {
      const l = parseVlanList(values[0]);
      i.allowed = l === 'all' ? 'all' : l;
      return null;
    }
    case 'switchport trunk allowed vlan add':
    case 'switchport trunk allowed vlan remove': {
      const l = parseVlanList(values[0]);
      const cur = i.allowed === 'all' ? Array.from({ length: 4094 }, (_, k) => k + 1) : i.allowed;
      const all = l === 'all' ? Array.from({ length: 4094 }, (_, k) => k + 1) : l;
      i.allowed = key.endsWith('add') ? [...new Set([...cur, ...all])].sort((a, b) => a - b) : cur.filter((v) => !all.includes(v));
      return null;
    }
    case 'switchport port-security':
    case 'switchport port-security mac-address sticky':
    case 'switchport port-security maximum':
    case 'switchport port-security violation shutdown':
    case 'switchport port-security violation restrict':
    case 'switchport port-security violation protect': {
      if (i.mode !== 'access') {
        err(`Command rejected: ${name} is a dynamic port.\n(port-security solo se puede activar en puertos de acceso: primero «switchport mode access».)`);
        return { rejected: true };
      }
      if (key === 'switchport port-security') i.ps.enabled = true;
      else if (key.endsWith('sticky')) i.ps.sticky = true;
      else if (key.endsWith('maximum')) i.ps.max = Number(values[0]);
      else i.ps.violation = key.split(' ').pop();
      learnSticky(sw, name);
      return null;
    }
    case 'no switchport port-security':
      i.ps.enabled = false;
      return null;
    case 'no switchport port-security mac-address sticky':
      i.ps.sticky = false;
      i.ps.macs = [];
      return null;
    case 'spanning-tree portfast':
      i.portfast = true;
      if (i.mode !== 'trunk') say(`%Warning: portfast should only be enabled on ports connected to a single\n host. Connecting hubs, concentrators, switches, bridges, etc... to this\n interface  when portfast is enabled, can cause temporary bridging loops.\n Use with CAUTION\n\n%Portfast has been configured on ${name} but will only\n have effect when the interface is in a non-trunking mode.`);
      return null;
    case 'no spanning-tree portfast':
      i.portfast = false;
      return null;
  }
  return { error: 'invalid', at: 0 };
}

// Con sticky activado, la MAC del equipo conectado se aprende y pasa a la
// running-config.
function learnSticky(sw, name) {
  const i = sw.ifaces[name];
  const dev = sw.connected[name];
  if (i.ps.enabled && i.ps.sticky && dev?.mac && !i.ps.macs.includes(dev.mac) && !i.shutdown) {
    i.ps.macs = [...i.ps.macs, dev.mac].slice(0, i.ps.max);
  }
}

const portVlan = (i) => (i.mode === 'trunk' ? 'trunk' : i.accessVlan);
const portUp = (sw, name) => Boolean(sw.connected[name]) && !sw.ifaces[name].shutdown;

// Una SVI está up/up si la VLAN existe y algún puerto activo la lleva.
function sviUp(sw, name) {
  const v = Number(name.slice(4));
  if (!sw.vlans[v]) return false;
  return Object.entries(sw.ifaces).some(
    ([n, i]) => !n.startsWith('Vlan') && portUp(sw, n) && (i.mode === 'trunk' ? i.allowed === 'all' || i.allowed.includes(v) : i.accessVlan === v),
  );
}

// ── Configuración ────────────────────────────────────────────────────────

function ifaceBlock(sw, name) {
  const i = sw.ifaces[name];
  const lines = [`interface ${name}`];
  if (i.description) lines.push(` description ${i.description}`);
  if (name.startsWith('Vlan')) {
    lines.push(i.ip ? ` ip address ${i.ip} ${i.mask}` : ' no ip address');
    for (const h of i.helpers) lines.push(` ip helper-address ${h}`);
  } else {
    if (i.encapsulation) lines.push(' switchport trunk encapsulation dot1q');
    if (i.nativeVlan !== 1) lines.push(` switchport trunk native vlan ${i.nativeVlan}`);
    if (i.allowed !== 'all') lines.push(` switchport trunk allowed vlan ${i.allowed.length ? compactList(i.allowed) : 'none'}`);
    if (i.accessVlan !== 1) lines.push(` switchport access vlan ${i.accessVlan}`);
    if (i.mode !== 'dynamic auto') lines.push(` switchport mode ${i.mode}`);
    if (i.ps.max !== 1) lines.push(` switchport port-security maximum ${i.ps.max}`);
    if (i.ps.violation !== 'shutdown') lines.push(` switchport port-security violation ${i.ps.violation}`);
    if (i.ps.enabled) lines.push(' switchport port-security');
    if (i.ps.sticky) lines.push(' switchport port-security mac-address sticky');
    for (const mac of i.ps.macs) lines.push(` switchport port-security mac-address sticky ${mac}`);
    if (i.portfast) lines.push(' spanning-tree portfast');
  }
  if (i.shutdown) lines.push(' shutdown');
  return lines;
}

// Cuerpo de la configuración (lo que se compara para saber si está guardada).
// Las VLAN no aparecen: en IOS viven en vlan.dat y se guardan solas.
function configBody(sw) {
  const ifNames = Object.keys(sw.ifaces).sort((a, b) => {
    const va = a.startsWith('Vlan');
    const vb = b.startsWith('Vlan');
    if (va !== vb) return va ? 1 : -1;
    return Number(a.split(/[/n]/).pop()) - Number(b.split(/[/n]/).pop());
  });
  const lines = ['version 15.2', 'service timestamps log datetime msec', '!', `hostname ${sw.hostname}`, '!'];
  if (sw.ipRouting) lines.push('ip routing', '!');
  lines.push(`spanning-tree mode ${sw.stp}`, '!');
  for (const n of ifNames) lines.push(...ifaceBlock(sw, n), '!');
  lines.push('line con 0', 'line vty 0 4', ' login', '!', 'end');
  return lines.join('\n');
}

function runningConfig(sw) {
  const body = configBody(sw);
  return `Building configuration...\n\nCurrent configuration : ${body.length} bytes\n!\n${body}`;
}

// ── show ─────────────────────────────────────────────────────────────────

function show(sw, words, restArg) {
  const what = words.filter((w) => !w.startsWith('<')).join(' ');
  switch (what) {
    case 'vlan brief':
    case 'vlan': {
      const rows = [
        'VLAN Name                             Status    Ports',
        '---- -------------------------------- --------- -------------------------------',
      ];
      for (const id of Object.keys(sw.vlans).map(Number).sort((a, b) => a - b)) {
        const ports = Object.entries(sw.ifaces)
          .filter(([n, i]) => !n.startsWith('Vlan') && i.mode !== 'trunk' && i.accessVlan === id)
          .map(([n]) => shortName(n));
        const chunks = [];
        for (let k = 0; k < ports.length; k += 4) chunks.push(ports.slice(k, k + 4).join(', '));
        const head = `${String(id).padEnd(5)}${sw.vlans[id].name.padEnd(33)}active    `;
        rows.push(head + (chunks[0] ?? ''));
        for (const c of chunks.slice(1)) rows.push(' '.repeat(head.length) + c);
      }
      rows.push('1002 fddi-default                     act/unsup', '1003 token-ring-default               act/unsup', '1004 fddinet-default                  act/unsup', '1005 trnet-default                    act/unsup');
      return rows.join('\n');
    }
    case 'running-config':
      return runningConfig(sw);
    case 'running-config interface': {
      const names = parseIface(restArg);
      if (!names || names.length > 1 || !sw.ifaces[names[0]]) return '% Interfaz no válida';
      const body = ifaceBlock(sw, names[0]).join('\n');
      return `Building configuration...\n\nCurrent configuration : ${body.length} bytes\n!\n${body}\nend`;
    }
    case 'startup-config':
      return sw.startup ? `Using ${sw.startup.length} out of 524288 bytes\n!\n${sw.startup}` : 'startup-config is not present';
    case 'interfaces status': {
      const rows = ['Port      Name               Status       Vlan       Duplex  Speed Type'];
      for (let n = 1; n <= PORTS; n++) {
        const name = phys(n);
        const i = sw.ifaces[name];
        const status = i.ps.enabled && i.shutdown ? 'err-disabled' : i.shutdown ? 'disabled' : sw.connected[name] ? 'connected' : 'notconnect';
        const up = status === 'connected';
        rows.push(
          `${shortName(name).padEnd(10)}${(i.description || sw.connected[name]?.description || '').slice(0, 18).padEnd(19)}${status.padEnd(13)}${String(portVlan(i)).padEnd(11)}${(up ? 'a-full' : 'auto').padEnd(8)}${(up ? 'a-1000' : 'auto').padEnd(6)}10/100/1000BaseTX`,
        );
      }
      return rows.join('\n');
    }
    case 'interfaces trunk': {
      const trunks = Object.entries(sw.ifaces).filter(([n, i]) => !n.startsWith('Vlan') && i.mode === 'trunk' && portUp(sw, n));
      if (!trunks.length) return '(No hay ningún puerto en modo troncal activo.)';
      const rows = ['Port        Mode         Encapsulation  Status        Native vlan'];
      for (const [n, i] of trunks) rows.push(`${shortName(n).padEnd(12)}${'on'.padEnd(13)}${'802.1q'.padEnd(15)}${'trunking'.padEnd(14)}${i.nativeVlan}`);
      rows.push('', 'Port        Vlans allowed on trunk');
      for (const [n, i] of trunks) rows.push(`${shortName(n).padEnd(12)}${i.allowed === 'all' ? '1-4094' : compactList(i.allowed) || 'none'}`);
      return rows.join('\n');
    }
    case 'ip interface brief': {
      const rows = ['Interface              IP-Address      OK? Method Status                Protocol'];
      const names = Object.keys(sw.ifaces).sort((a, b) => (a.startsWith('Vlan') === b.startsWith('Vlan') ? 0 : a.startsWith('Vlan') ? -1 : 1));
      for (const n of names) {
        const i = sw.ifaces[n];
        const svi = n.startsWith('Vlan');
        const up = svi ? !i.shutdown && sviUp(sw, n) : portUp(sw, n);
        const status = i.shutdown ? 'administratively down' : up ? 'up' : 'down';
        rows.push(`${n.padEnd(23)}${(i.ip ?? 'unassigned').padEnd(16)}YES ${(i.ip ? 'manual' : 'unset').padEnd(7)}${status.padEnd(22)}${up ? 'up' : 'down'}`);
      }
      return rows.join('\n');
    }
    case 'port-security': {
      const rows = [
        'Secure Port  MaxSecureAddr  CurrentAddr  SecurityViolation  Security Action',
        '                (Count)       (Count)          (Count)',
        '---------------------------------------------------------------------------',
      ];
      for (const [n, i] of Object.entries(sw.ifaces)) {
        if (n.startsWith('Vlan') || !i.ps.enabled) continue;
        rows.push(`${shortName(n).padStart(12)}${String(i.ps.max).padStart(15)}${String(i.ps.macs.length).padStart(13)}${'0'.padStart(19)}${(i.ps.violation[0].toUpperCase() + i.ps.violation.slice(1)).padStart(16)}`);
      }
      rows.push('---------------------------------------------------------------------------');
      return rows.join('\n');
    }
    case 'version':
      return `Cisco IOS Software, C3560 Software (C3560-IPSERVICESK9-M), Version 15.2(4)E10\n${sw.hostname} uptime is 2 days, 4 hours, 12 minutes\n${PORTS} Gigabit Ethernet interfaces\n(Simulador de TaiPlay: solo admite un subconjunto de IOS.)`;
    case 'history':
      return sw.history.map((h) => `  ${h}`).join('\n');
  }
  return '% Invalid input';
}

// ── Tab ──────────────────────────────────────────────────────────────────

function completeLine(sw, line) {
  const m = line.match(/^(.*?)(\S*)$/);
  const before = m[1];
  const tokens = [...before.trim().split(/\s+/).filter(Boolean), m[2]];
  let opts = candidates(modeSpecs(sw), tokens).filter((w) => !w.startsWith('<'));
  if (!opts.length && ['if', 'vlan'].includes(sw.mode)) opts = candidates(SPECS.config, tokens).filter((w) => !w.startsWith('<'));
  if (!opts.length) return null;
  if (opts.length === 1) return { line: before + opts[0] + ' ' };
  let common = opts[0];
  for (const c of opts) while (!c.startsWith(common)) common = common.slice(0, -1);
  return common.length > m[2].length ? { line: before + common } : { options: opts };
}
