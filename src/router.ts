import { useEffect, useState } from 'react';

export type Page = 'home' | 'scenario' | 'checklist' | 'about' | 'notfound';

export interface Route {
  page: Page;
  scenarioId?: string;
  params: URLSearchParams;
}

/**
 * Hash-based routes, so the site works on GitHub Pages without server rewrites:
 * #/  #/scenario/<id>?mode=leaky&strength=4&seed=42  #/checklist  #/about
 */
export function parseHash(hash: string): Route {
  const raw = hash.replace(/^#/, '') || '/';
  const [path, query = ''] = raw.split('?');
  const params = new URLSearchParams(query);
  const parts = path.split('/').filter(Boolean);
  if (parts.length === 0) return { page: 'home', params };
  if (parts[0] === 'scenario' && parts[1])
    return { page: 'scenario', scenarioId: parts[1], params };
  if (parts[0] === 'checklist') return { page: 'checklist', params };
  if (parts[0] === 'about') return { page: 'about', params };
  return { page: 'notfound', params };
}

export interface ScenarioState {
  leaky: boolean;
  strength: number;
  seed: number;
  embed?: boolean;
}

export function scenarioHash(id: string, s?: ScenarioState): string {
  if (!s) return `#/scenario/${id}`;
  const params = new URLSearchParams({
    mode: s.leaky ? 'leaky' : 'correct',
    strength: String(s.strength),
    seed: String(s.seed),
  });
  if (s.embed) params.set('embed', '1');
  return `#/scenario/${id}?${params}`;
}

/** Absolute URL of the app (without hash), for share and embed links. */
export function appBaseUrl(): string {
  return `${window.location.origin}${window.location.pathname}`;
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseHash(window.location.hash));
  useEffect(() => {
    const onChange = () => {
      setRoute(parseHash(window.location.hash));
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}

/**
 * Link to the source repository, derived from the GitHub Pages address
 * (<owner>.github.io/<repo>/), so no account name is hard-coded.
 */
export function repoUrl(): string | null {
  const { hostname, pathname } = window.location;
  if (!hostname.endsWith('.github.io')) return null;
  const owner = hostname.split('.')[0];
  const repo = pathname.split('/').filter(Boolean)[0];
  return repo ? `https://github.com/${owner}/${repo}` : null;
}
