import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { today } from '../utils/dates';
import { review } from '../engine/repaso/srs.js';
import { nextRepaso } from '../engine/repaso/falladas.js';

// Todo el progreso vive en el navegador (localStorage), sin backend:
//   lessons:  { [lessonId | temaId]: { done, objectives: [bool…], at } }
//   answers:  { [questionId]: { ok, ko, last: 'ok' | 'ko', at, box, due } }
//             (box y due: repaso espaciado de las falladas, ver
//             engine/repaso/falladas.js)
//   attempts: últimos simulacros/supuestos hechos en modo examen
//   settings: penalización por error y duración de los simulacros
//   badges:   { [logroId]: fecha en que se ganó }
//   streak:   aciertos seguidos en el banco { current, best }
//   days:     días (AAAA-MM-DD, hora local) en los que se ha estudiado
//   cards:    repaso espaciado de las tarjetas { [id]: { box, due, ok, ko } }
//   welcomed: si ya se ha visto (y cerrado) el panel de bienvenida
export const DEFAULT_SETTINGS = { penalty: 1 / 3, simulacroMin: 120, supuestoMin: 30 };

// localStorage puede no existir o lanzar (modo privado, almacenamiento
// bloqueado): en ese caso la app funciona igual, solo que sin guardar.
const safeStorage = createJSONStorage(() => {
  try {
    const k = '__taiplay_test__';
    localStorage.setItem(k, '1');
    localStorage.removeItem(k);
    return localStorage;
  } catch (_) {
    const mem = new Map();
    return { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v), removeItem: (k) => mem.delete(k) };
  }
});

// Marca hoy como día de estudio (sin duplicados; se guardan los últimos 400).
const withToday = (days) => (days.includes(today()) ? days : [...days, today()].slice(-400));

const EMPTY = {
  lessons: {},
  answers: {},
  attempts: [],
  settings: DEFAULT_SETTINGS,
  badges: {},
  streak: { current: 0, best: 0 },
  days: [],
  cards: {},
  welcomed: false,
};

export const useProgress = create(
  persist(
    (set) => ({
      ...EMPTY,

      saveObjectives: (id, objectives) =>
        set((s) => ({ lessons: { ...s.lessons, [id]: { ...s.lessons[id], objectives } }, days: withToday(s.days) })),

      completeLesson: (id) =>
        set((s) => ({
          lessons: { ...s.lessons, [id]: { ...s.lessons[id], done: true, at: Date.now() } },
          days: withToday(s.days),
        })),

      recordAnswer: (qid, ok) =>
        set((s) => {
          const prev = s.answers[qid] ?? { ok: 0, ko: 0 };
          const current = ok ? s.streak.current + 1 : 0;
          const { box, due } = nextRepaso(s.answers[qid], ok, today());
          return {
            answers: {
              ...s.answers,
              [qid]: { ok: prev.ok + (ok ? 1 : 0), ko: prev.ko + (ok ? 0 : 1), last: ok ? 'ok' : 'ko', at: Date.now(), box, due },
            },
            streak: { current, best: Math.max(s.streak.best, current) },
            days: withToday(s.days),
          };
        }),

      reviewCard: (id, ok) =>
        set((s) => ({ cards: { ...s.cards, [id]: review(s.cards[id], ok, today()) }, days: withToday(s.days) })),

      addAttempt: (attempt) => set((s) => ({ attempts: [attempt, ...s.attempts].slice(0, 100), days: withToday(s.days) })),

      grantBadges: (ids) =>
        set((s) => ({ badges: { ...s.badges, ...Object.fromEntries(ids.map((id) => [id, Date.now()])) } })),

      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

      markWelcomed: () => set({ welcomed: true }),

      reset: () => set(EMPTY),
    }),
    {
      name: 'taiplay:progress',
      version: 4,
      storage: safeStorage,
      // v1 → v2: llegan los logros, la racha y los días de estudio.
      // v2 → v3: llega el repaso espaciado (cards).
      // v3 → v4: el simulacro pasa de 100 a 120 min (bases de la convocatoria
      // de 2025); solo se cambia a quien conservaba el valor por defecto.
      migrate: (state, version) => {
        const next = { ...EMPTY, ...state };
        if (version < 4 && next.settings?.simulacroMin === 100) next.settings = { ...next.settings, simulacroMin: 120 };
        return next;
      },
    },
  ),
);
