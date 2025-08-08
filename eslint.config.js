import globals from "globals";
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

// plugins
import pluginKeysSort from "eslint-plugin-sort-keys-fix";
import pluginImport from "eslint-plugin-import";
import pluginImportSort from "eslint-plugin-simple-import-sort";
import pluginPrettier from "eslint-plugin-prettier/recommended";
import pluginTypeScript from "@typescript-eslint/eslint-plugin";

/** @type {import("eslint").Linter.Config} */
export default [
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: "latest",
      parserOptions: {
        ecmaVersion: 2020,
        project: "./tsconfig.json",
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es6,
      },
      parser: tseslint.parser,
      sourceType: "module",
    },
    plugins: {
      "@typescript-eslint": pluginTypeScript,
      import: pluginImport,
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
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [2, { vars: "local", args: "none", varsIgnorePattern: "[uU]nused" }],
      "@typescript-eslint/no-useless-constructor": 2,
      "@typescript-eslint/no-var-requires": 0,
      eqeqeq: ["error", "always", { null: "ignore" }],
      "import/export": "error",
      "import/no-commonjs": 2,
      "import/no-duplicates": ["error", { considerQueryString: true }],
      "import/order": 0,
      "no-alert": "error",
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-const-assign": "error",
      "no-duplicate-case": "error",
      "no-duplicate-imports": "error",
      "no-dupe-class-members": "error",
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
      "require-await": "error",
      semi: 0,
      "simple-import-sort/exports": 2,
      "simple-import-sort/imports": [
        "error",
        {
          groups: [
            // Side effect imports.
            ["^\\u0000"],
            // External libraries
            ["^@metamask", "^eventemitter3", "^viem", "^[@\\w].*"],
            // Internal imports
            ["^@/.*"],
            // Relative imports
            ["^\\.\\.(?!/?$)", "^\\./(?=.*/)(?!/?$)", "^\\.(?!/?$)", "^\\.\\./?$", "^\\./?$"],
          ],
        },
      ],
      "sort-keys-fix/sort-keys-fix": "warn",
    },
  },
  // prettier config must always be last to avoid rule conflicts
  pluginPrettier,
];
