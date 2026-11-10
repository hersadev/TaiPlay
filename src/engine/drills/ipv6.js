// Ejercicios de IPv6: abreviar una dirección completa y expandir una
// abreviada, con las reglas de la RFC 4291 y la forma recomendada de la
// RFC 5952 (minúsculas, sin ceros a la izquierda y «::» en la racha de
// ceros más larga).

import { int, pick } from './random.js';

const HEX = /^[0-9a-f]{1,4}$/;

// «2001:db8::1» → ['2001', '0db8', '0000', …, '0001'], o null si no es válida.
export function expandIpv6(raw) {
  const s = raw.trim().toLowerCase();
  if (!s || /[^0-9a-f:]/.test(s) || s.includes(':::') || s.split('::').length > 2) return null;
  const [head, tail] = s.includes('::') ? s.split('::') : [s, null];
  const left = head ? head.split(':') : [];
  const right = tail ? tail.split(':') : [];
  if (![...left, ...right].every((g) => HEX.test(g))) return null;
  const missing = 8 - left.length - right.length;
  if (tail === null ? missing !== 0 : missing < 1) return null;
  return [...left, ...Array(tail === null ? 0 : missing).fill('0'), ...right].map((g) => g.padStart(4, '0'));
}

// Forma más corta (RFC 5952): sin ceros a la izquierda y «::» en la racha
// de dos o más grupos a cero más larga (la primera si empatan).
export function compressIpv6(groups) {
  const short = groups.map((g) => g.replace(/^0+(?=.)/, ''));
  let best = { start: -1, len: 1 };
  for (let i = 0; i < 8; ) {
    if (short[i] !== '0') {
      i++;
      continue;
    }
    let j = i;
    while (j < 8 && short[j] === '0') j++;
    if (j - i > best.len) best = { start: i, len: j - i };
    i = j;
  }
  if (best.start < 0) return short.join(':');
  return `${short.slice(0, best.start).join(':')}::${short.slice(best.start + best.len).join(':')}`;
}

// Para «abreviar» vale cualquier escritura de la misma dirección que sea
// tan corta como la recomendada (si hay dos rachas de ceros iguales, da
// igual cuál se comprima). Por eso el valor normalizado incluye la longitud.
export const IPV6_FIELD_TYPES = {
  ipv6short: (raw) => {
    const s = raw.trim().toLowerCase();
    const g = expandIpv6(s);
    return g ? `${g.join(':')}#${s.length}` : null;
  },
  ipv6full: (raw) => {
    const s = raw.trim().toLowerCase();
    return /^([0-9a-f]{4}:){7}[0-9a-f]{4}$/.test(s) ? s : null;
  },
};

const hexGroup = (rng) => {
  const v = int(rng, 1, 0xffff);
  // Valores pequeños a menudo, para que haya ceros a la izquierda que quitar.
  const small = rng() < 0.5 ? v % pick(rng, [0x10, 0x100, 0x1000]) || 1 : v;
  return small.toString(16).padStart(4, '0');
};

function randomAddress(rng) {
  const prefix = pick(rng, [['2001', '0db8'], ['2001', '0db8'], ['fe80', '0000'], ['2a02', '0c78'], ['fd00', hexGroup(rng)]]);
  const groups = [...prefix, ...Array.from({ length: 6 }, () => (rng() < 0.3 ? '0000' : hexGroup(rng)))];
  if (rng() < 0.85) {
    const len = int(rng, 2, 4);
    const start = int(rng, 2, 8 - len);
    for (let i = start; i < start + len; i++) groups[i] = '0000';
  }
  return groups;
}

const rules = (groups) => {
  const zeros = groups.join(':').match(/(?:^|:)(0000(?::0000)+)/g);
  return `Dos reglas: 1) en cada grupo se quitan los **ceros a la izquierda** (0db8 → db8, 0000 → 0); 2) **una sola vez** se sustituye la racha más larga de grupos a cero por **::**${zeros ? '' : ' (aquí no hay dos grupos a cero seguidos, así que no se usa)'}. Una racha de un solo grupo se queda en 0 y no se comprime con ::.`;
};

export const IPV6_KINDS = {
  'ipv6-abreviar': {
    label: 'abreviar IPv6',
    make(rng) {
      const groups = randomAddress(rng);
      const short = compressIpv6(groups);
      return {
        prompt: `Escribe en su forma **más corta** la dirección IPv6 **${groups.join(':')}**.`,
        fields: [{ key: 'v6', label: 'Forma abreviada', type: 'ipv6short', answer: short, placeholder: '2001:db8::1' }],
        explain: `${rules(groups)} Resultado: **${short}**.`,
      };
    },
  },

  'ipv6-expandir': {
    label: 'expandir IPv6',
    make(rng) {
      const groups = randomAddress(rng);
      const short = compressIpv6(groups);
      const missing = short.includes('::') ? 8 - short.split('::').flatMap((s) => (s ? s.split(':') : [])).length : 0;
      return {
        prompt: `Escribe **completa** (8 grupos de 4 cifras) la dirección IPv6 **${short}**.`,
        fields: [{ key: 'v6', label: 'Forma completa', type: 'ipv6full', answer: groups.join(':'), placeholder: '2001:0db8:0000:…' }],
        explain: `Se rellena cada grupo con ceros a la izquierda hasta 4 cifras${missing ? `, y **::** se sustituye por los grupos que faltan hasta llegar a 8: aquí hay ${8 - missing} escritos, así que :: vale **${missing}** ${missing === 1 ? 'grupo' : 'grupos'} 0000` : ''}. Resultado: **${groups.join(':')}**.`,
      };
    },
  },
};
