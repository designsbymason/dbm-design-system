// The languages an app has registered with `registerCodeLanguage`, looked up by name or alias. Module-level state on
// purpose: an app registers once, at start, and every `CodeBlock` sees it (see ADR-0027).

import type { CodeLanguage } from "./tokenizeTypes";

const registered = new Map<string, CodeLanguage>();
const listeners = new Set<() => void>();

const keyOf = (name: string) => name.trim().toLowerCase();

const isLanguage = (language: unknown): language is CodeLanguage =>
  typeof language === "object" &&
  language !== null &&
  typeof (language as CodeLanguage).name === "string" &&
  keyOf((language as CodeLanguage).name) !== "" &&
  typeof (language as CodeLanguage).tokenize === "function";

const namesOf = (language: CodeLanguage) =>
  [language.name, ...(Array.isArray(language.aliases) ? language.aliases : [])].filter((name): name is string => typeof name === "string" && keyOf(name) !== "").map(keyOf);

/**
 * Teaches every `CodeBlock` a language: by its `name` and `aliases`, `language="python"` then draws with it. A
 * registered language takes over from a built-in one of the same name, which is how a fuller grammar replaces
 * the approximate one. Call it once, when the app starts. Registering a name again replaces it.
 *
 * A block that is already on the page redraws when a language is registered, so a grammar loaded later
 * (`import("…").then(register)`) colours the blocks that were drawn plain.
 *
 * @returns A function that undoes the registration.
 * @example
 * ```ts
 * import { pythonLanguage, registerCodeLanguage } from "@dbm-design-system/components";
 * registerCodeLanguage(pythonLanguage);
 * ```
 */
export function registerCodeLanguage(language: CodeLanguage): () => void {
  if (!isLanguage(language)) {
    throw new TypeError("registerCodeLanguage: a language needs a `name` (a string) and a `tokenize` function.");
  }
  const keys = namesOf(language);
  for (const key of keys) registered.set(key, language);
  listeners.forEach((listener) => listener());
  return () => {
    let changed = false;
    // Only take out the names that are still this language's, so an unregister can't remove a later replacement.
    for (const key of keys) {
      if (registered.get(key) === language) {
        registered.delete(key);
        changed = true;
      }
    }
    if (changed) listeners.forEach((listener) => listener());
  };
}

/** The registered language a `language` string names, if any. */
export function findRegisteredLanguage(language: string | undefined): CodeLanguage | undefined {
  return typeof language === "string" ? registered.get(keyOf(language)) : undefined;
}

/** For `useSyncExternalStore`: a change of registrations. */
export function subscribeToCodeLanguages(listener: () => void): () => void {
  listeners.add(listener);
  return () => void listeners.delete(listener);
}
