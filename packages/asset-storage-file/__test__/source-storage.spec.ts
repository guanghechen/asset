import { AssetPathResolver } from '@guanghechen/asset-storage'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { FileAssetSourceStorage } from '../src'

let ROOT: string
let storage: FileAssetSourceStorage

beforeAll(() => {
  ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'asset-src-'))
  const pathResolver = new AssetPathResolver({ caseSensitive: true, srcRoots: [ROOT] })
  storage = new FileAssetSourceStorage({ pathResolver })
})

afterAll(() => {
  fs.rmSync(ROOT, { recursive: true, force: true })
})

const src = (name: string): string => path.join(ROOT, name)

async function delay(timeoutMs: number): Promise<void> {
  await new Promise<void>(resolve => setTimeout(resolve, timeoutMs))
}

async function waitFor(predicate: () => boolean, timeoutMs = 5000): Promise<void> {
  const deadline: number = Date.now() + timeoutMs
  while (!predicate()) {
    if (Date.now() >= deadline) throw new Error('Timed out while waiting for a file watcher event')
    await delay(25)
  }
}

describe('FileAssetSourceStorage', () => {
  it('writes, reads, stats and detects a real file', async () => {
    const p = src('a.txt')
    await storage.updateFile(p, Buffer.from('hello'))

    expect(await storage.existFile(p)).toBe(true)
    expect(await storage.readFile(p)).toEqual(Buffer.from('hello'))
    await expect(storage.assertExistedFile(p)).resolves.toBeUndefined()
    expect((await storage.statFile(p)).isFile()).toBe(true)
  })

  it('reports missing or out-of-tree files as non-existent', async () => {
    // missing but in-tree -> existsSync short-circuit
    expect(await storage.existFile(src('missing.txt'))).toBe(false)

    // exists on disk but outside every srcRoot -> isolates the findSrcRoot()===null branch
    // (existsSync would be true here, so only the out-of-tree guard can make this false).
    const outsideDir = fs.mkdtempSync(path.join(os.tmpdir(), 'asset-out-'))
    const outside = path.join(outsideDir, 'real.txt')
    fs.writeFileSync(outside, 'real')
    try {
      expect(await storage.existFile(outside)).toBe(false)
    } finally {
      fs.rmSync(outsideDir, { recursive: true, force: true })
    }
  })

  it('throws from assertExistedFile when the file is absent', async () => {
    await expect(storage.assertExistedFile(src('missing.txt'))).rejects.toThrow()
  })

  it('throws from assertExistedFile when the path is a directory', async () => {
    const dir = src('subdir')
    fs.mkdirSync(dir, { recursive: true })
    await expect(storage.assertExistedFile(dir)).rejects.toThrow(/Not a file/)
  })

  it('removes a file', async () => {
    const p = src('removable.txt')
    await storage.updateFile(p, Buffer.from('x'))
    await storage.removeFile(p)
    expect(await storage.existFile(p)).toBe(false)
  })

  it('collects recursively by normalized absolute path patterns', async () => {
    await storage.updateFile(src('c1.md'), Buffer.from('1'))
    await storage.updateFile(src('c2.md'), Buffer.from('2'))
    const nestedDir = src('collect-nested')
    fs.mkdirSync(nestedDir)
    await storage.updateFile(path.join(nestedDir, '.hidden.md'), Buffer.from('3'))

    const collected = await storage.collect([/\/(?:c1|c2|\.hidden)\.md$/u], { cwd: ROOT })

    expect(collected.map(p => path.basename(p)).sort()).toEqual(['.hidden.md', 'c1.md', 'c2.md'])
  })

  it('decodes content through a custom decipher', async () => {
    const pathResolver = new AssetPathResolver({ caseSensitive: true, srcRoots: [ROOT] })
    const deciphered = new FileAssetSourceStorage({
      pathResolver,
      decipher: { decode: async data => Buffer.concat([Buffer.from('['), data, Buffer.from(']')]) },
    })
    const p = src('enc.txt')
    await storage.updateFile(p, Buffer.from('x'))
    expect(await deciphered.readFile(p)).toEqual(Buffer.from('[x]'))
  })

  it('watches the directory and filters add/change/remove events by path pattern', async () => {
    const added: string[] = []
    const changed: string[] = []
    const removed: string[] = []
    const watcher = storage.watch([/\/watch-event-[^/]*\.txt$/gu], {
      cwd: ROOT,
      onAdd: filepath => added.push(filepath),
      onChange: filepath => changed.push(filepath),
      onRemove: filepath => removed.push(filepath),
    })

    const nestedDir = src('watch-event-dir')
    const matchingPath = path.join(nestedDir, 'watch-event-a.txt')
    const nonMatchingPath = path.join(nestedDir, 'watch-event-a.md')

    try {
      await delay(500)
      fs.mkdirSync(nestedDir, { recursive: true })
      fs.writeFileSync(matchingPath, 'v1')
      fs.writeFileSync(nonMatchingPath, 'ignored')
      await waitFor(() => added.length === 1)
      expect(added).toEqual([matchingPath])

      fs.writeFileSync(matchingPath, 'v2')
      await waitFor(() => changed.length === 1)
      expect(changed).toEqual([matchingPath])

      fs.unlinkSync(matchingPath)
      await waitFor(() => removed.length === 1)
      expect(removed).toEqual([matchingPath])
    } finally {
      await watcher.unwatch()
    }
  })

  it('emits matching initial paths and ignores rejected and post-unwatch paths', async () => {
    const initialPath = src('watch-filter-initial.txt')
    const acceptedPath = src('watch-filter-accepted.txt')
    const rejectedPath = src('watch-filter-rejected.txt')
    const stoppedPath = src('watch-filter-stopped.txt')
    fs.writeFileSync(initialPath, 'initial')

    const added: string[] = []
    const watcher = storage.watch([/\/watch-filter-[^/]*\.txt$/u], {
      cwd: ROOT,
      onAdd: filepath => added.push(filepath),
      shouldIgnore: filepath => filepath === rejectedPath,
    })

    try {
      await waitFor(() => added.length === 1)
      expect(added).toEqual([initialPath])

      fs.writeFileSync(acceptedPath, 'accepted')
      fs.writeFileSync(rejectedPath, 'rejected')
      await waitFor(() => added.length === 2)
      await delay(100)
      expect(added).toEqual([initialPath, acceptedPath])

      await watcher.unwatch()
      fs.writeFileSync(stoppedPath, 'stopped')
      await delay(100)
      expect(added).toEqual([initialPath, acceptedPath])
    } finally {
      await watcher.unwatch()
    }
  })

  it('returns a no-op watcher when no path patterns are provided', async () => {
    const added: string[] = []
    const watcher = storage.watch([], {
      cwd: ROOT,
      onAdd: filepath => added.push(filepath),
    })

    fs.writeFileSync(src('watch-empty.txt'), 'ignored')
    await delay(100)
    expect(added).toEqual([])
    await watcher.unwatch()
    await watcher.unwatch()
  })
})
