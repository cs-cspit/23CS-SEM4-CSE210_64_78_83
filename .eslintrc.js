module.exports = {
  extends: [
    "react-app",
    "react-app/jest"
  ],
  rules: {
    // Disable problematic rules for transpiled code
    "strict": "off",
    "no-func-assign": "off",
    "no-mixed-operators": "off",
    "no-sequences": "off",
    "no-unused-vars": ["error", { 
      "varsIgnorePattern": "^_",
      "argsIgnorePattern": "^_",
      "ignoreRestSiblings": true
    }]
  }
};