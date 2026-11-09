// Rutas de aprendizaje. Cada ruta agrupa lecciones en orden; las que aún no
// tienen lecciones muestran «próximamente» y enlazan a sus preguntas de
// examen en el banco (topics, ver data/topics.js). temas son las fichas del
// temario oficial relacionadas (data/temario).

import { fundamentos } from './fundamentos.js';
import { linux } from './linux.js';
import { docker } from './docker.js';
import { bbdd } from './bbdd.js';

export const TRACKS = [
  {
    id: 'fundamentos',
    title: 'Empieza desde cero',
    icon: '◎',
    description: 'Lo imprescindible si nunca has estudiado informática: hardware, binario, sistemas operativos, redes y lógica de programación.',
    lessons: fundamentos,
    topics: ['hardware'],
    temas: ['B2T01', 'B2T02', 'B2T03', 'B2T04', 'B4T07'],
  },
  {
    id: 'linux',
    title: 'Linux y la terminal',
    icon: '›_',
    description: 'De tu primera orden a administrar un servidor como en el supuesto práctico: ficheros, permisos, logs, servicios y red.',
    lessons: linux,
    topics: ['so'],
    temas: ['B2T04', 'B4T01'],
  },
  {
    id: 'docker',
    title: 'Docker y contenedores',
    icon: '▣',
    description: 'Imágenes, contenedores y su ciclo de vida completo, hasta el nivel exacto que pide el examen, más una introducción a Kubernetes.',
    lessons: docker,
    topics: ['virtualizacion'],
    temas: ['B4T02', 'B4T03'],
  },
  {
    id: 'redes',
    title: 'Redes y comunicaciones',
    icon: '⇄',
    description: 'Subnetting paso a paso, OSI/TCP-IP, protocolos y puertos, VLAN y Cisco IOS.',
    lessons: [],
    topics: ['redes'],
    temas: ['B4T04', 'B4T06', 'B4T07', 'B4T08', 'B4T10'],
  },
  {
    id: 'bbdd',
    title: 'Bases de datos y SQL',
    icon: '▤',
    description: 'SQL de verdad en el navegador sobre las tablas de los supuestos del examen: consultas, JOIN, GROUP BY, subconsultas, restricciones y disparadores.',
    lessons: bbdd,
    topics: ['bbdd'],
    temas: ['B2T05', 'B3T01', 'B3T03', 'B4T02'],
  },
  {
    id: 'programacion',
    title: 'Programación',
    icon: '{}',
    description: 'Java, C#/.NET, JavaScript y Python al nivel del examen: leer código, predecir resultados y detectar errores.',
    lessons: [],
    topics: ['programacion', 'datos', 'desarrollo-web', 'ing-software'],
    temas: ['B2T03', 'B3T02', 'B3T04', 'B3T05', 'B3T06', 'B3T07', 'B3T09'],
  },
  {
    id: 'seguridad',
    title: 'Seguridad',
    icon: '⛨',
    description: 'ENS, herramientas del CCN-CERT, tipos de ataque, copias de seguridad y criptografía básica.',
    lessons: [],
    topics: ['seguridad'],
    temas: ['B4T05', 'B4T09', 'B1T08'],
  },
  {
    id: 'legislacion',
    title: 'Legislación y Administración',
    icon: '§',
    description: 'Constitución, Ley 39/2015, transparencia, protección de datos y administración electrónica.',
    lessons: [],
    topics: ['constitucion', 'legislacion', 'admin-electronica', 'proteccion-datos', 'accesibilidad'],
    temas: ['B1T01', 'B1T02', 'B1T03', 'B1T04', 'B1T05', 'B1T06', 'B1T07', 'B1T08', 'B1T09', 'B3T08'],
  },
];

export const ALL_LESSONS = TRACKS.flatMap((t) => t.lessons.map((l) => ({ ...l, trackId: t.id })));

export const findLesson = (id) => ALL_LESSONS.find((l) => l.id === id) ?? null;
export const findTrack = (id) => TRACKS.find((t) => t.id === id) ?? null;
