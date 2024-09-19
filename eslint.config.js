import perfectionist from "eslint-plugin-perfectionist";
import reactRefresh from "eslint-plugin-react-refresh";
import reactHooks from "eslint-plugin-react-hooks";
import react from "eslint-plugin-react";
import globals from "globals";
import js from "@eslint/js";

export default [
  perfectionist.configs["recommended-line-length"],
  { ignores: ["dist"] },
  {
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs["jsx-runtime"].rules,
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "react/jsx-no-target-blank": "off",
      "react/prop-types": "off",
      "no-unused-vars": "warn",
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: { jsx: true },
        ecmaVersion: "latest",
        sourceType: "module",
      },
      globals: globals.browser,
      ecmaVersion: 2020,
    },
    plugins: {
      "react-refresh": reactRefresh,
      "react-hooks": reactHooks,
      react,
    },
    settings: { react: { version: "18.3" } },
    files: ["**/*.{js,jsx}"],
  },
];
