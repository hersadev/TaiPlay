// Ruta «Bases de datos y SQL». Las prácticas ejecutan SQL de verdad (SQLite
// en el navegador, ver engine/sql) sobre el modelo de datos de los
// supuestos reales: «educa» (EDUCA-DATA, 2025) y «becas» (becas, 2024).
// Los objetivos se validan mirando el resultado de las consultas y el estado
// de la base de datos (ver _sqlHelpers.js).

import { ranSql, returnsSame, dbHas, count, tableHas, hasForeignKey, allSql } from './_sqlHelpers.js';

const SQLITE_NOTE =
  'El motor es SQLite: el SQL estándar que pide el examen funciona igual. Las diferencias (por ejemplo, Oracle usa VARCHAR2 o ALTER TABLE … ADD CONSTRAINT) se indican en cada lección.';

export const bbdd = [
  {
    id: 'bd-modelo',
    type: 'concept',
    title: '¿Qué es una base de datos relacional?',
    summary: 'Tablas, filas y columnas, claves primarias y foráneas, y del modelo E/R a tablas.',
    body: `Una **base de datos** guarda información de forma organizada para poder consultarla y modificarla con seguridad, aunque la usen muchas personas a la vez. El programa que la gestiona es el **SGBD** (Oracle, SQL Server, MySQL, PostgreSQL…).

## El modelo relacional
Los datos se guardan en **tablas** (relaciones):
- Cada **fila** (tupla) es un elemento, por ejemplo un alumno.
- Cada **columna** (atributo) es una característica suya: dni, nombre, email…
- **Grado** = número de columnas. **Cardinalidad** = número de filas. Una tabla con 4 columnas y 7 filas tiene grado 4 y cardinalidad 7.

## Claves
- **Clave primaria (PK)**: identifica cada fila de forma única y no admite nulos (\`id_alumno\`).
- **Clave foránea (FK)**: columna que **apunta a la clave primaria de otra tabla**. Es lo que relaciona las tablas: \`MATRICULA.id_alumno\` apunta a \`ALUMNO.id_alumno\`.
- La **integridad referencial** impide matricular a un alumno que no existe o borrar un alumno que tiene matrículas.

## Del diagrama E/R a las tablas
En el supuesto de 2025, un alumno puede tener **muchas** matrículas y cada matrícula es de **un** alumno: es una relación **1:N**. Se implementa poniendo la clave del lado «1» como clave foránea en el lado «N» (\`id_alumno\` en MATRICULA).

Si la relación fuera **N:M**, por ejemplo alumnos y programas, haría falta una **tabla intermedia**. Fíjate en que MATRICULA es justo eso entre ALUMNO y PROGRAMA_FORMATIVO.

## SQL, el lenguaje
- **DDL** define la estructura: \`CREATE\`, \`ALTER\`, \`DROP\`.
- **DML** trabaja con los datos: \`SELECT\`, \`INSERT\`, \`UPDATE\`, \`DELETE\`.
- **DCL** controla los permisos: \`GRANT\`, \`REVOKE\`.
- **TCL** gestiona las transacciones: \`COMMIT\`, \`ROLLBACK\`.

En las siguientes lecciones escribirás SQL de verdad sobre las tablas de los supuestos del examen.`,
    quiz: [
      {
        q: 'Una tabla con 5 columnas y 20 filas tiene…',
        options: ['grado 20 y cardinalidad 5', 'grado 5 y cardinalidad 20', 'dominio 5', 'grado 25'],
        answer: 1,
        why: 'Grado = columnas; cardinalidad = filas.',
      },
      {
        q: 'Una clave foránea es…',
        options: ['un atributo sin relación con otras tablas', 'un atributo que referencia la clave primaria de otra tabla', 'cualquier columna con valores repetidos', 'la clave primaria de la propia tabla'],
        answer: 1,
        why: 'Es lo que une las tablas entre sí. Salió en el examen de 2024.',
      },
      {
        q: 'Un alumno tiene muchas matrículas y cada matrícula es de un alumno. ¿Dónde va la FK?',
        options: ['En ALUMNO', 'En MATRICULA', 'En una tabla nueva', 'En las dos'],
        answer: 1,
        why: 'En una 1:N, la clave del lado 1 viaja al lado N.',
      },
      {
        q: '¿Qué tipo de sentencia es SELECT?',
        options: ['DDL', 'DML', 'DCL', 'TCL'],
        answer: 1,
        why: 'Manipulación de datos (algunos autores la llaman DQL).',
      },
    ],
    exam: ['tai2025A-P38', 'tai2024A-P28', 'tai2024A-S1-4', 'tai2024A-P37', 'tai2025X-P33', 'tai2025X-P37'],
  },
  {
    id: 'sql-select',
    type: 'sql',
    seed: ['educa'],
    title: 'Tu primera consulta: SELECT',
    summary: 'Leer datos de una tabla, elegir columnas y buscar valores vacíos (NULL).',
    body: `Estás en la base de datos del proyecto **EDUCA-DATA 2030** (supuesto I de 2025). A la izquierda tienes el esquema: las tablas y sus columnas.

Para **leer** datos se usa \`SELECT\`:

\`\`\`
SELECT * FROM ALUMNO;
\`\`\`

El \`*\` significa «todas las columnas». Para elegir solo algunas, se escriben separadas por comas:

\`\`\`
SELECT nombre, email FROM ALUMNO;
\`\`\`

Un hueco sin dato se llama **NULL**. Ojo, porque no se compara con \`=\` sino con \`IS NULL\` (o \`IS NOT NULL\`):

\`\`\`
SELECT nombre FROM ALUMNO WHERE email IS NULL;
\`\`\`

Escribe la consulta en el editor y pulsa **Ejecutar** (o Ctrl+Intro). El punto y coma final separa sentencias.`,
    objectives: [
      { label: 'Muestra todos los datos de la tabla ALUMNO', check: returnsSame('SELECT * FROM ALUMNO') },
      { label: 'Muestra solo el nombre y el email de cada alumno', check: (db) => db.log.some((e) => e.ok && e.columns?.length === 2) && returnsSame('SELECT nombre, email FROM ALUMNO')(db) },
      { label: 'Lista los alumnos que no tienen email', check: returnsSame('SELECT nombre FROM ALUMNO WHERE email IS NULL') },
    ],
    hints: ['SELECT * FROM ALUMNO;', 'SELECT nombre, email FROM ALUMNO;', 'SELECT nombre FROM ALUMNO WHERE email IS NULL;'],
    curiosity: 'SQL nació en IBM en los años 70 con el nombre SEQUEL (Structured English Query Language). Por eso hay quien lo pronuncia «sícuel».',
  },
  {
    id: 'sql-filtros',
    type: 'sql',
    seed: ['educa'],
    title: 'Filtrar y ordenar: WHERE, LIKE, IN y ORDER BY',
    summary: 'Condiciones, comodines y orden de los resultados.',
    body: `\`WHERE\` filtra las filas que cumplen una condición:
- Comparaciones: \`=\`, \`<>\` (distinto), \`>\`, \`<\`, \`>=\`, \`<=\`. Los textos van entre **comillas simples**: \`estado = 'ACTIVA'\`.
- Para combinar condiciones: \`AND\`, \`OR\` y \`NOT\`.
- \`IN ('Madrid', 'Valencia')\` equivale a varios OR.
- \`BETWEEN 10 AND 20\` es un rango, con los extremos incluidos.
- **\`LIKE\` con comodines**: \`%\` sustituye a cualquier cadena y \`_\` a un solo carácter. \`LIKE '2008%'\` significa «empieza por 2008», y \`NOT LIKE '%.pdf'\`, «no termina en .pdf».

\`ORDER BY columna\` ordena los resultados: \`ASC\` de menor a mayor (por defecto) o \`DESC\` de mayor a menor.

Un truco con fechas: guardadas como 'AAAA-MM-DD', ordenarlas de mayor a menor pone primero las más recientes, es decir, a los alumnos **más jóvenes**.`,
    objectives: [
      { label: 'Muestra las matrículas en estado ACTIVA', check: returnsSame("SELECT id_matricula FROM MATRICULA WHERE estado = 'ACTIVA'") },
      { label: 'Muestra los alumnos nacidos en 2008 (pista: LIKE)', check: returnsSame("SELECT nombre FROM ALUMNO WHERE fecha_nacimiento LIKE '2008%'") },
      { label: 'Muestra los centros de Madrid o de Valencia', check: returnsSame("SELECT codigo_centro FROM CENTRO_EDUCATIVO WHERE provincia IN ('Madrid', 'Valencia')") },
      { label: 'Lista los alumnos del más joven al más mayor', check: returnsSame('SELECT nombre FROM ALUMNO ORDER BY fecha_nacimiento DESC', { ordered: true }) },
    ],
    hints: [
      "SELECT * FROM MATRICULA WHERE estado = 'ACTIVA';",
      "SELECT nombre FROM ALUMNO WHERE fecha_nacimiento LIKE '2008%';",
      "SELECT * FROM CENTRO_EDUCATIVO WHERE provincia IN ('Madrid', 'Valencia');",
      'SELECT nombre, fecha_nacimiento FROM ALUMNO ORDER BY fecha_nacimiento DESC;',
    ],
    exam: ['tai2024A-S1R3', 'tai2025X-S1-10', 'tai2019-S1-16', 'tai2019-S1-19'],
  },
  {
    id: 'sql-modificar',
    type: 'sql',
    seed: ['becas'],
    title: 'Modificar datos: INSERT, UPDATE y DELETE',
    summary: 'Añadir, cambiar y borrar filas, y por qué no hay que olvidar el WHERE.',
    body: `Cambias de base de datos: ahora estás en la del **sistema de becas** (supuesto I de 2024).

- **Añadir** una fila:
\`\`\`
INSERT INTO CuerpoBecado (Codigo, Denominacion) VALUES ('TAI', 'Técnico Auxiliar de Informática');
\`\`\`
  Es **INSERT INTO**, con las columnas entre paréntesis y los textos entre comillas simples. Es exactamente la pregunta 3 del supuesto I de 2024. Como \`IdCuerpoBecado\` es la clave primaria autonumérica, puedes no indicarla.
- **Cambiar** filas: \`UPDATE tabla SET columna = valor WHERE condición;\`
- **Borrar** filas: \`DELETE FROM tabla WHERE condición;\`

**Cuidado:** un \`UPDATE\` o un \`DELETE\` **sin WHERE** afecta a **todas** las filas. Es el error más famoso del SQL.

Las **claves foráneas** protegen la integridad: no puedes borrar un interesado que tiene solicitudes, porque estas se quedarían apuntando a nadie. Compruébalo en el último objetivo.`,
    objectives: [
      { label: "Da de alta el cuerpo con código 'TAI' (Técnico Auxiliar de Informática)", check: count("SELECT COUNT(*) FROM CuerpoBecado WHERE Codigo = 'TAI'", 1) },
      { label: 'Cambia la solicitud 3 al estado Concedida (IdEstado = 3)', check: count('SELECT IdEstado FROM SolicitudBeca WHERE IdSolicitudBeca = 3', 3) },
      {
        label: "Borra el fichero 'foto.png' (y solo ese)",
        check: allSql(count("SELECT COUNT(*) FROM FicheroAdjunto WHERE Denominacion = 'foto.png'", 0), count('SELECT COUNT(*) FROM FicheroAdjunto', 7)),
      },
      { label: 'Intenta borrar a la interesada con DNI 00000000T y lee por qué falla', check: ranSql(/^delete from interesado/i, { ok: false }) },
    ],
    hints: [
      "INSERT INTO CuerpoBecado (Codigo, Denominacion) VALUES ('TAI', 'Técnico Auxiliar de Informática');",
      'UPDATE SolicitudBeca SET IdEstado = 3 WHERE IdSolicitudBeca = 3;',
      "DELETE FROM FicheroAdjunto WHERE Denominacion = 'foto.png';",
      "DELETE FROM Interesado WHERE DocumentoIdentidad = '00000000T';",
    ],
    exam: ['tai2024A-S1-3', 'tai2022-P22', 'tai2022-P43', 'tai2019-S1-18'],
  },
  {
    id: 'sql-crear',
    type: 'sql',
    seed: ['becas'],
    title: 'Crear tablas y restricciones',
    summary: 'CREATE TABLE, claves primarias y foráneas, y UNIQUE (supuestos 2024 y 2025).',
    body: `\`CREATE TABLE\` define una tabla nueva: su nombre y, para cada columna, su nombre, su tipo y sus restricciones.

\`\`\`
CREATE TABLE Subsanacion (
  IdSubsanacion BIGINT PRIMARY KEY,
  IdSolicitudBeca BIGINT NOT NULL REFERENCES SolicitudBeca(IdSolicitudBeca),
  TextoFundamento VARCHAR(2000)
);
\`\`\`

- \`PRIMARY KEY\`: la clave primaria.
- \`REFERENCES Tabla(columna)\`: la **clave foránea**. También se puede escribir como \`FOREIGN KEY (col) REFERENCES Tabla(col)\` al final.
- \`NOT NULL\` (obligatorio), \`UNIQUE\` (sin repetidos), \`CHECK (condición)\` y \`DEFAULT valor\`.

En el supuesto de 2024 preguntaron cuál era la sentencia correcta: \`CREATE TABLE\`, a secas (no «CREATE NEW TABLE» ni «CREATE TABLE … AS (…)»).

**UNIQUE e índices**: en 2025 preguntaron cómo impedir DNI duplicados con el máximo rendimiento. En Oracle es \`ALTER TABLE ALUMNO ADD CONSTRAINT dni_unique UNIQUE (dni);\`: la restricción UNIQUE crea por debajo un índice único. SQLite no admite añadir restricciones con ALTER TABLE, así que aquí el equivalente es:

\`\`\`
CREATE UNIQUE INDEX idx_email ON Interesado (Email);
\`\`\`

Un \`CREATE INDEX\` normal acelera las búsquedas, pero **no** impide duplicados.

*${SQLITE_NOTE}*`,
    objectives: [
      { label: 'Crea la tabla Subsanacion con IdSubsanacion, IdSolicitudBeca y TextoFundamento', check: tableHas('Subsanacion', ['IdSubsanacion', 'IdSolicitudBeca', 'TextoFundamento']) },
      { label: 'Haz que IdSolicitudBeca sea clave foránea hacia SolicitudBeca', check: hasForeignKey('Subsanacion', 'SolicitudBeca') },
      { label: 'Inserta una subsanación para la solicitud 3', check: count('SELECT COUNT(*) FROM Subsanacion WHERE IdSolicitudBeca = 3', 1) },
      {
        label: 'Impide que dos interesados tengan el mismo Email',
        check: dbHas(
          "SELECT COUNT(*) FROM sqlite_master WHERE type = 'index' AND tbl_name = 'Interesado' AND sql LIKE '%UNIQUE%' AND sql LIKE '%Email%'",
          (r) => r[0][0] > 0,
        ),
      },
    ],
    hints: [
      'CREATE TABLE Subsanacion (IdSubsanacion BIGINT PRIMARY KEY, IdSolicitudBeca BIGINT, TextoFundamento VARCHAR(2000));',
      'Si ya la creaste sin clave foránea: DROP TABLE Subsanacion; y créala con … IdSolicitudBeca BIGINT REFERENCES SolicitudBeca(IdSolicitudBeca) …',
      "INSERT INTO Subsanacion VALUES (1, 3, 'Falta el certificado de empadronamiento');",
      'CREATE UNIQUE INDEX idx_email ON Interesado (Email);',
    ],
    exam: ['tai2024A-S1-13', 'tai2025A-S1-1', 'tai2025A-S1R5', 'tai2022-S1-4'],
  },
  {
    id: 'sql-join',
    type: 'sql',
    seed: ['educa'],
    title: 'Combinar tablas: JOIN',
    summary: 'INNER JOIN y LEFT JOIN, la consulta que cayó en el supuesto de 2025.',
    body: `Los datos están repartidos en varias tablas. Para juntarlos se usa **JOIN**, indicando por qué columnas casan:

\`\`\`
SELECT ALUMNO.nombre, MATRICULA.estado
FROM ALUMNO
INNER JOIN MATRICULA ON ALUMNO.id_alumno = MATRICULA.id_alumno;
\`\`\`

- **INNER JOIN** (o solo JOIN): devuelve solo las filas que tienen pareja en **las dos** tablas. Es «los alumnos que tienen matrículas», la pregunta 2 del supuesto I de 2025.
- **LEFT JOIN**: devuelve **todas** las filas de la tabla de la izquierda; si no tienen pareja, las columnas de la otra tabla salen a NULL. Sirve para encontrar a «los que no tienen…».
- Puedes encadenar varios JOIN y usar **alias** para escribir menos: \`FROM ALUMNO a JOIN MATRICULA m ON a.id_alumno = m.id_alumno\`.

Si una columna existe en las dos tablas (\`id_alumno\`), hay que poner delante el nombre de la tabla o el alias; si no, el error es «columna ambigua».

Ojo con la trampa del examen: \`SELECT * FROM ALUMNO, MATRICULA\` sin condición hace el **producto cartesiano**: combina cada alumno con todas las matrículas.`,
    objectives: [
      { label: 'Muestra los alumnos que tienen matrícula, con INNER JOIN', check: allSql(ranSql(/join/i), returnsSame('SELECT a.nombre FROM ALUMNO a INNER JOIN MATRICULA m ON a.id_alumno = m.id_alumno')) },
      {
        label: 'Muestra el nombre de cada alumno junto al nombre del programa en el que está matriculado',
        check: returnsSame('SELECT a.nombre, p.nombre FROM ALUMNO a JOIN MATRICULA m ON a.id_alumno = m.id_alumno JOIN PROGRAMA_FORMATIVO p ON p.id_programa = m.id_programa'),
      },
      {
        label: 'Encuentra a los alumnos sin ninguna matrícula (con LEFT JOIN … IS NULL)',
        check: allSql(ranSql(/left (outer )?join/i), returnsSame('SELECT nombre FROM ALUMNO WHERE id_alumno NOT IN (SELECT id_alumno FROM MATRICULA)')),
      },
    ],
    hints: [
      'SELECT ALUMNO.nombre FROM ALUMNO INNER JOIN MATRICULA ON ALUMNO.id_alumno = MATRICULA.id_alumno;',
      'SELECT a.nombre, p.nombre FROM ALUMNO a JOIN MATRICULA m ON a.id_alumno = m.id_alumno JOIN PROGRAMA_FORMATIVO p ON p.id_programa = m.id_programa;',
      'SELECT a.nombre FROM ALUMNO a LEFT JOIN MATRICULA m ON a.id_alumno = m.id_alumno WHERE m.id_matricula IS NULL;',
    ],
    exam: ['tai2025A-S1-2'],
  },
  {
    id: 'sql-agrupar',
    type: 'sql',
    seed: ['educa'],
    title: 'Contar y agrupar: COUNT, GROUP BY y HAVING',
    summary: 'Funciones de agregado y grupos (supuesto 2025).',
    body: `Las **funciones de agregado** resumen muchas filas en un valor: \`COUNT(*)\` (cuántas), \`SUM\`, \`AVG\` (media), \`MAX\` y \`MIN\`.

\`\`\`
SELECT COUNT(*) FROM ALUMNO;
\`\`\`

Con **GROUP BY** se calcula un resultado **por grupo**. «Número de matrículas por programa formativo», la pregunta 3 del supuesto I de 2025, se escribe así:

\`\`\`
SELECT id_programa, COUNT(*) FROM MATRICULA GROUP BY id_programa;
\`\`\`

Las trampas de las otras opciones: \`GROUP id_programa\` (falta el BY), \`SUM(*)\` (no existe) o pedir \`id_programa\` sin agrupar.

**HAVING** filtra **grupos**, mientras que **WHERE** filtra **filas** antes de agrupar. Por ejemplo, para los programas con más de una matrícula activa: primero WHERE estado = 'ACTIVA', después GROUP BY y, al final, HAVING COUNT(*) > 1.`,
    objectives: [
      { label: 'Cuenta cuántos alumnos hay', check: returnsSame('SELECT COUNT(*) FROM ALUMNO') },
      { label: 'Muestra el número de matrículas por programa formativo', check: allSql(ranSql(/group by/i), returnsSame('SELECT id_programa, COUNT(*) FROM MATRICULA GROUP BY id_programa')) },
      {
        label: 'Muestra los programas con más de una matrícula ACTIVA (usa HAVING)',
        check: allSql(ranSql(/having/i), returnsSame("SELECT id_programa FROM MATRICULA WHERE estado = 'ACTIVA' GROUP BY id_programa HAVING COUNT(*) > 1")),
      },
      { label: 'Calcula la media del valor de los indicadores', check: returnsSame('SELECT AVG(valor) FROM INDICADOR') },
    ],
    hints: [
      'SELECT COUNT(*) FROM ALUMNO;',
      'SELECT id_programa, COUNT(*) FROM MATRICULA GROUP BY id_programa;',
      "SELECT id_programa, COUNT(*) FROM MATRICULA WHERE estado = 'ACTIVA' GROUP BY id_programa HAVING COUNT(*) > 1;",
      'SELECT AVG(valor) FROM INDICADOR;',
    ],
    exam: ['tai2025A-S1-3', 'tai2025X-S1-9', 'tai2019-S1-17'],
  },
  {
    id: 'sql-subconsultas',
    type: 'sql',
    seed: ['becas'],
    title: 'Subconsultas',
    summary: 'Consultas dentro de consultas: la pregunta de reserva de 2024, resuelta paso a paso.',
    body: `Una **subconsulta** es un SELECT dentro de otro, entre paréntesis. Se resuelve de dentro hacia fuera.

- Con \`=\`, la subconsulta debe devolver **un solo valor**: \`WHERE IdInteresado = (SELECT IdInteresado FROM Interesado WHERE DocumentoIdentidad = '00000000T')\`.
- Con \`IN\` puede devolver **varios**: \`WHERE IdInteresado IN (SELECT IdInteresado FROM SolicitudBeca WHERE …)\`.
- \`NOT IN\` y \`NOT EXISTS\` sirven para buscar los que **no** tienen algo.

**La reserva 3 del supuesto I de 2024** pedía los ficheros adjuntos que **no son PDF** de la solicitud de 2024 del interesado con DNI 00000000T. Se construye por capas:
1. El interesado: \`SELECT IdInteresado FROM Interesado WHERE DocumentoIdentidad = '00000000T'\`.
2. Su solicitud de 2024: \`SELECT IdSolicitudBeca FROM SolicitudBeca WHERE AñoConvocatoria = 2024 AND IdInteresado = (…paso 1…)\`.
3. Sus ficheros que no son PDF: \`SELECT * FROM FicheroAdjunto WHERE Denominacion NOT LIKE '%.pdf' AND IdSolicitudBeca = (…paso 2…)\`.

Las opciones incorrectas fallaban por detalles: faltaba un \`FROM\`, había un \`LIKE\` donde debía ir \`NOT LIKE\`, o se escribía \`'pdf'\` sin el comodín \`%\`.`,
    objectives: [
      {
        label: 'Resuelve la reserva 3 de 2024: los ficheros no PDF de la solicitud de 2024 del DNI 00000000T',
        check: returnsSame(
          "SELECT IdFicheroAdjunto FROM FicheroAdjunto WHERE Denominacion NOT LIKE '%.pdf' AND IdSolicitudBeca = (SELECT IdSolicitudBeca FROM SolicitudBeca WHERE AñoConvocatoria = 2024 AND IdInteresado = (SELECT IdInteresado FROM Interesado WHERE DocumentoIdentidad = '00000000T'))",
        ),
      },
      {
        label: 'Muestra los interesados con alguna solicitud concedida (IdEstado = 3), usando una subconsulta con IN',
        check: allSql(ranSql(/in \(\s*select/i), returnsSame('SELECT Nombre FROM Interesado WHERE IdInteresado IN (SELECT IdInteresado FROM SolicitudBeca WHERE IdEstado = 3)')),
      },
      {
        label: 'Encuentra a los interesados que no han presentado ninguna solicitud',
        check: returnsSame('SELECT Nombre FROM Interesado WHERE IdInteresado NOT IN (SELECT IdInteresado FROM SolicitudBeca)'),
      },
    ],
    hints: [
      "SELECT * FROM FicheroAdjunto WHERE Denominacion NOT LIKE '%.pdf' AND IdSolicitudBeca = (SELECT IdSolicitudBeca FROM SolicitudBeca WHERE AñoConvocatoria = 2024 AND IdInteresado = (SELECT IdInteresado FROM Interesado WHERE DocumentoIdentidad = '00000000T'));",
      'SELECT Nombre FROM Interesado WHERE IdInteresado IN (SELECT IdInteresado FROM SolicitudBeca WHERE IdEstado = 3);',
      'SELECT Nombre FROM Interesado WHERE IdInteresado NOT IN (SELECT IdInteresado FROM SolicitudBeca);',
    ],
    exam: ['tai2024A-S1R3'],
  },
  {
    id: 'sql-transacciones',
    type: 'sql',
    seed: ['becas'],
    title: 'Transacciones y disparadores',
    summary: 'BEGIN, ROLLBACK y COMMIT para deshacer errores, y triggers que se ejecutan solos.',
    body: `Una **transacción** agrupa varias operaciones que deben hacerse **todas o ninguna** (las propiedades **ACID**):
- \`BEGIN;\` (o START TRANSACTION) la abre.
- \`COMMIT;\` confirma los cambios.
- \`ROLLBACK;\` **deshace** todo lo hecho desde el BEGIN, o desde un \`SAVEPOINT nombre\` si usas \`ROLLBACK TO nombre\`. Salió en el examen de 2025.

Vas a provocar un desastre controlado: abre una transacción, borra **todos** los ficheros adjuntos (sí, sin WHERE) y deshazlo.

Un **disparador (trigger)** es código que el SGBD ejecuta **solo** cuando ocurre un evento (\`INSERT\`, \`UPDATE\` o \`DELETE\`) sobre una tabla, **antes** (\`BEFORE\`) o **después** (\`AFTER\`). Si el trigger falla, la operación que lo disparó **se cancela**.

\`\`\`
CREATE TRIGGER validar_cambio BEFORE UPDATE ON SolicitudBeca
FOR EACH ROW WHEN NEW.AñoConvocatoria < 2020
BEGIN
  SELECT RAISE(ABORT, 'Año de convocatoria no válido');
END;
\`\`\`

La cabecera \`CREATE TRIGGER nombre BEFORE UPDATE ON tabla\` es la sintaxis ANSI que preguntaron en 2025. El cuerpo (\`RAISE\`) es propio de SQLite: en Oracle se usa \`RAISE_APPLICATION_ERROR\`.`,
    objectives: [
      {
        label: 'Abre una transacción, borra todos los ficheros adjuntos y deshazlo con ROLLBACK',
        check: allSql(ranSql(/^delete from ficheroadjunto;?$/i), ranSql(/^rollback/i), count('SELECT COUNT(*) FROM FicheroAdjunto', 8)),
      },
      {
        label: 'Crea un trigger BEFORE UPDATE sobre SolicitudBeca',
        check: dbHas("SELECT sql FROM sqlite_master WHERE type = 'trigger' AND tbl_name = 'SolicitudBeca'", (r) => r.some(([s]) => /before\s+update/i.test(s))),
      },
      { label: 'Comprueba que el trigger impide una actualización no válida', check: ranSql(/^update solicitudbeca/i, { ok: false }) },
    ],
    hints: [
      'BEGIN; luego DELETE FROM FicheroAdjunto; (mira con SELECT COUNT(*) FROM FicheroAdjunto; que no queda ninguno) y ROLLBACK;',
      "CREATE TRIGGER validar_cambio BEFORE UPDATE ON SolicitudBeca FOR EACH ROW WHEN NEW.AñoConvocatoria < 2020 BEGIN SELECT RAISE(ABORT, 'Año de convocatoria no válido'); END;",
      'UPDATE SolicitudBeca SET AñoConvocatoria = 2010 WHERE IdSolicitudBeca = 1;',
    ],
    exam: ['tai2025A-P43', 'tai2025A-P44', 'tai2024A-P39', 'tai2025X-P38', 'tai2025X-P39', 'tai2022-P33', 'tai2022-P42', 'tai2019-P42', 'tai2019-P43'],
  },
];
