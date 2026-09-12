import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { PathResolver } from '@guanghechen/asset-storage'
import type { ITargetItem, ITargetItemWithoutData } from '@guanghechen/asset-types'
import { AssetDataTypeEnum } from '@guanghechen/asset-types'
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

const textItem = (data: string): ITargetItem =>
  ({ datatype: AssetDataTypeEnum.TEXT, data, encoding: 'utf8' }) as ITargetItem

async function expectOperationsToRejectPathEscape(
  targetStorage: FileAssetTargetDataStorage,
  uri: string,
): Promise<void> {
  await expect(targetStorage.load(uri, fileItem(AssetDataTypeEnum.TEXT, 'utf8'))).rejects.toThrow(
    /escapes rootDir/,
  )
  await expect(targetStorage.save(uri, textItem('changed'))).rejects.toThrow(/escapes rootDir/)
  await expect(targetStorage.remove(uri)).rejects.toThrow(/escapes rootDir/)
}

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
  it('resolves safe URI paths without rejecting parent-like names', () => {
    expect(storage._resolvePathFromUri('/a/b.json?v=1#x')).toBe(path.join(ROOT, 'a/b.json'))
    expect(storage._resolvePathFromUri('/a/../b.json')).toBe(path.join(ROOT, 'b.json'))
    expect(storage._resolvePathFromUri('/..foo/b.json')).toBe(path.join(ROOT, '..foo/b.json'))
  })

  it.each(['/../../outside.json', '//tmp/outside.json', 'http://example.com/outside.json'])(
    'rejects a URI path that escapes rootDir: %s',
    uri => {
      expect(() => storage._resolvePathFromUri(uri)).toThrow(/escapes rootDir/)
    },
  )

  it('removes a written file', async () => {
    await storage.save('/rm/a.bin', {
      datatype: AssetDataTypeEnum.BINARY,
      data: Buffer.from('x'),
    } as ITargetItem)
    await storage.remove('/rm/a.bin')
    expect(fs.existsSync(path.join(ROOT, 'rm/a.bin'))).toBe(false)
  })

  it('ignores missing files on remove', async () => {
    await expect(storage.remove('/missing-dir/a.bin')).resolves.toBeUndefined()
  })

  it('supports concurrent writes into a new directory', async () => {
    await Promise.all([
      storage.save('/concurrent/a.txt', textItem('a')),
      storage.save('/concurrent/b.txt', textItem('b')),
    ])
    expect(fs.readFileSync(path.join(ROOT, 'concurrent/a.txt'), 'utf8')).toBe('a')
    expect(fs.readFileSync(path.join(ROOT, 'concurrent/b.txt'), 'utf8')).toBe('b')
  })

  it('allows operations through a directory symlink that stays inside rootDir', async () => {
    const realDirpath = path.join(ROOT, 'real-dir')
    const symlinkPath = path.join(ROOT, 'internal-dir')
    fs.mkdirSync(realDirpath)
    fs.symlinkSync(realDirpath, symlinkPath, process.platform === 'win32' ? 'junction' : 'dir')

    await storage.save('/internal-dir/nested/a.txt', textItem('inside'))
    expect(
      await storage.load('/internal-dir/nested/a.txt', fileItem(AssetDataTypeEnum.TEXT, 'utf8')),
    ).toBe('inside')
    await storage.remove('/internal-dir/nested/a.txt')
    expect(fs.existsSync(path.join(realDirpath, 'nested/a.txt'))).toBe(false)
  })

  it('rejects operations through a directory symlink', async () => {
    const outsideDir = fs.mkdtempSync(path.join(os.tmpdir(), 'asset-tgt-outside-'))
    const symlinkPath = path.join(ROOT, 'linked-dir')
    const outsideFilepath = path.join(outsideDir, 'a.txt')
    fs.writeFileSync(outsideFilepath, 'outside')
    fs.symlinkSync(outsideDir, symlinkPath, process.platform === 'win32' ? 'junction' : 'dir')

    try {
      await expectOperationsToRejectPathEscape(storage, '/linked-dir/a.txt')
      expect(fs.readFileSync(outsideFilepath, 'utf8')).toBe('outside')
    } finally {
      fs.rmSync(symlinkPath, { recursive: true, force: true })
      fs.rmSync(outsideDir, { recursive: true, force: true })
    }
  })

  it.runIf(process.platform !== 'win32')(
    'does not create through a dangling directory symlink outside rootDir',
    async () => {
      const outsideDir = fs.mkdtempSync(path.join(os.tmpdir(), 'asset-tgt-outside-'))
      const outsideTargetDirpath = path.join(outsideDir, 'missing-target')
      const symlinkPath = path.join(ROOT, 'dangling-dir')
      fs.symlinkSync(outsideTargetDirpath, symlinkPath, 'dir')

      try {
        await expect(
          storage.save('/dangling-dir/nested/a.txt', textItem('escaped')),
        ).rejects.toThrow()
        expect(fs.existsSync(outsideTargetDirpath)).toBe(false)
      } finally {
        fs.rmSync(symlinkPath, { force: true })
        fs.rmSync(outsideDir, { recursive: true, force: true })
      }
    },
  )

  it.runIf(process.platform !== 'win32')(
    'keeps saving in the canonical directory when its symlink alias is retargeted',
    async () => {
      const realDirpath = path.join(ROOT, 'retarget-save-real')
      const outsideDir = fs.mkdtempSync(path.join(os.tmpdir(), 'asset-tgt-outside-'))
      const symlinkPath = path.join(ROOT, 'retarget-save-link')
      fs.mkdirSync(realDirpath)
      fs.symlinkSync(realDirpath, symlinkPath, 'dir')

      class RetargetingStorage extends FileAssetTargetDataStorage {
        protected override async _resolveSafeSavePath(uri: string): Promise<string> {
          const filepath = await super._resolveSafeSavePath(uri)
          fs.unlinkSync(symlinkPath)
          fs.symlinkSync(outsideDir, symlinkPath, 'dir')
          return filepath
        }
      }

      try {
        const retargetingStorage = new RetargetingStorage({
          rootDir: ROOT,
          pathResolver: new PathResolver(),
        })
        await retargetingStorage.save('/retarget-save-link/a.txt', textItem('inside'))

        expect(fs.readFileSync(path.join(realDirpath, 'a.txt'), 'utf8')).toBe('inside')
        expect(fs.existsSync(path.join(outsideDir, 'a.txt'))).toBe(false)
      } finally {
        fs.rmSync(symlinkPath, { recursive: true, force: true })
        fs.rmSync(outsideDir, { recursive: true, force: true })
      }
    },
  )

  it.runIf(process.platform !== 'win32')(
    'removes from the canonical directory when its symlink alias is retargeted',
    async () => {
      const realDirpath = path.join(ROOT, 'retarget-remove-real')
      const outsideDir = fs.mkdtempSync(path.join(os.tmpdir(), 'asset-tgt-outside-'))
      const symlinkPath = path.join(ROOT, 'retarget-remove-link')
      fs.mkdirSync(realDirpath)
      fs.writeFileSync(path.join(realDirpath, 'a.txt'), 'inside')
      fs.writeFileSync(path.join(outsideDir, 'a.txt'), 'outside')
      fs.symlinkSync(realDirpath, symlinkPath, 'dir')

      class RetargetingStorage extends FileAssetTargetDataStorage {
        protected override async _resolveSafeRemovePath(uri: string): Promise<string> {
          const filepath = await super._resolveSafeRemovePath(uri)
          fs.unlinkSync(symlinkPath)
          fs.symlinkSync(outsideDir, symlinkPath, 'dir')
          return filepath
        }
      }

      try {
        const retargetingStorage = new RetargetingStorage({
          rootDir: ROOT,
          pathResolver: new PathResolver(),
        })
        await retargetingStorage.remove('/retarget-remove-link/a.txt')

        expect(fs.existsSync(path.join(realDirpath, 'a.txt'))).toBe(false)
        expect(fs.readFileSync(path.join(outsideDir, 'a.txt'), 'utf8')).toBe('outside')
      } finally {
        fs.rmSync(symlinkPath, { recursive: true, force: true })
        fs.rmSync(outsideDir, { recursive: true, force: true })
      }
    },
  )

  it.runIf(process.platform !== 'win32')(
    'allows saving through a file symlink that stays inside rootDir',
    async () => {
      const realFilepath = path.join(ROOT, 'real-file.txt')
      const symlinkPath = path.join(ROOT, 'internal-file.txt')
      fs.writeFileSync(realFilepath, 'inside')
      fs.symlinkSync(realFilepath, symlinkPath, 'file')

      await storage.save('/internal-file.txt', textItem('changed'))
      expect(fs.readFileSync(realFilepath, 'utf8')).toBe('changed')
    },
  )

  it.runIf(process.platform !== 'win32')(
    'rejects access through an external file symlink',
    async () => {
      const outsideDir = fs.mkdtempSync(path.join(os.tmpdir(), 'asset-tgt-outside-'))
      const symlinkPath = path.join(ROOT, 'linked-file.txt')
      const outsideFilepath = path.join(outsideDir, 'a.txt')
      fs.writeFileSync(outsideFilepath, 'outside')
      fs.symlinkSync(outsideFilepath, symlinkPath, 'file')

      try {
        await expect(
          storage.load('/linked-file.txt', fileItem(AssetDataTypeEnum.TEXT, 'utf8')),
        ).rejects.toThrow(/escapes rootDir/)
        await expect(storage.save('/linked-file.txt', textItem('changed'))).rejects.toThrow(
          /escapes rootDir/,
        )
        await storage.remove('/linked-file.txt')
        expect(fs.existsSync(symlinkPath)).toBe(false)
        expect(fs.readFileSync(outsideFilepath, 'utf8')).toBe('outside')
      } finally {
        fs.rmSync(symlinkPath, { force: true })
        fs.rmSync(outsideDir, { recursive: true, force: true })
      }
    },
  )

  it.runIf(process.platform !== 'win32')('pins the initial rootDir symlink target', async () => {
    const realRootDir = path.join(ROOT, 'root-real')
    const otherRootDir = path.join(ROOT, 'root-other')
    const symlinkRootDir = path.join(ROOT, 'root-link')
    fs.mkdirSync(realRootDir)
    fs.mkdirSync(otherRootDir)
    fs.symlinkSync(realRootDir, symlinkRootDir, 'dir')
    const symlinkStorage = new FileAssetTargetDataStorage({
      rootDir: symlinkRootDir,
      pathResolver: new PathResolver(),
    })

    await symlinkStorage.save('/a.txt', textItem('inside'))
    fs.unlinkSync(symlinkRootDir)
    fs.symlinkSync(otherRootDir, symlinkRootDir, 'dir')
    await symlinkStorage.save('/b.txt', textItem('pinned'))

    expect(fs.readFileSync(path.join(realRootDir, 'b.txt'), 'utf8')).toBe('pinned')
    expect(fs.existsSync(path.join(otherRootDir, 'b.txt'))).toBe(false)
  })

  it('throws on an unknown datatype for both save and load', async () => {
    const bad = { datatype: 'weird', data: null } as unknown as ITargetItem
    await expect(storage.save('/bad', bad)).rejects.toThrow(TypeError)
    await expect(
      storage.load('/bad', { datatype: 'weird' } as unknown as ITargetItemWithoutData),
    ).rejects.toThrow(TypeError)
  })
})
