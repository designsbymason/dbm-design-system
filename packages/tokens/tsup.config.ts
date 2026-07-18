import { defineConfig } from "tsup";

// Entry is the Style Dictionary-generated barrel (see style-dictionary.config.js),
// not hand-authored source — this step exists purely to compile that raw TS into
// the same ESM+CJS+d.ts shape the other 4 packages ship, so `main`/`module`/`types`
// point at real dist/ output instead of raw TypeScript source.
export default defineConfig({
  entry: ["build/ts/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
});
