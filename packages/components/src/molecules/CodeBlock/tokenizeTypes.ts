// The vocabulary `tokenize.ts` and the grammars share: what a token is, the state a scan carries, and what a rule is.

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
export type HighlightLanguage =
  | "js"
  | "jsx"
  | "ts"
  | "tsx"
  | "json"
  | "css"
  | "html"
  | "bash"
  | "diff"
  | "python"
  | "yaml"
  | "sql"
  | "markdown"
  | "go"
  | "rust"
  | "java";

export interface State {
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
  /** YAML and Markdown: at the start of a line, before anything but indentation. */
  lineStart: boolean;
  /** Markdown only: inside a fenced code block, whose lines are drawn as they are. */
  fence: boolean;
}

export interface Rule {
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


export const isWordChar = (char: string | undefined) => char !== undefined && /[\w$]/.test(char);
export const notAfterWord = (code: string, position: number) => !isWordChar(code[position - 1]);
export const wordSet = (words: string) => new Set(words.split(" "));
