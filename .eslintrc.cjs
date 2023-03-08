module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es6: true,
  },
  parserOptions: {
    parser: '@typescript-eslint/parser',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'jsdoc', 'vue'],
  extends: [
    'eslint:recommended',
    'plugin:prettier/recommended',
    'plugin:jsdoc/recommended',
    'plugin:vue/vue3-recommended',
  ],

  rules: {
    'comma-dangle': ['error', 'only-multiline'],
    quotes: [
      'error',
      'single',
      { avoidEscape: true, allowTemplateLiterals: true },
    ],
    'no-console': 'off',

    'prettier/prettier': [
      'error',
      {
        singleQuote: true,
        trailingComma: 'es5',
      },
    ],

    'jsdoc/no-undefined-types': [
      'error',
      { definedTypes: ['Record', 'Pick', 'T', 'NodeListOf', 'SubmitEvent'] },
    ],
    'jsdoc/require-jsdoc': 'off',
    'jsdoc/require-param-description': 'off',
    'jsdoc/require-returns': 'off',
    'jsdoc/valid-types': 'off',

    'vue/html-self-closing': [
      // conflicts with prettier
      'error',
      {
        html: {
          void: 'any',
        },
      },
    ],
    'vue/max-attributes-per-line': 'off', // conflicts with prettier
    'vue/singleline-html-element-content-newline': 'off',
  },
};
