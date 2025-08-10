import tseslint from "typescript-eslint";
import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import globals from "globals";

export default tseslint.config(
  { ignores: ["dist", "node_modules"] },

  // Typed Lint NUR für src/**
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: ["./tsconfig.eslint.json"],
        tsconfigRootDir: import.meta.dirname,
        sourceType: "module"
      },
      globals: globals.node
    },
    plugins: { "@typescript-eslint": tseslint.plugin },
    extends: [js.configs.recommended, ...tseslint.configs.recommendedTypeChecked, prettier],
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }]
    }
  },

  // Tests UNtyped (keine project-Option, keine typed rules)
  {
    files: ["test/**/*.ts", "**/*.spec.ts"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        // bewusst KEIN "project"
        tsconfigRootDir: import.meta.dirname,
        sourceType: "module"
      },
      globals: { ...globals.node, ...globals.jest }
    },
    plugins: { "@typescript-eslint": tseslint.plugin },
    extends: [js.configs.recommended, ...tseslint.configs.recommended, prettier],
    rules: {
      "@typescript-eslint/await-thenable": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-return": "off"
    }
  }
);
