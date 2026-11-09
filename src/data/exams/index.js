// Exámenes oficiales del TAI (ingreso libre). Cada JSON trae el cuestionario
// extraído del PDF del INAP, la respuesta de la plantilla DEFINITIVA oficial
// (null si la pregunta se anuló), el tema y una explicación.
//
// El modelo B de cada año contiene las mismas preguntas en otro orden, así
// que solo se incluye el modelo A.
import tai2024A from './tai2024A.json';
import tai2025A from './tai2025A.json';

export const EXAMS = [tai2025A, tai2024A];

// Todas las preguntas, con el examen y la parte a la que pertenecen.
export const ALL_QUESTIONS = EXAMS.flatMap((exam) =>
  exam.parts.flatMap((part) =>
    part.questions.map((q) => ({ ...q, examId: exam.id, examTitle: exam.title, partId: part.id, partTitle: part.title })),
  ),
);

const byId = new Map(ALL_QUESTIONS.map((q) => [q.id, q]));
export const findQuestion = (id) => byId.get(id) ?? null;

export const findExam = (id) => EXAMS.find((e) => e.id === id) ?? null;
