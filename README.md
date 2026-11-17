# school-search

[![CI](https://github.com/skolo-saka/school-search/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/skolo-saka/school-search/actions/workflows/ci.yml)
[![MIT licence](https://img.shields.io/badge/licence-MIT-green.svg)](LICENSE)

`@skolo-saka/school-search` is an accessible React and TypeScript combobox for finding a school as you type and picking it. It was extracted from the "Which school will you help?" search on [Skolo Saka](https://skolosaka.co.za)'s homepage, and works in any React 18 or 19 app.

**[Try the demo](https://skolo-saka.github.io/school-search/)** (fictional schools only). Type **sunbird**: two schools share that name, and the one you pick is the one handed back.

You supply two functions:

- **`searchSchools(query, { signal })`** returns the schools that match the typed text, from any source: an API, a database or an array.
- **`onSelectSchool(school)`** receives the exact school the person picked.

The component handles the rest: a 250 ms search delay and two-letter minimum, names with a verified badge and a place line ("Primary school, Riverbend, Limpopo"), arrow keys, Enter and Escape, loading, no-results and error messages with "Try again", a clear button, screen-reader announcements and a mobile layout. A slow answer to an older query never replaces newer results.

## Status

**Version 0.1.0 is available as a [GitHub release](https://github.com/skolo-saka/school-search/releases/tag/v0.1.0).** It is not on npm yet. Publishing to npm and switching the Skolo Saka website over to this package are the next phase.

## Install

From the GitHub release tarball:

```bash
npm install https://github.com/skolo-saka/school-search/releases/download/v0.1.0/skolo-saka-school-search-0.1.0.tgz
```

React and React DOM 18 or later are peer dependencies. The package ships ES module and CommonJS builds, TypeScript declarations and one stylesheet.

## Use it

```tsx
import { useState } from 'react';
import { SchoolSearch, schoolPlace, type School } from '@skolo-saka/school-search';
import '@skolo-saka/school-search/styles.css';

// Fictional schools. In a real app, searchSchools would call your API instead.
const SCHOOLS: School[] = [
  { id: 'sunbird-riverbend', name: 'Sunbird Primary School', level: 'primary', town: 'Riverbend', province: 'Limpopo', verified: true },
  { id: 'sunbird-kopjeskloof', name: 'Sunbird Primary School', level: 'primary', town: 'Kopjeskloof', province: 'Free State' },
  { id: 'baobab-ridge', name: 'Baobab Ridge High School', level: 'high', town: 'Riverbend', province: 'Limpopo', verified: true },
];

async function searchSchools(query: string, { signal }: { signal: AbortSignal }): Promise<School[]> {
  // With an API: const res = await fetch(`/api/schools?q=${encodeURIComponent(query)}`, { signal });
  //              if (!res.ok) throw new Error('Search failed'); // shows the error message and "Try again"
  //              return res.json();
  signal.throwIfAborted();
  const q = query.toLowerCase();
  return SCHOOLS.filter(s => `${s.name} ${s.town} ${s.province}`.toLowerCase().includes(q));
}

export default function App() {
  const [school, setSchool] = useState<School | null>(null);
  return <main>
    <SchoolSearch searchSchools={searchSchools} onSelectSchool={setSchool} />
    {school && <p>You picked {school.name} ({schoolPlace(school)}), id {school.id}.</p>}
  </main>;
}
```

`signal` is aborted when newer text replaces a search; pass it to `fetch` so stale requests are cancelled. Throw (or reject) to show the error message.

### Props

| Prop | Default | |
| --- | --- | --- |
| `searchSchools(query, { signal })` | required | Returns a promise of matching schools. Throw to show the error message. |
| `onSelectSchool(school)` | required | The exact school object picked, including any extra fields you returned. |
| `onSearchAll(query)` | none | "Find school" or Enter with several matches, or while loading or after a failure, e.g. to open a full results page. Without it, the button opens the list (or retries after a failure). One match is always picked directly. |
| `links.error`, `links.empty(query)` | none | `{ href, label }` links added to the error and no-results messages. |
| `renderLink` | plain `<a>` | Render those links with your router, e.g. Next.js `<Link>`. |
| `messages` | English | Replace any text, e.g. for translations. See `SchoolSearchMessages`. |
| `formatPlace(school)` | `schoolPlace` | The line under each name. |
| `limit` / `debounceMs` / `minChars` | 6 / 250 / 2 | Results shown, search delay, shortest search. |
| `focusHash` | `'#find-school'` | URL hash that focuses the box; `null` turns it off. |
| `className` | | Added to the outer `<form>`. |

A school is `{ id, name, level?, town?, municipality?, province?, verified? }`. A `level` of `primary`, `high` or `combined` shows as "Primary school", "High school" or "Combined school". For a custom layout, the `useSchoolSearch` hook gives you the search state without the markup.

### Schools with the same name

School names are not unique. The fictional **Sunbird Primary School** results in the demo are in **Riverbend** and **Kopjeskloof**. The place line under each name tells them apart: by default, `schoolPlace` combines the level, town (or municipality when there is no town), and province. Return `town`, `municipality` and/or `province` from `searchSchools` so people can see which school they are choosing.

`onSelectSchool` receives the exact school object picked, including its `id` and any extra fields. Always use **`school.id`**, rather than `school.name`, to identify the selection in your app or navigate to its record.

If two schools share both a name and the same displayed place, those lines look the same; the component does not invent a distinction. Use `formatPlace` to add a suburb or school code supplied by your directory. For example, with the fictional data and functions above, you can append the unique id:

```tsx
<SchoolSearch
  searchSchools={searchSchools}
  onSelectSchool={school => console.log(school.id)}
  formatPlace={school => `${schoolPlace(school)} · ${school.id}`}
/>
```

### Styles

Import `@skolo-saka/school-search/styles.css` once. Classes are prefixed `skolo-search`. Colours follow these CSS custom properties when the page defines them: `--brand`, `--brand-deep`, `--sun`, `--sun-deep`, `--ink`, `--muted`, `--line`, `--glass-tint`, `--radius-control`, `--shadow-3` and `--z-raised`; otherwise a default green and yellow apply. Any `--skolo-search-*` property can also be set on `.skolo-search`.

### Next.js

The built files start with `'use client'`, so the App Router treats the component as a client component. Pass `renderLink={({ href, children }) => <Link href={href}>{children}</Link>}` to route the message links with `next/link`, and navigate in `onSelectSchool` with `useRouter()`.

## Develop

You need [Node.js 24](https://nodejs.org/) (24.11 or later; `.nvmrc` pins the major version) and npm.

```bash
git clone https://github.com/skolo-saka/school-search.git
cd school-search
npm ci
```

Run the demo at http://localhost:5173:

```bash
npm run demo
```

The demo imports `@skolo-saka/school-search` exactly as an app would (Vite points that name at `src/`) and uses fictional schools only. Try **sunbird** (same name, two towns), **zzz** (no results), "Every search fails" then **Try again**, and "Slow short queries" while typing **sun** then **bird** (the late answer for "sun" is logged but not shown).

Run the checks that CI runs:

```bash
npm run typecheck
```

```bash
npm test
```

```bash
npm run build
```

```bash
npm run demo:build
```

`npm run build` writes the package to `dist/`; `npm run demo:build` writes the static demo to `demo/dist/`. `npm pack` builds and writes `skolo-saka-school-search-<version>.tgz`, which another app can install with `npm install ./skolo-saka-school-search-0.1.0.tgz`.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the fork, branch, test and pull-request workflow, and the [good first issues](https://github.com/skolo-saka/school-search/labels/good%20first%20issue). Everyone taking part follows the [code of conduct](CODE_OF_CONDUCT.md). Report security problems privately as described in [SECURITY.md](SECURITY.md).

## Licence

[MIT](LICENSE) © 2026 Skolo Saka. The inlined Lucide icons are ISC licensed; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
