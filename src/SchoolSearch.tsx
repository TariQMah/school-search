import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from 'react';
import { schoolPlace, useSchoolSearch } from './useSchoolSearch';
import { BadgeCheckIcon, SearchIcon, XIcon } from './icons';
import type { FallbackLink, School, SchoolSearchMessages, SearchSchools } from './types';

export const defaultMessages: SchoolSearchMessages = {
  label: 'Search for a school',
  placeholder: 'School name or town',
  submit: 'Find school',
  clear: 'Clear search',
  listLabel: 'Schools',
  verified: 'Verified',
  loading: 'Searching schools…',
  retry: 'Try again',
  error: ({ retry, link }) => <>We couldn&rsquo;t load schools. {retry}{link ? <>, or {link}</> : null}.</>,
  empty: ({ query, link }) => <>No school matches &ldquo;{query}&rdquo;. Try fewer words or the town name{link ? <>, or {link}</> : null}.</>,
  announceResults: count => `${count} ${count === 1 ? 'school' : 'schools'} found. Choose one to see its page.`,
  announceEmpty: 'No schools found',
  announceError: 'We couldn’t load schools',
};

export interface SchoolSearchProps<S extends School = School> {
  /** Supplies the schools matching the typed text. */
  searchSchools: SearchSchools<S>;
  /** Receives the school the person picked (click, Enter on a highlighted school, or "Find school" with one match). */
  onSelectSchool: (school: S) => void;
  /**
   * "Find school" (or Enter with nothing highlighted) when there are several matches, or while a search
   * is loading or has failed. On the website this opens the full directory search. Without it, the
   * button opens the results list instead.
   */
  onSearchAll?: (query: string) => void;
  /** Links shown inside the messages. Leave out to show the messages without links. */
  links?: {
    /** Shown after a failed search, e.g. donate without choosing a school. */
    error?: FallbackLink | null;
    /** Shown when nothing matches, e.g. "tell us about the school". Gets the trimmed search text. */
    empty?: ((query: string) => FallbackLink | null) | null;
  };
  /** Renders a link, e.g. with Next.js `<Link>`. Default: a plain `<a>`. */
  renderLink?: (link: { href: string; children: ReactNode }) => ReactNode;
  /** Replace any of the text, e.g. for translations. */
  messages?: Partial<SchoolSearchMessages>;
  /** The line under a school's name. Default: "High school, Town, Province". */
  formatPlace?: (school: S) => string;
  /** Most results to show. Default 6. */
  limit?: number;
  /** Search delay after the last keystroke, in ms. Default 250. */
  debounceMs?: number;
  /** Shortest text that searches. Default 2. */
  minChars?: number;
  /** When the page URL has this hash (default '#find-school'), the box takes focus. null turns it off. */
  focusHash?: string | null;
  className?: string;
}

const plainLink = ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a>;

/** A name with its badge, the badge kept on one line with the last word so it never wraps alone. */
function NameWithBadge({ name, badge }: { name: string; badge: ReactNode }) {
  const split = name.trimEnd().lastIndexOf(' ') + 1;
  return <>{name.slice(0, split)}<span className="skolo-search__name-end">{name.slice(split)}{badge}</span></>;
}

/**
 * "Which school will you help?" A combobox: type a school name or town, then pick a school with the
 * mouse, or the arrow keys and Enter. The app decides where a picked school goes.
 */
export function SchoolSearch<S extends School = School>({
  searchSchools, onSelectSchool, onSearchAll, links, renderLink = plainLink, messages, formatPlace = schoolPlace,
  limit, debounceMs, minChars = 2, focusHash = '#find-school', className,
}: SchoolSearchProps<S>) {
  const t = { ...defaultMessages, ...messages };
  const id = useId();
  const listId = `${id}-schools`;
  const { query, setQuery, state, results, retry } = useSchoolSearch<S>({ searchSchools, limit, debounceMs, minChars });
  const [active, setActive] = useState(-1);
  useEffect(() => setActive(results.length ? 0 : -1), [results]);
  const [open, setOpen] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!focusHash) return;
    const focusFromHash = () => { if (window.location.hash === focusHash) input.current?.focus({ preventScroll: true }); };
    focusFromHash();
    window.addEventListener('hashchange', focusFromHash);
    return () => window.removeEventListener('hashchange', focusFromHash);
  }, [focusHash]);

  function pick(school: S) { setOpen(false); onSelectSchool(school); }
  function clear() { setQuery(''); requestAnimationFrame(() => input.current?.focus()); }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') { setOpen(false); return; }
    // Enter with a school highlighted in the open list picks that school.
    if (e.key === 'Enter' && open && state === 'results' && results[active]) { e.preventDefault(); pick(results[active]); return; }
    if (state !== 'results' || (e.key !== 'ArrowDown' && e.key !== 'ArrowUp')) return;
    // Home and End are left to the text box, where they move the caret (the ARIA editable combobox pattern).
    e.preventDefault();
    const down = e.key === 'ArrowDown';
    // On a closed list, an arrow key opens it: ArrowDown on the first school, ArrowUp on the last.
    // The hidden highlight never moves, so every key press has a visible, announced result.
    if (!open) { setOpen(true); setActive(down ? 0 : results.length - 1); return; }
    // In the open list the arrows stop at the first and last school; they do not wrap.
    setActive(i => (down ? Math.min(results.length - 1, i + 1) : Math.max(0, i - 1)));
  }

  // "Find school" (or Enter without a highlighted school): one match picks that school; several go to
  // onSearchAll. No matches searches again. While searching or after a failure, onSearchAll too.
  function find(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const term = query.trim();
    if (term.length < minChars) { input.current?.focus(); return; }
    if (state === 'results' && results.length === 1) { pick(results[0]); return; }
    if (state === 'empty' || (state === 'error' && !onSearchAll)) { retry(); setOpen(true); input.current?.focus(); return; }
    if (onSearchAll) { setOpen(false); onSearchAll(term); return; }
    setOpen(true); input.current?.focus();
  }

  const typed = query.trim();
  const showList = open && state !== 'idle';
  const errorLink = links?.error ? renderLink({ href: links.error.href, children: links.error.label }) : null;
  const emptyFallback = state === 'empty' && links?.empty ? links.empty(typed) : null;
  const emptyLink = emptyFallback ? renderLink({ href: emptyFallback.href, children: emptyFallback.label }) : null;
  const retryButton = <button type="button" className="skolo-search__retry" onClick={() => { retry(); input.current?.focus(); }}>{t.retry}</button>;

  return <form className={`skolo-search${className ? ` ${className}` : ''}`} role="search" onSubmit={find}>
    <label htmlFor={`${id}-input`} className="skolo-search__sr-only">{t.label}</label>
    <div className={`skolo-search__box${showList ? ' skolo-search__box--open' : ''}`}>
      <SearchIcon aria-hidden="true" className="skolo-search__icon" />
      <input ref={input} id={`${id}-input`} role="combobox" aria-expanded={showList} aria-controls={listId} aria-autocomplete="list"
        aria-activedescendant={showList && state === 'results' && active >= 0 ? `${listId}-${active}` : undefined}
        value={query} placeholder={t.placeholder} autoComplete="off" spellCheck={false}
        onChange={e => { setQuery(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onKeyDown={onKey}
        onBlur={() => setTimeout(() => setOpen(false), 150)} />
      {query && <button type="button" className="skolo-search__clear" aria-label={t.clear} onClick={clear}><XIcon aria-hidden="true" /></button>}
      <button type="submit" className="skolo-search__go">{t.submit}</button>
    </div>
    {/* Pressing inside the panel keeps focus in the box, so the panel stays open for its links and buttons. */}
    {showList && <div className="skolo-search__panel" onMouseDown={e => e.preventDefault()}>
      {state === 'loading' && <p className="skolo-search__status">{t.loading}</p>}
      {state === 'error' && <p className="skolo-search__status">{t.error({ retry: retryButton, link: errorLink })}</p>}
      {state === 'empty' && <p className="skolo-search__status">{t.empty({ query: typed, link: emptyLink })}</p>}
      {state === 'results' && <ul id={listId} role="listbox" aria-label={t.listLabel}>
        {results.map((school, i) => <li key={school.id} id={`${listId}-${i}`} role="option" aria-selected={i === active}
          className={i === active ? 'skolo-search__option--active' : undefined}
          onMouseEnter={() => setActive(i)} onMouseDown={e => { e.preventDefault(); pick(school); }}>
          <strong>{school.verified ? <NameWithBadge name={school.name} badge={<BadgeCheckIcon role="img" aria-label={t.verified} />} /> : school.name}</strong>
          <span>{formatPlace(school)}</span>
        </li>)}
      </ul>}
    </div>}
    <p className="skolo-search__sr-only" aria-live="polite">{state === 'results' ? t.announceResults(results.length) : state === 'empty' ? t.announceEmpty : state === 'error' ? t.announceError : ''}</p>
  </form>;
}
