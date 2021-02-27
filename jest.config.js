const path = require('path')
const { compilerOptions } = require('./tsconfig')

const moduleNameMapper = {}
for (const moduleName of Object.getOwnPropertyNames(compilerOptions.paths)) {
  const paths = compilerOptions.paths[moduleName].map(p =>
    path.resolve(__dirname, p),
  )
  let pattern = '^' + moduleName.replace(/[-\\^$*+?.()|[\]{}]/g, '\\$&') + '$'
  moduleNameMapper[pattern] = paths.length === 1 ? paths[0] : paths
}

module.exports = {
  bail: true,
  verbose: true,
  errorOnDeprecated: true,
  roots: ['<rootDir>/src', '<rootDir>/__test__'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper,
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.json',
    },
  },
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  testURL: 'http://localhost/',
  testEnvironment: 'node',
  testRegex: '/(__test__)/[^/]+\\.spec\\.tsx?$',
  testPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/lib/',
    '/dist/',
    '/build/',
    '/target/',
    '/vendor/',
    '/release/',
    '/example/',
    '/demo/',
    '/doc/',
    '/tmp/',
    '/__tmp__/',
    '/script/',
  ],
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage/',
  collectCoverageFrom: [
    '**/src/**/*.{js,jsx,ts,tsx}',
    '**/src/*.{js,jsx,ts,tsx}',
    '!**/src/cli.ts',
    '!**/src/command/_util.ts',
  ],
  coveragePathIgnorePatterns: [],
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0,
    },
  },
  coverageReporters: ['text', 'text-summary'],
}
