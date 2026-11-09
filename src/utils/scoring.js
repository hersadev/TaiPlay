// Corrección de un examen o supuesto, como lo hace el tribunal:
//   - Las preguntas anuladas no puntúan.
//   - Por cada anulada, entra en su lugar la primera pregunta de reserva
//     (de la misma parte) que siga disponible y no esté anulada.
//   - Cada error resta `penalty` veces el valor de un acierto; en blanco no
//     resta.
// Devuelve el desglose total, por parte y por tema.
export function scoreExam(questions, answers, penalty) {
  const counted = [];
  const byPart = new Map();
  for (const q of questions) {
    if (!byPart.has(q.partId)) byPart.set(q.partId, []);
    byPart.get(q.partId).push(q);
  }
  for (const qs of byPart.values()) {
    const main = qs.filter((q) => !q.reserve);
    const reserves = qs.filter((q) => q.reserve && !q.annulled);
    let replacements = main.filter((q) => q.annulled).length;
    counted.push(...main.filter((q) => !q.annulled));
    for (const r of reserves) {
      if (replacements-- <= 0) break;
      counted.push(r);
    }
  }

  const empty = () => ({ correct: 0, wrong: 0, blank: 0, total: 0 });
  const total = empty();
  const parts = {};
  const topics = {};
  for (const q of counted) {
    const a = answers[q.id] ?? null;
    const kind = a === null ? 'blank' : a === q.answer ? 'correct' : 'wrong';
    for (const bucket of [total, (parts[q.partId] ??= empty()), (topics[q.topic] ??= empty())]) {
      bucket[kind]++;
      bucket.total++;
    }
  }
  const net = (b) => b.correct - b.wrong * penalty;
  const withNet = (b) => ({ ...b, net: net(b), pct: b.total ? Math.max(0, net(b)) / b.total : 0 });
  return {
    ...withNet(total),
    countedIds: counted.map((q) => q.id),
    parts: Object.fromEntries(Object.entries(parts).map(([k, v]) => [k, withNet(v)])),
    topics: Object.fromEntries(Object.entries(topics).map(([k, v]) => [k, withNet(v)])),
  };
}
