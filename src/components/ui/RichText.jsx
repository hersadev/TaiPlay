// Texto enriquecido mínimo para lecciones y enunciados:
//   párrafos separados por línea en blanco, «## » subtítulo, «- » lista,
//   ``` bloque de código ```, y en línea `código`, **negrita** y *cursiva*.

function inline(text, keyBase) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*\s][^*]*\*)/g);
  return parts.map((p, i) => {
    const key = `${keyBase}-${i}`;
    if (p.startsWith('`') && p.endsWith('`') && p.length > 1)
      return (
        <code key={key} className="rounded bg-gray-800 px-1 py-0.5 font-mono text-[0.92em] text-yellow-300">
          {p.slice(1, -1)}
        </code>
      );
    if (p.startsWith('**') && p.endsWith('**')) return <strong key={key} className="font-semibold text-gray-100">{p.slice(2, -2)}</strong>;
    if (p.startsWith('*') && p.endsWith('*') && p.length > 2) return <em key={key}>{p.slice(1, -1)}</em>;
    return p;
  });
}

function blocks(text) {
  const out = [];
  const lines = text.split('\n');
  let para = [];
  let list = null;
  const flushPara = () => {
    if (para.length) out.push({ type: 'p', text: para.join(' ') });
    para = [];
  };
  const flushList = () => {
    if (list) out.push({ type: 'ul', items: list });
    list = null;
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().startsWith('```')) {
      flushPara();
      flushList();
      const code = [];
      for (i++; i < lines.length && !lines[i].trim().startsWith('```'); i++) code.push(lines[i]);
      out.push({ type: 'code', text: code.join('\n') });
      continue;
    }
    if (!line.trim()) {
      flushPara();
      flushList();
    } else if (line.startsWith('## ')) {
      flushPara();
      flushList();
      out.push({ type: 'h', text: line.slice(3) });
    } else if (/^\s*- /.test(line)) {
      flushPara();
      const nested = /^\s{2,}- /.test(line);
      list ??= [];
      list.push({ text: line.replace(/^\s*- /, ''), nested });
    } else if (list) {
      list[list.length - 1].text += ' ' + line.trim();
    } else {
      para.push(line.trim());
    }
  }
  flushPara();
  flushList();
  return out;
}

export default function RichText({ text, className = '' }) {
  return (
    <div className={`space-y-3 leading-relaxed text-gray-200 ${className}`}>
      {blocks(text).map((b, i) => {
        if (b.type === 'h') return <h3 key={i} className="pt-2 text-base font-semibold text-yellow-400">{b.text}</h3>;
        if (b.type === 'code')
          return (
            <pre key={i} className="overflow-x-auto rounded-md bg-gray-950 p-3 font-mono text-sm leading-snug text-green-300">
              {b.text}
            </pre>
          );
        if (b.type === 'ul')
          return (
            <ul key={i} className="space-y-1.5">
              {b.items.map((it, j) => (
                <li key={j} className={`flex gap-2 ${it.nested ? 'ml-6' : ''}`}>
                  <span className="mt-[0.6em] h-1.5 w-1.5 shrink-0 rounded-full bg-yellow-400/70" />
                  <span>{inline(it.text, `${i}-${j}`)}</span>
                </li>
              ))}
            </ul>
          );
        return <p key={i}>{inline(b.text, i)}</p>;
      })}
    </div>
  );
}
