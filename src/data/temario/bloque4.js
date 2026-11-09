// Bloque IV · Sistemas y comunicaciones. Fichas de repaso propias (ver bloque1.js).

export const bloque4 = [
  {
    id: 'B4T01',
    short: 'Administración del sistema operativo',
    title:
      'Administración del sistema operativo y software de base. Funciones y responsabilidades. Actualización, mantenimiento y reparación del sistema operativo.',
    lessons: ['lx-sistema', 'lx-permisos', 'lx-leer', 'lx-cron'],
    body: `## Funciones del administrador
Gestionar usuarios y permisos, instalar y actualizar software (parches de seguridad), vigilar el rendimiento y los registros, hacer copias de seguridad, automatizar tareas y documentar todos los cambios.

## Linux: chuleta de examen
| Para… | Orden |
|---|---|
| Versión del kernel | \`uname -r\` |
| Arrancar un servicio al iniciar | \`systemctl enable nginx\` |
| Arrancarlo ahora / ver su estado | \`systemctl start\` / \`status\` |
| Puertos en escucha | \`ss -ltn\` (o \`netstat -tlnp\`) |
| Tabla de rutas / ruta a una IP | \`ip route show\` / \`ip route get IP\` |
| Seguir un log | \`tail -f fichero\` |
| Reparar un sistema de ficheros | \`fsck -y /dev/sda8\` (desmontado) |
| Copia comprimida | \`tar -czf copia.tar.gz dir/\` (extraer: \`-xzf\`) |
| Paquetes | \`dnf\`/\`yum\` (RHEL), \`apt\`/\`dpkg\` (Debian/Ubuntu) |
| Diario de systemd | \`journalctl -u servicio\`, \`journalctl -f\` |
| Auditoría | \`auditd\` (reglas con \`auditctl\`) |

**Cron**: minuto, hora, día del mes, mes y día de la semana. \`0 5 8 11 *\` = el 8 de noviembre a las 05:00.

## LVM (gestión de volúmenes)
PV (volumen físico) → **VG** (grupo de volúmenes) → **LV** (volumen lógico). Para ampliar en caliente: \`lvextend\` y, después, hacer crecer el sistema de ficheros (\`xfs_growfs\` para XFS, \`resize2fs\` para ext4). XFS se puede ampliar, pero no reducir.

## Windows
- \`sfc /scannow\` repara los archivos de sistema protegidos con una copia en caché. Además: \`DISM\`, \`chkdsk\` y Windows Update/WSUS.
- **PowerShell**: \`Install-WindowsFeature -Name AD-Domain-Services -IncludeManagementTools\` instala el rol, y \`Copy-Item -Path origen -Destination destino -Recurse\` copia de forma recursiva.`,
    quiz: [
      {
        q: '¿Qué orden hace que un servicio arranque al encender el servidor?',
        options: ['systemctl start', 'systemctl enable', 'service autostart', 'systemctl run'],
        answer: 1,
        why: 'enable lo deja activado al arranque; start lo arranca ahora.',
      },
      {
        q: 'Para reparar automáticamente un sistema de ficheros desmontado:',
        options: ['mount -T', 'fsck -y', 'chkdsk', 'mkfs'],
        answer: 1,
        why: 'fsck -y responde «sí» a todas las reparaciones.',
      },
      {
        q: '¿Cuándo se ejecuta «30 2 * * 1»?',
        options: ['El 2 de cada mes a las 00:30', 'Los lunes a las 02:30', 'Cada 30 minutos', 'El 30 de febrero'],
        answer: 1,
        why: 'Minuto 30, hora 2, día de la semana 1 (lunes).',
      },
    ],
  },
  {
    id: 'B4T02',
    short: 'Bases de datos, almacenamiento y backup',
    title:
      'Administración de bases de datos. Funciones y responsabilidades. Sistemas de almacenamiento y su virtualización. Políticas, sistemas y procedimientos de backup y su recuperación. Backup de sistemas físicos y virtuales. Virtualización de sistemas y virtualización de puestos de usuario.',
    lessons: ['dk-conceptos'],
    body: `## El administrador de bases de datos (DBA)
Instala y configura el SGBD, gestiona usuarios y permisos, hace copias y recuperaciones, ajusta el rendimiento (índices, planes de ejecución) y vigila la integridad y la seguridad.

## Almacenamiento
- **DAS**: conectado directamente al servidor.
- **NAS**: almacenamiento en red **a nivel de ficheros** (NFS, SMB/CIFS). Es sencillo y barato.
- **SAN**: red dedicada de almacenamiento **a nivel de bloques** (Fibre Channel, iSCSI). Es más rápida, cara y compleja.
- **RAID**: el 0 reparte los datos sin redundancia; el 1 es un espejo; el **5** reparte la paridad y **tolera 1 fallo**; el 6 tolera 2; el 10 combina espejo y reparto.

## Copias de seguridad
- **Completa**: todo. **Incremental**: lo cambiado desde la **última copia de cualquier tipo**; es la más rápida de hacer y la más lenta de restaurar. **Diferencial**: lo cambiado desde la **última completa**.
- **Regla 3-2-1**: **3** copias, en **2** soportes distintos, con **1** fuera de la sede (o fuera de la organización).
- **RPO**: cuántos datos puedes permitirte perder (en tiempo). **RTO**: cuánto puedes tardar en recuperar el servicio.
- **Snapshot** frente a **backup**: el snapshot es una foto del estado en un instante, que suele depender del almacenamiento original; el backup es una copia independiente, que puede guardarse en otro medio y en otro lugar. Un snapshot no sustituye a un backup.

## Virtualización
- Hipervisor de **tipo 1** (bare-metal: ESXi, Hyper-V, KVM) y de **tipo 2** (alojado: VirtualBox, VMware Workstation).
- Puestos de usuario: **VDI** (escritorios virtuales en el CPD, como Citrix o VMware Horizon).`,
    quiz: [
      {
        q: 'La copia que guarda los cambios desde la última completa es la…',
        options: ['incremental', 'diferencial', 'espejo', 'snapshot'],
        answer: 1,
        why: 'La diferencial siempre compara con la última completa.',
      },
      {
        q: '¿Qué sistema de almacenamiento trabaja a nivel de bloques?',
        options: ['NAS', 'SAN', 'NFS', 'SMB'],
        answer: 1,
        why: 'SAN, a nivel de bloques; NAS, a nivel de ficheros.',
      },
      {
        q: 'El RPO mide…',
        options: ['el tiempo de recuperación', 'la pérdida de datos aceptable', 'el número de copias', 'el tamaño del backup'],
        answer: 1,
        why: 'Recovery Point Objective. El RTO es el tiempo de recuperación.',
      },
    ],
  },
  {
    id: 'B4T03',
    short: 'Correo electrónico y contenedores',
    title: 'Administración de servidores de correo electrónico y sus protocolos. Administración de contenedores y microservicios.',
    lessons: ['dk-conceptos', 'dk-imagenes', 'dk-primer', 'dk-servicios', 'dk-parar', 'dk-exec', 'dk-k8s'],
    body: `## Correo electrónico
- **SMTP** envía el correo entre servidores (puertos 25, 587 de *submission* y 465 sobre TLS).
- **POP3** (puerto 110; **995** con TLS) **descarga** el correo al cliente, y la sincronización va en un solo sentido.
- **IMAP** (puerto 143; **993** con TLS) **mantiene el correo en el servidor** y lo sincroniza (carpetas incluidas) entre todos los dispositivos.
- Servidores de correo: **Postfix** (se configura en \`/etc/postfix/main.cf\`; el nombre del saludo HELO se fija con \`smtp_helo_name\`), Sendmail, Exim y Exchange.
- Antispam y autenticación del remitente: **SPF**, **DKIM** y **DMARC**.

## Contenedores
- **Docker**: \`pull\`, \`images\`, \`run\` (crea, arranca y descarga la imagen si falta), \`ps -a\`, \`logs\`, \`exec\`, \`stop\` (SIGTERM, cierre ordenado), \`kill\` (SIGKILL, inmediato), \`rm\` (borra contenedores) y \`rmi\` (borra imágenes). Las imágenes se construyen con un **Dockerfile** y \`docker build\`, y \`docker compose\` levanta varios servicios a la vez.
- Alternativas: **Podman**, containerd y CRI-O.

## Microservicios y Kubernetes
- **Microservicios**: aplicaciones partidas en servicios pequeños e independientes, que se comunican por API y se despliegan por separado.
- **Kubernetes**: Pods, Deployments y **Services** (que admiten **TCP**, UDP y SCTP). El plano de control lo forman **kube-apiserver**, **etcd** (el estado), **kube-scheduler** (que decide en qué nodo va cada Pod) y kube-controller-manager. En cada nodo trabajan el kubelet y kube-proxy.`,
    quiz: [
      {
        q: 'Puerto estándar de IMAPS:',
        options: ['143', '110', '995', '993'],
        answer: 3,
        why: '993 es IMAP sobre TLS; 995 es POP3S.',
      },
      {
        q: '¿Qué protocolo deja el correo en el servidor y lo sincroniza entre dispositivos?',
        options: ['POP3', 'IMAP', 'SMTP', 'MIME'],
        answer: 1,
        why: 'IMAP.',
      },
      {
        q: 'docker stop frente a docker kill:',
        options: ['Son lo mismo', 'stop manda SIGTERM (cierre ordenado) y kill SIGKILL (inmediato)', 'kill borra el contenedor', 'stop borra la imagen'],
        answer: 1,
        why: 'kill corta al instante; ninguno de los dos borra nada.',
      },
    ],
  },
  {
    id: 'B4T04',
    short: 'Administración de redes locales',
    title: 'Administración de redes de área local. Gestión de usuarios. Gestión de dispositivos. Monitorización y control de tráfico.',
    lessons: ['f-redes'],
    body: `## Usuarios: Active Directory
- **Dominio**, **árbol** y **bosque**. Las **Unidades Organizativas (OU)** organizan los objetos y a ellas se vinculan las **GPO** (directivas de grupo).
- Herramientas: **dsa.msc** (Usuarios y equipos de AD), gpmc.msc (directivas), \`repadmin /replsummary\` (resumen de la replicación entre controladores de dominio) y \`dcdiag\` (diagnóstico).
- Los **PSO** (Password Settings Objects, o directivas de contraseña específicas) aplican políticas de contraseña distintas a usuarios o grupos concretos dentro del mismo dominio.
- **LDAP** es el protocolo de acceso a directorios (puerto 389; 636 con TLS). **RADIUS** y **802.1X** autentican el acceso a la red.

## Dispositivos (Cisco IOS)
- Asignar un puerto a una VLAN: dentro de la interfaz, \`switchport access vlan 10\`. Los enlaces troncales se configuran con \`switchport mode trunk\`.
- **Port-security**: limita las MAC que puede tener un puerto. Con **sticky**, las MAC aprendidas pasan a la running-config y se pueden guardar.
- **DHCP relay**: en la interfaz o SVI se usa \`ip helper-address IP_del_servidor\`.
- **MDM** (gestión de dispositivos móviles): *enrolar* un móvil es darlo de alta en el MDM y asociarlo a su usuario.

## Monitorización
- **SNMP** (puertos 161 y 162 para *traps*): gestión con agentes y una MIB.
- Herramientas: **Nagios** (\`nagios -v nagios.cfg\` verifica la configuración), Zabbix, PRTG, Wireshark (captura de tráfico) y NetFlow/sFlow (análisis de flujos).
- Diagnóstico: \`ping\`, \`traceroute\`/\`tracert\`, \`nslookup\`/\`dig\` y \`nc -vz host puerto\` (para probar si un puerto TCP responde).`,
    quiz: [
      {
        q: '¿Qué comando de Cisco IOS reenvía las peticiones DHCP a otra red?',
        options: ['ip dhcp server', 'ip helper-address', 'service dhcp forward', 'relay dhcp'],
        answer: 1,
        why: 'ip helper-address en la interfaz o SVI.',
      },
      {
        q: 'Antes de aplicar GPO a un grupo de usuarios, la buena práctica es crear…',
        options: ['un bosque nuevo', 'una Unidad Organizativa', 'una relación de confianza', 'un dominio hijo'],
        answer: 1,
        why: 'Las GPO se vinculan a OU.',
      },
      {
        q: '¿Qué puerto usa SNMP para las consultas?',
        options: ['161', '389', '514', '22'],
        answer: 0,
        why: '161 (y 162 para los traps).',
      },
    ],
  },
  {
    id: 'B4T05',
    short: 'Seguridad: conceptos, amenazas y criptografía',
    title:
      'Conceptos de seguridad de los sistemas de información. Seguridad física. Seguridad lógica. Amenazas y vulnerabilidades. Técnicas criptográficas y protocolos seguros. Mecanismos de firma digital. Infraestructura física de un CPD: acondicionamiento y equipamiento. Sistemas de alimentación ininterrumpida.',
    lessons: [],
    body: `## Dimensiones de la seguridad
Confidencialidad, **integridad**, **disponibilidad**, autenticidad y trazabilidad. Ejemplo: una base de datos corrupta e inaccesible afecta a la **integridad** y a la **disponibilidad**.

## Amenazas y ataques
- Ingeniería social: **phishing** (correo), **smishing** (SMS), **vishing** (teléfono), **whaling** (contra directivos) y **pharming** (manipulación del DNS o del fichero hosts para redirigir a una web falsa).
- **Sniffing** (capturar tráfico), **spoofing** (falsear el origen), **DoS/DDoS** (desde muchos puntos a la vez), **escaneo de puertos**, *man in the middle*, inyección SQL y **XSS** (se previene validando y escapando).
- Físicos: el **tailgating** o *piggybacking* (colarse detrás de una persona autorizada).
- **APT** (según el CCN): ataque selectivo de ciberespionaje o cibersabotaje patrocinado por un Estado u organización, con fines que van más allá de lo económico.
- Malware: virus, gusano, troyano, **ransomware**, spyware, keylogger y rootkit.
- Bases de datos de vulnerabilidades: **CVE** (identificadores), **NVD** (la base del NIST) y CVSS (la puntuación de gravedad).

## Autenticación
- **MFA**: combina factores de categorías **distintas**: algo que sabes, algo que tienes y algo que eres. Iris más huella **no** es MFA, porque los dos son «algo que eres».
- Contraseñas según el CCN-CERT: largas, mejor **frases sin sentido** fáciles de recordar, y nunca con datos personales.

## Criptografía
- **Simétrica** (una misma clave): AES. **Asimétrica** (pública y privada): RSA y ECC.
- **Hash**: SHA-256 y SHA-3 (MD5 y SHA-1 están obsoletos); sirve para comprobar la **integridad**.
- **Firma digital**: el hash del documento cifrado con la **clave privada**. Se verifica con la pública.
- **PKI**: autoridades de certificación, certificados X.509 y listas de revocación (CRL/OCSP).

## CPD y su infraestructura
- **TIA-942**: niveles **Tier I a IV**, de menor a mayor redundancia (el Tier III permite mantenimiento sin parar). Zonas: MDA (distribución principal), HDA y **EDA** (donde van los equipos finales).
- La climatización y la humedad deben ser propias del CPD. El **SAI** (UPS) puede ser off-line, interactivo o **on-line de doble conversión**. Detección y extinción de incendios con gas inerte.
- Herramientas del **CCN-CERT**: **LUCIA** (gestión de incidentes), CLAUDIA y microCLAUDIA (detección y vacunas en el puesto), **EMMA** (visibilidad y control de la red), CARMEN (detección de amenazas en la red), PILAR (análisis de riesgos), INES (informe del estado de seguridad del ENS) y ATENEA (formación).`,
    quiz: [
      {
        q: 'Engañar a alguien por teléfono para robarle datos es…',
        options: ['phishing', 'smishing', 'vishing', 'pharming'],
        answer: 2,
        why: 'Voice phishing.',
      },
      {
        q: 'Una firma digital se genera cifrando el hash con…',
        options: ['la clave pública del firmante', 'la clave privada del firmante', 'una clave simétrica', 'la clave de la CA'],
        answer: 1,
        why: 'Se firma con la privada y se verifica con la pública.',
      },
      {
        q: '¿Qué herramienta del CCN gestiona incidentes de seguridad (ticketing)?',
        options: ['EMMA', 'LUCIA', 'PILAR', 'CARMEN'],
        answer: 1,
        why: 'LUCIA.',
      },
    ],
  },
  {
    id: 'B4T06',
    short: 'Comunicaciones: medios, equipos y redes',
    title:
      'Comunicaciones. Medios de transmisión. Modos de comunicación. Equipos terminales y equipos de interconexión y conmutación. Redes de comunicaciones. Redes de conmutación y redes de difusión. Comunicaciones móviles e inalámbricas.',
    lessons: ['f-redes'],
    body: `## Medios de transmisión
- **Par trenzado** (UTP/STP), por categorías: **Cat 5e** (1 Gbps), **Cat 6** (1 Gbps; 10 Gbps solo en distancias cortas), **Cat 6A** (**10 Gbps** a 100 m) y Cat 8 (25-40 Gbps a 30 m).
- **Fibra óptica**: monomodo (largas distancias) y multimodo (cortas). Es inmune a las interferencias electromagnéticas.
- Coaxial e inalámbrico: radio, microondas y satélite.

## Modos y técnicas
- **Símplex** (un solo sentido), **semidúplex** (los dos sentidos, pero por turnos) y **dúplex** (a la vez).
- Multiplexación por división de frecuencia (FDM), de tiempo (TDM) y de longitud de onda (WDM).

## Conmutación
- **De circuitos**: reserva un **camino dedicado** durante toda la comunicación (la telefonía clásica).
- **De paquetes**: comparte el ancho de banda y cada paquete puede seguir una ruta distinta (datagramas) o un circuito virtual. Funciona con almacenamiento y reenvío.

## Equipos de interconexión
**Repetidor** y **hub** (capa 1), **puente** y **switch** (capa 2), **router** (capa 3) y **pasarela o gateway**, que conecta redes con protocolos o tecnologías distintas (por ejemplo, coaxial con Ethernet).

## Móviles e inalámbricas
- Generaciones de telefonía móvil: 2G (GSM), 3G (UMTS), 4G (LTE) y 5G.
- **LPWAN** (largo alcance y bajo consumo, para IoT): LoRaWAN, Sigfox y NB-IoT. Bluetooth LE es de **corto** alcance: tiene 40 canales, 3 de ellos de anuncio primario.
- **VoIP**: **SIP** y RTP. El **NAT** da problemas porque SIP lleva las IP dentro del mensaje.`,
    quiz: [
      {
        q: '¿Qué categoría de cable alcanza 10 Gbps a 100 metros?',
        options: ['Cat 5e', 'Cat 6', 'Cat 6A', 'Cat 3'],
        answer: 2,
        why: 'Cat 6A.',
      },
      {
        q: 'Transmitir en ambos sentidos pero no a la vez es…',
        options: ['símplex', 'semidúplex', 'dúplex', 'multiplexado'],
        answer: 1,
        why: 'Half-duplex.',
      },
      {
        q: '¿Qué dispositivo trabaja en la capa 3 (red)?',
        options: ['Hub', 'Switch', 'Router', 'Repetidor'],
        answer: 2,
        why: 'El router encamina por dirección IP.',
      },
    ],
  },
  {
    id: 'B4T07',
    short: 'Modelos OSI y TCP/IP, direccionamiento IP',
    title:
      'El modelo TCP/IP y el modelo de referencia de interconexión de sistemas abiertos (OSI) de ISO. Protocolos TCP/IP.',
    lessons: ['f-redes'],
    body: `## OSI: 7 capas (ISO/IEC 7498-1:1994)
1. **Física**: bits, cables y señales.
2. **Enlace**: tramas y MAC; se divide en las subcapas **LLC** y **MAC**.
3. **Red**: paquetes, IP y encaminamiento.
4. **Transporte**: TCP y UDP, puertos, control de extremo a extremo.
5. **Sesión**: diálogo y sincronización.
6. **Presentación**: sintaxis, **cifrado** y **compresión**.
7. **Aplicación**: HTTP, DNS, SMTP…

## TCP/IP: 4 capas
Acceso a red · **Internet** (IP, **ICMP**, ARP) · **Transporte** (TCP, UDP) · Aplicación.
- **TCP**: orientado a conexión (*handshake* de 3 pasos: SYN, SYN-ACK, ACK) y fiable. **UDP**: sin conexión y rápido.
- **Protocolos de usuario** (los usa directamente la persona: FTP, SMTP, Telnet, HTTP) y **de soporte** (dan servicio por debajo: DNS, SNMP).

## Direccionamiento IPv4
- Clases: **A** 1-126 (máscara /8), **B** 128-191 (/16) y **C** 192-223 (/24, hasta 254 hosts).
- Privadas (RFC 1918): 10.0.0.0/8, **172.16.0.0/12** y 192.168.0.0/16.
- **Hosts por red** = 2^(bits de host) − 2. Por ejemplo, /20 → 4094.
- **Subredes**: con n bits prestados se obtienen 2ⁿ subredes. Para 600 subredes hacen falta 10 bits.
- Herramientas: \`ip route get IP\`, ping (ICMP) y traceroute.

## IPv6
- 128 bits, escritos en hexadecimal (\`2001:db8::1\`). No hay broadcast: hay multicast y anycast.
- El campo **Hop Limit** (el antiguo TTL de IPv4) es el número máximo de saltos antes de descartar el paquete (RFC 8200).

## Puertos que caen
FTP 20/21 · **SSH/SFTP 22** · Telnet 23 · SMTP 25 · DNS 53 · DHCP 67/68 · HTTP 80 · POP3 110 · IMAP 143 · SNMP 161 · LDAP 389 · **HTTPS 443** · SMTPS 465 · IMAPS 993 · POP3S 995 · MySQL 3306 · **RDP 3389**.`,
    quiz: [
      {
        q: '¿En qué capa del modelo TCP/IP está ICMP?',
        options: ['Transporte', 'Internet', 'Aplicación', 'Acceso a red'],
        answer: 1,
        why: 'ICMP acompaña a IP en la capa de Internet.',
      },
      {
        q: '¿Cuántos hosts admite una red /22?',
        options: ['1022', '1024', '510', '2046'],
        answer: 0,
        why: '32 − 22 = 10 bits → 2¹⁰ − 2 = 1022.',
      },
      {
        q: '¿Cuál es el puerto de RDP?',
        options: ['389', '3389', '22', '445'],
        answer: 1,
        why: '3389. (El 389 es LDAP.)',
      },
    ],
  },
  {
    id: 'B4T08',
    short: 'Internet, HTTP y TLS',
    title: 'Internet: arquitectura de red. Origen, evolución y estado actual. Principales servicios. Protocolos HTTP, HTTPS y SSL/TLS.',
    lessons: [],
    body: `## Arquitectura y gobierno de Internet
- Nació con **ARPANET** (1969); en 1983 adoptó **TCP/IP**, y en 1989-1991 llegó la **WWW** (Tim Berners-Lee, en el CERN).
- La red está formada por sistemas autónomos (AS) que se conectan entre sí con **BGP**, y por puntos neutros (IXP; en España, **Espanix**).
- Organismos: el **IETF** (crea los estándares, los **RFC**), **ICANN/IANA** (los nombres de dominio, las direcciones IP y la raíz del DNS), el **W3C** (los estándares web) y el **IGF** (el foro de gobernanza).

## Servicios
- **DNS**: registros A, AAAA, MX, CNAME, NS, TXT y PTR.
- **FTP**: el modo **ASCII** sirve para texto plano y el **binario** para todo lo demás. En el modo activo y en el pasivo usa un canal de control y otro de datos.
- **FTPS** es FTP sobre TLS, con dos canales y autenticación por usuario y contraseña o por certificado. **SFTP** funciona sobre **SSH**, por el **puerto 22** y con un único canal.
- Además: correo, DHCP y servicios web.

## HTTP
- Métodos: GET, POST, PUT, DELETE, PATCH, HEAD y OPTIONS. Es **sin estado**: el estado se guarda con cookies o tokens.
- Familias de códigos: **1xx** informativos, **2xx** éxito, **3xx** redirección, **4xx** errores del cliente (**401** sin autenticar, **403** prohibido, 404 no encontrado) y **5xx** errores del servidor.
- HTTP/2 multiplexa las peticiones y HTTP/3 funciona sobre **QUIC** (UDP).

## SSL/TLS y HTTPS
- SSL está obsoleto. Versiones de TLS: 1.0 y 1.1 obsoletas; el **CCN** fija **TLS 1.2 como mínimo** y **recomienda TLS 1.3**.
- **TLS 1.3**: el *handshake* se completa en **1-RTT** (0-RTT al reanudar) y elimina los algoritmos débiles.
- **HTTPS** = HTTP sobre TLS (puerto 443). Se recomienda dejar el puerto 80 solo para **redirigir automáticamente a HTTPS**, junto con **HSTS**.`,
    quiz: [
      {
        q: '¿Qué organismo publica los RFC?',
        options: ['W3C', 'IETF', 'ICANN', 'ISO'],
        answer: 1,
        why: 'Internet Engineering Task Force.',
      },
      {
        q: 'Versión mínima de TLS aceptable según el CCN:',
        options: ['1.0', '1.1', '1.2', '1.3'],
        answer: 2,
        why: 'Mínimo 1.2; se recomienda 1.3.',
      },
      {
        q: '¿Sobre qué protocolo funciona SFTP?',
        options: ['TLS', 'SSH', 'FTP', 'HTTP'],
        answer: 1,
        why: 'SFTP es un subsistema de SSH (puerto 22).',
      },
    ],
  },
  {
    id: 'B4T09',
    short: 'Seguridad en redes: perímetro, VPN y wifi',
    title:
      'Seguridad y protección en redes de comunicaciones. Seguridad perimetral. Acceso remoto seguro a redes. Redes privadas virtuales (VPN). Seguridad en el puesto del usuario.',
    lessons: [],
    body: `## Seguridad perimetral
- **Cortafuegos** de filtrado de paquetes, con estado (*stateful*), de aplicación (proxy) y **NGFW** (de nueva generación). Los **WAF** protegen las aplicaciones web.
- **DMZ**: una zona aislada con cortafuegos donde van los servidores expuestos a Internet, para que una intrusión en ellos no alcance directamente la red interna.
- **IDS** (detecta y alerta) frente a **IPS** (detecta y bloquea). El **SIEM** correlaciona eventos y el **honeypot** es un señuelo para atraer y estudiar a los atacantes.
- **UTM**: un único equipo que reúne cortafuegos, IPS, antivirus, VPN…

## Linux
- **firewalld**: \`firewall-cmd --zone=public --list-services\` y reglas persistentes con \`--permanent\`. Las *rich rules* tienen la forma \`rule family="ipv4" source address="RED" port port="3306" protocol="tcp" accept\`.
- Contra la suplantación de IP: \`net.ipv4.conf.all.rp_filter=1\` (filtrado de ruta inversa).
- En Windows: \`netsh advfirewall firewall add rule name=… dir=in action=allow protocol=TCP localport=8443\`.

## Acceso remoto y VPN
- **VPN**: túnel cifrado sobre una red pública. Puede ser de sitio a sitio o de acceso remoto. Tecnologías: **IPsec** (AH, ESP e IKE), **SSL/TLS** (OpenVPN) y WireGuard.
- Para administrar en remoto: **SSH** (puerto 22) y RDP (puerto 3389, mejor a través de una VPN). **SFTP** usa el puerto 22 de SSH; FTPS usa TLS con dos canales.
- **Zero Trust**: no confiar nunca por defecto y verificar siempre.

## Wifi
- WEP y WPA están obsoletos. WPA2 usa AES-CCMP. **WPA3-Personal** se basa en SAE. **WPA3-Enterprise** usa **802.1X con un servidor RADIUS** y EAP (por ejemplo, EAP-TLS).

## Puesto del usuario
Antivirus y **EDR**, actualizaciones, mínimo privilegio, cifrado del disco (BitLocker), bloqueo de la sesión y formación del usuario (el **pharming** y el phishing atacan precisamente al usuario).`,
    quiz: [
      {
        q: '¿Qué detecta y además bloquea el tráfico malicioso?',
        options: ['IDS', 'IPS', 'SIEM', 'Honeypot'],
        answer: 1,
        why: 'Intrusion Prevention System.',
      },
      {
        q: 'WPA3-Enterprise autentica a los usuarios con…',
        options: ['una contraseña compartida', '802.1X y un servidor RADIUS', 'WEP', 'la dirección MAC'],
        answer: 1,
        why: 'Con EAP sobre 802.1X contra un servidor RADIUS.',
      },
      {
        q: '¿Dónde se colocan los servidores expuestos a Internet?',
        options: ['En la LAN interna', 'En la DMZ', 'En la VPN', 'En el SIEM'],
        answer: 1,
        why: 'En la zona desmilitarizada.',
      },
    ],
  },
  {
    id: 'B4T10',
    short: 'Redes locales y wifi',
    title: 'Redes locales. Tipología. Técnicas de transmisión. Métodos de acceso. Dispositivos de interconexión.',
    lessons: ['f-redes'],
    body: `## Topologías
- **Estrella**: todos se conectan a un nodo central (switch). Es la habitual.
- **Bus**: un cable común con **terminadores** en los extremos, que absorben la señal y evitan los rebotes.
- **Anillo**, **malla** (enlaces redundantes) y **árbol** (estrellas jerarquizadas).

## Ethernet (IEEE 802.3)
- La trama estándar lleva una carga útil de hasta **1500 bytes** (la MTU). Las **jumbo frames** llegan a unos **9000 bytes**.
- Método de acceso: **CSMA/CD**. Hoy, con switches y enlaces dúplex, ya no hay colisiones.
- **PoE** (alimentación por el cable Ethernet): 802.3af (PoE), 802.3at (PoE+) y el más reciente, **802.3bt** (PoE++). El PoE «pasivo» no sigue ningún estándar.
- El **LED** de la tarjeta de red suele indicar la velocidad: en muchas, **verde** significa 1 Gbps y **ámbar o naranja**, una velocidad menor.

## Estándares IEEE 802 que caen
- **802.1Q**: **VLAN**. Su etiqueta lleva **PCP** (3 bits, 8 niveles de prioridad), DEI/CFI y el **VID** (12 bits).
- **802.1D**: STP. **802.1w**: **RSTP** (Rapid Spanning Tree). 802.1s: MSTP. **802.1X**: control de acceso a la red.
- **802.11**: wifi. **802.11n** es Wi-Fi 4, **802.11ac** Wi-Fi 5, **802.11ax** Wi-Fi 6/6E y **802.11be** Wi-Fi 7. Método de acceso: **CSMA/CA**.
- 802.15: redes personales (Bluetooth). 802.3: Ethernet.

## Dispositivos de interconexión
**Hub** (capa 1, reenvía a todos los puertos), **switch** (capa 2, conmuta por MAC y separa VLAN), **switch de capa 3** y **router** (encaminan por IP), **punto de acceso** wifi y **pasarela**.`,
    quiz: [
      {
        q: '¿Qué estándar define las VLAN?',
        options: ['802.1D', '802.1Q', '802.11', '802.3af'],
        answer: 1,
        why: '802.1Q. (802.1D es STP.)',
      },
      {
        q: '¿Qué campo de la etiqueta 802.1Q marca la prioridad?',
        options: ['VID', 'TPID', 'PCP', 'CFI'],
        answer: 2,
        why: 'Priority Code Point (3 bits = 8 niveles).',
      },
      {
        q: 'Método de acceso al medio del wifi:',
        options: ['CSMA/CD', 'CSMA/CA', 'Token passing', 'TDMA'],
        answer: 1,
        why: 'Collision Avoidance (en el aire no se pueden detectar las colisiones).',
      },
    ],
  },
];
