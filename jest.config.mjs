import { tsMonorepoConfig } from '@guanghechen/jest-config'
import { createRequire } from 'node:module'
import path from 'node:path'
import url from 'node:url'

const require = createRequire(import.meta.url)

export default async function () {
  const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
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
    prettierPath: require.resolve('prettier-2'),
  }
}
