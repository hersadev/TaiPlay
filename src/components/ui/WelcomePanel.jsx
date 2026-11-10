import { useEffect, useRef } from 'react';
import { href } from '../../hooks/useRoute';
import { SECTIONS, LOGROS_SECTION } from '../../data/secciones';

// Panel de bienvenida: se abre solo en la primera visita y luego desde el
// botón «?» de la cabecera. Se cierra con la X, con Escape o pulsando fuera.
export default function WelcomePanel({ onClose }) {
  const closeRef = useRef(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-title"
        className="flex max-h-[92vh] w-full max-w-2xl flex-col rounded-t-2xl border border-gray-700 bg-gray-950 shadow-2xl sm:rounded-2xl"
      >
        <div className="flex items-start gap-3 border-b border-gray-800 p-5">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-sm text-green-400">alumno@taiplay:~$ ./bienvenida</p>
            <h2 id="welcome-title" className="mt-1 text-2xl font-bold text-gray-100">
              Te damos la bienvenida a Tai<span className="text-yellow-400">Play</span>
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="text-2xl leading-none text-gray-500 hover:text-gray-200"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto p-5">
          <p className="text-gray-300">
            TaiPlay es una plataforma para preparar la oposición de <strong className="text-gray-100">Técnico Auxiliar de Informática</strong>{' '}
            (TAI) de la Administración del Estado practicando, aunque partas de cero. Aprendes cada tema con ejercicios en el propio
            navegador y entrenas con las preguntas y supuestos reales de los exámenes.
          </p>
          <p className="mt-2 text-sm text-gray-400">
            No necesitas cuenta: tu progreso se guarda en este navegador.
          </p>

          <h3 className="mt-5 text-sm font-semibold uppercase tracking-wide text-gray-400">Apartados</h3>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {[...SECTIONS, LOGROS_SECTION].map((s) => (
              <li key={s.path}>
                <a
                  href={href(s.path)}
                  onClick={onClose}
                  className="group flex h-full gap-3 rounded-xl border border-gray-800 bg-gray-900 p-3 hover:border-yellow-400"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gray-800 font-mono text-yellow-400">{s.icon}</span>
                  <span className="min-w-0">
                    <span className="block font-semibold text-gray-100 group-hover:text-yellow-300">{s.title}</span>
                    <span className="block text-sm text-gray-400">{s.text}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-gray-800 p-5">
          <p className="min-w-0 flex-1 text-sm text-gray-400">¿Partes de cero? Empieza por la primera ruta de Aprende.</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-yellow-400 px-5 py-2.5 font-semibold text-gray-950 hover:bg-yellow-300"
          >
            Empezar
          </button>
        </div>
      </div>
    </div>
  );
}
