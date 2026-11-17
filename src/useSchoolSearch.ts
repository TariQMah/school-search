import { useEffect, useRef, useState } from 'react';
import type { School, SearchSchools, SearchState } from './types';

export interface UseSchoolSearchOptions<S extends School> {
  searchSchools: SearchSchools<S>;
  /** Most results to show. Default 6. */
  limit?: number;
  /** Wait after the last keystroke before searching, in ms. Default 250 (the homepage's delay). */
  debounceMs?: number;
  /** Shortest text that searches. Default 2. */
  minChars?: number;
}

const LEVEL: Record<string, string> = { primary: 'Primary school', high: 'High school', combined: 'Combined school' };

/** "High school, Polokwane, Limpopo": the line under a school's name in the results. */
export const schoolPlace = (s: Pick<School, 'level' | 'town' | 'municipality' | 'province'>) =>
  [s.level ? LEVEL[s.level] ?? s.level : null, [s.town || s.municipality, s.province].filter(Boolean).join(', ')]
    .filter(Boolean)
    .join(', ');

/**
 * Searches as the person types, keeping only the answer to the latest query: every new query (or
 * retry) bumps a sequence number and aborts the previous request, and a response is applied only if
 * its sequence number is still the current one. retry() runs the same search again.
 */
export function useSchoolSearch<S extends School>({ searchSchools, limit = 6, debounceMs = 250, minChars = 2 }: UseSchoolSearchOptions<S>) {
  const [query, setQuery] = useState('');
  const [state, setState] = useState<SearchState>('idle');
  const [results, setResults] = useState<S[]>([]);
  const [attempt, setAttempt] = useState(0);
  const request = useRef(0);
  // The latest search function, so an app passing a new function each render doesn't restart searches.
  const search = useRef(searchSchools);
  search.current = searchSchools;

  useEffect(() => {
    const term = query.trim();
    if (term.length < minChars) { request.current++; setState('idle'); setResults([]); return; }
    const seq = ++request.current;
    const controller = new AbortController();
    setState('loading');
    const timer = setTimeout(async () => {
      try {
        const found = await search.current(term, { signal: controller.signal });
        if (seq !== request.current) return;
        const items = (found || []).slice(0, limit);
        setResults(items);
        setState(items.length ? 'results' : 'empty');
      } catch {
        if (seq === request.current) { setResults([]); setState('error'); }
      }
    }, debounceMs);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query, attempt, limit, debounceMs, minChars]);

  return { query, setQuery, state, results, retry: () => setAttempt(n => n + 1) };
}
