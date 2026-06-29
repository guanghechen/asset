import { AssetLocator, AssetResolverApi, AssetUriResolver } from '@guanghechen/asset-resolver'
import { FileAssetType } from '@guanghechen/asset-resolver-file'
import { ImageAssetType } from '@guanghechen/asset-resolver-image'
import { MarkdownAssetType } from '@guanghechen/asset-resolver-markdown'
import { AssetPathResolver } from '@guanghechen/asset-storage'
import { MemoAssetSourceDataStorage, MemoAssetSourceStorage } from '@guanghechen/asset-storage-memo'
import type { IAssetResolverApi } from '@guanghechen/asset-types'
import { Reporter } from '@guanghechen/reporter'
import { YozoraParser } from '@yozora/parser'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { createAsstResolver } from '../src'
import type { IAssetResolverFlights } from '../src/resolver'

const ROOT = path.resolve('/srv/project')
const GUID_NAMESPACE = '1b671a64-40d5-491e-99b0-da01ff1f3341'
const reporter = new Reporter().mock()
const parser = new YozoraParser()

const flights = (value: boolean): IAssetResolverFlights => ({
  markdownSlug: value,
  markdownCode: value,
  markdownStripSpace: value,
  markdownAplayer: value,
  markdownDefinition: value,
  markdownFootnote: value,
  markdownEcmaImport: value,
  markdownImages: value,
  markdownToc: value,
  markdownExcerpt: value,
  markdownTimeToRead: value,
})

async function createApi(markdown: string): Promise<IAssetResolverApi> {
  return createApiWith([['post.md', Buffer.from(markdown)]])
}

// A 1x1 transparent PNG so the image resolver's size probe succeeds.
const PNG_1x1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
)

async function createApiWith(files: Array<[string, Buffer]>): Promise<IAssetResolverApi> {
  const pathResolver = new AssetPathResolver({ caseSensitive: true, srcRoots: [ROOT] })
  const dataStore = new MemoAssetSourceDataStorage({ pathResolver })
  const sourceStorage = new MemoAssetSourceStorage({ dataStore, pathResolver })
  for (const [name, content] of files) {
    await sourceStorage.updateFile(path.join(ROOT, name), content)
  }
  return new AssetResolverApi({
    encodingDetector: { detect: async () => 'utf8' } as never,
    locator: new AssetLocator({ GUID_NAMESPACE, pathResolver }),
    pathResolver,
    reporter,
    sourceStorage,
    uriResolver: new AssetUriResolver({ resolveUriPrefix: async () => 'asset' }),
  })
}

const MD = '# Hello\n\nworld'

describe('createAsstResolver', () => {
  it('wires the markdown plugins so an enabled slug flight produces a slug', async () => {
    const api = await createApi(MD)
    const resolver = createAsstResolver({
      flights: flights(true),
      parser,
      reporter,
      slugPrefix: '/post/',
    })
    const asset = await resolver.resolve(path.join(ROOT, 'post.md'), api)
    expect(asset).not.toBeNull()
    expect(asset!.sourcetype).toBe(MarkdownAssetType)
    expect(asset!.slug).toBe('/post/post')
  })

  it('omits the slug when the slug flight is disabled', async () => {
    const api = await createApi(MD)
    const resolver = createAsstResolver({
      flights: flights(false),
      parser,
      reporter,
      slugPrefix: '/post/',
    })
    const asset = await resolver.resolve(path.join(ROOT, 'post.md'), api)
    expect(asset!.sourcetype).toBe(MarkdownAssetType)
    expect(asset!.slug).toBeNull()
  })

  it('routes images and plain files to the image/file resolvers', async () => {
    const api = await createApiWith([
      ['photo.png', PNG_1x1],
      ['note.txt', Buffer.from('hello')],
    ])
    const resolver = createAsstResolver({
      flights: flights(true),
      parser,
      reporter,
      slugPrefix: '/post/',
    })

    const image = await resolver.resolve(path.join(ROOT, 'photo.png'), api)
    expect(image!.sourcetype).toBe(ImageAssetType)

    const file = await resolver.resolve(path.join(ROOT, 'note.txt'), api)
    expect(file!.sourcetype).toBe(FileAssetType)
  })

  it('rejects files whose path contains a "password" segment', async () => {
    const api = await createApiWith([['my_password.txt', Buffer.from('secret')]])
    const resolver = createAsstResolver({
      flights: flights(true),
      parser,
      reporter,
      slugPrefix: '/post/',
    })
    expect(await resolver.resolve(path.join(ROOT, 'my_password.txt'), api)).toBeNull()
  })
})
