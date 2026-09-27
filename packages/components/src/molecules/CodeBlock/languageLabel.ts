import { builtinLabel } from "./builtinGrammars";
import type { CodeLanguage } from "./tokenizeTypes";

/**
 * What the header calls a block's language: an app's own name for it (a registered language's `label`), else the built-in
 * one, else `undefined`, and the header shows what was written, set in capitals as a code. A label that is not a
 * string, or is blank, is ignored, and a registered one is trimmed.
 */
export function languageLabel(registered: CodeLanguage | undefined, language: unknown): string | undefined {
  const own = typeof registered?.label === "string" ? registered.label.trim() : "";
  return own || builtinLabel(language);
}
