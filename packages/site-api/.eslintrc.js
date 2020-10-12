module.exports = {
  root: true,
  env: {
    jest: true,
  },
  extends: [
    '@barusu/eslint-config'
  ],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: './tsconfig.json'
  },
  rules: {
  }
}
