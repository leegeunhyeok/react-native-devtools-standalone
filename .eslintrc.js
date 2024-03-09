const { resolve } = require('node:path');

const project = resolve(__dirname, 'tsconfig.json');

module.exports = {
  root: true,
  extends: [
    require.resolve('@vercel/style-guide/eslint/node'),
    require.resolve('@vercel/style-guide/eslint/browser'),
    require.resolve('@vercel/style-guide/eslint/typescript'),
  ],
  parserOptions: {
    project,
  },
  settings: {
    'import/resolver': {
      typescript: {
        project,
      },
    },
  },
  overrides: [
    {
      files: ['**/*.ts'],
      rules: {
        '@typescript-eslint/no-shadow': 'off',
      },
    },
    {
      files: ['build*.ts', 'demo/**/*.ts'],
      rules: {
        'no-console': 'off',
        'import/no-named-as-default-member': 'off',
      },
    },
  ],
};
