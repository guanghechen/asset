import { AssetPathResolver } from '@guanghechen/asset-storage'
import path from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { MemoAssetSourceDataStorage, MemoAssetSourceStorage } from '../src'

const ROOT = path.resolve('/srv/project')

function createStorage(): MemoAssetSourceStorage {
  const pathResolver = new AssetPathResolver({ caseSensitive: true, srcRoots: [ROOT] })
  const dataStore = new MemoAssetSourceDataStorage({ pathResolver })
  return new MemoAssetSourceStorage({ dataStore, pathResolver })
}

const src = (name: string): string => path.join(ROOT, name)

describe('MemoAssetSourceStorage CRUD', () => {
  it('creates, reads, stats and detects an in-memory file', async () => {
    const storage = createStorage()
    const p = src('a.txt')
    await storage.updateFile(p, Buffer.from('hello'))

    expect(await storage.existFile(p)).toBe(true)
    expect(await storage.readFile(p)).toEqual(Buffer.from('hello'))
    await expect(storage.assertExistedFile(p)).resolves.toBeUndefined()

    const stat = await storage.statFile(p)
    expect(stat.birthtime).toBeInstanceOf(Date)
    expect(stat.mtime).toBeInstanceOf(Date)
  })

  it('updates an existing file, preserving its birthtime', async () => {
    const storage = createStorage()
    const p = src('a.txt')
    await storage.updateFile(p, Buffer.from('v1'))
    const { birthtime } = await storage.statFile(p)
    await storage.updateFile(p, Buffer.from('v2'))

    expect(await storage.readFile(p)).toEqual(Buffer.from('v2'))
    expect((await storage.statFile(p)).birthtime).toEqual(birthtime)
  })

  it('removes a file', async () => {
    const storage = createStorage()
    const p = src('a.txt')
    await storage.updateFile(p, Buffer.from('x'))
    await storage.removeFile(p)
    expect(await storage.existFile(p)).toBe(false)
  })
})

describe('MemoAssetSourceStorage error / miss paths', () => {
  it('reports a missing file as non-existent', async () => {
    expect(await createStorage().existFile(src('missing.txt'))).toBe(false)
  })

  it('returns false for paths outside any src root', async () => {
    expect(await createStorage().existFile(path.resolve('/elsewhere/x.txt'))).toBe(false)
  })

  it('throws from assertExistedFile / readFile / removeFile for unknown files', async () => {
    const storage = createStorage()
    await expect(storage.assertExistedFile(src('missing.txt'))).rejects.toThrow()
    await expect(storage.readFile(src('missing.txt'))).rejects.toThrow()
    await expect(storage.removeFile(src('missing.txt'))).rejects.toThrow()
  })
})

describe('MemoAssetSourceStorage.collect', () => {
  it('returns matching paths under the cwd', async () => {
    const storage = createStorage()
    await storage.updateFile(src('a.txt'), Buffer.from('a'))
    await storage.updateFile(src('b.md'), Buffer.from('b'))

    const collected = await storage.collect(['**/*.txt'], { cwd: ROOT })
    expect(collected).toEqual([src('a.txt')])
  })
})

describe('MemoAssetSourceStorage.watch', () => {
  it('invokes add/change/remove callbacks for matching paths until unwatched', async () => {
    const storage = createStorage()
    const onAdd = vi.fn()
    const onChange = vi.fn()
    const onRemove = vi.fn()
    const watcher = storage.watch([path.join(ROOT, '**/*.txt')], {
      cwd: ROOT,
      onAdd,
      onChange,
      onRemove,
    })

    const p = src('a.txt')
    await storage.updateFile(p, Buffer.from('v1')) // add
    await storage.updateFile(p, Buffer.from('v2')) // change
    await storage.removeFile(p) // remove

    expect(onAdd).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onRemove).toHaveBeenCalledTimes(1)

    await watcher.unwatch()
    await storage.updateFile(src('b.txt'), Buffer.from('w'))
    expect(onAdd).toHaveBeenCalledTimes(1)
  })

  it('ignores paths rejected by shouldIgnore', async () => {
    const storage = createStorage()
    const onAdd = vi.fn()
    storage.watch([path.join(ROOT, '**/*.txt')], {
      cwd: ROOT,
      onAdd,
      shouldIgnore: absPath => absPath.endsWith('skip.txt'),
    })
    await storage.updateFile(src('skip.txt'), Buffer.from('x'))
    expect(onAdd).not.toHaveBeenCalled()
  })
})
