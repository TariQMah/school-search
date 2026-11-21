# school-search

[![CI](https://github.com/skolo-saka/school-search/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/skolo-saka/school-search/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@skolo-saka/school-search.svg)](https://www.npmjs.com/package/@skolo-saka/school-search)
[![MIT licence](https://img.shields.io/badge/licence-MIT-green.svg)](LICENSE)

`@skolo-saka/school-search` is an accessible React and TypeScript combobox for finding a school as you type and picking it. It was extracted from the "Which school will you help?" search on [Skolo Saka](https://skolosaka.co.za)'s homepage, and works in any React 18 or 19 app.

**[Try the demo](https://skolo-saka.github.io/school-search/)**, which searches the live Skolo Saka school directory. Type **sunnyside primary**: two real schools share that name, in Cape Town and Pretoria, and the one you pick is the one handed back, with a link to its page on the Skolo Saka website.

You supply two functions:

- **`searchSchools(query, { signal })`** returns the schools that match the typed text, from any source: an API, a database or an array.
- **`onSelectSchool(school)`** receives the exact school the person picked.

The component handles the rest: a 250 ms search delay and two-letter minimum, names with a verified badge and a place line ("Primary school, Riverbend, Limpopo"), arrow keys, Enter and Escape, loading, no-results and error messages with "Try again", a clear button, screen-reader announcements and a mobile layout. A slow answer to an older query never replaces newer results.

## Status

**Published on [npm](https://www.npmjs.com/package/@skolo-saka/school-search)** and used by the [Skolo Saka website](https://www.skolosaka.co.za)'s homepage search. Releases are listed on the [releases page](https://github.com/skolo-saka/school-search/releases). Each one is published from a version tag by GitHub Actions with npm provenance; see [RELEASING.md](RELEASING.md). The API may still change before 1.0. A change that can need work in your app gets a new minor version.

## Install

```bash
npm install @skolo-saka/school-search
```

React and React DOM 18 or later are peer dependencies. The package ships ES module and CommonJS builds, TypeScript declarations for each (`.d.ts` and `.d.cts`) and one stylesheet. The types work with TypeScript's `bundler`, `node16` and `nodenext` module resolution.

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

### Keyboard

The search box is an [editable combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) with list autocomplete. Focus stays in the text box; `aria-activedescendant` points at the highlighted school.

| Key | List open | List closed (after Escape) |
| --- | --- | --- |
| ArrowDown | Highlights the next school. Stops at the last one. | Opens the list on the first school. |
| ArrowUp | Highlights the previous school. Stops at the first one. | Opens the list on the last school. |
| Enter | Picks the highlighted school. | Same as "Find school": one match is picked, several go to `onSearchAll`. |
| Escape | Closes the list. The text stays. | Nothing. |
| Home / End | Move the text caret. The highlight stays where it is. | Move the text caret. |
| Tab | Leaves the box and closes the list without picking a school. | Leaves the box. |

The arrows do not wrap from the last school to the first. Home and End belong to the text box, as the ARIA Authoring Practices recommend for an editable combobox, so people can still edit their search while the list is open. The first school is highlighted when results arrive.

### Schools with the same name

School names are not unique. In the live demo, **sunnyside primary** finds two real Sunnyside Primary Schools, one in Cape Town and one in Pretoria. In testing mode, the fictional **Sunbird Primary School** results are in **Riverbend** and **Kopjeskloof**. The place line under each name tells them apart: by default, `schoolPlace` combines the level, town (or municipality when there is no town), and province. Return `town`, `municipality` and/or `province` from `searchSchools` so people can see which school they are choosing.

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

The demo imports `@skolo-saka/school-search` exactly as an app would (Vite points that name at `src/`).

### Live search

By default the demo searches the **live Skolo Saka school directory** through the website's public API, `GET https://www.skolosaka.co.za/api/public/schools/search?q=<text>`. The API returns at most 10 real schools with public fields only: `id`, `name`, `town`, `municipality`, `province`, `level` and `verified`. The connection lives in the demo (`demo/src/liveSearch.ts`), not in the package. The package has no knowledge of Skolo Saka's backend, and any app supplies its own `searchSchools`.

- The request uses the `AbortSignal` the component passes, so a newer search cancels the older one.
- An answer without a `schools` array is treated as an error. Malformed schools in an answer are skipped.
- A failed request shows the error and **Try again**. It never falls back to fictional schools.
- Picking a school shows its name, place and ID, with a link to `https://www.skolosaka.co.za/school/<id>`.
- **Find school** with several matches opens the website's directory search (`/schools?q=`). The no-results and error messages link to the website's contact and donate pages.

Try **sunnyside primary** (two schools with the same name), **hoerskool ben vorster**, **st john's college** and **zzqqxx** (no matches).

#### Configuration

`VITE_SKOLO_SAKA_ORIGIN` chooses the website whose API and pages the demo uses. The default is production, `https://www.skolosaka.co.za`, and the GitHub Pages workflow sets it explicitly. Set it in the environment or in `demo/.env.local`.

- **Published demo (`npm run demo:build`):** the browser calls `<origin>/api/public/schools/search` directly. The API allows cross-origin requests only from `https://skolo-saka.github.io`.
- **Local demo (`npm run demo` or `vite preview`):** the browser calls the demo's own server, which forwards `/api/public/` to the origin. No CORS exception is needed.

```bash
# UAT: test data, and links open UAT school pages
VITE_SKOLO_SAKA_ORIGIN=https://skolo-saka-uat.azurewebsites.net npm run demo
```

```bash
# A website running locally on port 3000
VITE_SKOLO_SAKA_ORIGIN=http://localhost:3000 npm run demo
```

A built demo served from another local origin calls the website directly. That website must list the origin in `PUBLIC_API_DEV_ORIGINS`, which production ignores.

### Testing mode (fictional schools)

Choose **Testing mode: 8 fictional schools** under **Data source** to use made-up schools (`demo/src/schools.ts`). The simulation controls appear only in testing mode and affect only the fictional source:

- Try **sunbird** (same name, two towns) and **zzz** (no results).
- Choose "Every search fails", then press **Try again**.
- Choose "Slow short queries", then type **sun** and then **bird**. The late answer for "sun" is logged but not shown.

Switching between the live directory and testing mode clears the search and cancels any request in flight, so results from the two sources never mix. Fictional schools have no website page. The automated tests use fixtures only and never call the live API.

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

`npm run build` writes the package to `dist/`; `npm run demo:build` writes the static demo to `demo/dist/`. `npm pack` builds and writes `skolo-saka-school-search-<version>.tgz`, which another app can install with `npm install ./skolo-saka-school-search-<version>.tgz`. `node scripts/check-package.mjs` packs the package and checks it in a clean app: its files, ES module and CommonJS builds, `styles.css` and TypeScript types.

## Related projects

- [school-directory](https://github.com/skolo-saka/school-directory): the open-source school directory behind Skolo Saka's search. It provides the PostgreSQL schema, the validated Department of Basic Education importer and a public search API you can connect to `searchSchools`.
- [Live demo](https://skolo-saka.github.io/school-search/): this component searching the real Skolo Saka directory.

## Contributing

Maintainers ([MAINTAINERS.md](MAINTAINERS.md)) release new versions as described in [RELEASING.md](RELEASING.md). See [CONTRIBUTING.md](CONTRIBUTING.md) for the fork, branch, test and pull-request workflow, and the [good first issues](https://github.com/skolo-saka/school-search/labels/good%20first%20issue). Everyone taking part follows the [code of conduct](CODE_OF_CONDUCT.md). Report security problems privately as described in [SECURITY.md](SECURITY.md).

## Licence

[MIT](LICENSE) © 2026 Skolo Saka. The inlined Lucide icons are ISC licensed; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
