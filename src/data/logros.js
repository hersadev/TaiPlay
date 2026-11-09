// Logros y niveles. Todo se calcula a partir del progreso guardado (ctx):
//   { lessons, answers, attempts, streak, days, questions }
// donde questions son las preguntas del banco (se pasan desde fuera para que
// este módulo no dependa de los JSON y se pueda probar con node --test).
//
// Cada logro tiene check(ctx) → boolean y, si es de contador, progress(ctx)
// → [actual, objetivo] para pintar la barra de lo que falta.

import { TRACKS } from '../lessons/index.js';
import { TEMAS, BLOQUES } from './temario/index.js';
import { today } from '../utils/dates.js';

const done = (ctx, id) => Boolean(ctx.lessons[id]?.done);
const trackLessons = (id) => TRACKS.find((t) => t.id === id)?.lessons ?? [];
const trackProgress = (id) => (ctx) => [trackLessons(id).filter((l) => done(ctx, l.id)).length, trackLessons(id).length];
const temasDone = (ctx, list = TEMAS) => list.filter((t) => done(ctx, t.id)).length;
const answered = (ctx) => Object.keys(ctx.answers).length;
const correct = (ctx) => Object.values(ctx.answers).filter((a) => a.last === 'ok').length;
const examAttempts = (ctx, kind) => ctx.attempts.filter((a) => a.kind === kind);
const bestPct = (ctx, kind) => Math.max(0, ...examAttempts(ctx, kind).map((a) => (a.total ? a.net / a.total : 0)));

// Días seguidos de estudio, contando hasta hoy (o hasta ayer, para no
// perder la racha por la mañana antes de haber estudiado).
export function dayStreak(days, now = new Date()) {
  const set = new Set(days);
  const d = new Date(now);
  if (!set.has(today(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (set.has(today(d))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

// Un tema está dominado si se han acertado (en el último intento) todas sus
// preguntas no anuladas, y tiene al menos 3.
const temasDominados = (ctx) =>
  TEMAS.filter((t) => {
    const qs = ctx.questions.filter((q) => q.tema === t.id && !q.annulled);
    return qs.length >= 3 && qs.every((q) => ctx.answers[q.id]?.last === 'ok');
  }).length;

const counter = (fn, target) => ({ check: (ctx) => fn(ctx) >= target, progress: (ctx) => [Math.min(fn(ctx), target), target] });
const fromProgress = (progress) => ({ check: (ctx) => { const [a, b] = progress(ctx); return b > 0 && a >= b; }, progress });

export const CATEGORIES = [
  { id: 'inicio', title: 'Primeros pasos' },
  { id: 'aprende', title: 'Aprende' },
  { id: 'temario', title: 'Temario' },
  { id: 'preguntas', title: 'Preguntas de examen' },
  { id: 'examen', title: 'Supuestos y simulacros' },
  { id: 'constancia', title: 'Constancia' },
];

export const LOGROS = [
  { id: 'primer-paso', cat: 'inicio', icon: '👣', name: 'Primer paso', desc: 'Completa tu primera lección o ficha del temario.', ...counter((c) => Object.values(c.lessons).filter((l) => l.done).length, 1) },
  { id: 'primera-respuesta', cat: 'inicio', icon: '✅', name: 'Primera de muchas', desc: 'Acierta tu primera pregunta de examen.', ...counter(correct, 1) },
  { id: 'primer-dia', cat: 'inicio', icon: '🌱', name: 'Aquí empieza todo', desc: 'Estudia tu primer día con TaiPlay.', ...counter((c) => c.days.length, 1) },

  { id: 'ruta-fundamentos', cat: 'aprende', icon: '🧠', name: 'Bases sólidas', desc: 'Completa la ruta «Empieza desde cero».', ...fromProgress(trackProgress('fundamentos')) },
  { id: 'ruta-linux', cat: 'aprende', icon: '🐧', name: 'Pingüino', desc: 'Completa la ruta de Linux y la terminal.', ...fromProgress(trackProgress('linux')) },
  { id: 'sysadmin', cat: 'aprende', icon: '🖥️', name: 'Administrador de web01', desc: 'Supera la práctica de administrar el servidor del supuesto de 2025.', check: (c) => done(c, 'lx-sistema') },
  { id: 'ruta-docker', cat: 'aprende', icon: '🐳', name: 'Capitán de contenedores', desc: 'Completa la ruta de Docker.', ...fromProgress(trackProgress('docker')) },
  { id: 'sql-join', cat: 'aprende', icon: '🔗', name: 'Maestro del JOIN', desc: 'Supera la práctica de JOIN.', check: (c) => done(c, 'sql-join') },
  { id: 'ruta-bbdd', cat: 'aprende', icon: '🗄️', name: 'Arquitecto de datos', desc: 'Completa la ruta de Bases de datos y SQL.', ...fromProgress(trackProgress('bbdd')) },
  { id: 'subnetting', cat: 'aprende', icon: '🧮', name: 'Calculadora humana', desc: 'Supera los dos bloques de ejercicios de subnetting.', check: (c) => done(c, 'rd-subnet-basico') && done(c, 'rd-subnet-dividir') },
  { id: 'cisco', cat: 'aprende', icon: '🔌', name: 'Consola Cisco', desc: 'Configura la SVI, el DHCP relay y el troncal del switch de distribución.', check: (c) => done(c, 'rd-ios-svi') },
  { id: 'ruta-redes', cat: 'aprende', icon: '🌐', name: 'Señor de las redes', desc: 'Completa la ruta de Redes y comunicaciones.', ...fromProgress(trackProgress('redes')) },
  { id: 'ruta-seguridad', cat: 'aprende', icon: '🛡️', name: 'Guardián del ENS', desc: 'Completa la ruta de Seguridad.', ...fromProgress(trackProgress('seguridad')) },
  { id: 'js-ejecutado', cat: 'aprende', icon: '🟨', name: 'Lo he visto con mis ojos', desc: 'Resuelve todos los ejercicios de JavaScript.', check: (c) => ['pg-js-tipos', 'pg-js-control', 'pg-js-funciones', 'pg-js-async'].every((id) => done(c, id)) },
  { id: 'ruta-programacion', cat: 'aprende', icon: '💻', name: 'Lector de código', desc: 'Completa la ruta de Programación.', ...fromProgress(trackProgress('programacion')) },
  { id: 'ruta-legislacion', cat: 'aprende', icon: '⚖️', name: 'Jurista de guardia', desc: 'Completa la ruta de Legislación y Administración.', ...fromProgress(trackProgress('legislacion')) },
  { id: 'memoria-30', cat: 'aprende', icon: '🐘', name: 'Memoria de elefante', desc: 'Domina 30 tarjetas del repaso espaciado (caja 4 o más).', ...counter((c) => Object.values(c.cards ?? {}).filter((x) => x.box >= 4).length, 30) },

  { id: 'ficha-1', cat: 'temario', icon: '📘', name: 'Primera ficha', desc: 'Supera el test de una ficha del temario.', ...counter((c) => temasDone(c), 1) },
  { id: 'fichas-10', cat: 'temario', icon: '📚', name: 'Diez temas', desc: 'Supera 10 fichas del temario.', ...counter((c) => temasDone(c), 10) },
  ...BLOQUES.map((b) => ({
    id: `bloque-${b.n}`,
    cat: 'temario',
    icon: ['⚖️', '💾', '🧩', '🌐'][b.n - 1],
    name: `Bloque ${b.roman} superado`,
    desc: `Supera todas las fichas del bloque ${b.roman}: ${b.title}.`,
    ...fromProgress((c) => [temasDone(c, TEMAS.filter((t) => t.bloque === b.n)), b.temas.length]),
  })),
  { id: 'temario-completo', cat: 'temario', icon: '🎓', name: 'Temario al completo', desc: 'Supera las 33 fichas del temario.', ...counter((c) => temasDone(c), TEMAS.length) },

  { id: 'preguntas-25', cat: 'preguntas', icon: '🎯', name: 'Calentando', desc: 'Responde 25 preguntas de examen distintas.', ...counter(answered, 25) },
  { id: 'preguntas-100', cat: 'preguntas', icon: '💯', name: 'Centenario', desc: 'Responde 100 preguntas de examen distintas.', ...counter(answered, 100) },
  {
    id: 'preguntas-todas',
    cat: 'preguntas',
    icon: '🗂️',
    name: 'Las he visto todas',
    desc: 'Responde todas las preguntas del banco (no anuladas) al menos una vez.',
    ...fromProgress((c) => {
      const valid = c.questions.filter((q) => !q.annulled);
      return [valid.filter((q) => c.answers[q.id]).length, valid.length];
    }),
  },
  { id: 'aciertos-50', cat: 'preguntas', icon: '⭐', name: 'Medio centenar', desc: 'Ten 50 preguntas acertadas (en tu último intento).', ...counter(correct, 50) },
  { id: 'racha-10', cat: 'preguntas', icon: '🔥', name: 'En racha', desc: 'Acierta 10 preguntas seguidas.', ...counter((c) => c.streak.best, 10) },
  { id: 'racha-25', cat: 'preguntas', icon: '☄️', name: 'Imparable', desc: 'Acierta 25 preguntas seguidas.', ...counter((c) => c.streak.best, 25) },
  { id: 'remontada', cat: 'preguntas', icon: '🔄', name: 'Aprender del error', desc: 'Acierta una pregunta que habías fallado antes.', check: (c) => Object.values(c.answers).some((a) => a.ko > 0 && a.last === 'ok') },
  { id: 'tema-dominado', cat: 'preguntas', icon: '🏅', name: 'Tema dominado', desc: 'Acierta todas las preguntas de examen de un tema del programa.', ...counter(temasDominados, 1) },

  { id: 'primer-supuesto', cat: 'examen', icon: '📝', name: 'Al toro', desc: 'Termina un supuesto práctico en modo examen.', ...counter((c) => examAttempts(c, 'supuesto').length, 1) },
  { id: 'supuesto-aprobado', cat: 'examen', icon: '✔️', name: 'Supuesto aprobado', desc: 'Consigue al menos la mitad de aciertos netos en un supuesto.', check: (c) => bestPct(c, 'supuesto') >= 0.5 },
  { id: 'primer-simulacro', cat: 'examen', icon: '⏱️', name: 'Prueba de fuego', desc: 'Termina un simulacro completo.', ...counter((c) => examAttempts(c, 'simulacro').length, 1) },
  { id: 'simulacro-70', cat: 'examen', icon: '🏆', name: 'Listo para el examen', desc: 'Saca al menos un 70 % de aciertos netos en un simulacro.', check: (c) => bestPct(c, 'simulacro') >= 0.7 },

  { id: 'dias-3', cat: 'constancia', icon: '📅', name: 'Tres en raya', desc: 'Estudia 3 días seguidos.', ...counter((c) => dayStreak(c.days), 3) },
  { id: 'dias-7', cat: 'constancia', icon: '🗓️', name: 'Semana completa', desc: 'Estudia 7 días seguidos.', ...counter((c) => dayStreak(c.days), 7) },
  { id: 'dias-30', cat: 'constancia', icon: '🌳', name: 'Hábito de opositor', desc: 'Acumula 30 días de estudio.', ...counter((c) => c.days.length, 30) },
];

// Experiencia y niveles: una forma sencilla de ver el avance de un vistazo.
export function xpOf(ctx, badges = {}) {
  const lessons = Object.entries(ctx.lessons).filter(([, l]) => l.done);
  const temas = lessons.filter(([id]) => /^B\dT\d\d$/.test(id)).length;
  return (
    (lessons.length - temas) * 20 +
    temas * 15 +
    correct(ctx) * 3 +
    answered(ctx) +
    ctx.attempts.length * 25 +
    Object.keys(badges).length * 10
  );
}

export const LEVELS = [
  { min: 0, name: 'Primeros pasos' },
  { min: 100, name: 'En marcha' },
  { min: 250, name: 'Cogiendo ritmo' },
  { min: 500, name: 'Constancia' },
  { min: 850, name: 'Buen nivel' },
  { min: 1300, name: 'Dominio' },
  { min: 1900, name: 'Experto en el temario' },
  { min: 2600, name: 'Preparado para el examen' },
];

export function levelOf(xp) {
  let i = 0;
  while (i + 1 < LEVELS.length && xp >= LEVELS[i + 1].min) i++;
  const next = LEVELS[i + 1];
  return { n: i + 1, name: LEVELS[i].name, xp, from: LEVELS[i].min, to: next?.min ?? null };
}

// Logros que se acaban de conseguir (no ganados todavía y con check cierto).
export function newlyEarned(ctx, badges) {
  return LOGROS.filter((l) => !badges[l.id] && l.check(ctx)).map((l) => l.id);
}
