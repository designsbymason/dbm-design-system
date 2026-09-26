import { resolveLanguage } from "./tokenize";

/**
 * What the copy button puts on the clipboard for `code`. It is `code` itself, except in shell code, where a
 * leading `$ ` prompt is taken off each line that has one: `$ pnpm add x` is shown as it is written in a terminal,
 * but pasted into one, the `$` is a command that doesn't exist. Only a `$` followed by a space counts (a line
 * starting `$HOME` or `$(cmd)` is code), indentation is kept, and lines without a prompt (a comment, a script line,
 * output) are copied as they are.
 */
export function textToCopy(code: string, language: string | undefined, stripPrompt: boolean): string {
  if (!stripPrompt || resolveLanguage(language) !== "bash") return code;
  return code.replace(/^([ \t]*)\$ /gm, "$1");
}
