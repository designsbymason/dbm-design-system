import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  external: ["react", "react-dom"],
  // esbuild's built-in CSS Modules support: this package only ever contains
  // *.module.css files, so scoping every .css import is safe (tsup's own CSS
  // plugin intercepts all .css files via one loader — it can't discriminate
  // by the ".module.css" vs ".css" suffix, only by top-level ".css" key).
  loader: {
    ".css": "local-css",
  },
});
