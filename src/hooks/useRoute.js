import { useEffect, useState } from 'react';

// Enrutado mínimo por hash (#/aprende/linux/lx-terminal?x=1): sin backend ni
// configuración de servidor, y el botón «atrás» del navegador funciona.
function parse() {
  const raw = window.location.hash.replace(/^#\/?/, '');
  const [path, query = ''] = raw.split('?');
  return { segments: path.split('/').filter(Boolean).map(decodeURIComponent), params: new URLSearchParams(query) };
}

export function useRoute() {
  const [route, setRoute] = useState(parse);
  useEffect(() => {
    const onChange = () => {
      setRoute(parse());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}

export const href = (path, params) => {
  const q = params ? new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== '')).toString() : '';
  return `#/${path}${q ? `?${q}` : ''}`;
};

export const navigate = (path, params) => {
  window.location.hash = href(path, params);
};
