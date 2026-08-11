import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import globals from "globals";
import tseslint from "typescript-eslint";

/** Shared base ESLint flat config for non-React DBM Design System packages. */
export const base = tseslint.config(
  {
    // `storybook-static/**` added alongside the new `build-storybook` CI
    // step (see .github/workflows/ci.yml) — Storybook's static build output
    // is gitignored but wasn't previously excluded from lint, so a local
    // `pnpm build-storybook` followed by `pnpm lint` fed thousands of lines
    // of minified/bundled JS into ESLint (confirmed: 21,000+ bogus errors).
    ignores: ["dist/**", "coverage/**", ".turbo/**", "node_modules/**", "storybook-static/**"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  eslintConfigPrettier,
);

export default base;
