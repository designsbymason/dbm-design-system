/**
 * What the grammars share. Same engine, same rules of the road (see `../tokenize.ts`): sticky expressions in an
 * order, a little state, and two guarantees — every character comes back, and the cost is proportional to the text's
 * length. That second one is why a word is always taken whole and then classified by what follows it, never matched
 * with a lookahead written into its pattern (which retries from every letter of a long word), why a string or comment
 * that is never closed runs to the end of the text as one match instead of failing and being tried again from the
 * next quote, and why a construct that reads to the end of a line (a link label, a tag, an attribute) may not contain
 * the character that opens the next attempt.
 */

import { scan, toLines } from "../engine";
import { MAX_HIGHLIGHT_LENGTH } from "../tokenizeTypes";
import type { CodeLanguage, Rule, State } from "../tokenizeTypes";

export interface WordOptions {
  keywords: Set<string>;
  /** `true`, `nil`, `None`: coloured as numbers, the system's colour for values that are words. */
  literals: Set<string>;
  /** Built-in type names. */
  types?: Set<string>;
  /** The keywords that introduce a named definition (`def`, `func`, `fn`): the word after one is a function. */
  definers?: RegExp;
  /** Whether `Name(` is a call (`fmt.Println(`) before it is a type (`Server{`, `Foo(` instantiating a class). */
  callBeforeType?: boolean;
  /** Whether keywords are matched without regard to case (SQL). */
  ignoreCase?: boolean;
}

/** Decides a whole word's type from the word, and from what comes just before and after it. */
export function wordClassifier(options: WordOptions): NonNullable<Rule["classify"]> {
  return (text, code, end) => {
    const word = options.ignoreCase ? text.toLowerCase() : text;
    if (options.keywords.has(word)) return "keyword";
    if (options.literals.has(word)) return "number";
    if (options.types?.has(word)) return "type";
    if (options.definers?.test(code.slice(Math.max(0, end - text.length - 12), end - text.length))) return "function";
    const isCall = code[end] === "(";
    const isPascal = /^[A-Z]/.test(text) && /[a-z]/.test(text);
    if (options.callBeforeType) {
      if (isCall) return "function";
      if (isPascal) return "type";
    } else {
      if (isPascal) return "type";
      if (isCall) return "function";
    }
    return undefined;
  };
}

export const word = (classify: NonNullable<Rule["classify"]>): Rule => ({ re: /[A-Za-z_][\w$]*/y, classify });

/** Whether only whitespace lies between the start of this line and the position. */
export const startsLine = (code: string, position: number) => /(?:^|\n)[ \t]*$/.test(code.slice(Math.max(0, position - 60), position));

// The state that YAML, TOML and Markdown share: whether only indentation lies between the start of the line and here.
export const leaveLineStart = (_text: string, state: State) => void (state.lineStart = false);
export const startLineAfterNewline = (_text: string, state: State) => void (state.lineStart = true);
export const atLineStart = (_code: string, _position: number, state: State) => state.lineStart;

/**
 * A `CodeLanguage` from a list of rules. The rules are built on first use, so importing a language costs nothing until a
 * block draws it, and it is a single call marked as pure, so a bundler drops one nobody imports.
 */
export const defineLanguage = (name: string, label: string, aliases: string[], rules: () => Rule[]): CodeLanguage => {
  let built: Rule[] | undefined;
  return {
    name,
    label,
    aliases,
    maxLength: MAX_HIGHLIGHT_LENGTH,
    tokenize: (code) => toLines(scan(code, (built ??= rules()))),
  };
};


// --- The C family -------------------------------------------------------------------------------------------

export interface CFamilyOptions {
  /** Keywords, literals, types and how a name is told from a type (see {@link WordOptions}). */
  word: WordOptions;
  /** Rules tried before anything else: a preprocessor line, a raw string. */
  before?: Rule[];
  /** The string and character rules, in order, for a language whose strings differ (a triple quote comes first). */
  strings?: Rule[];
  /** Rules tried after the strings and before the numbers: annotations, attributes. */
  extra?: Rule[];
  /** How a number is written: the prefixes and suffixes are the language's own. */
  number: RegExp;
}

const cStrings: Rule[] = [
  { re: /"(?:[^"\\\n]|\\.)*"?/y, type: "string" },
  { re: /'(?:[^'\\\n]|\\.)*'?/y, type: "string" },
];

/**
 * The rules the C-like languages (C, C++, C#, Kotlin, Swift) share: line and block comments, quoted strings, numbers
 * and names told apart by their keyword lists. What differs between them goes in the options, so a language is its
 * keyword lists and its few quirks. An unclosed comment or string runs to the end as one match.
 */
export function cFamilyRules(options: CFamilyOptions): Rule[] {
  return [
    ...(options.before ?? []),
    { re: /\/\/[^\n]*/y, type: "comment" },
    { re: /\/\*[\s\S]*?(?:\*\/|$)/y, type: "comment" },
    ...(options.strings ?? cStrings),
    ...(options.extra ?? []),
    { re: options.number, type: "number" },
    word(wordClassifier(options.word)),
  ];
}

/** A preprocessor directive (`#include`, `#define`, `#region`) at the start of a line. */
export const directive: Rule = { re: /#[ \t]*[A-Za-z_]+/y, type: "keyword", when: startsLine };

/** The `<header.h>` after an `#include`, drawn as the string it is. */
export const includeHeader: Rule = {
  re: /<[^<>"\n]+>/y,
  type: "string",
  when: (code, position) => /#[ \t]*include[ \t]*$/.test(code.slice(Math.max(0, position - 40), position)),
};
