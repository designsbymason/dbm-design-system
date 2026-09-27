import { defineLanguage, wordClassifier, wordSet } from "./kit";
import { notAfterWord } from "../tokenizeTypes";
import type { CodeLanguage, Rule } from "../tokenizeTypes";

const rubyRules = (): Rule[] => {
  const base = wordClassifier({
    keywords: wordSet(
      "alias and begin BEGIN break case class def defined? do else elsif end END ensure for if in module next not or redo " +
        "rescue retry return self super then undef unless until when while yield __FILE__ __LINE__ __method__ attr_accessor " +
        "attr_reader attr_writer include extend lambda module_function private protected proc public raise require " +
        "require_relative",
    ),
    literals: wordSet("true false nil"),
    definers: /\bdef\s+(?:self\.)?$/,
  });
  return [
    // A block comment: `=begin` at the very start of a line, to `=end`.
    { re: /=begin[\s\S]*?(?:\n=end[^\n]*|$)/y, type: "comment", when: (code, position) => position === 0 || code[position - 1] === "\n" },
    { re: /#[^\n]*/y, type: "comment" },
    // A heredoc, `<<~EOS`, from its opener through the line that closes it (the rest of the opener's line is part of
    // the match); one never closed runs to the end. The name is upper case, so `list << item` is not one.
    { re: /<<[~-]?(["'`]?)([A-Z_][A-Z0-9_]*)\1[^\n]*\n[\s\S]*?(?:\n[ \t]*\2[ \t]*(?=\n|$)|$)/y, type: "string", when: notAfterWord },
    { re: /"(?:[^"\\]|\\[\s\S])*"?/y, type: "string" },
    { re: /'(?:[^'\\]|\\[\s\S])*'?/y, type: "string" },
    { re: /`(?:[^`\\]|\\[\s\S])*`?/y, type: "string" },
    // A symbol, `:name` or `:"name"` (not the `::` of a scope, and not a `:` after a space, as in `a ? b : c`).
    { re: /:"(?:[^"\\]|\\[\s\S])*"?|:[A-Za-z_]\w*[?!=]?/y, type: "number", when: (code, position) => code[position - 1] !== ":" },
    // Instance, class and global variables.
    { re: /@@?[A-Za-z_]\w*|\$[A-Za-z_]\w*/y, type: "property" },
    { re: /0[xX][\da-fA-F_]+|0[bB][01_]+|0[oO]?[0-7_]+|\d[\d_]*(?:\.\d[\d_]*)?(?:[eE][+-]?\d+)?[ri]{0,2}/y, type: "number", when: notAfterWord },
    {
      // A name may end in `?` or `!` (unless that begins `!=`), and a name followed by a colon is a hash key.
      re: /[A-Za-z_]\w*(?:[?!](?!=))?/y,
      classify: (text, code, end, state) => {
        const type = base(text, code, end, state);
        if (type) return type;
        return code[end] === ":" && code[end + 1] !== ":" ? "property" : undefined;
      },
    },
  ];
};

/** Ruby, for `registerCodeLanguage`. Also `rb`. */
export const rubyLanguage: CodeLanguage = /* @__PURE__ */ defineLanguage("ruby", ["rb"], rubyRules);
