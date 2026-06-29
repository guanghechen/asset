import {
  AssetLocator,
  AssetResolver,
  AssetResolverApi,
  AssetUriResolver,
} from '@guanghechen/asset-resolver'
import { AssetResolverFile } from '@guanghechen/asset-resolver-file'
import { AssetPathResolver, AssetTargetStorage } from '@guanghechen/asset-storage'
import {
  MemoAssetSourceDataStorage,
  MemoAssetSourceStorage,
  MemoAssetTargetDataStore,
} from '@guanghechen/asset-storage-memo'
import type { IAssetResolverApi, IAssetSourceStorage } from '@guanghechen/asset-types'
import { Reporter } from '@guanghechen/reporter'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { AssetService } from '../src'

const ROOT = path.resolve('/srv/project')
const GUID_NAMESPACE = '1b671a64-40d5-491e-99b0-da01ff1f3341'
const reporter = new Reporter().mock()

// Poll an async predicate until it holds or the timeout elapses — used to await
// the watcher's fire-and-forget scheduler without a brittle fixed sleep.
async function waitFor(
  predicate: () => Promise<boolean>,
  timeoutMs = 5000,
  stepMs = 25,
): Promise<boolean> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (await predicate()) return true
    await new Promise<void>(resolve => setTimeout(resolve, stepMs))
  }
  return false
}

interface IHarness {
  service: AssetService
  sourceStorage: IAssetSourceStorage
  targetStorage: AssetTargetStorage
}

function createHarness(): IHarness {
  const pathResolver = new AssetPathResolver({ caseSensitive: true, srcRoots: [ROOT] })
  const dataStore = new MemoAssetSourceDataStorage({ pathResolver })
  const sourceStorage = new MemoAssetSourceStorage({ dataStore, pathResolver })
  const targetStorage = new AssetTargetStorage(new MemoAssetTargetDataStore())
  const uriResolver = new AssetUriResolver({ resolveUriPrefix: async () => 'asset' })
  const locator = new AssetLocator({ GUID_NAMESPACE, pathResolver })
  const resolverApi: IAssetResolverApi = new AssetResolverApi({
    encodingDetector: { detect: async () => 'utf8' } as never,
    locator,
    pathResolver,
    reporter,
    sourceStorage,
    uriResolver,
  })
  const resolver = new AssetResolver({ reporter }).use(new AssetResolverFile())
  const service = new AssetService({
    reporter,
    resolver,
    resolverApi,
    pathResolver,
    sourceStorage,
    targetStorage,
    dataMapUri: '/api/test.asset.map.json',
  })
  return { service, sourceStorage, targetStorage }
}

let harness: IHarness
const src = (name: string): string => path.join(ROOT, name)

beforeEach(async () => {
  harness = createHarness()
  await harness.sourceStorage.updateFile(src('a.txt'), Buffer.from('alpha'))
  await harness.sourceStorage.updateFile(src('b.txt'), Buffer.from('beta'))
})

afterEach(async () => {
  await harness.service.close()
})

describe('AssetService lifecycle guards', () => {
  it('rejects build/watch operations before prepare()', async () => {
    const { service } = harness
    await expect(service.buildByPaths([src('a.txt')])).rejects.toThrow(/not running/)
    await expect(service.buildByPatterns(ROOT, ['**/*.txt'])).rejects.toThrow(/prepared|pending/)
    await expect(service.watch(ROOT, ['**/*.txt'])).rejects.toThrow(/not running/)
  })

  it('prepare() and close() are idempotent', async () => {
    const { service } = harness
    await service.prepare()
    await service.prepare()
    await service.close()
    await service.close()
  })
})

describe('AssetService.buildByPaths', () => {
  it('processes the given paths into target assets and an asset map', async () => {
    const { service, targetStorage } = harness
    await service.prepare()
    await service.buildByPaths([src('a.txt'), src('b.txt')])

    const asset = await service.resolveAsset(src('a.txt'))
    expect(asset).not.toBeNull()
    expect(await targetStorage.resolveFile(asset!.uri)).toBeDefined()
    expect(await targetStorage.resolveFile('/api/test.asset.map.json')).toBeDefined()
  })

  it('returns early for an empty path list', async () => {
    const { service } = harness
    await service.prepare()
    await expect(service.buildByPaths([])).resolves.toBeUndefined()
  })
})

describe('AssetService.buildByPatterns', () => {
  it('collects sources by glob then builds them', async () => {
    const { service, targetStorage } = harness
    await service.prepare()
    await service.buildByPatterns(ROOT, ['**/*.txt'])

    const asset = await service.findAsset(a => a.uri.endsWith('.txt'))
    expect(asset).not.toBeNull()
    expect(await service.findSrcPathByUri(asset!.uri)).toBe(src('a.txt'))
  })
})

describe('AssetService.watch', () => {
  it('builds on add/change and tears down on remove', async () => {
    const { service, sourceStorage, targetStorage } = harness
    await service.prepare()
    const watcher = await service.watch(ROOT, [path.join(ROOT, '**/*.txt')])

    const dataAt = async (uri: string): Promise<Buffer | undefined> =>
      (await targetStorage.resolveFile(uri))?.data as Buffer | undefined

    // Add -> the watcher schedules a build that writes the target asset.
    await sourceStorage.updateFile(src('c.txt'), Buffer.from('gamma'))
    const asset = await service.resolveAsset(src('c.txt'))
    expect(asset).not.toBeNull()
    const uri = asset!.uri
    expect(await waitFor(async () => (await dataAt(uri))?.toString() === 'gamma')).toBe(true)

    // Change -> rebuild; wait for the new content before moving on (serializes the tasks).
    await sourceStorage.updateFile(src('c.txt'), Buffer.from('gamma2'))
    expect(await waitFor(async () => (await dataAt(uri))?.toString() === 'gamma2')).toBe(true)

    // Remove -> the watcher schedules removal of the target asset.
    await sourceStorage.removeFile(src('c.txt'))
    expect(await waitFor(async () => (await targetStorage.resolveFile(uri)) === undefined)).toBe(
      true,
    )

    await watcher.unwatch()
    await watcher.unwatch() // idempotent
  }, 15000)
})
