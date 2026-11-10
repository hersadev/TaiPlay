# TaiPlay

Una plataforma para preparar la oposición de **Técnico Auxiliar de Informática (TAI)**
de la Administración del Estado partiendo de cero. Aprendes cada tema con explicaciones
sencillas y ejercicios guiados, practicas con las preguntas reales de los últimos
exámenes y ensayas los supuestos prácticos en condiciones de examen.

Todo corre en tu navegador y el progreso se guarda solo ahí: no hay cuentas ni servidor.

## Qué tiene

- **Aprende**: rutas ordenadas de menos a más.
  - *Empieza desde cero*: hardware, binario y hexadecimal, sistemas operativos, redes y
    subnetting, y lógica de programación. Lectura más un test corto, y dos prácticas con
    ejercicios generados al azar: cambios de base y operaciones con bits, y unidades
    (KB frente a KiB, Mbps frente a MB/s) con la capacidad y los fallos que aguanta cada RAID.
  - *Linux y la terminal*: una terminal simulada en el navegador con sistema de
    ficheros, permisos, `sudo`, tuberías, redirecciones, `systemctl`, `ss`, `ip route`,
    `tar`… y la administración del supuesto: procesos (`ps`, `top`, `kill`) y
    `journalctl`, diagnóstico de red (`ping`, `traceroute`, `curl`) con
    `firewall-cmd --add-port`, disco lleno (`df`, `du`, `truncate`) y `fsck -y`, LVM
    (`pvs`/`vgs`/`lvs`, `lvextend`, `xfs_growfs`), paquetes (`dnf`, y `apt` en los
    contenedores Debian/Ubuntu) y `crontab`, con una práctica al azar para leer y
    escribir líneas de crontab. Las lecciones validan lo que has hecho de
    verdad en la máquina, no lo que has escrito.
  - *Windows y PowerShell*: un PowerShell simulado con cmdlets y parámetros de verdad
    (abreviables, y con el error real si escribes `-Recursive`), alias y `Get-Help`:
    `Copy-Item -Recurse`, `netsh advfirewall` y `New-NetFirewallRule` con elevación,
    `Install-WindowsFeature` y la promoción a controlador de dominio, `repadmin` y
    `dcdiag` para arreglar la replicación, y `sfc /scannow` con `DISM`. Más la teoría
    de Active Directory (OU, GPO, PSO, FSMO).
  - *Docker y contenedores*: un Docker simulado con el ciclo de vida completo (`pull`,
    `run -d -p --name`, `ps -a`, `logs`, `exec -it`, `stop`/`kill`, `rm`, `rmi`, IDs
    abreviados…), `docker build` con un Dockerfile de verdad (cada `RUN` se ejecuta
    dentro de la imagen), `docker history` y `docker compose` (`up -d`, `ps`, `logs`,
    `exec`, `down`) sobre un `compose.yaml`, más la teoría de imágenes, hipervisores y
    Kubernetes.
  - *Bases de datos y SQL*: SQL de verdad en el navegador (SQLite compilado a
    WebAssembly) sobre las tablas de los supuestos del examen: consultas, filtros,
    INSERT/UPDATE/DELETE, CREATE TABLE con claves, JOIN, GROUP BY/HAVING,
    subconsultas, transacciones y disparadores.
  - *Redes y comunicaciones*: ejercicios de subnetting generados al azar (máscaras,
    hosts, red y broadcast, misma red, dividir en subredes, máscara para N subredes o N
    hosts) con la solución explicada, y un switch Cisco IOS simulado: modos de la CLI,
    abreviaturas, `?` y Tab, VLAN, `switchport access vlan`, troncales 802.1Q, SVI con
    `ip helper-address`, port-security con MAC sticky y `copy running-config startup-config`.
    Además, una práctica al azar de puertos bien conocidos y de abreviar y expandir
    direcciones IPv6.
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
- **Banco de preguntas**: las 675 preguntas de los exámenes de 2019, 2022, 2024 y 2025
  (modelo A) y del llamamiento extraordinario de 2025,
  con la respuesta de la **plantilla oficial definitiva** del INAP (incluidas las
  anuladas), clasificadas por tema del programa y por materia, con una explicación. Puedes filtrar
  por tema, materia, examen, parte o «falladas», y cada pregunta enlaza con la lección que la explica.
  Las que fallas entran en un **repaso espaciado**: vuelven el mismo día, a los 3 y a los
  7 días, y salen al acertarlas esas tres veces seguidas.
  Además hay **70 preguntas propias, marcadas como no oficiales**, para los siete temas
  que menos han caído (B1T03, B1T07, B2T01, B3T02, B3T08, B4T01 y B4T09): cada una
  cita su fuente (artículo del BOE, estándar o RFC) y se revisó contra ella. Entran en el
  banco y en los tests por tema, pero nunca en los simulacros, en el Road ni en los
  logros de preguntas.
- **Supuestos prácticos**: los diez supuestos reales, con su enunciado y su modelo de
  datos, en modo estudio (corrección al momento) o en modo examen (cronometrado).
- **Road**: un camino de 20 tramos por todo el temario, bloque a bloque, con un «jefe»
  al final de cada bloque y una recta final con preguntas de todo el programa. Cada tramo
  son 10 preguntas seguidas: si fallas una, pierdes la tirada y vuelves al principio del
  tramo (la siguiente tirada trae otras preguntas). Los tramos superados se pueden repetir.
  Hay dos caminos con su propio avance: el **seguro**, en el que cada tramo pregunta por
  sus temas, y el **alocado**, con los mismos tramos pero con las 10 preguntas de cada
  tirada sacadas de todo el temario.
- **Logros**: 56 logros en siete categorías (incluidos los del Road), niveles por puntos,
  racha de días de estudio y de aciertos seguidos, con aviso al desbloquear cada uno.
- **Editor**: un editor libre de JavaScript con consola, ejemplos y una API de alumnos
  simulada, para practicar lo que quieras. El código se guarda en el navegador.
- **Simulacro**: la primera parte y un supuesto contra el reloj, corregidos con
  penalización por error (configurable) y con la regla de las preguntas de reserva que
  sustituyen a las anuladas. Puede ser un examen pasado o uno **mezclado**: 80 preguntas
  al azar de todos los años con el reparto por bloques de los exámenes reales, más un
  supuesto real completo. Puede priorizar las preguntas que nunca has respondido, y al
  corregir dice cuántas ya habías visto: si son muchas, la nota mide en parte memoria.
- **Progreso**: la evolución de la nota en los simulacros, los temas con peor
  porcentaje de acierto y cuánto has visto de cada bloque del programa.
- **Sin conexión**: es una PWA. Se puede instalar en el móvil o el ordenador y, una vez
  cargada, funciona sin red (service worker en [pwa/sw.js](pwa/sw.js)).

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
  (las órdenes de Linux), `security.js` (hashes, chown, firewalld, nc, sysctl),
  `sysadmin.js` (discos y LVM, red, procesos, journalctl, crontab y paquetes),
  `docker.js` (incluido `docker build`), `compose.js` con su `yaml.js`, y `shell.js`,
  que lo une todo. No depende del navegador.
- [src/engine/powershell/](src/engine/powershell/): PowerShell simulado (Windows 11 y
  Windows Server 2019) con cmdlets, alias, `netsh`, `repadmin`, `dcdiag`, `sfc` y
  `DISM`. Misma interfaz que la shell.
- [src/engine/ios/](src/engine/ios/): el switch Cisco IOS simulado (modos, abreviaturas,
  VLAN, SVI, troncales, port-security). Misma interfaz que la shell, sin navegador.
- [src/engine/drills/](src/engine/drills/): los generadores de ejercicios al azar
  (subnetting, permisos, cambios de base y bits, unidades y RAID, IPv6, puertos y
  crontab) con su corrección y explicación.
- [src/engine/js/](src/engine/js/): ejecución de JavaScript en un Web Worker, con
  consola capturada, fetch simulado y límites de tiempo y de salida.
- [src/engine/repaso/](src/engine/repaso/): la repetición espaciada (de las tarjetas y
  de las preguntas falladas) y el generador de los tests de legislación. Las tarjetas están en
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
  reservas). El simulacro mezclado se monta en
  [src/engine/simulacro.js](src/engine/simulacro.js) y el Road (tramos, tiradas y
  avance) en [src/engine/road.js](src/engine/road.js).

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
