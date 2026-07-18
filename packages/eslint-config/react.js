import jsxA11y from "eslint-plugin-jsx-a11y";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";
import { base } from "./base.js";

/** Shared ESLint flat config for React DBM Design System packages (components, primitives, icons). */
export const reactConfig = tseslint.config(
  ...base,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
    plugins: {
      react,
      "react-hooks": reactHooks,
      "jsx-a11y": jsxA11y,
    },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs["jsx-runtime"].rules,
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
    },
    settings: {
      // "detect" calls a context.getFilename() API that eslint-plugin-react
      // hasn't updated for ESLint 10's flat-config linter yet — pin explicitly.
      react: {
        version: "19.2",
      },
    },
  },
);

export default reactConfig;
