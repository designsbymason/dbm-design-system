// The scan `tokenize.ts` and `grammars.ts` share: an ordered list of sticky rules run over the text once, from the
// start, and the split of the result into lines.

import type { Rule, State, Token, TokenLine } from "./tokenizeTypes";

/** Runs the rules over the text once, from the start, returning a flat list of tokens covering all of it. */
export function scan(code: string, rules: Rule[]): Token[] {
  const tokens: Token[] = [];
  const state: State = { inTag: false, inText: false, expression: 0, openTags: 0, closingTag: false, blocks: [], statementStart: 0, lineStart: true, fence: false };
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
      state.lineStart = false;
    }
  }
  flushPlain();
  return tokens;
}

/** Splits a flat token list at its newlines, so every token belongs to exactly one line. */
export function toLines(tokens: Token[]): TokenLine[] {
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
