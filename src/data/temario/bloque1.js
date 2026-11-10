// Bloque I · Organización del Estado y Administración electrónica.
// Fichas de repaso propias: lo esencial de cada tema del programa y lo que
// más se pregunta. No sustituyen al temario completo ni a la norma.
// body se pinta con <RichText> (## subtítulo, - lista, `código`, **negrita**).

export const bloque1 = [
  {
    id: 'B1T01',
    short: 'Constitución: derechos y Corona',
    title:
      'La Constitución Española de 1978. Derechos y deberes fundamentales. Su garantía y suspensión. La Corona: funciones constitucionales del Rey.',
    body: `## La Constitución en cifras
- Aprobada en referéndum el **6 de diciembre de 1978**, sancionada el 27 y publicada en el BOE el **29 de diciembre**.
- **169 artículos**, un preámbulo, 10 títulos (más el preliminar), 4 disposiciones adicionales, 9 transitorias, 1 derogatoria y 1 final.
- España se constituye en un Estado **social y democrático de Derecho**; su forma política es la **Monarquía parlamentaria** (art. 1).
- **Reformas**: cuatro, todas por el procedimiento ordinario del art. 167: art. 13.2 (1992, sufragio pasivo de los ciudadanos de la UE en las municipales), art. 135 (2011, estabilidad presupuestaria), art. 49 (2024, personas con discapacidad) y art. 69.3 (BOE de 20 de mayo de 2026, Formentera elige su propio senador).

## El Título I y sus niveles de protección
- **Art. 14**: igualdad ante la ley.
- **Arts. 15 a 29** (Sección 1ª): derechos fundamentales y libertades públicas (vida, libertad ideológica, intimidad, reunión, asociación, educación, sindicación, huelga, petición…).
- **Arts. 30 a 38** (Sección 2ª): derechos y deberes de los ciudadanos (servicio militar/objeción, tributos, matrimonio, **propiedad privada (33)**, trabajo, libertad de empresa).
- **Arts. 39 a 52** (Capítulo III): principios rectores de la política social y económica. Informan la legislación positiva, la práctica judicial y la actuación de los poderes públicos, pero solo se pueden alegar ante los jueces según las leyes que los desarrollen.

**Garantías (art. 53)**: todos vinculan a los poderes públicos. Los del 14 al 29 y la objeción de conciencia (30.2) tienen además **procedimiento preferente y sumario** ante los tribunales y **recurso de amparo** ante el Tribunal Constitucional. Los de la Sección 1ª (arts. 15-29) se desarrollan por **ley orgánica** (art. 81); el resto del Capítulo II, por ley que respete su contenido esencial (art. 53.1).

## Suspensión (art. 55)
- **General**: en los estados de **excepción** y **sitio** se pueden suspender ciertos derechos (detención, inviolabilidad del domicilio, libre circulación, expresión, reunión, huelga…). En el estado de **alarma** no se suspenden derechos, solo se limitan.
- **Individual**: para investigaciones sobre bandas armadas o terrorismo, con control judicial y parlamentario.
- Alarma: la declara el Gobierno (15 días, prórroga con autorización del Congreso). Excepción: el Gobierno con autorización previa del Congreso (30 días, prorrogable otros 30). Sitio: el Congreso por mayoría absoluta.

## La Corona (Título II, arts. 56-65)
- El Rey es el **Jefe del Estado**, símbolo de su unidad y permanencia. Su persona es **inviolable** y no está sujeta a responsabilidad: sus actos han de ir **refrendados** (por el Presidente del Gobierno o los ministros).
- **Sucesión (art. 57)**: la línea anterior se prefiere a las posteriores; en la misma línea, el grado más próximo al más remoto; en el mismo grado, el varón a la mujer; y en el mismo sexo, la persona de más edad.
- **Funciones (art. 62)**: sancionar y promulgar las leyes; convocar y disolver las Cortes y convocar elecciones; **convocar referéndum** en los casos previstos (la autorización la da el **Congreso**, art. 92); proponer al candidato a Presidente del Gobierno, nombrarlo y cesarlo; nombrar y separar a los ministros a propuesta del Presidente; **expedir los decretos acordados en el Consejo de Ministros**; el mando supremo de las Fuerzas Armadas; el derecho de gracia (sin indultos generales); el Alto Patronazgo de las Reales Academias.`,
    quiz: [
      {
        q: '¿Qué derecho NO es fundamental (arts. 15-29)?',
        options: ['Huelga', 'Propiedad privada', 'Sindicación', 'Educación'],
        answer: 1,
        why: 'La propiedad privada es el art. 33, en la Sección 2ª.',
      },
      {
        q: '¿En qué estado excepcional NO se suspenden derechos?',
        options: ['Alarma', 'Excepción', 'Sitio', 'En ninguno de los tres'],
        answer: 0,
        why: 'En el estado de alarma los derechos se limitan, pero no se suspenden.',
      },
      {
        q: '¿Quién refrenda los actos del Rey?',
        options: ['El Tribunal Constitucional', 'El Presidente del Gobierno o los ministros', 'El Consejo de Estado', 'El Defensor del Pueblo'],
        answer: 1,
        why: 'Art. 64 CE. (La propuesta y el nombramiento del Presidente los refrenda el Presidente del Congreso.)',
      },
    ],
  },
  {
    id: 'B1T02',
    short: 'Cortes Generales, TC y Defensor del Pueblo',
    title:
      'Las Cortes Generales: atribuciones del Congreso de los Diputados y Senado. El Tribunal Constitucional: composición y atribuciones. El Defensor del Pueblo.',
    body: `## Cortes Generales (Título III)
- Representan al pueblo español y están formadas por el **Congreso** y el **Senado** (bicameralismo imperfecto: el Congreso tiene más peso).
- **Funciones (art. 66)**: ejercen la potestad legislativa del Estado, aprueban los Presupuestos y controlan la acción del Gobierno.
- **Congreso**: entre 300 y 400 diputados (la ley fija 350), elegidos por 4 años en circunscripción provincial con sistema proporcional (D'Hondt).
- **Senado**: cámara de representación territorial; 4 senadores por provincia, más los designados por las Comunidades Autónomas. En las islas, cada isla o agrupación con Cabildo o Consejo Insular es una circunscripción: 3 senadores para Gran Canaria, Mallorca y Tenerife y 1 para cada una de las demás. Desde la reforma del art. 69.3 de 2026, **Formentera elige su propio senador** (antes iba agrupada con Ibiza).
- **Inviolabilidad** por las opiniones y **inmunidad** (solo pueden ser detenidos en caso de flagrante delito y procesados con la autorización de su Cámara). En las causas contra diputados y senadores es competente la **Sala de lo Penal del Tribunal Supremo** (art. 71).
- **Periodos de sesiones**: dos ordinarios (septiembre-diciembre y febrero-junio). Las sesiones extraordinarias se celebran a petición del Gobierno, de la Diputación Permanente o de la **mayoría absoluta** de una Cámara.
- **Diputación Permanente (art. 78)**: un mínimo de **21 miembros**, en proporción a los grupos, y la preside el Presidente de cada Cámara. Actúa entre periodos de sesiones y cuando las Cámaras están disueltas, en este caso **hasta la constitución de las nuevas Cortes** (art. 78.3).
- **Comisiones de investigación**: sus conclusiones **no vinculan** a los tribunales.
- Las Cámaras reciben **peticiones** individuales y colectivas, siempre por escrito; se prohíbe la presentación directa por manifestaciones ciudadanas (art. 77).
- No se puede delegar en las comisiones legislativas la aprobación de reformas constitucionales, asuntos internacionales, leyes orgánicas y de bases, ni Presupuestos (art. 75.3).

## Tribunal Constitucional (Título IX)
- **12 magistrados** nombrados por el Rey: 4 a propuesta del Congreso y 4 del Senado (por 3/5), 2 del Gobierno y 2 del CGPJ.
- Mandato de **9 años**, renovado **por terceras partes cada 3**. El Presidente se elige entre ellos por 3 años.
- Competencias: recurso de **inconstitucionalidad** (contra leyes), **cuestión** de inconstitucionalidad (la plantean jueces), recurso de **amparo** (derechos de los arts. 14-29 y 30.2) y **conflictos de competencias**.

## Defensor del Pueblo (art. 54; LO 3/1981)
- Alto comisionado de las Cortes para la defensa de los derechos del Título I; supervisa a la Administración.
- Lo eligen las Cortes por **5 años**, con 3/5 de cada Cámara. Puede ser elegido **cualquier español mayor de edad** en pleno disfrute de sus derechos civiles y políticos.
- Tiene dos adjuntos y presenta un **informe anual** a las Cortes.`,
    quiz: [
      {
        q: '¿Cuántos magistrados del TC propone el Gobierno?',
        options: ['4', '2', '3', 'Ninguno'],
        answer: 1,
        why: '4 los propone el Congreso, 4 el Senado, 2 el Gobierno y 2 el CGPJ.',
      },
      {
        q: 'El Defensor del Pueblo se elige por…',
        options: ['4 años', '5 años', '9 años', '6 años'],
        answer: 1,
        why: 'LO 3/1981: mandato de cinco años.',
      },
      {
        q: 'La Diputación Permanente tiene como mínimo…',
        options: ['15 miembros', '21 miembros', '30 miembros', '350 miembros'],
        answer: 1,
        why: 'Art. 78 CE: un mínimo de 21, representando a los grupos parlamentarios.',
      },
    ],
  },
  {
    id: 'B1T03',
    short: 'El Gobierno',
    title:
      'El Gobierno: composición, nombramiento y cese. Las funciones del Gobierno. Relaciones entre el Gobierno y las Cortes Generales.',
    body: `## Composición y regulación
- Título IV de la CE (arts. 97-107) y **Ley 50/1997, de 27 de noviembre, del Gobierno**.
- Lo forman el **Presidente**, los **Vicepresidentes** (si los hay) y los **Ministros**. Actúa colegiadamente como **Consejo de Ministros** y también a través de las **Comisiones Delegadas**. El **Secretario del Consejo de Ministros es el Ministro de la Presidencia**.
- **Funciones (art. 97)**: dirige la política interior y exterior, la Administración civil y militar y la defensa del Estado; ejerce la función ejecutiva y la potestad reglamentaria.

## Nombramiento: la investidura (art. 99)
1. El Rey, tras consultar a los grupos, propone un candidato a través del Presidente del Congreso.
2. Primera votación: **mayoría absoluta** del Congreso.
3. Si no la obtiene, 48 horas después basta la **mayoría simple**.
4. Si en **dos meses** desde la primera votación ningún candidato obtiene la confianza, el Rey disuelve las Cámaras y convoca elecciones.

## Cese y Gobierno en funciones
- El Gobierno cesa tras las elecciones generales, por pérdida de la confianza parlamentaria (cuestión de confianza o moción de censura) o por dimisión o fallecimiento del Presidente.
- **En funciones**: limita su gestión al **despacho ordinario de los asuntos públicos**. No puede aprobar el proyecto de Presupuestos ni presentar proyectos de ley, y el Presidente no puede proponer la disolución ni plantear la cuestión de confianza.

## Relaciones con las Cortes
- **Moción de censura (art. 113)**: la exige el Congreso para hacer efectiva la **responsabilidad política** del Gobierno. Necesita la firma de una décima parte de los diputados y un **candidato alternativo** (es constructiva), y se aprueba por **mayoría absoluta**.
- **Cuestión de confianza (art. 112)**: la plantea el Presidente, previa deliberación del Consejo de Ministros, y se otorga por **mayoría simple**.
- Preguntas e interpelaciones, comparecencias y el deber de información.
- **Decretos-leyes (art. 86)**: los dicta el Gobierno en casos de extraordinaria y urgente necesidad, y el Congreso debe convalidarlos en **30 días**. **Decretos legislativos (art. 82)**: delegación de las Cortes para textos articulados (con ley de bases) o textos refundidos (con ley ordinaria).`,
    quiz: [
      {
        q: '¿Qué mayoría exige la moción de censura?',
        options: ['Simple', 'Absoluta', '3/5', '2/3'],
        answer: 1,
        why: 'Art. 113 CE: la adopción por mayoría absoluta del Congreso.',
      },
      {
        q: 'La cuestión de confianza se entiende otorgada con…',
        options: ['Mayoría simple', 'Mayoría absoluta', '3/5 del Congreso', 'Unanimidad'],
        answer: 0,
        why: 'Art. 112 CE: el voto de la mayoría simple de los diputados.',
      },
      {
        q: '¿En qué plazo debe convalidar el Congreso un decreto-ley?',
        options: ['15 días', '30 días', '2 meses', '48 horas'],
        answer: 1,
        why: 'Art. 86.2 CE: en los 30 días siguientes a su promulgación.',
      },
    ],
  },
  {
    id: 'B1T04',
    short: 'Empleo público, transparencia y Agenda 2030',
    title:
      'El texto refundido del Estatuto Básico del Empleado Público: derechos y deberes, provisión de puestos, promoción interna y carrera profesional; situaciones administrativas, incompatibilidades y régimen sancionador. La Ley 19/2013 de transparencia, acceso a la información pública y buen gobierno. La Agenda 2030 y los Objetivos de Desarrollo Sostenible.',
    body: `## TREBEP (RDL 5/2015)
- **Clases de personal**: funcionarios de carrera, funcionarios interinos, personal laboral (fijo, por tiempo indefinido o temporal) y personal eventual (confianza o asesoramiento especial).
- **Acceso**: igualdad, mérito, capacidad y publicidad. Los sistemas son oposición, concurso-oposición y, excepcionalmente, concurso.
- **Provisión de puestos (art. 78)**: con los principios de **igualdad, mérito, capacidad y publicidad**. Los procedimientos son el **concurso** (el sistema normal, que valora méritos) y la **libre designación** (con convocatoria pública, para puestos de especial responsabilidad).
- **Carrera**: horizontal (progresar sin cambiar de puesto), vertical (ascender de puesto), **promoción interna vertical** (pasar a un cuerpo de un subgrupo superior) y horizontal (a otro cuerpo del mismo subgrupo).
- **Situaciones administrativas**: servicio activo, servicios especiales, servicio en otras Administraciones, **excedencia** (voluntaria por interés particular, por agrupación familiar, por cuidado de familiares, por razón de violencia de género o de violencia sexual y por razón de violencia terrorista) y **suspensión de funciones**.
- **Deberes**: código de conducta con principios éticos y de conducta (arts. 52-54).
- **Régimen disciplinario**: faltas muy graves, graves y leves. Prescripción de las **faltas**: 3 años, 2 años y 6 meses. Prescripción de las **sanciones**: 3 años, 2 años y 1 año. La separación del servicio solo procede por falta muy grave.
- **Incompatibilidades**: Ley 53/1984. Como regla general no se pueden ocupar dos puestos públicos, y las actividades privadas necesitan reconocimiento de compatibilidad. Todas las resoluciones de compatibilidad se inscriben en los **Registros de Personal** correspondientes (art. 18).

## Ley 19/2013 de transparencia
- Tres ejes: **publicidad activa** (lo que se publica de oficio en el Portal de Transparencia), **derecho de acceso** a la información pública y **buen gobierno**.
- **Solicitud de acceso**: se dirige al titular del órgano que tiene la información, por cualquier medio que deje constancia de la identidad del solicitante, la información pedida, una **dirección de contacto (preferentemente electrónica)** y, en su caso, la modalidad de acceso preferida (art. 17.2). **No hace falta motivarla** y puede presentarse en cualquier lengua cooficial.
- **Plazo para resolver**: 1 mes, ampliable 1 mes más. El **silencio es desestimatorio**.
- Contra la resolución cabe **reclamación** potestativa ante el **Consejo de Transparencia y Buen Gobierno** (CTBG), en **1 mes**. El CTBG tiene **3 meses** para resolverla; si no lo hace, se entiende **desestimada** (art. 24). En su **Comisión** se sientan, además del Presidente, un diputado, un senador y representantes del Tribunal de Cuentas, el **Defensor del Pueblo**, la AEPD, la **Secretaría de Estado de Administraciones Públicas** y la AIReF (art. 36.2).

## Agenda 2030
- Aprobada por la ONU en **septiembre de 2015**: **17 ODS** y **169 metas**.
- ODS 1 **Fin de la pobreza**, 2 Hambre cero, 3 Salud y bienestar, 4 Educación de calidad, 5 Igualdad de género, 6 Agua limpia, 7 Energía asequible, 8 Trabajo decente, 9 Industria e innovación, 10 Reducción de las desigualdades, 11 Ciudades sostenibles, 12 Producción y consumo responsables, 13 Acción por el clima, 14 Vida submarina, 15 Ecosistemas terrestres, 16 Paz y justicia, 17 Alianzas.`,
    quiz: [
      {
        q: '¿Cuánto tarda en prescribir una falta grave?',
        options: ['6 meses', '1 año', '2 años', '3 años'],
        answer: 2,
        why: 'TREBEP: las muy graves a los 3 años, las graves a los 2 y las leves a los 6 meses.',
      },
      {
        q: 'Si no te responden a una solicitud de acceso a la información en plazo…',
        options: ['Se entiende estimada', 'Se entiende desestimada', 'Se amplía automáticamente 3 meses', 'Debe resolver el CTBG'],
        answer: 1,
        why: 'El silencio en el derecho de acceso es desestimatorio.',
      },
      {
        q: '¿Cuántos ODS tiene la Agenda 2030?',
        options: ['10', '15', '17', '169'],
        answer: 2,
        why: '17 objetivos con 169 metas.',
      },
    ],
  },
  {
    id: 'B1T05',
    short: 'Igualdad, LGTBI, discapacidad y dependencia',
    title:
      'Políticas de igualdad y contra la violencia de género. Políticas de igualdad de trato y no discriminación de las personas LGTBI. Discapacidad y dependencia: régimen jurídico.',
    body: `## Normas clave
- **LO 3/2007**, para la igualdad efectiva de mujeres y hombres: discriminación directa e indirecta, acoso sexual y por razón de sexo, acciones positivas, **planes de igualdad** (obligatorios en empresas de 50 o más trabajadores) y **composición equilibrada** (cada sexo, ni más del 60 % ni menos del 40 %).
- LO 3/2007, artículos que caen: el trato desfavorable por **embarazo o maternidad** es discriminación **directa** (art. 8); las represalias por reclamar la igualdad son también **discriminación por razón de sexo** (art. 9, indemnidad); y para los planes de igualdad **voluntarios** el Gobierno establece **medidas de fomento** dirigidas sobre todo a las **pequeñas y medianas empresas** (art. 49).
- **LO 1/2004**, de Medidas de Protección Integral contra la Violencia de Género. En educación (art. 4), cada etapa tiene su objetivo: Infantil, la resolución pacífica de conflictos; Primaria, comprender y respetar la igualdad entre sexos; ESO, relacionarse de forma pacífica y conocer la igualdad de oportunidades; Bachillerato y FP, valorar críticamente las desigualdades; y las **Universidades** incluyen la igualdad de género **de forma transversal** en la docencia y la investigación.
- **Ley 15/2022**, integral para la igualdad de trato y la no discriminación.
- **Ley 4/2023**, para la igualdad real y efectiva de las personas trans y para la garantía de los derechos LGTBI. Su régimen sancionador distingue infracciones leves, graves y muy graves (en el examen de 2025 se consideró grave la obstrucción o negativa absoluta a la actuación inspectora).

## Discapacidad
- **RDL 1/2013**, Texto Refundido de la Ley General de derechos de las personas con discapacidad y de su inclusión social.
- Se considera persona con discapacidad a quien tiene reconocido un grado **igual o superior al 33 %**. También se equiparan los pensionistas de incapacidad permanente total, absoluta o gran invalidez, entre otros.
- Principios: vida independiente, **accesibilidad universal**, **diseño universal** o diseño para todas las personas, ajustes razonables, normalización y diálogo civil.
- En el empleo público se reserva un cupo de **no menos del 7 %** de las vacantes (y al menos el 2 % para discapacidad intelectual).

## Dependencia
- **Ley 39/2006**, de Promoción de la Autonomía Personal y Atención a las personas en situación de dependencia, que crea el SAAD.
- Tres grados: **I moderada**, **II severa** y **III gran dependencia** (art. 26).
- El grado es **revisable** a instancia del interesado, de sus representantes o de oficio por las Administraciones competentes (art. 30).`,
    quiz: [
      {
        q: '¿Desde qué grado de discapacidad reconocido se tiene esa consideración?',
        options: ['25 %', '33 %', '45 %', '65 %'],
        answer: 1,
        why: 'RDL 1/2013, art. 4.2: un grado igual o superior al 33 %.',
      },
      {
        q: 'El grado III de dependencia es…',
        options: ['Moderada', 'Severa', 'Gran dependencia', 'Leve'],
        answer: 2,
        why: 'Ley 39/2006: I moderada, II severa y III gran dependencia.',
      },
      {
        q: 'Composición equilibrada según la LO 3/2007:',
        options: ['50/50 exacto', 'Ningún sexo por encima del 60 % ni por debajo del 40 %', 'Al menos un 33 % de mujeres', 'Al menos un 25 % de cada sexo'],
        answer: 1,
        why: 'Disposición adicional primera de la LO 3/2007.',
      },
    ],
  },
  {
    id: 'B1T06',
    short: 'Sociedad de la información, firma electrónica y DNIe',
    title:
      'La sociedad de la información. Identidad y firma electrónica: régimen jurídico. El DNI electrónico. La Agenda Digital para España.',
    body: `## Normas que hay que reconocer
- **LSSI, Ley 34/2002**, de servicios de la sociedad de la información y comercio electrónico: obligaciones de información de los prestadores, responsabilidad de los intermediarios, comunicaciones comerciales y contratación electrónica.
- **Ley 56/2007**, de Medidas de Impulso de la Sociedad de la Información: entre otras cosas, la factura electrónica, cuyos formatos estructurados permiten visualizarla y emitirla en las distintas lenguas oficiales.
- **Reglamento eIDAS (UE) 910/2014**, actualizado por el Reglamento (UE) 2024/1183 (eIDAS 2, la cartera europea de identidad digital), y la **Ley 6/2020**, reguladora de determinados aspectos de los servicios electrónicos de confianza.

## Firma electrónica (eIDAS)
- **Simple**: datos electrónicos usados para firmar.
- **Avanzada**: vinculada de forma única al firmante, que permite identificarlo y detectar cualquier cambio posterior.
- **Cualificada**: avanzada, creada con un dispositivo cualificado y basada en un **certificado cualificado**. Equivale jurídicamente a la firma manuscrita.
- El **sello electrónico** es el equivalente para las personas jurídicas; su certificado cualificado incluye el nombre del creador del sello y, cuando proceda, el número de registro.
- Ley 6/2020: los certificados cualificados duran **como máximo 5 años**. Se admite el **seudónimo**, pero el prestador debe revelar la identidad real si se la piden los jueces u otras autoridades.

## Formatos de firma
- **CAdES** (binario, CMS): sirve para cualquier fichero y es adecuado para ficheros grandes.
- **XAdES** (XML): genera XML, por lo que no es adecuado para ficheros muy grandes.
- **PAdES**: firma incrustada en un **PDF**.
- Además: firma attached (implícita, con el documento dentro) o detached (separada del documento).

## DNI (RD 255/2025)
- Desde el **2 de abril de 2025** el DNI lo regula el **RD 255/2025**, que deroga el RD 1553/2005 y regula también el **DNI digital** (la app MiDNI), con la misma eficacia para identificarse; solo se genera si el DNI físico está vigente.
- **Validez del DNI** (art. 7): 2 años antes de los 5 de edad; 5 años de los 5 a los 30; 10 años de los 30 a los 70; y desde los 70, **más de diez años, con una fecha** concreta (con el RD 1553/2005 era «permanente»).
- El chip lleva **certificados cualificados** para identificarse (autenticación) y para firmar. Su validez es de **2 años** (art. 11.3); con la norma anterior, hasta 5. Ojo con los exámenes antiguos, que preguntan por el régimen derogado.
- En la **zona de seguridad** del chip, que el ciudadano puede leer en los Puntos de Actualización, están los datos de filiación, la **imagen de la fotografía** y la de la firma manuscrita.
- El DNIe 3.0 y 4.0 incorporan **NFC** para usarlo con el móvil.

## Agenda digital
- **España Digital 2025** se articulaba en **10 ejes**. **España Digital 2026** es su versión actualizada, organizada en ejes de infraestructuras, economía y personas. Planes conectados: Estrategia de IA (con el proyecto ALIA), Estrategia de Tecnologías Cuánticas y el Plan de Impulso de los Espacios de Datos.`,
    quiz: [
      {
        q: '¿Qué formato de firma es el propio de los documentos PDF?',
        options: ['CAdES', 'XAdES', 'PAdES', 'JAdES'],
        answer: 2,
        why: 'PAdES = PDF Advanced Electronic Signatures.',
      },
      {
        q: '¿Qué firma equivale jurídicamente a la manuscrita según eIDAS?',
        options: ['Simple', 'Avanzada', 'Cualificada', 'Cualquiera'],
        answer: 2,
        why: 'Art. 25.2 eIDAS: la firma electrónica cualificada.',
      },
      {
        q: '¿Qué certificados lleva el DNIe?',
        options: ['Solo firma', 'Autenticación y firma', 'Cifrado y firma', 'Sello y firma'],
        answer: 1,
        why: 'El de autenticación y el de firma (no repudio).',
      },
    ],
  },
  {
    id: 'B1T07',
    short: 'Protección de datos',
    title: 'La protección de datos personales y su régimen jurídico: principios, derechos y obligaciones. Derechos digitales.',
    body: `## Normas
- **RGPD**, Reglamento (UE) 2016/679, aplicable desde el 25 de mayo de 2018.
- **LOPDGDD**, Ley Orgánica 3/2018, de 5 de diciembre, de Protección de Datos Personales y garantía de los derechos digitales.

## Principios (art. 5 RGPD)
1. **Licitud, lealtad y transparencia**.
2. **Limitación de la finalidad**: fines determinados, explícitos y legítimos.
3. **Minimización de datos**: adecuados, pertinentes y limitados a lo necesario.
4. **Exactitud**: datos exactos y actualizados.
5. **Limitación del plazo de conservación**.
6. **Integridad y confidencialidad**: seguridad.
7. **Responsabilidad proactiva**: el responsable debe cumplir y poder demostrarlo.

## Bases de licitud (art. 6)
Consentimiento, contrato, obligación legal, intereses vitales, misión de interés público y interés legítimo. En España, el menor puede consentir por sí mismo **desde los 14 años** (art. 7 LOPDGDD).

## Derechos de las personas
Acceso, rectificación, **supresión** («derecho al olvido»), limitación del tratamiento, **portabilidad**, oposición y no ser objeto de decisiones automatizadas. El responsable debe contestar en **1 mes**, prorrogable 2 meses más.

## Obligaciones
- **Registro de actividades** de tratamiento, **protección de datos desde el diseño y por defecto**, y **evaluación de impacto** si el riesgo es alto.
- **Brecha de seguridad**: se notifica a la autoridad de control (la **AEPD**) en un plazo de **72 horas**.
- **Delegado de Protección de Datos** (DPD): obligatorio en las AAPP. Su designación, nombramiento y cese se comunican a la AEPD en **10 días** (art. 34.3 LOPDGDD).
- Multas de hasta **20 millones de euros o el 4 %** de la facturación anual mundial.
- **Prescripción** (LOPDGDD): las infracciones muy graves a los 3 años, las graves a los 2 y las leves al año (arts. 72-74). Las sanciones de hasta 40.000 € al año, de 40.001 a 300.000 € a los 2 años y las de más de 300.000 € a los 3 (art. 78).

## Derechos digitales (Título X LOPDGDD, arts. 79-97)
- Art. 79: los derechos y libertades constitucionales son **plenamente aplicables en Internet**, con la colaboración de los prestadores de servicios.
- Otros: neutralidad de la red, acceso universal, seguridad digital, educación digital, rectificación en Internet, desconexión digital en el trabajo, intimidad frente a la videovigilancia y la geolocalización, derecho al olvido en buscadores y redes sociales…
- **Testamento digital (art. 96)**: el acceso a los contenidos de personas fallecidas gestionados por prestadores de servicios de la sociedad de la información.`,
    quiz: [
      {
        q: '¿Qué principio exige que los datos sean adecuados, pertinentes y limitados a lo necesario?',
        options: ['Exactitud', 'Minimización', 'Limitación de la finalidad', 'Integridad'],
        answer: 1,
        why: 'Art. 5.1.c RGPD.',
      },
      {
        q: 'Plazo para notificar una brecha de seguridad a la AEPD:',
        options: ['24 horas', '72 horas', '1 semana', '1 mes'],
        answer: 1,
        why: 'Art. 33 RGPD: sin dilación indebida y, a más tardar, en 72 horas.',
      },
      {
        q: '¿A partir de qué edad puede consentir un menor en España?',
        options: ['13', '14', '16', '18'],
        answer: 1,
        why: 'Art. 7 LOPDGDD: a partir de los 14 años.',
      },
    ],
  },
  {
    id: 'B1T08',
    short: 'Procedimiento electrónico, ENS y ENI',
    title:
      'Acceso electrónico de los ciudadanos a los servicios públicos y normativa de desarrollo. La gestión electrónica de los procedimientos administrativos: registros, notificaciones y uso de medios electrónicos. Esquema Nacional de Seguridad e Interoperabilidad. Normas técnicas de interoperabilidad.',
    body: `## Normas
- **Ley 39/2015**, del Procedimiento Administrativo Común de las AAPP (la relación con los ciudadanos), y **Ley 40/2015**, de Régimen Jurídico del Sector Público (la organización y relación entre Administraciones).
- **RD 203/2021**, Reglamento de actuación y funcionamiento del sector público por medios electrónicos. Entre sus principios está el de **personalización y proactividad**: servicios precumplimentados y anticiparse a las necesidades del ciudadano.

## Ley 39/2015: lo que más cae
- **Obligados a relacionarse electrónicamente (art. 14.2)**: las personas jurídicas, las entidades sin personalidad, los profesionales colegiados en su actividad, quienes los representen y los empleados públicos en sus trámites como tales. Las personas físicas pueden elegir.
- **Firma obligatoria (art. 11)** solo para: formular solicitudes, presentar declaraciones responsables o comunicaciones, interponer recursos, desistir de acciones y renunciar a derechos. Para lo demás basta con identificarse.
- **Registros (art. 16)**: cada Administración tiene un registro electrónico general. Funcionan las 24 horas, todos los días; lo que se presenta en día inhábil se entiende presentado a la primera hora del siguiente hábil.
- **Plazos**: los días son hábiles salvo que se diga otra cosa; se excluyen sábados, domingos y festivos, y se cuentan **desde el día siguiente** a la notificación o publicación (art. 30).
- **Notificaciones**: preferentemente electrónicas. Deben cursarse en **10 días** desde que se dicta el acto. La electrónica se entiende **rechazada** si pasan **10 días naturales** sin acceder. En papel puede recogerla en el domicilio cualquier persona **mayor de 14 años** que se identifique. Si el interesado es desconocido o no se puede notificar, se publica un **anuncio en el BOE**.

## Esquema Nacional de Seguridad (RD 311/2022)
- **Categorías** de los sistemas: **BÁSICA, MEDIA y ALTA**.
- **Dimensiones** de la seguridad: **confidencialidad, integridad, trazabilidad, autenticidad y disponibilidad** (C-I-T-A-D).
- **Roles**: el responsable de la información y el del servicio (fijan los requisitos), el **responsable de la seguridad** (determina las decisiones de seguridad) y el **responsable del sistema** (desarrolla la forma concreta de implementar la seguridad y supervisa la operación diaria).
- **Medidas (anexo II)**: marco organizativo (org), marco operacional (op, por ejemplo la protección frente a código dañino) y medidas de protección (mp, como la protección del correo o de los equipos portátiles).
- Glosario: el **compromiso de la seguridad** es el incidente en el que una información o un servicio quedan expuestos, o potencialmente expuestos, a un acceso no autorizado.

## Esquema Nacional de Interoperabilidad (RD 4/2010)
- Dimensiones de la interoperabilidad: organizativa, semántica y técnica (además de la temporal).
- La **guía de auditoría del ENI** agrupa sus controles en marco organizativo, marco operacional y medidas técnicas.
- NTI de **Digitalización**: resolución mínima de **200 ppp** tanto en blanco y negro como en color o escala de grises.
- **Normas Técnicas de Interoperabilidad (NTI)**: documento electrónico, expediente electrónico, digitalización, copiado auténtico, política de firma, **reutilización de activos**, protocolos de intermediación de datos, relación de modelos de datos, política de gestión de documentos, **requisitos de conexión a la Red SARA**, modelo de datos para el intercambio de asientos registrales, **plan de direccionamiento**, catálogo de estándares, **sistema de referencia de documentos y repositorios de confianza**… No existe una NTI de «plan de seguridad».`,
    quiz: [
      {
        q: 'Una notificación electrónica se entiende rechazada si pasan sin acceder…',
        options: ['5 días hábiles', '10 días naturales', '15 días hábiles', '1 mes'],
        answer: 1,
        why: 'Art. 43.2 Ley 39/2015: diez días naturales desde su puesta a disposición.',
      },
      {
        q: '¿Qué dimensión NO es del ENS?',
        options: ['Trazabilidad', 'Autenticidad', 'Usabilidad', 'Disponibilidad'],
        answer: 2,
        why: 'Las cinco son confidencialidad, integridad, trazabilidad, autenticidad y disponibilidad.',
      },
      {
        q: '¿Quién está obligado a relacionarse electrónicamente con la Administración?',
        options: ['Cualquier persona física', 'Las personas jurídicas', 'Solo los funcionarios', 'Nadie: siempre es voluntario'],
        answer: 1,
        why: 'Art. 14.2 Ley 39/2015.',
      },
    ],
  },
  {
    id: 'B1T09',
    short: 'Sedes, identificación y servicios comunes',
    title:
      'Instrumentos para el acceso electrónico a las Administraciones públicas: sedes electrónicas, canales y puntos de acceso, identificación y autenticación. Infraestructuras y servicios comunes en materia de administración electrónica.',
    body: `## Sede electrónica y puntos de acceso
- La **sede electrónica** es la dirección electrónica cuya titularidad corresponde a una Administración, con la que el ciudadano realiza trámites con garantías (certificado de sede). El RD 203/2021 fija su contenido mínimo; entre otras cosas, la normativa reguladora del Registro accesible desde ella, la fecha y hora oficial y los días inhábiles.
- **PAGe**, el Punto de Acceso General electrónico (administracion.gob.es): la entrada a la información y los trámites de la AGE, con la **Carpeta Ciudadana**.
- **Canales de asistencia (art. 4 RD 203/2021)**: presencial, portales de internet y sedes electrónicas, redes sociales, telefónico (060), correo electrónico y cualquier otro que se establezca. La cita previa no es un canal.
- La **Carpeta Ciudadana** se accede desde la sede del PAGe. El **Registro de Funcionarios Habilitados** de la AGE debe ser interoperable con los de las comunidades autónomas y las entidades locales.

## Identificación y firma
- **Cl@ve**: sistema común para identificarse con claves concertadas, **Cl@ve PIN** (de un solo uso) y **Cl@ve Permanente**, y con certificado o DNIe. Tiene dos niveles de registro (básico y avanzado) e incluye **Cl@ve Firma**, que firma con certificados centralizados en la nube.
- **Nodo eIDAS español**: reconoce las identidades electrónicas de otros países de la UE. Intercambia los mensajes con **SAML 2.0**, y las AAPP se integran con él a través de Cl@ve.
- **@firma**: la plataforma de validación de certificados y firmas.

## Infraestructuras y servicios comunes (Catálogo de Servicios de Administración Digital)
- **Red SARA**: la red privada que interconecta las Administraciones y conecta con la red europea (TESTA/sTESTA).
- **Hora oficial**: la marca el **Real Instituto y Observatorio de la Armada (ROA)**.
- **PID** (Plataforma de Intermediación de Datos): sustituye la aportación de certificados en papel; por ejemplo, consulta de identidad, residencia, situación de prestaciones por desempleo o títulos. Usa el protocolo **SCSP** (Sustitución de Certificados en Soporte Papel), hoy en su versión 3.
- **SIR, GEISER y ORVE**: el intercambio de asientos registrales entre Administraciones y la gestión de las oficinas de registro.
- **Notific@ y DEHú** (Dirección Electrónica Habilitada única): las notificaciones.
- **FACe**: el punto general de entrada de facturas electrónicas.
- **NEDAES**: la nómina de los empleados públicos. **eVisor**: copias auténticas en papel de documentos con firma electrónica. **CIRCABC**: trabajo colaborativo e intercambio de documentos.
- Otros: **Inside** (expediente y documento electrónico), **Archive** (archivo electrónico), **Port@firmas**, **Autofirm@** y **Cl@ve**.`,
    quiz: [
      {
        q: '¿Qué estándar usa el nodo eIDAS español para intercambiar mensajes?',
        options: ['OAuth 2.0', 'SAML 2.0', 'Kerberos', 'LDAP'],
        answer: 1,
        why: 'El nodo eIDAS usa SAML 2.0.',
      },
      {
        q: '¿Qué organismo marca la hora oficial en España?',
        options: ['El CCN', 'El Real Instituto y Observatorio de la Armada', 'La FNMT', 'Red.es'],
        answer: 1,
        why: 'El ROA, en San Fernando (Cádiz).',
      },
      {
        q: '¿Qué servicio común evita que el ciudadano aporte certificados que ya tiene la Administración?',
        options: ['FACe', 'PID', 'Notific@', 'ORVE'],
        answer: 1,
        why: 'La Plataforma de Intermediación de Datos.',
      },
    ],
  },
];
