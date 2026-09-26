import { describe, expect, it } from "vitest";

describe("CodeBlock's stories module", () => {
  // The hidden interaction stories use the test browser's own protocol (`browserProtocol.js`), whose package
  // throws when it is evaluated anywhere but the test runner. If the stories module pulled it in at load time, a real
  // Storybook could not load any CodeBlock story or its Docs page, while every test run stayed green — found only by
  // opening the Docs page. Loading the module here, outside a browser test, is the same failure.
  it("loads without evaluating the test runner's browser module", async () => {
    const stories = await import("./CodeBlock.stories");
    expect(stories.default.title).toBe("Molecules/Typography/CodeBlock");
    expect(stories.Playground).toBeDefined();
  });
});
