import { atLineStart, defineLanguage, leaveLineStart, startLineAfterNewline } from "./kit";
import type { CodeLanguage, Rule, State } from "../tokenizeTypes";

const inFence = (_code: string, _position: number, state: State) => state.fence;
const outsideFence = (_code: string, _position: number, state: State) => !state.fence;
const markdownLineStart = (_code: string, _position: number, state: State) => state.lineStart && !state.fence;

const markdownRules = (): Rule[] => [
  { re: /\n/y, after: startLineAfterNewline },
  // A fence's marker line opens or closes the block; the lines between are drawn as they are, so nothing in a
  // snippet of another language is mistaken for Markdown.
  {
    re: /[ \t]{0,3}(?:```|~~~)[^\n]*/y,
    type: "tag",
    when: atLineStart,
    after: (_text, state) => {
      state.fence = !state.fence;
      state.lineStart = false;
    },
  },
  { re: /[^\n]+/y, type: "string", when: inFence },
  { re: /[ \t]+/y, when: outsideFence },
  { re: /#{1,6}(?=[ \t]|\n|$)[^\n]*/y, type: "keyword", when: markdownLineStart, after: leaveLineStart },
  { re: />[^\n]*/y, type: "comment", when: markdownLineStart, after: leaveLineStart },
  { re: /(?:-{3,}|\*{3,}|_{3,})[ \t]*(?=\n|$)/y, type: "comment", when: markdownLineStart, after: leaveLineStart },
  { re: /(?:[-*+]|\d{1,9}[.)])(?=[ \t])/y, type: "keyword", when: markdownLineStart, after: leaveLineStart },
  { re: /<!--[\s\S]*?(?:-->|$)/y, type: "comment", after: leaveLineStart },
  { re: /`[^`\n]+`/y, type: "string", after: leaveLineStart },
  // A link or image. Neither part may contain the character that opens the next attempt (`[` in the label, `(` in the
  // address), so an opener that is never closed fails at the next one instead of reading to the end of the line from
  // every opener: `[a](` repeated would otherwise cost the square of its length.
  { re: /!?\[[^[\]\n]*\]\([^()\n]*\)/y, type: "function", after: leaveLineStart },
  { re: /\*\*[^*\n]+\*\*|__[^_\n]+__/y, type: "type", after: leaveLineStart },
  // A tag stops at the next `<` too, for the same reason: `<a` repeated must not read to the line's end every time.
  { re: /<\/?[A-Za-z][^<>\n]*>/y, type: "tag", after: leaveLineStart },
];

/** Markdown, for `registerCodeLanguage`. Also `md`. */
export const markdownLanguage: CodeLanguage = /* @__PURE__ */ defineLanguage("markdown", "Markdown", ["md"], markdownRules);
