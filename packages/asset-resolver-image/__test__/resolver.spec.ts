import type {
  IAssetPluginPolishInput,
  IAssetPluginResolveApi,
  IAssetPluginResolveInput,
} from '@guanghechen/asset-types'
import { AssetDataTypeEnum } from '@guanghechen/asset-types'
import { describe, expect, it, vi } from 'vitest'
import { AssetResolverImage, ImageAssetType, isImageAssetPolishInput } from '../src'

const identity = async <T>(embryo: T): Promise<T> => embryo

// A 1x1 transparent PNG, enough for image-size to read the dimensions.
const PNG_1x1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
)

function resolveInput(src: string, content: Buffer = PNG_1x1): IAssetPluginResolveInput {
  return {
    guid: 'guid-1',
    hash: 'hash-1',
    src,
    extname: undefined,
    content,
    encoding: undefined,
    title: 'pic',
    createdAt: '2020-01-01T00:00:00.000Z',
    updatedAt: '2020-01-02T00:00:00.000Z',
  }
}

function apiReturning(uri: string | null): IAssetPluginResolveApi {
  return { resolveUri: async () => uri } as unknown as IAssetPluginResolveApi
}

describe('AssetResolverImage.resolve', () => {
  it('uses the default display name', () => {
    expect(new AssetResolverImage().displayName).toBe('@guanghechen/asset-resolver-image')
  })

  it('injects width/height query params for root-relative uris', async () => {
    const resolver = new AssetResolverImage()
    const output = await resolver.resolve(
      resolveInput('a.png'),
      null,
      apiReturning('/img/g'),
      identity,
    )
    expect(output!.sourcetype).toBe(ImageAssetType)
    expect(output!.mimetype).toBe('image/png')
    expect(output!.uri).toBe('/img/g?width=1&height=1')
  })

  it('does not touch dimensions when both params already exist', async () => {
    const resolver = new AssetResolverImage()
    const uri = '/img/g?width=10&height=20'
    const output = await resolver.resolve(resolveInput('a.png'), null, apiReturning(uri), identity)
    expect(output!.uri).toBe(uri)
  })

  it('leaves absolute (non-root) uris untouched', async () => {
    const resolver = new AssetResolverImage()
    const output = await resolver.resolve(
      resolveInput('a.png'),
      null,
      apiReturning('https://cdn/x.png'),
      identity,
    )
    expect(output!.uri).toBe('https://cdn/x.png')
  })

  it('swallows decode errors and keeps the original uri', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const resolver = new AssetResolverImage()
    const output = await resolver.resolve(
      resolveInput('a.png', Buffer.from('not-an-image')),
      null,
      apiReturning('/img/g'),
      identity,
    )
    expect(output!.uri).toBe('/img/g')
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })

  it('skips rejected images and passes existing embryos through', async () => {
    const resolver = new AssetResolverImage({ rejected: /a\.png$/ })
    expect(
      await resolver.resolve(resolveInput('a.png'), null, apiReturning('/x'), identity),
    ).toBeNull()

    const plain = new AssetResolverImage()
    const embryo = { sourcetype: 'other' } as never
    expect(await plain.resolve(resolveInput('a.png'), embryo, apiReturning('/x'), identity)).toBe(
      embryo,
    )
  })
})

describe('AssetResolverImage.polish', () => {
  const polishInput = (sourcetype: string): IAssetPluginPolishInput =>
    ({ sourcetype, content: PNG_1x1, data: null }) as IAssetPluginPolishInput

  it('emits binary data for image-sourced inputs', async () => {
    const resolver = new AssetResolverImage()
    const output = await resolver.polish(polishInput(ImageAssetType), null, {} as never, identity)
    expect(output).toEqual({ datatype: AssetDataTypeEnum.BINARY, data: PNG_1x1 })
  })

  it('passes non-image inputs through', async () => {
    const resolver = new AssetResolverImage()
    expect(await resolver.polish(polishInput('file'), null, {} as never, identity)).toBeNull()
  })
})

describe('isImageAssetPolishInput', () => {
  it('discriminates by sourcetype', () => {
    expect(isImageAssetPolishInput({ sourcetype: ImageAssetType } as IAssetPluginPolishInput)).toBe(
      true,
    )
    expect(isImageAssetPolishInput({ sourcetype: 'file' } as IAssetPluginPolishInput)).toBe(false)
  })
})
