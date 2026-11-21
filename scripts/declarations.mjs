// Writes CommonJS declarations next to the ES module ones that tsc emits, so each export condition
// gets types in its own module format (skolo-saka/school-search#10):
//   import  -> dist/index.d.ts   (ESM, because the package is "type": "module")
//   require -> dist/index.d.cts  (CommonJS)
// Each .d.cts is a copy of its .d.ts with relative './x.js' specifiers rewritten to './x.cjs', which
// TypeScript resolves to the matching .d.cts. Only relative specifiers change; 'react' and the like stay.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dist = 'dist';
const relativeJs = /(from\s+|import\s*\(\s*)(['"])(\.\.?\/[^'"]+?)\.js\2/g;
let count = 0;
for (const file of readdirSync(dist)) {
  if (!file.endsWith('.d.ts')) continue;
  const source = readFileSync(join(dist, file), 'utf8');
  if (/(from\s+|import\s*\(\s*)['"]\.\.?\/[^'"]*(?<!\.js)['"]/.test(source)) {
    throw new Error(`${file} has a relative import without a .js extension`);
  }
  writeFileSync(join(dist, file.replace(/\.d\.ts$/, '.d.cts')), source.replace(relativeJs, '$1$2$3.cjs$2'));
  count++;
}
if (!count) throw new Error('no declarations found in dist; run tsc first');
console.log(`declarations: wrote ${count} .d.cts files`);
