import { defineLanguage, word, wordClassifier } from "./kit";
import { notAfterWord, wordSet } from "../tokenizeTypes";
import type { CodeLanguage, Rule } from "../tokenizeTypes";

const phpRules = (): Rule[] => [
  // The tags. Text outside them is drawn as it is written, not told apart from code.
  { re: /<\?(?:php|=)?|\?>/y, type: "tag" },
  // An attribute (`#[Route("/x")]`) before a `#` comment, which it would otherwise be taken for.
  { re: /#\[[^[\]\n]*\]/y, type: "tag" },
  { re: /\/\/[^\n]*|#[^\n]*/y, type: "comment" },
  { re: /\/\*[\s\S]*?(?:\*\/|$)/y, type: "comment" },
  // A heredoc or nowdoc, `<<<EOT` to the line that closes it; one never closed runs to the end.
  { re: /<<<(["']?)([A-Za-z_]\w*)\1[^\n]*\n[\s\S]*?(?:\n[ \t]*\2\b|$)/y, type: "string" },
  { re: /"(?:[^"\\]|\\[\s\S])*"?/y, type: "string" },
  { re: /'(?:[^'\\]|\\[\s\S])*'?/y, type: "string" },
  { re: /\$\$?[A-Za-z_]\w*/y, type: "property" },
  { re: /0[xX][\da-fA-F_]+|0[bB][01_]+|\d[\d_]*(?:\.\d[\d_]*)?(?:[eE][+-]?\d+)?/y, type: "number", when: notAfterWord },
  word(
    wordClassifier({
      ignoreCase: true,
      keywords: wordSet(
        "abstract and as break callable case catch class clone const continue declare default do echo else elseif empty " +
          "enddeclare endfor endforeach endif endswitch endwhile enum extends final finally fn for foreach function global goto " +
          "if implements include include_once instanceof insteadof interface isset list match namespace new or parent print " +
          "private protected public readonly require require_once return self static switch throw trait try unset use var " +
          "while xor yield",
      ),
      literals: wordSet("true false null"),
      types: wordSet("int float string bool array object mixed void never iterable"),
      definers: /\bfunction\s+&?$/,
    }),
  ),
];

/** PHP, for `registerCodeLanguage`. */
export const phpLanguage: CodeLanguage = /* @__PURE__ */ defineLanguage("php", "PHP", [], phpRules);
