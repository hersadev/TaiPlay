// Retos de programar al final de cada lección de Programación.
//
// JavaScript (kind: 'js'): el alumno escribe una función a partir de
// `starter`; se ejecuta en el Worker (engine/js/run.js → runJsTests) y se
// le pasan las pruebas `tests` ({ args, expect }). La prueba de la suite
// comprueba que `solution` las pasa todas y que `starter` no.
//
// Java y C# (kind: 'gaps'): no se pueden compilar en el navegador, así que
// son de «completa el código». `code` lleva huecos {{1}}, {{2}}…; cada hueco
// tiene en `gaps` las respuestas válidas. Se comparan sin espacios, así que
// «i < notas.length» y «i<notas.length» valen igual.

export const RETOS = {
  'pg-js-tipos': [
    {
      kind: 'js',
      title: '¿Es par?',
      task: 'Completa la función `esPar(n)` para que devuelva `true` si `n` es par y `false` si no lo es. Funciona también con negativos y con el 0.',
      fn: 'esPar',
      starter: `function esPar(n) {
  // Pista: el operador % da el resto de la división
}`,
      solution: `function esPar(n) {
  return n % 2 === 0;
}`,
      tests: [
        { args: [4], expect: true },
        { args: [7], expect: false },
        { args: [0], expect: true },
        { args: [-3], expect: false },
        { args: [-8], expect: true },
      ],
    },
    {
      kind: 'js',
      title: 'Saludo con valor por defecto',
      task: 'Escribe `saludo(nombre)`, que devuelva `"Hola, Ana"` para `"Ana"`. Si el nombre llega vacío (`""`) o no llega (`undefined`), debe devolver `"Hola, anónimo"`.',
      fn: 'saludo',
      starter: `function saludo(nombre) {

}`,
      solution: `function saludo(nombre) {
  return \`Hola, \${nombre || 'anónimo'}\`;
}`,
      tests: [
        { args: ['Ana'], expect: 'Hola, Ana' },
        { args: [''], expect: 'Hola, anónimo' },
        { args: [], expect: 'Hola, anónimo' },
        { args: ['Hugo'], expect: 'Hola, Hugo' },
      ],
    },
  ],

  'pg-js-control': [
    {
      kind: 'js',
      title: 'Suma hasta n',
      task: 'Escribe `sumaHasta(n)`, que devuelva 1 + 2 + … + n usando un bucle. Para `n = 0` devuelve 0.',
      fn: 'sumaHasta',
      starter: `function sumaHasta(n) {
  let total = 0;
  // tu bucle aquí
  return total;
}`,
      solution: `function sumaHasta(n) {
  let total = 0;
  for (let i = 1; i <= n; i++) total += i;
  return total;
}`,
      tests: [
        { args: [1], expect: 1 },
        { args: [5], expect: 15 },
        { args: [100], expect: 5050 },
        { args: [0], expect: 0 },
      ],
    },
    {
      kind: 'js',
      title: 'De nota a calificación',
      task: 'Escribe `calificacion(nota)`: menos de 5, `"Suspenso"`; de 5 a menos de 7, `"Aprobado"`; de 7 a menos de 9, `"Notable"`; 9 o más, `"Sobresaliente"`. Ojo con los límites.',
      fn: 'calificacion',
      starter: `function calificacion(nota) {

}`,
      solution: `function calificacion(nota) {
  if (nota < 5) return 'Suspenso';
  if (nota < 7) return 'Aprobado';
  if (nota < 9) return 'Notable';
  return 'Sobresaliente';
}`,
      tests: [
        { args: [4.9], expect: 'Suspenso' },
        { args: [5], expect: 'Aprobado' },
        { args: [6.99], expect: 'Aprobado' },
        { args: [7], expect: 'Notable' },
        { args: [8.5], expect: 'Notable' },
        { args: [9], expect: 'Sobresaliente' },
        { args: [10], expect: 'Sobresaliente' },
      ],
    },
  ],

  'pg-js-funciones': [
    {
      kind: 'js',
      title: 'Solo los aprobados, ordenados',
      task: 'Escribe `aprobados(notas)`, que reciba un array de notas y devuelva **un array nuevo** con las de 5 o más, ordenadas de menor a mayor. No modifiques el array original.',
      fn: 'aprobados',
      starter: `function aprobados(notas) {

}`,
      solution: `function aprobados(notas) {
  return notas.filter((n) => n >= 5).sort((a, b) => a - b);
}`,
      tests: [
        { args: [[4, 7, 9, 3, 6]], expect: [6, 7, 9] },
        { args: [[10, 5, 9]], expect: [5, 9, 10] },
        { args: [[]], expect: [] },
        { args: [[1, 2]], expect: [] },
      ],
    },
    {
      kind: 'js',
      title: 'Media de cada alumno',
      task: 'Escribe `medias(alumnos)`. Recibe un array como `[{ nombre: "Ana", notas: [8, 6] }]` y devuelve un objeto con la media de cada uno: `{ Ana: 7 }`.',
      fn: 'medias',
      starter: `function medias(alumnos) {
  const resultado = {};

  return resultado;
}`,
      solution: `function medias(alumnos) {
  const resultado = {};
  for (const a of alumnos) {
    resultado[a.nombre] = a.notas.reduce((s, n) => s + n, 0) / a.notas.length;
  }
  return resultado;
}`,
      tests: [
        { args: [[{ nombre: 'Ana', notas: [8, 6] }, { nombre: 'Luis', notas: [5] }]], expect: { Ana: 7, Luis: 5 } },
        { args: [[{ nombre: 'Eva', notas: [10, 9, 8] }]], expect: { Eva: 9 } },
        { args: [[]], expect: {} },
      ],
    },
  ],

  'pg-js-async': [
    {
      kind: 'js',
      title: 'Contar alumnos con fetch',
      task: 'Escribe la función asíncrona `contarAlumnos()`, que pida `http://localhost:8080/alumnos` con `fetch` y devuelva cuántos alumnos hay.',
      fn: 'contarAlumnos',
      starter: `async function contarAlumnos() {
  const respuesta = await fetch("http://localhost:8080/alumnos");

}`,
      solution: `async function contarAlumnos() {
  const respuesta = await fetch("http://localhost:8080/alumnos");
  const alumnos = await respuesta.json();
  return alumnos.length;
}`,
      tests: [{ args: [], expect: 2 }],
    },
    {
      kind: 'js',
      title: 'Nombres en mayúsculas',
      task: 'Escribe `nombres()`, que devuelva un array con los nombres de los alumnos de la API en mayúsculas: `["LUCÍA", "HUGO"]`.',
      fn: 'nombres',
      starter: `async function nombres() {

}`,
      solution: `async function nombres() {
  const r = await fetch("http://localhost:8080/alumnos");
  const datos = await r.json();
  return datos.map((a) => a.nombre.toUpperCase());
}`,
      tests: [{ args: [], expect: ['LUCÍA', 'HUGO'] }],
    },
    {
      kind: 'js',
      title: 'JSON a prueba de errores',
      task: 'Escribe `leerJson(texto)`, que devuelva el objeto que contiene el texto JSON o `null` si el texto no es JSON válido. No debe lanzar ningún error.',
      fn: 'leerJson',
      starter: `function leerJson(texto) {
  return JSON.parse(texto);
}`,
      solution: `function leerJson(texto) {
  try {
    return JSON.parse(texto);
  } catch (e) {
    return null;
  }
}`,
      tests: [
        { args: ['{"id": 1}'], expect: { id: 1 } },
        { args: ['{id: 1}'], expect: null },
        { args: ['[1, 2]'], expect: [1, 2] },
        { args: [''], expect: null },
      ],
    },
  ],

  'pg-java': [
    {
      kind: 'gaps',
      lang: 'java',
      title: 'Comparar un int',
      task: 'Corrige el método del supuesto de 2025: completa el hueco para que compile y compare el identificador.',
      code: `public boolean esAlumno(int id) {
    return idAlumno {{1}} id;
}`,
      gaps: [{ accept: ['=='] }],
      why: 'Con tipos primitivos se compara con ==. equals() es para objetos.',
    },
    {
      kind: 'gaps',
      lang: 'java',
      title: 'Comparar textos',
      task: 'Completa la condición para que se cumpla cuando el String `estado` contiene "ACTIVA".',
      code: `if ({{1}}) {
    activas++;
}`,
      gaps: [{ accept: ['estado.equals("ACTIVA")', '"ACTIVA".equals(estado)', 'Objects.equals(estado,"ACTIVA")', 'Objects.equals("ACTIVA",estado)'] }],
      why: 'Los String se comparan con equals: == comprobaría si son el mismo objeto. "ACTIVA".equals(estado) además no falla si estado es null.',
    },
    {
      kind: 'gaps',
      lang: 'java',
      title: 'Recorrer y hacer la media',
      task: 'Completa el bucle para que no se salga del array y calcula la media **con decimales**.',
      code: `int[] notas = {7, 5, 9, 8};
int suma = 0;
for (int i = 0; {{1}}; i++) {
    suma += notas[i];
}
double media = {{2}};`,
      gaps: [
        { accept: ['i<notas.length', 'notas.length>i', 'i<=notas.length-1'] },
        {
          accept: [
            '(double)suma/notas.length',
            'suma/(double)notas.length',
            '(double)suma/(double)notas.length',
            'suma*1.0/notas.length',
            '1.0*suma/notas.length',
            '(double)suma/4',
            'suma/4.0',
          ],
        },
      ],
      why: 'Los índices van de 0 a length − 1, así que la condición es i < notas.length. Para que la división no sea entera, uno de los dos operandos tiene que ser double: (double) suma / notas.length.',
    },
    {
      kind: 'gaps',
      lang: 'java',
      title: 'Excepciones comprobadas',
      task: 'Sin usar try/catch, haz que este main compile declarando la excepción.',
      code: `public static void main(String[] args) {{1}} {
    FileReader f = new FileReader("datos.txt");
}`,
      gaps: [{ accept: ['throws FileNotFoundException', 'throws IOException', 'throws Exception'] }],
      why: 'Una excepción comprobada hay que capturarla o declararla con throws en la firma del método.',
    },
    {
      kind: 'gaps',
      lang: 'java',
      title: 'Probar una excepción con JUnit',
      task: 'Completa la prueba para comprobar que el método lanza IllegalArgumentException (supuesto de 2025).',
      code: `@Test
void testException() {
    AlumnoService service = new AlumnoService();
    {{1}}(IllegalArgumentException.class, () -> service.obtenerMatriculas(-1));
}`,
      gaps: [{ accept: ['assertThrows', 'Assertions.assertThrows'] }],
      why: 'assertThrows(TipoDeExcepción.class, () -> código) pasa si el código lanza esa excepción.',
    },
  ],

  'pg-csharp': [
    {
      kind: 'gaps',
      lang: 'csharp',
      title: 'Un dato opcional',
      task: 'El teléfono es opcional: declara su tipo para que admita null (supuesto de 2024).',
      code: `public class Interesado
{
    public string Nombre { get; set; }
    public {{1}} Telefono { get; set; }
}`,
      gaps: [{ accept: ['int?', 'Nullable<int>', 'long?', 'Nullable<long>', 'string?', 'string'] }],
      why: 'int? (Nullable<int>) es un int que también puede valer null. (Un string ya admite null.)',
    },
    {
      kind: 'gaps',
      lang: 'csharp',
      title: 'Un método asíncrono',
      task: 'Completa la firma y la espera para que el método sea asíncrono y devuelva un int (supuesto de 2025).',
      code: `public {{1}} {{2}} DevolverDato()
{
    {{3}} Task.Delay(100);
    return 42;
}`,
      gaps: [{ accept: ['async'] }, { accept: ['Task<int>', 'ValueTask<int>'] }, { accept: ['await'] }],
      why: 'async en la firma, Task<int> como tipo de retorno (porque devuelve un int) y await para esperar a la tarea.',
    },
    {
      kind: 'gaps',
      lang: 'csharp',
      title: 'LINQ',
      task: 'Completa con los métodos de LINQ: quédate con las notas aprobadas y cuenta las suspensas.',
      code: `var notas = new List<int> { 4, 7, 9, 3, 6 };
var aprobadas = notas.{{1}}(n => n >= 5).ToList();
int suspensos = notas.{{2}}(n => n < 5);`,
      gaps: [{ accept: ['Where'] }, { accept: ['Count'] }],
      why: 'Where filtra y Count, con una condición, cuenta los que la cumplen.',
    },
    {
      kind: 'gaps',
      lang: 'csharp',
      title: 'Texto con variables',
      task: 'Imprime «Hola, Hugo» usando la variable nombre (con interpolación o concatenando).',
      code: `string nombre = "Hugo";
Console.WriteLine({{1}});`,
      gaps: [{ accept: ['$"Hola, {nombre}"', '"Hola, "+nombre', 'string.Format("Hola, {0}",nombre)', 'String.Format("Hola, {0}",nombre)', '$"Hola, {nombre}".ToString()'] }],
      why: 'Con $ delante, lo que va entre llaves se sustituye por su valor: $"Hola, {nombre}".',
    },
    {
      kind: 'gaps',
      lang: 'csharp',
      title: 'Nulos sin sustos',
      task: 'Calcula la longitud del email sin que falle si es null: en ese caso, 0.',
      code: `string? email = ObtenerEmail();
int longitud = email{{1}}Length {{2}} 0;`,
      gaps: [{ accept: ['?.'] }, { accept: ['??'] }],
      why: '?. solo accede si no es null (si lo es, da null) y ?? pone el valor por defecto.',
    },
  ],
};

// Para comparar: sin espacios fuera de las comillas.
export function normalizeGap(text) {
  let out = '';
  let quote = null;
  for (const ch of text.trim().replace(/;$/, '')) {
    if (quote) {
      out += ch;
      if (ch === quote) quote = null;
    } else if (ch === '"' || ch === "'") {
      quote = ch;
      out += ch;
    } else if (!/\s/.test(ch)) out += ch;
  }
  return out;
}

export const gapOk = (gap, text) => gap.accept.some((a) => normalizeGap(a) === normalizeGap(text));
