import { defineLanguage, word, wordClassifier } from "./kit";
import { wordSet } from "../tokenizeTypes";
import type { CodeLanguage, Rule } from "../tokenizeTypes";

const sqlRules = (): Rule[] => [
  { re: /--[^\n]*/y, type: "comment" },
  { re: /\/\*[\s\S]*?(?:\*\/|$)/y, type: "comment" },
  { re: /'(?:[^']|'')*'?/y, type: "string" },
  // A quoted identifier is a name, not a value.
  { re: /"(?:[^"]|"")*"?/y, type: "property" },
  { re: /`[^`\n]*`?/y, type: "property" },
  { re: /\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?/y, type: "number" },
  // A parameter: `@name`, `$1`, `:name` (but not the `::` of a cast).
  { re: /[@$][A-Za-z_0-9]+|:[A-Za-z_]\w*/y, type: "property", when: (code, position) => code[position - 1] !== ":" },
  word(
    wordClassifier({
      ignoreCase: true,
      keywords: wordSet(
        "select from where and or not in is like ilike between join left right inner outer full cross natural on using " +
          "group by order having limit offset fetch insert into values update set delete create alter drop table index view " +
          "database schema primary key foreign references default unique check constraint as distinct union all except " +
          "intersect exists case when then else end with recursive asc desc returning begin commit rollback transaction " +
          "grant revoke truncate if cascade add column rename to over partition window explain analyze replace temporary " +
          "temp materialized trigger function procedure returns language declare for each row execute",
      ),
      literals: wordSet("true false null"),
      types: wordSet(
        "int integer bigint smallint tinyint varchar char text boolean bool date time timestamp timestamptz interval " +
          "numeric decimal real float double serial bigserial uuid json jsonb bytea blob array money",
      ),
    }),
  ),
];

/** SQL, for `registerCodeLanguage`. Also `postgresql`, `postgres`, `pgsql`, `mysql` and `sqlite`. */
export const sqlLanguage: CodeLanguage = /* @__PURE__ */ defineLanguage("sql", "SQL", ["postgresql", "postgres", "pgsql", "mysql", "sqlite"], sqlRules);
