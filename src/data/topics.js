// Temas con los que se etiqueta cada pregunta del banco. El orden sigue,
// a grandes rasgos, los bloques del temario del TAI.
export const TOPICS = [
  { id: 'constitucion', label: 'Constitución y Gobierno', block: 'I' },
  { id: 'legislacion', label: 'Legislación y empleo público', block: 'I' },
  { id: 'admin-electronica', label: 'Administración electrónica', block: 'I' },
  { id: 'proteccion-datos', label: 'Protección de datos', block: 'I' },
  { id: 'hardware', label: 'Hardware', block: 'II' },
  { id: 'datos', label: 'Estructuras de datos y algoritmos', block: 'II' },
  { id: 'so', label: 'Sistemas operativos', block: 'II' },
  { id: 'bbdd', label: 'Bases de datos y SQL', block: 'II' },
  { id: 'programacion', label: 'Programación', block: 'III' },
  { id: 'desarrollo-web', label: 'Desarrollo web', block: 'III' },
  { id: 'accesibilidad', label: 'Accesibilidad', block: 'III' },
  { id: 'ing-software', label: 'Ingeniería del software', block: 'III' },
  { id: 'virtualizacion', label: 'Virtualización y contenedores', block: 'IV' },
  { id: 'redes', label: 'Redes y comunicaciones', block: 'IV' },
  { id: 'seguridad', label: 'Seguridad', block: 'IV' },
];

export const topicLabel = (id) => TOPICS.find((t) => t.id === id)?.label ?? id;
