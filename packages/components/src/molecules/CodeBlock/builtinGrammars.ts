/**
 * The languages built into the component: JavaScript and TypeScript (with JSX), JSON, CSS, HTML, shell and diff. They
 * ship with `CodeBlock` because most code is one of these; every other language is an opt-in `CodeLanguage` (see
 * `grammars/`). Same engine and same rules of the road as those (see `grammars/kit.ts`).
 */

import { scan, toLines } from "./engine";
import { notAfterWord, wordSet } from "./tokenizeTypes";
import type { HighlightLanguage, Rule, State, TokenLine } from "./tokenizeTypes";

const aliases: Record<string, HighlightLanguage> = {
  js: "js",
  javascript: "js",
  mjs: "js",
  cjs: "js",
  jsx: "jsx",
  ts: "ts",
  typescript: "ts",
  mts: "ts",
  cts: "ts",
  tsx: "tsx",
  json: "json",
  jsonc: "json",
  css: "css",
  scss: "css",
  html: "html",
  xml: "html",
  svg: "html",
  bash: "bash",
  sh: "bash",
  shell: "bash",
  zsh: "bash",
  console: "bash",
  diff: "diff",
  patch: "diff",
};

// The name shown in the header for what is written as `language`, by the name as written (so `svg` reads "SVG" and
// not "HTML"). A name that is not here is shown as it was written.
const labels: Record<string, string> = {
  ts: "TypeScript",
  typescript: "TypeScript",
  mts: "TypeScript",
  cts: "TypeScript",
  tsx: "TSX",
  js: "JavaScript",
  javascript: "JavaScript",
  mjs: "JavaScript",
  cjs: "JavaScript",
  jsx: "JSX",
  json: "JSON",
  jsonc: "JSONC",
  css: "CSS",
  scss: "SCSS",
  html: "HTML",
  xml: "XML",
  svg: "SVG",
  bash: "Bash",
  sh: "Shell",
  shell: "Shell",
  zsh: "Zsh",
  console: "Console",
  diff: "Diff",
  patch: "Diff",
};

/** The friendly name of a built-in language as written in `language`, or `undefined` if it has none. */
export function builtinLabel(language: unknown): string | undefined {
  if (typeof language !== "string") return undefined;
  const name = language.trim().toLowerCase();
  // Own names only: `constructor` and `toString` are on every object, and are not languages.
  return Object.hasOwn(labels, name) ? labels[name] : undefined;
}

/** The built-in grammar a `language` string names, or `undefined` if it has none. */
export function resolveLanguage(language: string | undefined): HighlightLanguage | undefined {
  // A `language` that isn't a string (a JavaScript caller, a missing value) has no grammar rather than a crash.
  if (typeof language !== "string") return undefined;
  const name = language.trim().toLowerCase();
  // Own names only: `constructor` and `toString` are on every object, and are not languages.
  return Object.hasOwn(aliases, name) ? aliases[name] : undefined;
}


// --- JavaScript / TypeScript -------------------------------------------------------------------------------

const jsKeywords = wordSet(
  "abstract as async await break case catch class const continue debugger declare default delete do else enum " +
    "export extends finally for function if implements import in instanceof interface keyof let namespace new " +
    "package private protected public readonly return satisfies static super switch this throw try typeof var " +
    "void while with yield",
);
const jsLiterals = wordSet("true false null undefined NaN Infinity");

/** Whether only whitespace or `export` separates this position from the start of its statement. */
const atStatementStart = (code: string, position: number) =>
  /(?:^|[\n;{}])[ \t]*(?:export[ \t]+|declare[ \t]+)*$/.test(code.slice(Math.max(0, position - 40), position));

/** TypeScript's built-in type names: ordinary names in JavaScript, so only `ts` and `tsx` colour them. */
const tsTypes = wordSet("any bigint boolean never number object string symbol unknown");

const jsClassifier =
  (typescript: boolean): Rule["classify"] =>
  (text, code, end) => {
    if (jsKeywords.has(text)) return "keyword";
    if (typescript && tsTypes.has(text)) return "type";
    if (jsLiterals.has(text)) return "number";
    // `from` and `type` are ordinary names as often as keywords; they count only where a statement uses them.
    if (text === "from" && /^\s*['"]/.test(code.slice(end, end + 6))) return "keyword";
    if (text === "type" && /^\s+[A-Za-z_$]/.test(code.slice(end, end + 4)) && atStatementStart(code, end - 4)) return "keyword";
    if (/^[A-Z]/.test(text) && /[a-z]/.test(text)) return "type";
    if (code[end] === "(") return "function";
    return undefined;
  };

const jsCore = (typescript: boolean): Rule[] => [
  { re: /\/\/[^\n]*/y, type: "comment" },
  { re: /\/\*[\s\S]*?(?:\*\/|$)/y, type: "comment" },
  { re: /'(?:[^'\\\n]|\\.)*'?/y, type: "string" },
  { re: /"(?:[^"\\\n]|\\.)*"?/y, type: "string" },
  { re: /`(?:[^`\\]|\\[\s\S])*`?/y, type: "string" },
  {
    re: /(?:0[xX][\da-fA-F_]+|0[bB][01_]+|\d[\d_]*(?:\.\d[\d_]*)?(?:[eE][+-]?\d+)?)n?/y,
    type: "number",
  },
  { re: /[A-Za-z_$][\w$]*/y, classify: jsClassifier(typescript) },
];

/**
 * JSX adds a second mode to the language: between a tag's `>` and the next `<` or `{`, the text is text, not
 * code (`<Button>Save</Button>` — `Save` is not a type). The rules below track that with a few counters; they
 * come before the ordinary rules and take over only where they apply.
 */
const jsxRules: Rule[] = [
  // Text between tags: everything up to the next `<` or `{` is plain.
  { re: /[^<{]+/y, when: (_code, _position, state) => state.inText },
  // An expression inside the text: code again until its `}`.
  {
    re: /\{/y,
    when: (_code, _position, state) => state.inText || state.expression > 0,
    after: (_text, state) => {
      state.expression += 1;
      state.inText = false;
    },
  },
  {
    re: /\}/y,
    when: (_code, _position, state) => state.expression > 0,
    after: (_text, state) => {
      state.expression -= 1;
      if (state.expression === 0) state.inText = state.openTags > 0;
    },
  },
  {
    // `<Button`, `</div`, and `<>` — but not the `<` of `Array<string>` or `a < b`.
    re: /<\/?(?:(?=[A-Za-z])[A-Za-z][\w.:-]*|(?=>))/y,
    type: "tag",
    when: (code, position, state) =>
      state.inText ||
      (!/[\w$)\]]/.test(code[position - 1] ?? "") && !/\s<\s/.test(code.slice(position - 1, position + 2))),
    after: (text, state) => {
      state.inTag = true;
      state.inText = false;
      state.closingTag = text.startsWith("</");
    },
  },
  {
    // The end of a tag; a `>` right after `=` is an arrow function inside an attribute, not the end.
    re: /\/?>/y,
    type: "tag",
    when: (code, position, state) => state.inTag && code[position - 1] !== "=",
    after: (text, state) => {
      state.inTag = false;
      if (text === "/>") {
        // Self-closing: nothing to close later.
      } else if (state.closingTag) {
        state.openTags = Math.max(0, state.openTags - 1);
      } else {
        state.openTags += 1;
      }
      state.inText = state.openTags > 0 && state.expression === 0;
    },
  },
  {
    re: /[A-Za-z_][\w:-]*(?==[^=])/y,
    type: "property",
    when: (_code, _position, state) => state.inTag,
  },
];

const jsRules = (jsx: boolean, typescript: boolean): Rule[] => (jsx ? [...jsxRules, ...jsCore(typescript)] : jsCore(typescript));

// --- JSON ---------------------------------------------------------------------------------------------------

const jsonRules: Rule[] = [
  { re: /\/\/[^\n]*/y, type: "comment" },
  { re: /\/\*[\s\S]*?(?:\*\/|$)/y, type: "comment" },
  { re: /"(?:[^"\\\n]|\\.)*"?(?=\s*:)/y, type: "property" },
  { re: /"(?:[^"\\\n]|\\.)*"?/y, type: "string" },
  { re: /-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/y, type: "number" },
  { re: /\b(?:true|false|null)\b/y, type: "number" },
];

// --- CSS ----------------------------------------------------------------------------------------------------

/** Whether the innermost open block holds declarations (`color: red`) rather than nested rules. */
const inDeclarations = (state: State) => state.blocks.length > 0 && !state.blocks[state.blocks.length - 1];

const cssRules: Rule[] = [
  { re: /\/\*[\s\S]*?(?:\*\/|$)/y, type: "comment" },
  { re: /'(?:[^'\\\n]|\\.)*'?/y, type: "string" },
  { re: /"(?:[^"\\\n]|\\.)*"?/y, type: "string" },
  { re: /@[\w-]+/y, type: "keyword" },
  { re: /!important\b/y, type: "keyword" },
  {
    re: /\{/y,
    after: (_text, state, code, end) => {
      // A block that holds rules (`@media`, `@layer`) is followed by selectors; any other holds declarations.
      const prelude = code.slice(state.statementStart, end - 1).trim();
      state.blocks.push(/^@(?:media|supports|layer|container|scope|document|starting-style)\b/.test(prelude));
      state.statementStart = end;
    },
  },
  {
    re: /\}/y,
    after: (_text, state, _code, end) => {
      state.blocks.pop();
      state.statementStart = end;
    },
  },
  { re: /;/y, after: (_text, state, _code, end) => void (state.statementStart = end) },
  {
    // A whole word at once, decided afterwards by what follows it — a call, or (inside a declaration block) a
    // property before its colon. A lookahead written into the pattern would retry from every letter of a long
    // word and go quadratic on one (a `data:` URI in a `url()`).
    re: /-{0,2}[A-Za-z_][\w-]*/y,
    classify: (_text, code, end, state) => {
      if (code[end] === "(") return "function";
      return inDeclarations(state) && /^\s{0,80}:/.test(code.slice(end, end + 81)) ? "property" : undefined;
    },
  },
  { re: /#[\da-fA-F]{3,8}\b/y, type: "number", when: (_code, _position, state) => inDeclarations(state) },
  { re: /[.#][A-Za-z_-][\w-]*/y, type: "type", when: (_code, _position, state) => !inDeclarations(state) },
  {
    re: /-?(?:\d+\.?\d*|\.\d+)(?:%|[A-Za-z]+)?/y,
    type: "number",
    when: (code, position) => !/[\w-]/.test(code[position - 1] ?? ""),
  },
];

// --- HTML / XML ---------------------------------------------------------------------------------------------

const htmlRules: Rule[] = [
  { re: /<!--[\s\S]*?(?:-->|$)/y, type: "comment" },
  { re: /<![A-Za-z][^>]*>?/y, type: "comment" },
  { re: /<\/?[A-Za-z][\w:.-]*/y, type: "tag", after: (_text, state) => void (state.inTag = true) },
  { re: /\/?>/y, type: "tag", when: (_code, _position, state) => state.inTag, after: (_text, state) => void (state.inTag = false) },
  { re: /"[^"]*"?/y, type: "string", when: (_code, _position, state) => state.inTag },
  { re: /'[^']*'?/y, type: "string", when: (_code, _position, state) => state.inTag },
  { re: /[^\s=/>"'<]+/y, type: "property", when: (_code, _position, state) => state.inTag },
  { re: /&#?\w+;/y, type: "number" },
];

// --- Shell --------------------------------------------------------------------------------------------------

const bashKeywords = wordSet(
  "if then else elif fi for while until do done case esac in function select time export local readonly return " +
    "exit break continue set unset source alias",
);

/** Whether a command name can start here: the start of a line, or after `|`, `;`, `&`, `(` or a `$` prompt. */
const atCommandStart = (code: string, position: number) =>
  /(?:^|[\n|;&(]|\b(?:then|do|else|elif|if|while|until|time)[ \t]+|![ \t]+)[ \t]*(?:\$[ \t]+)?$/.test(code.slice(Math.max(0, position - 60), position));

const bashRules: Rule[] = [
  { re: /#[^\n]*/y, type: "comment", when: (code, position) => position === 0 || /[\s;]/.test(code[position - 1] ?? "") },
  { re: /'[^']*'?/y, type: "string" },
  { re: /"(?:[^"\\]|\\[\s\S])*"?/y, type: "string" },
  { re: /\$(?:\{[^}\n]*\}?|[A-Za-z_]\w*|[#?@*!$0-9-])/y, type: "property" },
  { re: /(?:--?)[A-Za-z][\w-]*/y, type: "property", when: (code, position) => /\s/.test(code[position - 1] ?? "") },
  { re: /\d+/y, type: "number" },
  {
    re: /[A-Za-z_][\w.-]*/y,
    when: (code, position) => notAfterWord(code, position) && code[position - 1] !== "-",
    classify: (text, code, end) => {
      const start = end - text.length;
      if (bashKeywords.has(text) && (atCommandStart(code, start) || text === "in" || text === "then" || text === "do")) return "keyword";
      if (atCommandStart(code, start)) return "function";
      return undefined;
    },
  },
];

const rulesFor = (language: HighlightLanguage): Rule[] => {
  switch (language) {
    case "js":
      return jsRules(false, false);
    case "ts":
      return jsRules(false, true);
    case "jsx":
      return jsRules(true, false);
    case "tsx":
      return jsRules(true, true);
    case "json":
      return jsonRules;
    case "css":
      return cssRules;
    case "html":
      return htmlRules;
    case "bash":
      return bashRules;
    case "diff":
      return [];
    default:
      return [];
  }
};

const rulesCache = new Map<HighlightLanguage, Rule[]>();

/** A diff is coloured a line at a time: what a line starts with says all there is to say about it. */
function diffLines(code: string): TokenLine[] {
  return code.split("\n").map((text) => {
    if (!text) return [];
    if (/^(?:\+\+\+|---|diff |index )/.test(text)) return [{ type: "comment", text }];
    if (text.startsWith("@@")) return [{ type: "keyword", text }];
    if (text.startsWith("+")) return [{ type: "inserted", text }];
    if (text.startsWith("-")) return [{ type: "deleted", text }];
    return [{ text }];
  });
}

/** Tokenizes `source` (already normalised) as one of the built-in languages. */
export function tokenizeBuiltin(source: string, language: HighlightLanguage): TokenLine[] {
  if (language === "diff") return diffLines(source);
  let rules = rulesCache.get(language);
  if (!rules) {
    rules = rulesFor(language);
    rulesCache.set(language, rules);
  }
  return toLines(scan(source, rules));
}
