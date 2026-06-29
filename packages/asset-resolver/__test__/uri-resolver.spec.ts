import type { IAssetLocation, IAssetMeta } from '@guanghechen/asset-types'
import { describe, expect, it } from 'vitest'
import { AssetUriResolver } from '../src'

function createResolver(prefix = 'asset/img'): AssetUriResolver {
  return new AssetUriResolver({ resolveUriPrefix: async () => prefix })
}

const location = (overrides: Partial<IAssetLocation> = {}): IAssetLocation => ({
  guid: 'guid-1',
  hash: 'hash-1',
  sourcetype: 'image',
  mimetype: 'image/png',
  extname: undefined,
  ...overrides,
})

describe('AssetUriResolver.resolveSlug', () => {
  it('returns the slug when present, otherwise null', async () => {
    const r = createResolver()
    expect(await r.resolveSlug({ slug: 's' } as IAssetMeta)).toBe('s')
    expect(await r.resolveSlug({ slug: null } as IAssetMeta)).toBeNull()
  })
})

describe('AssetUriResolver.resolveUri', () => {
  it('derives the extension from the mimetype', async () => {
    const r = createResolver('asset/img')
    expect(await r.resolveUri(location())).toBe('/asset/img/guid-1.png')
  })

  it('falls back to the asset extname when the mimetype is unknown', async () => {
    const r = createResolver('asset/file')
    const uri = await r.resolveUri(location({ mimetype: 'application/x-unknown', extname: 'bin' }))
    expect(uri).toBe('/asset/file/guid-1.bin')
  })

  it('omits the extension when neither mimetype nor extname yields one', async () => {
    const r = createResolver('asset/file')
    expect(await r.resolveUri(location({ mimetype: 'application/x-unknown' }))).toBe(
      '/asset/file/guid-1',
    )
  })

  it('normalizes redundant slashes from the prefix', async () => {
    const r = createResolver('/asset//img/')
    expect(await r.resolveUri(location())).toBe('/asset/img/guid-1.png')
  })
})
