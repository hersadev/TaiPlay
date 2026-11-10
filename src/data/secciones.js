// Apartados de la plataforma: los usan las tarjetas de la portada y el panel
// de bienvenida, para que la descripción de cada uno esté en un solo sitio.
export const SECTIONS = [
  {
    path: 'aprende',
    title: 'Aprende',
    text: 'Rutas guiadas desde cero: hardware, redes, Linux con una terminal de verdad en el navegador, Docker…',
    icon: '◎',
  },
  {
    path: 'temario',
    title: 'Temario',
    text: 'Los 33 temas del programa oficial con fichas de repaso, test y las preguntas que han caído de cada uno.',
    icon: '§',
  },
  {
    path: 'preguntas',
    title: 'Banco de preguntas',
    text: 'Las preguntas reales de los exámenes, por temas, con la respuesta oficial explicada.',
    icon: '?',
  },
  {
    path: 'road',
    title: 'Road',
    text: 'Un camino por todo el temario: tramos de 10 preguntas seguidas. Si fallas una, vuelves al principio del tramo.',
    icon: '⚑',
  },
  {
    path: 'supuestos',
    title: 'Supuestos prácticos',
    text: 'Los diez supuestos reales, con su enunciado y su modelo de datos, en modo estudio o contra el reloj.',
    icon: '▤',
  },
  {
    path: 'editor',
    title: 'Editor',
    text: 'Escribe y ejecuta JavaScript en el navegador para practicar lo que quieras, con una API de alumnos simulada.',
    icon: '{}',
  },
  {
    path: 'simulacro',
    title: 'Simulacro',
    text: 'El ejercicio completo, cronometrado y corregido con penalización: un examen pasado o uno mezclado con preguntas de todos los años.',
    icon: '⏱',
  },
  {
    path: 'progreso',
    title: 'Progreso',
    text: 'Cómo evoluciona tu nota en los simulacros, tus temas más flojos y cuánto te queda por ver del programa.',
    icon: '↗',
  },
];

export const LOGROS_SECTION = {
  path: 'logros',
  title: 'Logros',
  text: 'Medallas y niveles que ganas al estudiar: rachas de aciertos, días seguidos, rutas completadas…',
  icon: '🏆',
};
