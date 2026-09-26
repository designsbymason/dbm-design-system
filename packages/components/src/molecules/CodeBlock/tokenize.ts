/**
 * `CodeBlock`'s syntax highlighter: a small, dependency-free tokenizer that turns source text into lines of
 * typed tokens. It returns plain data — the component renders each token as a React element, so nothing here
 * ever builds or injects HTML.
 *
 * It is a lexer, not a parser: an ordered list of sticky regular expressions per language, with a little state
 * (inside a tag, inside a block) for the few places a token's meaning depends on what came before. It is
 * deliberately approximate — good enough that code reads well, not a substitute for a real grammar — and it
 * has one hard guarantee: joining every token's text gives back the input exactly, whatever the input is.
 */

export type TokenType =
  | "keyword"
  | "string"
  | "number"
  | "function"
  | "type"
  | "property"
  | "tag"
  | "comment"
  | "inserted"
  | "deleted";

export interface Token {
  /** What the text is, or `undefined` for plain text. */
  type?: TokenType;
  text: string;
}

export type TokenLine = Token[];

/** The languages with a grammar of their own. Anything else is drawn as plain text. */
export type HighlightLanguage = "js" | "jsx" | "ts" | "tsx" | "json" | "css" | "html" | "bash" | "diff";

interface State {
  /** Between a tag's `<name` and its `>`, where a bare word is an attribute. */
  inTag: boolean;
  /** JSX only: in the text between tags, where nothing is code until a `<` or a `{`. */
  inText: boolean;
  /** JSX only: how many `{` of an expression inside the text are still open. */
  expression: number;
  /** JSX only: how many opening tags are still to be closed. */
  openTags: number;
  /** JSX only: whether the tag being read is a closing one (`</name`). */
  closingTag: boolean;
  /** CSS only: for each block still open, whether it holds rules (`@media`) rather than declarations. */
  blocks: boolean[];
  /** CSS only: where the current statement starts, to read what came before a `{`. */
  statementStart: number;
}

interface Rule {
  /** Sticky, so it matches exactly at the current position. */
  re: RegExp;
  type?: TokenType;
  /** Decides the type from the matched text and what follows it (an identifier's meaning depends on both). */
  classify?: (text: string, code: string, end: number, state: State) => TokenType | undefined;
  /** Whether the rule applies at this position. */
  when?: (code: string, position: number, state: State) => boolean;
  /** Runs after a match, to update the state. */
  after?: (text: string, state: State, code: string, end: number) => void;
}

/** Past this many characters the text is drawn plain: highlighting is a courtesy, never worth a stalled page. */
export const MAX_HIGHLIGHT_LENGTH = 30_000;

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

/** The grammar a `language` string names, or `undefined` if it has none (it is then drawn as plain text). */
export function resolveLanguage(language: string | undefined): HighlightLanguage | undefined {
  return language ? aliases[language.trim().toLowerCase()] : undefined;
}

const isWordChar = (char: string | undefined) => char !== undefined && /[\w$]/.test(char);
const notAfterWord = (code: string, position: number) => !isWordChar(code[position - 1]);
const wordSet = (words: string) => new Set(words.split(" "));

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
  { re: /--?[A-Za-z][\w-]*(?=\s*:)/y, type: "property", when: (_code, _position, state) => inDeclarations(state) },
  { re: /[A-Za-z][\w-]*(?=\s*:)/y, type: "property", when: (_code, _position, state) => inDeclarations(state) },
  { re: /#[\da-fA-F]{3,8}\b/y, type: "number", when: (_code, _position, state) => inDeclarations(state) },
  { re: /[.#][A-Za-z_-][\w-]*/y, type: "type", when: (_code, _position, state) => !inDeclarations(state) },
  {
    re: /-?(?:\d+\.?\d*|\.\d+)(?:%|[A-Za-z]+)?/y,
    type: "number",
    when: (code, position) => !/[\w-]/.test(code[position - 1] ?? ""),
  },
  { re: /[A-Za-z-][\w-]*(?=\()/y, type: "function" },
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
  }
};

// --- The engine ---------------------------------------------------------------------------------------------

const rulesCache = new Map<HighlightLanguage, Rule[]>();

/** Runs the rules over the text once, from the start, returning a flat list of tokens covering all of it. */
function scan(code: string, rules: Rule[]): Token[] {
  const tokens: Token[] = [];
  const state: State = { inTag: false, inText: false, expression: 0, openTags: 0, closingTag: false, blocks: [], statementStart: 0 };
  let plain = "";
  const flushPlain = () => {
    if (plain) tokens.push({ text: plain });
    plain = "";
  };
  let position = 0;
  while (position < code.length) {
    let matched = false;
    for (const rule of rules) {
      if (rule.when && !rule.when(code, position, state)) continue;
      rule.re.lastIndex = position;
      const match = rule.re.exec(code);
      if (!match || match[0].length === 0) continue;
      const text = match[0];
      const end = position + text.length;
      const type = rule.classify ? rule.classify(text, code, end, state) : rule.type;
      rule.after?.(text, state, code, end);
      if (type) {
        flushPlain();
        tokens.push({ type, text });
      } else {
        plain += text;
      }
      position = end;
      matched = true;
      break;
    }
    if (!matched) {
      plain += code[position];
      position += 1;
    }
  }
  flushPlain();
  return tokens;
}

/** Splits a flat token list at its newlines, so every token belongs to exactly one line. */
function toLines(tokens: Token[]): TokenLine[] {
  const lines: TokenLine[] = [[]];
  for (const token of tokens) {
    const parts = token.text.split("\n");
    parts.forEach((part, index) => {
      if (index > 0) lines.push([]);
      if (part) lines[lines.length - 1]?.push(token.type ? { type: token.type, text: part } : { text: part });
    });
  }
  return lines;
}

const plainLines = (code: string): TokenLine[] => code.split("\n").map((text) => (text ? [{ text }] : []));

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

/**
 * Tokenizes `code` for `language` into lines of tokens. A language with no grammar of its own, and any text
 * longer than {@link MAX_HIGHLIGHT_LENGTH}, come back as plain lines. Line endings are normalised to `\n`, and
 * one trailing newline is dropped (a template literal's usual last character is not a line). Joining every
 * token's text with `\n` between lines returns the input.
 */
export function tokenize(code: string, language: string | undefined): TokenLine[] {
  const source = code.replace(/\r\n?/g, "\n").replace(/\n$/, "");
  const resolved = resolveLanguage(language);
  if (!resolved || source.length > MAX_HIGHLIGHT_LENGTH) return plainLines(source);
  if (resolved === "diff") return diffLines(source);
  let rules = rulesCache.get(resolved);
  if (!rules) {
    rules = rulesFor(resolved);
    rulesCache.set(resolved, rules);
  }
  return toLines(scan(source, rules));
}
