import { cFamilyRules, defineLanguage } from "./kit";
import { notAfterWord, wordSet } from "../tokenizeTypes";
import type { CodeLanguage, Rule } from "../tokenizeTypes";

const swiftRules = (): Rule[] =>
  cFamilyRules({
    strings: [
      // A multi-line string, with any number of `#` around it, and the plain form.
      // (The run of `#` is bounded, for the reason the C# one is: a long run of them is not read again from each.)
      { re: /#{0,8}"""[\s\S]*?(?:"""#*|$)/y, type: "string" },
      { re: /"(?:[^"\\\n]|\\.)*"?/y, type: "string" },
    ],
    // An attribute (`@State`, `@MainActor`) and a compiler directive (`#if`, `#available`).
    extra: [
      { re: /@[A-Za-z_]\w*/y, type: "function", when: notAfterWord },
      { re: /#[A-Za-z]\w*/y, type: "keyword" },
    ],
    number: /0[xX][\da-fA-F_]+(?:\.[\da-fA-F_]+)?(?:[pP][+-]?\d+)?|0[bB][01_]+|0[oO][0-7_]+|\d[\d_]*(?:\.\d[\d_]*)?(?:[eE][+-]?\d+)?/y,
    word: {
      keywords: wordSet(
        "actor any as associatedtype async await break case catch class continue convenience default defer deinit didSet do " +
          "dynamic else enum extension fallthrough fileprivate final for func get guard if import in indirect init inout " +
          "internal is lazy let mutating nonmutating open operator optional override precedencegroup private protocol public " +
          "repeat required rethrows return self Self set some static struct subscript super switch throw throws try typealias " +
          "unowned var weak where while willSet",
      ),
      literals: wordSet("true false nil"),
      types: wordSet("Int Int8 Int16 Int32 Int64 UInt UInt8 UInt16 UInt32 UInt64 Double Float Bool String Character Void Any AnyObject"),
      definers: /\bfunc\s+$/,
    },
  });

/** Swift, for `registerCodeLanguage`. */
export const swiftLanguage: CodeLanguage = /* @__PURE__ */ defineLanguage("swift", [], swiftRules);
