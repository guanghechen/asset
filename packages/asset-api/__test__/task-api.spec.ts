import { AssetTargetStorage } from '@guanghechen/asset-storage'
import { MemoAssetTargetDataStore } from '@guanghechen/asset-storage-memo'
import { AssetDataTypeEnum } from '@guanghechen/asset-types'
import type { IAsset, IAssetProcessedData } from '@guanghechen/asset-types'
import { Reporter } from '@guanghechen/reporter'
import { describe, expect, it, vi } from 'vitest'
import { AssetTaskApi } from '../src'

const reporter = new Reporter().mock()

const asset = (uri: string): IAsset =>
  ({
    guid: `guid-${uri}`,
    hash: 'hash',
    uri,
    slug: null,
    sourcetype: 'file',
    mimetype: 'application/octet-stream',
    extname: 'bin',
    title: 't',
    description: null,
    createdAt: '2020-01-01T00:00:00.000Z',
    updatedAt: '2020-01-01T00:00:00.000Z',
    categories: [],
    tags: [],
  }) as IAsset

interface IHarness {
  api: AssetTaskApi
  targetStorage: AssetTargetStorage
  removeAsset: ReturnType<typeof vi.fn>
  findAssetBySrcPath: ReturnType<typeof vi.fn>
}

function createApi(processed: IAssetProcessedData[] = []): IHarness {
  const targetStorage = new AssetTargetStorage(new MemoAssetTargetDataStore())
  const removeAsset = vi.fn(async () => {})
  const findAssetBySrcPath = vi.fn(async (p: string) => asset(`/from/${p}`))
  const resolverApi = {
    locator: {
      removeAsset,
      findAssetBySrcPath,
      dumpAssetDataMap: async () => ({ assets: [] }),
    },
  } as never
  const resolver = {
    resolve: async (p: string) => asset(`/resolved/${p}`),
    process: async () => processed,
  } as never
  const api = new AssetTaskApi({
    resolver,
    resolverApi,
    reporter,
    targetStorage,
    dataMapUri: '/api/test.asset.map.json',
  })
  return { api, targetStorage, removeAsset, findAssetBySrcPath }
}

describe('AssetTaskApi.resolve', () => {
  it('delegates to the resolver', async () => {
    const { api } = createApi()
    expect(await api.resolve('/srv/a.txt')).toMatchObject({ uri: '/resolved//srv/a.txt' })
  })
})

describe('AssetTaskApi.create', () => {
  it('saves binary, text and json assets plus the data map', async () => {
    const processed: IAssetProcessedData[] = [
      {
        asset: asset('/a.bin'),
        datatype: AssetDataTypeEnum.BINARY,
        data: Buffer.from('b'),
        encoding: undefined,
      },
      { asset: asset('/a.txt'), datatype: AssetDataTypeEnum.TEXT, data: 'text', encoding: 'utf8' },
      {
        asset: asset('/a.json'),
        datatype: AssetDataTypeEnum.JSON,
        data: { x: 1 },
        encoding: undefined,
      },
    ] as IAssetProcessedData[]
    const { api, targetStorage } = createApi(processed)

    await api.create(['/srv/a'])

    expect((await targetStorage.resolveFile('/a.bin'))!.data).toEqual(Buffer.from('b'))
    expect((await targetStorage.resolveFile('/a.txt'))!.data).toBe('text')
    expect((await targetStorage.resolveFile('/a.json'))!.data).toEqual({ x: 1 })
    expect(await targetStorage.resolveFile('/api/test.asset.map.json')).toBeDefined()
  })

  it('skips items whose data is null but still writes the data map', async () => {
    const processed = [
      {
        asset: asset('/a.bin'),
        datatype: AssetDataTypeEnum.BINARY,
        data: null,
        encoding: undefined,
      },
    ] as unknown as IAssetProcessedData[]
    const { api, targetStorage } = createApi(processed)
    await api.create(['/srv/a'])
    expect(await targetStorage.resolveFile('/a.bin')).toBeUndefined()
    expect(await targetStorage.resolveFile('/api/test.asset.map.json')).toBeDefined()
  })

  it('throws for text assets missing an encoding', async () => {
    const processed = [
      {
        asset: asset('/a.txt'),
        datatype: AssetDataTypeEnum.TEXT,
        data: 'text',
        encoding: undefined,
      },
    ] as unknown as IAssetProcessedData[]
    await expect(createApi(processed).api.create(['/srv/a'])).rejects.toThrow(/encoding/)
  })

  it('throws for an unexpected datatype', async () => {
    const processed = [
      { asset: asset('/a'), datatype: AssetDataTypeEnum.ASSET_MAP, data: {}, encoding: undefined },
    ] as unknown as IAssetProcessedData[]
    await expect(createApi(processed).api.create(['/srv/a'])).rejects.toThrow(/Unexpected datatype/)
  })

  it('does nothing when there are no processed results', async () => {
    const { api, targetStorage } = createApi([])
    await api.create(['/srv/a'])
    expect(await targetStorage.resolveFile('/api/test.asset.map.json')).toBeUndefined()
  })
})

describe('AssetTaskApi.remove', () => {
  it('removes assets and their target files, then rewrites the data map', async () => {
    const { api, targetStorage, removeAsset } = createApi()
    await targetStorage.writeFile({
      datatype: AssetDataTypeEnum.BINARY,
      asset: asset('/from//srv/a.txt'),
      data: Buffer.from('x'),
    } as never)

    await api.remove(['/srv/a.txt'])

    expect(removeAsset).toHaveBeenCalledWith('/srv/a.txt')
    expect(await targetStorage.resolveFile('/from//srv/a.txt')).toBeUndefined()
  })

  it('does nothing for an empty path list', async () => {
    const { api, removeAsset } = createApi()
    await api.remove([])
    expect(removeAsset).not.toHaveBeenCalled()
  })
})

describe('AssetTaskApi.update', () => {
  it('removes the existing asset then re-creates it', async () => {
    const processed: IAssetProcessedData[] = [
      {
        asset: asset('/a.bin'),
        datatype: AssetDataTypeEnum.BINARY,
        data: Buffer.from('b'),
        encoding: undefined,
      },
    ] as IAssetProcessedData[]
    const { api, targetStorage, removeAsset } = createApi(processed)

    await api.update(['/srv/a.txt'])

    // remove half
    expect(removeAsset).toHaveBeenCalledWith('/srv/a.txt')
    // re-create half: the processed asset and the refreshed data map are written back
    expect((await targetStorage.resolveFile('/a.bin'))!.data).toEqual(Buffer.from('b'))
    expect(await targetStorage.resolveFile('/api/test.asset.map.json')).toBeDefined()
  })
})
