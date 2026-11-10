// Ruta «Linux y la terminal». Lecciones prácticas sobre la terminal
// simulada: el alumno escribe órdenes de verdad y los objetivos se validan
// mirando el estado de la máquina (ver _helpers.js). Termina con lo que el
// examen pregunta en los supuestos de sistemas: systemctl, ss, ip route, tar…
// y las prácticas de administración: procesos y journalctl, diagnóstico de
// red con firewalld, disco lleno y fsck, LVM con xfs_growfs, dnf y crontab.

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
  any,
} from './_helpers.js';
import { fsUsage } from '../engine/terminal/sysadmin.js';

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
    id: 'lx-procesos',
    type: 'terminal',
    title: 'Procesos, journalctl y kill',
    summary: 'Por qué no arranca un servicio: el diario de systemd, quién ocupa el puerto y cómo terminar un proceso.',
    body: `La aplicación de becas de **web01** es el servicio \`becas\` y escucha en el puerto **8080**. Esta mañana no arranca, y además el servidor va lentísimo.

## Cuando un servicio no arranca
\`systemctl start\` solo te dirá «Job for becas.service failed». El **porqué** está en el **diario de systemd**:
\`\`\`
journalctl -u becas          # solo las entradas de ese servicio
journalctl -xeu becas        # salta al final (-e) y añade explicaciones (-x)
journalctl -p err            # solo errores, de todo el sistema
journalctl -f                # en directo, como tail -f
\`\`\`
\`systemctl status becas\` también enseña las últimas líneas del diario.

## Quién ocupa un puerto
\`ss -ltnp\` añade la columna **Process**: el programa y su **PID** (identificador de proceso) que escucha en cada puerto. Sin sudo solo verás los procesos que son tuyos.

## Procesos
- \`ps aux\` lista **todos** los procesos con su usuario, PID, %CPU y %MEM (\`ps -ef\` es la variante de estilo System V).
- \`ps aux --sort=-%cpu\` los ordena por consumo de CPU, de más a menos; \`top\` hace lo mismo en directo.
- \`kill PID\` manda **SIGTERM** (15): le pide al proceso que termine ordenadamente. \`kill -9 PID\` manda **SIGKILL**: lo mata en seco, sin que pueda guardar ni limpiar nada. Úsalo solo si el primero no funciona.
- Solo puedes matar tus procesos; los de otros usuarios necesitan \`sudo\`.`,
    setup: {
      services: { becas: { description: 'Aplicación de becas', active: false, enabled: true, port: 8080, cmd: '/usr/bin/java -jar /srv/becas/becas.jar' } },
      procs: [
        { pid: 2211, user: 'alumno', cmd: 'python3 -m http.server 8080', cpu: 0.2, mem: 0.4, port: 8080 },
        { pid: 2245, user: 'alumno', cmd: 'python3 /home/alumno/informe.py', cpu: 97.8, mem: 3.1 },
      ],
      files: { [`${H}/informe.py`]: 'while True:\n    pass  # ¡un bucle infinito!\n' },
    },
    objectives: [
      { label: 'Intenta arrancar el servicio becas', check: ranCmd('systemctl', (a) => /^(re)?start$/.test(a[1] ?? '') && /^becas/.test(a[2] ?? '')) },
      { label: 'Lee en el diario de systemd por qué ha fallado', check: ranCmd('journalctl', (a) => a.join(' ').includes('becas')) },
      { label: 'Averigua qué proceso ocupa el puerto 8080 (ss -ltnp)', check: ranCmd('ss', (a) => a.slice(1).some((x) => /^-\w*p/.test(x))) },
      { label: 'Termina ese proceso con kill', check: (sh) => !sh.procs.some((p) => p.pid === 2211) },
      { label: 'Arranca becas y comprueba que queda activo', check: serviceIs('becas', { active: true }) },
      { label: 'Localiza el proceso que se come la CPU (top o ps aux --sort=-%cpu) y termínalo', check: all((sh) => !sh.procs.some((p) => p.pid === 2245), any(ranCmd('top'), ranCmd('ps', (a) => a.some((x) => x.includes('cpu'))))) },
    ],
    hints: [
      'sudo systemctl start becas',
      'journalctl -u becas (o journalctl -xeu becas): busca «Address already in use»',
      'ss -ltnp → el PID aparece en users:(("python3",pid=…))',
      'kill 2211 · sudo systemctl start becas · systemctl status becas',
      'ps aux --sort=-%cpu (o top) y luego kill con el PID de informe.py',
    ],
    curiosity: 'El PID 1 es systemd, el primer proceso que arranca el kernel y padre de todos los demás. Si muriera, el sistema entero se detendría: por eso ni root puede matarlo con kill.',
  },
  {
    id: 'lx-red',
    type: 'terminal',
    title: 'Diagnosticar la red y abrir el cortafuegos',
    summary: 'ping, traceroute, ss y firewall-cmd --add-port: de «no llega» a la causa.',
    body: `Los usuarios de la red **10.30.16.0/20** dicen que no pueden abrir la nueva aplicación de **web01** (\`https://web01:8443\`). Vamos a diagnosticarlo **de abajo arriba**, capa a capa.

## 1. ¿Hay red? ping
\`ping\` manda paquetes **ICMP** de eco y mide cuánto tardan en volver.
\`\`\`
ping -c 3 172.19.50.1       # la puerta de enlace
ping -c 3 db01              # por nombre: comprueba también la resolución (/etc/hosts o DNS)
\`\`\`
En Linux, \`ping\` **no se para solo**: \`-c\` indica cuántos paquetes enviar (en Windows envía 4 y para; allí se usa \`-n\`). Ojo: que un equipo no responda al ping **no** demuestra que esté caído; muchos cortafuegos bloquean ICMP.

## 2. ¿Por dónde va? traceroute
\`traceroute 10.30.16.45\` lista los **routers** (saltos) que atraviesan los paquetes. Un salto con \`* * *\` no responde; si a partir de uno ya no contesta nadie, el problema está ahí. En Windows la orden se llama \`tracert\`.

## 3. ¿Escucha el servicio? ss
\`ss -ltn\` muestra los puertos TCP en escucha. Si la aplicación no aparece, el problema es del servicio, no de la red.

## 4. ¿Lo deja pasar el cortafuegos? firewall-cmd
Si escucha pero desde fuera no llega, mira \`firewall-cmd --list-all\`. Para abrir un **puerto** (en lugar de un servicio con nombre):
\`\`\`
sudo firewall-cmd --permanent --add-port=8443/tcp
sudo firewall-cmd --reload
\`\`\``,
    setup: {
      services: { becas: { description: 'Aplicación de becas (HTTPS)', active: true, enabled: true, port: 8443 } },
      setup: (sh) => {
        sh.net.remote['10.30.16.45'] = { name: 'pc-usuario', ports: [] };
        sh.net.remote['10.30.20.99'] = { name: 'app02', ports: [], icmp: false };
      },
    },
    objectives: [
      { label: 'Comprueba con 3 pings que responde la puerta de enlace (172.19.50.1)', check: ranCmd('ping', (a) => a.includes('172.19.50.1') && a.some((x) => /^-c/.test(x))) },
      { label: 'Haz ping a db01 por su nombre', check: ran(/^ping .*\bdb01\b/) },
      { label: 'Averigua con traceroute por qué router se llega a la red de usuarios (10.30.16.45)', check: ranCmd('traceroute', (a) => a.includes('10.30.16.45')) },
      { label: 'Comprueba que la aplicación escucha en el puerto 8443', check: ranCmd('ss', (a) => a.slice(1).some((x) => x.includes('l'))) },
      { label: 'Abre 8443/tcp en firewalld, de forma permanente y en caliente', check: (sh) => ['runtime', 'permanent'].every((k) => sh.firewall[k].ports.includes('8443/tcp')) },
    ],
    hints: [
      'ping -c 3 172.19.50.1',
      'ping -c 3 db01',
      'traceroute 10.30.16.45',
      'ss -ltn',
      'sudo firewall-cmd --permanent --add-port=8443/tcp y después sudo firewall-cmd --reload',
    ],
    curiosity: 'traceroute funciona con un truco: envía paquetes con TTL 1, 2, 3… Cada router resta 1 al TTL y, cuando llega a 0, descarta el paquete y avisa con un ICMP «Time Exceeded». Esos avisos son los que van dibujando el camino.',
    exam: ['tai2025A-S2-5', 'tai2025A-S2-12'],
  },
  {
    id: 'lx-disco',
    type: 'terminal',
    title: 'Disco lleno y fsck',
    summary: 'df -h, du -sh, vaciar un log y reparar una partición con fsck -y (examen 2024).',
    body: `Llegan dos avisos del servidor: **/var está casi lleno** y, tras un reinicio, **la partición de la web de profesores (/dev/sda8) no se ha montado** por errores.

## Espacio: df y du
- \`df -h\` (*disk free*) muestra cada sistema de ficheros montado: tamaño, usado, disponible y **% de uso**. \`-h\` = unidades legibles.
- \`du -sh ruta\` (*disk usage*) dice **cuánto ocupa** una carpeta. Para encontrar al culpable: \`du -sh /var/log/*\`, y vas bajando.

Para recuperar el espacio de un log enorme, lo más seguro es **vaciarlo** sin borrarlo:
\`\`\`
sudo truncate -s 0 /var/log/becas/debug.log
\`\`\`
Si lo borras con \`rm\` mientras el servicio lo tiene abierto, el espacio **no se libera** hasta que el servicio se reinicia.

## Reparar: fsck
\`fsck\` (*file system check*) comprueba y repara un sistema de ficheros:
- Debe estar **desmontado**: reparar algo en uso lo destrozaría.
- Sin opciones, **pregunta** antes de cada reparación. \`-y\` responde «sí» a todo (lo que se usa al arrancar un servidor); \`-n\` solo mira.
- Código de salida: **0** limpio, **1** errores corregidos, **4** quedan errores.

Después se monta con \`mount\`. Si está en **/etc/fstab**, basta con \`mount /srv/profesores\` o \`mount -a\`.`,
    setup: {
      dirs: ['/srv/profesores'],
      files: {
        '/var/log/becas/debug.log': { content: '2026-11-10 09:00:00 DEBUG petición recibida…\n', size: 9.8 * 1024 ** 3 },
        '/var/log/becas/app.log': { content: '2026-11-10 09:00:00 INFO arranque\n', size: 120 * 1024 ** 2 },
        '/var/log/messages': { content: 'Nov 10 09:00:01 web01 systemd[1]: Started Session 12 of user alumno.\n', size: 48 * 1024 ** 2 },
        '/etc/fstab': '/dev/mapper/rhel-root   /                xfs   defaults  0 0\n/dev/mapper/rhel-var    /var             xfs   defaults  0 0\n/dev/sda8               /srv/profesores  ext4  defaults  0 2\n',
      },
      setup: (sh) => {
        sh.storage.disks[0] = { name: 'sda', size: 120, parts: [{ name: 'sda1', size: 1 }, { name: 'sda2', size: 99 }, { name: 'sda8', size: 20 }] };
        sh.storage.fss.push({ dev: '/dev/sda8', type: 'ext4', size: 20, used: 3.2, mount: null, errors: 3 });
        sh.journal.push({ t: 'nov 10 09:00:04', unit: 'systemd', ident: 'systemd-fsck[612]', prio: 3, msg: '/dev/sda8 contiene un sistema de ficheros con errores: REPARACIÓN MANUAL necesaria (ejecute fsck manualmente).' });
      },
    },
    objectives: [
      { label: 'Mira el espacio de cada sistema de ficheros en formato legible', check: ranCmd('df', (a) => a.slice(1).some((x) => /^-\w*h/.test(x))) },
      { label: 'Encuentra con du qué ocupa tanto dentro de /var/log', check: ranCmd('du', (a) => a.some((x) => x.startsWith('/var/log'))) },
      { label: 'Deja /var por debajo del 80 % de uso', check: (sh) => fsUsage(sh, '/var').pct < 80 },
      { label: 'Repara /dev/sda8 sin que fsck te pregunte nada', check: (sh) => sh.storage.fss.find((f) => f.dev === '/dev/sda8').errors === 0 },
      { label: 'Monta /dev/sda8 en /srv/profesores', check: (sh) => sh.storage.fss.find((f) => f.dev === '/dev/sda8').mount === '/srv/profesores' },
    ],
    hints: [
      'df -h',
      'du -sh /var/log/* y después du -sh /var/log/becas/*',
      'sudo truncate -s 0 /var/log/becas/debug.log (y df -h para comprobarlo)',
      'sudo fsck -y /dev/sda8',
      'sudo mount /dev/sda8 /srv/profesores (o sudo mount -a, que lee /etc/fstab)',
    ],
    curiosity: 'El último campo de cada línea de /etc/fstab dice en qué orden pasa fsck al arrancar: 1 para la raíz, 2 para el resto y 0 para no revisarla nunca. Los XFS llevan 0 porque su reparación es otra herramienta, xfs_repair.',
    exam: ['tai2024A-S2-2'],
  },
  {
    id: 'lx-lvm',
    type: 'terminal',
    title: 'Ampliar un volumen LVM en caliente',
    summary: 'pvs, vgs, lvs, lvextend y xfs_growfs: el supuesto de db01 (examen 2025).',
    body: `Estás en **db01** (RHEL 8.8). \`/contenido\` está casi lleno y hay que ampliarlo a **600 GiB** sin parar el servicio, sin cambiar el punto de montaje y sin añadir discos.

## LVM en tres capas
1. **PV** (*physical volume*): un disco o partición que aporta espacio. \`pvs\`
2. **VG** (*volume group*): un «saco» que junta el espacio de uno o varios PV. \`vgs\` muestra su tamaño y lo **libre** (VFree).
3. **LV** (*logical volume*): lo que se reparte del VG y se formatea y monta como un disco. \`lvs\`

La gracia: un LV puede **crecer** mientras haya espacio libre en su VG, sin tocar particiones.

## Ampliar son DOS pasos
\`\`\`
sudo lvextend -L 600G /dev/vg_datos/lv_contenido    # 1. el volumen
sudo xfs_growfs /contenido                           # 2. el sistema de ficheros
\`\`\`
- \`-L 600G\` fija el tamaño final; \`-L +100G\` suma; \`-l +100%FREE\` usa todo lo libre.
- Tras el paso 1, \`df\` **sigue diciendo 500G**: el sistema de ficheros no se entera hasta el paso 2. \`lvextend -r\` hace los dos a la vez.
- **XFS** se amplía **montado** con \`xfs_growfs\` y **no se puede reducir**. Para ext4 se usa \`resize2fs\`.

No hacen falta snapshots, ni fsck, ni desmontar: es una ampliación en línea.`,
    setup: {
      dirs: ['/contenido'],
      setup: (sh) => {
        sh.system.host = 'db01';
        sh.hostCtx.host = 'db01';
        const st = sh.storage;
        st.disks.push({ name: 'sdb', size: 700, parts: [] });
        st.pvs.push({ dev: '/dev/sdb', vg: 'vg_datos', size: 700 });
        st.lvs.push({ vg: 'vg_datos', name: 'lv_contenido', size: 500 });
        st.fss.push({ dev: '/dev/mapper/vg_datos-lv_contenido', type: 'xfs', size: 500, used: 471, mount: '/contenido' });
      },
    },
    objectives: [
      { label: 'Comprueba cuánto espacio queda en /contenido', check: ranCmd('df') },
      { label: 'Mira los volúmenes LVM y el espacio libre de vg_datos', check: any(ranCmd('vgs'), ranCmd('lvs'), ranCmd('pvs')) },
      { label: 'Amplía el volumen lógico lv_contenido a 600 GiB', check: (sh) => sh.storage.lvs.find((l) => l.name === 'lv_contenido').size === 600 },
      { label: 'Amplía en línea el sistema de ficheros XFS de /contenido', check: (sh) => fsUsage(sh, '/contenido').size === 600 },
      { label: 'Comprueba con df que /contenido ya tiene 600G', check: (sh) => fsUsage(sh, '/contenido').size === 600 && sh.log.at(-1)?.cmds.some((c) => (c[0] === 'sudo' ? c[1] : c[0]) === 'df') },
    ],
    hints: [
      'df -h /contenido',
      'sudo vgs (VFree: 200g) y sudo lvs',
      'sudo lvextend -L 600G /dev/vg_datos/lv_contenido (y fíjate en que df aún dice 500G)',
      'sudo xfs_growfs /contenido',
      'df -h /contenido',
    ],
    curiosity: 'Con «lvextend -r» LVM llama él solo a la herramienta del sistema de ficheros que toque (xfs_growfs o resize2fs). Es la forma más segura de no olvidarse del segundo paso.',
    exam: ['tai2025A-S2R5'],
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
  {
    id: 'lx-paquetes',
    type: 'terminal',
    title: 'Instalar software y programar tareas',
    summary: 'dnf (y su equivalente apt) y crontab: instala rsync y programa la copia nocturna.',
    body: `Hay que dejar programada una copia de seguridad nocturna con \`backup.sh\`, que usa **rsync**.

## Paquetes: depende de la familia
| | RHEL, Rocky, Fedora | Debian, Ubuntu |
|---|---|---|
| Gestor | \`dnf\` (antes \`yum\`) | \`apt\` (o \`apt-get\`) |
| Paquetes | \`.rpm\` | \`.deb\` |
| Instalar | \`dnf install -y x\` | \`apt update\` y \`apt install -y x\` |
| Quitar | \`dnf remove x\` | \`apt remove x\` |
| ¿Está? | \`dnf list installed x\` | \`apt list --installed x\` |

Instalar y quitar necesita **root**. \`-y\` contesta «sí» a la confirmación: imprescindible en scripts. En Debian/Ubuntu, \`apt update\` **no actualiza nada**: descarga la lista de paquetes disponibles (si no, \`apt install\` dice *Unable to locate package*).

## Tareas: crontab
Ya sabes leer una línea de cron (lección anterior). Para **instalarla**:
- \`crontab -l\` muestra tu crontab; \`crontab -e\` la abre en el editor; \`crontab -r\` la borra.
- Sin editor (como aquí o en un script), se instala desde un fichero o una tubería:
\`\`\`
echo "30 2 * * * /home/alumno/backup.sh" | crontab -
\`\`\`
Cuidado: eso **sustituye** la crontab entera.`,
    setup: {
      files: { [`${H}/backup.sh`]: { content: '#!/bin/bash\nrsync -a /srv/app/ /backup/app/\n', mode: '755' } },
    },
    objectives: [
      { label: 'Comprueba si rsync está instalado', check: any(ranCmd('dnf', (a) => a.includes('list') || a.includes('info')), ranCmd('yum', (a) => a.includes('list') || a.includes('info')), ranCmd('rpm')) },
      { label: 'Instálalo sin que dnf te pida confirmación', check: (sh) => sh.packages.installed.includes('rsync') },
      { label: 'Programa backup.sh en tu crontab todos los días a las 02:30', check: (sh) => /^30 2 \* \* \* \S*backup\.sh/m.test(sh.crontabs.alumno ?? '') },
      { label: 'Comprueba tu crontab', check: (sh) => Boolean(sh.crontabs.alumno) && sh.log.some((e) => e.code === 0 && /^crontab -l/.test(e.line)) },
    ],
    hints: [
      'dnf list installed rsync',
      'sudo dnf install -y rsync',
      'echo "30 2 * * * /home/alumno/backup.sh" | crontab -',
      'crontab -l',
    ],
    curiosity: 'dnf significa «Dandified YUM»: es la reescritura de yum que estrenó Fedora y que RHEL usa desde la versión 8. Por compatibilidad, la orden yum sigue existiendo y llama a dnf.',
  },
];
