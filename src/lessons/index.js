// Rutas de aprendizaje. Cada ruta agrupa lecciones en orden; las que aún no
// tienen lecciones muestran «próximamente» y enlazan a sus preguntas de
// examen en el banco (por tema, ver data/topics.js).

import { fundamentos } from './fundamentos.js';
import { linux } from './linux.js';
import { docker } from './docker.js';

export const TRACKS = [
  {
    id: 'fundamentos',
    title: 'Empieza desde cero',
    icon: '◎',
    description: 'Lo imprescindible si nunca has estudiado informática: hardware, binario, sistemas operativos, redes y lógica de programación.',
    lessons: fundamentos,
    topics: ['hardware'],
  },
  {
    id: 'linux',
    title: 'Linux y la terminal',
    icon: '›_',
    description: 'De tu primera orden a administrar un servidor como en el supuesto práctico: ficheros, permisos, logs, servicios y red.',
    lessons: linux,
    topics: ['so'],
  },
  {
    id: 'docker',
    title: 'Docker y contenedores',
    icon: '▣',
    description: 'Imágenes, contenedores y su ciclo de vida completo, hasta el nivel exacto que pide el examen, más una introducción a Kubernetes.',
    lessons: docker,
    topics: ['virtualizacion'],
  },
  {
    id: 'redes',
    title: 'Redes y comunicaciones',
    icon: '⇄',
    description: 'Subnetting paso a paso, OSI/TCP-IP, protocolos y puertos, VLAN y Cisco IOS.',
    lessons: [],
    topics: ['redes'],
  },
  {
    id: 'bbdd',
    title: 'Bases de datos y SQL',
    icon: '▤',
    description: 'Modelo entidad-relación, normalización y SQL ejecutando consultas de verdad sobre las tablas de los supuestos.',
    lessons: [],
    topics: ['bbdd'],
  },
  {
    id: 'programacion',
    title: 'Programación',
    icon: '{}',
    description: 'Java, C#/.NET, JavaScript y Python al nivel del examen: leer código, predecir resultados y detectar errores.',
    lessons: [],
    topics: ['programacion', 'datos', 'desarrollo-web', 'ing-software'],
  },
  {
    id: 'seguridad',
    title: 'Seguridad',
    icon: '⛨',
    description: 'ENS, herramientas del CCN-CERT, tipos de ataque, copias de seguridad y criptografía básica.',
    lessons: [],
    topics: ['seguridad'],
  },
  {
    id: 'legislacion',
    title: 'Legislación y Administración',
    icon: '§',
    description: 'Constitución, Ley 39/2015, transparencia, protección de datos y administración electrónica.',
    lessons: [],
    topics: ['constitucion', 'legislacion', 'admin-electronica', 'proteccion-datos', 'accesibilidad'],
  },
];

export const ALL_LESSONS = TRACKS.flatMap((t) => t.lessons.map((l) => ({ ...l, trackId: t.id })));

export const findLesson = (id) => ALL_LESSONS.find((l) => l.id === id) ?? null;
export const findTrack = (id) => TRACKS.find((t) => t.id === id) ?? null;
