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

  it('collects files by glob pattern', async () => {
    await storage.updateFile(src('c1.md'), Buffer.from('1'))
    await storage.updateFile(src('c2.md'), Buffer.from('2'))
    const collected = await storage.collect(['*.md'], { cwd: ROOT })
    expect(collected.map(p => path.basename(p)).sort()).toEqual(['c1.md', 'c2.md'])
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
})
