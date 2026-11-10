import { useCallback, useEffect, useMemo, useState } from 'react';
import { useProgress } from '../store/progress';
import { ALL_QUESTIONS } from '../data/exams';
import { LOGROS, newlyEarned, xpOf, levelOf } from '../data/logros';

// Contexto con el que se evalúan los logros, a partir del progreso guardado.
export function useLogrosContext() {
  const { lessons, answers, attempts, streak, days, badges, cards, road, roadLoco } = useProgress();
  return useMemo(
    () => ({ ctx: { lessons, answers, attempts, streak, days, cards, road, roadLoco, questions: ALL_QUESTIONS }, badges }),
    [lessons, answers, attempts, streak, days, cards, road, roadLoco, badges],
  );
}

export function useLevel() {
  const { ctx, badges } = useLogrosContext();
  return useMemo(() => levelOf(xpOf(ctx, badges)), [ctx, badges]);
}

// Vigila el progreso y concede los logros nuevos. Devuelve la cola de logros
// por anunciar (y cómo descartar el primero). Si al abrir la app hay muchos
// pendientes de golpe (progreso de antes de existir los logros), se conceden
// en silencio y se anuncian agrupados.
export function useAchievements() {
  const { ctx, badges } = useLogrosContext();
  const grantBadges = useProgress((s) => s.grantBadges);
  const [queue, setQueue] = useState([]);

  useEffect(() => {
    const ids = newlyEarned(ctx, badges);
    if (!ids.length) return;
    grantBadges(ids);
    const earned = LOGROS.filter((l) => ids.includes(l.id));
    setQueue((q) =>
      earned.length > 3
        ? [...q, { id: `grupo-${Date.now()}`, icon: '🏆', name: `¡${earned.length} logros desbloqueados!`, desc: 'Míralos todos en Logros.' }]
        : [...q, ...earned],
    );
  }, [ctx, badges, grantBadges]);

  const dismiss = useCallback(() => setQueue((q) => q.slice(1)), []);
  return { current: queue[0] ?? null, dismiss };
}
