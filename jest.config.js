const { tsMonorepoConfig } = require('@guanghechen/jest-config')

module.exports = {
  ...tsMonorepoConfig(__dirname),
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 80,
      lines: 60,
      statements: 60,
    },
  },
}
