import { lazy, Suspense, useCallback, useState } from 'react';
import { useRoute, href } from './hooks/useRoute';
import { useProgress } from './store/progress';
import HomePage from './pages/HomePage';
import LogroToast from './components/logros/LogroToast';
import WelcomePanel from './components/ui/WelcomePanel';
import { useAchievements, useLevel } from './hooks/useAchievements';

// Cada apartado se descarga al entrar en él: los simuladores (terminal, IOS,
// SQL…) y sus lecciones no tienen por qué viajar en la carga inicial.
const named = (load, name) => lazy(() => load().then((m) => ({ default: m[name] })));
const learn = () => import('./pages/LearnPage');
const TracksPage = named(learn, 'TracksPage');
const TrackPage = named(learn, 'TrackPage');
const NotFound = named(learn, 'NotFound');
const LessonPage = lazy(() => import('./pages/LessonPage'));
const BankPage = lazy(() => import('./pages/BankPage'));
const supuestos = () => import('./pages/SupuestosPage');
const SupuestosList = named(supuestos, 'SupuestosList');
const SupuestoPage = named(supuestos, 'SupuestoPage');
const SimulacroPage = lazy(() => import('./pages/SimulacroPage'));
const temario = () => import('./pages/TemarioPage');
const TemarioPage = named(temario, 'TemarioPage');
const TemaPage = named(temario, 'TemaPage');
const LogrosPage = lazy(() => import('./pages/LogrosPage'));
const EditorPage = lazy(() => import('./pages/EditorPage'));
const ProgresoPage = lazy(() => import('./pages/ProgresoPage'));

const NAV = [
  ['aprende', 'Aprende'],
  ['temario', 'Temario'],
  ['preguntas', 'Preguntas'],
  ['supuestos', 'Supuestos'],
  ['simulacro', 'Simulacro'],
  ['editor', 'Editor'],
  ['progreso', 'Progreso'],
];

function Page({ segments, params }) {
  const [a, b, c] = segments;
  switch (a) {
    case undefined:
      return <HomePage />;
    case 'aprende':
      if (c) return <LessonPage trackId={b} lessonId={c} />;
      if (b) return <TrackPage trackId={b} />;
      return <TracksPage />;
    case 'temario':
      return b ? <TemaPage key={b} temaId={b} /> : <TemarioPage />;
    case 'preguntas':
      return <BankPage params={params} />;
    case 'supuestos':
      return b && c ? <SupuestoPage key={b + c + params.get('modo')} examId={b} partId={c} params={params} /> : <SupuestosList />;
    case 'simulacro':
      return <SimulacroPage />;
    case 'logros':
      return <LogrosPage />;
    case 'editor':
      return <EditorPage />;
    case 'progreso':
      return <ProgresoPage />;
    default:
      return <NotFound />;
  }
}

export default function App() {
  const { segments, params } = useRoute();
  const section = segments[0];
  const { current: logro, dismiss } = useAchievements();
  const level = useLevel();
  const welcomed = useProgress((s) => s.welcomed);
  const markWelcomed = useProgress((s) => s.markWelcomed);
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const closeWelcome = useCallback(() => {
    setWelcomeOpen(false);
    markWelcomed();
  }, [markWelcomed]);
  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-20 border-b border-gray-800 bg-gray-950/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4">
          <a href={href('')} onClick={() => setMenuOpen(false)} className="flex items-center gap-2 font-semibold text-gray-100">
            <span className="font-mono text-green-400">›_</span>
            <span className="hidden sm:inline">
              Tai<span className="text-yellow-400">Play</span>
            </span>
          </a>
          <nav className="ml-auto hidden gap-1 text-sm lg:flex">
            {NAV.map(([path, label]) => (
              <a
                key={path}
                href={href(path)}
                className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 xl:px-3 ${
                  section === path ? 'bg-gray-800 text-yellow-300' : 'text-gray-300 hover:bg-gray-900 hover:text-gray-100'
                }`}
              >
                {label}
              </a>
            ))}
          </nav>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-controls="menu-movil"
            aria-label={menuOpen ? 'Cerrar el menú' : 'Abrir el menú'}
            className="ml-auto flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-gray-700 px-2.5 text-sm text-gray-300 hover:border-gray-500 hover:text-gray-100 lg:hidden"
          >
            <span aria-hidden="true">{menuOpen ? '✕' : '☰'}</span>
            {NAV.find(([path]) => path === section)?.[1] ?? 'Menú'}
          </button>
          <button
            type="button"
            onClick={() => setWelcomeOpen(true)}
            title="Qué es TaiPlay y qué hay en cada apartado"
            aria-label="Abrir la bienvenida"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-gray-700 text-sm text-gray-300 hover:border-gray-500 hover:text-gray-100"
          >
            ?
          </button>
          <a
            href={href('logros')}
            title={`Nivel ${level.n}: ${level.name} · ${level.xp} puntos`}
            className={`shrink-0 rounded-lg px-2 py-1.5 text-sm ${section === 'logros' ? 'bg-gray-800 text-yellow-300' : 'text-gray-300 hover:bg-gray-900'}`}
          >
            🏆 <span className="font-mono">Nv {level.n}</span>
          </a>
        </div>
        {menuOpen && (
          <nav id="menu-movil" className="grid grid-cols-2 gap-1 border-t border-gray-800 px-4 py-3 text-sm lg:hidden">
            {NAV.map(([path, label]) => (
              <a
                key={path}
                href={href(path)}
                onClick={() => setMenuOpen(false)}
                className={`rounded-lg px-3 py-2.5 ${section === path ? 'bg-gray-800 text-yellow-300' : 'text-gray-300 hover:bg-gray-900 hover:text-gray-100'}`}
              >
                {label}
              </a>
            ))}
          </nav>
        )}
      </header>
      <LogroToast logro={logro} onClose={dismiss} />
      {(welcomeOpen || !welcomed) && <WelcomePanel onClose={closeWelcome} />}
      <main className="flex-1">
        <Suspense fallback={<p className="px-4 py-8 text-center text-sm text-gray-500">Cargando…</p>}>
          <Page segments={segments} params={params} />
        </Suspense>
      </main>
      {section !== 'aprende' && <Footer />}
    </div>
  );
}

function Footer() {
  const reset = useProgress((s) => s.reset);
  const [confirm, setConfirm] = useState(false);
  return (
    <footer className="border-t border-gray-800 px-4 py-6 text-xs text-gray-500">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2">
        <span>
          Preguntas de los cuestionarios oficiales del INAP; respuestas según las plantillas definitivas publicadas por el tribunal. Las
          explicaciones son de TaiPlay.
        </span>
        <span className="ml-auto">
          {confirm ? (
            <>
              ¿Borrar todo tu progreso?{' '}
              <button
                type="button"
                onClick={() => {
                  reset();
                  setConfirm(false);
                }}
                className="text-red-400 hover:text-red-300"
              >
                Sí, borrar
              </button>{' '}
              ·{' '}
              <button type="button" onClick={() => setConfirm(false)} className="hover:text-gray-300">
                No
              </button>
            </>
          ) : (
            <button type="button" onClick={() => setConfirm(true)} className="hover:text-gray-300">
              Reiniciar progreso
            </button>
          )}
        </span>
      </div>
    </footer>
  );
}
