---
description: After a push, work out whether CI needs watching, watch it if so, and report per job with failures checked against the known flakes
argument-hint: (optional run id; defaults to the latest CI run on main)
---

Report on CI for the latest push to `main`. Run id, if given: $ARGUMENTS

This repo has no pull requests (they are disabled), so use `gh` against the push's run, not any PR tooling. Change nothing and push nothing.

1. Find the run: `gh run list --workflow=CI --limit 2 --json databaseId,headSha,status,conclusion,createdAt`. Take the latest (or the id given) and the run before it.
2. Work out what the push contained: `git diff --stat <previous run's headSha>..<this run's headSha>`.
   - **Docs only** (`guidelines/`, READMEs, ADRs, review files, nothing else): don't wait. Report that CI is running, give the run id, and stop.
   - **Anything else** (components, tests, stories, CSS, tokens, scripts, workflows, `CLAUDE.md`, `.claude/`): watch the run to completion.
3. Report each job: `ci`, `browser-tests (ubuntu-24.04)`, and the informational `browser-tests (ubuntu-26.04)` leg, whose failure doesn't fail the run but still needs reporting. Also report the "Check guidelines" step's warning count, and the number of open Dependabot alerts.
4. For a failure, pull the failing test names and messages with `gh run view <id> --log-failed`, and say which are known: check the memory notes and the "Post-Finalization" entries in `guidelines/component-reviews/` for that test. Say whether the failing test ran on one Ubuntu image or both. A failure on both images, or on code the push changed, is not a flake until you've shown it.
5. If a failure is real, reproduce it locally before proposing a fix, and propose the fix without applying it.

Keep the report short: the run id, what the push contained, per-job result, and anything that needs me.
