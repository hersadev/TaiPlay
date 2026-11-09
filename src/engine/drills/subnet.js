// Generadores de ejercicios de subnetting. Cada uno devuelve un ejercicio
// nuevo al azar con la solución calculada y una explicación paso a paso,
// en el formato que entiende engine/drills/index.js.
//
// Sin dependencias del navegador: se prueba con `node --test`.

import { pick, int } from './random.js';

export const ipToInt = (ip) => ip.split('.').reduce((acc, o) => acc * 256 + Number(o), 0);
export const intToIp = (n) => [24, 16, 8, 0].map((s) => Math.floor(n / 2 ** s) % 256).join('.');
export const maskInt = (p) => (p === 0 ? 0 : 2 ** 32 - 2 ** (32 - p));
export const maskOf = (p) => intToIp(maskInt(p));
export const size = (p) => 2 ** (32 - p);
export const hostsOf = (p) => (p >= 31 ? 0 : size(p) - 2);
export const networkOf = (ip, p) => intToIp(Math.floor(ipToInt(ip) / size(p)) * size(p));
export const broadcastOf = (ip, p) => intToIp(ipToInt(networkOf(ip, p)) + size(p) - 1);

const isIp = (s) => /^\d{1,3}(\.\d{1,3}){3}$/.test(s) && s.split('.').every((o) => Number(o) <= 255);

// Prefijo escrito como «/18», «18» o como máscara «255.255.192.0».
export function parsePrefix(raw) {
  const s = raw.trim().replace(/^\//, '');
  if (/^\d{1,2}$/.test(s) && Number(s) <= 32) return Number(s);
  if (isIp(s)) {
    const bits = ipToInt(s).toString(2).padStart(32, '0');
    if (/^1*0*$/.test(bits)) return bits.indexOf('0') === -1 ? 32 : bits.indexOf('0');
  }
  return null;
}

const normIp = (raw) => {
  const s = raw.trim().replace(/\/\d+$/, '');
  return isIp(s) ? s.split('.').map(Number).join('.') : null;
};
const normInt = (raw) => {
  const s = raw.trim().replace(/[.\s]/g, '');
  return /^\d+$/.test(s) ? Number(s) : null;
};

// Tipos de campo: cómo se normaliza la respuesta antes de compararla.
export const FIELD_TYPES = {
  ip: normIp,
  int: normInt,
  prefix: parsePrefix,
  mask: (raw) => {
    const p = parsePrefix(raw);
    return p === null ? null : maskOf(p);
  },
};

// Octeto «interesante»: el que contiene el límite entre red y equipo.
const octetNote = (p) => {
  if (p % 8 === 0) return `El /${p} cae justo en el borde de un octeto: los bloques se cuentan enteros.`;
  const oct = Math.floor(p / 8) + 1;
  const block = 2 ** (8 - (p % 8));
  return `El /${p} corta el ${oct}.º octeto: allí la máscara vale ${256 - block}, así que los bloques van de ${block} en ${block} (256 − ${256 - block} = ${block}).`;
};

const randomIp = (rng, firstOctets = [10, 172, 192]) => {
  const a = pick(rng, firstOctets);
  const b = a === 172 ? int(rng, 16, 31) : a === 192 ? 168 : int(rng, 0, 255);
  return `${a}.${b}.${int(rng, 0, 255)}.${int(rng, 1, 254)}`;
};

const pow2 = (n) => `2${String(n).replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d])}`;

export const SUBNET_KINDS = {
  mascara: {
    label: 'Prefijo ↔ máscara',
    make(rng) {
      const p = int(rng, 8, 30);
      if (rng() < 0.5) {
        return {
          prompt: `Escribe en decimal la máscara **/${p}**.`,
          fields: [{ key: 'mask', label: 'Máscara', type: 'mask', answer: maskOf(p), placeholder: '255.255.255.0' }],
          explain: `/${p} son ${p} unos seguidos de ${32 - p} ceros. Cada octeto completo de unos vale 255. ${octetNote(p)} Resultado: **${maskOf(p)}**.`,
        };
      }
      return {
        prompt: `¿Qué prefijo (/n) corresponde a la máscara **${maskOf(p)}**?`,
        fields: [{ key: 'prefix', label: 'Prefijo', type: 'prefix', answer: p, placeholder: '/24' }],
        explain: `Cuenta los bits a 1: cada 255 son 8, y ${maskOf(p)
          .split('.')
          .filter((o) => o !== '255' && o !== '0')
          .map((o) => `${o} = ${Number(o).toString(2).padStart(8, '0')} (${Number(o).toString(2).replace(/0/g, '').length} unos)`)
          .join(', ') || 'no hay octetos a medias'}. Total: **/${p}**.`,
      };
    },
  },

  hosts: {
    label: 'Hosts de una red',
    make(rng) {
      const p = int(rng, 16, 30);
      const net = networkOf(randomIp(rng), p);
      const h = 32 - p;
      return {
        prompt: `¿Cuántas direcciones hay disponibles para hosts en la red **${net}/${p}**?`,
        fields: [{ key: 'hosts', label: 'Hosts utilizables', type: 'int', answer: hostsOf(p), placeholder: '254' }],
        explain: `Quedan 32 − ${p} = ${h} bits para hosts → ${pow2(h)} = ${size(p)} direcciones. Se restan la de red y la de broadcast: ${size(p)} − 2 = **${hostsOf(p)}**.`,
      };
    },
  },

  red: {
    label: 'Red y broadcast',
    make(rng) {
      const p = rng() < 0.75 ? int(rng, 17, 30) : int(rng, 9, 16);
      const ip = randomIp(rng);
      const net = networkOf(ip, p);
      const bc = broadcastOf(ip, p);
      const oct = Math.min(3, Math.floor(p / 8));
      const block = 2 ** (8 - (p % 8));
      const v = Number(ip.split('.')[oct]);
      const start = Math.floor(v / block) * block;
      return {
        prompt: `Un equipo tiene la IP **${ip}/${p}**. ¿Cuál es la dirección de red y cuál la de broadcast?`,
        fields: [
          { key: 'net', label: 'Dirección de red', type: 'ip', answer: net, placeholder: '0.0.0.0' },
          { key: 'bc', label: 'Broadcast', type: 'ip', answer: bc, placeholder: '0.0.0.0' },
        ],
        explain: `${octetNote(p)} En el ${oct + 1}.º octeto la IP tiene ${v}, que cae en el bloque ${start}–${start + block - 1}. A la izquierda se copia la IP; a la derecha, ceros para la red y 255 para el broadcast. Red: **${net}**. Broadcast: **${bc}**. Hosts: de ${intToIp(ipToInt(net) + 1)} a ${intToIp(ipToInt(bc) - 1)}.`,
      };
    },
  },

  'misma-red': {
    label: '¿Misma red?',
    make(rng) {
      const p = int(rng, 20, 29);
      const a = randomIp(rng, [192, 172, 10]);
      const net = ipToInt(networkOf(a, p));
      const same = rng() < 0.5;
      let bInt;
      if (same) bInt = net + int(rng, 1, size(p) - 2);
      else {
        const shift = pick(rng, [-1, 1]) * int(rng, 1, 3) * size(p);
        bInt = net + shift + int(rng, 1, size(p) - 2);
      }
      const b = intToIp(bInt);
      const ans = networkOf(a, p) === networkOf(b, p);
      return {
        prompt: `Con máscara **${maskOf(p)}** (/${p}), ¿están **${a}** y **${b}** en la misma red?`,
        choices: ['Sí', 'No'],
        fields: [{ key: 'same', label: 'Respuesta', type: 'choice', answer: ans ? 'Sí' : 'No' }],
        explain: `${octetNote(p)} ${a} está en la red ${networkOf(a, p)} y ${b} en la ${networkOf(b, p)}: **${ans ? 'misma red' : 'redes distintas'}**.`,
      };
    },
  },

  dividir: {
    label: 'Dividir en subredes',
    make(rng) {
      const p = int(rng, 16, 24);
      const k = int(rng, 1, 3);
      const n = 2 ** k;
      const np = p + k;
      const base = networkOf(randomIp(rng, [10, 172]), p);
      const m = int(rng, 2, n);
      const sub = intToIp(ipToInt(base) + (m - 1) * size(np));
      const ord = ['primera', 'segunda', 'tercera', 'cuarta', 'quinta', 'sexta', 'séptima', 'octava'][m - 1];
      return {
        prompt: `Divide **${base}/${p}** en **${n} subredes** del mismo tamaño. ¿Qué prefijo tiene cada una y cuál es la dirección de red de la **${ord}**?`,
        fields: [
          { key: 'prefix', label: 'Prefijo nuevo', type: 'prefix', answer: np, placeholder: '/24' },
          { key: 'net', label: `Red de la ${ord}`, type: 'ip', answer: sub, placeholder: '0.0.0.0' },
        ],
        explain: `${n} subredes = ${pow2(k)} → se toma${k > 1 ? 'n' : ''} ${k} bit${k > 1 ? 's' : ''} prestado${k > 1 ? 's' : ''}: /${p} + ${k} = **/${np}**. Cada una ocupa ${size(np)} direcciones. ${octetNote(np)} Empezando en ${base}: la ${ord} es la n.º ${m} → ${base} + ${m - 1} × ${size(np)} = **${sub}**.`,
      };
    },
  },

  'n-subredes': {
    label: 'Máscara para N subredes',
    make(rng) {
      const p = pick(rng, [8, 16, 16, 20, 22]);
      const maxBits = Math.min(12, 28 - p);
      const bits = int(rng, 2, maxBits);
      const n = int(rng, 2 ** (bits - 1) + 1, 2 ** bits);
      const base = p === 8 ? '10.0.0.0' : networkOf(randomIp(rng, [10, 172]), p);
      return {
        prompt: `En la red **${base}/${p}** necesitas crear **${n} subredes**. ¿Cuál es la máscara mínima (el prefijo más corto) que lo permite?`,
        fields: [{ key: 'prefix', label: 'Prefijo', type: 'prefix', answer: p + bits, placeholder: '/24' }],
        explain: `Busca la menor potencia de 2 que llegue a ${n}: ${pow2(bits - 1)} = ${2 ** (bits - 1)} no basta y ${pow2(bits)} = ${2 ** bits} sí. Hacen falta ${bits} bits de subred: ${p} + ${bits} = **/${p + bits}**.`,
      };
    },
  },

  'n-hosts': {
    label: 'Máscara para N hosts',
    make(rng) {
      const h = int(rng, 3, 13);
      const n = int(rng, 2 ** (h - 1) - 1, 2 ** h - 2);
      return {
        prompt: `Una VLAN necesita **${n} equipos**. ¿Qué prefijo deja la subred más pequeña posible en la que quepan?`,
        fields: [{ key: 'prefix', label: 'Prefijo', type: 'prefix', answer: 32 - h, placeholder: '/24' }],
        explain: `Con h bits de host caben 2ʰ − 2 equipos. ${pow2(h - 1)} − 2 = ${2 ** (h - 1) - 2} no llega y ${pow2(h)} − 2 = ${2 ** h - 2} sí: h = ${h}. Prefijo: 32 − ${h} = **/${32 - h}**.`,
      };
    },
  },
};
