// Cálculos del panel de progreso, sin React para poder probarlos.

// Simulacros hechos, del más antiguo al más reciente, con su rendimiento
// (aciertos netos sobre el total, sin bajar de 0).
export function simulacroSeries(attempts) {
  return attempts
    .filter((a) => a.kind === 'simulacro' && a.total > 0)
    .sort((a, b) => a.at - b.at)
    .map((a) => ({ at: a.at, title: a.title.replace(/^Simulacro · /, ''), net: a.net, total: a.total, pct: Math.max(0, a.net) / a.total }));
}

// Temas del programa con peor porcentaje de acierto (según el último
// intento de cada pregunta). Solo cuentan los temas con al menos `minSeen`
// preguntas respondidas, para no sacar conclusiones de una sola.
export function weakTemas(questions, answers, temas, { minSeen = 3, limit = 8 } = {}) {
  return temas
    .map((t) => {
      const qs = questions.filter((q) => q.tema === t.id && !q.annulled);
      const seen = qs.filter((q) => answers[q.id]);
      const ok = seen.filter((q) => answers[q.id].last === 'ok').length;
      return { tema: t, total: qs.length, seen: seen.length, ok, pct: seen.length ? ok / seen.length : 0 };
    })
    .filter((r) => r.seen >= minSeen && r.ok < r.seen)
    .sort((a, b) => a.pct - b.pct || b.seen - a.seen)
    .slice(0, limit);
}

// Cuánto se ha visto de cada bloque: preguntas respondidas alguna vez y
// fichas del temario superadas.
export function coverage(questions, answers, bloques, lessons) {
  return bloques.map((b) => {
    const ids = new Set(b.temas.map((t) => t.id));
    const qs = questions.filter((q) => ids.has(q.tema) && !q.annulled);
    return {
      bloque: b,
      preguntas: { seen: qs.filter((q) => answers[q.id]).length, total: qs.length },
      fichas: { done: b.temas.filter((t) => lessons[t.id]?.done).length, total: b.temas.length },
    };
  });
}
