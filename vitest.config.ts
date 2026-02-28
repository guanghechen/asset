import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'
import { defineConfig } from 'vitest/config'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

function getPackageAliases(): Record<string, string> {
  const aliases: Record<string, string> = {}
  const packagesDir = path.resolve(__dirname, 'packages')

  if (!fs.existsSync(packagesDir)) return aliases

  const packageDirs = fs
    .readdirSync(packagesDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)

  for (const dir of packageDirs) {
    const packageRoot = path.resolve(packagesDir, dir)
    const manifestPath = path.resolve(packageRoot, 'package.json')
    const srcPath = path.resolve(packageRoot, 'src')
    if (!fs.existsSync(manifestPath) || !fs.existsSync(srcPath)) continue

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
    const packageName = manifest.name
    if (typeof packageName === 'string' && packageName.length > 0) {
      aliases[packageName] = srcPath
    }
  }

  return aliases
}

export default defineConfig({
  test: {
    environment: 'node',
    include: ['packages/*/__test__/**/*.spec.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      include: ['packages/*/src/**/*.ts'],
      exclude: ['**/node_modules/**', '**/__test__/**'],
      thresholds: {
        branches: 50,
        functions: 65,
        lines: 60,
        statements: 60,
      },
    },
  },
  resolve: {
    alias: {
      ...getPackageAliases(),
    },
  },
})
