# Releasing

`@skolo-saka/school-search` is published to [npm](https://www.npmjs.com/package/@skolo-saka/school-search) by the [Release workflow](.github/workflows/release.yml) when a maintainer pushes a version tag. Nobody publishes from a laptop, and no npm token is stored anywhere.

## Versions

The package follows [semantic versioning](https://semver.org/). While it is 0.x:

- **Patch** (0.1.0 → 0.1.1): fixes, styling corrections, tests and documentation. No prop or behaviour a consumer relies on changes.
- **Minor** (0.1.x → 0.2.0): new props or features, and any change that could need work in a consuming app, such as renamed props, changed markup or class names, or different keyboard behaviour.
- **Major** (1.0.0): reserved for when the API is declared stable.

Pick the version from what changed since the last tag, not from the size of the change. A version number is never reused, even if a release is deprecated.

## Contributor review

Every change reaches `main` through a pull request:

- The **Typecheck, test and build** check must pass on the latest commit.
- One maintainer other than the author must approve. A new commit dismisses an earlier approval.
- All review conversations must be resolved. Administrators follow the same rules, and `main` accepts no direct pushes.

Pull requests from forks run CI with read-only permissions and no secrets. The release workflow runs its checks and a publish dry run on pull requests that touch packaging, with no publishing permission.

## Release a version

1. Open a pull request that sets `version` in `package.json` and `package-lock.json` (`npm version <x.y.z> --no-git-tag-version`). Mention the changes it releases. Merge it after review.
2. Tag the merge commit on `main` and push the tag. Only repository administrators can create `v*` tags.

   ```bash
   git switch main && git pull --ff-only
   git tag -a v0.1.1 -m "v0.1.1"
   git push origin v0.1.1
   ```

3. The Release workflow then:
   - checks that the tag matches `package.json`, that the commit is on `main` and that npm does not have the version yet
   - runs the typecheck, tests, package build and demo build
   - packs the package and checks it in a clean app: exports, types, `styles.css`, licence and README
   - publishes that tarball to npm with provenance through trusted publishing, in the `npm` environment, which only `v*` tags can use
   - creates the GitHub release for the tag, attaching the same tarball after checking it against npm's integrity hash

4. Check the result:

   ```bash
   npm view @skolo-saka/school-search@0.1.1 version gitHead dist.integrity
   ```

   ```bash
   npm audit signatures
   ```

   (Run `npm audit signatures` in a project that installs the package.) The npm page shows "Built and signed on GitHub Actions" with a link to the workflow run and commit.

5. The [demo](https://skolo-saka.github.io/school-search/) deploys from `main` on every merge, so it already shows the released code.

If a release fails before the publish step, fix the problem through a pull request, delete the tag and push it again on the new commit. Once npm has a version, never move or reuse its tag: release the next patch instead.

## npm settings (owner only)

These settings are on npmjs.com, under the package's **Settings** tab. Only an npm owner of the `@skolo-saka` scope can change them.

- **Trusted publisher:** GitHub Actions, organization `skolo-saka`, repository `school-search`, workflow `release.yml`, environment `npm`.
- **Publishing access:** "Require two-factor authentication and disallow tokens". Trusted publishing keeps working, and stolen or forgotten tokens cannot publish.

Nothing needs renewing: trusted publishing uses a short-lived token issued for each workflow run. If the workflow file or environment is renamed, update the trusted publisher first.

## How the website updates

The Skolo Saka website pins an exact version. A bot in the website's GitLab project checks npm every 30 minutes. When a new version appears, it opens a merge request into the website's `staging` branch that updates `package.json` and the lockfile. The merge request pipeline runs the website's unit, type, browser, build and security checks and deploys to UAT.

- **Patch releases** merge automatically once that pipeline has passed. `staging` then deploys to UAT.
- **Minor and major releases** wait for a website maintainer's review.

Production is promoted separately, through the website's normal `staging` → `main` release merge request, review and deployment. Publishing a package version never changes production on its own.
