import { cFamilyRules, defineLanguage, directive, includeHeader, wordSet } from "./kit";
import type { CodeLanguage, Rule } from "../tokenizeTypes";

const cRules = (): Rule[] =>
  cFamilyRules({
    before: [directive, includeHeader],
    number: /0[xX][\da-fA-F]+[uUlL]*|0[bB][01]+[uUlL]*|\d+(?:\.\d*)?(?:[eE][+-]?\d+)?[uUlLfF]*/y,
    word: {
      keywords: wordSet(
        "auto break case const continue default do else enum extern for goto if inline register restrict return sizeof " +
          "static struct switch typedef union volatile while _Alignas _Alignof _Atomic _Generic _Noreturn _Static_assert _Thread_local",
      ),
      literals: wordSet("NULL true false"),
      types: wordSet(
        "int char short long float double void unsigned signed size_t ssize_t ptrdiff_t intptr_t uintptr_t int8_t int16_t " +
          "int32_t int64_t uint8_t uint16_t uint32_t uint64_t bool _Bool FILE wchar_t",
      ),
      callBeforeType: true,
    },
  });

/** C, for `registerCodeLanguage`. Also `h`. */
export const cLanguage: CodeLanguage = /* @__PURE__ */ defineLanguage("c", ["h"], cRules);
