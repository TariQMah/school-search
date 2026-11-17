# Security policy

## Reporting a vulnerability

Please report security problems privately. Do not open a public issue, pull request or discussion for them.

1. Go to the repository's [Security tab](https://github.com/skolo-saka/school-search/security) and choose **Report a vulnerability** ([direct link](https://github.com/skolo-saka/school-search/security/advisories/new)). Only you and the maintainers can see the report.
2. Include what an attacker could do, the affected version or commit, and the steps or code to reproduce it.

If you cannot use GitHub, email [info@skolosaka.co.za](mailto:info@skolosaka.co.za) with "Security: school-search" in the subject and no exploit details; a maintainer will reply with a private way to share them.

We aim to acknowledge reports within 5 working days and to agree a fix and disclosure date with you. We credit reporters in the advisory unless you ask us not to.

## Supported versions

| Version | Supported |
| --- | --- |
| 0.1.x | Yes |

## Scope

This repository is a React component and a demo with fictional data. It has no server, stores nothing and sends nothing on its own: the app that uses it supplies `searchSchools`. Problems in that app's data source belong to that app.
