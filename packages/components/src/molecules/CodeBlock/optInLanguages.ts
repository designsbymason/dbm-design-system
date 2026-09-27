/**
 * The languages that ship outside the core, by every name they answer to, and the export that turns each on. It
 * lets `CodeBlock` say, in development, that a block asked for one nobody registered (it would otherwise draw
 * plain text without a word), and lets the Playground's snippet say how to register. A test holds it to
 * the grammars in `grammars/`, so the two can't drift apart.
 */
export const optInLanguageExports: Readonly<Record<string, string>> = {
  python: "pythonLanguage",
  py: "pythonLanguage",
  python3: "pythonLanguage",
  yaml: "yamlLanguage",
  yml: "yamlLanguage",
  sql: "sqlLanguage",
  postgresql: "sqlLanguage",
  postgres: "sqlLanguage",
  pgsql: "sqlLanguage",
  mysql: "sqlLanguage",
  sqlite: "sqlLanguage",
  markdown: "markdownLanguage",
  md: "markdownLanguage",
  go: "goLanguage",
  golang: "goLanguage",
  rust: "rustLanguage",
  rs: "rustLanguage",
  java: "javaLanguage",
  c: "cLanguage",
  h: "cLanguage",
  cpp: "cppLanguage",
  "c++": "cppLanguage",
  cc: "cppLanguage",
  cxx: "cppLanguage",
  hpp: "cppLanguage",
  hh: "cppLanguage",
  csharp: "csharpLanguage",
  cs: "csharpLanguage",
  "c#": "csharpLanguage",
  kotlin: "kotlinLanguage",
  kt: "kotlinLanguage",
  kts: "kotlinLanguage",
  swift: "swiftLanguage",
  ruby: "rubyLanguage",
  rb: "rubyLanguage",
  php: "phpLanguage",
  toml: "tomlLanguage",
};

/** The export that turns on the opt-in language a `language` string names, if it names one. */
export function optInExportFor(language: unknown): string | undefined {
  if (typeof language !== "string") return undefined;
  const name = language.trim().toLowerCase();
  return Object.hasOwn(optInLanguageExports, name) ? optInLanguageExports[name] : undefined;
}
