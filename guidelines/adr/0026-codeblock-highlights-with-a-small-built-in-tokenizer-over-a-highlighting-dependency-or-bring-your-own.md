# 0026 — `CodeBlock` highlights with a small built-in tokenizer, over a highlighting dependency or bring-your-own

**Status:** Accepted · **Date:** 2026-09-26

## Context
`CodeBlock` is documented as "multi-line, syntax-highlighted, copy button". Nothing in the repository highlights code, so the first build had to decide where the colouring comes from. This is a dependency decision as much as a component one: `CLAUDE.md` allows almost no dependencies (Radix and an optional Motion), and a highlighter is the kind of package that brings real weight (a grammar per language, often megabytes of them) and its own upkeep. It is also a security decision: `CLAUDE.md` names `CodeBlock` when it bans `dangerouslySetInnerHTML` without sanitising, and many highlighters work by returning an HTML string.

## Decision
`CodeBlock` ships **its own small tokenizer** (`molecules/CodeBlock/tokenize.ts`), with no dependency:

- **A lexer, not a parser:** an ordered list of sticky regular expressions per language, and a few counters of state where meaning depends on what came before (inside a tag, in JSX text, in a CSS block). It covers `ts`, `tsx`, `js`, `jsx`, `json`, `css`, `html`, `bash` and `diff`, with aliases; any other language is drawn as plain text. It is approximate by design and says so in its docs.
- **It returns data, never HTML.** The result is lines of `{ type, text }` tokens, and the component renders each as a React element, so `code` is always drawn as text and no `dangerouslySetInnerHTML` exists anywhere in the component.
- **One hard guarantee, enforced by tests:** joining the tokens' text gives back the input exactly, for every language and any input (a deterministic stream of awkward characters is part of the suite), so highlighting can never lose or alter code, and it always finishes (each step consumes at least one character; text past 30,000 characters is drawn plain).
- **Ten token kinds, each a semantic token:** `text.syntax-keyword`, `-string`, `-number`, `-function`, `-type`, `-property`, `-tag`, `-comment`, `-inserted`, `-deleted`, under the existing `text` category, plus `bg.code-block` and `bg.code-highlight` for the surfaces. Every colour is measured against both surfaces in all four themes (4.5:1 or more), so highlighting is theme-aware and AA like everything else.

## Alternatives considered
**A highlighting dependency** — rejected. It gives accurate output for many languages, but it breaks the "no or limited dependencies" principle for a feature most blocks use lightly, adds real bundle weight (or a lazy-loading and asynchronous-rendering story, which makes a block render empty at first and flash), needs an entry in the approved stack and the manual refresh pass, and, for most, returns HTML that would have to be sanitised or parsed back into elements.

**Bring your own highlighter only** (a render hook or pre-tokenised input, no grammar in the library) — rejected. It costs nothing to maintain, but every block is plain text out of the box, which undercuts the component's stated purpose, and every consumer, human or agent, has to choose and wire a highlighter before the first example looks right.

## Consequences
- Highlighting works out of the box, offline, with no dependency, and renders on the first frame, server and client alike.
- **The grammars are ours to keep right.** Approximate is accepted, and a wrong colour on an odd construct is a bug to fix in `tokenize.ts` (with a test), not a limitation of a third party. The set of languages is small on purpose; a language is added by adding a rule list and its tests.
- **Constrains what follows:** any later feature that colours code (an inline highlighted `Code`, a diff view, an editor-style component) should use this tokenizer and these tokens rather than adding a second way to colour code. A component that needs to render highlighted output from another source builds elements from tokens too, never from an HTML string.
- **A consumer who wants a full grammar** has no hook for it today; one is recorded as a gap in `component-reviews/CodeBlock.md`, to be built if a real need appears, and it would take tokens (per the point above), not an HTML string.

## Related
`CLAUDE.md` (dependencies; component-level security), `03-token-system-spec.md` (the syntax tokens and their contrast measurements), `component-reviews/CodeBlock.md`, [ADR-0019](0019-table-owns-an-overflow-aware-scroll-container-and-puts-native-props-on-the-table-element.md) (the scroll frame `CodeBlock` follows).
