// Analizador de la línea de comandos. Entiende lo que un TAI necesita leer
// y escribir con soltura: comillas simples y dobles, tuberías (|),
// redirecciones (>, >>), y encadenar órdenes con ; y &&.
//
// Devuelve una lista de pasos { op, pipeline }, donde op es ';' o '&&'
// (cómo se une con el paso anterior) y pipeline es una lista de órdenes
// { argv, redirect }, con redirect = { append, target } o null.
// Lanza un Error con un mensaje en español si la sintaxis está mal.

function tokenize(line) {
  const tokens = [];
  let cur = '';
  let has = false; // distingue "" (argumento vacío) de no haber argumento
  let quote = null;
  const push = () => {
    if (has) tokens.push({ word: cur });
    cur = '';
    has = false;
  };
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quote) {
      if (ch === quote) quote = null;
      else cur += ch;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      has = true;
    } else if (ch === ' ' || ch === '\t') {
      push();
    } else if (ch === '|' || ch === ';') {
      push();
      tokens.push({ op: ch });
    } else if (ch === '&' && line[i + 1] === '&') {
      push();
      tokens.push({ op: '&&' });
      i++;
    } else if (ch === '>') {
      push();
      if (line[i + 1] === '>') {
        tokens.push({ op: '>>' });
        i++;
      } else tokens.push({ op: '>' });
    } else {
      cur += ch;
      has = true;
    }
  }
  if (quote) throw new Error('Falta cerrar unas comillas ' + quote);
  push();
  return tokens;
}

export function parse(line) {
  const tokens = tokenize(line);
  const steps = [];
  let pipeline = [];
  let cmd = { argv: [], redirect: null };
  let joinOp = ';';

  const endCmd = (opName) => {
    if (cmd.argv.length === 0) throw new Error(`Error de sintaxis cerca de «${opName}»`);
    pipeline.push(cmd);
    cmd = { argv: [], redirect: null };
  };
  const endStep = (opName) => {
    endCmd(opName);
    steps.push({ op: joinOp, pipeline });
    pipeline = [];
  };

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if ('word' in t) {
      cmd.argv.push(t.word);
    } else if (t.op === '>' || t.op === '>>') {
      const target = tokens[i + 1];
      if (!target || !('word' in target)) throw new Error(`Falta el fichero de destino tras «${t.op}»`);
      cmd.redirect = { append: t.op === '>>', target: target.word };
      i++;
    } else if (t.op === '|') {
      endCmd('|');
    } else {
      endStep(t.op);
      joinOp = t.op;
    }
  }
  if (cmd.argv.length > 0 || pipeline.length > 0) {
    endCmd(joinOp);
    steps.push({ op: joinOp, pipeline });
  } else if (joinOp === '&&') {
    throw new Error('Error de sintaxis: «&&» al final de la línea');
  }
  return steps;
}

// Separa opciones cortas agrupadas: ['-la', 'x'] -> flags {l, a}, args ['x'].
// Las opciones que llevan valor (p. ej. -n 5) se piden en withValue.
// "--" corta el análisis; las opciones largas (--algo=x) van a long.
export function getopts(argv, withValue = '') {
  const flags = {};
  const long = {};
  const args = [];
  let rest = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (rest || a === '-' || !a.startsWith('-')) {
      args.push(a);
    } else if (a === '--') {
      rest = true;
    } else if (a.startsWith('--')) {
      const [k, v] = a.slice(2).split('=');
      long[k] = v ?? true;
    } else {
      for (let j = 1; j < a.length; j++) {
        const f = a[j];
        if (withValue.includes(f)) {
          const inline = a.slice(j + 1);
          flags[f] = inline || argv[++i];
          break;
        }
        // -5 en head/tail equivale a -n 5
        if (/\d/.test(f) && withValue.includes('n')) {
          flags.n = a.slice(j);
          break;
        }
        flags[f] = true;
      }
    }
  }
  return { flags, long, args };
}
