import { PathResolver } from '@guanghechen/asset-storage'
import { AssetDataTypeEnum } from '@guanghechen/asset-types'
import type { ITargetItem, ITargetItemWithoutData } from '@guanghechen/asset-types'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { FileAssetTargetDataStorage } from '../src'

let ROOT: string
let storage: FileAssetTargetDataStorage

beforeAll(() => {
  ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'asset-tgt-'))
  storage = new FileAssetTargetDataStorage({ rootDir: ROOT, pathResolver: new PathResolver() })
})

afterAll(() => {
  fs.rmSync(ROOT, { recursive: true, force: true })
})

const fileItem = (datatype: AssetDataTypeEnum, encoding?: BufferEncoding): ITargetItemWithoutData =>
  ({ datatype, encoding }) as ITargetItemWithoutData

describe('FileAssetTargetDataStorage round-trips by datatype', () => {
  it('binary', async () => {
    await storage.save('/bin/a.bin', {
      datatype: AssetDataTypeEnum.BINARY,
      data: Buffer.from('binary-data'),
    } as ITargetItem)
    expect(await storage.load('/bin/a.bin', fileItem(AssetDataTypeEnum.BINARY))).toEqual(
      Buffer.from('binary-data'),
    )
  })

  it('text (honours encoding)', async () => {
    // 'é' encodes to 1 byte in latin1 but 2 bytes in utf8; asserting the raw bytes proves the
    // encoding is actually applied on save (not silently defaulted to utf8).
    await storage.save('/txt/a.txt', {
      datatype: AssetDataTypeEnum.TEXT,
      data: 'café',
      encoding: 'latin1',
    } as ITargetItem)
    const raw = fs.readFileSync(path.join(ROOT, 'txt/a.txt'))
    expect(raw).toEqual(Buffer.from('café', 'latin1'))
    expect(raw.length).toBe(4)
    expect(await storage.load('/txt/a.txt', fileItem(AssetDataTypeEnum.TEXT, 'latin1'))).toBe(
      'café',
    )
  })

  it('json (prettified)', async () => {
    await storage.save('/json/a.json', {
      datatype: AssetDataTypeEnum.JSON,
      data: { a: 1 },
    } as ITargetItem)
    expect(await storage.load('/json/a.json', fileItem(AssetDataTypeEnum.JSON))).toEqual({ a: 1 })
  })

  it('asset-map (compact when prettier is off)', async () => {
    const compact = new FileAssetTargetDataStorage({
      rootDir: ROOT,
      pathResolver: new PathResolver(),
      prettier: false,
    })
    await compact.save('/map/a.json', {
      datatype: AssetDataTypeEnum.ASSET_MAP,
      data: { assets: [] },
    } as ITargetItem)
    const raw = fs.readFileSync(path.join(ROOT, 'map/a.json'), 'utf8')
    expect(raw).toBe('{"assets":[]}')
    expect(await compact.load('/map/a.json', fileItem(AssetDataTypeEnum.ASSET_MAP))).toEqual({
      assets: [],
    })
  })
})

describe('FileAssetTargetDataStorage edge cases', () => {
  it('strips leading slash and query/hash when resolving a path', () => {
    expect(storage._resolvePathFromUri('/a/b.json?v=1#x')).toBe(path.join(ROOT, 'a/b.json'))
  })

  it('removes a written file', async () => {
    await storage.save('/rm/a.bin', {
      datatype: AssetDataTypeEnum.BINARY,
      data: Buffer.from('x'),
    } as ITargetItem)
    await storage.remove('/rm/a.bin')
    expect(fs.existsSync(path.join(ROOT, 'rm/a.bin'))).toBe(false)
  })

  it('throws on an unknown datatype for both save and load', async () => {
    const bad = { datatype: 'weird', data: null } as unknown as ITargetItem
    await expect(storage.save('/bad', bad)).rejects.toThrow(TypeError)
    await expect(
      storage.load('/bad', { datatype: 'weird' } as unknown as ITargetItemWithoutData),
    ).rejects.toThrow(TypeError)
  })
})
