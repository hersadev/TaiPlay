// Repetición espaciada con cajas de Leitner. Cada tarjeta está en una caja
// (0 = nueva); al acertarla sube de caja y se espera más para volver a
// verla; al fallarla vuelve a la caja 1 y se repite hoy mismo.
//
// Estado guardado por tarjeta: { box, due: 'AAAA-MM-DD', ok, ko }.

export const INTERVALS = [0, 1, 3, 7, 15, 30]; // días hasta el siguiente repaso, por caja
export const MAX_BOX = INTERVALS.length - 1;
export const MASTERED_BOX = 4; // a partir de aquí se considera dominada

export function addDays(day, n) {
  const [y, m, d] = day.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + n));
  return date.toISOString().slice(0, 10);
}

export function review(prev, ok, day) {
  const s = prev ?? { box: 0, ok: 0, ko: 0 };
  const box = ok ? Math.min(MAX_BOX, s.box + 1) : 1;
  return { box, due: addDays(day, ok ? INTERVALS[box] : 0), ok: s.ok + (ok ? 1 : 0), ko: s.ko + (ok ? 0 : 1) };
}

export const isDue = (s, day) => Boolean(s) && s.box > 0 && s.due <= day;

// Cola de una sesión: primero las pendientes (las más atrasadas antes) y
// después hasta `newLimit` nuevas, en el orden del mazo.
export function sessionQueue(cards, states, day, newLimit = 15) {
  const due = cards.filter((c) => isDue(states[c.id], day)).sort((a, b) => states[a.id].due.localeCompare(states[b.id].due));
  const fresh = cards.filter((c) => !states[c.id]).slice(0, newLimit);
  return [...due, ...fresh];
}

export function deckStats(cards, states, day) {
  let nuevas = 0;
  let pendientes = 0;
  let dominadas = 0;
  for (const c of cards) {
    const s = states[c.id];
    if (!s) nuevas++;
    else {
      if (isDue(s, day)) pendientes++;
      if (s.box >= MASTERED_BOX) dominadas++;
    }
  }
  return { total: cards.length, nuevas, pendientes, dominadas, vistas: cards.length - nuevas };
}
