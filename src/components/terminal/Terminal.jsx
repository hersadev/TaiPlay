import { useEffect, useRef, useState } from 'react';
import { commands } from '../../engine/terminal/commands.js';
import { getNode, resolve } from '../../engine/terminal/vfs.js';

const COMMAND_NAMES = [...Object.keys(commands), 'docker', 'docker-compose', 'sudo', 'exit'].sort();
const DOCKER_SUBS = ['build', 'compose', 'exec', 'history', 'images', 'inspect', 'kill', 'logs', 'ps', 'pull', 'restart', 'rm', 'rmi', 'run', 'start', 'stop', 'tag', 'version'];
const COMPOSE_SUBS = ['build', 'config', 'down', 'exec', 'logs', 'ps', 'restart', 'start', 'stop', 'up', 'version'];

// Autocompletado con Tab: la primera palabra se completa con órdenes, la
// segunda de «docker» con subórdenes, y el resto con ficheros y carpetas.
function complete(sh, line) {
  const m = line.match(/^(.*?)(\S*)$/);
  const before = m[1];
  const word = m[2];
  const words = before.trim().split(/\s+/).filter(Boolean);
  let candidates;
  if (words.length === 0 || (words.length === 1 && words[0] === 'sudo')) {
    candidates = COMMAND_NAMES.filter((c) => c.startsWith(word));
  } else if (words.length === 1 && words[0] === 'docker') {
    candidates = DOCKER_SUBS.filter((c) => c.startsWith(word));
  } else if ((words.length === 2 && words[0] === 'docker' && words[1] === 'compose') || (words.length === 1 && words[0] === 'docker-compose')) {
    candidates = COMPOSE_SUBS.filter((c) => c.startsWith(word));
  } else {
    const ctx = sh.ctx;
    const slash = word.lastIndexOf('/');
    const dirPart = slash >= 0 ? word.slice(0, slash + 1) : '';
    const prefix = word.slice(slash + 1);
    const dir = getNode(ctx.fs, resolve(dirPart || '.', ctx.cwd, ctx.home));
    if (dir?.type !== 'dir') return null;
    candidates = Object.entries(dir.children)
      .filter(([n]) => n.startsWith(prefix) && (prefix.startsWith('.') || !n.startsWith('.')))
      .map(([n, node]) => dirPart + n + (node.type === 'dir' ? '/' : ''));
  }
  if (candidates.length === 0) return null;
  if (candidates.length === 1) {
    const c = candidates[0];
    return { line: before + c + (c.endsWith('/') ? '' : ' ') };
  }
  // Prefijo común; si no avanza, se muestran las opciones.
  let common = candidates[0];
  for (const c of candidates) while (!c.startsWith(common)) common = common.slice(0, -1);
  return common.length > word.length ? { line: before + common } : { options: candidates };
}

export default function Terminal({ shell, onCommand, className = '' }) {
  const [input, setInput] = useState('');
  const [, setTick] = useState(0);
  const [histIdx, setHistIdx] = useState(null);
  const [suggestions, setSuggestions] = useState(null);
  const inputRef = useRef(null);
  const scrollRef = useRef(null);

  // Se desplaza solo el panel de la terminal (scrollIntoView movería también
  // la página entera, y en el móvil saltaría lejos del texto de la lección).
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  });

  // Foco automático solo en pantallas anchas: en el móvil abriría el teclado
  // y llevaría la página hasta la terminal nada más entrar.
  useEffect(() => {
    if (window.matchMedia?.('(min-width: 1024px)').matches) inputRef.current?.focus({ preventScroll: true });
  }, [shell]);

  // Al cambiar de lección llega una shell nueva: se limpia la línea.
  useEffect(() => {
    setInput('');
    setHistIdx(null);
    setSuggestions(null);
  }, [shell]);

  const submit = () => {
    shell.run(input);
    setInput('');
    setHistIdx(null);
    setSuggestions(null);
    setTick((t) => t + 1);
    onCommand?.(shell);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submit();
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const h = shell.history;
      if (!h.length) return;
      let i = histIdx ?? h.length;
      i = e.key === 'ArrowUp' ? Math.max(0, i - 1) : i + 1;
      if (i >= h.length) {
        setHistIdx(null);
        setInput('');
      } else {
        setHistIdx(i);
        setInput(h[i]);
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const r = shell.complete ? shell.complete(input) : complete(shell, input);
      if (r?.line !== undefined) {
        setInput(r.line);
        setSuggestions(null);
      } else setSuggestions(r?.options ?? null);
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      shell.screen = [];
      setTick((t) => t + 1);
    } else if (e.key === 'c' && e.ctrlKey) {
      e.preventDefault();
      shell.screen.push({ kind: 'cmd', prompt: shell.prompt(), text: input + '^C' });
      setInput('');
      setTick((t) => t + 1);
    }
  };

  const isPs = shell.kind === 'powershell';
  const help = {
    ios: 'Escribe una orden y pulsa Intro. «?» muestra lo que puedes escribir en cada momento; Tab autocompleta.',
    powershell: 'Escribe un cmdlet y pulsa Intro. «Get-Help» explica cómo funciona; «Get-Command *texto*» busca cmdlets; Tab autocompleta.',
  }[shell.kind] ?? 'Escribe una orden y pulsa Intro. «help» muestra las órdenes disponibles; Tab autocompleta.';

  return (
    <div
      className={`flex min-h-0 flex-col overflow-hidden rounded-lg border font-mono text-[13px] leading-relaxed ${isPs ? 'border-[#1f3f73] bg-[#012456]' : 'border-gray-700 bg-[#1d2021]'} ${className}`}
      onClick={() => {
        if (!window.getSelection()?.toString()) inputRef.current?.focus();
      }}
    >
      <div className="flex items-center gap-2 border-b border-gray-800 bg-gray-900 px-3 py-1.5 text-xs text-gray-500">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
        <span className="ml-2 truncate">{shell.title ?? (shell.ctx.container ? `contenedor ${shell.ctx.host}` : `${shell.hostCtx?.user ?? 'alumno'}@${shell.hostCtx?.host ?? 'web01'} — simulador`)}</span>
      </div>
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-3 py-2" role="log" aria-live="polite">
        {shell.screen.length === 0 && <div className={isPs ? 'text-blue-200/60' : 'text-gray-500'}>{help}</div>}
        {shell.screen.map((l, i) =>
          l.kind === 'cmd' ? (
            <div key={i} className="whitespace-pre-wrap break-all">
              <Prompt text={l.prompt} />
              <span className="text-gray-100"> {l.text}</span>
            </div>
          ) : (
            <div key={i} className={`whitespace-pre-wrap break-words ${l.kind === 'err' ? (isPs ? 'text-red-300' : 'text-red-400') : isPs ? 'text-gray-100' : 'text-gray-300'}`}>
              {l.text}
            </div>
          ),
        )}
        {suggestions && <div className="whitespace-pre-wrap text-gray-400">{suggestions.join('   ')}</div>}
        <div className="flex items-center">
          <Prompt text={shell.prompt()} />
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            className="ml-2 min-w-0 flex-1 bg-transparent text-gray-100 caret-yellow-400 outline-none"
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            aria-label={{ ios: 'Orden de la consola del switch', powershell: 'Orden de PowerShell' }[shell.kind] ?? 'Orden de la terminal'}
          />
        </div>
      </div>
    </div>
  );
}

function Prompt({ text }) {
  if (text.startsWith('PS ')) return <span className="shrink-0 text-gray-100">{text}</span>;
  const m = text.match(/^(.*?)@(.*?):(.*)([$#])$/);
  if (!m) return <span className="text-green-400">{text}</span>;
  return (
    <span className="shrink-0">
      <span className={m[1] === 'root' ? 'text-red-400' : 'text-green-400'}>{m[1]}@{m[2]}</span>
      <span className="text-gray-400">:</span>
      <span className="text-blue-400">{m[3]}</span>
      <span className="text-gray-300">{m[4]}</span>
    </span>
  );
}
