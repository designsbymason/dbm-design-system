/**
 * What `CodeBlock` does with tokens it did not produce (a registered language's, a block's own `highlighter`): check
 * them before anything draws them, and say, in development, why one was thrown away. Nothing an app supplies can lose,
 * change or crash on the code it was given: the caller falls back to plain text.
 */

import type { TokenLine } from "./tokenizeTypes";

const TOKEN_TYPES = new Set(["keyword", "string", "number", "function", "type", "property", "tag", "comment", "inserted", "deleted"]);

const warned = new Set<string>();
/** A development-only warning, once per message. */
export function warnOnce(message: string) {
  if (process.env.NODE_ENV === "production" || warned.has(message)) return;
  warned.add(message);
  console.warn(message);
}

/**
 * Runs a language or highlighter that isn't ours over the text and checks what comes back before anything draws it:
 * an array of lines of `{ type?, text }`, no newline inside a token, and joining the tokens with a newline between
 * the lines giving back the text exactly. Anything else (or a throw) is `undefined`, so a faulty highlighter
 * can't lose, change or crash on the code it was given: the caller falls back to plain text. The result is a copy
 * with unknown token types dropped, so nothing the highlighter returns reaches a class name unchecked.
 */
export function runChecked(source: string, name: string, run: () => TokenLine[] | undefined): TokenLine[] | undefined {
  let result: unknown;
  try {
    result = run();
  } catch (error) {
    warnOnce(`CodeBlock: ${name} threw (${error instanceof Error ? error.message : String(error)}) — the code is drawn plain.`);
    return undefined;
  }
  if (result === undefined) return undefined;
  const lines: TokenLine[] = [];
  if (Array.isArray(result)) {
    for (const line of result) {
      if (!Array.isArray(line)) return reject(name);
      const tokens: TokenLine = [];
      for (const token of line) {
        const text: unknown = token?.text;
        if (typeof text !== "string" || text.includes("\n")) return reject(name);
        if (text === "") continue;
        const type: unknown = token.type;
        tokens.push(typeof type === "string" && TOKEN_TYPES.has(type) ? { type: type as never, text } : { text });
      }
      lines.push(tokens);
    }
  }
  if (lines.length === 0 || lines.map((line) => line.map((token) => token.text).join("")).join("\n") !== source) return reject(name);
  return lines;
}

function reject(name: string): undefined {
  warnOnce(`CodeBlock: ${name} didn't return lines of { type?, text } tokens that join back to the code — the code is drawn plain.`);
  return undefined;
}
