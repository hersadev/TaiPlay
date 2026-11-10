// Exámenes oficiales del TAI (ingreso libre). Cada JSON trae el cuestionario
// extraído del PDF del INAP, la respuesta de la plantilla DEFINITIVA oficial
// (null si la pregunta se anuló), el tema y una explicación.
//
// El modelo B de cada año contiene las mismas preguntas en otro orden, así
// que solo se incluye el modelo A.
import tai2024A from './tai2024A.json';
import tai2025A from './tai2025A.json';
import tai2025X from './tai2025X.json';
import tai2022 from './tai2022.json';
import tai2019 from './tai2019.json';
import { PROPIAS as PROPIAS_RAW } from '../propias/preguntas.js';

export const EXAMS = [tai2025A, tai2025X, tai2024A, tai2022, tai2019];

// Todas las preguntas, con el examen y la parte a la que pertenecen.
export const ALL_QUESTIONS = EXAMS.flatMap((exam) =>
  exam.parts.flatMap((part) =>
    part.questions.map((q) => ({ ...q, examId: exam.id, examTitle: exam.title, partId: part.id, partTitle: part.title })),
  ),
);

// Preguntas propias de TaiPlay (no oficiales) para los temas que menos han
// caído. Van al banco y a los tests por tema, nunca a simulacros ni al Road.
export const PROPIAS = PROPIAS_RAW.map((q) => ({ ...q, oficial: false, examId: 'propias', examTitle: 'Pregunta no oficial', partId: 'propia', partTitle: '' }));

// Todo lo que se practica en el banco.
export const BANK = [...ALL_QUESTIONS, ...PROPIAS];

const byId = new Map(BANK.map((q) => [q.id, q]));
export const findQuestion = (id) => byId.get(id) ?? null;

export const findExam = (id) => EXAMS.find((e) => e.id === id) ?? null;
