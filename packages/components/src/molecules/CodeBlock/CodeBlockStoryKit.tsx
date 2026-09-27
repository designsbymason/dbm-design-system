// What `CodeBlock`'s stories share, in the two stories files: the demo code, the block the stories draw, the
// arguments of the Playground, and the setup an app does once when it starts (registering languages). Not part of the
// component, and not a stories file.

import { useState } from "react";
import { CodeBlock } from "./CodeBlock";
import { highlightLinesFromText } from "./CodeBlock.snippets";
import type { CodeBlockProps } from "./CodeBlock.types";
import * as shippedLanguages from "./languages";
import { registerCodeLanguage } from "./registry";
import type { CodeLanguage, Token, TokenLine } from "./tokenizeTypes";

// What an app does once, when it starts: turn on the languages it uses. Storybook is one app for every story, so it
// turns on all fifteen that ship outside the core, and one of its own (`ini`, below).
for (const language of Object.values(shippedLanguages)) registerCodeLanguage(language);

/** A grammar of an app's own, as `registerCodeLanguage` takes it: a name and a function from code to lines of tokens. */
function iniLine(line: string): TokenLine {
  if (/^\s*[;#]/.test(line)) return [{ type: "comment", text: line }];
  if (/^\s*\[/.test(line)) return [{ type: "tag", text: line }];
  const equals = line.indexOf("=");
  if (equals < 1) return line ? [{ text: line }] : [];
  const key = line.slice(0, equals).trimEnd();
  const tokens: Token[] = [{ type: "property", text: key }, { text: line.slice(key.length, equals + 1) }];
  const value = line.slice(equals + 1);
  if (value) tokens.push(/^\s*$/.test(value) ? { text: value } : { type: "string", text: value });
  return tokens;
}
const iniLanguage: CodeLanguage = { name: "ini", label: "INI", aliases: ["conf"], tokenize: (code) => code.split("\n").map(iniLine) };
registerCodeLanguage(iniLanguage);

/** Demo source text for the stories; not part of the component. */
export const samples = {
  tsx: `import { Button } from "@dbm-design-system/components";

export function SaveButton({ onSave }: { onSave: () => void }) {
  // Sends the form, then confirms.
  return (
    <Button variant="primary" onClick={onSave}>
      Save changes
    </Button>
  );
}`,
  ts: `export function total(items: Array<{ price: number }>): number {
  // Add up every price, ignoring anything that isn't a number.
  return items.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
}`,
  json: `{
  "name": "@dbm-design-system/components",
  "version": "1.0.0",
  "private": false,
  "sideEffects": ["**/*.css"],
  "peerDependencies": {
    "react": ">=18",
    "react-dom": ">=18"
  },
  "scripts": { "build": "tsup", "test": "vitest run" }
}`,
  css: `@media (min-width: 640px) {
  .card {
    color: var(--dbm-text-primary); /* the default text */
    padding: 1.5rem 2rem !important;
    background: #f7faff;
  }
}`,
  html: `<!-- A labelled search field -->
<label for="q">Search</label>
<input id="q" type="search" placeholder="Search &amp; filter" disabled />`,
  bash: `# Install, then run the tests
$ pnpm add @dbm-design-system/components
if [ -f "$HOME/.npmrc" ]; then echo "found ${"$"}{HOME}"; fi`,
  diff: `diff --git a/Card.tsx b/Card.tsx
--- a/Card.tsx
+++ b/Card.tsx
@@ -1,3 +1,3 @@
-const size = 'md';
+const size = 'lg';
 export { size };`,
  python: `import json

@cache
class Cart:
    """A shopping cart."""

    def total(self, items: list[dict]) -> float:
        # Add up every price.
        return sum(float(i["price"]) for i in items if i is not None)`,
  yaml: `name: build
on:
  push:
    branches: [main]
jobs:
  test:
    steps:
      - uses: actions/checkout@v4
      - run: |
          pnpm install
          pnpm test  # all of it
    env: { CI: true, RETRIES: 3 }`,
  sql: `-- Orders per customer this year
SELECT c.name, COUNT(*) AS orders
FROM customers c
JOIN orders o ON o.customer_id = c.id
WHERE o.created_at >= '2026-01-01' AND c.name NOT LIKE 'O''%'
GROUP BY c.name
ORDER BY orders DESC
LIMIT 10;`,
  markdown: `# Getting started

Install the **components** package with \`pnpm add\`, then read [the docs](https://example.com).

- one
- two

> A note.

\`\`\`bash
pnpm add @dbm-design-system/components
\`\`\``,
  go: `package main

import "fmt"

type Server struct{ Port int }

// Start listens and blocks.
func (s *Server) Start() error {
	fmt.Println("listening on", s.Port, \`raw\`, nil)
	return nil
}`,
  rust: `#[derive(Debug)]
struct Config<'a> {
    name: &'a str,
}

fn main() {
    let c = Config { name: "dbm" }; // a comment
    let n: u32 = 1_000;
    println!("{:?} {}", c, n);
}`,
  java: `@Service
public class Greeter {
  private final String name = "dbm";

  public String greet(int times) {
    return name.repeat(times); // done
  }
}`,
  longLine: `curl --request POST --url https://api.example.com/v1/projects/12345/members --header 'Authorization: Bearer <token>' --header 'Content-Type: application/json' --data '{"role":"editor","notify":true}'`,
  c: `#include <stdio.h>
#define MAX 3

/* Prints a greeting. */
int main(int argc, char **argv) {
  for (int i = 0; i < MAX; i++) {
    printf("hello %d\\n", i); // once per line
  }
  return 0;
}`,
  cpp: `#include <vector>
#include <string>

template <typename T>
class Box final {
public:
  auto raw = R"json({"a": 1})json";
  constexpr int limit = 1'000;
  void add(const T& value) { items.push_back(value); }
private:
  std::vector<T> items;
};`,
  csharp: `using System;

[Serializable]
public class Greeter {
  public string Name { get; set; }

  public async Task<int> RunAsync(int times) {
    var text = $"Hello, {Name}!";
    Console.WriteLine(text); // done
    return times * 2;
  }
}`,
  kotlin: `@Composable
fun Greeting(name: String = "world"): Unit {
  val text = """
    Hello, $name!
  """.trimIndent()
  println(text) // done
  val big = 0xFFL + 1_000
}

data class User(val id: Int, val name: String?)`,
  swift: `import SwiftUI

struct Greeting: View {
  @State private var count = 0

  var body: some View {
    Text("Tapped \\(count) times")
  }
}

func greet(_ name: String) -> String {
  guard let first = name.first else { return "" } // empty
  return "Hello, \\(first)"
}`,
  ruby: `# A greeting.
class Greeter < Base
  attr_reader :name

  def initialize(name, loud: false)
    @name = name
    @loud = loud
  end

  def greet
    text = <<~TEXT
      Hello, #{@name}!
    TEXT
    @loud ? text.upcase : text
  end
end`,
  php: `<?php
namespace App;

#[Route("/hello")]
final class Greeter extends Base {
  public function greet(string $name): string {
    // Says hello.
    return "Hello, {$name}!" . ($this->loud ?? null);
  }
}
?>`,
  toml: `# Server settings
title = "Example"

[server]
host = "0.0.0.0"
port = 8080
started = 2026-09-26T10:00:00Z

[[routes]]
path = "/"
methods = ["GET", "HEAD"]`,
  diffWithHunks: `diff --git a/greet.ts b/greet.ts
--- a/greet.ts
+++ b/greet.ts
@@ -8,3 +8,4 @@ export function greet() {
   const name = "world";
-  return name;
+  const shout = name.toUpperCase();
+  return shout;
 }`,
  ini: `; Server settings
[server]
port = 3000
host = "0.0.0.0"

# Limits
[limits]
timeout = 30`,
  log: `2026-09-26 10:14:02 INFO  server listening on :3000
2026-09-26 10:14:09 WARN  slow request GET /reports (2.4s)
2026-09-26 10:14:11 ERROR connection reset by peer`,
} as const;

// The Playground's own args: every `CodeBlock` prop a control can drive, plus one Storybook-only text field.
export interface PlaygroundArgs extends CodeBlockProps {
  /** Storybook only — the highlighted lines as typed: single lines and ranges, `2, 4-6`. */
  highlight: string;
}

export const noControls = { control: false } as const;

/** The block under test: the args, with the typed highlight list turned into `highlightLines`. */
export const DemoBlock = ({ highlight, maxHeight, highlightLines, wrap: wrapArg, ...args }: PlaygroundArgs) => {
  // The Playground's Wrap control sets the block's wrapping, and the block's own toggle button changes it too
  // (a plain `wrap` would be fixed by the control and leave the button inert), so the wrapping is kept here.
  const [state, setState] = useState({ arg: wrapArg, wrap: wrapArg });
  // A change to the control replaces what the button last set (adjusting state while rendering, not in an effect).
  if (state.arg !== wrapArg) setState({ arg: wrapArg, wrap: wrapArg });
  return (
    <CodeBlock
      {...args}
      wrap={state.wrap}
      onWrapChange={(next) => setState({ arg: wrapArg, wrap: next })}
      maxHeight={maxHeight || undefined}
      highlightLines={highlightLinesFromText(highlight) ?? highlightLines}
    />
  );
};

export const stack = { display: "flex", flexDirection: "column", gap: "var(--dbm-space-5)" } as const;
