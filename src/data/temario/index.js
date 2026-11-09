// Temario oficial del TAI (ingreso libre), organizado en 4 bloques y 33
// temas. Cada tema lleva una ficha de repaso propia, un test corto y las
// lecciones de TaiPlay relacionadas; sus preguntas reales se enlazan por el
// campo `tema` de cada pregunta del banco.
import { bloque1 } from './bloque1.js';
import { bloque2 } from './bloque2.js';
import { bloque3 } from './bloque3.js';
import { bloque4 } from './bloque4.js';

export const BLOQUES = [
  { n: 1, roman: 'I', title: 'Organización del Estado y Administración electrónica', temas: bloque1 },
  { n: 2, roman: 'II', title: 'Tecnología básica', temas: bloque2 },
  { n: 3, roman: 'III', title: 'Desarrollo de sistemas', temas: bloque3 },
  { n: 4, roman: 'IV', title: 'Sistemas y comunicaciones', temas: bloque4 },
];

export const TEMAS = BLOQUES.flatMap((b) =>
  b.temas.map((t) => ({ lessons: [], ...t, bloque: b.n, roman: b.roman, n: Number(t.id.slice(3)) })),
);

const byId = new Map(TEMAS.map((t) => [t.id, t]));
export const findTema = (id) => byId.get(id) ?? null;

// «B4T07» → «Bloque IV · Tema 7»
export const temaLabel = (id) => {
  const t = findTema(id);
  return t ? `Bloque ${t.roman} · Tema ${t.n}` : id;
};
