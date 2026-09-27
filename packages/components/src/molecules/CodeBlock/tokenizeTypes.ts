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

/** The languages built into the component. Any other is drawn as plain text unless it is registered. */
export type HighlightLanguage = "js" | "jsx" | "ts" | "tsx" | "json" | "css" | "html" | "bash" | "diff";

/** Past this many characters the text is drawn plain: highlighting is a courtesy, never worth a stalled page. */
export const MAX_HIGHLIGHT_LENGTH = 30_000;

/**
 * A language the highlighter can be taught: a name and a function from source text to lines of tokens. It is how
 * the languages that ship outside the core are provided, and how an app brings a fuller grammar of its own.
 */
export interface CodeLanguage {
  /** What `language="…"` says to select it (matched without regard to case). */
  name: string;
  /** Other names for it, such as `py` for `python`. */
  aliases?: readonly string[];
  /**
   * The name shown for it in a block's header, as its owners write it (`TypeScript`, `C#`). Leave it out and the
   * header shows the `language` as it was written. It is a proper name, so it is not translated.
   */
  label?: string;
  /**
   * The longest text, in characters, this language should be given: longer text is drawn as plain lines instead.
   * The languages that ship with the library set it (30,000, so a huge input can't stall a page); leave it out
   * and there is no limit, which makes the cost of a large block yours.
   */
  maxLength?: number;
  /**
   * Turns source text into lines of tokens. The text has its line endings normalised to `\n` and has lost one
   * trailing newline. Each element of the result is one line, each token `{ type?, text }` with no `\n` in its
   * `text`, and joining the tokens with `\n` between lines must give back the text exactly: a result that
   * doesn't is discarded and the block is drawn plain. Return data, never HTML.
   */
  tokenize: (code: string) => TokenLine[];
}

/**
 * Highlights one block itself. Given the text as it is drawn and the block's `language` prop, returns its lines of
 * tokens, or `undefined` to leave it to the registered and built-in languages.
 */
export type Highlighter = (code: string, language: string | undefined) => TokenLine[] | undefined;

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
