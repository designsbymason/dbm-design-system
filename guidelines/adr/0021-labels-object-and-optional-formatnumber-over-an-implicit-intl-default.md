# 0021 — Text a component supplies is a `labels` object, and displayed numbers go through an optional `formatNumber` that defaults to plain output, over an implicit `Intl` default

**Status:** Accepted · **Date:** 2026-09-20

## Context

`Pagination` was the first component to supply text of its own — accessible names ("Previous page"), a compact summary ("Page 3 of 20"), a field label — and the first to display numbers a reader sees (the page buttons). Both had to be translatable. The first pass made the *words* translatable through a `labels` object, but the digit on each page button stayed the raw number, so a locale with its own numerals (`٥`) or digit grouping (`1.234`) could translate a button's accessible name but not what the button showed. That breaks label-in-name (WCAG 2.5.3): the name no longer contains the visible text. Any later component that shows a number (a slider value, a progress percentage, a table summary, a calendar) faces the same question, so the answer needs to be fixed once rather than re-derived per component. `06-engineering-standards.md` §7 already rules out a translation/string-externalization system for v1; the answer has to fit inside that.

## Decision

1. **Every piece of text a component supplies itself lives in one optional `labels` prop** (`Partial<…Labels>`), with English defaults. A label that needs numbers is a function of the plain numbers (`page: (n) => …`, `summary: (page, count) => …`).
2. **A component that displays numbers takes an optional `formatNumber?: (n: number) => string`, defaulting to `String`.** It writes the number on screen, and the **default** label functions use it too, so what a control shows is always inside its accessible name. A consumer's own label functions are handed the **plain** numbers and write them with the same function.
3. **Callbacks and native fields keep plain numbers.** `onValueChange` receives the number, not the formatted text; a native `<input type="number">` is the browser's own and is not affected.
4. **Nothing localises implicitly.** With no `formatNumber`, output is exactly what it was before the prop existed.
5. **When the visible text and the accessible name are separate labels** (`previousText` beside `previous`), the component warns in development if the name stops containing the text.

## Alternatives considered

- **Default to `Intl.NumberFormat()` with the browser's locale.** Rejected: it changes every existing consumer's output, and reading the browser's locale gives the server and the client different text — a hydration mismatch — in any server-rendered app.
- **A `locale` prop that the component formats with.** Rejected: it moves a formatting policy (which numerals, which grouping, which rounding) into every component, when the consumer already has `Intl.NumberFormat` and a locale of their own. One function does everything a locale string could, and nothing a component would have to guess.
- **Hand the label functions already-formatted strings.** Rejected: the signatures already took numbers, so it would be a breaking change, and a translator often wants to word the number themselves ("page five").
- **A translation/string-externalization system.** Rejected for v1 by `06` §7; `labels` plus one optional function is the smallest thing that keeps a component translatable without one.

## Consequences

Every future component that supplies text or displays a number follows the shape above, so an agent can predict the API without reading the component. The cost is that a consumer who wants localised numerals writes one line (`formatNumber={new Intl.NumberFormat("ar-EG").format}`) and, if they also write their own labels, uses the same function in them; the Docs page for each such component says so. A component that shows a number in several places must route all of them through `formatNumber`, or the name-contains-text guarantee is lost.

## Related

`06-engineering-standards.md` §7 (the no-translation-system stance this fits inside); `05-component-api-conventions.md` §3 (the convention itself); [Pagination.md](../component-reviews/Pagination.md) (where it was built, and why the visible-digit gap was found in its final review).
