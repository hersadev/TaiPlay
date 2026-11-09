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
  - *Redes y comunicaciones*: ejercicios de subnetting generados al azar (máscaras,
    hosts, red y broadcast, misma red, dividir en subredes, máscara para N subredes o N
    hosts) con la solución explicada, y un switch Cisco IOS simulado: modos de la CLI,
    abreviaturas, `?` y Tab, VLAN, `switchport access vlan`, troncales 802.1Q, SVI con
    `ip helper-address`, port-security con MAC sticky y `copy running-config startup-config`.
  - *Seguridad*: dimensiones del ENS y tipos de ataque; permisos (ejercicios de octal,
    rwx y umask, y bastionado con `find -perm`, `chmod` y `chown`); hashes con
    `sha256sum -c`; el cortafuegos de RHEL con `firewall-cmd`, `nc -vz` y `sysctl`; y un
    juego para emparejar las herramientas del CCN-CERT (LUCIA, EMMA, CLAUDIA…).
  - *Programación*: ejercicios de «¿qué imprime?» en JavaScript que, tras responder, se
    ejecutan de verdad en el navegador (en un Web Worker aislado, con el bucle infinito
    del examen cortado a tiempo) y se pueden modificar; y lectura de código Java y C#
    para señalar la línea del error y decir si es de compilación o de ejecución. Cada
    lección acaba con retos de programar: en JavaScript escribes una función y se
    corrige con pruebas automáticas; en Java y C#, completas el código que falta.
  - *Legislación*: repaso espaciado (cajas de Leitner) de 96 tarjetas con los plazos,
    mayorías, normas y artículos del Bloque I, y tests por bloque de temas que mezclan
    preguntas reales, las de las fichas y otras generadas a partir de las tarjetas.
- **Temario**: los 33 temas del programa oficial (4 bloques), cada uno con una ficha de
  repaso propia (lo esencial y lo que más cae), un test corto, las lecciones relacionadas
  y sus preguntas reales. Se ve cuánto ha pesado cada tema en los exámenes.
- **Banco de preguntas**: las 270 preguntas de los exámenes de 2024 y 2025 (modelo A),
  con la respuesta de la **plantilla oficial definitiva** del INAP (incluidas las
  anuladas), clasificadas por tema del programa y por materia, con una explicación. Puedes filtrar
  por tema, materia, examen, parte o «falladas», y cada pregunta enlaza con la lección que la explica.
- **Supuestos prácticos**: los cuatro supuestos reales, con su enunciado y su modelo de
  datos, en modo estudio (corrección al momento) o en modo examen (cronometrado).
- **Logros**: 39 logros en seis categorías, niveles por puntos, racha de días de estudio
  y de aciertos seguidos, con aviso al desbloquear cada uno.
- **Editor**: un editor libre de JavaScript con consola, ejemplos y una API de alumnos
  simulada, para practicar lo que quieras. El código se guarda en el navegador.
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
- [src/engine/ios/](src/engine/ios/): el switch Cisco IOS simulado (modos, abreviaturas,
  VLAN, SVI, troncales, port-security). Misma interfaz que la shell, sin navegador.
- [src/engine/drills/](src/engine/drills/): los generadores de ejercicios al azar
  (subnetting y permisos) con su corrección y explicación.
- [src/engine/js/](src/engine/js/): ejecución de JavaScript en un Web Worker, con
  consola capturada, fetch simulado y límites de tiempo y de salida.
- [src/engine/repaso/](src/engine/repaso/): la repetición espaciada y el generador de
  los tests de legislación. Las tarjetas están en
  [src/data/legislacion/](src/data/legislacion/).
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
