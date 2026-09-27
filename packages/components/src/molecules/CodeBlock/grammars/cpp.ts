import { cFamilyRules, defineLanguage, directive, includeHeader, wordSet } from "./kit";
import type { CodeLanguage, Rule } from "../tokenizeTypes";

const cppRules = (): Rule[] =>
  cFamilyRules({
    before: [
      directive,
      includeHeader,
      // A raw string, `R"delim(…)delim"`, ends at the same delimiter it opened with; one never closed runs to the end.
      // (No check for a word before it: a word is taken whole by the word rule, so `xR"(a)"` never reaches this one.)
      { re: /(?:u8|[uUL])?R"([^()\\\s"]{0,16})\([\s\S]*?(?:\)\1"|$)/y, type: "string" },
    ],
    // Digit separators (`1'000'000`) belong to the number, so the quote is not taken for a character.
    number: /0[xX][\da-fA-F']+[uUlLzZ]*|0[bB][01']+[uUlLzZ]*|\d[\d']*(?:\.[\d']*)?(?:[eE][+-]?\d+)?[uUlLfFzZ]*/y,
    word: {
      keywords: wordSet(
        "alignas alignof and and_eq asm auto bitand bitor break case catch class compl concept const const_cast consteval " +
          "constexpr constinit continue co_await co_return co_yield decltype default delete do dynamic_cast else enum explicit " +
          "export extern final for friend goto if inline mutable namespace new noexcept not not_eq operator or or_eq override " +
          "private protected public register reinterpret_cast requires return sizeof static static_assert static_cast struct " +
          "switch template this thread_local throw try typedef typeid typename union using virtual volatile while xor xor_eq",
      ),
      literals: wordSet("true false nullptr NULL"),
      types: wordSet(
        "int char short long float double void unsigned signed bool wchar_t char8_t char16_t char32_t size_t ptrdiff_t " +
          "int8_t int16_t int32_t int64_t uint8_t uint16_t uint32_t uint64_t string wstring",
      ),
    },
  });

/** C++, for `registerCodeLanguage`. Also `c++`, `cc`, `cxx`, `hpp` and `hh`. */
export const cppLanguage: CodeLanguage = /* @__PURE__ */ defineLanguage("cpp", ["c++", "cc", "cxx", "hpp", "hh"], cppRules);
