import { MemoAssetTargetDataStore } from '@guanghechen/asset-storage-memo'
import { AssetDataTypeEnum } from '@guanghechen/asset-types'
import type { IAsset, ITargetItem } from '@guanghechen/asset-types'
import { describe, expect, it, vi } from 'vitest'
import { AssetTargetStorage } from '../src'

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

const binaryItem = (uri: string, data: Buffer): ITargetItem =>
  ({
    datatype: AssetDataTypeEnum.BINARY,
    asset: asset(uri),
    data,
    encoding: undefined,
  }) as ITargetItem

const assetMapItem = (uri: string, data: unknown): ITargetItem =>
  ({ datatype: AssetDataTypeEnum.ASSET_MAP, uri, data }) as unknown as ITargetItem

function createStorage(): AssetTargetStorage {
  return new AssetTargetStorage(new MemoAssetTargetDataStore())
}

describe('AssetTargetStorage.writeFile / resolveFile', () => {
  it('persists and resolves a binary item', async () => {
    const storage = createStorage()
    await storage.writeFile(binaryItem('/a.bin', Buffer.from('payload')))

    const resolved = await storage.resolveFile('/a.bin')
    expect(resolved!.datatype).toBe(AssetDataTypeEnum.BINARY)
    expect(resolved!.data).toEqual(Buffer.from('payload'))
  })

  it('persists and resolves an asset-map item', async () => {
    const storage = createStorage()
    await storage.writeFile(assetMapItem('/map.json', { assets: [] }))
    const resolved = await storage.resolveFile('/map.json')
    expect(resolved!.data).toEqual({ assets: [] })
  })

  it('returns undefined when resolving an unknown uri', async () => {
    expect(await createStorage().resolveFile('/missing')).toBeUndefined()
  })

  it('rejects a datatype change for an existing uri', async () => {
    const storage = createStorage()
    await storage.writeFile(binaryItem('/a.bin', Buffer.from('x')))
    await expect(storage.writeFile(assetMapItem('/a.bin', {}))).rejects.toThrow()
  })

  it('throws on an unknown datatype', async () => {
    const storage = createStorage()
    const bad = { datatype: 'weird', asset: asset('/a'), data: null } as unknown as ITargetItem
    await expect(storage.writeFile(bad)).rejects.toThrow(TypeError)
  })
})

describe('AssetTargetStorage.resolveUriFromTargetItem', () => {
  it('reads uri from the asset for file items and from the item for asset maps', () => {
    const storage = createStorage()
    expect(storage.resolveUriFromTargetItem(binaryItem('/a.bin', Buffer.from('x')))).toBe('/a.bin')
    expect(storage.resolveUriFromTargetItem(assetMapItem('/map.json', {}))).toBe('/map.json')
  })
})

describe('AssetTargetStorage monitor / removeFile', () => {
  it('notifies subscribers on write and remove, then stops after unsubscribe', async () => {
    const storage = createStorage()
    const onFileWritten = vi.fn()
    const onFileRemoved = vi.fn()
    const sub = storage.monitor({ onFileWritten, onFileRemoved })

    await storage.writeFile(binaryItem('/a.bin', Buffer.from('x')))
    expect(onFileWritten).toHaveBeenCalledTimes(1)

    await storage.removeFile('/a.bin')
    expect(onFileRemoved).toHaveBeenCalledTimes(1)
    expect(await storage.resolveFile('/a.bin')).toBeUndefined()

    sub.unsubscribe()
    await storage.writeFile(binaryItem('/b.bin', Buffer.from('y')))
    expect(onFileWritten).toHaveBeenCalledTimes(1)
  })

  it('removes an unknown uri straight from the data storage without notifying', async () => {
    const storage = createStorage()
    const onFileRemoved = vi.fn()
    storage.monitor({ onFileRemoved })
    await storage.removeFile('/never-written')
    expect(onFileRemoved).not.toHaveBeenCalled()
  })
})

describe('AssetTargetStorage.destroy', () => {
  it('marks the storage destroyed and disables further monitoring', async () => {
    const storage = createStorage()
    expect(storage.destroyed).toBe(false)
    await storage.destroy()
    await storage.destroy() // idempotent
    expect(storage.destroyed).toBe(true)

    const onFileWritten = vi.fn()
    storage.monitor({ onFileWritten })
    await storage.writeFile(binaryItem('/a.bin', Buffer.from('x')))
    expect(onFileWritten).not.toHaveBeenCalled()
  })
})
