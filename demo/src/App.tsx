import { useState } from 'react';
// The same import the website uses. In the demo this resolves to ../../src (see demo/vite.config.ts).
import { SchoolSearch, schoolPlace, type School } from '@skolo-saka/school-search';
import '@skolo-saka/school-search/styles.css';
import { DEMO_SCHOOLS, matchSchools } from './schools';

type Mode = 'normal' | 'slow-first' | 'fail';

const wait = (ms: number, signal: AbortSignal) => new Promise<void>((resolve, reject) => {
  const t = setTimeout(resolve, ms);
  signal.addEventListener('abort', () => { clearTimeout(t); reject(new DOMException('Aborted', 'AbortError')); });
});

export default function App() {
  const [selected, setSelected] = useState<School | null>(null);
  const [mode, setMode] = useState<Mode>('normal');
  const [searchAll, setSearchAll] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const note = (line: string) => setLog(l => [line, ...l].slice(0, 6));

  // Stands in for the website's Supabase call. "Slow" makes short queries take 2.5s and ignore the
  // abort signal, so a stale answer arrives after newer ones and you can see it is not shown.
  async function searchSchools(query: string, { signal }: { signal: AbortSignal }) {
    note(`search "${query}"`);
    if (mode === 'fail') { await wait(400, signal); throw new Error('Demo failure'); }
    if (mode === 'slow-first' && query.length <= 3) {
      await new Promise(r => setTimeout(r, 2500));
      note(`late answer for "${query}" arrived (ignored)`);
      return matchSchools(query);
    }
    await wait(300, signal);
    return matchSchools(query);
  }

  return <main className="demo">
    <section className="hero">
      <p className="eyebrow">@skolo-saka/school-search · demo</p>
      <h1>Which school will you help?</h1>
      <p>Fictional schools only. Try <b>sunbird</b> (two schools share the name), <b>riverbend</b>, or <b>zzz</b>.</p>
      <SchoolSearch
        searchSchools={searchSchools}
        onSelectSchool={school => { setSelected(school); setSearchAll(null); }}
        onSearchAll={q => { setSearchAll(q); setSelected(null); }}
        links={{
          error: { href: '#donate', label: 'donate without choosing a school' },
          empty: q => ({ href: `#tell-us?school=${encodeURIComponent(q)}`, label: 'tell us about the school' }),
        }}
      />
    </section>

    <section className="panel" aria-live="polite" data-testid="selected">
      <h2>Selected school</h2>
      {selected ? <dl>
        <dt>Name</dt><dd>{selected.name}</dd>
        <dt>Place</dt><dd>{schoolPlace(selected)}</dd>
        <dt>ID</dt><dd><code>{selected.id}</code></dd>
        <dt>Website would open</dt><dd><code>/school/{selected.id}</code></dd>
      </dl> : searchAll ? <p>"Find school" with several matches. The website would open <code>/schools?q={encodeURIComponent(searchAll)}</code>.</p>
        : <p>None yet. Pick a school from the results.</p>}
    </section>

    <section className="panel">
      <h2>Simulate the data source</h2>
      <fieldset>
        <label><input type="radio" name="mode" checked={mode === 'normal'} onChange={() => setMode('normal')} /> Normal (300 ms)</label>
        <label><input type="radio" name="mode" checked={mode === 'slow-first'} onChange={() => setMode('slow-first')} /> Slow short queries (stale answers arrive late)</label>
        <label><input type="radio" name="mode" checked={mode === 'fail'} onChange={() => setMode('fail')} /> Every search fails</label>
      </fieldset>
      <h3>Recent calls</h3>
      <ul className="log">{log.map((l, i) => <li key={i}>{l}</li>)}</ul>
      <details><summary>All {DEMO_SCHOOLS.length} fictional schools</summary>
        <ul>{DEMO_SCHOOLS.map(s => <li key={s.id}><code>{s.id}</code> {s.name}, {schoolPlace(s)}</li>)}</ul>
      </details>
    </section>
  </main>;
}
