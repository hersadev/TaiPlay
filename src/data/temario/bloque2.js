// Bloque II · Tecnología básica. Fichas de repaso propias (ver bloque1.js).

export const bloque2 = [
  {
    id: 'B2T01',
    short: 'Informática básica y arquitectura',
    title:
      'Informática básica. Representación y comunicación de la información: elementos constitutivos de un sistema de información. Características y funciones. Arquitectura de ordenadores. Componentes internos de los equipos microinformáticos.',
    lessons: ['f-ordenador', 'f-numeracion'],
    body: `## Datos, información y sistemas de información
- Un **dato** es un hecho sin interpretar; la **información** es el dato procesado con significado.
- Un **sistema de información** recoge, almacena, procesa y distribuye información. Sus elementos son las personas, los procedimientos, los datos y los recursos técnicos (hardware y software). El **sistema informático** es solo la parte técnica.

## Arquitectura de Von Neumann
- Programa y datos comparten la **misma memoria**. Componentes: **CPU** (unidad de control + **ALU** + registros), memoria, entrada/salida y **buses** (de datos, de direcciones y de control). La arquitectura **Harvard** separa la memoria de instrucciones de la de datos.
- **Ciclo de instrucción**: fase de **búsqueda** (captación: el contador de programa apunta a la instrucción, que pasa al registro de instrucción) y fase de **ejecución**.
- Registros importantes: **PC** (contador de programa), **IR** (registro de instrucción), **MAR**/**MDR** (dirección y dato de memoria) y el acumulador.

## Taxonomía de Flynn (arquitecturas paralelas)
Clasifica según los flujos de **instrucciones** y de **datos**: **SISD** (el clásico), **SIMD** (vectoriales, GPU), **MISD** (teórico) y **MIMD** (multinúcleo, clústeres).

## Memoria
- **Jerarquía**, de rápida y pequeña a lenta y grande: registros → caché **L1 → L2 → L3** → RAM → disco.
- **RAM** volátil (DRAM para la memoria principal, SRAM para la caché) y **ROM** no volátil (PROM, EPROM, **EEPROM/flash**).
- Principio de **localidad** (temporal y espacial): es lo que hace útil la caché.

## Representación de la información
- Sistemas de numeración: binario, octal y **hexadecimal** (0-9 y A-F).
- Códigos de caracteres: **ASCII** (7 bits), ASCII extendido (8), **Unicode/UTF-8** (de 1 a 4 bytes).
- Enteros con **complemento a 2**; reales con **coma flotante IEEE 754** (simple de 32 bits y doble de 64).
- Unidades: bit, byte (8 bits), KB, MB, GB, TB… (o KiB, MiB y GiB si son potencias de 2).`,
    quiz: [
      {
        q: 'En la arquitectura Von Neumann, programa y datos…',
        options: ['están en memorias separadas', 'comparten la misma memoria', 'están en la ALU', 'solo están en la caché'],
        answer: 1,
        why: 'Separarlos es la arquitectura Harvard.',
      },
      {
        q: 'Una GPU que aplica la misma instrucción a muchos datos es…',
        options: ['SISD', 'SIMD', 'MISD', 'MIMD'],
        answer: 1,
        why: 'Single Instruction, Multiple Data.',
      },
      {
        q: '¿Qué registro guarda la dirección de la siguiente instrucción?',
        options: ['IR', 'PC', 'MDR', 'Acumulador'],
        answer: 1,
        why: 'El contador de programa (Program Counter).',
      },
    ],
  },
  {
    id: 'B2T02',
    short: 'Periféricos e impresión, almacenamiento y vídeo',
    title:
      'Periféricos: conectividad y administración. Elementos de impresión. Elementos de almacenamiento. Elementos de visualización y digitalización.',
    lessons: ['f-ordenador'],
    body: `## Periféricos y conectividad
- Periféricos de **entrada** (teclado, ratón, escáner), de **salida** (monitor, impresora) y de **entrada/salida** (disco, pantalla táctil).
- El **controlador** de un periférico es su componente **electrónico**, que se conecta al sistema; el resto del dispositivo es la parte mecánica.
- Interfaces: **USB** (USB 2.0 a 480 Mbps, USB 3.x de 5 a 20 Gbps, **USB4** y **Thunderbolt** hasta 40-80 Gbps, conector **USB-C**), SATA, **PCIe**, FireWire (antiguo), Bluetooth y NFC.
- Vídeo: VGA (analógico), DVI, **HDMI** (HDMI 2.0 llega a 18 Gbps y **HDMI 2.1 a 48 Gbps**) y **DisplayPort**.

## Impresión
- **Impacto**: matricial (de agujas), la que sirve para hacer copias en papel autocopiativo. **Sin impacto**: inyección de tinta, **láser** (tóner y tambor), térmica y sublimación. **Plóteres** para grandes formatos.
- Características: ppp (resolución), ppm (velocidad) y lenguajes PCL y PostScript.
- **IPP** (Internet Printing Protocol): conjunto de estándares abiertos que define la **impresión en red** de alto nivel (sobre HTTP).

## Almacenamiento
- **HDD**: magnético, con platos giratorios y cabezales. **SSD**: memoria flash, **sin partes móviles**. Las interfaces del SSD son SATA o **NVMe** sobre PCIe, y el formato **M.2** es muy habitual.
- Ópticos: CD (unos 700 MB), DVD (4,7 GB por capa) y Blu-ray (25 GB por capa).
- Cintas (**LTO**): son baratas y se usan para backup y archivo a largo plazo.

## Visualización y digitalización
- Paneles LCD: **TN** (rápido y barato), **IPS** (mejores colores y ángulos de visión) y **VA** (buen contraste). También **OLED**, en el que cada píxel emite su propia luz.
- Resoluciones: HD 1280×720, Full HD 1920×1080, **WQHD/QHD 2560×1440**, 4K UHD 3840×2160 y 8K 7680×4320.
- Digitalización: el escáner (resolución óptica en ppp) y el **OCR**, que convierte la imagen en texto.`,
    quiz: [
      {
        q: 'Resolución WQHD:',
        options: ['1920×1080', '2560×1440', '3840×2160', '1280×720'],
        answer: 1,
        why: 'WQHD/QHD es 2560×1440. 1920×1080 es Full HD.',
      },
      {
        q: '¿Qué tipo de panel LCD destaca por sus colores y ángulos de visión?',
        options: ['TN', 'IPS', 'CRT', 'Plasma'],
        answer: 1,
        why: 'IPS (In-Plane Switching).',
      },
      {
        q: 'Ancho de banda máximo de HDMI 2.1:',
        options: ['10 Gbps', '18 Gbps', '48 Gbps', '80 Gbps'],
        answer: 2,
        why: 'HDMI 2.1: 48 Gbps.',
      },
    ],
  },
  {
    id: 'B2T03',
    short: 'Estructuras de datos, ficheros y algoritmos',
    title: 'Tipos abstractos y estructuras de datos. Organizaciones de ficheros. Algoritmos. Formatos de información y ficheros.',
    lessons: ['f-numeracion', 'f-programar'],
    body: `## Tipos abstractos de datos (TAD)
Un TAD define **qué operaciones** ofrece un tipo con independencia de **cómo** se implementa. En Java, el TAD suele ser una *interface* y la estructura, la *class* que la implementa.

## Estructuras
- **Estáticas**: arrays y registros, de tamaño fijo. **Dinámicas**: listas enlazadas (simples, dobles y circulares), pilas, colas, árboles y grafos.
- **Pila**: **LIFO**, el último en entrar es el primero en salir (push y pop). **Cola**: **FIFO**. La **bicola** (*deque*) permite insertar y sacar por ambos extremos.
- **Árboles**: binario de búsqueda (izquierda < nodo < derecha), **AVL** (equilibrado por alturas), **rojo-negro** (la raíz es negra, un nodo rojo tiene hijos negros y todo camino a las hojas tiene el mismo número de nodos **negros**), **2-3-4** y **B/B+** (nodos de 2, 3 o 4 hijos y hojas al mismo nivel; los B+ son la base de los índices de las bases de datos).
- Recorridos: preorden, inorden y postorden, en profundidad (DFS) o en anchura (BFS).

## Algoritmos
- La complejidad se expresa en notación **O grande**: O(1), O(log n) (búsqueda binaria), O(n), O(n log n) y O(n²).
- Ordenación: burbuja, selección e inserción son O(n²); **mergesort** y **heapsort** son O(n log n); **quicksort** es O(n log n) de media y O(n²) en el peor caso; **radix** y **counting** sort son **lineales**.
- Técnicas: **divide y vencerás** (partir el problema y combinar las soluciones), **voraz** o *greedy* (la mejor opción en cada momento, que no siempre lleva al óptimo), **programación dinámica** y **backtracking** (vuelta atrás).

## Organización de ficheros
**Secuencial**, **directa** o aleatoria (*hash*), **indexada** y **secuencial indexada**.

## Formatos
- Imagen: JPEG (con pérdida), PNG (sin pérdida y con transparencia), GIF, SVG (vectorial) y WebP.
- Audio: MP3, AAC, FLAC (sin pérdida) y WAV. Vídeo: MP4 (H.264/H.265), WebM y MKV.
- Documentos: **ODF** (formato abierto e ISO), OOXML (docx), **PDF/A** (para archivo).
- Datos: **CSV** (RFC 4180: registros separados por CRLF y, entre comillas dobles, los campos que llevan comas, comillas o saltos de línea; MIME text/csv), **JSON** (RFC 8259: object, array, number, string, true, false y null), XML y YAML.
- Compresión: ZIP, 7z, RAR, gzip y tar (tar agrupa ficheros pero no comprime).`,
    quiz: [
      {
        q: '¿Qué estructura es LIFO?',
        options: ['Cola', 'Pila', 'Lista doble', 'Árbol'],
        answer: 1,
        why: 'Pila: el último en entrar es el primero en salir.',
      },
      {
        q: '¿Qué algoritmo ordena en tiempo lineal?',
        options: ['Quicksort', 'Mergesort', 'Radix sort', 'Burbuja'],
        answer: 2,
        why: 'Radix sort es O(n·k).',
      },
      {
        q: '¿Cuál NO es un valor JSON válido?',
        options: ['null', 'true', 'undefined', '[1,2]'],
        answer: 2,
        why: 'undefined no existe en JSON (RFC 8259).',
      },
    ],
  },
  {
    id: 'B2T04',
    short: 'Sistemas operativos: Windows, Linux y móviles',
    title:
      'Sistemas operativos. Características y elementos constitutivos. Sistemas Windows. Sistemas Unix y Linux. Sistemas operativos para dispositivos móviles.',
    lessons: ['f-so', 'lx-terminal', 'lx-permisos'],
    body: `## Conceptos
- El **kernel** gestiona procesos, memoria, dispositivos y el sistema de ficheros. Hay núcleos **monolíticos** (Linux), **micronúcleos** (Minix, QNX) e **híbridos** (Windows NT, el XNU de macOS).
- **Proceso**: un programa en ejecución, con estados nuevo, listo, ejecución, bloqueado y terminado. **Hilo**: una unidad de ejecución dentro de un proceso que comparte su memoria.
- Planificación de la CPU: FCFS, SJF, **Round Robin** (por turnos) y por prioridades.
- **Memoria virtual**: **paginación** (bloques de tamaño fijo), **segmentación** (de tamaño variable) e intercambio (*swap*).
- **Interbloqueo** (*deadlock*): requiere exclusión mutua, retención y espera, no expropiación y espera circular.

## Windows
- Núcleo **NT** híbrido. El sistema de ficheros es **NTFS** (también **ReFS** en servidores); el **Registro** guarda la configuración.
- Herramientas: \`sfc /scannow\` (repara archivos protegidos), \`chkdsk\`, \`DISM\`, el Administrador de tareas y PowerShell.

## Unix y Linux
- Filosofía Unix: **todo es un fichero**, herramientas pequeñas que se combinan con tuberías.
- Linux es **solo el kernel**, creado por Linus Torvalds en 1991; las **distribuciones** (RHEL, Debian, Ubuntu…) añaden el resto.
- Sistema de ficheros jerárquico desde \`/\`: \`/etc\` (configuración), \`/home\`, \`/var/log\` (registros), \`/bin\` y \`/usr\`, \`/tmp\`, \`/dev\` (dispositivos), \`/proc\`. Sistemas de ficheros: **ext4**, **XFS** (el de RHEL), Btrfs.
- La **shell** (bash) interpreta órdenes; los permisos son **rwx** para el dueño, el grupo y los otros, y **root** es el administrador.

## Móviles
- **Android**: basado en el **kernel de Linux**. Las apps se escriben en Java o Kotlin, y con el **NDK** se pueden usar partes en C/C++.
- **iOS**: núcleo **XNU** (de origen Mach/BSD). Las apps se escriben en **Swift** y SwiftUI, con **Xcode**.
- Ambos aíslan cada aplicación con **sandboxing**, que solo le permite acceder a sus propios datos. El *jailbreak* (iOS) y el *root* (Android) rompen ese aislamiento; el *sideloading* es instalar apps desde fuera de la tienda oficial.

## Ficheros entre sistemas
**exFAT** se usa de forma nativa en Windows y en macOS y no tiene el límite de 4 GB por fichero de FAT32. APFS es el formato de Mac.`,
    quiz: [
      {
        q: '¿Qué tipo de núcleo tiene Linux?',
        options: ['Micronúcleo', 'Monolítico', 'Exonúcleo', 'Híbrido'],
        answer: 1,
        why: 'Linux es monolítico (con módulos cargables).',
      },
      {
        q: 'Round Robin es un algoritmo de…',
        options: ['ordenación', 'planificación de la CPU por turnos', 'cifrado', 'paginación'],
        answer: 1,
        why: 'Reparte la CPU en rodajas de tiempo (quantum).',
      },
      {
        q: '¿En qué kernel se basa Android?',
        options: ['XNU', 'Windows NT', 'Linux', 'Minix'],
        answer: 2,
        why: 'Android usa el kernel de Linux.',
      },
    ],
  },
  {
    id: 'B2T05',
    short: 'Sistemas gestores de bases de datos',
    title: 'Sistemas de gestión de bases de datos relacionales, orientados a objetos y NoSQL: características y componentes.',
    lessons: [],
    body: `## SGBD
- Niveles de abstracción (arquitectura **ANSI/SPARC**): **externo** (las vistas de los usuarios), **conceptual** (el esquema lógico) e **interno** (el almacenamiento físico). Esta separación da independencia lógica y física de los datos.
- Lenguajes: **DDL** (definición: CREATE, ALTER, DROP, TRUNCATE), **DML** (manipulación: SELECT, INSERT, UPDATE, DELETE), **DCL** (control: GRANT, REVOKE, DENY) y **TCL** (transacciones: COMMIT, ROLLBACK, SAVEPOINT).
- **Transacciones ACID**: atomicidad, consistencia, aislamiento y durabilidad.

## Niveles de aislamiento (de menos a más)
| Nivel | Lectura sucia | No repetible | Fantasma |
|---|---|---|---|
| READ UNCOMMITTED | sí | sí | sí |
| READ COMMITTED | no | sí | sí |
| **REPEATABLE READ** | no | no | **sí** |
| SERIALIZABLE | no | no | no |

## Modelo relacional
- Relación = tabla; tupla = fila; atributo = columna. **Grado** = número de columnas y **cardinalidad** = número de filas.
- Claves: **candidata**, **primaria**, alternativa y **foránea** (referencia la clave primaria de otra tabla). Restricciones: NOT NULL, UNIQUE, CHECK e integridad referencial.
- Las **12 reglas de Codd** (en realidad 13, de la 0 a la 12) definen lo que es un SGBD verdaderamente relacional.
- Ejemplos: Oracle, SQL Server, MySQL/MariaDB y PostgreSQL.

## Orientados a objetos
- Objetos con un **OID**, un identificador único que **genera el sistema**, que es inmutable, no depende de los atributos y no es visible para el usuario.
- Constructores de colección: **set**, **bag**, **list** y **array**. Lenguajes del estándar ODMG: ODL (definición) y **OQL** (consulta).
- Ejemplos: **Matisse**, db4o, ObjectDB y Versant.

## NoSQL
- **Clave-valor** (Redis, DynamoDB), **documentales** (MongoDB, CouchDB), **columnares** (Cassandra, HBase) y de **grafos** (**Neo4j**, cuyo lenguaje es **Cypher**).
- **Teorema CAP**: de consistencia, disponibilidad y tolerancia a particiones, solo se pueden garantizar dos. Suelen ofrecer el modelo **BASE**, de consistencia eventual, frente a ACID.`,
    quiz: [
      {
        q: '¿Qué nivel de aislamiento evita las lecturas sucias y no repetibles pero permite las fantasma?',
        options: ['READ COMMITTED', 'REPEATABLE READ', 'SERIALIZABLE', 'READ UNCOMMITTED'],
        answer: 1,
        why: 'Ver la tabla: REPEATABLE READ.',
      },
      {
        q: 'GRANT y REVOKE pertenecen al…',
        options: ['DDL', 'DML', 'DCL', 'TCL'],
        answer: 2,
        why: 'Data Control Language.',
      },
      {
        q: 'Cypher es el lenguaje de…',
        options: ['MongoDB', 'Cassandra', 'Neo4j', 'Redis'],
        answer: 2,
        why: 'Neo4j, una base de datos de grafos.',
      },
    ],
  },
];
