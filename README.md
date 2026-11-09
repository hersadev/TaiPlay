# TaiPlay

Una plataforma para preparar la oposición de **Técnico Auxiliar de Informática (TAI)**
de la Administración del Estado partiendo de cero. Aprendes cada tema con explicaciones
sencillas y ejercicios guiados, practicas con las preguntas reales de los últimos
exámenes y ensayas los supuestos prácticos en condiciones de examen.

Todo corre en tu navegador y el progreso se guarda solo ahí: no hay cuentas ni servidor.

## Qué tiene

- **Aprende**: rutas ordenadas de menos a más.
  - *Empieza desde cero*: hardware, binario y hexadecimal, sistemas operativos, redes y
    subnetting, y lógica de programación. Lectura más un test corto.
  - *Linux y la terminal*: una terminal simulada en el navegador con sistema de
    ficheros, permisos, `sudo`, tuberías, redirecciones, `systemctl`, `ss`, `ip route`,
    `tar`… Las lecciones validan lo que has hecho de verdad en la máquina, no lo que
    has escrito.
  - *Docker y contenedores*: un Docker simulado con el ciclo de vida completo (`pull`,
    `run -d -p --name`, `ps -a`, `logs`, `exec -it`, `stop`/`kill`, `rm`, `rmi`, IDs
    abreviados…) más la teoría de imágenes, hipervisores y Kubernetes.
  - *Bases de datos y SQL*: SQL de verdad en el navegador (SQLite compilado a
    WebAssembly) sobre las tablas de los supuestos del examen: consultas, filtros,
    INSERT/UPDATE/DELETE, CREATE TABLE con claves, JOIN, GROUP BY/HAVING,
    subconsultas, transacciones y disparadores.
  - Redes, Programación, Seguridad y Legislación están anunciadas; mientras llegan,
    enlazan a sus fichas del temario y a sus preguntas en el banco.
- **Temario**: los 33 temas del programa oficial (4 bloques), cada uno con una ficha de
  repaso propia (lo esencial y lo que más cae), un test corto, las lecciones relacionadas
  y sus preguntas reales. Se ve cuánto ha pesado cada tema en los exámenes.
- **Banco de preguntas**: las 270 preguntas de los exámenes de 2024 y 2025 (modelo A),
  con la respuesta de la **plantilla oficial definitiva** del INAP (incluidas las
  anuladas), clasificadas por tema del programa y por materia, con una explicación. Puedes filtrar
  por tema, materia, examen, parte o «falladas», y cada pregunta enlaza con la lección que la explica.
- **Supuestos prácticos**: los cuatro supuestos reales, con su enunciado y su modelo de
  datos, en modo estudio (corrección al momento) o en modo examen (cronometrado).
- **Logros**: 31 logros en seis categorías, niveles por puntos, racha de días de estudio
  y de aciertos seguidos, con aviso al desbloquear cada uno.
- **Simulacro**: la primera parte y un supuesto contra el reloj, corregidos con
  penalización por error (configurable) y con la regla de las preguntas de reserva que
  sustituyen a las anuladas.

## Cómo ejecutarlo

Con Node 20 o superior:

```bash
npm install
npm run dev
```

y abre http://localhost:5173.

Con Docker:

```bash
docker compose up --build
```

y abre http://localhost:8080.

## Si quieres tocar el código

Es React 18 con Vite, Tailwind y Zustand, sin backend, igual que JSPlay.

- [src/engine/terminal/](src/engine/terminal/): el simulador. `vfs.js` (sistema de
  ficheros en memoria), `parse.js` (comillas, `|`, `>`, `>>`, `&&`), `commands.js`
  (las órdenes de Linux), `docker.js` y `shell.js`, que lo une todo. No depende del
  navegador.
- [src/engine/sql/](src/engine/sql/): la base de datos de práctica sobre sql.js, con
  las tablas de los supuestos (`seeds.js`) y los errores de SQLite traducidos.
- [src/lessons/](src/lessons/): una ruta por fichero. Los validadores reutilizables
  están en [src/lessons/_helpers.js](src/lessons/_helpers.js).
- [src/data/temario/](src/data/temario/): las fichas de los 33 temas, un fichero por bloque.
- [src/data/exams/](src/data/exams/): un JSON por examen con el enunciado, las
  opciones, la respuesta oficial, el tema y la explicación. Es la fuente de verdad: si
  encuentras una errata, corrígela ahí.
- [src/data/logros.js](src/data/logros.js): los logros y los niveles, calculados a
  partir del progreso guardado.
- [src/utils/scoring.js](src/utils/scoring.js): la corrección (penalización y
  reservas).

Pruebas (`npm test`): el motor de la terminal, la corrección, los logros y, sobre todo,
que **cada lección práctica (terminal o SQL) se puede completar** con su solución de referencia y que ningún
objetivo se cumple sin hacer nada. Si añades una lección, añade su solución a
[tests/lessons.test.js](tests/lessons.test.js). También hay lint (`npm run lint`).

## Fuentes

Los enunciados proceden de los cuestionarios oficiales publicados por el INAP, y las
respuestas, de las plantillas definitivas del tribunal. El modelo B de cada año tiene
las mismas preguntas en otro orden, por eso solo se incluye el A. Las explicaciones y las
fichas del temario son de elaboración propia: si algo no te cuadra, la plantilla oficial
y la norma mandan.
