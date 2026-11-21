# Changelog

All notable changes to `@skolo-saka/school-search`. Versions follow [semantic versioning](https://semver.org/); see [RELEASING.md](RELEASING.md).

## 0.2.0 (2026-11-21)

**Changed (minor: keyboard behaviour)**
- On a closed results list, ArrowDown opens it on the first school, and ArrowUp opens it on the last. Before, ArrowUp moved a hidden highlight with nothing shown or announced, and ArrowDown reopened one school further on ([#8](https://github.com/skolo-saka/school-search/issues/8), [#14](https://github.com/skolo-saka/school-search/pull/14)).
- Home and End keep moving the text caret, as the ARIA editable combobox pattern recommends. The README documents every key.

**Fixed**
- TypeScript declarations now load with `node16` and `nodenext` module resolution. CommonJS consumers get their own `.d.cts` types ([#10](https://github.com/skolo-saka/school-search/issues/10), [#15](https://github.com/skolo-saka/school-search/pull/15)).
- The verified badge stays beside long school names on small phone screens ([#4](https://github.com/skolo-saka/school-search/issues/4), [#7](https://github.com/skolo-saka/school-search/pull/7)).

**Documentation and tooling**
- How to tell schools with the same name apart ([#6](https://github.com/skolo-saka/school-search/pull/6)), keyboard edge tests ([#9](https://github.com/skolo-saka/school-search/pull/9)) and the live-directory demo ([#13](https://github.com/skolo-saka/school-search/pull/13)).
- Releases are published from version tags with npm provenance ([#11](https://github.com/skolo-saka/school-search/pull/11)).
- The package check type-checks clean apps with bundler, node16 and nodenext resolution and runs arethetypeswrong.
- Contributor files: maintainers, CODEOWNERS, a feature form and Dependabot ([#16](https://github.com/skolo-saka/school-search/pull/16)).

0.1.1 was prepared but never published. Its changes are included here.

## 0.1.0 (2026-11-17)

First release: the homepage school search extracted into a reusable React component.
