// Editor de código mínimo: un textarea monoespaciado donde Tab sangra con
// dos espacios (Mayús+Tab quita la sangría) y Ctrl/Cmd+Intro ejecuta.
// Esc suelta el foco, para que Tab no deje atrapado a quien usa el teclado.
export default function CodeEditor({ value, onChange, onRun, label = 'Código', rows, className = '' }) {
  const onKeyDown = (e) => {
    const el = e.currentTarget;
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      onRun?.();
    } else if (e.key === 'Escape') {
      el.blur();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const { selectionStart: start, selectionEnd: end } = el;
      const lineStart = value.lastIndexOf('\n', start - 1) + 1;
      if (e.shiftKey) {
        const remove = value.slice(lineStart, lineStart + 2).match(/^ {1,2}/)?.[0].length ?? 0;
        if (!remove) return;
        onChange(value.slice(0, lineStart) + value.slice(lineStart + remove));
        requestAnimationFrame(() => el.setSelectionRange(Math.max(lineStart, start - remove), Math.max(lineStart, end - remove)));
      } else {
        onChange(value.slice(0, start) + '  ' + value.slice(end));
        requestAnimationFrame(() => el.setSelectionRange(start + 2, start + 2));
      }
    }
  };
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      spellCheck={false}
      autoCapitalize="off"
      autoCorrect="off"
      autoComplete="off"
      rows={rows ?? Math.min(18, Math.max(4, value.split('\n').length + 1))}
      aria-label={label}
      className={`w-full resize-y rounded-lg border border-gray-600 bg-[#1d2021] p-3 font-mono text-[13px] leading-relaxed text-gray-100 outline-none focus:border-yellow-400 ${className}`}
    />
  );
}

// Salida de consola común (ejercicios, retos y editor libre).
export function ConsoleOutput({ lines, empty = '(No imprime nada)', className = 'max-h-64' }) {
  return (
    <div className={`overflow-y-auto rounded-lg border border-gray-700 bg-black/40 p-3 font-mono text-[13px] ${className}`} role="log" aria-label="Salida de la consola">
      {lines.length === 0 && <p className="text-gray-500">{empty}</p>}
      {lines.map((l, i) => (
        <p
          key={i}
          className={`whitespace-pre-wrap break-words ${l.kind === 'error' ? 'text-red-400' : l.kind === 'warn' ? 'text-yellow-300' : l.kind === 'info' ? 'text-blue-300' : 'text-gray-200'}`}
        >
          {l.text}
        </p>
      ))}
    </div>
  );
}
