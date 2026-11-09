// Ruta «Legislación y Administración». Dos herramientas:
//   - «flashcards»: repaso espaciado de las tarjetas de data/legislacion
//     (plazos, mayorías, cifras, normas) con cajas de Leitner.
//   - «test»: tests por bloque de temas que mezclan preguntas reales del
//     banco, las de las fichas del temario y otras generadas a partir de
//     las tarjetas (engine/repaso/pool.js). Se supera con un 80 %.

export const legislacion = [
  {
    id: 'lg-repaso',
    type: 'flashcards',
    title: 'Repaso espaciado: plazos, mayorías y artículos',
    summary: 'Tarjetas que vuelven justo cuando estás a punto de olvidarlas.',
    body: `La legislación del Bloque I tiene mucho dato puro: plazos, mayorías, números de ley, artículos. No se razona: se **memoriza**. Y para memorizar, lo que mejor funciona es la **repetición espaciada**.

## Cómo funciona
Cada tarjeta está en una **caja**. Mira la pregunta, intenta responder de memoria y después descubre la respuesta:
- Si la sabías, sube de caja y tardará más en volver: **1, 3, 7, 15 y 30 días**.
- Si no, vuelve a la primera caja y te la vuelve a preguntar hoy mismo.

Así dedicas el tiempo a lo que se te olvida, no a lo que ya sabes. Cada día te salen las tarjetas que tocan y unas cuantas nuevas. Con **5 minutos diarios** basta. Sé honesto al responder: si dudaste, cuenta como fallo.

La lección se completa cuando has visto todas las tarjetas al menos una vez.`,
    temas: ['B1T01', 'B1T02', 'B1T03', 'B1T04', 'B1T05', 'B1T06', 'B1T07', 'B1T08', 'B1T09'],
  },
  {
    id: 'lg-test-constitucion',
    type: 'test',
    title: 'Test: Constitución, Cortes y Gobierno',
    summary: 'Temas 1 a 3: derechos, Corona, Cortes, Tribunal Constitucional y Gobierno.',
    body: 'Diez preguntas al azar de los temas 1 a 3 del Bloque I: reales de examen, de las fichas del temario y de los datos que hay que memorizar. Cada ronda es distinta. Se supera con **8 de 10**.',
    temas: ['B1T01', 'B1T02', 'B1T03'],
  },
  {
    id: 'lg-test-empleo',
    type: 'test',
    title: 'Test: empleo público, transparencia e igualdad',
    summary: 'Temas 4 y 5: TREBEP, Ley 19/2013, Agenda 2030, igualdad y discapacidad.',
    body: 'Diez preguntas al azar de los temas 4 y 5 del Bloque I. Se supera con **8 de 10**.',
    temas: ['B1T04', 'B1T05'],
  },
  {
    id: 'lg-test-digital',
    type: 'test',
    title: 'Test: firma electrónica y protección de datos',
    summary: 'Temas 6 y 7: eIDAS, certificados, DNIe, RGPD y LOPDGDD.',
    body: 'Diez preguntas al azar de los temas 6 y 7 del Bloque I. Se supera con **8 de 10**.',
    temas: ['B1T06', 'B1T07'],
  },
  {
    id: 'lg-test-electronica',
    type: 'test',
    title: 'Test: procedimiento y administración electrónica',
    summary: 'Temas 8 y 9: Ley 39/2015, ENS, ENI, sedes, Cl@ve y servicios comunes.',
    body: 'Diez preguntas al azar de los temas 8 y 9 del Bloque I. Se supera con **8 de 10**.',
    temas: ['B1T08', 'B1T09'],
  },
];
