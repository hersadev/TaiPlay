// Ejercicios generados al azar (lecciones de tipo «drill»). Cada tipo
// tiene make(rng) → { prompt, fields, choices?, explain }; check() corrige
// las respuestas normalizándolas según el tipo de cada campo, así que «/18»,
// «18» y «255.255.192.0» valen lo mismo.

import { SUBNET_KINDS, FIELD_TYPES } from './subnet.js';
import { PERM_KINDS, PERM_FIELD_TYPES } from './permisos.js';
import { BASE_KINDS, BASE_FIELD_TYPES } from './bases.js';
import { STORAGE_KINDS } from './almacenamiento.js';
import { IPV6_KINDS, IPV6_FIELD_TYPES } from './ipv6.js';
import { PORT_KINDS } from './puertos.js';
import { CRON_KINDS, CRON_FIELD_TYPES } from './crontab.js';

export const DRILL_KINDS = { ...SUBNET_KINDS, ...PERM_KINDS, ...BASE_KINDS, ...STORAGE_KINDS, ...IPV6_KINDS, ...PORT_KINDS, ...CRON_KINDS };

export const FIELD_TYPE_NAMES = ['choice', ...Object.keys({ ...FIELD_TYPES, ...PERM_FIELD_TYPES, ...BASE_FIELD_TYPES, ...IPV6_FIELD_TYPES, ...CRON_FIELD_TYPES })];

const TYPES = { ...FIELD_TYPES, ...PERM_FIELD_TYPES, ...BASE_FIELD_TYPES, ...IPV6_FIELD_TYPES, ...CRON_FIELD_TYPES, choice: (raw) => raw };

export function makeExercise(kind, rng = Math.random) {
  const k = DRILL_KINDS[kind];
  if (!k) throw new Error(`Tipo de ejercicio desconocido: ${kind}`);
  return { kind, ...k.make(rng) };
}

// answers: { clave: texto }. Devuelve { ok, fields: { clave: true|false } }.
export function checkExercise(ex, answers) {
  const fields = {};
  for (const f of ex.fields) {
    const norm = TYPES[f.type];
    const got = norm(String(answers[f.key] ?? ''));
    fields[f.key] = got !== null && String(got) === String(norm(String(f.answer)));
  }
  return { ok: Object.values(fields).every(Boolean), fields };
}
