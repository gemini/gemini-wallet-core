import eslint from "@eslint/js";
import pluginImport from "eslint-plugin-import";
// plugins
import pluginJsxAlly from "eslint-plugin-jsx-a11y";
import pluginPrettier from "eslint-plugin-prettier/recommended";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import pluginImportSort from "eslint-plugin-simple-import-sort";
import pluginKeysSort from "eslint-plugin-sort-keys-fix";
import globals from "globals";
import tseslint from "typescript-eslint";

/** @type {import("eslint").Linter.Config} */
export default [
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  pluginJsxAlly.flatConfigs.recommended,
  {
    languageOptions: {
      ecmaVersion: "latest",
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es6,
        ...globals.vitest,
        fetchMock: false,
      },
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 2020,
      },
      sourceType: "module",
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
      import: pluginImport,
      react: pluginReact,
      "react-hooks": pluginReactHooks,
      "simple-import-sort": pluginImportSort,
      "sort-keys-fix": pluginKeysSort,
    },
    rules: {
      "@typescript-eslint/ban-ts-ignore": 0,
      "@typescript-eslint/camelcase": 0,
      "@typescript-eslint/class-name-casing": 0,
      "@typescript-eslint/interface-name-prefix": 0,
      "@typescript-eslint/no-empty-function": 0,
      "@typescript-eslint/no-empty-interface": 0,
      "@typescript-eslint/no-explicit-any": 0,
      "@typescript-eslint/no-unused-vars": [2, { args: "none", vars: "local", varsIgnorePattern: "[uU]nused" }],
      "@typescript-eslint/no-useless-constructor": 2,
      "@typescript-eslint/no-var-requires": 0,
      eqeqeq: ["error", "always", { null: "ignore" }],
      "import/export": "error",
      "import/no-anonymous-default-export": [
        "error",
        {
          allowArray: true,
          allowObject: true,
        },
      ],
      "import/no-commonjs": 2,
      "import/no-duplicates": ["error", { considerQueryString: true }],
      "import/order": 0,
      "jsx-a11y/anchor-is-valid": 0,
      "jsx-a11y/click-events-have-key-events": 0,
      "jsx-a11y/no-autofocus": 0,
      "jsx-a11y/no-noninteractive-element-interactions": 0,
      "jsx-a11y/no-onchange": 0,
      "no-alert": "error",
      "no-const-assign": "error",
      "no-dupe-class-members": "error",
      "no-duplicate-case": "error",
      "no-duplicate-imports": "error",
      "no-implicit-coercion": [2, { boolean: true, number: true, string: true }],
      "no-undef": "error",
      "no-unused-vars": 0,
      "no-useless-constructor": "error",
      "no-var": "error",
      "prefer-const": [
        "error",
        {
          destructuring: "any",
          ignoreReadBeforeAssign: true,
        },
      ],
      "react-hooks/exhaustive-deps": "error",
      "react-hooks/rules-of-hooks": "error",
      "react/forbid-foreign-prop-types": 2,
      "react/jsx-curly-brace-presence": [2, "never"],
      "react/jsx-fragments": ["error", "element"],
      "react/jsx-no-comment-textnodes": 2,
      "react/jsx-no-duplicate-props": 2,
      "react/jsx-no-target-blank": 2,
      "react/jsx-no-undef": 2,
      "react/jsx-uses-react": 0,
      "react/jsx-uses-vars": 1,
      "react/no-danger-with-children": 2,
      "react/no-direct-mutation-state": 2,
      "react/no-find-dom-node": 2,
      "react/no-is-mounted": 2,
      "react/no-render-return-value": 2,
      "react/no-unknown-property": [2, { ignore: ["css"] }],
      "react/no-unused-prop-types": 2,
      "react/prop-types": [2, { skipUndeclared: true }],
      "react/react-in-jsx-scope": 0,
      "react/require-render-return": 2,
      "require-await": "error",
      semi: 0,
      "simple-import-sort/exports": 2,
      "simple-import-sort/imports": [
        "error",
        {
          groups: [
            // Side effect imports.
            ["^\\u0000"],

            // External libraries (exclude @gemini-wallet and @/)
            ["^react", "^@emotion", "^(?!@gemini-wallet)(?!@/)[@\\w].*"],

            // Internal aliases
            ["^@/app(/.*)?$", "^@gemini-wallet(/.*)?$"],

            // Relative imports
            ["^\\.\\.(?!/?$)", "^\\./(?=.*/)(?!/?$)", "^\\.(?!/?$)", "^\\.\\./?$", "^\\./?$"],

            // Style imports
            ["^.+\\.s?css$"],
          ],
        },
      ],
      "sort-keys-fix/sort-keys-fix": "warn",
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
  // prettier config must always be last to avoid rule conflicts
  pluginPrettier,
];
