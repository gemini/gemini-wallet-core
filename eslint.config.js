import eslint from "@eslint/js";
import pluginImport from "eslint-plugin-import";
// plugins
import pluginPrettier from "eslint-plugin-prettier/recommended";
import pluginImportSort from "eslint-plugin-simple-import-sort";
import pluginKeysSort from "eslint-plugin-sort-keys-fix";
import globals from "globals";
import tseslint from "typescript-eslint";

/** @type {import("eslint").Linter.Config} */
export default [
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
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
      "@typescript-eslint/no-unused-vars": [
        2,
        { args: "none", vars: "local", varsIgnorePattern: "[uU]nused" },
      ],
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
      "no-implicit-coercion": [
        2,
        { boolean: true, number: true, string: true },
      ],
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

            // External libraries (exclude @gemini-wallet and @/)
            ["^react", "^@emotion", "^(?!@gemini-wallet)(?!@/)[@\\w].*"],

            // Internal aliases
            ["^@/app(/.*)?$", "^@gemini-wallet(/.*)?$"],

            // Relative imports
            [
              "^\\.\\.(?!/?$)",
              "^\\./(?=.*/)(?!/?$)",
              "^\\.(?!/?$)",
              "^\\.\\./?$",
              "^\\./?$",
            ],

            // Style imports
            ["^.+\\.s?css$"],
          ],
        },
      ],
      "sort-keys-fix/sort-keys-fix": "warn",
      "prettier/prettier": [
        "error",
        {
          arrowParens: "avoid",
          printWidth: 120,
        },
      ],
    },
  },
  // prettier config must always be last to avoid rule conflicts
  pluginPrettier,
];
