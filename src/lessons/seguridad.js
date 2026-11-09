// Ruta «Seguridad». Conceptos del ENS y tipos de ataque, permisos (con
// ejercicios generados y bastionado real en la terminal), huellas hash,
// el cortafuegos de RHEL y las herramientas del CCN-CERT.

import { ranCmd, modeIs, exists, missing, all } from './_helpers.js';
import { drillGoal } from './_iosHelpers.js';
import { hostNode } from '../engine/terminal/shell.js';
import { walk } from '../engine/terminal/vfs.js';
import { sha256 } from '../engine/terminal/hash.js';

const H = '/home/alumno';
const D = `${H}/descargas`;

// Ningún fichero ni carpeta bajo `path` es escribible por «otros».
const noWorldWritable = (path) => (sh) => {
  const root = hostNode(sh, path);
  if (!root) return false;
  let ok = true;
  walk(root, path, (_p, n) => {
    if (Number(n.mode[2]) & 2) ok = false;
  });
  return ok;
};

const ownedBy = (path, user) => (sh) => {
  const root = hostNode(sh, path);
  if (!root) return false;
  let ok = true;
  walk(root, path, (_p, n) => {
    if (n.owner !== user) ok = false;
  });
  return ok;
};

const fwHas = (service, has = true) => (sh) =>
  ['runtime', 'permanent'].every((k) => sh.firewall[k].services.includes(service) === has);

// Descargas de la lección de hashes: pilar.zip llega alterado.
const MICRO = 'microclaudia 2.3 — vacunas contra ransomware (paquete de ejemplo de TaiPlay)\n';
const PILAR = 'pilar 2024.1 — análisis y gestión de riesgos (paquete de ejemplo de TaiPlay)\n';
const PILAR_ALTERADO = PILAR.replace('2024.1', '2024.l');
const SUMS = `${sha256(MICRO)}  microclaudia.zip\n${sha256(PILAR)}  pilar.zip\n`;

export const seguridad = [
  {
    id: 'sg-conceptos',
    type: 'concept',
    title: 'Dimensiones de la seguridad y tipos de ataque',
    summary: 'Las cinco dimensiones del ENS, los ataques con nombre propio y las defensas que caen.',
    body: `## Las dimensiones de la seguridad
El **ENS** (Real Decreto 311/2022) valora cada sistema en cinco dimensiones:
- **Confidencialidad**: solo accede quien debe.
- **Integridad**: la información no se altera sin autorización.
- **Disponibilidad**: está accesible cuando se necesita.
- **Autenticidad**: se puede confiar en quién es quién.
- **Trazabilidad**: se sabe quién hizo qué y cuándo.

Así se razona un caso del examen: si la base de datos se **corrompe** (integridad) y los usuarios **no pueden entrar** (disponibilidad), pero se sabe quién lo causó y cómo, la trazabilidad no está afectada.

## Ataques con nombre propio
| Nombre | Qué es |
|---|---|
| Phishing | Engaño por correo para robar credenciales |
| **Vishing** | Lo mismo por **teléfono** (voz) |
| Smishing | Lo mismo por SMS |
| Whaling | Phishing dirigido a altos cargos |
| **Pharming** | Altera la **resolución de nombres** (fichero hosts o DNS) para llevarte a una web falsa aunque escribas bien la dirección |
| Spoofing | Falsear el origen (IP, MAC, correo) |
| Sniffing | Capturar el tráfico de la red |
| **Escaneo de puertos** | Averiguar qué servicios ofrece un sistema |
| DoS / DDoS | Saturar un servicio (DDoS: desde muchos equipos) |
| Ransomware | Cifra tus ficheros y pide rescate |
| **APT** | Según el CCN, ataque **selectivo** de ciberespionaje o cibersabotaje, patrocinado por un Estado u organización, con fines que van más allá de lo económico |
| **Tailgating** o *piggybacking* | Colarse detrás de una persona autorizada |
| XSS | Inyectar código JavaScript en una web. OWASP recomienda **codificar (escapar) la salida** |
| Inyección SQL | Meter SQL en un campo de entrada. Se evita con consultas parametrizadas |

## Defensas que caen
- **Honeypot**: un señuelo atractivo para atraer a los atacantes y estudiar sus técnicas.
- **DMZ**: zona entre cortafuegos donde van los servidores expuestos a Internet, para que una intrusión en ellos no alcance la red interna.
- **IDS** detecta intrusiones; **IPS** además las bloquea.
- **MFA**: combinar factores de **categorías distintas**: algo que sabes (contraseña), que tienes (móvil, tarjeta) y que eres (huella). Iris más huella no es MFA: los dos son «algo que eres».
- **Contraseñas** según el CCN-CERT: largas, mejor **frases sin sentido**, y nunca con datos personales.
- **Copias 3-2-1**: **3** copias de los datos, en **2** soportes distintos, con **1** fuera de la sede. Un **snapshot** es la foto del estado en un instante y depende del almacenamiento original; un **backup** es una copia independiente.
- **TLS**: el CCN fija la **1.2 como mínima** y **recomienda la 1.3**, que negocia la conexión en un solo viaje de ida y vuelta (1-RTT).
- Vulnerabilidades: se identifican con un **CVE** y se consultan en bases como la **NVD** del NIST.`,
    quiz: [
      { q: 'Suplantar a una entidad legítima mediante llamadas telefónicas es…', options: ['Smishing', 'Vishing', 'Pharming', 'Whaling'], answer: 1, why: 'Vishing = voice phishing.' },
      { q: 'Un señuelo para atraer atacantes y estudiar sus técnicas es un…', options: ['IDS', 'Honeypot', 'Proxy', 'Bastión'], answer: 1, why: 'Honeypot, el «tarro de miel».' },
      { q: '¿Cuál NO es autenticación multifactor?', options: ['Contraseña + SMS', 'Tarjeta + PIN', 'Iris + huella', 'Huella + PIN'], answer: 2, why: 'Iris y huella son la misma categoría: algo que eres.' },
      { q: 'Regla 3-2-1:', options: ['3 copias, 2 soportes distintos, 1 fuera de la sede', '3 soportes, 2 copias, 1 en la nube', '3 días, 2 semanas, 1 mes', '3 copias en el mismo disco'], answer: 0, why: 'Tres copias, dos soportes y una fuera.' },
      { q: 'Datos corruptos y usuarios que no pueden acceder afectan a…', options: ['Confidencialidad y trazabilidad', 'Integridad y disponibilidad', 'Solo disponibilidad', 'Autenticidad'], answer: 1, why: 'Corrupción = integridad; sin acceso = disponibilidad.' },
      { q: 'Para aislar los servidores expuestos a Internet de la red interna se usa…', options: ['Una VPN', 'Una DMZ entre cortafuegos', 'Un IDS en modo promiscuo', 'IP públicas en los puestos'], answer: 1, why: 'La DMZ.' },
    ],
    exam: ['tai2024A-S2-8', 'tai2024A-P78', 'tai2025A-P77', 'tai2024A-P69', 'tai2024A-S2-12', 'tai2024A-S2-4', 'tai2024A-P79', 'tai2025A-P78', 'tai2025A-P55', 'tai2025A-P69', 'tai2025A-S2-14', 'tai2025A-P63', 'tai2024A-S2R5', 'tai2025A-P68'],
  },
  {
    id: 'sg-permisos-calc',
    type: 'drill',
    title: 'Permisos de Linux: octal, rwx y umask',
    summary: 'Ejercicios al azar para traducir permisos de memoria.',
    body: `Los permisos de Linux salen en el examen y en cada servidor que toques. Cada fichero tiene **tres tríos** de permisos: **propietario**, **grupo** y **otros**. Cada trío tiene **r** (leer), **w** (escribir) y **x** (ejecutar o, en una carpeta, entrar en ella).

## De rwx a número
Cada letra vale un número y se suman por trío:
- **r = 4**, **w = 2**, **x = 1**.
- \`rwx\` = 7, \`rw-\` = 6, \`r-x\` = 5, \`r--\` = 4, \`---\` = 0.

Así, \`-rwxr-x---\` es **750**: el propietario lo hace todo, el grupo lee y ejecuta, y el resto nada. El primer carácter no cuenta: es el tipo (\`-\` fichero, \`d\` directorio).

## Los que hay que reconocer
| Modo | rwx | Para qué |
|---|---|---|
| 755 | rwxr-xr-x | Programas y carpetas públicas |
| 644 | rw-r--r-- | Ficheros normales |
| 600 | rw------- | Secretos: claves privadas, contraseñas |
| 700 | rwx------ | Carpetas privadas (~/.ssh) |
| 640 | rw-r----- | Configuración que lee un grupo |
| 777 | rwxrwxrwx | **Nunca**: cualquiera puede modificarlo |

## umask
La **umask** dice qué permisos se **quitan** a lo que se crea. Los ficheros parten de 666 (nunca nacen ejecutables) y las carpetas de 777. Con la umask típica, **022**, un fichero nace con 644 y una carpeta con 755. Con **027**, 640 y 750.`,
    objectives: [
      drillGoal('octal', 4, 'Pasa 4 permisos de rwx a octal'),
      drillGoal('simbolico', 4, 'Pasa 4 permisos de octal a rwx'),
      drillGoal('umask', 3, 'Calcula 3 veces el resultado de una umask'),
    ],
    hints: ['r=4, w=2, x=1. Suma dentro de cada trío.', '6 = rw-, 5 = r-x, 4 = r--, 7 = rwx.', 'umask: apaga en 666 (ficheros) o 777 (carpetas) los bits que marca.'],
    curiosity: 'Existe una cuarta cifra delante (chmod 4755) para los bits especiales: setuid, setgid y sticky. El sticky bit es el que tiene /tmp (1777): todos pueden escribir, pero cada uno solo puede borrar lo suyo.',
  },
  {
    id: 'sg-bastionado',
    type: 'terminal',
    title: 'Bastionar ficheros: find -perm, chmod y chown',
    summary: 'Encuentra lo que cualquiera puede modificar, protege secretos y ajusta propietarios.',
    body: `Una auditoría ha encontrado problemas en la aplicación web de **web01**. Vamos a corregirlos.

## 1. Buscar lo peligroso
Un fichero que **cualquiera puede modificar** (escritura para «otros») es una puerta abierta. \`find\` los encuentra:
\`\`\`
find /srv -perm -o+w
\`\`\`
\`-perm -o+w\` (o \`-perm -002\`) significa «que tenga **al menos** el bit de escritura para otros». Sin guion, \`-perm 777\` busca el modo exacto.

## 2. Quitar ese permiso
\`chmod o-w fichero\` quita la escritura a otros sin tocar el resto. Los ficheros de root solo los cambia root: usa \`sudo\`.

## 3. Proteger los secretos
- Un fichero con contraseñas debe ser **600**: solo su propietario lee y escribe.
- La **clave privada SSH** (\`~/.ssh/id_rsa\`) también **600**. Si otros pueden leerla, el propio SSH se niega a usarla.

## 4. El propietario correcto
El servidor web se ejecuta con el usuario **nginx**, así que la carpeta que sirve debe ser suya:
\`\`\`
sudo chown -R nginx:nginx /srv/app/public
\`\`\`
\`usuario:grupo\` cambia los dos a la vez y \`-R\` lo aplica a todo el contenido. Solo root puede cambiar el propietario de un fichero.

Comprueba cada paso con \`ls -l\`.`,
    setup: {
      cwd: '/srv/app',
      files: {
        '/srv/app/config/db.conf': { content: 'DB_HOST=10.30.20.30\nDB_USER=becas\nDB_PASS=Tai-2026-secreta\n', mode: '666' },
        '/srv/app/public/index.html': { content: '<h1>Becas</h1>\n', mode: '644' },
        '/srv/app/public/subir.php': { content: '<?php // subida de documentación\n', mode: '777' },
        '/srv/app/logs/app.log': { content: '2026-11-09 10:00:00 INFO arranque\n', mode: '644' },
        [`${H}/.ssh/id_rsa`]: { content: '-----BEGIN OPENSSH PRIVATE KEY-----\n(clave de ejemplo)\n-----END OPENSSH PRIVATE KEY-----\n', mode: '644' },
        [`${H}/.ssh/id_rsa.pub`]: { content: 'ssh-ed25519 AAAAC3Nz… alumno@web01\n', mode: '644' },
      },
    },
    objectives: [
      { label: 'Localiza con find los ficheros de /srv que cualquiera puede modificar', check: ranCmd('find', (a) => a.includes('-perm')) },
      { label: 'Quítales a todos el permiso de escritura para «otros»', check: noWorldWritable('/srv') },
      { label: 'Deja db.conf legible y escribible solo por su propietario (600)', check: modeIs('/srv/app/config/db.conf', '600') },
      { label: 'Protege tu clave privada ~/.ssh/id_rsa (600)', check: modeIs(`${H}/.ssh/id_rsa`, '600') },
      { label: 'Haz que /srv/app/public y todo su contenido sean del usuario nginx', check: ownedBy('/srv/app/public', 'nginx') },
    ],
    hints: [
      'find /srv -perm -o+w',
      'sudo chmod o-w config/db.conf public/subir.php',
      'sudo chmod 600 config/db.conf · chmod 600 ~/.ssh/id_rsa',
      'sudo chown -R nginx:nginx /srv/app/public',
    ],
    curiosity: 'En RHEL hay una capa más por encima de los permisos: SELinux. Aunque un fichero tenga 777, si su etiqueta SELinux no es la adecuada, nginx no podrá leerlo. Por eso «ls -Z» muestra un contexto además de los permisos.',
  },
  {
    id: 'sg-hashes',
    type: 'terminal',
    title: 'Comprobar descargas con hashes',
    summary: 'sha256sum, sha256sum -c y por qué un hash garantiza la integridad.',
    body: `Has descargado dos herramientas de la web del CCN-CERT a \`~/descargas\`. Junto a cada descarga, la web publica su **hash** (huella) en el fichero \`SHA256SUMS\`.

## Qué es un hash
Una **función hash** convierte cualquier fichero en una huella de tamaño fijo:
- **Siempre da lo mismo** para el mismo contenido.
- **Cambiar un solo bit** cambia la huella por completo (efecto avalancha).
- No se puede volver atrás: de la huella no se saca el fichero.

Por eso el hash publicado sirve para comprobar la **integridad**: si la huella que calculas **no coincide** con la publicada, el fichero se ha alterado (o se ha corrompido al descargarlo) y no debe usarse. Ojo: el hash **no limpia** el fichero ni prueba quién lo hizo; para eso están las **firmas digitales**.

## Las órdenes
\`\`\`
sha256sum microclaudia.zip
sha256sum -c SHA256SUMS
\`\`\`
La segunda lee la lista y comprueba cada fichero: «La suma coincide» o «FALLÓ».

## Algoritmos
- **MD5** (128 bits) y **SHA-1** (160 bits) están **rotos**: se pueden fabricar dos ficheros distintos con la misma huella (una colisión).
- **SHA-256** y **SHA-512** (familia SHA-2) y **SHA-3** son los recomendados.

Prueba también el efecto avalancha: \`echo hola | sha256sum\` y luego \`echo Hola | sha256sum\`.`,
    setup: {
      cwd: D,
      files: {
        [`${D}/microclaudia.zip`]: MICRO,
        [`${D}/pilar.zip`]: PILAR_ALTERADO,
        [`${D}/SHA256SUMS`]: SUMS,
      },
    },
    objectives: [
      { label: 'Calcula la huella SHA-256 de microclaudia.zip', check: ranCmd('sha256sum', (a) => a.some((x) => x.endsWith('microclaudia.zip')) && !a.includes('-c')) },
      { label: 'Comprueba las dos descargas contra SHA256SUMS de una vez', check: ranCmd('sha256sum', (a) => a.includes('-c') || a.includes('--check')) },
      { label: 'Borra la descarga cuya huella no coincide', check: all(missing(`${D}/pilar.zip`), exists(`${D}/microclaudia.zip`)) },
      {
        label: 'Comprueba el efecto avalancha: la huella de dos textos que solo se diferencian en un carácter',
        check: (sh) => new Set(sh.log.filter((e) => e.cmds[0]?.[0] === 'echo' && e.cmds.some((c) => c[0] === 'sha256sum') && e.code === 0).map((e) => e.out)).size >= 2,
      },
      { label: 'Calcula también el MD5 de microclaudia.zip y compara su longitud', check: ranCmd('md5sum', (a) => a.some((x) => x.endsWith('microclaudia.zip'))) },
    ],
    hints: ['sha256sum microclaudia.zip', 'sha256sum -c SHA256SUMS', 'rm pilar.zip', 'echo hola | sha256sum y después echo Hola | sha256sum · md5sum microclaudia.zip'],
    curiosity: 'En 2017 Google publicó dos PDF distintos con el mismo SHA-1 (el ataque «SHAttered»). Hicieron falta unos 9 trillones de cálculos, pero bastó para dar SHA-1 por muerto en firmas y certificados.',
    exam: ['tai2024A-S2-16'],
  },
  {
    id: 'sg-firewall',
    type: 'terminal',
    title: 'El cortafuegos de RHEL: firewall-cmd',
    summary: 'Zonas y servicios, --permanent y --reload, nc -vz y rp_filter contra el spoofing.',
    body: `**web01** sirve la aplicación por HTTPS. Su cortafuegos, **firewalld**, tiene abierto un servicio que no debería y le falta lo que sí necesita.

## firewalld en dos ideas
1. Las reglas se agrupan en **zonas**. La interfaz eth0 está en la zona **public**, y en ella se abren **servicios** (ssh, https…) o **puertos** (8080/tcp).
2. Hay **dos configuraciones**: la que está **en marcha** (*runtime*) y la **guardada** (*permanent*). Sin \`--permanent\`, el cambio se pierde al reiniciar; con \`--permanent\`, no se aplica hasta hacer \`--reload\`.

\`\`\`
firewall-cmd --list-all
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --remove-service=telnet
sudo firewall-cmd --reload
\`\`\`

## ¿Y el puerto 80?
El CCN recomienda **mantener el 80 abierto** solo para que el servidor web **redirija automáticamente a HTTPS**. Así quien escriba la dirección sin «https» no se queda sin servicio.

## Probar un puerto remoto sin cliente
Para saber si llegas a la base de datos de **db01** (10.30.20.30, puerto 3306) sin instalar el cliente de MySQL:
\`\`\`
nc -vz 10.30.20.30 3306
\`\`\`
\`-z\` solo comprueba si el puerto TCP acepta la conexión y \`-v\` lo cuenta.

## Contra la suplantación de IP
El **filtrado de ruta inversa** descarta los paquetes cuyo origen no podría llegar por esa interfaz, típico del IP *spoofing*:
\`\`\`
sudo sysctl -w net.ipv4.conf.all.rp_filter=1
\`\`\`
Para que dure tras reiniciar, se escribe en un fichero de \`/etc/sysctl.d/\`.`,
    setup: {
      services: { nginx: { description: 'The nginx HTTP and reverse proxy server', active: true, enabled: true, port: 443 } },
      setup: (sh) => {
        for (const k of ['runtime', 'permanent']) sh.firewall[k].services = ['cockpit', 'dhcpv6-client', 'ssh', 'telnet'];
      },
    },
    objectives: [
      { label: 'Revisa la configuración del cortafuegos (--list-all)', check: ranCmd('firewall-cmd', (a) => a.includes('--list-all')) },
      { label: 'Cierra telnet, en caliente y de forma permanente', check: fwHas('telnet', false) },
      { label: 'Abre https, en caliente y de forma permanente', check: fwHas('https') },
      { label: 'Abre también http, para redirigir a HTTPS como recomienda el CCN', check: fwHas('http') },
      { label: 'Comprueba con nc que el puerto 3306 de db01 (10.30.20.30) acepta conexiones', check: ranCmd('nc', (a) => a.includes('10.30.20.30') && a.includes('3306') && a.some((x) => /^-\w*z/.test(x))) },
      { label: 'Activa el filtrado de ruta inversa contra el IP spoofing', check: (sh) => sh.sysctl['net.ipv4.conf.all.rp_filter'] === '1' },
    ],
    hints: [
      'firewall-cmd --list-all',
      'sudo firewall-cmd --permanent --remove-service=telnet · sudo firewall-cmd --permanent --add-service=https · sudo firewall-cmd --permanent --add-service=http',
      'sudo firewall-cmd --reload (para que lo permanente pase a estar en marcha)',
      'nc -vz 10.30.20.30 3306 · sudo sysctl -w net.ipv4.conf.all.rp_filter=1',
    ],
    curiosity: 'firewalld no filtra nada por sí mismo: traduce tus zonas y servicios a reglas de nftables (antes, iptables), que es lo que de verdad aplica el kernel.',
    exam: ['tai2024A-S2-3', 'tai2025A-S2-12', 'tai2025A-S2R2', 'tai2025A-P78'],
  },
  {
    id: 'sg-ccn',
    type: 'match',
    title: 'Las herramientas del CCN-CERT',
    summary: 'LUCIA, EMMA, CLAUDIA, PILAR, INES… Empareja cada nombre con su función.',
    body: `El **Centro Criptológico Nacional** (CCN, adscrito al CNI) vela por la seguridad de las TIC de la Administración. Su equipo de respuesta a incidentes, el **CCN-CERT**, ofrece a los organismos del ENS un catálogo de herramientas, casi todas con nombre de mujer. El examen pregunta cuál es cuál.

Agrúpalas así para recordarlas:
- **Gestionar**: LUCIA (incidentes), INES (estado del ENS), PILAR (riesgos).
- **Vigilar la red**: EMMA (quién se conecta) y CARMEN (amenazas en el tráfico).
- **Proteger el puesto**: CLAUDIA y microCLAUDIA.
- **Analizar**: GLORIA (logs), MARTA (ficheros sospechosos), REYES (compartir amenazas).
- **Auditar**: ANA, CLARA y ROCÍO.
- **Otras**: ATENEA (retos para formarse) y OLVIDO (borrado seguro).

Además, el CCN-CERT tiene los **SAT** (sistemas de alerta temprana): **SAT-INET** para el tráfico hacia Internet y **SAT-SARA** para la red SARA que une a las administraciones.`,
    leftTitle: 'Herramienta',
    rightTitle: 'Para qué sirve',
    pairs: [
      { left: 'LUCIA', right: 'Gestión de ciberincidentes (ticketing) en los organismos del ENS' },
      { left: 'EMMA', right: 'Visibilidad y control de los dispositivos conectados a la red' },
      { left: 'CARMEN', right: 'Detección de amenazas avanzadas analizando el tráfico de red' },
      { left: 'CLAUDIA', right: 'Detección de amenazas complejas (APT) en el puesto de usuario' },
      { left: 'microCLAUDIA', right: 'Vacunas contra el ransomware en el puesto de usuario' },
      { left: 'PILAR', right: 'Análisis y gestión de riesgos (metodología MAGERIT)' },
      { left: 'INES', right: 'Informe del estado de seguridad de los organismos según el ENS' },
      { left: 'GLORIA', right: 'Gestión y correlación de logs y eventos (SIEM)' },
      { left: 'MARTA', right: 'Análisis avanzado de ficheros sospechosos en entornos aislados' },
      { left: 'REYES', right: 'Intercambio de información sobre ciberamenazas' },
      { left: 'ANA', right: 'Automatización y normalización de auditorías' },
      { left: 'CLARA', right: 'Auditoría del cumplimiento del ENS en sistemas Windows' },
      { left: 'ROCÍO', right: 'Auditoría de la configuración de equipos de comunicaciones' },
      { left: 'ATENEA', right: 'Plataforma de retos de ciberseguridad para formarse' },
      { left: 'OLVIDO', right: 'Borrado seguro de ficheros y de sus metadatos' },
    ],
    exam: ['tai2024A-P67', 'tai2024A-P80', 'tai2024A-S2-12'],
  },
];
