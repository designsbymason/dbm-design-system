/**
 * `CodeBlock`'s syntax highlighter: a small, dependency-free tokenizer that turns source text into lines of
 * typed tokens. It returns plain data — the component renders each token as a React element, so nothing here
 * ever builds or injects HTML.
 *
 * It is a lexer, not a parser: an ordered list of sticky regular expressions per language, with a little state
 * (inside a tag, inside a block) for the few places a token's meaning depends on what came before. It is
 * deliberately approximate — good enough that code reads well, not a substitute for a real grammar — and it
 * has one hard guarantee: joining every token's text gives back the input exactly, whatever the input is.
 *
 * This file only decides who highlights a block; the built-in languages are in `builtinGrammars.ts`, the checks on
 * what an app supplies in `checkedTokens.ts`, and the opt-in languages in `grammars/`.
 */

import { resolveLanguage, tokenizeBuiltin } from "./builtinGrammars";
import { runChecked, warnOnce } from "./checkedTokens";
import { plainLines } from "./engine";
import { optInExportFor } from "./optInLanguages";
import { findRegisteredLanguage } from "./registry";
import { MAX_HIGHLIGHT_LENGTH } from "./tokenizeTypes";
import type { CodeLanguage, Highlighter, TokenLine } from "./tokenizeTypes";

export { builtinLabel, resolveLanguage } from "./builtinGrammars";
export { MAX_HIGHLIGHT_LENGTH } from "./tokenizeTypes";
export type { CodeLanguage, Highlighter, HighlightLanguage, Token, TokenLine, TokenType } from "./tokenizeTypes";

/**
 * Tokenizes `code` into lines of tokens. Line endings are normalised to `\n`, and one trailing newline is dropped
 * (a template literal's usual last character is not a line). Joining every token's text with `\n` between lines
 * returns the input, whichever way it was highlighted.
 *
 * Who highlights it, in order: the block's own `highlighter`; a language registered with `registerCodeLanguage`;
 * a built-in one. Text past a language's `maxLength` (30,000 for the built-in and shipped ones, none for an
 * app's own) and any language nobody knows come back as plain lines.
 */
export function tokenize(
  code: string,
  language: string | undefined,
  highlighter?: Highlighter,
  registered: CodeLanguage | undefined = findRegisteredLanguage(language),
): TokenLine[] {
  const source = String(code ?? "").replace(/\r\n?/g, "\n").replace(/\n$/, "");
  if (typeof highlighter === "function") {
    const own = runChecked(source, "the `highlighter` prop", () => highlighter(source, language));
    if (own) return own;
  }
  if (registered) {
    if (registered.maxLength !== undefined && source.length > registered.maxLength) return plainLines(source);
    const lines = runChecked(source, `the registered language "${registered.name}"`, () => registered.tokenize(source));
    return lines ?? plainLines(source);
  }
  const resolved = resolveLanguage(language);
  if (!resolved) {
    // Nothing draws this language. If it is one that ships outside the core, the likely reason is that the app
    // hasn't registered it, and plain text with no explanation looks like a bug in the component.
    // Development only, so a production build drops the name list along with the warning.
    const optIn = process.env.NODE_ENV === "production" ? undefined : optInExportFor(language);
    if (optIn) {
      warnOnce(`CodeBlock: language "${String(language).trim()}" is opt-in, so it is drawn as plain text until the app calls registerCodeLanguage(${optIn}), once, when it starts.`);
    }
    return plainLines(source);
  }
  if (source.length > MAX_HIGHLIGHT_LENGTH) return plainLines(source);
  return tokenizeBuiltin(source, resolved);
}
