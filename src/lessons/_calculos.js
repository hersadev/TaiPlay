// Lecciones de cálculo con ejercicios generados al azar (tipo «drill», ver
// engine/drills). Cada una se intercala en su ruta: numeración y
// almacenamiento en «Empieza desde cero», crontab en Linux, y puertos e
// IPv6 en Redes.

import { drillGoal } from './_iosHelpers.js';

export const fBases = {
  id: 'f-bases',
  type: 'drill',
  title: 'Practica: binario, octal, hexadecimal y bits',
  summary: 'Cambios de base y operaciones AND, OR, XOR y desplazamientos, generados al azar.',
  exam: ['tai2024A-P20'],
  body: `Aquí no hay que memorizar: hay que **soltar la mano**. Cada ejercicio es distinto y al fallar ves el cálculo paso a paso.

## De cualquier base a decimal
Cada posición vale la base elevada a su lugar, contando desde 0 por la derecha. Se multiplica cada cifra por su peso y se suma:
- Binario \`1011\` = 8 + 0 + 2 + 1 = **11**.
- Octal \`17\` = 1×8 + 7 = **15**.
- Hexadecimal \`2C\` = 2×16 + 12 = **44** (A=10, B=11, C=12, D=13, E=14, F=15).

## De decimal a otra base
Se divide entre la base una y otra vez y se leen los **restos de abajo arriba**. 44 entre 16 da 2, resto 12 (C); 2 entre 16 da 0, resto 2 → **2C**.

## El atajo: binario ↔ hexadecimal y octal
Una cifra **hexadecimal son 4 bits** y una **octal son 3**. Se agrupan los bits desde la derecha y se traduce cada grupo, sin pasar por decimal:
- \`1100 0011 1101\` → C 3 D → **C3D**.
- \`010 001 111\` → 2 1 7 → **217** en octal.

## Operaciones con bits
| Operación | Da 1 cuando… | Para qué se usa |
|---|---|---|
| AND | los dos bits son 1 | Aplicar una máscara (dirección de red) |
| OR | alguno es 1 | Encender bits |
| XOR | son distintos | Cambiar bits, comparar, cifrado |
| NOT | el bit era 0 | Invertir (la máscara wildcard) |

Desplazar **n** posiciones a la izquierda (\`x << n\`) multiplica por 2ⁿ; a la derecha (\`x >> n\`), divide entre 2ⁿ sin decimales.`,
  objectives: [
    drillGoal('a-decimal', 4, 'Pasa 4 números a decimal'),
    drillGoal('desde-decimal', 4, 'Pasa 4 números de decimal a otra base'),
    drillGoal('bin-hex', 3, 'Traduce 3 veces entre binario y hexadecimal u octal'),
    drillGoal('bits', 4, 'Resuelve 4 operaciones con bits'),
  ],
  hints: [
    'Pesos en binario: 128 64 32 16 8 4 2 1.',
    'Hexadecimal: A=10, B=11, C=12, D=13, E=14, F=15.',
    'De binario a hexadecimal: grupos de 4 bits desde la derecha.',
    'AND: 1 solo si los dos son 1. XOR: 1 si son distintos.',
  ],
  curiosity: 'El octal sobrevive sobre todo en los permisos de Linux: chmod 755 son tres cifras octales, una por cada trío rwx (3 bits).',
};

export const fAlmacenamiento = {
  id: 'f-almacenamiento',
  type: 'drill',
  title: 'Practica: KB y KiB, velocidades y RAID',
  summary: 'Unidades de almacenamiento, Mbps frente a MB/s y la capacidad de cada RAID.',
  exam: ['tai2019-S2-12', 'tai2025A-P27', 'tai2019-P61', 'tai2019-S2R4', 'tai2022-P26', 'tai2025X-P24'],
  body: `Tres cálculos que caen una y otra vez, también en los supuestos.

## KB frente a KiB
- **KB, MB, GB, TB** son del Sistema Internacional: cada una son **1000** de la anterior. Las usan los fabricantes de discos y las redes.
- **KiB, MiB, GiB, TiB** (con **i**, de *binario*) son de **1024** en 1024. Las usa el sistema operativo: en Linux, la «G» de \`df -h\` o de \`lvextend -L 600G\` son GiB.

Por eso un disco de 1 TB (10¹² bytes) aparece como unos **931 GiB**. No falta nada: es otra unidad.

## Bits frente a bytes
La **velocidad** de red va en **bits** por segundo (**Mbps**, b minúscula) y el **tamaño** de un fichero en **bytes** (**MB**, B mayúscula). 1 byte = 8 bits:
- 100 Mbps ÷ 8 = **12,5 MB/s**.
- Para saber cuánto tarda una copia: pasa todo a la misma unidad y divide tamaño entre velocidad.

## RAID
| Nivel | Cómo funciona | Capacidad útil (n discos de S) | Fallos que aguanta | Mínimo de discos |
|---|---|---|---|---|
| RAID 0 | Reparte (*striping*), sin copia | n × S | **0** | 2 |
| RAID 1 | Espejo | S | n − 1 | 2 |
| RAID 5 | Paridad repartida | (n − 1) × S | **1** | 3 |
| RAID 6 | Doble paridad | (n − 2) × S | **2** | 4 |
| RAID 10 | Espejos repartidos | n × S ÷ 2 | 1 garantizado | 4 |

Ejemplo del examen de 2019: 5 discos de 6 TB en RAID 6 → (5 − 2) × 6 = **18 TB**.`,
  objectives: [
    drillGoal('unidades', 3, 'Convierte 3 veces entre unidades'),
    drillGoal('velocidad', 3, 'Resuelve 3 cálculos de velocidad'),
    drillGoal('raid', 4, 'Calcula 4 RAID: capacidad y fallos que aguanta'),
  ],
  hints: [
    'Con «i» (KiB, MiB…) se multiplica por 1024; sin «i», por 1000.',
    'De Mbps a MB/s se divide entre 8.',
    'RAID 5 pierde un disco de capacidad y RAID 6, dos.',
    'RAID 10: la mitad de la capacidad; en el peor caso solo aguanta 1 fallo.',
  ],
  curiosity: 'RAID no es una copia de seguridad: si borras un fichero por error o te cifra un ransomware, el RAID replica el desastre en todos los discos al instante.',
};

export const lxCronCalc = {
  id: 'lx-cron-calc',
  type: 'drill',
  title: 'Practica: leer y escribir crontab',
  summary: 'Líneas de crontab generadas al azar, para leerlas y escribirlas sin dudar.',
  exam: ['tai2025A-P61'],
  body: `Una línea de crontab tiene **5 campos de tiempo** y después la orden:

\`\`\`
┌──────── minuto        (0-59)
│ ┌────── hora          (0-23)
│ │ ┌──── día del mes   (1-31)
│ │ │ ┌── mes           (1-12)
│ │ │ │ ┌ día de semana (0-7, 0 y 7 = domingo)
30 2 * * 1-5  /usr/local/bin/copia.sh
\`\`\`

## Lo que hay que reconocer
- \`*\` → cualquiera.
- \`*/15\` → **cada** 15 (en el campo de minutos: cada 15 minutos).
- \`1-5\` → rango: de lunes a viernes.
- \`0,6\` → lista: sábado y domingo.

## Las trampas
- El primer campo son los **minutos**: \`0 5\` son las **05:00**, no las 00:05.
- El tercer campo es el **día del mes** y el quinto el **día de la semana**: \`0 3 1 * *\` es el día 1 de cada mes; \`0 3 * * 1\`, cada lunes.
- \`15 * * * *\` no es «cada 15 minutos»: es una vez por hora, en el minuto 15.

En el ejercicio de escribir basta con los 5 campos; si añades la orden detrás, se ignora.`,
  objectives: [drillGoal('cron-leer', 4, 'Interpreta 4 líneas de crontab'), drillGoal('cron-escribir', 4, 'Escribe 4 programaciones')],
  hints: ['Orden: minuto, hora, día del mes, mes, día de la semana.', '«Cada N» se escribe */N.', 'De lunes a viernes: 1-5 en el quinto campo.'],
  curiosity: 'Muchas versiones de cron admiten atajos como @daily, @weekly o @reboot (al arrancar), pero en el examen se pregunta por los cinco campos.',
};

export const rdPuertosIpv6 = {
  id: 'rd-puertos-ipv6',
  type: 'drill',
  title: 'Practica: puertos e IPv6',
  summary: 'Los puertos que caen en el examen y cómo abreviar y expandir direcciones IPv6.',
  exam: ['tai2025X-P75', 'tai2025X-S2R4', 'tai2024A-S2-11', 'tai2019-S2-19', 'tai2019-P72', 'tai2022-P73', 'tai2025X-S2-18', 'tai2025A-P74'],
  body: `## Puertos que hay que saberse
| Puerto | Servicio |
|---|---|
| 20 / 21 | FTP (datos / control) |
| 22 | SSH, SFTP, SCP |
| 23 | Telnet |
| 25 / 587 | SMTP (servidores / clientes) |
| 53 | DNS |
| 67 / 68 | DHCP (servidor / cliente) |
| 69 | TFTP |
| 80 | HTTP |
| 88 | Kerberos |
| 110 / 143 | POP3 / IMAP |
| 123 | NTP |
| 161 / 162 | SNMP / traps |
| 389 / 636 | LDAP / LDAPS |
| 443 | HTTPS |
| 445 | SMB |
| 514 | Syslog |
| 993 / 995 | IMAPS / POP3S |
| 1433 | SQL Server |
| 1521 | Oracle |
| 3306 | MySQL / MariaDB |
| 3389 | RDP |
| 5432 | PostgreSQL |
| 8080 | HTTP alternativo |

## IPv6
Una dirección IPv6 tiene **128 bits**, escritos como **8 grupos de 4 cifras hexadecimales** separados por dos puntos. Para abreviarla:
1. En cada grupo se quitan los **ceros a la izquierda**: \`0db8\` → \`db8\`, \`0000\` → \`0\`.
2. **Una sola vez**, la racha más larga de grupos a cero se sustituye por **::**. Dos veces no se puede: no se sabría cuántos ceros van en cada hueco.

\`2001:0db8:0000:0000:0000:0000:0000:0001\` → **2001:db8::1**.

Para expandirla se hace al revés: se rellenan los grupos hasta 4 cifras y \`::\` vale los grupos que falten hasta llegar a 8.

## Prefijos que preguntan
- **::1** → *loopback* (el 127.0.0.1 de IPv6).
- **fe80::/10** → enlace local: cada interfaz tiene una, no sale del segmento.
- **fc00::/7** (en la práctica, fd00::/8) → privadas (ULA).
- **2000::/3** → unicast global (las públicas).
- **ff00::/8** → **multicast**. IPv6 no tiene broadcast.
- **2001:db8::/32** → reservada para documentación y ejemplos.`,
  objectives: [
    drillGoal('puerto-servicio', 5, 'Reconoce 5 servicios por su puerto'),
    drillGoal('servicio-puerto', 5, 'Escribe el puerto de 5 servicios'),
    drillGoal('ipv6-abreviar', 3, 'Abrevia 3 direcciones IPv6'),
    drillGoal('ipv6-expandir', 3, 'Expande 3 direcciones IPv6'),
  ],
  hints: [
    'Versiones cifradas: HTTPS 443, LDAPS 636, IMAPS 993, POP3S 995.',
    'Bases de datos: SQL Server 1433, Oracle 1521, MySQL 3306, PostgreSQL 5432.',
    'IPv6: primero quita los ceros a la izquierda de cada grupo y después usa :: una sola vez.',
    ':: vale tantos grupos 0000 como falten hasta llegar a 8.',
  ],
  curiosity: 'Los puertos del 0 al 1023 son los «bien conocidos»: en Linux, solo root puede abrir un servicio en ellos. Por eso las aplicaciones de pruebas suelen usar el 8080 en vez del 80.',
};
