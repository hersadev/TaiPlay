// Ruta «Programación». Lecciones de tipo «code»: ejercicios de leer código.
//   - JavaScript: «¿qué imprime?». Tras responder se puede ejecutar de
//     verdad (engine/js, en un Worker aislado) y modificar el código. Las
//     pruebas ejecutan cada ejercicio y comprueban que la opción correcta
//     es exactamente lo que imprime.
//   - Java y C#: no se ejecutan. O se pregunta qué imprime (choice) o hay que
//     señalar la línea del error (task: 'line', answer = número de línea o
//     lista de líneas válidas) y decir si es de compilación o de ejecución.
//
// Campos de cada ejercicio: lang, code, q, y según el caso options +
// answer, o task: 'line' + answer + error ('compilación' | 'ejecución').
// why se muestra al acertar. endless: el código no termina (bucle
// infinito). output/error: lo que comprueba la prueba cuando las opciones
// describen la salida en vez de copiarla.
//
// Al final de cada lección van sus retos de programar (_retos.js): la
// lección se completa al resolver los ejercicios y los retos.

import { RETOS } from './_retos.js';

const JS_NOTE = 'Responde primero. Después podrás pulsar **▶ Ejecutar** para verlo de verdad, cambiar el código y volver a probar.';

const lecciones = [
  {
    id: 'pg-js-tipos',
    type: 'code',
    title: 'JavaScript I: tipos y operadores',
    summary: 'typeof, == frente a ===, el + con textos, % y el operador ternario.',
    body: `En el examen hay que **leer código y predecir el resultado**. Para eso basta con conocer bien unas pocas reglas.

## Variables y tipos
- \`let\` declara una variable que puede cambiar y \`const\`, una que no. (\`var\` es la forma antigua: evítala.)
- Tipos básicos: \`number\` (no distingue enteros y decimales), \`string\`, \`boolean\`, \`undefined\` (sin valor), \`null\` (vacío a propósito), y los objetos y arrays.
- \`typeof\` dice el tipo. Ojo: \`typeof null\` es **"object"** (un error histórico) y un array también es "object".

## Operadores que engañan
- \`+\` con un texto **concatena**: \`"2" + 2\` es \`"22"\`. El resto (\`- * /\`) convierte a número: \`"2" - 2\` es \`0\`.
- \`==\` compara convirtiendo tipos (\`1 == "1"\` es true); \`===\` exige el mismo tipo (\`1 === "1"\` es false). Usa siempre \`===\`.
- \`%\` es el **resto** de la división: \`14 % 2\` es 0 (par) y \`7 % 2\` es 1 (impar).
- **Ternario**: \`condición ? siVerdadero : siFalso\`.
- \`||\` devuelve el primer valor «verdadero» y \`??\` el primero que no sea null/undefined. Son «falsos» \`0\`, \`""\`, \`null\`, \`undefined\`, \`NaN\` y \`false\`.

${JS_NOTE}`,
    exercises: [
      {
        lang: 'js',
        q: '¿Qué imprime? (Examen de 2025)',
        code: `const a = 10, b = 4, c = 4;
console.log((a + b) % 2 == 0 ? c + 4 : c - 2);`,
        options: ['8', '2', '6', '14'],
        answer: 0,
        why: '(10 + 4) % 2 es 0, así que la condición es verdadera y se evalúa c + 4 = 8.',
      },
      {
        lang: 'js',
        q: '¿Qué imprime?',
        code: `console.log("2" + 2);
console.log("2" - 2);
console.log(2 + 2 + "2");`,
        options: ['22\n0\n42', '4\n0\n42', '22\n0\n222', '22\nNaN\n42'],
        answer: 0,
        why: 'Con un texto, + concatena. El - siempre convierte a número. Y se evalúa de izquierda a derecha: 2 + 2 = 4, luego 4 + "2" = "42".',
      },
      {
        lang: 'js',
        q: '¿Qué imprime?',
        code: `console.log(1 == "1");
console.log(1 === "1");
console.log(null == undefined);
console.log(NaN === NaN);`,
        options: ['true\nfalse\ntrue\nfalse', 'true\ntrue\ntrue\ntrue', 'false\nfalse\nfalse\nfalse', 'true\nfalse\nfalse\ntrue'],
        answer: 0,
        why: '== convierte tipos; === no. null == undefined es true por definición. NaN no es igual a nada, ni a sí mismo (se comprueba con Number.isNaN).',
      },
      {
        lang: 'js',
        q: '¿Qué imprime?',
        code: `console.log(typeof 42);
console.log(typeof "42");
console.log(typeof null);
console.log(typeof [1, 2]);`,
        options: ['number\nstring\nobject\nobject', 'number\nstring\nnull\narray', 'number\nnumber\nobject\narray', 'int\nstring\nnull\nobject'],
        answer: 0,
        why: 'typeof null da "object" (un fallo de diseño de 1995 que ya no se puede cambiar) y los arrays son objetos. Para saber si algo es un array: Array.isArray().',
      },
      {
        lang: 'js',
        q: '¿Qué imprime?',
        code: `const nombre = "";
console.log(nombre || "Anónimo");
console.log(0 ?? 5);
console.log(Boolean("false"));`,
        options: ['Anónimo\n0\ntrue', '\n0\nfalse', 'Anónimo\n5\nfalse', 'Anónimo\n5\ntrue'],
        answer: 0,
        why: '"" es falso, así que || pasa a "Anónimo". ?? solo salta con null o undefined, y 0 no lo es. Cualquier texto no vacío es verdadero, aunque diga "false".',
      },
      {
        lang: 'js',
        q: '¿Qué imprime?',
        code: `console.log(7 / 2);
console.log(Math.floor(7 / 2));
console.log(7 % 2);
console.log(0.1 + 0.2 === 0.3);`,
        options: ['3.5\n3\n1\nfalse', '3\n3\n1\ntrue', '3.5\n4\n1\ntrue', '3.5\n3\n0\nfalse'],
        answer: 0,
        why: 'En JavaScript la división no es entera. Y 0.1 + 0.2 da 0.30000000000000004: los decimales en coma flotante no son exactos.',
      },
    ],
    exam: ['tai2025A-P40'],
  },
  {
    id: 'pg-js-control',
    type: 'code',
    title: 'JavaScript II: condiciones y bucles',
    summary: 'Lógica booleana, for, while, switch, i++ frente a ++i y bucles infinitos.',
    body: `## Condiciones
- \`&&\` (y), \`||\` (o), \`!\` (no). Primero se resuelve cada comparación y después se combinan.
- \`switch\` compara con \`===\` y, si un \`case\` no termina en \`break\`, **sigue ejecutando el siguiente** (*fall-through*).

## Bucles
- \`for (let i = 0; i < n; i++)\`: inicio, condición y paso.
- \`while (condición)\` comprueba **antes** de cada vuelta; \`do { } while (condición)\` comprueba **después**, así que se ejecuta al menos una vez.
- \`continue\` salta a la siguiente vuelta y \`break\` sale del bucle.
- \`for…of\` recorre los **valores** de un array; \`for…in\`, sus **índices** (las claves).
- \`i++\` devuelve el valor **antes** de sumar y \`++i\`, **después**.

## Bucles infinitos
Si la condición nunca llega a ser falsa, el bucle no termina. En el examen de 2024 cayó uno: tienes que verlo *antes* de ejecutarlo. Aquí el simulador lo corta solo.

${JS_NOTE}`,
    exercises: [
      {
        lang: 'js',
        q: '¿Qué hace este programa? (Examen de 2024)',
        code: `let x = 0;
while (x < 100) {
  x = x + 1;
  console.log(x);
  x = x - 1;
}`,
        options: ['Imprime los números del 1 al 100', 'Imprime los impares del 1 al 99', 'Imprime los pares del 2 al 100', 'Imprime 1 sin parar: es un bucle infinito'],
        answer: 3,
        endless: true,
        why: 'En cada vuelta x sube a 1, se imprime y vuelve a 0. Nunca llega a 100.',
      },
      {
        lang: 'js',
        q: 'Con a = 1, b = 2, c = 3, d = 1, ¿qué imprime? (Examen de 2024)',
        code: `const a = 1, b = 2, c = 3, d = 1;
console.log(((a > b) || (a < c)) && ((a == c) || (a >= b)));
console.log(!(a == c) && (c > b));`,
        options: ['false\ntrue', 'true\ntrue', 'true\nfalse', 'false\nfalse'],
        answer: 0,
        why: 'Primera: (false || true) && (false || false) = true && false = false. Segunda: !(false) && true = true.',
      },
      {
        lang: 'js',
        q: '¿Qué imprime?',
        code: `let total = 0;
for (let i = 1; i <= 5; i++) {
  if (i % 2 === 0) continue;
  total += i;
}
console.log(total);`,
        options: ['9', '15', '6', '5'],
        answer: 0,
        why: 'continue se salta los pares: 1 + 3 + 5 = 9.',
      },
      {
        lang: 'js',
        q: '¿Qué imprime?',
        code: `const nota = 'B';
switch (nota) {
  case 'A':
    console.log('Excelente');
  case 'B':
    console.log('Bien');
  case 'C':
    console.log('Suficiente');
    break;
  default:
    console.log('Repite');
}`,
        options: ['Bien\nSuficiente', 'Bien', 'Bien\nSuficiente\nRepite', 'Excelente\nBien\nSuficiente'],
        answer: 0,
        why: 'Entra por el case "B" y, como no hay break, sigue por el "C" hasta su break.',
      },
      {
        lang: 'js',
        q: '¿Qué imprime?',
        code: `let i = 5;
const a = i++;
const b = ++i;
console.log(a, b, i);`,
        options: ['5 7 7', '6 7 7', '5 6 7', '6 6 6'],
        answer: 0,
        why: 'a = i++ guarda 5 y luego i pasa a 6. b = ++i primero suma (7) y luego lo guarda.',
      },
      {
        lang: 'js',
        q: '¿Qué imprime?',
        code: `let n = 10;
do {
  console.log(n);
  n++;
} while (n < 10);`,
        options: ['10', 'No imprime nada', '10\n11', 'Es un bucle infinito'],
        answer: 0,
        why: 'do…while ejecuta el cuerpo una vez antes de comprobar la condición.',
      },
      {
        lang: 'js',
        q: '¿Qué imprime?',
        code: `const notas = [7, 5, 9];
for (const i in notas) console.log(i);
for (const n of notas) console.log(n);`,
        options: ['0\n1\n2\n7\n5\n9', '7\n5\n9\n7\n5\n9', '0\n1\n2\n0\n1\n2', '7\n5\n9\n0\n1\n2'],
        answer: 0,
        why: 'for…in da los índices (como texto) y for…of, los valores.',
      },
    ],
    exam: ['tai2024A-P36', 'tai2024A-P34'],
  },
  {
    id: 'pg-js-funciones',
    type: 'code',
    title: 'JavaScript III: funciones, arrays y objetos',
    summary: 'Ámbito, closures, map/filter/reduce, referencias y desestructuración.',
    body: `## Funciones
- \`function nombre(a, b = 1) { return … }\` o, abreviada, \`(a, b) => a + b\`.
- Las declaradas con \`function\` se pueden llamar **antes** de su línea (*hoisting*).
- Una función recuerda las variables del sitio donde se creó: es un **closure**.

## Ámbito
\`let\` y \`const\` solo existen dentro de su bloque \`{ }\`. \`var\` ignora los bloques: solo respeta las funciones.

## Arrays
- \`filter\` se queda con los que cumplen, \`map\` transforma cada uno y \`reduce\` los acumula en un valor.
- \`sort()\` sin argumentos ordena **como texto**: para números, \`sort((a, b) => a - b)\`.
- Los arrays y objetos se pasan **por referencia**: \`const b = a\` no copia, apunta al mismo. Para copiar: \`[...a]\` o \`{ ...obj }\`.

## Objetos
\`{ clave: valor }\`. Una clave que no existe da \`undefined\` (no un error). La **desestructuración** saca valores: \`const { nombre } = alumno\`. \`JSON.stringify\` convierte un objeto en texto JSON.

${JS_NOTE}`,
    exercises: [
      {
        lang: 'js',
        q: '¿Qué imprime?',
        code: `var a = 1;
let b = 1;
if (true) {
  var a = 2;
  let b = 2;
}
console.log(a, b);`,
        options: ['2 1', '1 1', '2 2', '1 2'],
        answer: 0,
        why: 'El var de dentro es la misma variable a (var no respeta bloques). El let b de dentro es otra variable que desaparece al cerrar la llave.',
      },
      {
        lang: 'js',
        q: '¿Qué imprime?',
        code: `function contador() {
  let n = 0;
  return () => ++n;
}
const c1 = contador();
const c2 = contador();
c1();
c1();
console.log(c1(), c2());`,
        options: ['3 1', '1 1', '3 3', '2 1'],
        answer: 0,
        why: 'Cada llamada a contador() crea su propio n. c1 lleva tres incrementos; c2, uno.',
      },
      {
        lang: 'js',
        q: '¿Qué imprime?',
        code: `const notas = [4, 7, 9, 3, 6];
const aprobadas = notas.filter(n => n >= 5);
console.log(aprobadas);
console.log(aprobadas.map(n => n * 10));
console.log(notas.reduce((s, n) => s + n, 0));`,
        options: ['[ 7, 9, 6 ]\n[ 70, 90, 60 ]\n29', '[ 4, 3 ]\n[ 40, 30 ]\n29', '[ 7, 9, 6 ]\n[ 70, 90, 60 ]\n22', '[ true, false ]\n[ 70, 90, 60 ]\n29'],
        answer: 0,
        why: 'filter deja 7, 9 y 6; map los multiplica; reduce suma todas las notas: 4 + 7 + 9 + 3 + 6 = 29.',
      },
      {
        lang: 'js',
        q: '¿Qué imprime?',
        code: `const a = [1, 2, 3];
const b = a;
const c = [...a];
b.push(4);
console.log(a.length, b.length, c.length);`,
        options: ['4 4 3', '3 4 3', '4 4 4', '3 4 4'],
        answer: 0,
        why: 'b es el mismo array que a (referencia), así que el push se ve en los dos. c es una copia.',
      },
      {
        lang: 'js',
        q: '¿Qué imprime?',
        code: `const alumno = { nombre: 'Lucía', notas: [8, 9] };
const { nombre, notas: [primera] } = alumno;
console.log(nombre, primera);
console.log(alumno.edad);
console.log(JSON.stringify(alumno));`,
        options: [
          'Lucía 8\nundefined\n{"nombre":"Lucía","notas":[8,9]}',
          'Lucía [ 8, 9 ]\nundefined\n{"nombre":"Lucía","notas":[8,9]}',
          'Lucía 8\nnull\n{nombre: Lucía, notas: [8, 9]}',
          'Lucía 8\nError: edad no existe',
        ],
        answer: 0,
        why: 'La desestructuración saca nombre y el primer elemento de notas. Una propiedad que no existe es undefined. JSON usa comillas dobles en las claves.',
      },
      {
        lang: 'js',
        q: '¿Qué imprime?',
        code: `console.log(saludo('Ana'));
function saludo(nombre = 'mundo') {
  return \`Hola, \${nombre}\`;
}
console.log(saludo());`,
        options: ['Hola, Ana\nHola, mundo', 'Error: saludo no está definida', 'Hola, Ana\nHola, undefined', 'undefined\nHola, mundo'],
        answer: 0,
        why: 'Las funciones declaradas con function se «elevan» y se pueden usar antes. Sin argumento, se usa el valor por defecto.',
      },
      {
        lang: 'js',
        q: '¿Qué imprime?',
        code: `console.log([10, 9, 1, 100].sort());
console.log([10, 9, 1, 100].sort((a, b) => a - b));`,
        options: ['[ 1, 10, 100, 9 ]\n[ 1, 9, 10, 100 ]', '[ 1, 9, 10, 100 ]\n[ 1, 9, 10, 100 ]', '[ 100, 10, 9, 1 ]\n[ 1, 9, 10, 100 ]', '[ 1, 9, 10, 100 ]\n[ 100, 10, 9, 1 ]'],
        answer: 0,
        why: 'Sin función, sort compara como texto: "10" va antes que "9" porque "1" < "9".',
      },
    ],
  },
  {
    id: 'pg-js-async',
    type: 'code',
    title: 'JavaScript IV: asincronía, fetch y errores',
    summary: 'El orden real de ejecución, fetch con then, async/await y try/catch.',
    body: `## Una cosa detrás de otra… salvo lo asíncrono
JavaScript ejecuta primero todo el código **síncrono**. Lo asíncrono espera su turno:
1. Primero, el código normal, de arriba abajo.
2. Después, las **promesas** ya resueltas (\`.then\`, lo que sigue a un \`await\`): las *microtareas*.
3. Por último, los temporizadores (\`setTimeout\`), aunque sean de 0 ms.

## fetch
\`fetch(url)\` pide datos a una API y devuelve una **promesa**. Lo habitual (cayó en el supuesto de 2025):
\`\`\`
fetch("http://localhost:8080/alumnos")
  .then(response => response.json())
  .then(data => console.log(data));
\`\`\`
Con \`async\`/\`await\` se escribe como si fuera síncrono: \`const r = await fetch(url)\`. En este simulador, \`http://localhost:8080/alumnos\` devuelve dos alumnos.

## Errores
\`try { … } catch (e) { … } finally { … }\`: si algo falla dentro del try, se salta al catch; finally se ejecuta siempre. Un error que nadie captura **detiene** el programa.

${JS_NOTE}`,
    exercises: [
      {
        lang: 'js',
        q: '¿En qué orden se imprimen las letras?',
        code: `console.log('A');
setTimeout(() => console.log('B'), 0);
Promise.resolve().then(() => console.log('C'));
console.log('D');`,
        options: ['A\nD\nC\nB', 'A\nB\nC\nD', 'A\nD\nB\nC', 'A\nC\nD\nB'],
        answer: 0,
        why: 'Primero lo síncrono (A, D), luego las promesas (C) y al final los temporizadores (B), aunque sean de 0 ms.',
      },
      {
        lang: 'js',
        q: '¿Qué imprime? (El endpoint devuelve dos alumnos: Lucía y Hugo.)',
        code: `fetch("http://localhost:8080/alumnos")
  .then(response => response.json())
  .then(data => console.log(data.length, data[0].nombre));
console.log('Petición enviada');`,
        options: ['Petición enviada\n2 Lucía', '2 Lucía\nPetición enviada', 'Petición enviada\nundefined', 'Promise { <pendiente> }'],
        answer: 0,
        why: 'fetch no bloquea: se imprime primero el mensaje y, cuando llega la respuesta, los datos.',
      },
      {
        lang: 'js',
        q: '¿Qué imprime?',
        code: `async function cargar() {
  console.log('1');
  const r = await fetch("http://localhost:8080/alumnos");
  console.log('2');
  return (await r.json()).length;
}
cargar().then(n => console.log('3', n));
console.log('4');`,
        options: ['1\n4\n2\n3 2', '1\n2\n3 2\n4', '4\n1\n2\n3 2', '1\n2\n4\n3 2'],
        answer: 0,
        why: 'La función se ejecuta de forma síncrona hasta el primer await (imprime 1). Ahí cede el turno (4) y sigue cuando llega la respuesta (2, y luego 3).',
      },
      {
        lang: 'js',
        q: '¿Qué imprime?',
        code: `try {
  const x = null;
  console.log(x.nombre);
} catch (e) {
  console.log(e.name);
} finally {
  console.log('fin');
}`,
        options: ['TypeError\nfin', 'null\nfin', 'undefined\nfin', 'TypeError'],
        answer: 0,
        why: 'Leer una propiedad de null lanza un TypeError, que el catch captura. finally se ejecuta siempre.',
      },
      {
        lang: 'js',
        q: '¿Qué ocurre?',
        code: `const datos = JSON.parse('{"id": 1}');
console.log(datos.id);
JSON.parse("{id: 1}");
console.log('¿Llega aquí?');`,
        options: ['Imprime 1 y después se detiene con un SyntaxError', 'Imprime 1 y «¿Llega aquí?»', 'Se detiene con un SyntaxError sin imprimir nada', 'Imprime 1, undefined y «¿Llega aquí?»'],
        answer: 0,
        output: '1',
        error: 'SyntaxError',
        why: 'En JSON las claves van entre comillas dobles. El error no se captura, así que el programa se detiene y la última línea no se ejecuta.',
      },
    ],
    exam: ['tai2025A-S1-13'],
  },
  {
    id: 'pg-java',
    type: 'code',
    title: 'Java: leer código y encontrar el error',
    summary: 'Primitivos frente a objetos, equals, excepciones, división entera y herencia.',
    body: `En los supuestos te enseñan una clase Java y preguntan si compila, qué imprime o dónde falla. Esto es lo que más se repite:

## Lo que hay que saber
- **Tipos primitivos** (\`int\`, \`double\`, \`boolean\`, \`char\`…) no son objetos: **no tienen métodos**. \`idAlumno.equals(id)\` con un \`int\` no compila; se compara con \`==\`.
- Con **objetos** (\`String\`, \`Integer\`…), \`==\` compara si son **el mismo objeto**, y \`equals\`, si tienen **el mismo contenido**. Los textos se comparan con \`equals\`.
- **División entera**: \`7 / 2\` entre enteros da \`3\`, aunque lo guardes en un \`double\` (3.0). Para decimales, convierte uno: \`(double) a / b\`.
- Un método que devuelve algo debe hacer \`return\` **en todos los caminos**, o no compila.
- \`final\`: no se puede volver a asignar.
- **Excepciones comprobadas** (*checked*, como \`IOException\`): hay que capturarlas con \`try/catch\` o declararlas con \`throws\`, o no compila. Las no comprobadas (\`NullPointerException\`, \`ArrayIndexOutOfBoundsException\`) saltan **al ejecutar**.
- **Sobrescritura** (*overriding*): la subclase redefine un método con la misma firma (\`@Override\`) y se ejecuta el del objeto real. **Sobrecarga** (*overloading*): mismo nombre, distintos parámetros.

## Compilación o ejecución
- **Error de compilación**: \`javac\` se niega a generar el programa (tipos, sintaxis, métodos que no existen).
- **Error de ejecución**: compila, pero falla al ejecutarse (una excepción).

En los ejercicios de «¿dónde está el error?», pulsa la línea en la que salta.`,
    exercises: [
      {
        lang: 'java',
        task: 'line',
        q: '¿Qué línea impide compilar con javac Alumno.java? (Supuesto de 2025)',
        code: `public class Alumno {
    private int idAlumno;

    public boolean esAlumno(int id) {
        if (idAlumno.equals(id)) {
            return true;
        }
        return false;
    }
}`,
        answer: 5,
        error: 'compilación',
        why: 'idAlumno es un int, un tipo primitivo: no tiene métodos. Se compara con idAlumno == id.',
      },
      {
        lang: 'java',
        q: '¿Qué imprime?',
        code: `String a = "TAI";
String b = new String("TAI");
System.out.println(a == b);
System.out.println(a.equals(b));`,
        options: ['false\ntrue', 'true\ntrue', 'true\nfalse', 'No compila'],
        answer: 0,
        why: 'new String crea otro objeto: == compara referencias (false) y equals compara el contenido (true).',
      },
      {
        lang: 'java',
        task: 'line',
        q: '¿En qué línea salta el error?',
        code: `int[] notas = {7, 5, 9};
int suma = 0;
for (int i = 0; i <= notas.length; i++) {
    suma += notas[i];
}
System.out.println(suma);`,
        answer: [4, 3],
        error: 'ejecución',
        why: 'Compila, pero cuando i vale 3 se accede a notas[3], que no existe: ArrayIndexOutOfBoundsException en la línea 4. La causa está en la 3: debería ser i < notas.length.',
      },
      {
        lang: 'java',
        q: '¿Qué imprime?',
        code: `int a = 7, b = 2;
double r = a / b;
System.out.println(r);
System.out.println(a % b);
System.out.println((double) a / b);`,
        options: ['3.0\n1\n3.5', '3.5\n1\n3.5', '3\n1\n3.5', '3.0\n1\n3.0'],
        answer: 0,
        why: 'a / b es una división entera (3) antes de guardarse en el double (3.0). Convirtiendo uno de los dos a double se obtiene 3.5.',
      },
      {
        lang: 'java',
        task: 'line',
        q: 'Este método no compila. ¿Dónde lo señala javac?',
        code: `public static String nota(int n) {
    if (n >= 5) {
        return "Apto";
    } else if (n < 5) {
        return "No apto";
    }
}`,
        answer: 7,
        error: 'compilación',
        why: '«missing return statement»: aunque nosotros veamos que las dos condiciones cubren todo, el compilador no lo deduce y exige un return al final (o un else sin condición).',
      },
      {
        lang: 'java',
        task: 'line',
        q: '¿Qué línea no compila?',
        code: `public class Config {
    private static final int MAX = 10;

    public static void main(String[] args) {
        MAX = 20;
        System.out.println(MAX);
    }
}`,
        answer: 5,
        error: 'compilación',
        why: 'MAX es final: una vez asignada no se puede cambiar.',
      },
      {
        lang: 'java',
        task: 'line',
        q: 'Se ejecuta sin argumentos (java Main). ¿Dónde falla?',
        code: `public static void main(String[] args) {
    String nombre = null;
    if (args.length > 0) {
        nombre = args[0];
    }
    System.out.println(nombre.length());
}`,
        answer: 6,
        error: 'ejecución',
        why: 'Sin argumentos, nombre sigue siendo null y llamar a length() lanza NullPointerException.',
      },
      {
        lang: 'java',
        task: 'line',
        q: '¿Qué línea no compila?',
        code: `import java.io.FileReader;

public class Lector {
    public static void main(String[] args) {
        FileReader f = new FileReader("datos.txt");
        System.out.println("Abierto");
    }
}`,
        answer: 5,
        error: 'compilación',
        why: 'El constructor puede lanzar FileNotFoundException, una excepción comprobada: hay que capturarla (try/catch) o declararla (throws) en main.',
      },
      {
        lang: 'java',
        q: '¿Qué imprime?',
        code: `class Animal {
    String sonido() { return "..."; }
}

class Perro extends Animal {
    @Override
    String sonido() { return "Guau"; }
}

public class Main {
    public static void main(String[] args) {
        Animal a = new Perro();
        System.out.println(a.sonido());
    }
}`,
        options: ['Guau', '...', 'No compila: a es un Animal', 'null'],
        answer: 0,
        why: 'Es sobrescritura: se ejecuta el método del objeto real (un Perro), no el del tipo de la variable. Es el polimorfismo.',
      },
    ],
    exam: ['tai2025A-S1-6', 'tai2025A-S1-5', 'tai2025A-P46', 'tai2024A-S1-11'],
  },
  {
    id: 'pg-csharp',
    type: 'code',
    title: 'C# y .NET: leer código y encontrar el error',
    summary: 'Tipos anulables, async Task, cadenas, LINQ y excepciones.',
    body: `C# se parece mucho a Java, pero tiene diferencias que el examen aprovecha:

- **Tipos anulables**: un \`int\` no puede valer \`null\`; un \`int?\` (\`Nullable<int>\`) sí. Así se indica que un dato es opcional.
- \`??\` da un valor por defecto si algo es null, y \`?.\` solo accede si no es null.
- **Cadenas**: en C#, \`==\` entre \`string\` compara el **contenido** (al revés que en Java).
- \`bool\` se imprime como **True** y **False**, con mayúscula.
- **Asincronía**: un método asíncrono se declara \`async Task\` (o \`async Task<int>\` si devuelve un int) y se espera con \`await\`.
- \`var\` deduce el tipo del valor inicial: sin valor inicial, no compila.
- **Interpolación**: \`$"Hola {nombre}"\`. Sin el \`$\`, las llaves se imprimen tal cual.
- **LINQ**: \`Where\` filtra, \`Select\` transforma, \`Count\` cuenta.
- Excepciones típicas al ejecutar: \`DivideByZeroException\`, \`ArgumentOutOfRangeException\`, \`NullReferenceException\`.

Recuerda que el **CLR** (*Common Language Runtime*) es quien ejecuta el código en .NET: gestiona la memoria, la recolección de basura y las excepciones.`,
    exercises: [
      {
        lang: 'csharp',
        task: 'line',
        q: '¿Qué línea no compila? (Como en el supuesto de 2024)',
        code: `public class Interesado
{
    public string Nombre { get; set; }
    public int Telefono { get; set; }

    public void BorrarTelefono()
    {
        Telefono = null;
    }
}`,
        answer: 8,
        error: 'compilación',
        why: 'Un int no admite null. Para un teléfono opcional se declara int? Telefono.',
      },
      {
        lang: 'csharp',
        task: 'line',
        q: '¿Qué línea no compila? (Como en el supuesto de 2025)',
        code: `public async int DevolverDato()
{
    await Task.Delay(100);
    return 42;
}`,
        answer: 1,
        error: 'compilación',
        why: 'Un método async debe devolver Task, Task<T> o void (solo para eventos). Lo correcto: public async Task<int> DevolverDato().',
      },
      {
        lang: 'csharp',
        q: '¿Qué imprime?',
        code: `string a = "TAI";
string b = new string(new[] { 'T', 'A', 'I' });
Console.WriteLine(a == b);
Console.WriteLine(a.Equals(b));`,
        options: ['True\nTrue', 'False\nTrue', 'true\ntrue', 'False\nFalse'],
        answer: 0,
        why: 'En C#, == entre string compara el contenido. Y los bool se imprimen con mayúscula.',
      },
      {
        lang: 'csharp',
        q: '¿Qué imprime?',
        code: `int? telefono = null;
string? email = null;
Console.WriteLine(telefono ?? 0);
Console.WriteLine(email?.Length ?? -1);
Console.WriteLine(telefono.HasValue);`,
        options: ['0\n-1\nFalse', 'null\n-1\nFalse', '0\n0\nfalse', 'Lanza NullReferenceException'],
        answer: 0,
        why: '?? da 0 porque telefono es null. email?.Length es null (sin error) y ?? da -1. HasValue indica si el anulable tiene valor.',
      },
      {
        lang: 'csharp',
        task: 'line',
        q: '¿Qué línea no compila?',
        code: `var total;
total = 10;
Console.WriteLine(total);`,
        answer: 1,
        error: 'compilación',
        why: 'var deduce el tipo del valor inicial: sin inicializar no puede saber qué tipo es. Lo correcto: var total = 10; o int total;.',
      },
      {
        lang: 'csharp',
        q: '¿Qué imprime?',
        code: `var notas = new List<int> { 4, 7, 9, 3, 6 };
var aprobadas = notas.Where(n => n >= 5).Select(n => n * 10);
Console.WriteLine(string.Join(", ", aprobadas));
Console.WriteLine(notas.Count(n => n < 5));`,
        options: ['70, 90, 60\n2', '7, 9, 6\n2', '70, 90, 60\n3', 'System.Linq.Enumerable+…\n2'],
        answer: 0,
        why: 'Where deja 7, 9 y 6, Select los multiplica por 10 y string.Join los une. Hay dos notas por debajo de 5.',
      },
      {
        lang: 'csharp',
        task: 'line',
        q: '¿En qué línea falla al ejecutarse?',
        code: `int alumnos = 0;
int plazas = 30;
Console.WriteLine("Calculando ratio...");
int ratio = plazas / alumnos;
Console.WriteLine(ratio);`,
        answer: 4,
        error: 'ejecución',
        why: 'Dividir un entero entre 0 lanza DivideByZeroException al ejecutar. (Con double no fallaría: daría infinito.)',
      },
      {
        lang: 'csharp',
        q: '¿Qué imprime?',
        code: `string nombre = "Hugo";
int edad = 30;
Console.WriteLine($"{nombre} tiene {edad + 1} años");
Console.WriteLine("{nombre} tiene {edad} años");`,
        options: ['Hugo tiene 31 años\n{nombre} tiene {edad} años', 'Hugo tiene 31 años\nHugo tiene 30 años', 'Hugo tiene 301 años\n{nombre} tiene {edad} años', 'No compila'],
        answer: 0,
        why: 'Solo las cadenas con $ delante interpolan: dentro de las llaves se evalúa la expresión (30 + 1).',
      },
      {
        lang: 'csharp',
        task: 'line',
        q: '¿En qué línea falla al ejecutarse?',
        code: `var lista = new List<string> { "a", "b" };
Console.WriteLine(lista.Count);
Console.WriteLine(lista[2]);`,
        answer: 3,
        error: 'ejecución',
        why: 'La lista tiene 2 elementos (índices 0 y 1): lista[2] lanza ArgumentOutOfRangeException.',
      },
    ],
    exam: ['tai2024A-S1-20', 'tai2025A-S1-9', 'tai2025A-P48'],
  },
];

// Cada lección termina con sus retos de programar (ver _retos.js).
export const programacion = lecciones.map((l) => ({ ...l, challenges: RETOS[l.id] ?? [] }));
