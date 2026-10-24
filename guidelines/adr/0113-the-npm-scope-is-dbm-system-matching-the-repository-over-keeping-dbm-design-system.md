# 0113 — The npm scope is `@dbm-system`, matching the repository, over keeping `@dbm-design-system`

**Status:** Accepted · **Date:** 2026-10-23

## Context
The repository was renamed to `dbm-system` on 2026-10-23, and nothing is published yet. The packages were still named `@dbm-design-system/*`, so the scope no longer matched the repository. A published scope is effectively permanent: renaming it afterwards means publishing under the new scope, deprecating the old packages and breaking every consumer's imports. Until the first publish it costs only a mechanical rename.

## Decision
- **The npm scope is `@dbm-system`.** The seven workspace packages are `@dbm-system/tokens`, `primitives`, `icons`, `components`, `manifest`, `eslint-config` and `tsconfig`; the private workspace root is named `dbm-system`.
- **It was done as one pure rename before any publish.** Imports, workspace dependencies, "Show code" snippets and their tests, Storybook config and the CI `--filter` lines changed together; the lockfile was regenerated.
- **The product's display name is "DBM System"** (the Storybook title, the guideline headings, the package descriptions), to match.
- **The `--dbm-*` custom properties and the `dbm-` class names are unchanged.** They are the design system's own prefix, not the npm scope, and renaming them is a separate decision with a much wider reach.
- **Five ADRs that named the old scope are amended in place** and marked (0004, 0013, 0020, 0023, 0043): a package name is a detail of those records, not what they decided.

## Alternatives considered
- **Keep `@dbm-design-system`.** Rejected: it would leave the scope and the repository named differently for as long as the project exists, and the cost of changing only goes up after the first publish.
- **`@dbm`.** Rejected: a three-letter name is likely to be taken by an unrelated account (an unscoped `dbm` package and a long-standing GitHub user of that name already exist), its availability could not be confirmed, and it is easy to confuse with unrelated `dbm-*` packages.
- **Rename the CSS prefix too.** Rejected for now: tens of thousands of occurrences across the tokens, the components and every consumer's stylesheet, with no gain for the scope question.

## Consequences
- Every import path in the docs and snippets reads `@dbm-system/...` from the first publish on; there is no old scope to deprecate.
- The npm organization `dbm-system` holds the scope. Its owner account needs 2FA, and Phase 8's trusted publishing binds a package to a GitHub owner and repository (`designsbymason/dbm-system` today). Moving the repository into an organization later means updating that binding.
- The scope and the GitHub owner need not match.

## Related
`01-vision-and-goals.md` §13 (the scope row, Phase 8); `02-tech-stack-and-structure.md` §3.1; amended ADRs 0004, 0013, 0020, 0023, 0043.
