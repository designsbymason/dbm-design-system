import { defineLanguage, word, wordClassifier, wordSet } from "./kit";
import { notAfterWord } from "../tokenizeTypes";
import type { CodeLanguage, Rule } from "../tokenizeTypes";

const javaRules = (): Rule[] => [
  { re: /\/\/[^\n]*/y, type: "comment" },
  { re: /\/\*[\s\S]*?(?:\*\/|$)/y, type: "comment" },
  { re: /"""[\s\S]*?(?:"""|$)/y, type: "string" },
  { re: /"(?:[^"\\\n]|\\.)*"?/y, type: "string" },
  { re: /'(?:[^'\\\n]|\\.)*'?/y, type: "string" },
  { re: /@[A-Za-z_][\w.]*/y, type: "function", when: notAfterWord },
  { re: /0[xX][\da-fA-F_]+[lL]?|0[bB][01_]+[lL]?|\d[\d_]*(?:\.\d[\d_]*)?(?:[eE][+-]?\d+)?[lLfFdD]?/y, type: "number" },
  word(
    wordClassifier({
      keywords: wordSet(
        "abstract assert break case catch class const continue default do else enum extends final finally for goto if " +
          "implements import instanceof interface native new package private protected public return static strictfp " +
          "super switch synchronized this throw throws transient try void volatile while var record sealed permits yield",
      ),
      literals: wordSet("true false null"),
      types: wordSet("boolean byte char double float int long short"),
    }),
  ),
];

/** Java, for `registerCodeLanguage`. */
export const javaLanguage: CodeLanguage = /* @__PURE__ */ defineLanguage("java", [], javaRules);
