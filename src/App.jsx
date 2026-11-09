import { useState } from 'react';
import { useRoute, href } from './hooks/useRoute';
import { useProgress } from './store/progress';
import HomePage from './pages/HomePage';
import { TracksPage, TrackPage, NotFound } from './pages/LearnPage';
import LessonPage from './pages/LessonPage';
import BankPage from './pages/BankPage';
import { SupuestosList, SupuestoPage } from './pages/SupuestosPage';
import SimulacroPage from './pages/SimulacroPage';
import { TemarioPage, TemaPage } from './pages/TemarioPage';
import LogrosPage from './pages/LogrosPage';
import EditorPage from './pages/EditorPage';
import LogroToast from './components/logros/LogroToast';
import { useAchievements, useLevel } from './hooks/useAchievements';

const NAV = [
  ['aprende', 'Aprende'],
  ['temario', 'Temario'],
  ['preguntas', 'Preguntas'],
  ['supuestos', 'Supuestos'],
  ['simulacro', 'Simulacro'],
  ['editor', 'Editor'],
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
    default:
      return <NotFound />;
  }
}

export default function App() {
  const { segments, params } = useRoute();
  const section = segments[0];
  const { current: logro, dismiss } = useAchievements();
  const level = useLevel();
  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-20 border-b border-gray-800 bg-gray-950/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4">
          <a href={href('')} className="flex items-center gap-2 font-semibold text-gray-100">
            <span className="font-mono text-green-400">›_</span>
            <span className="hidden sm:inline">
              Tai<span className="text-yellow-400">Play</span>
            </span>
          </a>
          <nav className="ml-auto flex gap-1 overflow-x-auto text-sm">
            {NAV.map(([path, label]) => (
              <a
                key={path}
                href={href(path)}
                className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 sm:px-3 ${
                  section === path ? 'bg-gray-800 text-yellow-300' : 'text-gray-300 hover:bg-gray-900 hover:text-gray-100'
                }`}
              >
                {label}
              </a>
            ))}
          </nav>
          <a
            href={href('logros')}
            title={`Nivel ${level.n}: ${level.name} · ${level.xp} puntos`}
            className={`shrink-0 rounded-lg px-2 py-1.5 text-sm ${section === 'logros' ? 'bg-gray-800 text-yellow-300' : 'text-gray-300 hover:bg-gray-900'}`}
          >
            🏆 <span className="font-mono">Nv {level.n}</span>
          </a>
        </div>
      </header>
      <LogroToast logro={logro} onClose={dismiss} />
      <main className="flex-1">
        <Page segments={segments} params={params} />
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
