import { useMemo, useRef, useState } from 'react';
// The same import the website uses. In the demo this resolves to ../../src (see demo/vite.config.ts).
import { SchoolSearch, schoolPlace, type School, type SearchSchools } from '@skolo-saka/school-search';
import '@skolo-saka/school-search/styles.css';
import { DEMO_SCHOOLS, matchSchools } from './schools';
import { directorySearchUrl, liveSearch, schoolPageUrl, SKOLO_SAKA_ORIGIN } from './liveSearch';

/** Where results come from: the real directory (default), or fictional schools for testing. */
export type Source = 'live' | 'fictional';
/** Testing mode only: how the fictional data source behaves. */
type Mode = 'normal' | 'slow-first' | 'fail';

const wait = (ms: number, signal: AbortSignal) => new Promise<void>((resolve, reject) => {
  const t = setTimeout(resolve, ms);
  signal.addEventListener('abort', () => { clearTimeout(t); reject(new DOMException('Aborted', 'AbortError')); });
});

export interface AppProps {
  /** The live searchSchools; tests pass their own. */
  searchLive?: SearchSchools;
  /** Opens the website's directory search for "Find school" with several matches. */
  navigate?: (url: string) => void;
  origin?: string;
}

export default function App({ searchLive, navigate = url => window.location.assign(url), origin = SKOLO_SAKA_ORIGIN }: AppProps) {
  const live = useMemo(() => searchLive ?? liveSearch(), [searchLive]);
  const [source, setSource] = useState<Source>('live');
  const [selected, setSelected] = useState<School | null>(null);
  const [mode, setMode] = useState<Mode>('normal');
  const [searchAll, setSearchAll] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);
  // Calls from a source that is no longer selected are not logged.
  const current = useRef(source);
  current.current = source;
  const note = (from: Source, line: string) => { if (current.current === from) setLog(l => [line, ...l].slice(0, 6)); };

  async function searchLiveSchools(query: string, options: { signal: AbortSignal }) {
    note('live', `live search "${query}"`);
    try {
      const found = await live(query, options);
      note('live', `"${query}": ${found.length} school${found.length === 1 ? '' : 's'} from the live directory`);
      return found;
    } catch (error) {
      if (!options.signal.aborted) note('live', `"${query}" failed: ${error instanceof Error ? error.message : 'unknown error'}`);
      throw error;
    }
  }

  // Testing mode. "Slow" makes short queries take 2.5s and ignore the abort signal, so a stale answer
  // arrives after newer ones and you can see it is not shown.
  async function searchFictionalSchools(query: string, { signal }: { signal: AbortSignal }) {
    note('fictional', `fictional search "${query}"`);
    if (mode === 'fail') { await wait(400, signal); throw new Error('Simulated failure'); }
    if (mode === 'slow-first' && query.length <= 3) {
      await new Promise(r => setTimeout(r, 2500));
      note('fictional', `late answer for "${query}" arrived (ignored)`);
      return matchSchools(query);
    }
    await wait(300, signal);
    return matchSchools(query);
  }

  // Switching source remounts the search (key={source}): its text and results are cleared and any
  // request in flight is aborted, so answers from the two sources can never mix.
  function chooseSource(next: Source) {
    if (next === source) return;
    setSource(next); setSelected(null); setSearchAll(null); setLog([]); setMode('normal');
  }

  const isLive = source === 'live';
  return <main className="demo">
    <section className="hero">
      <p className="eyebrow">@skolo-saka/school-search · demo</p>
      <h1>Which school will you help?</h1>
      {isLive
        ? <p><span className="source-badge" data-testid="source-label">Live Skolo Saka school directory</span> Real South African schools, searched as you type. Try <b>sunnyside primary</b> (two real schools share the name, in Cape Town and Pretoria), <b>hoerskool ben vorster</b>, <b>st john's college</b>, or <b>zzqqxx</b> (no matches).</p>
        : <p><span className="source-badge testing" data-testid="source-label">Testing mode: fictional schools</span> Made-up schools, not real ones. Try <b>sunbird</b> (two schools share the name), <b>riverbend</b>, or <b>zzz</b>.</p>}
      <SchoolSearch
        key={source}
        searchSchools={isLive ? searchLiveSchools : searchFictionalSchools}
        onSelectSchool={school => { setSelected(school); setSearchAll(null); }}
        onSearchAll={q => {
          setSelected(null);
          if (isLive) navigate(directorySearchUrl(q, origin)); else setSearchAll(q);
        }}
        links={{
          error: { href: `${origin}/donate`, label: 'donate to Skolo Saka without choosing a school' },
          empty: q => ({ href: `${origin}/contact?need=school&school=${encodeURIComponent(q)}`, label: 'tell us about the school' }),
        }}
      />
    </section>

    <section className="panel" aria-live="polite" data-testid="selected">
      <h2>Selected school</h2>
      {selected ? <dl>
        <dt>Name</dt><dd>{selected.name}</dd>
        <dt>Place</dt><dd>{schoolPlace(selected) || 'Not recorded'}</dd>
        <dt>ID</dt><dd><code>{selected.id}</code></dd>
        {isLive
          ? <><dt>School page</dt><dd><a href={schoolPageUrl(selected.id, origin)}>{schoolPageUrl(selected.id, origin)}</a></dd></>
          : <><dt>School page</dt><dd>None: this is a fictional testing school.</dd></>}
      </dl> : searchAll ? <p>"Find school" with several matches. With the live directory this opens <code>{directorySearchUrl(searchAll, origin)}</code>.</p>
        : <p>None yet. Pick a school from the results.</p>}
    </section>

    <section className="panel">
      <h2>Data source</h2>
      <fieldset>
        <legend className="sr-only">Data source</legend>
        <label><input type="radio" name="source" checked={isLive} onChange={() => chooseSource('live')} /> Live Skolo Saka school directory <small>({origin})</small></label>
        <label><input type="radio" name="source" checked={!isLive} onChange={() => chooseSource('fictional')} /> Testing mode: {DEMO_SCHOOLS.length} fictional schools</label>
      </fieldset>
      <h3>Recent calls</h3>
      <ul className="log" data-testid="log">{log.map((l, i) => <li key={i}>{l}</li>)}</ul>
    </section>

    {!isLive && <section className="panel testing" data-testid="testing-panel">
      <h2>Testing mode: simulate the fictional data source</h2>
      <p className="hint">These controls change only the fictional schools. Live searches always use the real directory, and a failed live search is shown as an error, never replaced with fictional results.</p>
      <fieldset>
        <legend className="sr-only">Simulation</legend>
        <label><input type="radio" name="mode" checked={mode === 'normal'} onChange={() => setMode('normal')} /> Normal (300 ms)</label>
        <label><input type="radio" name="mode" checked={mode === 'slow-first'} onChange={() => setMode('slow-first')} /> Slow short queries (stale answers arrive late)</label>
        <label><input type="radio" name="mode" checked={mode === 'fail'} onChange={() => setMode('fail')} /> Every search fails</label>
      </fieldset>
      <details><summary>All {DEMO_SCHOOLS.length} fictional schools</summary>
        <ul>{DEMO_SCHOOLS.map(s => <li key={s.id}><code>{s.id}</code> {s.name}, {schoolPlace(s)}</li>)}</ul>
      </details>
    </section>}
  </main>;
}
