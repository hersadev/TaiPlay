// Road: un camino de tramos que se superan acertando 10 preguntas seguidas.
// Si se falla una, se pierde la tirada y se vuelve al principio del tramo.
//
// El camino sigue el temario: cada bloque se parte en tramos de temas
// consecutivos (con al menos MIN_POOL preguntas cada uno, para que al
// repetir salgan otras), termina con un «jefe» que mezcla todo el bloque, y
// la meta son unos tramos finales con preguntas de todo el programa.
//
// Solo entran preguntas de la primera parte (las de los supuestos dependen
// de su enunciado) con respuesta oficial.

export const RUN = 10;
export const MIN_POOL = 25;
export const FINAL_STAGES = 3;
const ROMAN = ['I', 'II', 'III', 'IV'];

const usable = (q) => q.partId === 'primera' && q.answer && !q.annulled && /^B[1-4]T\d\d$/.test(q.tema ?? '');

// Tramos del camino, en orden. Cada uno: { id, kind, bloque, title, subtitle, pool: [ids] }.
export function buildRoad(questions) {
  const qs = questions.filter(usable);
  const stages = [];
  for (let b = 1; b <= 4; b++) {
    const inBloque = qs.filter((q) => q.tema.startsWith(`B${b}`));
    if (!inBloque.length) continue;
    const temas = [...new Set(inBloque.map((q) => q.tema))].sort();
    const groups = [];
    let current = [];
    for (const t of temas) {
      current.push(t);
      if (inBloque.filter((q) => current.includes(q.tema)).length >= MIN_POOL) {
        groups.push(current);
        current = [];
      }
    }
    // Lo que sobra al final se une al último tramo para no dejar uno corto.
    if (current.length) groups.length ? groups[groups.length - 1].push(...current) : groups.push(current);
    groups.forEach((g, i) => {
      const nums = g.map((t) => Number(t.slice(3)));
      stages.push({
        id: `B${b}-${i + 1}`,
        kind: 'temas',
        bloque: b,
        title: `Bloque ${ROMAN[b - 1]} · Tramo ${i + 1}`,
        subtitle: nums.length === 1 ? `Tema ${nums[0]}` : `Temas ${nums[0]} ${nums.length === 2 ? 'y' : 'a'} ${nums[nums.length - 1]}`,
        temas: g,
        pool: inBloque.filter((q) => g.includes(q.tema)).map((q) => q.id),
      });
    });
    stages.push({
      id: `B${b}-jefe`,
      kind: 'jefe',
      bloque: b,
      title: `Jefe del bloque ${ROMAN[b - 1]}`,
      subtitle: 'Todo el bloque',
      temas,
      pool: inBloque.map((q) => q.id),
    });
  }
  for (let i = 1; qs.length && i <= FINAL_STAGES; i++) {
    stages.push({
      id: `meta-${i}`,
      kind: 'meta',
      bloque: null,
      title: i === FINAL_STAGES ? 'La meta' : `Recta final ${i}`,
      subtitle: 'Todo el programa',
      temas: [],
      pool: qs.map((q) => q.id),
    });
  }
  return stages;
}

const shuffle = (list, rng) => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// Las 10 preguntas de una tirada. Primero las que nunca se han respondido
// y las falladas la última vez; después el resto. Al azar dentro de cada grupo.
export function drawRun(stage, questions, answers = {}, rng = Math.random) {
  const byId = new Map(questions.map((q) => [q.id, q]));
  const pool = shuffle(stage.pool, rng).map((id) => byId.get(id));
  const fresh = pool.filter((q) => !answers[q.id] || answers[q.id].last === 'ko');
  const known = pool.filter((q) => answers[q.id] && answers[q.id].last !== 'ko');
  return [...fresh, ...known].slice(0, RUN);
}

// Estado guardado: road = { cleared: nº de tramos superados, fails: { [id]: tiradas
// falladas antes de superarlo } }. Se avanza de uno en uno: solo cuenta el
// tramo actual (repetir uno ya superado no cambia nada).
export const EMPTY_ROAD = { cleared: 0, fails: {} };

export function passStage(road, stages, id) {
  const r = road ?? EMPTY_ROAD;
  return stages[r.cleared]?.id === id ? { ...r, cleared: r.cleared + 1 } : r;
}

export function failStage(road, stages, id) {
  const r = road ?? EMPTY_ROAD;
  return stages[r.cleared]?.id === id ? { ...r, fails: { ...r.fails, [id]: (r.fails[id] ?? 0) + 1 } } : r;
}

// Para los logros: tramos superados a la primera seguidos (la mejor racha)
// y si alguno se superó tras fallarlo `n` veces o más.
export function cleanStreak(road, stages) {
  let best = 0;
  let run = 0;
  for (const s of stages.slice(0, road?.cleared ?? 0)) {
    run = road.fails[s.id] ? 0 : run + 1;
    best = Math.max(best, run);
  }
  return best;
}

export const passedAfterFails = (road, stages, n) => stages.slice(0, road?.cleared ?? 0).some((s) => (road.fails[s.id] ?? 0) >= n);

export const stageCleared = (road, stages, id) => stages.findIndex((s) => s.id === id) < (road?.cleared ?? 0) && stages.some((s) => s.id === id);
