module.exports = {
  "root": true,
  "parser": "@typescript-eslint/parser",
  "extends": ["plugin:@typescript-eslint/recommended", "prettier"],
  "parserOptions": { "ecmaVersion": 2019, "sourceType": "module", "project": "./tsconfig.json", "tsconfigRootDir": __dirname, },
  "env": {
    "node": true,
    "es6": true
  },
  "rules": {
    "@typescript-eslint/no-inferrable-types": 0,
    // should remove this in the end
    "@typescript-eslint/no-explicit-any": 0,
    "@typescript-eslint/ban-types": 0,
    "no-process-env": "error",
    "@typescript-eslint/no-floating-promises": ["error"]
  },
}