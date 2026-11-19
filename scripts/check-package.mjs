// Checks the package exactly as npm would publish it, then installs it into a clean app.
//   node scripts/check-package.mjs                 builds, packs into a temp folder and checks that
//   node scripts/check-package.mjs <file.tgz>      checks an existing tarball (the release workflow)
// Exits non-zero on any problem. Needs network access to install React for the clean app.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, writeFileSync, rmSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const npm = (args, cwd) => execFileSync('npm', args, { cwd, encoding: 'utf8', shell: process.platform === 'win32', stdio: ['ignore', 'pipe', 'inherit'] });
const fail = msg => { console.error(`check-package: ${msg}`); process.exitCode = 1; };
const work = mkdtempSync(join(tmpdir(), 'school-search-check-'));

try {
  // 1. The tarball
  let tgz = process.argv[2] && resolve(process.argv[2]);
  if (!tgz) {
    npm(['run', 'build'], root);
    const [packed] = JSON.parse(npm(['pack', '--ignore-scripts', '--json', '--pack-destination', work], root));
    tgz = join(work, packed.filename);
  }
  const expectedName = `skolo-saka-school-search-${pkg.version}.tgz`;
  if (basename(tgz) !== expectedName) fail(`expected ${expectedName}, got ${basename(tgz)}`);
  const files = execFileSync('tar', ['-tzf', basename(tgz)], { cwd: resolve(tgz, '..'), encoding: 'utf8' })
    .split(/\r?\n/).filter(Boolean).map(f => f.replace(/^package\//, ''));
  const required = ['package.json', 'README.md', 'LICENSE', 'THIRD_PARTY_NOTICES.md',
    'dist/index.js', 'dist/index.cjs', 'dist/index.d.ts', 'dist/styles.css'];
  for (const f of required) if (!files.includes(f)) fail(`missing from the package: ${f}`);
  const stray = files.filter(f => /^(src|test|demo|scripts|\.github)\/|\.tgz$|^node_modules\//.test(f));
  if (stray.length) fail(`should not be published: ${stray.join(', ')}`);
  const sha256 = createHash('sha256').update(readFileSync(tgz)).digest('hex');
  const sha512 = createHash('sha512').update(readFileSync(tgz)).digest('base64');
  console.log(`${basename(tgz)}: ${files.length} files, sha256 ${sha256}, integrity sha512-${sha512}`);

  // 2. A clean consumer app that installs only the tarball and React
  const app = join(work, 'consumer');
  execFileSync(process.execPath, ['-e', `require('fs').mkdirSync(${JSON.stringify(app)})`]);
  copyFileSync(tgz, join(app, expectedName));
  writeFileSync(join(app, 'package.json'), JSON.stringify({ name: 'consumer', private: true, type: 'module' }));
  npm(['install', '--no-audit', '--no-fund', '--ignore-scripts', `./${expectedName}`,
    'react@19', 'react-dom@19', '@types/react@19', 'typescript@5'], app);

  writeFileSync(join(app, 'esm.mjs'), `
    import { createElement as h } from 'react';
    import { renderToString } from 'react-dom/server';
    import * as m from '@skolo-saka/school-search';
    import { createRequire } from 'node:module';
    for (const name of ['SchoolSearch', 'useSchoolSearch', 'schoolPlace', 'defaultMessages'])
      if (!(name in m)) throw new Error('ESM export missing: ' + name);
    const html = renderToString(h(m.SchoolSearch, { searchSchools: async () => [], onSelectSchool() {} }));
    if (!html.includes('role="combobox"')) throw new Error('SchoolSearch did not render a combobox');
    if (m.schoolPlace({ id: 'x', name: 'Fictional School', level: 'primary', town: 'Riverbend', province: 'Limpopo' }) !== 'Primary school, Riverbend, Limpopo')
      throw new Error('schoolPlace returned an unexpected place line');
    const req = createRequire(import.meta.url);
    const cjs = req('@skolo-saka/school-search');
    if (typeof cjs.SchoolSearch !== 'function') throw new Error('CommonJS build has no SchoolSearch');
    const css = req('fs').readFileSync(req.resolve('@skolo-saka/school-search/styles.css'), 'utf8');
    if (!css.includes('.skolo-search')) throw new Error('styles.css export is wrong');
    console.log('ESM, CommonJS, server render and styles.css: ok');
  `);
  execFileSync(process.execPath, ['esm.mjs'], { cwd: app, stdio: 'inherit' });

  writeFileSync(join(app, 'app.tsx'), `
    import { SchoolSearch, type School, type SchoolSearchProps } from '@skolo-saka/school-search';
    import '@skolo-saka/school-search/styles.css';
    const props: SchoolSearchProps = { searchSchools: async (): Promise<School[]> => [], onSelectSchool: (s: School) => void s.id };
    export const App = () => <SchoolSearch {...props} />;
    // @ts-expect-error searchSchools is required
    export const Broken = () => <SchoolSearch onSelectSchool={() => {}} />;
  `);
  writeFileSync(join(app, 'css.d.ts'), "declare module '*.css';\n");
  // Bundler resolution, as Next.js, Vite and the Skolo Saka website use. node16/nodenext resolution
  // needs explicit .js specifiers in the declarations: skolo-saka/school-search#10.
  for (const resolution of ['bundler']) {
    writeFileSync(join(app, 'tsconfig.json'), JSON.stringify({ compilerOptions: {
      strict: true, noEmit: true, jsx: 'react-jsx', skipLibCheck: false, target: 'es2022',
      module: resolution === 'bundler' ? 'esnext' : 'nodenext', moduleResolution: resolution }, files: ['app.tsx', 'css.d.ts'] }));
    execFileSync(process.execPath, [join(app, 'node_modules/typescript/bin/tsc'), '-p', '.'], { cwd: app, stdio: 'inherit' });
  }
  console.log('TypeScript types (bundler resolution): ok');
} catch (e) {
  fail(e.message);
} finally {
  rmSync(work, { recursive: true, force: true });
}
if (!process.exitCode) console.log('check-package: ok');
