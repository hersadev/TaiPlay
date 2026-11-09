// Validadores reutilizables de las lecciones de terminal. Cada uno devuelve
// una función (sh) => boolean que se evalúa tras cada orden. Se valida el
// ESTADO de la máquina simulada (ficheros, servicios, contenedores) y, cuando
// lo importante es haber usado una orden concreta, el historial (sh.log).

import { getNode } from '../engine/terminal/vfs.js';

const node = (sh, path) => getNode(sh.hostCtx.fs, path);

// Alguna línea ejecutada con éxito encaja con la expresión regular.
// Se ignora el «sudo » inicial para no castigar a quien lo pone de más.
export const ran = (re, { ok = true } = {}) => (sh) =>
  sh.log.some((e) => (!ok || e.code === 0) && re.test(e.line.replace(/^sudo\s+/, '')));

// Alguna orden ejecutada (en cualquier punto de una tubería) cumple el
// predicado sobre su argv ya expandido.
export const ranCmd = (name, pred = () => true) => (sh) =>
  sh.log.some((e) => e.cmds.some((argv) => {
    const a = argv[0] === 'sudo' ? argv.slice(1) : argv;
    return a[0] === name && pred(a);
  }));

export const outputMatches = (re) => (sh) => sh.log.some((e) => re.test(e.out));

export const cwdIs = (path) => (sh) => sh.hostCtx.cwd === path;

// Estuvo en ese directorio en algún momento (aunque luego se haya movido).
export const visited = (path) => (sh) => sh.log.some((e) => e.cwd === path);

export const exists = (path, type) => (sh) => {
  const n = node(sh, path);
  return Boolean(n) && (!type || n.type === type);
};

export const missing = (path) => (sh) => !node(sh, path);

export const fileContains = (path, text) => (sh) => {
  const n = node(sh, path);
  if (n?.type !== 'file') return false;
  return text instanceof RegExp ? text.test(n.content) : n.content.includes(text);
};

export const fileLines = (path, min) => (sh) => {
  const n = node(sh, path);
  return n?.type === 'file' && n.content.split('\n').filter(Boolean).length >= min;
};

export const modeIs = (path, pred) => (sh) => {
  const n = node(sh, path);
  return Boolean(n) && (typeof pred === 'string' ? n.mode === pred : pred(n.mode));
};

export const serviceIs = (name, { active, enabled } = {}) => (sh) => {
  const s = sh.services[name];
  if (!s) return false;
  return (active === undefined || s.active === active) && (enabled === undefined || s.enabled === enabled);
};

export const imageExists = (name) => (sh) => sh.docker.images.some((i) => i.name === name);
export const imageMissing = (name) => (sh) => !sh.docker.images.some((i) => i.name === name);

const matchContainer = (c, { name, image, port, status }) =>
  (!name || c.name === name) &&
  (!image || c.image.split(':')[0] === image) &&
  (!port || c.ports.some((p) => p.host === port)) &&
  (!status || c.status === status);

export const containerExists = (filter) => (sh) => sh.docker.containers.some((c) => matchContainer(c, filter));
export const noContainer = (filter) => (sh) => !sh.docker.containers.some((c) => matchContainer(c, filter));

export const containerFileContains = (name, path, text) => (sh) => {
  const c = sh.docker.containers.find((x) => x.name === name);
  const n = c && getNode(c.fs, path);
  return n?.type === 'file' && n.content.includes(text);
};

// Ha ejecutado alguna orden desde dentro de un contenedor.
export const wasInsideContainer = (sh) => sh.log.some((e) => e.inContainer);
export const backOnHost = (sh) => !sh.ctx.container;

export const all = (...fns) => (sh) => fns.every((f) => f(sh));
export const any = (...fns) => (sh) => fns.some((f) => f(sh));
