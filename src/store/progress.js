import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Todo el progreso vive en el navegador (localStorage), sin backend:
//   lessons:  { [lessonId]: { done, objectives: [bool…], at } }
//   answers:  { [questionId]: { ok, ko, last: 'ok' | 'ko', at } }
//   attempts: últimos simulacros/supuestos hechos en modo examen
//   settings: penalización por error y duración de los simulacros
export const DEFAULT_SETTINGS = { penalty: 1 / 3, simulacroMin: 100, supuestoMin: 30 };

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

export const useProgress = create(
  persist(
    (set) => ({
      lessons: {},
      answers: {},
      attempts: [],
      settings: DEFAULT_SETTINGS,

      saveObjectives: (id, objectives) =>
        set((s) => ({ lessons: { ...s.lessons, [id]: { ...s.lessons[id], objectives } } })),

      completeLesson: (id) =>
        set((s) => ({ lessons: { ...s.lessons, [id]: { ...s.lessons[id], done: true, at: Date.now() } } })),

      recordAnswer: (qid, ok) =>
        set((s) => {
          const prev = s.answers[qid] ?? { ok: 0, ko: 0 };
          return {
            answers: {
              ...s.answers,
              [qid]: { ok: prev.ok + (ok ? 1 : 0), ko: prev.ko + (ok ? 0 : 1), last: ok ? 'ok' : 'ko', at: Date.now() },
            },
          };
        }),

      addAttempt: (attempt) => set((s) => ({ attempts: [attempt, ...s.attempts].slice(0, 100) })),

      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

      reset: () => set({ lessons: {}, answers: {}, attempts: [], settings: DEFAULT_SETTINGS }),
    }),
    { name: 'taiplay:progress', version: 1, storage: safeStorage },
  ),
);
