// Tarjetas de memorización del Bloque I: plazos, mayorías, cifras y
// artículos que hay que saberse de memoria. Se repasan con repetición
// espaciada (engine/repaso) y alimentan los tests por tema.
//
//   id    estable (el progreso se guarda por id: no se renombran)
//   tema  tema oficial (B1T01…)
//   q, a  pregunta y respuesta corta
//   src   norma y artículo, para ir a la fuente
//   kind  tipo de dato: los tests generan las opciones falsas con otras
//         respuestas del mismo tipo (plazo, años, mayoria, organo, norma).
//         Si el tipo no da opciones razonables, se ponen a mano en `wrong`.

export const TARJETAS = [
  // ── B1T01 · Constitución: derechos y Corona ────────────────────────────
  { id: 'ce-fecha', tema: 'B1T01', kind: 'dato', q: '¿Cuándo se aprobó la Constitución en referéndum?', a: '6 de diciembre de 1978', wrong: ['27 de diciembre de 1978', '29 de diciembre de 1978', '31 de octubre de 1978'], src: 'CE' },
  { id: 'ce-boe', tema: 'B1T01', kind: 'dato', q: '¿Cuándo se publicó la Constitución en el BOE?', a: '29 de diciembre de 1978', wrong: ['6 de diciembre de 1978', '27 de diciembre de 1978', '1 de enero de 1979'], src: 'CE' },
  { id: 'ce-articulos', tema: 'B1T01', kind: 'numero', q: '¿Cuántos artículos tiene la Constitución?', a: '169', wrong: ['155', '196', '200'], src: 'CE' },
  { id: 'ce-fundamentales', tema: 'B1T01', kind: 'dato', q: '¿Qué artículos recogen los derechos fundamentales y libertades públicas (Sección 1ª)?', a: 'Arts. 15 a 29', wrong: ['Arts. 14 a 38', 'Arts. 30 a 38', 'Arts. 39 a 52'], src: 'CE, Título I, Cap. II, Secc. 1ª' },
  { id: 'ce-propiedad', tema: 'B1T01', kind: 'dato', q: '¿En qué artículo está el derecho a la propiedad privada (que no es fundamental)?', a: 'Art. 33', wrong: ['Art. 18', 'Art. 27', 'Art. 14'], src: 'art. 33 CE' },
  { id: 'ce-amparo', tema: 'B1T01', kind: 'dato', q: '¿Qué derechos se protegen con recurso de amparo ante el TC?', a: 'Arts. 14 a 29 y la objeción de conciencia (30.2)', wrong: ['Todo el Título I', 'Solo los arts. 15 a 29', 'Arts. 30 a 52'], src: 'art. 53.2 CE' },
  { id: 'ce-lo', tema: 'B1T01', kind: 'mayoria', q: 'Aprobar, modificar o derogar una ley orgánica exige…', a: 'Mayoría absoluta del Congreso en una votación final sobre el conjunto', src: 'art. 81 CE' },
  { id: 'ce-mayoria-edad', tema: 'B1T01', kind: 'numero', q: '¿A qué edad se alcanza la mayoría de edad según la Constitución?', a: '18', wrong: ['16', '21', '14'], src: 'art. 12 CE' },
  { id: 'ce-detencion', tema: 'B1T01', kind: 'plazo', q: 'Duración máxima de la detención preventiva antes de pasar a disposición judicial', a: '72 horas', src: 'art. 17.2 CE' },
  { id: 'ce-alarma', tema: 'B1T01', kind: 'plazo', q: 'Duración inicial máxima del estado de alarma (declarado por el Gobierno)', a: '15 días', src: 'art. 116.2 CE' },
  { id: 'ce-excepcion', tema: 'B1T01', kind: 'plazo', q: 'Duración máxima del estado de excepción (prorrogable por otro periodo igual)', a: '30 días', src: 'art. 116.3 CE' },
  { id: 'ce-sitio', tema: 'B1T01', kind: 'mayoria', q: '¿Con qué mayoría declara el Congreso el estado de sitio?', a: 'Mayoría absoluta del Congreso', src: 'art. 116.4 CE' },
  { id: 'ce-reforma-167', tema: 'B1T01', kind: 'mayoria', q: 'Reforma constitucional ordinaria (art. 167): mayoría necesaria en cada Cámara', a: 'Tres quintos de cada Cámara', src: 'art. 167 CE' },
  { id: 'ce-reforma-168', tema: 'B1T01', kind: 'mayoria', q: 'Revisión total o de las partes protegidas (art. 168): mayoría para aprobarla', a: 'Dos tercios de cada Cámara, disolución y referéndum obligatorio', src: 'art. 168 CE' },
  { id: 'ce-reformas', tema: 'B1T01', kind: 'dato', q: '¿Cuántas veces se ha reformado la Constitución?', a: 'Cuatro: arts. 13.2 (1992), 135 (2011), 49 (2024) y 69.3 (2026)', wrong: ['Tres: arts. 13.2 (1992), 135 (2011) y 49 (2024)', 'Dos: arts. 13.2 (1992) y 135 (2011)', 'Ninguna'], src: 'art. 167 CE' },
  { id: 'ce-ilp', tema: 'B1T01', kind: 'numero', q: '¿Cuántas firmas exige la iniciativa legislativa popular?', a: '500.000', wrong: ['100.000', '250.000', '1.000.000'], src: 'art. 87.3 CE' },
  { id: 'ce-sancion', tema: 'B1T01', kind: 'plazo', q: 'Plazo del Rey para sancionar las leyes aprobadas por las Cortes', a: '15 días', src: 'art. 91 CE' },

  // ── B1T02 · Cortes, TC y Defensor del Pueblo ──────────────────────────
  { id: 'cg-diputados', tema: 'B1T02', kind: 'dato', q: '¿Cuántos diputados puede tener el Congreso según la Constitución?', a: 'Entre 300 y 400 (la ley fija 350)', wrong: ['Exactamente 350', 'Entre 250 y 350', 'Entre 350 y 450'], src: 'art. 68.1 CE' },
  { id: 'cg-senadores', tema: 'B1T02', kind: 'numero', q: '¿Cuántos senadores se eligen por cada provincia (en general)?', a: '4', wrong: ['2', '3', '5'], src: 'art. 69.2 CE' },
  { id: 'cg-legislatura', tema: 'B1T02', kind: 'años', q: 'Duración del mandato de diputados y senadores', a: '4 años', src: 'arts. 68.4 y 69.6 CE' },
  { id: 'cg-diputacion', tema: 'B1T02', kind: 'numero', q: 'Número mínimo de miembros de la Diputación Permanente', a: '21', wrong: ['15', '25', '30'], src: 'art. 78 CE' },
  { id: 'cg-veto', tema: 'B1T02', kind: 'plazo', q: 'Plazo del Senado para vetar o enmendar un proyecto de ley', a: '2 meses', src: 'art. 90.2 CE' },
  { id: 'cg-veto-mayoria', tema: 'B1T02', kind: 'mayoria', q: '¿Con qué mayoría aprueba el Senado un veto?', a: 'Mayoría absoluta del Senado', src: 'art. 90.2 CE' },
  { id: 'cg-aforados', tema: 'B1T02', kind: 'organo', q: '¿Quién juzga las causas contra diputados y senadores?', a: 'La Sala de lo Penal del Tribunal Supremo', src: 'art. 71.3 CE' },
  { id: 'tc-magistrados', tema: 'B1T02', kind: 'numero', q: '¿Cuántos magistrados tiene el Tribunal Constitucional?', a: '12', wrong: ['9', '10', '15'], src: 'art. 159.1 CE' },
  { id: 'tc-mandato', tema: 'B1T02', kind: 'años', q: 'Mandato de los magistrados del TC (se renuevan por terceras partes cada 3 años)', a: '9 años', src: 'art. 159.3 CE' },
  { id: 'tc-propuesta', tema: 'B1T02', kind: 'dato', q: '¿Quién propone a los magistrados del TC?', a: 'Congreso 4, Senado 4, Gobierno 2 y CGPJ 2', wrong: ['Congreso 6 y Senado 6', 'Congreso 4, Senado 4 y CGPJ 4', 'Gobierno 4, CGPJ 4 y Cortes 4'], src: 'art. 159.1 CE' },
  { id: 'tc-presidente', tema: 'B1T02', kind: 'años', q: 'Mandato del Presidente del Tribunal Constitucional', a: '3 años', src: 'art. 160 CE' },
  { id: 'dp-mandato', tema: 'B1T02', kind: 'años', q: '¿Por cuánto tiempo eligen las Cortes al Defensor del Pueblo?', a: '5 años', src: 'LO 3/1981, art. 2' },
  { id: 'dp-mayoria', tema: 'B1T02', kind: 'mayoria', q: 'Mayoría para elegir al Defensor del Pueblo', a: 'Tres quintos de cada Cámara', src: 'LO 3/1981, art. 2' },
  { id: 'cgpj', tema: 'B1T02', kind: 'dato', q: 'Composición del Consejo General del Poder Judicial', a: 'El Presidente del Tribunal Supremo y 20 vocales, por 5 años', wrong: ['12 vocales por 9 años', '20 vocales por 4 años', 'El Ministro de Justicia y 12 vocales'], src: 'art. 122.3 CE' },

  // ── B1T03 · El Gobierno ───────────────────────────────────────────────
  { id: 'gob-ley', tema: 'B1T03', kind: 'norma', q: '¿Qué ley regula el Gobierno?', a: 'Ley 50/1997', src: 'Ley 50/1997, del Gobierno' },
  { id: 'gob-investidura-1', tema: 'B1T03', kind: 'mayoria', q: 'Investidura: mayoría necesaria en la primera votación', a: 'Mayoría absoluta del Congreso', src: 'art. 99.3 CE' },
  { id: 'gob-investidura-2', tema: 'B1T03', kind: 'mayoria', q: 'Investidura: mayoría en la segunda votación, 48 horas después', a: 'Mayoría simple', src: 'art. 99.3 CE' },
  { id: 'gob-investidura-plazo', tema: 'B1T03', kind: 'plazo', q: 'Si nadie obtiene la confianza, ¿cuándo se disuelven las Cámaras desde la primera votación?', a: '2 meses', src: 'art. 99.5 CE' },
  { id: 'gob-censura-firmas', tema: 'B1T03', kind: 'dato', q: '¿Quién puede proponer una moción de censura?', a: 'Al menos una décima parte de los diputados', wrong: ['Un grupo parlamentario cualquiera', 'Una quinta parte de los diputados', 'La mayoría absoluta del Senado'], src: 'art. 113.2 CE' },
  { id: 'gob-censura', tema: 'B1T03', kind: 'mayoria', q: 'Mayoría para aprobar una moción de censura', a: 'Mayoría absoluta del Congreso', src: 'art. 113.1 CE' },
  { id: 'gob-censura-espera', tema: 'B1T03', kind: 'plazo', q: 'Tiempo mínimo que debe pasar desde que se presenta la moción de censura hasta su votación', a: '5 días', src: 'art. 113.3 CE' },
  { id: 'gob-confianza', tema: 'B1T03', kind: 'mayoria', q: 'Mayoría para otorgar la cuestión de confianza', a: 'Mayoría simple', src: 'art. 112 CE' },
  { id: 'gob-decreto-ley', tema: 'B1T03', kind: 'plazo', q: 'Plazo del Congreso para convalidar un decreto-ley', a: '30 días', src: 'art. 86.2 CE' },
  { id: 'gob-disolucion', tema: 'B1T03', kind: 'años', q: 'Tras una disolución anticipada, ¿cuánto debe pasar para poder acordar otra?', a: '1 año', src: 'art. 115.3 CE' },
  { id: 'gob-consejo-estado', tema: 'B1T03', kind: 'organo', q: 'Supremo órgano consultivo del Gobierno', a: 'El Consejo de Estado', src: 'art. 107 CE' },

  // ── B1T04 · TREBEP y transparencia ────────────────────────────────────
  { id: 'trebep-norma', tema: 'B1T04', kind: 'norma', q: '¿Qué norma aprueba el texto refundido del Estatuto Básico del Empleado Público?', a: 'RDL 5/2015', src: 'TREBEP' },
  { id: 'trebep-faltas', tema: 'B1T04', kind: 'dato', q: 'Prescripción de las faltas muy graves, graves y leves', a: '3 años, 2 años y 6 meses', wrong: ['3 años, 2 años y 1 año', '4 años, 2 años y 1 año', '5 años, 3 años y 1 año'], src: 'art. 97 TREBEP' },
  { id: 'trebep-sanciones', tema: 'B1T04', kind: 'dato', q: 'Prescripción de las sanciones muy graves, graves y leves', a: '3 años, 2 años y 1 año', wrong: ['3 años, 2 años y 6 meses', '4 años, 2 años y 1 año', '5 años, 3 años y 1 año'], src: 'art. 97 TREBEP' },
  { id: 'trebep-provision', tema: 'B1T04', kind: 'dato', q: 'Procedimientos de provisión de puestos de los funcionarios de carrera', a: 'Concurso y libre designación', wrong: ['Oposición y concurso-oposición', 'Concurso y oposición', 'Libre designación y comisión de servicios'], src: 'art. 78 TREBEP' },
  { id: 'trebep-incompat', tema: 'B1T04', kind: 'norma', q: '¿Qué ley regula las incompatibilidades del personal de las AAPP?', a: 'Ley 53/1984', src: 'Ley 53/1984' },
  { id: 'transp-ley', tema: 'B1T04', kind: 'norma', q: '¿Qué ley regula la transparencia, el acceso a la información pública y el buen gobierno?', a: 'Ley 19/2013', src: 'Ley 19/2013' },
  { id: 'transp-plazo', tema: 'B1T04', kind: 'plazo', q: 'Plazo para resolver una solicitud de acceso a la información (ampliable otro igual)', a: '1 mes', src: 'art. 20.1 Ley 19/2013' },
  { id: 'transp-silencio', tema: 'B1T04', kind: 'dato', q: 'Sentido del silencio en el derecho de acceso a la información pública', a: 'Desestimatorio', wrong: ['Estimatorio', 'No hay silencio: siempre se resuelve', 'Estimatorio si se motivó la solicitud'], src: 'art. 20.4 Ley 19/2013' },
  { id: 'transp-reclamacion', tema: 'B1T04', kind: 'plazo', q: 'Plazo del Consejo de Transparencia para resolver una reclamación (si no, se entiende desestimada)', a: '3 meses', src: 'art. 24.4 Ley 19/2013' },
  { id: 'trebep-compat-registro', tema: 'B1T04', kind: 'organo', q: '¿Dónde se inscriben las resoluciones de compatibilidad?', a: 'En los Registros de Personal correspondientes', src: 'art. 18 Ley 53/1984' },
  { id: 'ods', tema: 'B1T04', kind: 'dato', q: 'Agenda 2030: número de objetivos y de metas', a: '17 objetivos y 169 metas', wrong: ['15 objetivos y 150 metas', '17 objetivos y 196 metas', '20 objetivos y 169 metas'], src: 'ONU, 2015' },

  // ── B1T05 · Igualdad, discapacidad y dependencia ──────────────────────
  { id: 'igualdad-lo', tema: 'B1T05', kind: 'norma', q: 'Ley para la igualdad efectiva de mujeres y hombres', a: 'LO 3/2007', src: 'LO 3/2007' },
  { id: 'vg-lo', tema: 'B1T05', kind: 'norma', q: 'Ley de Medidas de Protección Integral contra la Violencia de Género', a: 'LO 1/2004', src: 'LO 1/2004' },
  { id: 'igualdad-equilibrio', tema: 'B1T05', kind: 'dato', q: 'Composición equilibrada según la LO 3/2007', a: 'Ningún sexo por encima del 60 % ni por debajo del 40 %', wrong: ['50 % exacto de cada sexo', 'Al menos un 30 % de cada sexo', 'Ningún sexo por encima del 70 %'], src: 'LO 3/2007, DA 1ª' },
  { id: 'discap-grado', tema: 'B1T05', kind: 'dato', q: 'Grado mínimo para tener la consideración de persona con discapacidad', a: '33 %', wrong: ['25 %', '45 %', '65 %'], src: 'RDL 1/2013, art. 4' },
  { id: 'discap-cupo', tema: 'B1T05', kind: 'dato', q: 'Cupo de vacantes reservado a personas con discapacidad en el empleo público', a: 'No menos del 7 % (2 % para discapacidad intelectual)', wrong: ['No menos del 5 %', 'No menos del 10 %', 'No menos del 3 %'], src: 'art. 59 TREBEP' },
  { id: 'dependencia-grados', tema: 'B1T05', kind: 'dato', q: 'Grados de dependencia de la Ley 39/2006', a: 'I moderada, II severa y III gran dependencia', wrong: ['I leve, II moderada y III severa', 'I, II, III y IV', 'Leve y grave'], src: 'art. 26 Ley 39/2006' },

  // ── B1T06 · Firma electrónica y DNIe ──────────────────────────────────
  { id: 'lssi', tema: 'B1T06', kind: 'norma', q: 'Ley de servicios de la sociedad de la información y comercio electrónico (LSSI)', a: 'Ley 34/2002', src: 'Ley 34/2002' },
  { id: 'confianza-ley', tema: 'B1T06', kind: 'norma', q: 'Ley reguladora de determinados aspectos de los servicios electrónicos de confianza', a: 'Ley 6/2020', src: 'Ley 6/2020' },
  { id: 'eidas', tema: 'B1T06', kind: 'norma', q: 'Reglamento europeo de identificación electrónica y servicios de confianza (eIDAS)', a: 'Reglamento (UE) 910/2014', src: 'eIDAS' },
  { id: 'cert-vigencia', tema: 'B1T06', kind: 'años', q: 'Vigencia máxima de un certificado cualificado (Ley 6/2020)', a: '5 años', src: 'art. 4 Ley 6/2020' },
  { id: 'firma-cualificada', tema: 'B1T06', kind: 'dato', q: '¿Qué firma equivale jurídicamente a la manuscrita?', a: 'La firma electrónica cualificada', wrong: ['La firma electrónica avanzada', 'Cualquier firma electrónica', 'El sello electrónico'], src: 'art. 25 eIDAS' },
  { id: 'dnie-rd', tema: 'B1T06', kind: 'norma', q: 'Real Decreto que regula hoy el DNI, físico y digital (derogó el RD 1553/2005)', a: 'RD 255/2025', src: 'RD 255/2025' },
  { id: 'dnie-certificados', tema: 'B1T06', kind: 'años', q: 'Validez de los certificados electrónicos del DNI (RD 255/2025)', a: '2 años', src: 'art. 11.3 RD 255/2025' },

  // ── B1T07 · Protección de datos ───────────────────────────────────────
  { id: 'lopdgdd', tema: 'B1T07', kind: 'norma', q: 'Ley Orgánica de Protección de Datos y garantía de los derechos digitales', a: 'LO 3/2018', src: 'LO 3/2018' },
  { id: 'rgpd', tema: 'B1T07', kind: 'norma', q: 'Reglamento General de Protección de Datos', a: 'Reglamento (UE) 2016/679', src: 'RGPD' },
  { id: 'rgpd-brecha', tema: 'B1T07', kind: 'plazo', q: 'Plazo para notificar una brecha de seguridad a la autoridad de control', a: '72 horas', src: 'art. 33 RGPD' },
  { id: 'rgpd-derechos', tema: 'B1T07', kind: 'plazo', q: 'Plazo para responder al ejercicio de un derecho (prorrogable 2 meses más)', a: '1 mes', src: 'art. 12.3 RGPD' },
  { id: 'rgpd-menor', tema: 'B1T07', kind: 'numero', q: 'Edad desde la que un menor puede consentir el tratamiento de sus datos en España', a: '14', wrong: ['13', '16', '18'], src: 'art. 7 LOPDGDD' },
  { id: 'rgpd-multa', tema: 'B1T07', kind: 'dato', q: 'Multa máxima del RGPD', a: '20 millones de euros o el 4 % de la facturación anual mundial', wrong: ['10 millones de euros o el 2 %', '600.000 euros', '50 millones de euros o el 10 %'], src: 'art. 83 RGPD' },
  { id: 'lopd-dpd', tema: 'B1T07', kind: 'plazo', q: 'Plazo para comunicar a la AEPD la designación o el cese de un delegado de protección de datos', a: '10 días', src: 'art. 34.3 LOPDGDD' },
  { id: 'lopd-sancion-leve', tema: 'B1T07', kind: 'plazo', q: 'Prescripción de las sanciones de hasta 40.000 € (LOPDGDD)', a: '1 año', src: 'art. 78 LOPDGDD' },
  { id: 'lopd-digitales', tema: 'B1T07', kind: 'dato', q: '¿En qué parte de la LOPDGDD están los derechos digitales?', a: 'Título X (arts. 79 a 97)', wrong: ['Título III (arts. 12 a 18)', 'Título VIII', 'Disposiciones adicionales'], src: 'LOPDGDD' },

  // ── B1T08 · Procedimiento electrónico, ENS y ENI ──────────────────────
  { id: 'ley39', tema: 'B1T08', kind: 'norma', q: 'Ley del Procedimiento Administrativo Común de las Administraciones Públicas', a: 'Ley 39/2015', src: 'Ley 39/2015' },
  { id: 'ley40', tema: 'B1T08', kind: 'norma', q: 'Ley de Régimen Jurídico del Sector Público', a: 'Ley 40/2015', src: 'Ley 40/2015' },
  { id: 'rd203', tema: 'B1T08', kind: 'norma', q: 'Reglamento de actuación y funcionamiento del sector público por medios electrónicos', a: 'RD 203/2021', src: 'RD 203/2021' },
  { id: 'ens-rd', tema: 'B1T08', kind: 'norma', q: 'Real Decreto del Esquema Nacional de Seguridad vigente', a: 'RD 311/2022', src: 'RD 311/2022' },
  { id: 'eni-rd', tema: 'B1T08', kind: 'norma', q: 'Real Decreto del Esquema Nacional de Interoperabilidad', a: 'RD 4/2010', src: 'RD 4/2010' },
  { id: 'l39-resolver', tema: 'B1T08', kind: 'plazo', q: 'Plazo para resolver y notificar si la norma del procedimiento no fija ninguno', a: '3 meses', src: 'art. 21.3 Ley 39/2015' },
  { id: 'l39-maximo', tema: 'B1T08', kind: 'plazo', q: 'Plazo máximo para resolver que puede fijar una norma (salvo ley o derecho de la UE)', a: '6 meses', src: 'art. 21.2 Ley 39/2015' },
  { id: 'l39-subsanar', tema: 'B1T08', kind: 'plazo', q: 'Plazo para subsanar una solicitud incompleta', a: '10 días', src: 'art. 68.1 Ley 39/2015' },
  { id: 'l39-notificar', tema: 'B1T08', kind: 'plazo', q: 'Plazo para cursar la notificación desde que se dicta el acto', a: '10 días', src: 'art. 40.2 Ley 39/2015' },
  { id: 'l39-rechazo', tema: 'B1T08', kind: 'plazo', q: 'Una notificación electrónica se entiende rechazada si no se accede en…', a: '10 días naturales', src: 'art. 43.2 Ley 39/2015' },
  { id: 'l39-audiencia', tema: 'B1T08', kind: 'plazo', q: 'Plazo del trámite de audiencia a los interesados', a: 'Entre 10 y 15 días', src: 'art. 82.2 Ley 39/2015' },
  { id: 'l39-info-publica', tema: 'B1T08', kind: 'plazo', q: 'Plazo mínimo del trámite de información pública', a: '20 días', src: 'art. 83.2 Ley 39/2015' },
  { id: 'l39-ampliacion', tema: 'B1T08', kind: 'dato', q: 'Límite de la ampliación de plazos', a: 'No puede superar la mitad del plazo inicial', wrong: ['Puede duplicar el plazo inicial', 'Como máximo 1 mes', 'No se pueden ampliar'], src: 'art. 32.1 Ley 39/2015' },
  { id: 'l39-alzada', tema: 'B1T08', kind: 'plazo', q: 'Plazo para interponer un recurso de alzada contra un acto expreso', a: '1 mes', src: 'art. 122.1 Ley 39/2015' },
  { id: 'l39-alzada-resolver', tema: 'B1T08', kind: 'plazo', q: 'Plazo para resolver y notificar el recurso de alzada', a: '3 meses', src: 'art. 122.2 Ley 39/2015' },
  { id: 'l39-reposicion-resolver', tema: 'B1T08', kind: 'plazo', q: 'Plazo para resolver y notificar el recurso potestativo de reposición', a: '1 mes', src: 'art. 124.2 Ley 39/2015' },
  { id: 'l39-silencio', tema: 'B1T08', kind: 'dato', q: 'Regla general del silencio en procedimientos iniciados a solicitud del interesado', a: 'Estimatorio', wrong: ['Desestimatorio', 'No existe el silencio', 'Depende de la cuantía'], src: 'art. 24.1 Ley 39/2015' },
  { id: 'l39-firma', tema: 'B1T08', kind: 'dato', q: '¿Para qué es obligatoria la firma (y no basta con identificarse)?', a: 'Solicitudes, declaraciones responsables o comunicaciones, recursos, desistir y renunciar', wrong: ['Para cualquier trámite electrónico', 'Solo para interponer recursos', 'Solo para presentar solicitudes'], src: 'art. 11.2 Ley 39/2015' },
  { id: 'ens-categorias', tema: 'B1T08', kind: 'dato', q: 'Categorías de seguridad de los sistemas en el ENS', a: 'Básica, media y alta', wrong: ['Baja, media y alta', 'Pública, reservada y secreta', 'Nivel 1, 2, 3 y 4'], src: 'RD 311/2022' },
  { id: 'ens-dimensiones', tema: 'B1T08', kind: 'dato', q: 'Dimensiones de la seguridad en el ENS', a: 'Confidencialidad, integridad, trazabilidad, autenticidad y disponibilidad', wrong: ['Confidencialidad, integridad y disponibilidad', 'Integridad, legalidad y disponibilidad', 'Autenticidad, no repudio y cifrado'], src: 'RD 311/2022, anexo I' },
  { id: 'ens-sistema', tema: 'B1T08', kind: 'organo', q: 'Según el ENS, ¿quién desarrolla la forma concreta de implementar la seguridad en el sistema?', a: 'El responsable del sistema', src: 'art. 13 RD 311/2022' },

  // ── B1T09 · Sedes, identificación y servicios comunes ─────────────────
  { id: 'hora-oficial', tema: 'B1T09', kind: 'organo', q: '¿Quién marca la hora oficial que usan las sedes electrónicas?', a: 'El Real Instituto y Observatorio de la Armada', src: 'RD 1308/1992' },
  { id: 'clave-pin', tema: 'B1T09', kind: 'dato', q: 'En Cl@ve, ¿qué clave concertada daba un código de un solo uso (desde 2025 integrada en Cl@ve Móvil)?', a: 'Cl@ve PIN', wrong: ['Cl@ve Permanente', 'Cl@ve Firma', 'El DNIe'], src: 'clave.gob.es' },
  { id: 'eidas-saml', tema: 'B1T09', kind: 'dato', q: '¿Con qué protocolo intercambia mensajes el nodo eIDAS español?', a: 'SAML 2.0', wrong: ['OAuth 2.0', 'OpenID Connect', 'Kerberos'], src: 'Nodo eIDAS' },
  { id: 'face', tema: 'B1T09', kind: 'dato', q: 'Punto general de entrada de facturas electrónicas de la AGE', a: 'FACe', wrong: ['DEHú', 'GEISER', 'Notific@'], src: 'Ley 25/2013' },
  { id: 'pid', tema: 'B1T09', kind: 'dato', q: '¿Qué servicio común evita pedir certificados en papel al ciudadano?', a: 'La Plataforma de Intermediación de Datos (PID)', wrong: ['La Red SARA', 'Port@firmas', 'Inside'], src: 'Catálogo de servicios de Administración Digital' },
  { id: 'dehu', tema: 'B1T09', kind: 'dato', q: '¿Qué es la DEHú?', a: 'La Dirección Electrónica Habilitada única, para las notificaciones', wrong: ['El registro electrónico general', 'La pasarela de pagos', 'El archivo electrónico'], src: 'RD 203/2021' },
];

// Opciones falsas de reserva para los tipos con pocas tarjetas.
export const RELLENO = {
  mayoria: ['Mayoría simple', 'Mayoría absoluta del Congreso', 'Tres quintos de cada Cámara', 'Dos tercios del Congreso', 'Mayoría absoluta del Senado'],
  organo: ['El Tribunal Constitucional', 'El Consejo de Ministros', 'El Defensor del Pueblo', 'El responsable de la seguridad', 'El Centro Criptológico Nacional'],
  años: ['2 años', '6 años', '10 años'],
};

