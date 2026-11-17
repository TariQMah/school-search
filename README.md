# school-search

Skolo Saka's homepage school search ("Which school will you help?") as a reusable React and TypeScript component, `@skolo-saka/school-search`.

It is the search box and results list from the website's home hero (`app/(site)/HeroSchoolSearch.tsx`, `app/components/useSchoolSearch.ts` and the search styles in `app/(site)/site.module.css` on `staging`), with the data source and navigation taken out so the app supplies them:

- **`searchSchools`** supplies the schools matching the typed text (on the website: Supabase).
- **`onSelectSchool`** receives the school the person picked (on the website: go to `/school/{id}`).

Everything people already use is kept: the 250 ms search delay and two-letter minimum, school names with a verified badge and a place line ("Primary school, Riverbend, Limpopo"), the arrow keys, Enter and Escape, "Searching schools…", the no-results and error messages with "Try again", "Find school", the clear button, `#find-school` focusing the box, screen-reader announcements and the mobile layout. A slow answer to an earlier query never replaces newer results.

## Run the demo

```bash
npm install
npm run demo
```

Open http://localhost:5173. The demo imports `@skolo-saka/school-search` exactly as the website will (Vite points that name at `src/`), with fictional schools only. Try:

- **sunbird**: two schools with the same name in different towns. Pick one with the mouse, or the arrow keys and Enter; the "Selected school" panel shows the name, place and id that came back.
- **zzz**: no results.
- "Every search fails", then **Try again** after switching back to "Normal".
- "Slow short queries", then type **sun** and keep typing **bird**: the late answer for "sun" is logged but not shown.

## Test and build

```bash
npm test
```

```bash
npm run typecheck
```

```bash
npm pack
```

`npm test` covers typing and selecting, the search delay, arrow keys and Enter, Escape, "Find school", no results, failure and retry, quickly changing the text (stale answers ignored), clearing, the result limit, translated text and custom links. `npm pack` builds `dist/` and writes `skolo-saka-school-search-<version>.tgz`, which another app installs with `npm install ./skolo-saka-school-search-0.1.0.tgz` (`npm run build` builds without packing).

## Use it in a website

```tsx
'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SchoolSearch, type School } from '@skolo-saka/school-search';
import '@skolo-saka/school-search/styles.css';
import { loadSupabase } from '@/lib/auth-cookie';

// Supplies matching schools. `signal` is aborted when newer text replaces this search.
async function searchSchools(query: string, { signal }: { signal: AbortSignal }): Promise<School[]> {
  const supabase = await loadSupabase();
  const { data, error } = await supabase
    .rpc('search_school_directory', { p_query: query, p_area: '', p_province: null, p_level: null, p_verified_only: false, p_page: 0 })
    .abortSignal(signal);
  if (error) throw error; // shows "We couldn't load schools. Try again…"
  return data?.items ?? [];
}

export default function HeroSchoolSearch() {
  const router = useRouter();
  return <SchoolSearch
    searchSchools={searchSchools}
    onSelectSchool={school => router.push(`/school/${school.id}`)}
    onSearchAll={query => router.push(`/schools?q=${encodeURIComponent(query)}`)}
    links={{
      error: { href: '/donate', label: 'donate to Skolo Saka without choosing a school' },
      empty: query => ({ href: `/contact?need=school&school=${encodeURIComponent(query)}`, label: 'tell us about the school' }),
    }}
    renderLink={({ href, children }) => <Link href={href}>{children}</Link>}
  />;
}
```

### Props

| Prop | Default | |
| --- | --- | --- |
| `searchSchools(query, { signal })` | required | Returns a promise of matching schools. Throw to show the error message. |
| `onSelectSchool(school)` | required | The exact school object picked, including any extra fields you returned. |
| `onSearchAll(query)` | none | "Find school" or Enter with several matches, or while loading or after a failure. Without it, the button opens the list (or retries after a failure). One match is always picked directly. |
| `links.error`, `links.empty(query)` | none | `{ href, label }` links added to the error and no-results messages. |
| `renderLink` | plain `<a>` | Render those links with your router, e.g. Next.js `<Link>`. |
| `messages` | English | Replace any text, e.g. for translations. See `SchoolSearchMessages`. |
| `formatPlace(school)` | `schoolPlace` | The line under each name. |
| `limit` / `debounceMs` / `minChars` | 6 / 250 / 2 | Results shown, search delay, shortest search. |
| `focusHash` | `'#find-school'` | URL hash that focuses the box; `null` turns it off. |
| `className` | | Added to the outer `<form>`. |

A school is `{ id, name, level?, town?, municipality?, province?, verified? }`. A `level` of `primary`, `high` or `combined` shows as "Primary school", "High school" or "Combined school".

### Styles

Import `@skolo-saka/school-search/styles.css` once. Classes are prefixed `skolo-search`. Colours come from the website's tokens when the page defines them (`--brand`, `--brand-deep`, `--sun`, `--sun-deep`, `--ink`, `--muted`, `--line`, `--glass-tint`, `--radius-control`, `--shadow-3`, `--z-raised`), so the site's colour themes carry through; elsewhere Skolo Saka's default green and yellow apply. Any `--skolo-search-*` property can also be set on `.skolo-search`.

The built files start with `'use client'`, so Next.js treats the component as a client component.

## Next phase

Not in this repository yet: switching the website over to the package (GitLab), publishing to npm, and deploying.
