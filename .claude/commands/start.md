---
description: Load context for a session (reads only the guidelines the task needs, verifies against the repo, then waits)
argument-hint: <today's task, e.g. "build the Dialog organism">
---

This is the DBM Design System project (@dbm-design-system npm scope, monorepo at this path). Before any work, get up to speed. This is a context-loading step only: make no code or guideline changes.

Today's task: $ARGUMENTS

If no task is given above, say so and ask me for one before reading anything.

1. CLAUDE.md and my memory are already loaded; don't re-read them.
2. Read the guidelines this task needs. Choose them with CLAUDE.md's "Where to look before you build something" table and `guidelines/01-vision-and-goals.md` §13 (the roadmap). State which ones you chose and why, read those in full, and skip the rest. For component work that means `04-component-inventory.md`, `05-component-api-conventions.md`, `06-engineering-standards.md` (§8 process rules, §9 review checklist) and `07-storybook-and-documentation-standards.md` §4–§6.
3. Verify against the repo, not the docs: run `pnpm check-guidelines`, `git status` and `git log --oneline -15`, and open the packages or folders the task touches.
4. Reply with a short summary:
   - the task as you understand it;
   - what already exists for it, and what the relevant guidelines require;
   - open decisions, known flakes or accepted advisories that could affect it;
   - anything `check-guidelines` or the git state flagged.

Then wait for my instruction.
