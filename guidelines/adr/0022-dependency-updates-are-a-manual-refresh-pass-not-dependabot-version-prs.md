# 0022 — Dependency updates are a manual refresh pass, not Dependabot version-update PRs

**Status:** Accepted · **Date:** 2026-09-20

## Context
`dependabot.yml` asked Dependabot for weekly version updates (npm and GitHub Actions), and `CLAUDE.md` and `02-tech-stack-and-structure.md` described that as "automated dependency update PRs". In practice it produced none: pull requests are disabled on this repo (a sole-maintainer project that merges no external PRs), so Dependabot could only push a branch per update and never open a PR. Seventeen such branches had accumulated, each one commit ahead of `main`, none ever reviewed. CI runs only on pushes to `main` and on pull requests, so none had ever been built or tested either. Five of them were GitHub Actions major-version bumps.

Vulnerabilities were never handled through those branches. Alerts and security updates are separate repo settings (both on, with no open alerts), `pnpm audit` runs in CI, and the vulnerable packages have mostly been transitive dev tooling that a version-bump PR for a direct dependency can't reach — fixed by hand with `pnpm-workspace.yaml` overrides (`02` §3.1).

## Decision
Dependabot **version updates are off** (`open-pull-requests-limit: 0` on both ecosystems, with the reason written at the top of `dependabot.yml`). Alerts, security updates and `pnpm audit` in CI stay as they were. Routine updates — npm packages and the GitHub Actions pins — are taken in a periodic, deliberate **manual refresh pass** (`02` §3.2), and vulnerabilities continue to be fixed by hand as `02` §3.1 describes.

## Alternatives considered
- **Re-enable pull requests, limiting who can open them, and let Dependabot's PRs arrive.** The strongest alternative: each bump would get a full CI run before merging. Rejected because it protects little that isn't already covered — security is handled separately, and the routine bumps are low-stakes and easy to take in a batch — and it would change a governance setting to serve a convenience. Whether the repo offers a collaborators-only option for PR creation was not confirmed.
- **Hand-merge the Dependabot branches.** Rejected: none had been CI-tested, and the Actions majors are the bumps most likely to break a workflow.
- **Leave the config running as it was.** Rejected: it looked like automation while producing only invisible branches, and it left the docs describing something that wasn't happening.
- **Delete the config.** Rejected in favour of limit `0`: it keeps the decision and its reason next to the file that would otherwise re-enable it.

## Consequences
- **Nothing prompts a routine update.** The refresh pass is the whole mechanism; if it isn't run, dependencies drift. Cadence and steps are in `02` §3.2.
- **Security handling is unchanged.**
- **Agents should not expect Dependabot PRs**, or assume `gh pr` workflows exist: `gh pr list` returns nothing and the pulls API returns 404.
- **Phase 8 has to decide this.** The standard Changesets release action opens a "Version Packages" pull request, which can't work while PRs are disabled. Phase 8 must either enable PRs or run `changeset version` and `publish` some other way. Not decided here; see `01-vision-and-goals.md` §13.
- Reversing it means enabling pull requests and raising the limits; that would supersede this record.

## Related
`02-tech-stack-and-structure.md` §3 (the dependency-scanning row), §3.1 (vulnerability remediation), §3.2 (the refresh pass). `CLAUDE.md`'s Security practices. `01-vision-and-goals.md` §10 and §13.
