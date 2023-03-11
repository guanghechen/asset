import { tsMonorepoConfig } from '@guanghechen/jest-config'
import { resolve } from 'import-meta-resolve'
import path from 'node:path'
import url from 'node:url'

export default async function () {
  const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
  const chalkLocation = url.fileURLToPath(await resolve('chalk', import.meta.url))
  const baseConfig = await tsMonorepoConfig(__dirname, { useESM: true })
  const { default: manifest } = await import(path.resolve('package.json'), {
    assert: { type: 'json' },
  })

  return {
    ...baseConfig,
    coverageProvider: 'babel',
    coverageThreshold: {
      global: {
        branches: 50,
        functions: 65,
        lines: 60,
        statements: 60,
        ...manifest.jest?.coverageThreshold?.global,
      },
    },
    extensionsToTreatAsEsm: ['.ts', '.mts'],
    moduleNameMapper: {
      ...baseConfig.moduleNameMapper,
      chalk: chalkLocation,
      '#ansi-styles': path.join(
        chalkLocation.split('chalk')[0],
        'chalk/source/vendor/ansi-styles/index.js',
      ),
      '#supports-color': path.join(
        chalkLocation.split('chalk')[0],
        'chalk/source/vendor/supports-color/index.js',
      ),
    },
  }
}
