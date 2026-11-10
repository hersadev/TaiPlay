// Ejercicios de sistemas de numeración: pasar entre binario, octal,
// decimal y hexadecimal, y operaciones a nivel de bit (AND, OR, XOR, NOT y
// desplazamientos) sobre un byte.

import { int, pick } from './random.js';

const BASES = {
  2: { name: 'binario', type: 'bin', placeholder: '10110' },
  8: { name: 'octal', type: 'oct', placeholder: '17' },
  16: { name: 'hexadecimal', type: 'hex', placeholder: '3F' },
};

// Se aceptan los prefijos y sufijos habituales (0b, 0o, 0x, h), espacios
// entre grupos, ceros a la izquierda y minúsculas.
const normBase = (base, re) => (raw) => {
  const s = raw.trim().toLowerCase().replace(/[\s_]/g, '').replace(/^0[box]/, '').replace(/h$/, '');
  return s && re.test(s) ? parseInt(s, base).toString(base).toUpperCase() : null;
};

export const BASE_FIELD_TYPES = {
  bin: normBase(2, /^[01]+$/),
  oct: normBase(8, /^[0-7]+$/),
  hex: normBase(16, /^[0-9a-f]+$/),
};

const fmt = (n, base) => n.toString(base).toUpperCase();
const byte = (n) => n.toString(2).padStart(8, '0');
const groups = (bin) => bin.replace(/\B(?=(\d{4})+$)/g, ' ');

// Desarrollo «posición a posición» de un número en cualquier base.
function expand(n, base) {
  const digits = fmt(n, base).split('');
  const terms = digits
    .map((d, i) => {
      const v = parseInt(d, base);
      const w = base ** (digits.length - 1 - i);
      return v ? (w === 1 ? `${v}` : `${v}×${w}`) : null;
    })
    .filter(Boolean);
  return `${terms.join(' + ')} = ${n}`;
}

// Divisiones sucesivas, que es como se enseña a pasar de decimal a otra base.
function divisions(n, base) {
  const steps = [];
  let x = n;
  do {
    steps.push(`${x} ÷ ${base} = ${Math.floor(x / base)}, resto ${fmt(x % base, base)}`);
    x = Math.floor(x / base);
  } while (x > 0);
  return steps.join('; ');
}

// Atajo entre binario y octal/hexadecimal: grupos de 3 o 4 bits.
function viaGroups(n, base) {
  const size = base === 8 ? 3 : 4;
  const bits = n.toString(2);
  const padded = bits.padStart(Math.ceil(bits.length / size) * size, '0');
  const chunks = padded.match(new RegExp(`.{${size}}`, 'g'));
  return `${chunks.join(' ')} → ${chunks.map((c) => fmt(parseInt(c, 2), base)).join(' ')}`;
}

const randomValue = (rng) => (rng() < 0.75 ? int(rng, 5, 255) : int(rng, 256, 4095));

export const BASE_KINDS = {
  'a-decimal': {
    label: '→ decimal',
    make(rng) {
      const base = pick(rng, [2, 2, 8, 16, 16]);
      const n = randomValue(rng);
      const shown = base === 2 ? groups(n.toString(2)) : fmt(n, base);
      return {
        prompt: `Pasa a **decimal** el número ${BASES[base].name} **${shown}**.`,
        fields: [{ key: 'dec', label: 'Decimal', type: 'int', answer: n, placeholder: '0' }],
        explain: `Cada posición vale ${base} veces la anterior (de derecha a izquierda: 1, ${base}, ${base ** 2}${base < 16 ? `, ${base ** 3}` : ''}…). Se suma cada cifra por su peso: ${expand(n, base)}.`,
      };
    },
  },

  'desde-decimal': {
    label: 'decimal →',
    make(rng) {
      const base = pick(rng, [2, 2, 8, 16, 16]);
      const n = base === 2 ? int(rng, 5, 255) : randomValue(rng);
      const b = BASES[base];
      const shortcut = base === 2 ? '' : ` Atajo: pásalo a binario (${groups(n.toString(2))}) y agrupa los bits de ${base === 8 ? '3 en 3' : '4 en 4'} desde la derecha: ${viaGroups(n, base)}.`;
      return {
        prompt: `Pasa **${n}** (decimal) a **${b.name}**.`,
        fields: [{ key: 'v', label: b.name[0].toUpperCase() + b.name.slice(1), type: b.type, answer: fmt(n, base), placeholder: b.placeholder }],
        explain: `Se divide entre ${base} hasta llegar a 0 y se leen los restos **de abajo arriba**: ${divisions(n, base)}. Resultado: **${fmt(n, base)}**.${shortcut}`,
      };
    },
  },

  'bin-hex': {
    label: 'binario ↔ hex/octal',
    make(rng) {
      const n = int(rng, 17, 4095);
      const base = pick(rng, [16, 16, 8]);
      const b = BASES[base];
      const size = base === 8 ? 3 : 4;
      if (rng() < 0.5) {
        return {
          prompt: `Pasa el binario **${groups(n.toString(2))}** a **${b.name}** sin pasar por decimal.`,
          fields: [{ key: 'v', label: b.name[0].toUpperCase() + b.name.slice(1), type: b.type, answer: fmt(n, base), placeholder: b.placeholder }],
          explain: `Cada cifra ${b.name === 'octal' ? 'octal' : 'hexadecimal'} son exactamente ${size} bits. Se agrupan desde la derecha (rellenando con ceros a la izquierda) y se traduce cada grupo: ${viaGroups(n, base)}.`,
        };
      }
      return {
        prompt: `Pasa el ${b.name} **${fmt(n, base)}** a **binario** sin pasar por decimal.`,
        fields: [{ key: 'v', label: 'Binario', type: 'bin', answer: n.toString(2), placeholder: '1010 0110' }],
        explain: `Cada cifra se convierte en ${size} bits: ${fmt(n, base)
          .split('')
          .map((d) => `${d} → ${parseInt(d, base).toString(2).padStart(size, '0')}`)
          .join(', ')}. Juntos: **${n.toString(2)}** (los ceros de la izquierda no cuentan).`,
      };
    },
  },

  bits: {
    label: 'operaciones con bits',
    make(rng) {
      const op = pick(rng, ['AND', 'OR', 'XOR', 'NOT', '<<', '>>']);
      const a = int(rng, 1, 255);
      const b = int(rng, 1, 255);
      if (op === '<<' || op === '>>') {
        const k = int(rng, 1, 3);
        const x = op === '<<' ? int(rng, 1, 255 >> k) : int(rng, 8, 255);
        const res = op === '<<' ? x << k : x >> k;
        const pos = k === 1 ? '1 posición' : `${k} posiciones`;
        return {
          prompt: `¿Cuánto vale **${x} ${op} ${k}** (en decimal)?`,
          fields: [{ key: 'dec', label: 'Decimal', type: 'int', answer: res, placeholder: '0' }],
          explain:
            op === '<<'
              ? `Desplazar ${pos} a la izquierda añade ${k === 1 ? 'un cero' : `${k} ceros`} por la derecha: ${byte(x)} → ${byte(res)}. Equivale a **multiplicar por 2^${k} = ${2 ** k}**: ${x} × ${2 ** k} = **${res}**.`
              : `Desplazar ${pos} a la derecha descarta ${k === 1 ? 'el bit' : `los ${k} bits`} de la derecha: ${byte(x)} → ${byte(res)}. Equivale a **dividir entre 2^${k} = ${2 ** k}** sin decimales: ${x} ÷ ${2 ** k} = **${res}**.`,
        };
      }
      if (op === 'NOT') {
        const res = ~a & 255;
        return {
          prompt: `Sobre un byte, ¿cuánto vale **NOT ${byte(a)}**? Responde en binario (8 bits).`,
          fields: [{ key: 'bin', label: 'Binario', type: 'bin', answer: byte(res), placeholder: '0000 0000' }],
          explain: `NOT invierte cada bit: los 0 pasan a 1 y los 1 a 0. ${byte(a)} → **${byte(res)}**.`,
        };
      }
      const res = op === 'AND' ? a & b : op === 'OR' ? a | b : a ^ b;
      const rule = {
        AND: 'AND da 1 solo si **los dos** bits son 1 (sirve para aplicar máscaras: así se calcula la dirección de red)',
        OR: 'OR da 1 si **alguno** de los dos bits es 1',
        XOR: 'XOR da 1 si los bits son **distintos** y 0 si son iguales',
      }[op];
      return {
        prompt: `¿Cuánto vale **${byte(a)} ${op} ${byte(b)}**? Responde en binario (8 bits).`,
        fields: [{ key: 'bin', label: 'Binario', type: 'bin', answer: byte(res), placeholder: '0000 0000' }],
        explain: `${rule}. Bit a bit:\n\n\`\`\`\n    ${byte(a)}\n${op.padEnd(3)} ${byte(b)}\n  = ${byte(res)}\n\`\`\`\nResultado: **${byte(res)}** (${res} en decimal).`,
      };
    },
  },
};
