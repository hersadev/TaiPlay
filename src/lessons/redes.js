// Ruta «Redes y comunicaciones». Subnetting con ejercicios generados al azar
// (engine/drills) y un switch Cisco simulado (engine/ios) para configurar
// VLAN, puertos de acceso y troncales, la SVI con ip helper-address y
// port-security, que es lo que preguntan los supuestos de sistemas.

import { drillGoal, iosRan, vlanNamed, accessPort, trunkPort, sviIs, stickyOn, routingOn, savedConfig } from './_iosHelpers.js';

export const redes = [
  {
    id: 'rd-subnet-basico',
    type: 'drill',
    title: 'Subnetting I: máscaras, hosts, red y broadcast',
    summary: 'Ejercicios generados al azar hasta que el cálculo salga solo.',
    body: `En el supuesto de sistemas siempre caen cálculos de subredes. No hace falta pasar todo a binario: basta con **un truco** y con practicar.

## El truco del bloque
1. Mira el prefijo: **/26**. ¿En qué octeto corta? Cada 8 bits es un octeto: /24 es el final del 3.º, así que /26 corta el **4.º**.
2. **Tamaño del bloque** = 2 elevado a los bits de host que quedan en ese octeto. /26 deja 32 − 26 = 6 bits → **64**. (También: 256 − el valor de la máscara en ese octeto; 255.255.255.**192** → 256 − 192 = 64.)
3. Las redes empiezan en los múltiplos del bloque: .0, .64, .128, .192.
4. Para una IP, busca en qué bloque cae. **192.168.1.100/26** cae en .64–.127: red **.64**, broadcast **.127**, hosts de .65 a .126.

## Cuántos equipos caben
Con **h** bits de host hay **2ʰ direcciones** y **2ʰ − 2 hosts** (se pierden la de red y la de broadcast). Un /20 deja 12 bits → 4096 − 2 = **4094**.

| Prefijo | Máscara | Direcciones | Hosts |
|---|---|---|---|
| /24 | 255.255.255.0 | 256 | 254 |
| /25 | 255.255.255.128 | 128 | 126 |
| /26 | 255.255.255.192 | 64 | 62 |
| /27 | 255.255.255.224 | 32 | 30 |
| /28 | 255.255.255.240 | 16 | 14 |
| /30 | 255.255.255.252 | 4 | 2 |
| /20 | 255.255.240.0 | 4096 | 4094 |
| /16 | 255.255.0.0 | 65 536 | 65 534 |

Los valores posibles de un octeto de máscara son solo nueve: 0, 128, 192, 224, 240, 248, 252, 254 y 255. Apréndelos.

## Cómo funcionan los ejercicios
En el panel de ejercicios tienes cuatro tipos. Cada ejercicio es distinto y, si fallas, verás la solución explicada paso a paso; no resta. El prefijo puedes escribirlo como \`/26\`, \`26\` o \`255.255.255.192\`.`,
    objectives: [
      drillGoal('mascara', 3, 'Acierta 3 conversiones entre prefijo y máscara'),
      drillGoal('hosts', 3, 'Acierta 3 cálculos de hosts utilizables'),
      drillGoal('red', 4, 'Calcula la red y el broadcast en 4 ejercicios'),
      drillGoal('misma-red', 3, 'Decide bien 3 veces si dos IP están en la misma red'),
    ],
    hints: [
      'Bloque = 256 − (valor de la máscara en el octeto que corta). /27 → 256 − 224 = 32.',
      'Red: el múltiplo del bloque justo por debajo de la IP. Broadcast: la red + bloque − 1.',
      'Misma red: calcula la red de cada IP con la misma máscara y compáralas.',
    ],
    curiosity: 'Antes de 1993 no había prefijos: las redes eran de clase A (/8), B (/16) o C (/24). CIDR, la notación con barra, se inventó porque las direcciones IPv4 se estaban acabando a toda velocidad.',
    exam: ['tai2025A-S2-1', 'tai2025A-S2-2', 'tai2024A-S2-1', 'tai2024A-P74', 'tai2025X-P74', 'tai2022-S2-7', 'tai2019-S2-1', 'tai2019-S2-2', 'tai2019-S2-3'],
  },
  {
    id: 'rd-subnet-dividir',
    type: 'drill',
    title: 'Subnetting II: dividir una red',
    summary: 'Partir en N subredes, la máscara mínima para N subredes o N hosts.',
    body: `La otra mitad de lo que cae: **dividir** una red en trozos.

## Pedir bits prestados
Para partir una red en **N subredes iguales** se toman bits de la parte de host. Con **k** bits salen **2ᵏ** subredes:
- 2 subredes → 1 bit; 4 → 2 bits; 8 → 3 bits; 16 → 4 bits.
- **10.30.24.0/21 en 4**: 2 bits → **/23**. Un /23 es un bloque de 2 en el 3.er octeto: .24, .26, **.28**, .30. La tercera es **10.30.28.0/23** (examen de 2025).

## Máscara mínima para N subredes
Busca la potencia de 2 que **llegue o supere** N.
- **600 subredes en 10.0.0.0/8**: 2⁹ = 512 no llega y 2¹⁰ = 1024 sí → 10 bits → 8 + 10 = **/18** (examen de 2025).

## Máscara para N hosts
Al revés: ahora cuentas bits de **host**, y recuerda el −2.
- **100 equipos**: 2⁶ − 2 = 62 no basta y 2⁷ − 2 = 126 sí → 7 bits de host → 32 − 7 = **/25**.

## Más subredes = menos hosts
Cada bit que pasa a la red divide los hosts entre dos. Un /16 partido en 16 subredes queda en /20, con 4094 hosts cada una (examen de 2024).`,
    objectives: [
      drillGoal('dividir', 4, 'Divide una red y localiza la subred pedida en 4 ejercicios'),
      drillGoal('n-subredes', 3, 'Acierta 3 veces la máscara mínima para N subredes'),
      drillGoal('n-hosts', 3, 'Acierta 3 veces la máscara para N hosts'),
    ],
    hints: [
      'N subredes iguales: k = bits tales que 2ᵏ = N. Prefijo nuevo = prefijo + k.',
      'La m-ésima subred empieza en: red base + (m − 1) × tamaño del bloque nuevo.',
      'Para hosts: el menor h con 2ʰ − 2 ≥ N. Prefijo = 32 − h.',
    ],
    curiosity: 'Las subredes de tamaño distinto dentro de una misma red se llaman VLSM (máscaras de longitud variable). Permiten dar un /30 a un enlace entre dos routers y un /24 a una planta llena de equipos.',
    exam: ['tai2025A-S2-3', 'tai2025A-P73', 'tai2024A-S2-1', 'tai2025X-S2-17', 'tai2022-S2-5', 'tai2022-S2R5', 'tai2019-S2-4'],
  },
  {
    id: 'rd-protocolos',
    type: 'concept',
    title: 'Capas, protocolos y puertos',
    summary: 'OSI frente a TCP/IP, TCP frente a UDP y los puertos que hay que saberse.',
    body: `## OSI y TCP/IP
El modelo **OSI** (norma ISO/IEC 7498-1) tiene **7 capas**. Cada una tiene su unidad de datos y sus aparatos:

| Capa OSI | Qué hace | Unidad | Ejemplos |
|---|---|---|---|
| 7 Aplicación | Servicios al usuario | Datos | HTTP, SMTP, DNS, FTP |
| 6 Presentación | Sintaxis, **cifrado, compresión** | Datos | TLS (en parte), JPEG |
| 5 Sesión | Diálogo entre extremos | Datos | RPC |
| 4 Transporte | Extremo a extremo, puertos | Segmento | TCP, UDP |
| 3 Red | Direccionamiento IP y rutas | Paquete | IP, **ICMP**, router |
| 2 Enlace | Tramas y direcciones MAC | Trama | Ethernet, **switch**, ARP |
| 1 Física | Bits por el cable o el aire | Bit | Cable, hub |

**TCP/IP** las reduce a 4: acceso a red, **Internet** (IP, ICMP), **transporte** (TCP, UDP) y **aplicación**. No tiene capas de sesión ni de presentación.

**ARP** obtiene la MAC (física) a partir de la IP (lógica). RARP hacía lo contrario.

## TCP o UDP
- **TCP**: orientado a conexión (saludo en tres pasos SYN, SYN-ACK, ACK), fiable, ordenado. Web, correo, SSH, bases de datos.
- **UDP**: sin conexión, sin garantías y más rápido. DNS (consultas), DHCP, VoIP, streaming.

En TCP/IP se distingue entre protocolos de **usuario**, que usa la persona directamente (FTP, SMTP, HTTP), y de **soporte**, que usan otros por debajo (DNS, ARP, ICMP).

## Puertos que caen
| Servicio | Puerto |
|---|---|
| FTP datos / control | 20 / 21 |
| SSH y SFTP | 22 |
| Telnet (inseguro) | 23 |
| SMTP | 25 (587 para envío autenticado) |
| DNS | 53 (UDP y TCP) |
| DHCP | 67 servidor, 68 cliente (UDP) |
| HTTP / HTTPS | 80 / 443 |
| POP3 / POP3S | 110 / 995 |
| IMAP / **IMAPS** | 143 / **993** |
| LDAP / LDAPS | 389 / 636 |
| MySQL | 3306 |
| RDP | 3389 |

## Correo y transferencia de ficheros
- **POP3** descarga el correo a un dispositivo. **IMAP** lo deja en el servidor, sincronizado (carpetas, leídos) en todos tus dispositivos.
- **SFTP** va dentro de SSH (puerto 22). **FTPS** es FTP sobre TLS. Los dos admiten contraseña y certificados.
- FTP tiene modo **ASCII**, para texto plano, y **binario**, para todo lo demás.`,
    quiz: [
      { q: '¿En qué capa del modelo TCP/IP está ICMP?', options: ['Acceso a red', 'Internet', 'Transporte', 'Aplicación'], answer: 1, why: 'ICMP (el de ping) va junto a IP, en la capa de Internet.' },
      { q: '¿Qué puerto debe exponerse para IMAPS?', options: ['143', '995', '993', '587'], answer: 2, why: 'IMAPS es 993. IMAP sin cifrar va por el 143 y POP3S por el 995.' },
      { q: 'Ventaja de IMAP frente a POP3:', options: ['Descarga el correo y lo borra del servidor', 'Mantiene el correo en el servidor, sincronizado entre dispositivos', 'Envía correo', 'No necesita usuario'], answer: 1, why: 'POP3 descarga; IMAP sincroniza.' },
      { q: 'La capa OSI que cifra, comprime y negocia la sintaxis es…', options: ['Sesión', 'Presentación', 'Aplicación', 'Transporte'], answer: 1, why: 'La 6, presentación.' },
      { q: '¿Qué protocolo obtiene la MAC a partir de la IP?', options: ['RARP', 'DNS', 'ARP', 'ICMP'], answer: 2, why: 'ARP. RARP hacía lo contrario.' },
    ],
    exam: ['tai2024A-P58', 'tai2024A-P72', 'tai2024A-P73', 'tai2025A-P71', 'tai2024A-S2-6', 'tai2024A-P63', 'tai2024A-S2-18', 'tai2025A-S2-17', 'tai2024A-S2-11', 'tai2024A-P77', 'tai2025X-P72', 'tai2025X-P75', 'tai2025X-S2-11', 'tai2022-S2-10', 'tai2022-S2-13', 'tai2019-P80', 'tai2019-S2-19', 'tai2019-S2R5'],
  },
  {
    id: 'rd-vlan',
    type: 'concept',
    title: 'Switches y VLAN',
    summary: 'Qué es una VLAN, puertos de acceso y troncales, 802.1Q, STP y port-security.',
    body: `Un **switch** trabaja en la capa 2: aprende qué MAC hay detrás de cada puerto (su tabla MAC) y envía cada trama solo por el puerto correcto.

## VLAN: varias redes en un mismo switch
Una **VLAN** (*Virtual LAN*) divide un switch físico en varios switches lógicos. Los equipos de la VLAN 10 (alumnos) no ven el tráfico de difusión de la VLAN 20 (profesores), aunque estén enchufados al mismo aparato. Cada VLAN es una red IP distinta (una subred).

- **Puerto de acceso** (*access*): pertenece a **una sola VLAN**. Ahí se conectan los PC. En Cisco: \`switchport mode access\` y \`switchport access vlan 10\`.
- **Puerto troncal** (*trunk*): lleva **varias VLAN** por un mismo cable, entre switches o hacia el router. Cada trama va etiquetada con su VLAN según **IEEE 802.1Q**.

## La etiqueta 802.1Q
Son 4 bytes que se insertan en la trama Ethernet:
- **TPID** (16 bits): vale 0x8100 e indica «trama etiquetada».
- **PCP** (3 bits): prioridad, **8 niveles** de clase de servicio (CoS).
- **DEI/CFI** (1 bit).
- **VID** (12 bits): el número de VLAN, de 1 a 4094.

La **VLAN nativa** de un troncal viaja **sin** etiqueta (por defecto, la 1).

## Comunicar VLAN entre sí
Como son redes distintas, hace falta un **router** o un **switch de capa 3**. En un switch multicapa se crea una **SVI** (\`interface vlan 10\`) con la IP que hará de puerta de enlace, y se activa \`ip routing\`.

El DHCP usa difusiones, que no salen de la VLAN. Si el servidor DHCP está en otra red, la SVI debe reenviar esas peticiones: es el **DHCP relay**, que en Cisco se configura con \`ip helper-address IP_del_servidor\`.

## Bucles y Spanning Tree
Con cables redundantes entre switches se forman bucles en los que las tramas dan vueltas sin fin. **STP** (IEEE **802.1D**) bloquea los enlaces sobrantes. **RSTP** (**802.1w**) es su versión rápida y **MSTP** (802.1s), la de varias instancias. \`spanning-tree portfast\` hace que un puerto con un PC pase a reenviar al momento.

## Port-security
Limita qué MAC pueden usar un puerto de acceso. Con \`switchport port-security mac-address sticky\`, el switch **aprende** la MAC del equipo conectado y la escribe en la **running-config**; si guardas la configuración, se queda para siempre. Si aparece otra MAC, el puerto reacciona según \`violation\`: \`shutdown\` (por defecto, el puerto queda *err-disabled*), \`restrict\` o \`protect\`.`,
    quiz: [
      { q: '«switchport access vlan 1» dentro de una interfaz…', options: ['Asigna ese puerto a la VLAN 1', 'Asigna el puerto 1 a la VLAN actual', 'Muestra los hosts de la VLAN 1', 'Pasa todos los puertos a la VLAN 1'], answer: 0, why: 'Configura el puerto en el que estás como puerto de acceso de la VLAN 1.' },
      { q: '¿Qué campo de 802.1Q da 8 niveles de prioridad?', options: ['VID', 'TPID', 'PCP', 'CFI'], answer: 2, why: 'PCP, 3 bits → 8 niveles (CoS).' },
      { q: 'El estándar de Rapid Spanning Tree es…', options: ['802.1D', '802.1Q', '802.1w', '802.1X'], answer: 2, why: '802.1w. 802.1D es STP clásico y 802.1X, el control de acceso por puerto.' },
      { q: 'Una MAC «sticky» en port-security…', options: ['Se borra al reiniciar siempre', 'Se aprende sola y pasa a la running-config, desde donde puede guardarse', 'Apaga el puerto si llega una BPDU', 'Hace que el puerto ignore STP'], answer: 1, why: 'Se aprende dinámicamente y se convierte en configuración.' },
      { q: '¿Con qué orden se configura el DHCP relay en la SVI?', options: ['ip dhcp server', 'ip helper-address', 'service dhcp forward', 'relay dhcp'], answer: 1, why: 'ip helper-address IP_del_servidor_DHCP.' },
    ],
    exam: ['tai2024A-S2-7', 'tai2025A-P80', 'tai2024A-PR3', 'tai2025A-P67', 'tai2025A-S2-4', 'tai2022-S2-17'],
  },
  {
    id: 'rd-ios-vlan',
    type: 'ios',
    title: 'Cisco IOS I: crear VLAN y asignar puertos',
    summary: 'Modos de la CLI de Cisco, vlan, name, interface y switchport access vlan.',
    body: `Estás en la **consola** del switch del aula, **SW-AULA**, un Cisco con puertos \`GigabitEthernet1/0/1\` a \`1/0/24\`. Los PC de los alumnos están en los puertos 1 a 10 y los de los profesores en el 11 y el 12.

## Los modos de IOS
El prompt te dice dónde estás, y cada orden solo existe en su modo:
| Prompt | Modo | Cómo se entra |
|---|---|---|
| \`SW-AULA>\` | Usuario: solo mirar | (al conectar) |
| \`SW-AULA#\` | Privilegiado: ver todo y guardar | \`enable\` |
| \`SW-AULA(config)#\` | Configuración global | \`configure terminal\` |
| \`SW-AULA(config-vlan)#\` | Una VLAN | \`vlan 10\` |
| \`SW-AULA(config-if)#\` | Una interfaz | \`interface gi1/0/5\` |

\`exit\` sube un nivel y \`end\` vuelve directamente al modo privilegiado.

## Las órdenes
\`\`\`
enable
configure terminal
vlan 10
 name ALUMNOS
interface gi1/0/5
 switchport mode access
 switchport access vlan 10
\`\`\`
Para varios puertos a la vez: \`interface range gi1/0/11 - 12\`.

IOS acepta **abreviaturas** siempre que no sean ambiguas: \`conf t\`, \`int gi1/0/5\`, \`sw mo acc\`. Si escribes \`?\` verás qué puedes poner en cada momento, y **Tab** completa la palabra.

Para comprobar, \`show vlan brief\` en modo privilegiado o, desde la configuración, \`do show vlan brief\`.`,
    setup: {
      hostname: 'SW-AULA',
      connected: Object.fromEntries([...Array.from({ length: 12 }, (_, i) => [`gi1/0/${i + 1}`, {}]), ['gi1/0/24', { description: 'Uplink SW-DIST' }]]),
    },
    objectives: [
      { label: 'Entra en el modo de configuración global (enable y configure terminal)', check: iosRan(/^configure terminal$/) },
      { label: 'Crea la VLAN 10 con el nombre ALUMNOS', check: vlanNamed(10, 'ALUMNOS') },
      { label: 'Crea la VLAN 20 con el nombre PROFESORES', check: vlanNamed(20, 'PROFESORES') },
      { label: 'Haz del puerto Gi1/0/5 un puerto de acceso de la VLAN 10', check: accessPort('gi1/0/5', 10) },
      { label: 'Pon los puertos Gi1/0/11 y Gi1/0/12 en la VLAN 20 como puertos de acceso', check: (sw) => accessPort('gi1/0/11', 20)(sw) && accessPort('gi1/0/12', 20)(sw) },
      { label: 'Comprueba el resultado con show vlan brief', check: (sw) => vlanNamed(20, 'PROFESORES')(sw) && iosRan(/^(do )?show vlan brief$/)(sw) },
    ],
    hints: [
      'enable → configure terminal (o «conf t»).',
      'vlan 10 → name ALUMNOS → vlan 20 → name PROFESORES',
      'interface gi1/0/5 → switchport mode access → switchport access vlan 10',
      'interface range gi1/0/11 - 12 → switchport mode access → switchport access vlan 20 → do show vlan brief',
    ],
    curiosity: 'Las VLAN no aparecen en la running-config de la mayoría de switches Cisco: se guardan solas en un fichero aparte de la flash, vlan.dat. Por eso, si borras la configuración para empezar de cero, las VLAN siguen ahí.',
    exam: ['tai2024A-S2-7', 'tai2025X-S2-13'],
  },
  {
    id: 'rd-ios-svi',
    type: 'ios',
    title: 'Cisco IOS II: SVI, DHCP relay, troncal y port-security',
    summary: 'El switch de distribución del supuesto de 2025: ip helper-address, 802.1Q, sticky y guardar.',
    body: `Ahora estás en **SW-DIST**, el switch de capa 3 de la red **10.30.16.0/20** del supuesto de 2025. Ya tiene creadas las VLAN 10 (ALUMNOS) y 20 (PROFESORES), y el puerto Gi1/0/1 está en la VLAN 10.

La VLAN 10 usa la **primera subred /25**: 10.30.16.0 a 10.30.16.127. Su puerta de enlace será la primera IP, **10.30.16.1**, con máscara **255.255.255.128**. El servidor DHCP está en otra red, en **10.30.20.5**.

## Enrutar entre VLAN: la SVI
\`\`\`
ip routing
interface vlan 10
 ip address 10.30.16.1 255.255.255.128
 ip helper-address 10.30.20.5
 no shutdown
\`\`\`
La SVI nace **apagada** (*administratively down*): sin \`no shutdown\` no funciona.

## Troncal 802.1Q hacia el resto de la red
\`\`\`
interface gi1/0/24
 switchport mode trunk
 switchport trunk allowed vlan 10,20
\`\`\`

## Port-security con sticky
Solo en puertos de **acceso** (si el puerto no lo es, IOS lo rechaza):
\`\`\`
interface gi1/0/1
 switchport port-security
 switchport port-security mac-address sticky
\`\`\`
Mira después \`show running-config interface gi1/0/1\`: aparecerá la MAC aprendida.

## Guardar
Todo lo anterior está en la **running-config** (RAM). Si el switch se reinicia, se pierde. Para guardarlo en la **startup-config** (NVRAM), desde el modo privilegiado:
\`\`\`
copy running-config startup-config
\`\`\`
o el atajo clásico \`write memory\` (\`wr\`). Desde la configuración: \`do wr\`.`,
    setup: {
      hostname: 'SW-DIST',
      connected: {
        'gi1/0/1': { description: 'PC-aula-01', mac: '0050.7966.6801' },
        'gi1/0/2': { description: 'PC-aula-02', mac: '0050.7966.6802' },
        'gi1/0/24': { description: 'Uplink CPD' },
      },
      commands: ['configure terminal', 'vlan 10', 'name ALUMNOS', 'vlan 20', 'name PROFESORES', 'interface gi1/0/1', 'switchport mode access', 'switchport access vlan 10', 'interface gi1/0/2', 'switchport mode access', 'switchport access vlan 10', 'end'],
    },
    objectives: [
      { label: 'Activa el enrutamiento entre VLAN (ip routing)', check: routingOn },
      { label: 'Crea la SVI de la VLAN 10 con la IP 10.30.16.1/25 y levántala', check: sviIs(10, { ip: '10.30.16.1', mask: '255.255.255.128', up: true }) },
      { label: 'Configura en la SVI el DHCP relay hacia 10.30.20.5', check: sviIs(10, { helper: '10.30.20.5' }) },
      { label: 'Convierte Gi1/0/24 en troncal que solo deje pasar las VLAN 10 y 20', check: trunkPort('gi1/0/24', [10, 20]) },
      { label: 'Activa port-security con MAC sticky en Gi1/0/1', check: stickyOn('gi1/0/1') },
      { label: 'Guarda la configuración en la startup-config', check: savedConfig },
    ],
    hints: [
      'enable → conf t → ip routing',
      'interface vlan 10 → ip address 10.30.16.1 255.255.255.128 → ip helper-address 10.30.20.5 → no shutdown',
      'interface gi1/0/24 → switchport mode trunk → switchport trunk allowed vlan 10,20',
      'interface gi1/0/1 → switchport port-security → switchport port-security mac-address sticky → end → copy running-config startup-config',
    ],
    curiosity: 'Se llama «helper» porque no solo reenvía DHCP: por defecto también reenvía otros siete servicios UDP de difusión, como TFTP, DNS o NetBIOS. Por eso en redes grandes se suele afinar con «ip forward-protocol».',
    exam: ['tai2025A-S2-4', 'tai2025A-S2-1', 'tai2025A-P67', 'tai2025A-P80'],
  },
];
