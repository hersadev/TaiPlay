// Sistema de ficheros virtual de la terminal simulada. Todo vive en memoria:
// un árbol de nodos { type: 'dir', children, mode, owner } y
// { type: 'file', content, mode, owner }. No hay inodos ni enlaces; basta
// para practicar navegación, permisos y redirecciones a nivel de examen.
//
// Las funciones reciben rutas ya absolutas y normalizadas (ver resolve()),
// salvo resolve() mismo, que es quien las calcula a partir del cwd.

export const dir = (children = {}, mode = '755', owner = 'root') => ({
  type: 'dir',
  children,
  mode,
  owner,
});

export const file = (content = '', mode = '644', owner = 'root') => ({
  type: 'file',
  content,
  mode,
  owner,
});

// Copia profunda: cada lección y cada contenedor arrancan con su propia
// copia del árbol de partida, así que modificar uno no ensucia los demás.
export function cloneNode(node) {
  if (node.type === 'file') return { ...node };
  const children = {};
  for (const [name, child] of Object.entries(node.children)) children[name] = cloneNode(child);
  return { ...node, children };
}

// Convierte una ruta (absoluta, relativa, con ~, . o ..) en la lista de
// componentes absolutos. Nunca sube por encima de la raíz, como en Linux.
export function resolve(path, cwd, home) {
  let p = path;
  if (p === '~' || p.startsWith('~/')) p = home + p.slice(1);
  const parts = p.startsWith('/') ? [] : cwd.split('/').filter(Boolean);
  for (const seg of p.split('/')) {
    if (!seg || seg === '.') continue;
    if (seg === '..') parts.pop();
    else parts.push(seg);
  }
  return '/' + parts.join('/');
}

const split = (abs) => abs.split('/').filter(Boolean);

export function getNode(root, abs) {
  let node = root;
  for (const seg of split(abs)) {
    if (node.type !== 'dir') return null;
    node = node.children[seg];
    if (!node) return null;
  }
  return node;
}

export function parentOf(abs) {
  const parts = split(abs);
  const name = parts.pop() ?? '';
  return { parent: '/' + parts.join('/'), name };
}

// Inserta o reemplaza un nodo. Devuelve un error legible si el directorio
// padre no existe o no es un directorio.
export function setNode(root, abs, node) {
  const { parent, name } = parentOf(abs);
  const dirNode = getNode(root, parent);
  if (!dirNode) return 'No existe el fichero o el directorio';
  if (dirNode.type !== 'dir') return 'No es un directorio';
  dirNode.children[name] = node;
  return null;
}

export function removeNode(root, abs) {
  const { parent, name } = parentOf(abs);
  const dirNode = getNode(root, parent);
  if (dirNode?.type === 'dir') delete dirNode.children[name];
}

export const basename = (abs) => split(abs).pop() ?? '/';

// Recorre el árbol en profundidad (para find y para los validadores).
export function walk(node, abs, visit) {
  visit(abs, node);
  if (node.type === 'dir') {
    for (const [name, child] of Object.entries(node.children)) {
      walk(child, abs === '/' ? `/${name}` : `${abs}/${name}`, visit);
    }
  }
}

// "755" -> "rwxr-xr-x"
export function modeString(node) {
  const bits = (d) => {
    const n = Number(d);
    return (n & 4 ? 'r' : '-') + (n & 2 ? 'w' : '-') + (n & 1 ? 'x' : '-');
  };
  const prefix = node.type === 'dir' ? 'd' : '-';
  return prefix + [...node.mode.padStart(3, '0')].map(bits).join('');
}
