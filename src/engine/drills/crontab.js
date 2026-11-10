// Ejercicios de crontab: leer una línea (elegir qué hace entre cuatro) y
// escribirla a partir de una descripción.
//
// Una programación se guarda como { min, hour, dom, mon, dow }, con cada
// campo tal y como iría en el crontab ('*', '30', '*/15', '1-5'…).

import { int, pick } from './random.js';

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const FIELDS = ['min', 'hour', 'dom', 'mon', 'dow'];

export const cronLine = (s) => FIELDS.map((f) => s[f]).join(' ');

const hhmm = (h, m) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

// Descripción en castellano. Solo cubre las formas que genera randomSpec.
export function describeCron(s) {
  const every = (f) => s[f].startsWith('*/') && Number(s[f].slice(2));
  let when;
  if (every('min')) when = `cada ${every('min')} minutos`;
  else if (s.min === '*') when = 'cada minuto';
  else if (every('hour')) when = `cada ${every('hour')} horas, en el minuto ${s.min}`;
  else if (s.hour === '*') when = `cada hora, en el minuto ${s.min}`;
  else when = `a las ${hhmm(s.hour, s.min)}`;

  const days = [];
  if (s.dom !== '*') days.push(`el día ${s.dom}${s.mon === '*' ? ' de cada mes' : ''}`);
  if (s.mon !== '*') days.push(`${s.dom === '*' ? 'todos los días de ' : 'de '}${MESES[Number(s.mon) - 1]}`);
  if (s.dow === '1-5') days.push('de lunes a viernes');
  else if (s.dow === '0,6') days.push('los sábados y domingos');
  else if (s.dow !== '*') days.push(`los ${DIAS[Number(s.dow)]}${DIAS[Number(s.dow)].endsWith('s') ? '' : 's'}`);
  const text = `${when}${days.length ? `, ${days.join(' ')}` : ', todos los días'}`;
  return text[0].toUpperCase() + text.slice(1);
}

function randomSpec(rng) {
  const s = { min: String(int(rng, 0, 59)), hour: String(int(rng, 0, 23)), dom: '*', mon: '*', dow: '*' };
  const shape = pick(rng, ['diaria', 'diaria', 'semanal', 'laborables', 'mensual', 'anual', 'cada-min', 'cada-hora']);
  if (shape === 'semanal') s.dow = String(int(rng, 0, 6));
  if (shape === 'laborables') s.dow = pick(rng, ['1-5', '1-5', '0,6']);
  if (shape === 'mensual') s.dom = String(int(rng, 1, 28));
  if (shape === 'anual') {
    s.dom = String(int(rng, 1, 28));
    s.mon = String(int(rng, 1, 12));
  }
  if (shape === 'cada-min') Object.assign(s, { min: `*/${pick(rng, [5, 10, 15, 20, 30])}`, hour: '*' });
  if (shape === 'cada-hora') s.hour = `*/${pick(rng, [2, 3, 4, 6, 12])}`;
  return s;
}

// Las confusiones típicas: minutos y horas al revés, día del mes por día
// de la semana, «cada N» por «en el N».
function lookalikes(s, rng) {
  const out = [];
  const swap = { ...s, min: s.hour, hour: s.min };
  if (!s.min.includes('*') && !s.hour.includes('*') && Number(s.min) <= 23) out.push(swap);
  if (s.dow !== '*' && /^\d$/.test(s.dow) && Number(s.dow) >= 1) out.push({ ...s, dow: '*', dom: s.dow });
  if (s.dom !== '*' && s.mon === '*' && Number(s.dom) <= 6) out.push({ ...s, dom: '*', dow: s.dom });
  if (s.min.startsWith('*/')) out.push({ ...s, min: s.min.slice(2), hour: '*' });
  if (s.hour.startsWith('*/')) out.push({ ...s, hour: s.hour.slice(2) });
  if (s.dow === '1-5') out.push({ ...s, dow: '0,6' });
  if (s.dow === '0,6') out.push({ ...s, dow: '1-5' });
  if (s.mon !== '*' && Number(s.dom) <= 12) out.push({ ...s, mon: s.dom, dom: s.mon });
  const restricted = s.dom !== '*' || s.mon !== '*' || s.dow !== '*';
  if (restricted) out.push({ ...s, dom: '*', mon: '*', dow: '*' });
  else if (!s.min.includes('*') && !s.hour.includes('*')) out.push({ ...s, dow: String(int(rng, 1, 6)) }, { ...s, dom: String(int(rng, 1, 28)) });
  while (out.length < 6) out.push(randomSpec(rng));
  return out;
}

// Normaliza los 5 campos de tiempo: quita ceros a la izquierda, «*/1» es
// «*» y el domingo puede escribirse 0 o 7. Si se escribe la orden detrás,
// se ignora.
const normField = (f, i) => {
  if (!/^[\d*/,-]+$/.test(f)) return null;
  let v = f.replace(/\b0+(?=\d)/g, '');
  if (v === '*/1') v = '*';
  if (i === 4) v = v.replace(/\b7\b/g, '0');
  return v;
};

export const CRON_FIELD_TYPES = {
  cron: (raw) => {
    const parts = raw.trim().split(/\s+/).slice(0, 5);
    if (parts.length < 5) return null;
    const norm = parts.map(normField);
    return norm.every((x) => x !== null) ? norm.join(' ') : null;
  },
};

const legend = 'Orden de los campos: **minuto hora día-del-mes mes día-de-la-semana** (0 o 7 = domingo, 1 = lunes…).';

export const CRON_KINDS = {
  'cron-leer': {
    label: 'leer crontab',
    make(rng) {
      const s = randomSpec(rng);
      const right = describeCron(s);
      const choices = [right];
      for (const alt of lookalikes(s, rng)) {
        const d = describeCron(alt);
        if (choices.length < 4 && !choices.includes(d)) choices.push(d);
      }
      for (let i = choices.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [choices[i], choices[j]] = [choices[j], choices[i]];
      }
      return {
        prompt: `¿Cuándo se ejecuta esta línea del crontab?\n\n\`\`\`\n${cronLine(s)} /usr/local/bin/copia.sh\n\`\`\``,
        choices,
        fields: [{ key: 'when', label: 'Cuándo', type: 'choice', answer: right }],
        explain: `${legend} \`${cronLine(s)}\` → **${right}**.`,
      };
    },
  },

  'cron-escribir': {
    label: 'escribir crontab',
    make(rng) {
      const s = randomSpec(rng);
      return {
        prompt: `Escribe los **5 campos de tiempo** del crontab para ejecutar una tarea: **${describeCron(s).toLowerCase()}**.`,
        fields: [{ key: 'cron', label: 'Campos de tiempo', type: 'cron', answer: cronLine(s), placeholder: '30 2 * * *' }],
        explain: `${legend} Resultado: \`${cronLine(s)}\`.${s.min.startsWith('*/') || s.hour.startsWith('*/') ? ' `*/N` significa «cada N».' : ''}${s.dow === '1-5' ? ' **1-5** es un rango: de lunes a viernes.' : ''}`,
      };
    },
  },
};
