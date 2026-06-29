import type { IAsset, IAssetPathResolver } from '@guanghechen/asset-types'
import { describe, expect, it } from 'vitest'
import { AssetLocator } from '../src'

const GUID_NAMESPACE = '1b671a64-40d5-491e-99b0-da01ff1f3341'

// Minimal path resolver: identify echoes the path, srcRoot is fixed, safety is a no-op.
function createPathResolver(srcRoot: string | null = '/srv'): IAssetPathResolver {
  return {
    identify: (p: string) => p,
    findSrcRoot: () => srcRoot,
    assertSafeAbsolutePath: () => {},
  } as unknown as IAssetPathResolver
}

function createLocator(pathResolver = createPathResolver()): AssetLocator {
  return new AssetLocator({ GUID_NAMESPACE, pathResolver })
}

const asset = (overrides: Partial<IAsset> = {}): IAsset =>
  ({ guid: 'guid-1', uri: '/uri/1', ...overrides }) as IAsset

describe('AssetLocator.resolveGUID', () => {
  it('is deterministic for the same source path', async () => {
    const locator = createLocator()
    expect(await locator.resolveGUID('/srv/a.md')).toBe(await locator.resolveGUID('/srv/a.md'))
    expect(await locator.resolveGUID('/srv/a.md')).not.toBe(await locator.resolveGUID('/srv/b.md'))
  })
})

describe('AssetLocator insert / find / remove', () => {
  it('indexes an asset by guid, uri and source path', async () => {
    const locator = createLocator()
    const guid = await locator.resolveGUID('/srv/a.md')
    const a = asset({ guid, uri: '/uri/a' })

    await locator.insertAsset('/srv/a.md', a)

    expect(await locator.findAssetByGuid(guid)).toBe(a)
    expect(await locator.findAssetBySrcPath('/srv/a.md')).toBe(a)
    expect(await locator.findSrcPathByUri('/uri/a')).toBe('/srv/a.md')
    expect(await locator.findAsset(x => x.uri === '/uri/a')).toBe(a)
  })

  it('returns null for unknown lookups', async () => {
    const locator = createLocator()
    expect(await locator.findAssetByGuid('nope')).toBeNull()
    expect(await locator.findSrcPathByUri('nope')).toBeNull()
    expect(await locator.findAsset(() => false)).toBeNull()
  })

  it('returns null from findAssetBySrcPath when no src root matches', async () => {
    const locator = createLocator(createPathResolver(null))
    expect(await locator.findAssetBySrcPath('/srv/a.md')).toBeNull()
  })

  it('removes an indexed asset and ignores unknown removals', async () => {
    const locator = createLocator()
    const guid = await locator.resolveGUID('/srv/a.md')
    await locator.insertAsset('/srv/a.md', asset({ guid, uri: '/uri/a' }))

    await locator.removeAsset('/srv/a.md')
    expect(await locator.findAssetByGuid(guid)).toBeNull()

    // Removing again is a no-op (asset already gone).
    await expect(locator.removeAsset('/srv/a.md')).resolves.toBeUndefined()
  })
})

describe('AssetLocator.dumpAssetDataMap', () => {
  it('returns assets sorted by uri', async () => {
    const locator = createLocator()
    const g1 = await locator.resolveGUID('/srv/a.md')
    const g2 = await locator.resolveGUID('/srv/b.md')
    await locator.insertAsset('/srv/a.md', asset({ guid: g1, uri: '/uri/z' }))
    await locator.insertAsset('/srv/b.md', asset({ guid: g2, uri: '/uri/a' }))

    const { assets } = await locator.dumpAssetDataMap()
    expect(assets.map(a => a.uri)).toEqual(['/uri/a', '/uri/z'])
  })
})
