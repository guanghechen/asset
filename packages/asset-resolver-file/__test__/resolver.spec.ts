import type {
  IAssetPluginPolishInput,
  IAssetPluginResolveApi,
  IAssetPluginResolveInput,
} from '@guanghechen/asset-types'
import { AssetDataTypeEnum } from '@guanghechen/asset-types'
import { describe, expect, it } from 'vitest'
import { AssetResolverFile, FileAssetType, isFileAssetPolishInput } from '../src'

const identity = async <T>(embryo: T): Promise<T> => embryo

function resolveInput(src: string): IAssetPluginResolveInput {
  return {
    guid: 'guid-1',
    hash: 'hash-1',
    src,
    extname: undefined,
    content: Buffer.from('content'),
    encoding: undefined,
    title: 'the title',
    createdAt: '2020-01-01T00:00:00.000Z',
    updatedAt: '2020-01-02T00:00:00.000Z',
  }
}

const api = {
  resolveUri: async (sourcetype: string, mimetype: string) => `/uri/${sourcetype}/${mimetype}`,
} as unknown as IAssetPluginResolveApi

describe('AssetResolverFile.resolve', () => {
  it('uses the default display name', () => {
    expect(new AssetResolverFile().displayName).toBe('@guanghechen/asset-resolver-file')
    expect(new AssetResolverFile({ displayName: 'custom' }).displayName).toBe('custom')
  })

  it('resolves an accepted file into a file asset embryo', async () => {
    const resolver = new AssetResolverFile()
    const output = await resolver.resolve(resolveInput('note.txt'), null, api, identity)
    expect(output).toMatchObject({
      sourcetype: FileAssetType,
      mimetype: 'text/plain',
      uri: '/uri/file/text/plain',
      title: 'the title',
      categories: [],
      tags: [],
    })
  })

  it('falls back to "unknown" mimetype for unrecognized extensions', async () => {
    const resolver = new AssetResolverFile()
    const output = await resolver.resolve(resolveInput('data.zzz'), null, api, identity)
    expect(output!.mimetype).toBe('unknown')
  })

  it('passes the existing embryo through untouched', async () => {
    const resolver = new AssetResolverFile()
    const embryo = { sourcetype: 'other' } as never
    expect(await resolver.resolve(resolveInput('note.txt'), embryo, api, identity)).toBe(embryo)
  })

  it('skips files rejected by the accepted/rejected patterns', async () => {
    const resolver = new AssetResolverFile({ accepted: /\.md$/, rejected: /secret/ })
    expect(await resolver.resolve(resolveInput('note.txt'), null, api, identity)).toBeNull()
    expect(await resolver.resolve(resolveInput('secret.md'), null, api, identity)).toBeNull()
  })
})

describe('AssetResolverFile.polish', () => {
  const polishInput = (sourcetype: string): IAssetPluginPolishInput =>
    ({ sourcetype, content: Buffer.from('bin'), data: null }) as IAssetPluginPolishInput

  it('emits binary data for file-sourced inputs', async () => {
    const resolver = new AssetResolverFile()
    const output = await resolver.polish(polishInput(FileAssetType), null, {} as never, identity)
    expect(output).toEqual({ datatype: AssetDataTypeEnum.BINARY, data: Buffer.from('bin') })
  })

  it('passes non-file inputs through', async () => {
    const resolver = new AssetResolverFile()
    expect(await resolver.polish(polishInput('image'), null, {} as never, identity)).toBeNull()
  })
})

describe('isFileAssetPolishInput', () => {
  it('discriminates by sourcetype', () => {
    expect(isFileAssetPolishInput({ sourcetype: FileAssetType } as IAssetPluginPolishInput)).toBe(
      true,
    )
    expect(isFileAssetPolishInput({ sourcetype: 'image' } as IAssetPluginPolishInput)).toBe(false)
  })
})
