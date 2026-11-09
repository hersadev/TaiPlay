// Bloque III · Desarrollo de sistemas. Fichas de repaso propias (ver bloque1.js).

export const bloque3 = [
  {
    id: 'B3T01',
    short: 'Modelado de datos y normalización',
    title:
      'Modelado de datos, metodologías y reglas. Entidades, atributos y relaciones. Diseño de bases de datos. Diseño lógico y físico. El modelo lógico relacional. Normalización.',
    lessons: [],
    body: `## Fases del diseño
1. **Conceptual**: el modelo **Entidad/Relación** (Chen), independiente del SGBD.
2. **Lógico**: el paso al modelo **relacional** (tablas, claves), ya normalizado.
3. **Físico**: índices, particiones y almacenamiento para un SGBD concreto. Para reducir accesos se puede **desnormalizar** e introducir redundancia controlada.

## Modelo E/R
- **Entidad** (rectángulo), **relación** (rombo) y **atributo** (elipse). Tipos de atributo: identificador o clave (subrayado), compuesto, **multivaluado** (doble elipse) y **derivado** (elipse **discontinua**).
- **Cardinalidad**: la participación mínima y máxima de cada entidad en la relación, como (0,1), (1,N)… El **tipo de correspondencia** es el máximo de cada lado: 1:1, 1:N o N:M.
- **Entidad débil**: depende de otra para existir o para identificarse.
- **E/R extendido** (Métrica v3): **generalización/especialización** (*es-un*, con exclusividad y totalidad), agregación y **asociación** (dos entidades de dominios independientes que se relacionan de forma coyuntural).

## Del E/R a tablas
- 1:N: la clave del lado «1» pasa como **clave foránea** al lado «N».
- N:M: se crea una **tabla intermedia** con las dos claves.
- 1:1: la clave foránea va a cualquiera de los dos lados (normalmente al opcional).

## Normalización
- **1FN**: valores atómicos, sin grupos repetitivos.
- **2FN**: estar en 1FN y que todo atributo no clave tenga **dependencia funcional completa** de la clave, es decir, de toda la clave y no de una parte.
- **3FN**: estar en 2FN y sin **dependencias transitivas** (un no clave que dependa de otro no clave).
- **FNBC** (Boyce-Codd): todo determinante es clave candidata. 4FN elimina las dependencias multivaluadas y 5FN, las de reunión.
- Cada forma normal incluye las anteriores: lo que está en 3FN también está en 2FN y en 1FN.

## Modelado dimensional (Kimball)
- Tabla de **hechos** (las medidas) rodeada de **dimensiones**: el esquema en **estrella**. Si las dimensiones se normalizan, es un **copo de nieve**.
- Una dimensión **outrigger** es la que cuelga de **otra dimensión**, no directamente de la tabla de hechos.`,
    quiz: [
      {
        q: 'En E/R, la elipse discontinua representa un atributo…',
        options: ['clave', 'multivaluado', 'derivado', 'compuesto'],
        answer: 2,
        why: 'Discontinua = derivado (como la edad, que sale de la fecha de nacimiento).',
      },
      {
        q: 'Una relación N:M se transforma en el modelo relacional…',
        options: ['con una clave foránea en cualquiera de las dos tablas', 'en una tabla intermedia', 'fusionando las tablas', 'no se puede representar'],
        answer: 1,
        why: 'La tabla intermedia lleva las claves de ambas entidades.',
      },
      {
        q: 'La 3FN elimina las dependencias…',
        options: ['parciales', 'transitivas', 'multivaluadas', 'de reunión'],
        answer: 1,
        why: 'La 2FN quita las parciales y la 3FN las transitivas.',
      },
    ],
  },
  {
    id: 'B3T02',
    short: 'Lenguajes de programación',
    title:
      'Lenguajes de programación. Representación de tipos de datos. Operadores. Instrucciones condicionales. Bucles y recursividad. Procedimientos, funciones y parámetros. Vectores y registros. Estructura de un programa.',
    lessons: ['f-programar'],
    body: `## Clasificaciones
- **Compilados** (C, C++, Go) frente a **interpretados** (Python, JavaScript). **Java** y **C#** compilan a un código intermedio (bytecode o IL) que ejecuta una máquina virtual con **JIT**.
- Paradigmas: imperativo y estructurado, **orientado a objetos**, funcional, lógico (Prolog) y declarativo (SQL).
- Tipado: **estático** (Java, C#: el tipo se conoce al compilar) o **dinámico** (Python, JavaScript); **fuerte** o **débil**.

## Tipos y operadores
- Primitivos: entero, real, carácter y booleano. Compuestos: **vectores** (arrays, del mismo tipo) y **registros** (structs, de campos distintos).
- En Java, \`int\` es primitivo y **no tiene métodos** (\`idAlumno.equals(id)\` no compila); su clase envoltorio es \`Integer\`. En C#, \`int?\` es un entero **anulable**. Para fecha y hora a la vez, Java tiene \`LocalDateTime\`.
- Operadores: aritméticos (\`%\` es el módulo, el resto), relacionales y lógicos (AND, OR, NOT). Hay que vigilar la **precedencia**; el **ternario** es \`cond ? a : b\`.

## Control de flujo
- Condicionales: \`if/else\` y \`switch\`. Bucles: \`while\` (comprueba antes), \`do-while\` (se ejecuta al menos una vez) y \`for\`.
- **Recursividad**: una función que se llama a sí misma; necesita un **caso base** o se desborda la pila.

## Subprogramas y parámetros
- Un **procedimiento** no devuelve valor; una **función** sí, y por eso puede ir dentro de una expresión.
- Paso **por valor** (se copia) o **por referencia** (se pasa el original y sirve de entrada/salida).

## Asincronía
- C#: \`async Task\` o \`async Task<T>\`, junto con \`await\`. JavaScript: Promesas, \`async/await\` y \`fetch(url).then(r => r.json())\`.
- Python: \`import tensorflow as tf\` es el modo de importar una librería con un alias.`,
    quiz: [
      {
        q: '¿Qué bucle se ejecuta siempre al menos una vez?',
        options: ['while', 'for', 'do-while', 'foreach'],
        answer: 2,
        why: 'do-while comprueba la condición al final.',
      },
      {
        q: 'Con a = 7, ¿cuánto vale a % 3?',
        options: ['2', '1', '2,33', '0'],
        answer: 1,
        why: '7 = 3·2 + 1, así que el resto es 1.',
      },
      {
        q: 'En C#, ¿cómo se declara un entero que admita null?',
        options: ['int|null', 'int?', 'Nullable int', 'int??'],
        answer: 1,
        why: 'int? es Nullable<int>.',
      },
    ],
  },
  {
    id: 'B3T03',
    short: 'SQL, procedimientos y disparadores',
    title: 'Lenguajes de interrogación de bases de datos. Estándar ANSI SQL. Procedimientos almacenados. Eventos y disparadores.',
    lessons: [],
    body: `## Sentencias básicas
\`\`\`
CREATE TABLE Alumno (id INT PRIMARY KEY, dni VARCHAR(9) UNIQUE, nombre VARCHAR(100));
INSERT INTO Alumno (id, dni, nombre) VALUES (1, '00000000T', 'Ana');
UPDATE Alumno SET nombre = 'Ana María' WHERE id = 1;
DELETE FROM Alumno WHERE id = 1;
SELECT nombre FROM Alumno WHERE dni LIKE '0%' ORDER BY nombre;
\`\`\`
- Los textos van entre **comillas simples**.
- \`LIKE\` con comodines: **%** sustituye a cualquier cadena y **_** a un carácter (\`NOT LIKE '%.pdf'\`).
- \`DROP TABLE\` borra la tabla entera (estructura y datos); \`TRUNCATE\` vacía los datos (es DDL); \`DELETE\` borra filas y admite WHERE (es DML).

## Consultas
- **JOIN**: \`INNER JOIN\` devuelve solo las filas que casan en ambas tablas; \`LEFT JOIN\` devuelve todas las de la izquierda.
- **Agregados**: COUNT, SUM, AVG, MAX y MIN, con \`GROUP BY\`. Para filtrar los grupos se usa **HAVING** (WHERE filtra filas antes de agrupar).
- **Subconsultas**: \`WHERE id IN (SELECT …)\` o \`= (SELECT …)\` si devuelven un único valor.
- Orden lógico de ejecución: FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY.

## Restricciones e índices
PRIMARY KEY, **FOREIGN KEY … REFERENCES**, **UNIQUE** (que además crea un índice), NOT NULL, CHECK y DEFAULT. \`CREATE INDEX\` acelera las búsquedas, pero no impide duplicados.

## Transacciones y permisos
- \`COMMIT\` confirma, \`ROLLBACK\` deshace (hasta el inicio o hasta un \`SAVEPOINT\`).
- \`GRANT\`, \`REVOKE\` y \`DENY\` (T-SQL) controlan los permisos: son DCL.
- En Oracle: \`CREATE USER nombre IDENTIFIED BY clave;\`. En MySQL, los usuarios están en \`mysql.user\` (\`SELECT user, host FROM mysql.user\`).

## Procedimientos almacenados y disparadores
- **Procedimiento almacenado**: código guardado en el SGBD que se invoca con \`CALL\` o \`EXEC\`.
- **Disparador (trigger)**: se ejecuta solo ante un evento (**INSERT, UPDATE o DELETE**) sobre una tabla, **BEFORE** o **AFTER**. Sintaxis ANSI: \`CREATE TRIGGER nombre BEFORE UPDATE ON tabla …\`. Si el trigger falla, se cancela la operación que lo disparó.`,
    quiz: [
      {
        q: '¿Qué cláusula filtra después de agrupar?',
        options: ['WHERE', 'HAVING', 'ORDER BY', 'LIMIT'],
        answer: 1,
        why: 'HAVING filtra grupos; WHERE filtra filas.',
      },
      {
        q: '¿Qué patrón LIKE encuentra los ficheros que terminan en .pdf?',
        options: ["'pdf'", "'%.pdf'", "'*.pdf'", "'_.pdf'"],
        answer: 1,
        why: '% equivale a cualquier cadena; * no es un comodín de SQL.',
      },
      {
        q: 'TRUNCATE es un comando…',
        options: ['DML', 'DDL', 'DCL', 'TCL'],
        answer: 1,
        why: 'Es DDL: vacía la tabla sin registrar fila a fila.',
      },
    ],
  },
  {
    id: 'B3T04',
    short: 'Orientación a objetos, UML y patrones',
    title:
      'Diseño y programación orientada a objetos. Elementos y componentes software: objetos, clases, herencia, métodos, sobrecarga. Ventajas e inconvenientes. Patrones de diseño y lenguaje de modelado unificado (UML).',
    lessons: [],
    body: `## Conceptos
- **Clase** (la plantilla) y **objeto** (una instancia). Principios: **encapsulación**, **abstracción**, **herencia** y **polimorfismo**.
- **Sobrecarga** (*overloading*): mismo nombre de método con **distintos parámetros**. **Sobrescritura** (*overriding*): la subclase **redefine** un método con la **misma firma**.
- Relaciones entre clases: **asociación**, **agregación** (todo-parte débil, rombo vacío), **composición** (todo-parte fuerte, rombo relleno), **generalización** o herencia (flecha con triángulo hueco y línea continua) y **realización** (de una interfaz, con línea discontinua).

## UML
- Lenguaje **gráfico** para especificar, visualizar, construir y documentar software. Es independiente de la metodología y del lenguaje de programación, y modela tanto la parte **estática** como la **dinámica**.
- **Estructurales**: clases, objetos, componentes, despliegue y **paquetes**.
- **De comportamiento**: casos de uso, **actividad**, estados y los de interacción (**secuencia**, que muestra el orden de los mensajes, y comunicación).

## Patrones de diseño (GoF)
- **Creacionales**: Singleton (una sola instancia), Factory Method, Abstract Factory, Builder y Prototype.
- **Estructurales**: Adapter, **Composite** (objetos en árbol tratados de forma uniforme), **Decorator** (añade responsabilidades de forma dinámica), Facade y Proxy.
- **De comportamiento**: **Observer** (notifica cambios a los suscriptores con bajo acoplamiento), Strategy, Command, Iterator, State y Template Method.
- Arquitectónico: **MVC** (modelo-vista-controlador).`,
    quiz: [
      {
        q: 'Redefinir en la subclase un método con la misma firma es…',
        options: ['sobrecarga', 'sobrescritura', 'encapsulación', 'agregación'],
        answer: 1,
        why: 'Overriding.',
      },
      {
        q: '¿Qué patrón añade responsabilidades a un objeto de forma dinámica?',
        options: ['Composite', 'Decorator', 'Singleton', 'Observer'],
        answer: 1,
        why: 'Decorator envuelve el objeto y le añade comportamiento.',
      },
      {
        q: '¿Qué diagrama UML muestra el orden de los mensajes entre objetos?',
        options: ['Clases', 'Paquetes', 'Secuencia', 'Despliegue'],
        answer: 2,
        why: 'Es un diagrama de interacción.',
      },
    ],
  },
  {
    id: 'B3T05',
    short: 'Jakarta EE y .NET',
    title: 'Arquitectura Java EE/Jakarta EE y plataforma .NET: componentes, persistencia y seguridad. Características, elementos, lenguajes y funciones en ambos entornos.',
    lessons: [],
    body: `## Java / Jakarta EE
- **JVM** (máquina virtual que ejecuta el **bytecode**), **JIT** (que lo compila a código máquina en tiempo de ejecución) y el recolector de basura. JDK (para desarrollar) frente a JRE (para ejecutar).
- Componentes web: **Servlets**, JSP, JSF. Lógica: **EJB** y CDI. Servicios web: **JAX-RS** (REST) y **JAX-WS** (SOAP). **JAXB** mapea XML a clases Java.
- **Persistencia: JPA** (Jakarta Persistence). Una **entidad** es una clase que representa una tabla y cada instancia es una fila. Necesita un **proveedor** (**Hibernate**, EclipseLink), su lenguaje de consultas es **JPQL** y admite relaciones @OneToMany, @ManyToOne…
- Servidores: **Tomcat** (contenedor de servlets), WildFly, GlassFish y Payara. **Spring Boot**: \`@RestController\` y \`@GetMapping("/ruta")\`; se arranca con \`mvn spring-boot:run\`.
- Herramientas: Maven y Gradle (construcción), **Apache CXF** (servicios web y clientes) y JUnit (pruebas).

## .NET
- **CLR** (Common Language Runtime): ejecuta el código intermedio (**IL/MSIL**) con su propio **JIT**, y se encarga de la memoria, las **excepciones** y la recolección de basura.
- Lenguajes: **C#**, VB.NET y F#. Los **ensamblados** (.dll o .exe) son la unidad de despliegue y solo se cargan en memoria cuando hacen falta; en .NET Framework se comparten en la **GAC**.
- **ASP.NET Core**: el servidor web Kestrel, MVC y las vistas **Razor** (sintaxis de plantillas en las que @ pasa de HTML a C#).
- **Entity Framework** es el ORM de .NET. **NuGet** es el gestor de paquetes (\`dotnet add package Nombre\`). **.NET MAUI** crea apps nativas multiplataforma con C# y XAML.
- Registro de trazas con ILogger: \`LogInformation\`, \`LogWarning\` y \`LogError\`.

## Seguridad
Autenticación y autorización basadas en roles (Jakarta Security y JAAS; ASP.NET Identity), además de OAuth 2 y OpenID Connect.`,
    quiz: [
      {
        q: '¿Qué componente de .NET gestiona la memoria y las excepciones?',
        options: ['MSBuild', 'NuGet', 'CLR', 'Kestrel'],
        answer: 2,
        why: 'El Common Language Runtime.',
      },
      {
        q: 'El ORM más habitual en Java es…',
        options: ['Entity Framework', 'Hibernate', 'Razor', 'NuGet'],
        answer: 1,
        why: 'Hibernate, que implementa JPA.',
      },
      {
        q: '¿Qué traduce el bytecode a código máquina en tiempo de ejecución?',
        options: ['El compilador javac', 'El JIT', 'El garbage collector', 'Maven'],
        answer: 1,
        why: 'Just-In-Time compiler.',
      },
    ],
  },
  {
    id: 'B3T06',
    short: 'Cliente/servidor y servicios web',
    title:
      'Arquitectura de sistemas cliente/servidor y multicapas: componentes y operación. Arquitecturas de servicios web y protocolos asociados.',
    lessons: [],
    body: `## Cliente/servidor y capas
- **Dos capas**: el cliente y el servidor de datos. **Tres capas**: presentación, lógica de negocio y datos. **N capas** o microservicios.
- Los **sistemas distribuidos** se caracterizan por la escalabilidad, la transparencia, la concurrencia y la tolerancia a fallos.
- **Middleware**: el software intermedio que comunica componentes (colas de mensajes, RPC…).

## SOA y servicios web
- **SOA** (arquitectura orientada a servicios): **servicio**, **proveedor**, **consumidor** y **registro** de servicios. El **ESB** es el bus de integración.
- **SOAP**: mensajes **XML** con un *envelope*, descritos con **WSDL**. En su día se publicaban en UDDI. Seguridad con **WS-Security** (firma y cifrado de mensajes).
- **REST**: estilo de arquitectura **orientado a recursos** (URI) sobre **HTTP**. Es **sin estado** (el servidor no guarda el estado del cliente entre peticiones) y usa JSON o XML.
- **Documentación** de APIs: **OpenAPI/Swagger**, **RAML** y **WSDL**. REST no es un lenguaje de documentación.

## Métodos y códigos HTTP
| Método | Seguro | Idempotente |
|---|---|---|
| GET | sí | sí |
| POST | no | no |
| **PUT** | no | **sí** |
| DELETE | no | sí |

- **200** OK, **201 Created** (recurso creado), **204** No Content, **301/302** redirección, **400** petición incorrecta, **401** sin autenticar, **403** prohibido (sin permiso), **404** no encontrado, **500** error del servidor y **503** no disponible.
- Otros: **GraphQL**, **gRPC** (sobre HTTP/2), **WebSocket** (bidireccional y en tiempo real) y JWT para tokens.`,
    quiz: [
      {
        q: '¿Cuál de estos métodos HTTP es idempotente pero no seguro?',
        options: ['GET', 'POST', 'PUT', 'HEAD'],
        answer: 2,
        why: 'PUT modifica el recurso, pero repetirlo da el mismo resultado.',
      },
      {
        q: 'El estándar de seguridad de los mensajes SOAP es…',
        options: ['JWT', 'WS-Security', 'CORS', 'OAuth'],
        answer: 1,
        why: 'WS-Security firma y cifra los mensajes SOAP.',
      },
      {
        q: 'Código HTTP adecuado tras crear un recurso:',
        options: ['200', '201', '204', '202'],
        answer: 1,
        why: '201 Created.',
      },
    ],
  },
  {
    id: 'B3T07',
    short: 'Aplicaciones web: HTML, CSS, JS y XML',
    title:
      'Aplicaciones web. Desarrollo web front-end y en servidor, multiplataforma y multidispositivo. Lenguajes: HTML, XML y sus derivaciones. Navegadores y lenguajes de programación web. Lenguajes de script.',
    lessons: [],
    body: `## HTML
- \`<!DOCTYPE html>\` va en la **primera línea**, antes de \`<html>\`. Luego vienen \`<head>\` (con \`<title>\`, metadatos y enlaces) y \`<body>\`.
- **Semántica HTML5**: \`<header>\`, \`<nav>\`, \`<main>\`, \`<section>\`, \`<article>\`, \`<aside>\` y \`<footer>\`.
- Formularios: \`maxlength\` limita los caracteres de un campo de texto, \`size\` solo cambia el ancho visible, y \`required\` y \`type="email"\` validan.
- Eventos: \`onclick\`, **\`onmouseover\`** (al pasar el puntero por encima), \`onmouseout\`, \`onchange\`, \`onsubmit\`…
- **XHTML**: HTML con las reglas de XML. Etiquetas en minúscula, todo cerrado, atributos entre comillas y \`<head>\` obligatorio.

## XML
- **Bien formado**: un **único elemento raíz**, las etiquetas se cierran en orden y los atributos van entre comillas (\`<alumno id="10">\`). **Válido**: además, cumple un DTD o un XSD.
- Familia: XSD, **XSLT** (transformaciones), **XPath**, DOM y SAX.

## CSS
- **Especificidad** (a-b-c): los IDs cuentan en a, las clases, atributos y **pseudoclases** en b, y los elementos y pseudoelementos en c. Por ejemplo, \`input:required\` = **0-1-1**.
- Unidades **relativas**: em, rem, %, vw, vh, ex y ch. **Absolutas**: px, cm, mm, **Q** (cuarto de milímetro), in y pt.
- Maquetación: Flexbox y Grid. El diseño adaptable (responsive) usa media queries.

## JavaScript y el navegador
- Es el único lenguaje que los navegadores ejecutan de forma **nativa** (además de WebAssembly). Se usa \`fetch\` para llamar a APIs.
- **SSR** (Server Side Rendering): el HTML se genera en el servidor. Las SPA, en cambio, renderizan en el cliente. **AJAX** son peticiones asíncronas desde la página.
- Seguridad: **CORS** (qué orígenes pueden llamar a tu API), **CSP**, HSTS y prevención de **XSS** (validar las entradas y escapar las salidas).

## Multiplataforma
Diseño responsive, PWA, frameworks (React, Angular, Vue) y apps híbridas o nativas multiplataforma (.NET MAUI, Flutter, React Native). En Apple: Xcode, Swift y **SwiftUI** (para todas sus plataformas).`,
    quiz: [
      {
        q: '¿Qué atributo limita los caracteres que se pueden escribir en un input?',
        options: ['size', 'max', 'maxlength', 'length'],
        answer: 2,
        why: 'maxlength. (max es para números y fechas.)',
      },
      {
        q: 'Especificidad de #menu .item a:',
        options: ['1-1-1', '0-2-1', '1-0-2', '1-2-0'],
        answer: 0,
        why: 'Un ID (1), una clase (1) y un elemento (1).',
      },
      {
        q: 'Un documento XML bien formado tiene…',
        options: ['al menos dos raíces', 'un único elemento raíz', 'obligatoriamente un DTD', 'etiquetas en mayúsculas'],
        answer: 1,
        why: 'Un solo elemento raíz que contiene todo lo demás.',
      },
    ],
  },
  {
    id: 'B3T08',
    short: 'Accesibilidad y usabilidad',
    title:
      'Accesibilidad, diseño universal y usabilidad. Acceso y usabilidad de las tecnologías, productos y servicios relacionados con la sociedad de la información. Software para aplicaciones de accesibilidad.',
    lessons: [],
    body: `## Normas
- **RD 1112/2018**, sobre la accesibilidad de los sitios web y aplicaciones móviles del sector público, que traspone la Directiva (UE) 2016/2102. Exige cumplir la norma **UNE-EN 301 549** (equivalente a **WCAG 2.1 nivel AA**).
- Obligaciones: publicar una **declaración de accesibilidad** y ofrecer un mecanismo de comunicación para **solicitudes de información accesible y quejas**, que deben responderse en **20 días hábiles**.
- El **contenido accesible** incluye la información textual y no textual, los documentos y formularios descargables, el multimedia pregrabado, la interacción bidireccional y los procesos de identificación, autenticación, firma y pago.

## WCAG (W3C/WAI)
- Cuatro principios (**POUR**): **Perceptible**, **Operable**, **Comprensible** y **Robusto**.
- Niveles de conformidad: **A**, **AA** y **AAA**.
- Otras pautas de la WAI: **ATAG** (herramientas de autor: que sean accesibles y generen contenido accesible), **UAAG** (agentes de usuario, como los navegadores) y **WAI-ARIA**, la suite para hacer accesible el contenido dinámico.
- Atributos ARIA: \`aria-label\`, **\`aria-expanded\`** (si un desplegable está abierto o cerrado), **\`aria-live\`** (una región que se actualiza y debe anunciarse) y \`role\`.

## Diseño universal: 7 principios
Uso equitativo, uso flexible, uso simple e intuitivo, información perceptible, tolerancia al error, poco esfuerzo físico, y tamaño y espacio adecuados para el acceso y el uso.

## Herramientas
Validadores automáticos como TAW, WAVE, Lighthouse, axe, **QualWeb** y AccessMonitor. Lectores de pantalla como JAWS, **NVDA**, VoiceOver y TalkBack. Ninguna herramienta automática sustituye a la revisión manual.

## Usabilidad
Los **10 heurísticos de Nielsen** (visibilidad del estado del sistema, prevención de errores…), la norma ISO 9241-11 (eficacia, eficiencia y satisfacción), y las pruebas con usuarios y el *card sorting*.`,
    quiz: [
      {
        q: '¿Qué pautas se dirigen a las herramientas de autor?',
        options: ['WCAG', 'UAAG', 'ATAG', 'ARIA'],
        answer: 2,
        why: 'Authoring Tool Accessibility Guidelines.',
      },
      {
        q: 'Plazo para responder una queja de accesibilidad (RD 1112/2018):',
        options: ['10 días naturales', '20 días hábiles', '1 mes', '3 meses'],
        answer: 1,
        why: 'Veinte días hábiles.',
      },
      {
        q: 'Los cuatro principios de WCAG son…',
        options: ['Perceptible, Operable, Comprensible, Robusto', 'Visible, Usable, Seguro, Rápido', 'A, AA, AAA, AAAA', 'Simple, Flexible, Equitativo, Tolerante'],
        answer: 0,
        why: 'POUR.',
      },
    ],
  },
  {
    id: 'B3T09',
    short: 'Repositorios, metodologías, pruebas y Git',
    title:
      'Repositorios: estructura y actualización. Generación de código y documentación. Metodologías de desarrollo. Pruebas. Programas para control de versiones. Plataformas de desarrollo colaborativo de software.',
    lessons: [],
    body: `## Control de versiones
- **Centralizados**: CVS y **Subversion (SVN)**. **Distribuidos**: **Git** y **Mercurial**.
- Git: \`clone\`, \`add\`, \`commit\`, \`push\`, \`pull\` (que equivale a fetch + merge) y **\`fetch\`** (descarga del remoto y actualiza las ramas de seguimiento \`origin/…\` sin tocar tu rama). También \`branch\`, \`merge\`, \`rebase\` y \`tag\`.
- Modelo de datos de Git: **objects** (blob, tree, commit y tag), **references**, el **index** y los **reflogs**.
- Plataformas: GitHub, GitLab y Bitbucket. Una **pull request** (o *merge request*) es la propuesta de fusionar los cambios de una rama en otra, con revisión. **GitHub Actions** guarda sus flujos en \`.github/workflows/*.yml\`. El README.md explica el proyecto.

## Metodologías
- **Clásicas**: en cascada y en V. **Métrica v3**, la metodología de la Administración española, organiza el trabajo en procesos (PSI, EVS, ASI, DSI, CSI, IAS y MSI) e interfaces (Gestión de proyectos, Seguridad, Aseguramiento de la calidad y Gestión de la configuración).
- **Ágiles**: **Scrum**, cuyos roles son el Product Owner, el Scrum Master y los Developers, y cuyos eventos son el Sprint, la Sprint Planning, la **Daily** (15 minutos), la **Sprint Review** (se revisa el producto) y la **Sprint Retrospective** (se revisa cómo se ha trabajado para mejorar). También Kanban, XP y Lean.
- **DevOps** y **CI/CD**: integración y despliegue continuos (Jenkins, GitHub Actions, GitLab CI).

## Pruebas
- **Unitarias** (cada componente), de **integración** (las interfaces entre componentes), de **sistema**, de **aceptación** (las hace el usuario), de **regresión** (que un cambio no rompa lo que ya funcionaba), de rendimiento y de carga.
- **Caja blanca**: se mira el código por dentro. **Caja negra**: solo las entradas y salidas.
- Herramientas: **JUnit** (con \`assertThrows\` para verificar excepciones), Selenium (navegador), **Cucumber** (BDD), TestLink (gestión de pruebas), Avocado y JMeter (carga). Para la calidad del código: **SonarQube**, PMD y los linters.

## Construcción y documentación
Maven y Gradle (\`mvn spring-boot:run\`), npm y dotnet. Generación de documentación con **Javadoc**, Doxygen y Swagger/OpenAPI.`,
    quiz: [
      {
        q: '¿Qué hace git fetch?',
        options: [
          'Descarga y fusiona en tu rama actual',
          'Descarga del remoto y actualiza las ramas de seguimiento sin integrar nada',
          'Sube tus commits',
          'Borra el historial local',
        ],
        answer: 1,
        why: 'git pull = fetch + merge.',
      },
      {
        q: '¿En qué evento de Scrum se busca mejorar la forma de trabajar?',
        options: ['Daily', 'Sprint Review', 'Sprint Retrospective', 'Sprint Planning'],
        answer: 2,
        why: 'La retrospectiva revisa el proceso; la review revisa el producto.',
      },
      {
        q: 'Las pruebas que verifican que un cambio no rompe nada existente son…',
        options: ['unitarias', 'de regresión', 'de aceptación', 'de carga'],
        answer: 1,
        why: 'Regresión.',
      },
    ],
  },
];
