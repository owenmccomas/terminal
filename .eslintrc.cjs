module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "next/core-web-vitals",
    "prettier",
  ],
  rules: {
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-non-null-assertion": "off",
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    "no-return-assign": 0,
    "no-console": "off",
    "react-hooks/exhaustive-deps": "off",
    "react/no-unescaped-entities": "off",
    // '@typescript-eslint/no-floating-promises': 'error',
  },
  ignorePatterns: ["src/types/*", ".eslintrc.js", "src/generated/*"],
};
