import { builtinModules } from 'node:module'
import path from 'node:path'
import { defineConfig } from 'tsdown'

const { default: manifest } = await import(path.resolve('package.json'), {
  with: { type: 'json' },
})

const dependencies = new Set([
  ...builtinModules,
  ...builtinModules.map(name => `node:${name}`),
  ...Object.keys(manifest.dependencies ?? {}),
  ...Object.keys(manifest.peerDependencies ?? {}),
  ...Object.keys(manifest.optionalDependencies ?? {}),
])

const neverBundle = id => {
  const name = /^(@[^/]+\/[^/]+|[^/]+)/.exec(id)?.[1]
  return dependencies.has(name)
}

const defaultInteropPrefix = '\0external-default:'
const defaultInteropImports = new Set([
  '@guanghechen/invariant',
  'mime/types/other.js',
  'mime/types/standard.js',
])
const needsDefaultInterop = (id, importer) =>
  defaultInteropImports.has(id) && !importer?.startsWith(defaultInteropPrefix)

// These dependencies expose `default` on the namespace returned by require().
// A virtual ESM bridge preserves that default when generating CommonJS output.
const defaultInterop = {
  name: 'external-default-interop',
  resolveId: {
    order: 'pre',
    handler(id, importer) {
      if (needsDefaultInterop(id, importer)) return defaultInteropPrefix + id
    },
  },
  load(id) {
    if (!id.startsWith(defaultInteropPrefix)) return
    const source = JSON.stringify(id.slice(defaultInteropPrefix.length))
    return `export * from ${source}; export { default } from ${source};`
  },
}

const common = {
  cwd: process.cwd(),
  entry: { index: manifest.source },
  tsconfig: 'tsconfig.lib.json',
  target: 'esnext',
  platform: 'neutral',
  deps: { neverBundle, onlyBundle: [] },
  clean: true,
  exports: false,
}

export default defineConfig([
  ...[
    ['esm', manifest.module],
    ['cjs', manifest.main],
  ].map(([format, file]) => ({
    ...common,
    format,
    ...(format === 'cjs'
      ? {
          deps: {
            neverBundle: (id, importer) => !needsDefaultInterop(id, importer) && neverBundle(id),
            onlyBundle: [],
          },
          plugins: [defaultInterop],
        }
      : {}),
    outDir: path.dirname(file),
    outExtensions: () => ({ js: path.extname(file) }),
    sourcemap: process.env.BUILD_SOURCEMAP === 'true',
    cjsDefault: false,
    dts: false,
    outputOptions: {
      exports: 'named',
      comments: process.env.NODE_ENV !== 'production',
    },
  })),
  {
    ...common,
    format: 'esm',
    outDir: path.dirname(manifest.types),
    outExtensions: () => ({ dts: '.d.ts' }),
    sourcemap: false,
    // Keep non-exported helper types private in declaration files.
    footer: { dts: 'export {};' },
    dts: {
      generator: 'tsc',
      emitDtsOnly: true,
      sourcemap: false,
      compilerOptions: { declarationMap: false },
    },
  },
])
