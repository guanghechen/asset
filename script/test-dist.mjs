import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const packagesDir = path.join(root, 'packages')
const shouldSourcemap = process.argv.includes('--sourcemap')

for (const name of fs.readdirSync(packagesDir)) {
  const packageDir = path.join(packagesDir, name)
  const manifestPath = path.join(packageDir, 'package.json')
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  const esm = await import(pathToFileURL(path.resolve(packageDir, manifest.exports.import)).href)
  const cjs = createRequire(manifestPath)(manifest.name)
  const exportedNames = Object.keys(esm).sort()
  assert.ok(exportedNames.length > 0, `${manifest.name}: missing ESM exports`)
  assert.deepEqual(
    Object.keys(cjs)
      .filter(key => key !== '__esModule')
      .sort(),
    exportedNames,
    `${manifest.name}: ESM and CJS exports must agree`,
  )
  assert.equal(manifest.exports.types, manifest.types)
  assert.equal(manifest.exports.import, manifest.module)
  assert.equal(manifest.exports.require, manifest.main)
  assert.ok(fs.existsSync(path.resolve(packageDir, manifest.types)))

  const libDir = path.join(packageDir, 'lib')
  for (const file of fs.readdirSync(libDir, { recursive: true })) {
    const filepath = path.join(libDir, file)
    if (/\.(?:mjs|cjs|js)$/.test(file)) {
      const code = fs.readFileSync(filepath, 'utf8')
      assert.equal(fs.existsSync(`${filepath}.map`), shouldSourcemap, `${filepath}: sourcemap`)
      assert.equal(code.includes('sourceMappingURL='), shouldSourcemap, `${filepath}: map link`)
      if (shouldSourcemap) {
        const map = JSON.parse(fs.readFileSync(`${filepath}.map`, 'utf8'))
        assert.equal(map.version, 3)
        assert.ok(map.sources.length > 0, `${filepath}: missing source paths`)
        assert.equal(map.sourcesContent.length, map.sources.length)
      }
    }
    if (file.endsWith('.map')) {
      assert.ok(shouldSourcemap && !file.endsWith('.d.ts.map'), `${filepath}: unexpected map`)
    }
  }

  const packed = spawnSync('npm', ['pack', '--dry-run', '--ignore-scripts', '--json'], {
    cwd: packageDir,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  })
  assert.ifError(packed.error)
  assert.equal(packed.status, 0, `${manifest.name}: ${packed.stderr}`)
  const packedPaths = JSON.parse(packed.stdout)[0].files.map(file => file.path)
  for (const entry of [manifest.module, manifest.main, manifest.types]) {
    assert.ok(
      packedPaths.includes(entry.replace(/^\.\//, '')),
      `${manifest.name}: unpacked ${entry}`,
    )
  }
  assert.ok(!packedPaths.some(file => file.endsWith('.map')), `${manifest.name}: packed sourcemaps`)

  const consumerDir = fs.mkdtempSync(path.join(packageDir, '.tsdown-consumer-'))
  try {
    let consumer = `import { ${exportedNames.join(', ')} } from '${manifest.name}'\n`
    consumer += `export { ${exportedNames.join(', ')} }\n`
    if (name === 'asset-types') {
      consumer += `import type { IAsset, IAssetResolver, IAssetService } from '${manifest.name}'\n`
      consumer += 'export type Contracts = [IAsset, IAssetResolver, IAssetService]\n'
      consumer += '// @ts-expect-error Asset URIs must remain strings.\n'
      consumer += 'export const invalidUri: IAsset["uri"] = 123\n'
    }
    if (name === 'asset-api') {
      consumer += '// @ts-expect-error Internal helper types must remain private.\n'
      consumer += `import type { IProps } from '${manifest.name}'\n`
    }
    const consumerPaths = ['index.mts', 'index.cts'].map(file => path.join(consumerDir, file))
    for (const file of consumerPaths) fs.writeFileSync(file, consumer)
    const result = spawnSync(
      'tsc',
      [
        '--ignoreConfig',
        '--noEmit',
        '--strict',
        '--target',
        'esnext',
        '--module',
        'nodenext',
        '--types',
        'node',
        ...consumerPaths,
      ],
      { cwd: root, encoding: 'utf8', shell: process.platform === 'win32' },
    )
    assert.ifError(result.error)
    assert.equal(result.status, 0, `${manifest.name}: ${result.stdout}${result.stderr}`)
  } finally {
    fs.rmSync(consumerDir, { recursive: true, force: true })
  }

  if (name === 'asset-util') {
    for (const module of [esm, cjs]) {
      assert.equal(module.normalizeUrlPath('/a/../b?x=1#hash'), '/b?x=1#hash')
      assert.equal(module.mime.getType('example.cpp'), 'text/x-c++src')
    }
  }
  if (name === 'asset-storage') {
    for (const module of [esm, cjs]) {
      const resolver = new module.PathResolver()
      assert.equal(resolver.relative('/root', '/root/file.txt'), 'file.txt')
      resolver.assertRelativePath('/root', '/root/file.txt')
      assert.throws(() => resolver.assertRelativePath('/root', '/outside.txt'))
    }
  }
  console.log(`${manifest.name}: ESM, CJS, declarations, sourcemaps, and package contents passed`)
}
