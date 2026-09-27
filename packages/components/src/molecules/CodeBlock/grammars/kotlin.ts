import { cFamilyRules, defineLanguage } from "./kit";
import { notAfterWord, wordSet } from "../tokenizeTypes";
import type { CodeLanguage, Rule } from "../tokenizeTypes";

const kotlinRules = (): Rule[] =>
  cFamilyRules({
    strings: [
      { re: /"""[\s\S]*?(?:"""|$)/y, type: "string" },
      { re: /"(?:[^"\\\n]|\\.)*"?/y, type: "string" },
      { re: /'(?:[^'\\\n]|\\.)*'?/y, type: "string" },
    ],
    extra: [{ re: /@[A-Za-z_][\w.]*/y, type: "function", when: notAfterWord }],
    number: /0[xX][\da-fA-F_]+[uUL]*|0[bB][01_]+[uUL]*|\d[\d_]*(?:\.\d[\d_]*)?(?:[eE][+-]?\d+)?[fFuUL]*/y,
    word: {
      keywords: wordSet(
        "abstract actual annotation as break by catch class companion const constructor continue crossinline data do else " +
          "enum expect external final finally for fun get if import in infix init inline inner interface internal is lateinit " +
          "noinline object open operator out override package private protected public reified return sealed set super suspend " +
          "tailrec this throw try typealias typeof val var vararg when where while",
      ),
      literals: wordSet("true false null"),
      types: wordSet("Int Long Short Byte Float Double Boolean Char String Unit Any Nothing UInt ULong UShort UByte"),
      definers: /\bfun\s+$/,
    },
  });

/** Kotlin, for `registerCodeLanguage`. Also `kt` and `kts`. */
export const kotlinLanguage: CodeLanguage = /* @__PURE__ */ defineLanguage("kotlin", "Kotlin", ["kt", "kts"], kotlinRules);
