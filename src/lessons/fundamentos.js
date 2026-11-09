// Ruta «Empieza desde cero»: lecciones de lectura con un test corto al final.
// Pensadas para alguien que nunca ha estudiado informática: cada una explica
// un bloque de conceptos que luego aparecen una y otra vez en el examen.
//
// body se pinta con <RichText>: párrafos separados por línea en blanco,
// «## » para subtítulos, «- » para listas, `código` y **negrita**.
// exam: ids de preguntas reales relacionadas (se enlazan al final).

export const fundamentos = [
  {
    id: 'f-ordenador',
    type: 'concept',
    title: '¿Qué hay dentro de un ordenador?',
    summary: 'Hardware y software, CPU, memoria, disco y cómo se comunican.',
    body: `Un ordenador hace siempre lo mismo: **recibe datos, los procesa y devuelve un resultado**. Todo lo físico que puedes tocar es el **hardware**; los programas que le dicen qué hacer son el **software**.

## Las piezas principales
- **CPU (procesador)**: el «cerebro». Ejecuta las instrucciones de los programas, una detrás de otra, miles de millones por segundo. Los procesadores actuales tienen varios **núcleos** (cores), y cada núcleo es capaz de ejecutar instrucciones por su cuenta.
- **Memoria RAM**: la mesa de trabajo. Es muy rápida pero **volátil**: al apagar, se borra. Ahí se cargan los programas que estás usando.
- **Almacenamiento (disco)**: el armario. Guarda los datos aunque se apague el equipo (**no volátil**). Puede ser un **HDD** (disco duro magnético, con platos que giran y un cabezal mecánico) o un **SSD** (memoria flash, sin partes móviles y mucho más rápido). Un formato muy común de SSD es **M.2**, una tarjetita que se pincha directamente en la placa.
- **Placa base**: la pieza donde se conecta todo lo demás.
- **Periféricos**: lo que se conecta por fuera: teclado y ratón (entrada), monitor e impresora (salida), disco externo (entrada/salida).

## La memoria caché
La RAM es rápida, pero para la CPU sigue siendo lenta. Por eso el procesador lleva dentro unas memorias diminutas y rapidísimas llamadas **caché**, organizadas por niveles: **L1** (dentro de cada núcleo, la más rápida y la más pequeña), **L2** (más grande) y **L3** (compartida entre núcleos, más grande y más lenta). Regla: cuanto más cerca de la CPU, más rápida y más pequeña.

## El bus
Las piezas se comunican por el **bus del sistema**, un conjunto de «carreteras» que transporta **datos**, **direcciones** (dónde leer o escribir) y **señales de control** (qué hacer) entre la CPU, la memoria y los periféricos.

## Varios discos a la vez: RAID
Un **RAID** combina varios discos para ganar velocidad, seguridad o ambas. Los que más se preguntan:
- **RAID 0**: reparte los datos entre discos. Es rápido, pero si falla uno se pierde todo.
- **RAID 1**: espejo; cada dato está en dos discos.
- **RAID 5**: reparte datos y **paridad** (información para reconstruir). Aguanta **el fallo de 1 disco**.
- **RAID 6**: como el 5, pero con doble paridad. Aguanta **2 fallos**.`,
    quiz: [
      {
        q: 'Apagas el ordenador de golpe. ¿Qué pierdes?',
        options: ['Lo guardado en el SSD', 'Lo que estaba solo en la RAM', 'El sistema operativo', 'Los datos del disco duro'],
        answer: 1,
        why: 'La RAM es volátil: sin corriente se borra. Los discos (HDD o SSD) son no volátiles.',
      },
      {
        q: '¿Qué nivel de caché es el más rápido y el más pequeño?',
        options: ['L3', 'L2', 'L1', 'La RAM'],
        answer: 2,
        why: 'L1 está dentro de cada núcleo: es la más cercana a la CPU, la más rápida y la de menor capacidad.',
      },
      {
        q: 'Un SSD se diferencia de un HDD en que…',
        options: ['usa platos magnéticos que giran', 'no tiene partes móviles y usa memoria flash', 'es memoria volátil', 'necesita un cabezal de lectura'],
        answer: 1,
        why: 'El SSD guarda los datos en memoria flash no volátil y no tiene piezas mecánicas.',
      },
      {
        q: '¿Cuántos discos pueden fallar en un RAID 5 sin perder datos?',
        options: ['Ninguno', 'Uno', 'Dos', 'La mitad'],
        answer: 1,
        why: 'RAID 5 usa paridad distribuida y tolera el fallo de un único disco. RAID 6 tolera dos.',
      },
    ],
    exam: ['tai2025A-P23', 'tai2025A-P24', 'tai2025A-P25', 'tai2025A-P27', 'tai2024A-P21'],
  },
  {
    id: 'f-numeracion',
    type: 'concept',
    title: 'Bits, bytes y sistemas de numeración',
    summary: 'Binario, hexadecimal y unidades: la base de todo lo demás.',
    body: `Un ordenador solo entiende dos estados: hay corriente o no la hay. Eso es un **bit**, que vale **0** o **1**. Con 8 bits se forma un **byte**, que puede representar 2⁸ = **256** valores distintos (del 0 al 255).

## Binario (base 2)
Igual que en decimal cada posición vale 10 veces más que la anterior (unidades, decenas, centenas…), en binario cada posición vale **el doble**: 1, 2, 4, 8, 16, 32, 64, 128…

Ejemplo: \`1011\` en binario = 8 + 0 + 2 + 1 = **11** en decimal.

Truco para el examen: con **n** bits puedes contar **2ⁿ** valores. Esto es justo lo que se usa al calcular subredes IP: si te quedan 12 bits para equipos, tienes 2¹² = 4096 direcciones.

## Hexadecimal (base 16)
Usa 16 símbolos: **0-9** y **A-F** (A=10, B=11, C=12, D=13, E=14, F=15). Cada cifra hexadecimal equivale exactamente a 4 bits, así que es una forma compacta de escribir binario. Lo verás en direcciones MAC (\`3C:52:82:1A:FF:07\`), colores web (\`#FF8800\`) o identificadores de Docker (\`3f7a9c…\`).

En el examen de 2024 preguntaron qué palabra era además un número hexadecimal válido: basta con comprobar que **todas las letras estén entre A y F**.

## Unidades
- 1 KB ≈ 1.000 bytes, 1 MB ≈ 1.000 KB, 1 GB ≈ 1.000 MB, 1 TB ≈ 1.000 GB.
- Ojo: la **velocidad** de una red se mide en **bits** por segundo (Mbps, Gbps), mientras que el **tamaño** de un fichero se mide en **bytes**. 1 byte = 8 bits.`,
    quiz: [
      {
        q: '¿Cuánto vale 1101 (binario) en decimal?',
        options: ['11', '13', '15', '1101'],
        answer: 1,
        why: '8 + 4 + 0 + 1 = 13.',
      },
      {
        q: '¿Cuál de estas palabras es un número hexadecimal válido?',
        options: ['CAFE', 'HOLA', 'CASA', 'GAFE'],
        answer: 0,
        why: 'Solo valen las letras A-F. C, A, F y E lo son; en las demás aparecen H, O, L, S o G.',
      },
      {
        q: 'Si una red deja 8 bits para identificar equipos, ¿cuántas combinaciones hay?',
        options: ['8', '64', '256', '255'],
        answer: 2,
        why: '2⁸ = 256. (En redes se restan 2: la dirección de red y la de broadcast, y quedan 254 equipos.)',
      },
      {
        q: 'Una conexión de 100 Mbps transmite como máximo…',
        options: ['100 megabytes por segundo', '100 megabits por segundo', '100 megas de fichero', '800 megabytes por segundo'],
        answer: 1,
        why: 'La b minúscula es de bits. 100 Mbps son unos 12,5 MB/s (se divide entre 8).',
      },
    ],
    exam: ['tai2024A-P20'],
  },
  {
    id: 'f-so',
    type: 'concept',
    title: 'El sistema operativo, archivos y carpetas',
    summary: 'Qué hace un sistema operativo, el kernel, procesos, hilos y rutas.',
    body: `El **sistema operativo** (SO) es el programa que hace de intermediario entre el hardware y el resto de programas. Ejemplos: **Windows**, **Linux** (Ubuntu, Red Hat…), **macOS**, **Android** o **iOS**.

## El kernel (núcleo)
Es la parte central del SO. Se encarga de:
- **Procesos**: decide qué programa usa la CPU en cada momento.
- **Memoria**: reparte la RAM entre los programas.
- **Dispositivos**: habla con discos, red, teclado… mediante **controladores** (drivers).

La interfaz gráfica, el navegador o los servicios de red son programas que funcionan **encima** del kernel. Dato de examen: **Android usa el kernel de Linux**.

## Procesos e hilos
Un **proceso** es un programa en ejecución. Dentro de un proceso puede haber varios **hilos** (threads): tareas que se ejecutan a la vez y comparten la memoria del proceso. Por ejemplo, un navegador descarga un fichero en un hilo mientras pinta la página en otro.

## Archivos, carpetas y rutas
Los datos se guardan en **ficheros** organizados en **directorios** (carpetas) con forma de árbol. La posición de un fichero se escribe con una **ruta**:
- En Linux todo cuelga de la **raíz** \`/\`, por ejemplo \`/home/ana/notas.txt\`. Las carpetas se separan con \`/\`.
- En Windows cada disco tiene su letra, por ejemplo \`C:\\Users\\Ana\\notas.txt\`, y se separa con \`\\\`.

Hay dos tipos de ruta:
- **Absoluta**: empieza desde la raíz (\`/etc/hosts\`). Funciona estés donde estés.
- **Relativa**: parte de donde estás ahora (\`documentos/carta.txt\`). \`.\` es la carpeta actual y \`..\` es la carpeta padre.

## Sistemas de ficheros
El **formato** con el que se organiza un disco: **NTFS** (Windows), **ext4** y **XFS** (Linux), **APFS** (Mac), y **FAT32** y **exFAT** (compatibles con casi todo). exFAT funciona de forma nativa en Windows y en macOS, y no tiene el límite de 4 GB por fichero de FAT32.

En la ruta de Linux aprenderás a moverte por este árbol con la terminal.`,
    quiz: [
      {
        q: '¿Qué parte del SO reparte la CPU y la memoria entre los programas?',
        options: ['La interfaz gráfica', 'El kernel', 'El navegador', 'La BIOS'],
        answer: 1,
        why: 'El kernel gestiona procesos, memoria y dispositivos.',
      },
      {
        q: 'Estás en /home/ana. ¿A qué carpeta lleva la ruta relativa ../luis?',
        options: ['/home/ana/luis', '/home/luis', '/luis', '/home/ana/../luis/ana'],
        answer: 1,
        why: '.. sube a /home y desde ahí se entra en luis: /home/luis.',
      },
      {
        q: '¿Qué permite que un proceso haga varias tareas a la vez compartiendo memoria?',
        options: ['La paginación', 'Los hilos', 'La segmentación', 'El RAID'],
        answer: 1,
        why: 'Los hilos (threads) son flujos de ejecución dentro de un mismo proceso.',
      },
      {
        q: '¿Qué formato de disco usan de forma nativa tanto Windows como macOS, sin el límite de 4 GB por fichero?',
        options: ['NTFS', 'APFS', 'exFAT', 'ext4'],
        answer: 2,
        why: 'exFAT funciona en ambos y admite ficheros grandes. Salió en el examen de 2025.',
      },
    ],
    exam: ['tai2024A-P26', 'tai2024A-P55', 'tai2025A-P31', 'tai2025A-P59'],
  },
  {
    id: 'f-redes',
    type: 'concept',
    title: 'Redes: IP, máscaras y el modelo OSI',
    summary: 'Cómo se comunican los equipos y cómo calcular subredes (cae siempre).',
    body: `Una **red** son equipos conectados que intercambian datos. Cada equipo tiene dos «direcciones»:
- **MAC** (física): viene grabada en la tarjeta de red, por ejemplo \`3C:52:82:1A:FF:07\`. Sirve dentro de la red local.
- **IP** (lógica): se asigna según la red en la que estés, por ejemplo \`192.168.1.20\`. Sirve para llegar de una red a otra.

**ARP** averigua la MAC a partir de una IP. **DHCP** reparte las IP automáticamente y **DNS** traduce nombres (\`www.boe.es\`) a IP.

## Dirección IP y máscara
Una IPv4 son 32 bits, escritos como 4 números de 0 a 255. La **máscara** dice qué parte de la dirección es la **red** y cuál identifica al **equipo**. Se escribe como \`255.255.255.0\` o, abreviado, \`/24\`: los primeros 24 bits son la red.

En cada red hay dos direcciones reservadas que no se pueden dar a un equipo:
- La **dirección de red**: todos los bits de equipo a 0.
- La de **broadcast**: todos los bits de equipo a 1.

**Fórmula clave**: si quedan **h** bits para equipos, hay **2ʰ − 2** equipos posibles.

## Ejemplos de examen
- **10.30.16.0/20** → quedan 32 − 20 = 12 bits → 2¹² − 2 = **4094 hosts**.
- **Primera subred /25 de 10.30.16.0**: un /25 tiene 2⁷ = 128 direcciones → va de **10.30.16.0** (red) a **10.30.16.127** (broadcast).
- **Partir 10.30.24.0/21 en 4**: hacen falta 2 bits más (2² = 4) → /23. Cada /23 ocupa 2 en el tercer octeto: .24, .26, **.28**, .30. La tercera subred es 10.30.28.0/23.
- **Crear 600 subredes en 10.0.0.0/8**: 2⁹ = 512 no llega y 2¹⁰ = 1024 sí → 8 + 10 = **/18**.

## El modelo OSI (7 capas)
De abajo a arriba: **1 Física**, **2 Enlace** (MAC, switches), **3 Red** (IP, routers), **4 Transporte** (TCP/UDP, puertos), **5 Sesión**, **6 Presentación** (cifrado, compresión, formato) y **7 Aplicación** (HTTP, DNS, SMTP…).

El modelo **TCP/IP** las agrupa en 4: acceso a red, Internet (IP, ICMP), transporte (TCP, UDP) y aplicación.

## Topologías
**Estrella**: todos conectados a un nodo central, que es lo habitual hoy. **Bus**: un cable común con terminadores en los extremos. **Anillo**, **malla** y **árbol** completan la lista.`,
    quiz: [
      {
        q: '¿Cuántos equipos caben en una red /24?',
        options: ['256', '254', '255', '24'],
        answer: 1,
        why: '32 − 24 = 8 bits → 2⁸ − 2 = 254.',
      },
      {
        q: '¿Qué protocolo obtiene la MAC a partir de la IP?',
        options: ['DNS', 'DHCP', 'ARP', 'NAT'],
        answer: 2,
        why: 'ARP (Address Resolution Protocol).',
      },
      {
        q: '¿Cuál es el broadcast de 192.168.1.0/26?',
        options: ['192.168.1.255', '192.168.1.63', '192.168.1.64', '192.168.1.127'],
        answer: 1,
        why: 'Un /26 tiene 2⁶ = 64 direcciones: de .0 a .63. La última es el broadcast.',
      },
      {
        q: '¿En qué capa OSI se cifran y comprimen los datos?',
        options: ['Sesión', 'Transporte', 'Presentación', 'Aplicación'],
        answer: 2,
        why: 'La capa 6, presentación, se ocupa del formato, el cifrado y la compresión.',
      },
    ],
    exam: ['tai2025A-S2-1', 'tai2025A-S2-2', 'tai2025A-S2-3', 'tai2025A-P73', 'tai2024A-S2-1', 'tai2024A-P74', 'tai2024A-P58', 'tai2025A-P71'],
  },
  {
    id: 'f-programar',
    type: 'concept',
    title: '¿Qué es programar?',
    summary: 'Variables, condiciones, bucles y lógica booleana, sin instalar nada.',
    body: `Programar es escribir **instrucciones precisas** para que el ordenador las ejecute en orden. Da igual el lenguaje (Java, C#, Python, JavaScript…): las ideas básicas son siempre las mismas.

## Variables
Una **variable** es una caja con nombre que guarda un valor: \`x = 5\`. Los **tipos** más comunes son los enteros (\`int\`), los decimales, el texto (\`string\`) y los booleanos (\`true\`/\`false\`).

## Operadores
- Aritméticos: \`+ - * /\` y \`%\` (**módulo**: el resto de la división; \`14 % 2 = 0\`, \`7 % 2 = 1\`).
- Comparación: \`==\` (igual), \`!=\` (distinto), \`>\`, \`>=\`, \`<\`, \`<=\`.
- Lógicos: **AND** (\`&&\`: las dos cosas verdaderas), **OR** (\`||\`: basta con una) y **NOT** (\`!\`: le da la vuelta).

## Condiciones
\`if (edad >= 18) { … } else { … }\`. Su forma corta es el **operador ternario**: \`condición ? siVerdadero : siFalso\`.

Ejemplo del examen de 2025: con a = 10, b = 4 y c = 4, \`(a + b) % 2 == 0 ? c + 4 : c - 2\` → 14 % 2 = 0, así que la condición es verdadera → c + 4 = **8**.

## Bucles
Repiten un bloque mientras se cumpla una condición: \`while (x < 100) { … }\`. Si dentro nada hace que la condición llegue a ser falsa, es un **bucle infinito**.

Ejemplo del examen de 2024: \`x=0; while x<100 do (x=x+1; print x; x=x-1;)\`. x sube a 1, se imprime y vuelve a 0, así que nunca llega a 100 y el bucle es infinito.

## Funciones
Una **función** agrupa instrucciones con nombre y puede recibir **parámetros** y devolver un resultado. Paso **por valor**: la función recibe una copia del dato. Paso **por referencia**: recibe el original y puede modificarlo (por eso sirve como parámetro de entrada/salida).

La ruta de programación (Java, C#, SQL…) llegará en una próxima entrega; mientras tanto, practica sus preguntas en el banco.`,
    quiz: [
      {
        q: '¿Cuánto vale 17 % 5?',
        options: ['3', '2', '3,4', '12'],
        answer: 1,
        why: '17 entre 5 da 3 y sobran 2: el módulo es el resto, 2.',
      },
      {
        q: 'Con a = 1 y c = 3, ¿qué devuelve NOT (a == c) AND (c > a)?',
        options: ['true', 'false', 'Error', 'null'],
        answer: 0,
        why: 'a == c es false, así que NOT da true; c > a es true. true AND true = true.',
      },
      {
        q: '¿Qué tipo de paso de parámetros permite que la función modifique la variable original?',
        options: ['Por valor', 'Por referencia', 'Por copia', 'Ninguno'],
        answer: 1,
        why: 'Por referencia la función trabaja sobre el dato original.',
      },
    ],
    exam: ['tai2024A-P34', 'tai2024A-P35', 'tai2024A-P36', 'tai2025A-P40'],
  },
];
