// Simulacro mezclado: un examen nuevo con preguntas reales de todos los
// años, en vez de un examen pasado tal cual.
//
// - Primera parte: 80 preguntas con el reparto por bloques medio de los
//   exámenes reales (REPARTO) y 5 de reserva de cualquier bloque. Solo
//   entran preguntas con respuesta oficial (las anuladas no).
// - Segunda parte: un supuesto real completo (con su enunciado) de un año al
//   azar. Sus preguntas no se mezclan porque dependen de ese enunciado.
//
// Las preguntas conservan su id (el progreso se guarda igual) y llevan
// `seq`, su número dentro del simulacro.
//
// Con soloNuevas, dentro de cada bloque van primero las preguntas que nunca
// se han respondido (answers), y el supuesto se elige entre los que menos se
// han visto: así el simulacro mide lo que sabes y no lo que recuerdas.
// Cuando ya no quedan nuevas, se completa con las demás.

// Preguntas por bloque en la primera parte, media de 2019 a 2025.
export const REPARTO = { 1: 21, 2: 14, 3: 23, 4: 22 };
export const RESERVAS = 5;

const shuffle = (list, rng) => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const bloqueOf = (q) => Number(q.tema?.[1]);

// supuesto: 'supuesto1' (bloque III) o 'supuesto2' (bloque IV).
export function buildMixedExam(questions, exams, { supuesto = 'supuesto2', rng = Math.random, answers = {}, soloNuevas = false } = {}) {
  const isNew = (q) => !answers[q.id];
  const shuffled = shuffle(
    questions.filter((q) => q.partId === 'primera' && q.answer && !q.annulled && REPARTO[bloqueOf(q)]),
    rng,
  );
  const pool = soloNuevas ? [...shuffled.filter(isNew), ...shuffled.filter((q) => !isNew(q))] : shuffled;
  const main = [];
  for (const [b, n] of Object.entries(REPARTO)) main.push(...pool.filter((q) => bloqueOf(q) === Number(b)).slice(0, n));
  // En el examen real las preguntas van más o menos en el orden del temario.
  main.sort((a, b) => a.tema.localeCompare(b.tema));
  const used = new Set(main.map((q) => q.id));
  const reserves = pool.filter((q) => !used.has(q.id)).slice(0, RESERVAS);

  let withSupuesto = shuffle(exams.filter((e) => e.parts.some((p) => p.id === supuesto)), rng);
  if (soloNuevas) {
    const seenIn = (e) => questions.filter((q) => q.examId === e.id && q.partId === supuesto && !isNew(q)).length;
    const least = Math.min(...withSupuesto.map(seenIn));
    withSupuesto = withSupuesto.filter((e) => seenIn(e) === least);
  }
  const exam = withSupuesto[0];
  const part = exam.parts.find((p) => p.id === supuesto);
  const second = questions.filter((q) => q.examId === exam.id && q.partId === supuesto);

  return {
    title: `Simulacro mezclado (primera parte al azar + ${part.title} de ${exam.title})`,
    questions: [
      ...main.map((q, i) => ({ ...q, reserve: false, seq: i + 1 })),
      ...reserves.map((q, i) => ({ ...q, reserve: true, seq: i + 1 })),
      ...second.map((q) => ({ ...q, seq: q.n })),
    ],
  };
}

// Cuántas de las preguntas que puntúan (sin las de reserva) se habían
// respondido antes de empezar: si son muchas, la nota mide en parte memoria.
export function seenBefore(questions, answers) {
  const scored = questions.filter((q) => !q.reserve && !q.annulled);
  return { seen: scored.filter((q) => answers[q.id]).length, total: scored.length };
}
