// Analizador YAML mínimo, lo justo para los ficheros de Docker Compose:
// mapas y listas por sangría, listas de mapas («- clave: valor»), listas y
// mapas en línea ([a, b] y {a: b}), comillas, comentarios y bloques | y >.
// Todos los valores escalares se devuelven como texto.
//
// Lanza un Error con el mismo estilo que Compose («yaml: line N: …») si la
// sangría o la sintaxis están mal, para que el alumno aprenda a leerlos.

function stripComment(s) {
  let q = null;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) {
      if (c === q) q = null;
    } else if (c === '"' || c === "'") q = c;
    else if (c === '#' && (i === 0 || /\s/.test(s[i - 1]))) return s.slice(0, i);
  }
  return s;
}

function scalar(raw, lineNo) {
  const v = raw.trim();
  if (v === '' || v === '~' || v === 'null') return null;
  if ((v.startsWith('"') && v.endsWith('"') && v.length > 1) || (v.startsWith("'") && v.endsWith("'") && v.length > 1)) return v.slice(1, -1);
  if (v.startsWith('"') || v.startsWith("'")) throw new Error(`yaml: line ${lineNo}: found unexpected end of stream (faltan las comillas de cierre)`);
  if (v.startsWith('[')) {
    if (!v.endsWith(']')) throw new Error(`yaml: line ${lineNo}: did not find expected ',' or ']'`);
    const inner = v.slice(1, -1).trim();
    return inner ? splitFlow(inner).map((x) => scalar(x, lineNo)) : [];
  }
  if (v.startsWith('{')) {
    if (!v.endsWith('}')) throw new Error(`yaml: line ${lineNo}: did not find expected ',' or '}'`);
    const out = {};
    for (const part of splitFlow(v.slice(1, -1))) {
      const m = part.match(/^\s*([^:]+?)\s*:\s*(.*)$/);
      if (m) out[unquote(m[1])] = scalar(m[2], lineNo);
    }
    return out;
  }
  return v;
}

const unquote = (k) => k.trim().replace(/^(["'])(.*)\1$/, '$2');

function splitFlow(s) {
  const parts = [];
  let cur = '';
  let q = null;
  for (const c of s) {
    if (q) {
      if (c === q) q = null;
      cur += c;
    } else if (c === '"' || c === "'") {
      q = c;
      cur += c;
    } else if (c === ',') {
      parts.push(cur);
      cur = '';
    } else cur += c;
  }
  if (cur.trim()) parts.push(cur);
  return parts;
}

const KEY = /^((?:"[^"]*"|'[^']*'|[^:#]+?)):(?:\s+(.*)|\s*)$/;

export function parseYaml(text) {
  const rows = [];
  text.split('\n').forEach((line, i) => {
    const lead = line.match(/^[ \t]*/)[0];
    if (lead.includes('\t') && line.trim()) throw new Error(`yaml: line ${i + 1}: found a tab character that violates indentation (en YAML se sangra con espacios, nunca con tabuladores)`);
    const body = stripComment(line).trimEnd();
    if (!body.trim()) {
      rows.push({ blank: true, n: i + 1, raw: line });
      return;
    }
    rows.push({ indent: lead.length, text: body.trim(), n: i + 1, raw: line });
  });
  const lines = rows;
  let i = 0;
  const skip = () => {
    while (i < lines.length && lines[i].blank) i++;
  };

  function block(indent) {
    skip();
    if (i >= lines.length) return null;
    const first = lines[i];
    if (first.indent < indent) return null;
    return first.text === '-' || first.text.startsWith('- ') ? seq(first.indent) : map(first.indent);
  }

  function blockScalar(parentIndent, folded) {
    const parts = [];
    i++;
    let base = null;
    while (i < lines.length) {
      const l = lines[i];
      if (l.blank) {
        parts.push('');
        i++;
        continue;
      }
      if (l.indent <= parentIndent) break;
      base ??= l.indent;
      parts.push(l.raw.slice(base));
      i++;
    }
    while (parts.length && parts[parts.length - 1] === '') parts.pop();
    return folded ? parts.join(' ') + '\n' : parts.join('\n') + '\n';
  }

  function value(rest, indent, lineNo) {
    if (rest === '|' || rest === '>' || rest === '|-' || rest === '>-') return blockScalar(indent, rest.startsWith('>'));
    i++;
    if (rest !== undefined && rest !== '') return scalar(rest, lineNo);
    skip();
    if (i >= lines.length) return null;
    const next = lines[i];
    if (next.indent > indent) return block(next.indent);
    // Compose admite listas a la misma altura que su clave («ports:\n- 80:80»).
    if (next.indent === indent && (next.text === '-' || next.text.startsWith('- '))) return seq(indent);
    return null;
  }

  function map(indent) {
    const out = {};
    while (true) {
      skip();
      if (i >= lines.length) break;
      const l = lines[i];
      if (l.indent < indent) break;
      if (l.indent > indent) throw new Error(`yaml: line ${l.n}: mapping values are not allowed in this context (sangría inesperada)`);
      if (l.text === '-' || l.text.startsWith('- ')) break;
      const m = l.text.match(KEY);
      if (!m) throw new Error(`yaml: line ${l.n}: could not find expected ':'`);
      const key = unquote(m[1]);
      if (key in out) throw new Error(`yaml: line ${l.n}: mapping key "${key}" already defined`);
      out[key] = value(m[2], indent, l.n);
    }
    return out;
  }

  function seq(indent) {
    const out = [];
    while (true) {
      skip();
      if (i >= lines.length) break;
      const l = lines[i];
      if (l.indent !== indent || !(l.text === '-' || l.text.startsWith('- '))) {
        if (l.indent > indent) throw new Error(`yaml: line ${l.n}: did not find expected '-' indicator`);
        break;
      }
      const content = l.text === '-' ? '' : l.text.slice(2).trimStart();
      if (!content) {
        i++;
        out.push(block(indent + 1));
        continue;
      }
      if (KEY.test(content) && !/^["']/.test(content.trim()) || /^[\w.-]+:\s*$/.test(content)) {
        // «- clave: valor» abre un mapa cuya sangría es la del contenido.
        const inner = indent + (l.text.length - content.length);
        lines[i] = { ...l, indent: inner, text: content };
        out.push(map(inner));
        continue;
      }
      i++;
      out.push(scalar(content, l.n));
    }
    return out;
  }

  const result = block(0);
  skip();
  if (i < lines.length) throw new Error(`yaml: line ${lines[i].n}: did not find expected key`);
  return result ?? {};
}

// Vuelca un valor a YAML (para «docker compose config»).
export function dumpYaml(v, indent = 0) {
  const pad = ' '.repeat(indent);
  if (Array.isArray(v)) return v.map((x) => (x && typeof x === 'object' ? `${pad}- ${dumpYaml(x, indent + 2).trimStart()}` : `${pad}- ${fmt(x)}`)).join('\n');
  if (v && typeof v === 'object') {
    return Object.entries(v)
      .map(([k, x]) => {
        if (x && typeof x === 'object' && (Array.isArray(x) ? x.length : Object.keys(x).length)) return `${pad}${k}:\n${dumpYaml(x, indent + 2)}`;
        if (x && typeof x === 'object') return `${pad}${k}: ${Array.isArray(x) ? '[]' : '{}'}`;
        return `${pad}${k}: ${fmt(x)}`;
      })
      .join('\n');
  }
  return pad + fmt(v);
}

const fmt = (x) => (x === null ? 'null' : /^[\w./-]+$/.test(String(x)) && !/^\d+:\d+$/.test(String(x)) ? String(x) : JSON.stringify(String(x)));
