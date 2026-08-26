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

  it('removes the stale uri mapping when replacing an asset', async () => {
    const locator = createLocator()
    const absoluteSrcPath = '/srv/a.md'
    const guid = await locator.resolveGUID(absoluteSrcPath)

    await locator.insertAsset(absoluteSrcPath, asset({ guid, uri: '/uri/old' }))
    await locator.insertAsset(absoluteSrcPath, asset({ guid, uri: '/uri/new' }))

    expect(await locator.findSrcPathByUri('/uri/old')).toBeNull()
    expect(await locator.findSrcPathByUri('/uri/new')).toBe(absoluteSrcPath)
  })

  it('rejects uri collisions without mutating either index', async () => {
    const locator = createLocator()
    const srcA = '/srv/a.md'
    const srcB = '/srv/b.md'
    const guidA = await locator.resolveGUID(srcA)
    const guidB = await locator.resolveGUID(srcB)
    const a = asset({ guid: guidA, uri: '/uri/a' })
    const b = asset({ guid: guidB, uri: '/uri/shared' })

    await locator.insertAsset(srcA, a)
    await locator.insertAsset(srcB, b)
    await expect(
      locator.insertAsset(srcA, asset({ guid: guidA, uri: '/uri/shared' })),
    ).rejects.toThrow(/URI collision/)

    expect(await locator.findAssetByGuid(guidA)).toBe(a)
    expect(await locator.findAssetByGuid(guidB)).toBe(b)
    expect(await locator.findSrcPathByUri('/uri/a')).toBe(srcA)
    expect(await locator.findSrcPathByUri('/uri/shared')).toBe(srcB)
  })

  it('rejects inconsistent removal before mutating either index', async () => {
    const locator = createLocator()
    const absoluteSrcPath = '/srv/a.md'
    const guid = await locator.resolveGUID(absoluteSrcPath)
    const a = asset({ guid, uri: '/uri/a' })
    await locator.insertAsset(absoluteSrcPath, a)

    const uri2src = (locator as unknown as { _uri2src: Map<string, string> })._uri2src
    uri2src.set(a.uri, '/srv/b.md')

    await expect(locator.removeAsset(absoluteSrcPath)).rejects.toThrow(/inconsistent URI mapping/)
    expect(await locator.findAssetByGuid(guid)).toBe(a)
    expect(await locator.findSrcPathByUri(a.uri)).toBe('/srv/b.md')
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
