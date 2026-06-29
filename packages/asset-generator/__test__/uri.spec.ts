import { FileAssetType } from '@guanghechen/asset-resolver-file'
import { ImageAssetType } from '@guanghechen/asset-resolver-image'
import { MarkdownAssetType } from '@guanghechen/asset-resolver-markdown'
import type { IAssetLocation } from '@guanghechen/asset-types'
import { describe, expect, it } from 'vitest'
import { createAssetUriResolver } from '../src/uri'

const resolver = createAssetUriResolver('blog')

const location = (overrides: Partial<IAssetLocation>): IAssetLocation =>
  ({
    guid: 'guid-1',
    hash: 'hash-1',
    sourcetype: 'unknown-type',
    mimetype: 'application/x-unknown',
    extname: 'dat',
    ...overrides,
  }) as IAssetLocation

describe('createAssetUriResolver', () => {
  it('routes known sourcetypes to their dedicated prefixes', async () => {
    expect(
      await resolver.resolveUri(location({ sourcetype: FileAssetType, mimetype: 'text/plain' })),
    ).toBe('/asset/blog/file/guid-1.txt')
    expect(
      await resolver.resolveUri(location({ sourcetype: ImageAssetType, mimetype: 'image/png' })),
    ).toBe('/asset/blog/img/guid-1.png')
    expect(
      await resolver.resolveUri(
        location({ sourcetype: MarkdownAssetType, mimetype: 'text/plain' }),
      ),
    ).toBe('/api/blog/guid-1.txt')
  })

  it('routes unknown sourcetypes by mimetype family', async () => {
    expect(
      await resolver.resolveUri(location({ mimetype: 'application/json', extname: undefined })),
    ).toBe('/asset/blog/json/guid-1.json')
    expect(
      await resolver.resolveUri(location({ mimetype: 'text/plain', extname: undefined })),
    ).toBe('/asset/blog/text/guid-1.txt')
    expect(await resolver.resolveUri(location({}))).toBe('/asset/blog/unknown/guid-1.dat')
  })
})
