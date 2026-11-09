// Ejercicios de permisos de Linux: pasar de rwx a octal y al revés, y
// calcular qué permisos deja una umask.

import { int, pick } from './random.js';

const RWX = (d) => (d & 4 ? 'r' : '-') + (d & 2 ? 'w' : '-') + (d & 1 ? 'x' : '-');
export const toSymbolic = (octal) => [...octal].map((d) => RWX(Number(d))).join('');

// Modos que tienen sentido en un servidor (y algunos que no, para pensar).
const COMMON = ['755', '644', '600', '700', '750', '640', '775', '664', '444', '400', '711', '751', '660', '777', '555', '754', '740', '705'];
const randomMode = (rng) => (rng() < 0.7 ? pick(rng, COMMON) : [int(rng, 4, 7), int(rng, 0, 7), int(rng, 0, 7)].join(''));

const WHO = ['el propietario', 'el grupo', 'el resto (otros)'];
const breakdown = (octal) =>
  [...octal]
    .map((d, i) => {
      const n = Number(d);
      const parts = [n & 4 && 'r=4', n & 2 && 'w=2', n & 1 && 'x=1'].filter(Boolean);
      return `${WHO[i]}: ${RWX(n)} → ${parts.length ? parts.join(' + ') : 'nada'} = ${n}`;
    })
    .join('; ');

const normOctal = (raw) => {
  const s = raw.trim().replace(/^0(?=\d{3}$)/, '');
  return /^[0-7]{3}$/.test(s) ? s : null;
};
const normSymbolic = (raw) => {
  let s = raw.trim();
  if (s.length === 10 && '-d'.includes(s[0])) s = s.slice(1);
  return /^([-r][-w][-x]){3}$/.test(s) ? s : null;
};

export const PERM_FIELD_TYPES = { octal: normOctal, symbolic: normSymbolic };

export const PERM_KINDS = {
  octal: {
    label: 'rwx → octal',
    make(rng) {
      const m = randomMode(rng);
      return {
        prompt: `\`ls -l\` muestra **-${toSymbolic(m)}**. ¿Qué modo octal pondrías en \`chmod\`?`,
        fields: [{ key: 'octal', label: 'Modo octal', type: 'octal', answer: m, placeholder: '644' }],
        explain: `Se quita el primer carácter (el tipo: - fichero, d directorio) y se suman r=4, w=2, x=1 en cada trío. ${breakdown(m)}. Resultado: **${m}**.`,
      };
    },
  },

  simbolico: {
    label: 'octal → rwx',
    make(rng) {
      const m = randomMode(rng);
      return {
        prompt: `Tras \`chmod ${m} informe.txt\`, ¿qué permisos verás en \`ls -l\` (los 9 caracteres)?`,
        fields: [{ key: 'sym', label: 'Permisos', type: 'symbolic', answer: toSymbolic(m), placeholder: 'rw-r--r--' }],
        explain: `Cada cifra es un trío: ${breakdown(m)}. Resultado: **${toSymbolic(m)}**.`,
      };
    },
  },

  umask: {
    label: 'umask',
    make(rng) {
      const u = pick(rng, ['022', '027', '077', '002', '007', '037']);
      const isDir = rng() < 0.4;
      const base = isDir ? 7 : 6;
      const res = [...u].map((d) => base & ~Number(d)).join('');
      return {
        prompt: `Con \`umask ${u}\`, ¿con qué permisos (octal) se crea un **${isDir ? 'directorio' : 'fichero'}** nuevo?`,
        fields: [{ key: 'octal', label: 'Modo octal', type: 'octal', answer: res, placeholder: '644' }],
        explain: `La umask indica los permisos que se **quitan**. Se parte de ${isDir ? '777 para directorios' : '666 para ficheros (nunca nacen ejecutables)'} y en cada cifra se apagan los bits que marca la umask (${u}): ${String(base).repeat(3)} sin ${u} = **${res}** (${toSymbolic(res)}). Ojo: no es una resta: 6 (rw-) sin 3 (-wx) da 4 (r--), porque la x ya estaba apagada.`,
      };
    },
  },
};
