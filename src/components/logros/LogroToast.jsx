import { useEffect } from 'react';
import { href } from '../../hooks/useRoute';

// Aviso de logro desbloqueado: aparece abajo a la derecha, no bloquea lo que
// estás haciendo y se cierra solo a los 6 segundos (o con la X).
export default function LogroToast({ logro, onClose }) {
  useEffect(() => {
    if (!logro) return undefined;
    const t = setTimeout(onClose, 6000);
    return () => clearTimeout(t);
  }, [logro, onClose]);

  if (!logro) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 flex w-[calc(100%-2rem)] max-w-sm animate-[toast_.35s_ease-out] items-center gap-3 rounded-xl border border-yellow-700 bg-gray-900 p-4 shadow-2xl sm:w-auto"
    >
      <span className="text-3xl" aria-hidden="true">
        {logro.icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-yellow-400">Logro desbloqueado</p>
        <p className="font-semibold text-gray-100">{logro.name}</p>
        <p className="text-sm text-gray-400">{logro.desc}</p>
        <a href={href('logros')} onClick={onClose} className="text-xs text-yellow-300 hover:text-yellow-200">
          Ver mis logros →
        </a>
      </div>
      <button type="button" onClick={onClose} className="self-start text-xl leading-none text-gray-500 hover:text-gray-200" aria-label="Cerrar">
        ×
      </button>
    </div>
  );
}
