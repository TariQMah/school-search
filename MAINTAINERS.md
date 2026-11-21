# Maintainers

| Maintainer | Responsibilities |
| --- | --- |
| [@Mahlatse32](https://github.com/Mahlatse32) | Review, npm releases, the Skolo Saka website integration |
| [@EmmanuelTshehla](https://github.com/EmmanuelTshehla) | Review and releases |

## What maintainers do

- **Triage:**
  - label new issues within about a week;
  - mark well-scoped tasks `good first issue` or `help wanted`;
  - remove personal information from reports. Edit it out, or close the issue and ask for a new one without it.
- **Review:**
  - every change needs one approval from a maintainer who isn't its author;
  - check tests, accessibility (keyboard and screen reader for UI changes) and fictional test data;
  - say which version type the change needs ([RELEASING.md](RELEASING.md#versions)).
- **Releases:** follow [RELEASING.md](RELEASING.md). Only repository administrators can create `v*` tags, and npm accepts publishes only from the release workflow.
- **The website:** after a release, review the website's package-update merge request. Patches merge automatically once its UAT pipeline passes; minor and major versions wait for a website maintainer.
- **Security:** acknowledge private vulnerability reports within 5 working days ([SECURITY.md](SECURITY.md)).

Regular contributors who review well may be invited to become maintainers. Access is granted by the organisation's owners.
