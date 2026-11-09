// Ruta «Linux y la terminal». Lecciones prácticas sobre la terminal
// simulada: el alumno escribe órdenes de verdad y los objetivos se validan
// mirando el estado de la máquina (ver _helpers.js). Termina con lo que el
// examen pregunta en los supuestos de sistemas: systemctl, ss, ip route, tar…

import {
  ran,
  ranCmd,
  visited,
  cwdIs,
  exists,
  missing,
  fileContains,
  fileLines,
  modeIs,
  serviceIs,
  outputMatches,
  all,
} from './_helpers.js';

const H = '/home/alumno';

const APP_LOG = Array.from({ length: 30 }, (_, i) => {
  const n = i + 1;
  const hh = String(8 + Math.floor(i / 6)).padStart(2, '0');
  const mm = String((i * 7) % 60).padStart(2, '0');
  const level = [4, 11, 17, 23, 28].includes(n) ? 'ERROR' : n % 5 === 0 ? 'WARN' : 'INFO';
  const msg = {
    ERROR: 'No se pudo conectar con la base de datos db01',
    WARN: 'Tiempo de respuesta alto en /solicitudes',
    INFO: `Petición atendida GET /becas/${n}`,
  }[level];
  return `2026-11-09 ${hh}:${mm}:00 ${level} ${msg}`;
}).join('\n') + '\n';

export const linux = [
  {
    id: 'lx-terminal',
    type: 'terminal',
    title: 'Tu primera terminal',
    summary: 'Qué es la terminal y tus tres primeras órdenes: whoami, pwd y ls.',
    body: `La **terminal** (o consola) es una forma de manejar el ordenador **escribiendo órdenes** en vez de pulsar con el ratón. En los servidores Linux de la Administración casi nunca hay ventanas ni iconos: todo se hace así, y por eso el examen pregunta tantas órdenes.

La línea que ves en la terminal, \`alumno@web01:~$\`, es el **prompt**: te dice **quién** eres (alumno), en qué **máquina** estás (web01) y en qué **carpeta** (\`~\` significa «tu carpeta personal»). El \`$\` indica que eres un usuario normal; si fueras administrador (root) verías \`#\`.

Escribe cada orden y pulsa **Intro**:
- \`whoami\`: ¿quién soy?
- \`pwd\`: ¿dónde estoy? (*print working directory*)
- \`ls\`: ¿qué hay aquí? (*list*). Las carpetas aparecen con una \`/\` al final.

Si la pantalla se llena, \`clear\` la limpia. Con las flechas ↑ y ↓ recuperas órdenes anteriores.`,
    setup: {
      files: {
        [`${H}/notas.txt`]: 'Recordatorio: el examen TAI tiene una primera parte de 80 preguntas y un supuesto práctico.\n',
      },
      dirs: [`${H}/documentos`, `${H}/descargas`],
    },
    objectives: [
      { label: 'Averigua con qué usuario estás conectado (whoami)', check: ranCmd('whoami') },
      { label: 'Muestra la carpeta en la que estás (pwd)', check: ranCmd('pwd') },
      { label: 'Lista el contenido de la carpeta (ls)', check: ranCmd('ls') },
    ],
    hints: ['Escribe exactamente whoami y pulsa Intro.', 'Luego pwd, y después ls.'],
    curiosity: 'La primera versión de Unix, abuela de Linux, se escribió en 1969. Muchas órdenes de entonces (ls, cat, cp…) se siguen usando hoy casi igual.',
  },
  {
    id: 'lx-navegar',
    type: 'terminal',
    title: 'Moverse por las carpetas',
    summary: 'cd, rutas absolutas y relativas, .. y los ficheros ocultos.',
    body: `Para cambiar de carpeta se usa \`cd\` (*change directory*):
- \`cd documentos\` entra en la carpeta documentos (ruta **relativa**: desde donde estás).
- \`cd ..\` sube un nivel, a la carpeta padre.
- \`cd /var/log\` va directo a esa carpeta (ruta **absoluta**: empieza por \`/\`, la raíz del sistema).
- \`cd\` a secas, o \`cd ~\`, vuelve a tu carpeta personal (\`/home/alumno\`).

En Linux, los ficheros cuyo nombre empieza por punto (\`.bashrc\`, \`.config\`) están **ocultos**: \`ls\` no los muestra. Para verlos usa \`ls -a\` (*all*). Las letras que van tras un guion son **opciones**, y cambian el comportamiento de la orden.

Un detalle: \`/var/log\` es la carpeta estándar donde el sistema guarda sus **registros** (logs).`,
    setup: {
      dirs: [`${H}/documentos/oposicion`, `${H}/.config`],
      files: {
        [`${H}/documentos/temario.txt`]: 'Bloque I: Organización del Estado\nBloque II: Tecnología básica\nBloque III: Desarrollo\nBloque IV: Sistemas y comunicaciones\n',
        [`${H}/.bashrc`]: '# configuración de la terminal\nalias ll="ls -l"\n',
      },
    },
    objectives: [
      { label: 'Entra en la carpeta documentos', check: visited(`${H}/documentos`) },
      { label: 'Ve a /var/log usando una ruta absoluta', check: visited('/var/log') },
      { label: 'Vuelve a tu carpeta personal y muestra los ocultos con ls -a', check: all(ranCmd('ls', (a) => a.slice(1).some((x) => /^-\w*a/.test(x))), cwdIs(H)) },
    ],
    hints: [
      'cd documentos (y pwd para comprobar dónde estás).',
      'cd /var/log: la barra inicial hace que la ruta sea absoluta.',
      'cd (sin nada) te devuelve a casa. Después: ls -a',
    ],
    curiosity: 'En Windows, la orden equivalente a ls es dir, y las rutas usan \\ en vez de /. Prueba a escribir dir aquí y verás qué pasa.',
  },
  {
    id: 'lx-crear',
    type: 'terminal',
    title: 'Crear y borrar',
    summary: 'mkdir, touch, rm y rmdir. Y por qué en Linux no hay papelera.',
    body: `- \`mkdir nombre\` crea una carpeta (*make directory*). Con \`-p\` crea también las intermedias que falten: \`mkdir -p a/b/c\`.
- \`touch fichero\` crea un fichero vacío.
- \`rm fichero\` borra un fichero (*remove*). **Cuidado: no hay papelera**, lo borrado desaparece.
- \`rmdir carpeta\` borra una carpeta, pero **solo si está vacía**. Para borrar una carpeta con todo su contenido se usa \`rm -r carpeta\` (*recursivo*).

Vas a preparar la estructura de un proyecto web. Mira primero qué hay con \`ls\`.`,
    setup: {
      files: { [`${H}/basura.txt`]: 'esto sobra\n' },
      dirs: [`${H}/vacia`],
    },
    objectives: [
      { label: 'Crea de una vez la ruta proyecto/web/css (mkdir -p)', check: exists(`${H}/proyecto/web/css`, 'dir') },
      { label: 'Crea un fichero vacío proyecto/web/index.html', check: exists(`${H}/proyecto/web/index.html`, 'file') },
      { label: 'Borra el fichero basura.txt', check: missing(`${H}/basura.txt`) },
      { label: 'Borra la carpeta vacia con rmdir', check: all(missing(`${H}/vacia`), ranCmd('rmdir')) },
    ],
    hints: [
      'mkdir -p proyecto/web/css',
      'touch proyecto/web/index.html',
      'rm basura.txt',
      'rmdir vacia',
    ],
    curiosity: 'rm -rf / (borrar todo el sistema a la fuerza) es la broma más famosa de Linux. Las versiones modernas de rm se niegan a hacerlo sin una opción extra muy explícita.',
  },
  {
    id: 'lx-leer',
    type: 'terminal',
    title: 'Leer ficheros y vigilar logs',
    summary: 'cat, head, tail y tail -f (pregunta del examen 2025).',
    body: `Para ver el contenido de un fichero de texto:
- \`cat fichero\` lo muestra entero.
- \`head fichero\` muestra las **primeras** 10 líneas; \`head -n 5 fichero\`, las 5 primeras.
- \`tail fichero\` muestra las **últimas** 10; \`tail -n 3 fichero\`, las 3 últimas.
- \`tail -f fichero\` (*follow*) muestra el final y **se queda esperando**: cada línea nueva que se escriba aparece en pantalla. Es la forma clásica de **vigilar un log en tiempo real**. Se sale con Ctrl+C.

En tu carpeta hay un \`app.log\` con los registros de una aplicación de becas.`,
    setup: {
      files: {
        [`${H}/app.log`]: APP_LOG,
        [`${H}/LEEME.txt`]: 'Este servidor aloja la aplicación de becas.\nLos registros están en app.log\n',
      },
    },
    objectives: [
      { label: 'Muestra entero el fichero LEEME.txt', check: ranCmd('cat', (a) => a.includes('LEEME.txt')) },
      { label: 'Muestra solo las 5 primeras líneas de app.log', check: ranCmd('head', (a) => a.includes('app.log') && (a.includes('5') || a.includes('-n5') || a.includes('-5'))) },
      { label: 'Muestra las 3 últimas líneas de app.log', check: ranCmd('tail', (a) => a.includes('app.log') && (a.includes('3') || a.includes('-n3') || a.includes('-3'))) },
      { label: 'Sigue app.log en tiempo real', check: ranCmd('tail', (a) => a.includes('-f') && a.includes('app.log')) },
    ],
    hints: ['cat LEEME.txt', 'head -n 5 app.log', 'tail -n 3 app.log', 'tail -f app.log'],
    exam: ['tai2025A-P60'],
    curiosity: 'En los servidores con systemd (como RHEL 8), muchos logs se consultan con journalctl; «journalctl -f» es el equivalente de tail -f para el diario del sistema.',
  },
  {
    id: 'lx-copiar',
    type: 'terminal',
    title: 'Copiar, mover y escribir en ficheros',
    summary: 'cp, mv y las redirecciones > y >>.',
    body: `- \`cp origen destino\` **copia**. Para copiar una carpeta entera: \`cp -r\`.
- \`mv origen destino\` **mueve**, y también **renombra**: \`mv viejo.txt nuevo.txt\`.

Las **redirecciones** mandan la salida de una orden a un fichero en vez de a la pantalla:
- \`echo "hola" > fichero.txt\` escribe «hola» en el fichero y **sobrescribe** lo que hubiera.
- \`echo "adiós" >> fichero.txt\` **añade** al final, sin borrar.

Confundir \`>\` con \`>>\` es la forma más rápida de perder un fichero de configuración.`,
    setup: {
      files: {
        [`${H}/config.txt`]: 'puerto=8080\nbbdd=db01\n',
        [`${H}/borrador.txt`]: 'Informe de incidencias (versión final)\n',
      },
      dirs: [`${H}/copia_seguridad`],
    },
    objectives: [
      { label: 'Copia config.txt dentro de copia_seguridad', check: all(exists(`${H}/copia_seguridad/config.txt`, 'file'), exists(`${H}/config.txt`, 'file')) },
      { label: 'Renombra borrador.txt a informe.txt', check: all(missing(`${H}/borrador.txt`), exists(`${H}/informe.txt`, 'file')) },
      { label: 'Crea diario.txt con una línea usando echo y >', check: all(exists(`${H}/diario.txt`, 'file'), ran(/^echo .*>\s*diario\.txt/)) },
      { label: 'Añádele una segunda línea con >> (sin borrar la primera)', check: all(fileLines(`${H}/diario.txt`, 2), ran(/>>\s*diario\.txt/)) },
    ],
    hints: [
      'cp config.txt copia_seguridad/',
      'mv borrador.txt informe.txt',
      'echo "Hoy he aprendido cp y mv" > diario.txt',
      'echo "Y las redirecciones" >> diario.txt — y comprueba con cat diario.txt',
    ],
  },
  {
    id: 'lx-buscar',
    type: 'terminal',
    title: 'Buscar: grep, find y tuberías',
    summary: 'Encontrar texto dentro de ficheros y ficheros dentro de carpetas.',
    body: `- \`grep patrón fichero\` muestra las **líneas que contienen** el patrón. Opciones útiles: \`-i\` (ignora mayúsculas), \`-n\` (numera las líneas), \`-c\` (solo las cuenta) y \`-v\` (las que NO lo contienen).
- \`find ruta -name "*.conf"\` busca **ficheros por nombre** recorriendo carpetas. El \`*\` es un comodín: «cualquier cosa».

La **tubería** \`|\` conecta la salida de una orden con la entrada de la siguiente. Es lo que hace potente la terminal:
\`grep ERROR app.log | wc -l\` → \`wc -l\` cuenta las líneas que le llegan; en total, «cuántos errores hay».

Y puedes combinarlo con las redirecciones: \`grep ERROR app.log > errores.txt\`.`,
    setup: {
      files: {
        [`${H}/app.log`]: APP_LOG,
        '/etc/nginx/conf.d/becas.conf': 'server {\n    listen 80;\n    server_name becas.example.es;\n}\n',
        '/etc/ssh/sshd_config': 'PermitRootLogin no\n',
      },
    },
    objectives: [
      { label: 'Muestra las líneas de app.log que contienen ERROR', check: ranCmd('grep', (a) => a.includes('ERROR') || a.includes('error')) },
      { label: 'Cuenta cuántos errores hay (grep -c o grep … | wc -l)', check: outputMatches(/^5\n$/) },
      { label: 'Guarda solo las líneas de error en errores.txt', check: all(fileContains(`${H}/errores.txt`, 'ERROR'), (sh) => !fileContains(`${H}/errores.txt`, 'INFO')(sh)) },
      { label: 'Encuentra todos los ficheros .conf dentro de /etc', check: ranCmd('find', (a) => a.includes('-name') && a.some((x) => x.includes('.conf'))) },
    ],
    hints: [
      'grep ERROR app.log',
      'grep -c ERROR app.log   (o bien: grep ERROR app.log | wc -l)',
      'grep ERROR app.log > errores.txt',
      'find /etc -name "*.conf"',
    ],
  },
  {
    id: 'lx-permisos',
    type: 'terminal',
    title: 'Permisos, chmod y sudo',
    summary: 'Leer rwxr-xr-x, cambiar permisos y actuar como administrador.',
    body: `\`ls -l\` muestra los ficheros en formato largo. La primera columna son los **permisos**, por ejemplo \`-rwxr-xr--\`:
- El primer carácter indica el tipo: \`-\` fichero, \`d\` directorio.
- Luego van tres grupos de tres: **dueño**, **grupo** y **otros**.
- **r** = leer (vale 4), **w** = escribir (vale 2), **x** = ejecutar (vale 1).

Por eso se escriben con números: \`rwx\` = 4+2+1 = **7**, \`r-x\` = 4+1 = **5**, \`r--\` = **4**. Así, \`755\` = rwxr-xr-x y \`644\` = rw-r--r--.

\`chmod\` cambia permisos: \`chmod 600 fichero\` (solo el dueño lee y escribe) o, en forma simbólica, \`chmod +x script.sh\` (añade ejecución).

Un **script** es un fichero con órdenes. Para lanzarlo se escribe \`./script.sh\`, y necesita permiso de ejecución.

Por último, hay carpetas del sistema, como \`/etc\`, donde solo puede escribir **root**, el administrador. Para ejecutar una orden como root se antepone \`sudo\`.`,
    setup: {
      files: {
        [`${H}/backup.sh`]: '#!/bin/bash\necho "Copiando ficheros de configuración..."\nmkdir -p /tmp/backup\ncp config.txt /tmp/backup/\necho "Copia terminada"\n',
        [`${H}/config.txt`]: 'puerto=8080\n',
        [`${H}/claves.txt`]: { content: 'usuario: admin\nclave: NoLaCompartas123\n', mode: '644' },
      },
    },
    objectives: [
      { label: 'Mira los permisos de tus ficheros con ls -l', check: ranCmd('ls', (a) => a.slice(1).some((x) => /^-\w*l/.test(x))) },
      { label: 'Da permiso de ejecución a backup.sh y ejecútalo', check: ran(/^\.\/backup\.sh$/) },
      { label: 'Deja claves.txt legible y modificable solo por ti (600)', check: modeIs(`${H}/claves.txt`, '600') },
      { label: 'Crea el fichero /etc/taiplay.conf (necesitarás sudo)', check: exists('/etc/taiplay.conf', 'file') },
    ],
    hints: [
      'ls -l',
      'chmod +x backup.sh y luego ./backup.sh',
      'chmod 600 claves.txt (6 = rw para el dueño; 0 para grupo y otros)',
      'touch /etc/taiplay.conf fallará: prueba sudo touch /etc/taiplay.conf',
    ],
    exam: [],
  },
  {
    id: 'lx-sistema',
    type: 'terminal',
    title: 'Administrar el servidor web01',
    summary: 'Exactamente lo que preguntan los supuestos: uname, systemctl, ss, ip route y tar.',
    body: `Eres el técnico de sistemas del **supuesto II de 2025**: el servidor **web01** (RHEL 8.8, en la DMZ) tiene que servir la web con **nginx**. Sigue los objetivos; cada uno corresponde a una pregunta real del examen.

- \`uname -r\` muestra la versión del **kernel** (útil cuando avisan de una vulnerabilidad).
- \`systemctl\` gestiona los **servicios** de systemd:
  - \`systemctl status nginx\` muestra su estado.
  - \`systemctl start nginx\` lo arranca **ahora**.
  - \`systemctl enable nginx\` hace que arranque **solo al encender** el servidor. start y enable son cosas distintas.
- \`ss -ltn\` lista los puertos **TCP** en **escucha** (*listening*), en formato **numérico**.
- \`ip route show\` muestra la tabla de rutas, e \`ip route get IP\` dice qué camino usaría el kernel para llegar a esa IP.
- \`tar -czf copia.tar.gz carpeta/\` crea una copia comprimida: **c**rear, g**z**ip, **f**ichero.`,
    setup: {
      cwd: H,
      files: {
        '/srv/app/config/app.properties': 'db.host=10.30.20.30\ndb.port=3306\n',
        '/srv/app/config/logging.properties': 'level=INFO\n',
      },
    },
    objectives: [
      { label: 'Consulta la versión del kernel', check: ranCmd('uname', (a) => a.includes('-r') || a.includes('-a')) },
      { label: 'Haz que nginx arranque automáticamente al iniciar el servidor', check: serviceIs('nginx', { enabled: true }) },
      { label: 'Arranca nginx ahora y comprueba que escucha en el puerto 80 (ss -ltn)', check: all(serviceIs('nginx', { active: true }), ranCmd('ss', (a) => a.slice(1).some((x) => x.includes('l')))) },
      { label: 'Averigua por qué ruta llega web01 a db01 (10.30.20.30)', check: ranCmd('ip', (a) => a.includes('get') && a.includes('10.30.20.30')) },
      { label: 'Haz una copia config_backup.tar.gz de /srv/app/config/', check: all(exists(`${H}/config_backup.tar.gz`, 'file'), fileContains(`${H}/config_backup.tar.gz`, 'TARGZ:')) },
    ],
    hints: [
      'uname -r',
      'sudo systemctl enable nginx',
      'sudo systemctl start nginx y después ss -ltn',
      'ip route get 10.30.20.30',
      'tar -czf config_backup.tar.gz /srv/app/config/',
    ],
    exam: ['tai2024A-S2-10', 'tai2025A-S2-5', 'tai2025A-S2-6', 'tai2025A-S2-11', 'tai2025A-S2-13', 'tai2025A-S2-15'],
  },
  {
    id: 'lx-cron',
    type: 'concept',
    title: 'Tareas programadas con cron',
    summary: 'Leer una línea de crontab sin equivocarse (pregunta del examen 2025).',
    body: `**cron** es el servicio de Linux que ejecuta tareas automáticamente en fechas y horas fijas: copias de seguridad nocturnas, limpieza de logs… Cada usuario edita sus tareas con \`crontab -e\` y las ve con \`crontab -l\`.

Cada línea tiene **5 campos de tiempo** y después la orden:

\`\`\`
┌──────── minuto        (0-59)
│ ┌────── hora          (0-23)
│ │ ┌──── día del mes   (1-31)
│ │ │ ┌── mes           (1-12)
│ │ │ │ ┌ día de semana (0-7, 0 y 7 = domingo)
│ │ │ │ │
0 5 8 11 *  /usr/local/bin/backup.sh
\`\`\`

El \`*\` significa «cualquiera». La línea de arriba se lee: minuto 0, hora 5, día 8, mes 11 (noviembre), cualquier día de la semana. Es decir, **el 8 de noviembre a las 05:00**.

Más ejemplos:
- \`30 2 * * *\` → todos los días a las 02:30.
- \`0 9 * * 1-5\` → de lunes a viernes a las 09:00.
- \`*/15 * * * *\` → cada 15 minutos.
- \`0 0 1 * *\` → el día 1 de cada mes a medianoche.

La trampa típica es leer «0 5» como 00:05. El primer campo son los **minutos**, no las horas.`,
    quiz: [
      {
        q: '¿Cuándo se ejecuta «0 5 8 11 *»?',
        options: ['A las 00:05 del 11 de agosto', 'A las 05:00 del 8 de noviembre', 'A las 05:00 del 11 de agosto', 'A las 00:05 del 8 de noviembre'],
        answer: 1,
        why: 'minuto 0, hora 5, día 8, mes 11.',
      },
      {
        q: '¿Qué línea ejecuta una tarea todos los días a las 23:45?',
        options: ['23 45 * * *', '45 23 * * *', '* * 23 45 *', '45 23 1 * *'],
        answer: 1,
        why: 'Primero el minuto (45) y después la hora (23).',
      },
      {
        q: '¿Qué significa «*/10 * * * *»?',
        options: ['A las 10:00 cada día', 'Cada 10 minutos', 'El día 10 de cada mes', 'Cada 10 horas'],
        answer: 1,
        why: '*/N en el campo de minutos significa «cada N minutos».',
      },
    ],
    exam: ['tai2025A-P61'],
  },
];
