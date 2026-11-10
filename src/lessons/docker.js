// Ruta «Docker y contenedores»: de «qué es un contenedor» al ciclo de vida
// completo que pregunta el examen (pull, run, ps, logs, exec, stop/kill, rm,
// rmi), construir imágenes propias con un Dockerfile, levantar varios
// servicios con Docker Compose y una introducción a Kubernetes. Las
// prácticas usan el Docker simulado de engine/terminal/docker.js y compose.js.

import {
  ranCmd,
  imageExists,
  imageMissing,
  containerExists,
  noContainer,
  containerFileContains,
  wasInsideContainer,
  backOnHost,
  ran,
  all,
} from './_helpers.js';

const H = '/home/alumno';
const BECAS_HTML = '<!DOCTYPE html>\n<html lang="es">\n<head><title>Becas</title></head>\n<body>\n  <h1>Convocatoria de becas 2026</h1>\n  <p>Plazo de solicitud: del 1 al 30 de diciembre.</p>\n</body>\n</html>\n';

// Algún curl cuya respuesta contiene el texto.
const curlShowed = (text) => (sh) => sh.log.some((e) => e.cmds.some((c) => c[0] === 'curl') && e.out.includes(text));

export const docker = [
  {
    id: 'dk-conceptos',
    type: 'concept',
    title: '¿Qué es un contenedor?',
    summary: 'Imágenes, contenedores, máquinas virtuales e hipervisores.',
    body: `Imagina que desarrollas una aplicación en tu portátil y funciona; la instalas en el servidor y falla, porque allí hay otra versión de Java, falta una librería… Los **contenedores** resuelven el clásico «en mi máquina funciona».

## Imagen y contenedor
- Una **imagen** es una plantilla de **solo lectura** con todo lo necesario para ejecutar una aplicación: el programa, sus librerías y su configuración. Se descarga de un **registro** como **Docker Hub**.
- Un **contenedor** es una imagen **en ejecución**. De una misma imagen puedes arrancar muchos contenedores, cada uno aislado del resto.

Si lo comparas con la cocina: la imagen es la receta y el contenedor, el plato cocinado.

## Contenedor frente a máquina virtual
- Una **máquina virtual** (VM) emula un ordenador completo, con **su propio sistema operativo**. Es pesada (gigas) y tarda en arrancar.
- Un **contenedor** **comparte el kernel** del sistema anfitrión y solo empaqueta la aplicación. Es ligero (megas) y arranca en segundos.

## Hipervisores
El software que crea y ejecuta máquinas virtuales es el **hipervisor**:
- **Tipo 1 (bare-metal, nativo)**: se instala **directamente sobre el hardware**, sin sistema operativo debajo. Por ejemplo, VMware ESXi, Microsoft Hyper-V o KVM. Es lo que se usa en un CPD.
- **Tipo 2 (alojado)**: es una **aplicación** que corre **sobre un sistema operativo** anfitrión. Por ejemplo, VirtualBox o VMware Workstation.

## Herramientas que conviene reconocer
- **Docker**: la herramienta más popular de contenedores.
- **Podman**: alternativa a Docker sin demonio (de Red Hat).
- **containerd** y **CRI-O**: motores de ejecución de contenedores, los que usa Kubernetes por debajo.
- **Kubernetes**: **orquesta** muchos contenedores repartidos en muchas máquinas (lo verás al final de la ruta).

Ojo con las trampas del examen: **nginx** es un servidor web y **Ubuntu** o **Debian** son distribuciones de Linux. No son tecnologías de contenedores, aunque existan imágenes con esos nombres.

## Snapshot frente a backup
Ya que estamos en virtualización: un **snapshot** es una «foto» del estado de una VM o un disco en un instante, y depende del almacenamiento original. Un **backup** es una **copia independiente** guardada aparte para poder restaurar. Un snapshot **no** sustituye a un backup.`,
    quiz: [
      {
        q: '¿Qué diferencia principal hay entre un contenedor y una máquina virtual?',
        options: [
          'El contenedor incluye su propio sistema operativo completo',
          'El contenedor comparte el kernel del anfitrión y es más ligero',
          'La máquina virtual no necesita hipervisor',
          'No hay diferencia',
        ],
        answer: 1,
        why: 'Los contenedores comparten el kernel del host; cada VM lleva su propio sistema operativo.',
      },
      {
        q: 'Un hipervisor de tipo 1 se caracteriza por…',
        options: [
          'ejecutarse como una aplicación sobre un SO anfitrión',
          'ejecutarse directamente sobre el hardware',
          'permitir una sola VM por equipo',
          'necesitar almacenamiento compartido',
        ],
        answer: 1,
        why: 'Tipo 1 = bare-metal, sobre el hardware. Tipo 2 = sobre un SO.',
      },
      {
        q: '¿Qué trío son todo tecnologías de contenedores?',
        options: ['Docker, containerd y Podman', 'Docker, CRI-O y nginx', 'Podman, Kubernetes y Ubuntu', 'Docker, Kubernetes y Debian'],
        answer: 0,
        why: 'nginx es un servidor web; Ubuntu y Debian son distribuciones Linux.',
      },
      {
        q: 'Una imagen de Docker es…',
        options: ['un contenedor en marcha', 'una plantilla de solo lectura a partir de la que se crean contenedores', 'una máquina virtual', 'una copia de seguridad'],
        answer: 1,
        why: 'La imagen es la plantilla; el contenedor es su ejecución.',
      },
    ],
    exam: ['tai2024A-P64', 'tai2025A-P62', 'tai2025A-P63'],
  },
  {
    id: 'dk-imagenes',
    type: 'terminal',
    title: 'Descargar imágenes',
    summary: 'docker pull y docker images.',
    body: `Las imágenes se descargan del registro **Docker Hub** con:

\`docker pull nombre\`

Si no indicas versión (**etiqueta** o *tag*), se descarga \`latest\`, la última. Para una versión concreta: \`docker pull nginx:1.27\`.

Para ver las imágenes que ya tienes en local:

\`docker images\`

La columna **IMAGE ID** es un identificador hexadecimal único, y **SIZE** es lo que ocupa. Fíjate en la diferencia de tamaño entre \`hello-world\` (unos KB) y \`nginx\` (unos cientos de MB).`,
    setup: {},
    objectives: [
      { label: 'Comprueba que todavía no tienes imágenes (docker images)', check: ranCmd('docker', (a) => a[1] === 'images') },
      { label: 'Descarga la imagen hello-world', check: imageExists('hello-world') },
      { label: 'Descarga la imagen nginx', check: imageExists('nginx') },
      {
        label: 'Vuelve a listar las imágenes y compara sus tamaños',
        check: (sh) => imageExists('nginx')(sh) && sh.log.slice(-3).some((e) => /^docker images/.test(e.line)),
      },
    ],
    hints: ['docker images', 'docker pull hello-world', 'docker pull nginx', 'docker images'],
    exam: ['tai2025A-S2-9'],
  },
  {
    id: 'dk-primer',
    type: 'terminal',
    title: 'Tu primer contenedor',
    summary: 'docker run, docker ps -a y entrar en un contenedor con -it.',
    body: `\`docker run imagen\` **crea y arranca** un contenedor nuevo a partir de una imagen. Si la imagen no está en local, **la descarga automáticamente** primero (fíjate en el mensaje *Unable to find image… locally*). Esta es justo la pregunta 64 del examen de 2025.

- \`docker ps\` lista los contenedores **en marcha**.
- \`docker ps -a\` lista **todos**, también los que ya terminaron.

\`hello-world\` imprime un mensaje y **termina**, así que no aparecerá en \`docker ps\`, pero sí en \`docker ps -a\`, con estado *Exited*.

Para **entrar** en un contenedor y usar su terminal: \`docker run -it ubuntu bash\`. La **-i** es de interactivo y la **-t**, de terminal. Verás que el prompt cambia a \`root@…\`: estás dentro de un Ubuntu aislado. Explora (\`ls\`, \`cat /etc/os-release\`) y sal con \`exit\`.`,
    setup: {},
    objectives: [
      { label: 'Ejecuta un contenedor de hello-world', check: containerExists({ image: 'hello-world' }) },
      { label: 'Encuéntralo con docker ps -a (con docker ps solo no aparece)', check: ranCmd('docker', (a) => a[1] === 'ps' && a.includes('-a')) },
      { label: 'Entra en un contenedor de ubuntu con -it y ejecuta algo dentro', check: wasInsideContainer },
      { label: 'Sal del contenedor con exit', check: all(wasInsideContainer, backOnHost) },
    ],
    hints: ['docker run hello-world', 'docker ps y después docker ps -a', 'docker run -it ubuntu bash, y dentro: ls', 'exit'],
    exam: ['tai2025A-P64'],
  },
  {
    id: 'dk-servicios',
    type: 'terminal',
    title: 'Un servidor web en segundo plano',
    summary: 'docker run -d --name -p, docker ps y docker logs.',
    body: `Un servidor (web, base de datos…) **no termina**: se queda en marcha atendiendo peticiones. Para lanzarlo sin que ocupe tu terminal se usa **-d** (*detached*, en segundo plano).

Otras opciones muy habituales de \`docker run\`:
- \`--name web\` le pone un nombre fácil. Si no, Docker inventa uno como *feliz_turing*.
- \`-p 8080:80\` **publica un puerto**: lo que llegue al puerto **8080 del anfitrión** se redirige al **80 del contenedor**. Formato: **anfitrión:contenedor**.

Juntándolo todo:

\`docker run -d --name web -p 8080:80 nginx\`

Después:
- \`docker ps\` → aparece *Up* y la columna PORTS muestra \`0.0.0.0:8080->80/tcp\`.
- \`docker logs web\` → muestra lo que ha escrito el servidor al arrancar.

Pista extra: \`ss -ltn\` (de la ruta de Linux) también mostrará el puerto 8080 en escucha.`,
    setup: { images: ['nginx'] },
    objectives: [
      { label: 'Arranca nginx en segundo plano, con nombre web y el puerto 8080 publicado al 80', check: containerExists({ name: 'web', image: 'nginx', port: 8080, status: 'running' }) },
      { label: 'Compruébalo con docker ps', check: ranCmd('docker', (a) => a[1] === 'ps') },
      { label: 'Consulta sus logs', check: ranCmd('docker', (a) => a[1] === 'logs') },
    ],
    hints: ['docker run -d --name web -p 8080:80 nginx', 'docker ps', 'docker logs web'],
  },
  {
    id: 'dk-parar',
    type: 'terminal',
    title: 'Parar, matar y borrar',
    summary: 'stop frente a kill, rm frente a rmi, e IDs abreviados (examen 2025).',
    body: `Hay dos contenedores en marcha: \`web\` y uno de pruebas que está consumiendo demasiados recursos. Míralos con \`docker ps\`.

**Parar:**
- \`docker stop contenedor\` pide al proceso que **termine ordenadamente** (señal SIGTERM) y, si no lo hace, lo fuerza a los 10 segundos.
- \`docker kill contenedor\` lo **mata al instante** (SIGKILL). Es lo que pide el examen cuando un contenedor «debe interrumpirse inmediatamente».

**Borrar:**
- \`docker rm contenedor\` **elimina un contenedor** (tiene que estar parado, o usar \`-f\`).
- \`docker rmi imagen\` **elimina una imagen** (*rm image*). No se puede si algún contenedor la usa.

**Truco:** no hace falta escribir el ID entero. Basta con **los primeros caracteres**, siempre que no haya otro que empiece igual: \`docker kill 3f7\`.`,
    setup: {
      images: ['nginx'],
      commands: ['docker run -d --name web -p 8080:80 nginx', 'docker run -d nginx'],
    },
    objectives: [
      {
        label: 'Mata de inmediato el contenedor de pruebas usando solo el principio de su ID',
        check: (sh) =>
          sh.docker.containers.some((c) => c.name !== 'web' && c.stoppedBy === 'kill') &&
          sh.log.some((e) => /^docker kill [0-9a-f]{2,11}$/.test(e.line)),
      },
      {
        label: 'Para web de forma ordenada',
        check: (sh) =>
          sh.docker.containers.some((c) => c.name === 'web' && c.stoppedBy === 'stop') ||
          sh.log.some((e) => e.code === 0 && /^docker stop .*\bweb\b/.test(e.line)),
      },
      { label: 'Elimina los dos contenedores', check: all(noContainer({ image: 'nginx' }), ranCmd('docker', (a) => a[1] === 'rm')) },
      { label: 'Elimina la imagen nginx', check: imageMissing('nginx') },
    ],
    hints: [
      'docker ps para ver los IDs. Si el de pruebas empieza por 3f7a…, docker kill 3f7',
      'docker stop web',
      'docker rm web y docker rm <id> (o ambos en una línea: docker rm web <id>)',
      'docker rmi nginx (si te da error, ¿queda algún contenedor que la use? Mira docker ps -a)',
    ],
    exam: ['tai2025A-S2-7', 'tai2025A-S2-8'],
  },
  {
    id: 'dk-exec',
    type: 'terminal',
    title: 'Trabajar dentro de un contenedor',
    summary: 'docker exec para ejecutar órdenes en un contenedor que ya está en marcha.',
    body: `\`docker exec\` ejecuta una orden **dentro de un contenedor que ya está funcionando**. No crea uno nuevo, como hace \`run\`.

- \`docker exec web ls /usr/share/nginx/html\` lista esa carpeta del contenedor y vuelve a tu terminal.
- \`docker exec -it web bash\` abre una terminal dentro del contenedor. Sales con \`exit\` y **el contenedor sigue funcionando**.

Fíjate en la diferencia: al salir de un \`docker run -it ubuntu bash\`, el contenedor **se para**, porque esa shell era su proceso principal. Al salir de un \`docker exec\`, no.

Tu misión: cambiar la página de bienvenida de nginx, que está en \`/usr/share/nginx/html/index.html\`.`,
    setup: { images: ['nginx'], commands: ['docker run -d --name web -p 8080:80 nginx'] },
    objectives: [
      {
        label: 'Lista desde fuera el contenido de /usr/share/nginx/html del contenedor web',
        check: ranCmd('docker', (a) => a[1] === 'exec' && a.includes('ls') && a.some((x) => x.includes('/usr/share/nginx/html'))),
      },
      { label: 'Entra en web con docker exec -it', check: wasInsideContainer },
      { label: 'Haz que index.html contenga el texto «Hola TAI»', check: containerFileContains('web', '/usr/share/nginx/html/index.html', 'Hola TAI') },
      { label: 'Sal con exit y comprueba que web sigue en marcha', check: all(backOnHost, containerExists({ name: 'web', status: 'running' }), wasInsideContainer) },
    ],
    hints: [
      'docker exec web ls /usr/share/nginx/html',
      'docker exec -it web bash',
      'echo "<h1>Hola TAI</h1>" > /usr/share/nginx/html/index.html',
      'exit y luego docker ps',
    ],
  },
  {
    id: 'dk-build',
    type: 'terminal',
    title: 'Tu propia imagen: Dockerfile y docker build',
    summary: 'FROM, RUN, COPY, EXPOSE y CMD; capas, etiquetas y por qué falla un apt-get install.',
    body: `Hasta ahora has usado imágenes de otros. Para **empaquetar tu aplicación** se escribe un **Dockerfile**: la receta, paso a paso, para construir la imagen.

En \`~/becas-web\` tienes la web de la convocatoria y su Dockerfile. Léelo con \`cat Dockerfile\`:

| Instrucción | Qué hace |
|---|---|
| \`FROM nginx:latest\` | Imagen **base** de la que partes (siempre la primera). |
| \`RUN orden\` | Ejecuta una orden **al construir** (instalar paquetes…). |
| \`COPY origen destino\` | Copia ficheros de tu carpeta a la imagen. |
| \`WORKDIR /ruta\` | Directorio de trabajo para lo que sigue. |
| \`ENV CLAVE=valor\` | Variable de entorno. |
| \`EXPOSE 80\` | Documenta en qué puerto escucha (no lo publica: eso es \`-p\`). |
| \`CMD [...]\` | Lo que se ejecuta **al arrancar** el contenedor. |

La diferencia que más cae: **RUN** se ejecuta al **construir** la imagen; **CMD**, cada vez que **arranca** un contenedor.

## Construir
\`\`\`
docker build -t becas-web:1.0 .
\`\`\`
\`-t\` pone nombre y versión (*tag*) y el \`.\` final es el **contexto**: la carpeta cuyos ficheros puede usar COPY. Cada instrucción crea una **capa**; \`docker history becas-web:1.0\` las enseña.

## Un clásico: apt-get sin update
Las imágenes base vienen **sin la lista de paquetes** para ocupar menos. Por eso en un Dockerfile siempre se escribe:
\`\`\`
RUN apt-get update && apt-get install -y curl
\`\`\`
en la **misma** línea RUN. \`Dockerfile.roto\` se lo salta: constrúyelo con \`-f\` y lee el error.`,
    setup: {
      cwd: `${H}/becas-web`,
      files: {
        [`${H}/becas-web/Dockerfile`]: '# Web estática de la convocatoria de becas\nFROM nginx:latest\nLABEL mantenedor="equipo-tai"\nRUN apt-get update && apt-get install -y curl\nCOPY html/ /usr/share/nginx/html/\nEXPOSE 80\nCMD ["nginx", "-g", "daemon off;"]\n',
        [`${H}/becas-web/Dockerfile.roto`]: 'FROM nginx:latest\nRUN apt-get install -y curl\nCOPY html/ /usr/share/nginx/html/\n',
        [`${H}/becas-web/html/index.html`]: BECAS_HTML,
        [`${H}/becas-web/html/estilos.css`]: 'body { font-family: sans-serif; }\n',
      },
    },
    objectives: [
      { label: 'Lee el Dockerfile', check: ranCmd('cat', (a) => a.some((x) => x.endsWith('Dockerfile'))) },
      { label: 'Construye la imagen becas-web con la etiqueta 1.0', check: (sh) => sh.docker.images.some((i) => i.name === 'becas-web' && i.tag === '1.0') },
      { label: 'Mira las capas de la imagen con docker history', check: ranCmd('docker', (a) => a[1] === 'history') },
      { label: 'Arranca un contenedor becas de becas-web:1.0 en segundo plano, con el puerto 8080 → 80', check: containerExists({ name: 'becas', image: 'becas-web', port: 8080, status: 'running' }) },
      { label: 'Comprueba con curl que sirve tu página', check: curlShowed('Convocatoria de becas') },
      { label: 'Construye Dockerfile.roto con -f y averigua por qué falla', check: ran(/^docker build .*-f\s+\S*Dockerfile\.roto/, { ok: false }) },
    ],
    hints: [
      'cat Dockerfile',
      'docker build -t becas-web:1.0 .   (¡el punto final es el contexto!)',
      'docker history becas-web:1.0',
      'docker run -d --name becas -p 8080:80 becas-web:1.0',
      'curl localhost:8080',
      'docker build -f Dockerfile.roto -t roto .   → «Unable to locate package curl»: faltaba apt-get update',
    ],
    curiosity: 'Docker reutiliza las capas que no cambian (la caché de construcción). Por eso se ponen primero las instrucciones que casi nunca cambian (FROM, RUN de paquetes) y al final el COPY del código: así, al tocar el código, solo se reconstruye la última capa.',
  },
  {
    id: 'dk-compose',
    type: 'terminal',
    title: 'Varios servicios con Docker Compose',
    summary: 'compose.yaml, docker compose up -d, ps, logs y down: web más base de datos de una vez.',
    body: `Una aplicación real tiene varias piezas: aquí, la **web** y una base de datos **MySQL**. En vez de lanzar cada \`docker run\` a mano, **Docker Compose** las describe en un fichero YAML y las levanta juntas.

Mira \`~/becas/compose.yaml\` con \`cat\`:
\`\`\`
services:
  web:
    build: ./web            # se construye con ./web/Dockerfile
    ports:
      - "8080:80"
    depends_on:
      - db                  # arranca después de db
  db:
    image: mysql:8.0
\`\`\`

## Las órdenes
- \`docker compose up -d\`: construye o descarga lo que falte, crea una **red** para el proyecto y arranca los contenedores (\`becas-web-1\`, \`becas-db-1\`) en segundo plano.
- \`docker compose ps -a\`: estado de los servicios, también los parados.
- \`docker compose logs db\`: los logs de un servicio.
- \`docker compose down\`: **para y borra** los contenedores y la red (las imágenes se quedan).

Si cambias el fichero, \`up -d\` otra vez **recrea solo** lo que ha cambiado.

## YAML en dos reglas
La **sangría es con espacios** (nunca tabuladores) y define qué va dentro de qué. Las variables de entorno van en \`environment:\`, dentro de su servicio:
\`\`\`
    environment:
      MYSQL_ROOT_PASSWORD: Tai2026
\`\`\`
Como \`db\` es lo último del fichero, puedes añadir esas dos líneas al final con \`echo "…" >> compose.yaml\` (las comillas conservan los espacios).

La versión antigua era un programa aparte, \`docker-compose\` (con guion). Hoy es un subcomando: \`docker compose\`.`,
    setup: {
      cwd: `${H}/becas`,
      files: {
        [`${H}/becas/compose.yaml`]: 'services:\n  web:\n    build: ./web\n    ports:\n      - "8080:80"\n    depends_on:\n      - db\n  db:\n    image: mysql:8.0\n',
        [`${H}/becas/web/Dockerfile`]: 'FROM nginx:latest\nCOPY html/ /usr/share/nginx/html/\n',
        [`${H}/becas/web/html/index.html`]: BECAS_HTML,
      },
    },
    objectives: [
      { label: 'Levanta la aplicación en segundo plano', check: containerExists({ name: 'becas-web-1', status: 'running' }) },
      { label: 'Mira el estado de todos los servicios, también los parados', check: ranCmd('docker', (a) => a[1] === 'compose' && a.includes('ps') && (a.includes('-a') || a.includes('--all'))) },
      { label: 'Lee los logs de db para saber por qué se ha parado', check: ranCmd('docker', (a) => a[1] === 'compose' && a.includes('logs')) },
      { label: 'Dale a db su MYSQL_ROOT_PASSWORD en compose.yaml y vuelve a levantarlo', check: containerExists({ name: 'becas-db-1', status: 'running' }) },
      { label: 'Comprueba con curl que la web responde en el puerto 8080', check: curlShowed('Convocatoria de becas') },
      { label: 'Para y borra todo el proyecto', check: (sh) => sh.log.some((e) => e.code === 0 && /^docker[- ]compose down/.test(e.line)) && !sh.docker.containers.some((c) => c.compose?.project === 'becas') },
    ],
    hints: [
      'cat compose.yaml y docker compose up -d',
      'docker compose ps -a   → db: Exited (1)',
      'docker compose logs db',
      'echo "    environment:" >> compose.yaml · echo "      MYSQL_ROOT_PASSWORD: Tai2026" >> compose.yaml · docker compose up -d',
      'curl localhost:8080',
      'docker compose down',
    ],
    curiosity: 'Dentro de la red del proyecto, cada servicio se encuentra por su nombre: la web llega a la base de datos con el host «db», sin saber su IP. Compose monta un DNS interno para eso.',
  },
  {
    id: 'dk-k8s',
    type: 'concept',
    title: 'Kubernetes: orquestar contenedores',
    summary: 'Pods, nodos y el plano de control (kube-scheduler, etcd, apiserver).',
    body: `Con un par de contenedores, Docker basta. Pero ¿y con 500 contenedores repartidos en 30 servidores, que deben reiniciarse si fallan y crecer si hay más demanda? Para eso existe un **orquestador**, y el estándar es **Kubernetes** (abreviado **K8s**).

## Conceptos básicos
- **Clúster**: el conjunto de máquinas que gestiona Kubernetes.
- **Nodo**: cada máquina del clúster (física o virtual) donde se ejecutan contenedores.
- **Pod**: la unidad mínima que despliega Kubernetes. Contiene uno o varios contenedores que comparten red y almacenamiento.
- **Service**: da una dirección estable para acceder a un grupo de Pods. Admite los protocolos **TCP** (por defecto), **UDP** y **SCTP**.
- **Deployment**: describe cuántas réplicas de un Pod quieres; Kubernetes se encarga de que siempre las haya.

## El plano de control (control plane)
Son los componentes que toman las decisiones globales del clúster:
- **kube-apiserver**: la puerta de entrada. Todo, incluida la herramienta \`kubectl\`, habla con la API.
- **etcd**: la base de datos clave-valor donde se guarda **todo el estado** del clúster.
- **kube-scheduler**: decide **en qué nodo** se ejecuta cada Pod nuevo, según los recursos disponibles.
- **kube-controller-manager**: vigila que el estado real coincida con el deseado (por ejemplo, si un Pod muere, crea otro).

En cada nodo trabajador corren el **kubelet** (que arranca los Pods), **kube-proxy** (la red) y un motor de contenedores (**containerd** o **CRI-O**).`,
    quiz: [
      {
        q: '¿Qué componente decide en qué nodo se ejecuta un Pod?',
        options: ['kube-apiserver', 'etcd', 'kube-scheduler', 'kube-controller-manager'],
        answer: 2,
        why: 'El scheduler asigna los Pods a nodos según los recursos disponibles.',
      },
      {
        q: '¿Dónde guarda Kubernetes el estado del clúster?',
        options: ['En el kubelet', 'En etcd', 'En Docker Hub', 'En cada Pod'],
        answer: 1,
        why: 'etcd es la base de datos clave-valor del plano de control.',
      },
      {
        q: '¿Qué protocolos admiten los Services de Kubernetes?',
        options: ['SCTP, TCP (por defecto) y UDP', 'HTTP (por defecto), HTTPS y FTP', 'SSH, SFTP y UDP', 'Solo TCP'],
        answer: 0,
        why: 'TCP es el protocolo por defecto; también se admiten UDP y SCTP. Salió en el examen de 2024.',
      },
    ],
    exam: ['tai2025A-P65', 'tai2024A-S2-13'],
  },
];
