import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { AssetPathResolver } from '../src'

const ROOT = path.resolve('/srv/project')

function createResolver(srcRoots: string[] = [ROOT], caseSensitive = true): AssetPathResolver {
  return new AssetPathResolver({ caseSensitive, srcRoots })
}

describe('AssetPathResolver srcRoots validation', () => {
  it('exposes a normalized, defensive copy of srcRoots', () => {
    const resolver = createResolver()
    const roots = resolver.srcRoots
    roots.push('/mutated')
    expect(resolver.srcRoots).toEqual([ROOT])
    expect(resolver.caseSensitive).toBe(true)
  })

  it('rejects non-absolute srcRoots', () => {
    expect(() => createResolver(['relative/dir'])).toThrow(/not an absolute filepath/)
  })

  it('rejects overlapping srcRoots', () => {
    expect(() => createResolver([ROOT, path.join(ROOT, 'sub')])).toThrow(/overlapped/)
  })
})

describe('AssetPathResolver.findSrcRoot / isSafeAbsolutePath', () => {
  const resolver = createResolver()

  it('finds the owning src root for an in-tree path', () => {
    expect(resolver.findSrcRoot(path.join(ROOT, 'a/b.md'))).toBe(ROOT)
    expect(resolver.isSafeAbsolutePath(path.join(ROOT, 'a/b.md'))).toBe(true)
  })

  it('returns null / false for out-of-tree paths', () => {
    expect(resolver.findSrcRoot(path.resolve('/elsewhere/x'))).toBeNull()
    expect(resolver.isSafeAbsolutePath(path.resolve('/elsewhere/x'))).toBe(false)
    expect(resolver.isSafeAbsolutePath('relative/x')).toBe(false)
  })

  it('asserts a srcRoot, throwing for unsafe paths', () => {
    expect(resolver.assertSafeAbsolutePath(path.join(ROOT, 'a.md'))).toBe(ROOT)
    expect(() => resolver.assertSafeAbsolutePath(path.resolve('/elsewhere/x'))).toThrow(/srcRoot/)
  })
})

describe('AssetPathResolver.identify', () => {
  it('produces a stable, root-anchored identifier', () => {
    const resolver = createResolver()
    const id = resolver.identify(path.join(ROOT, 'a/b.md'))
    // Pin the full transformed output (separator normalization + forced trailing slash),
    // not just the trivially-true leading/trailing slash.
    expect(id).toBe(`${path.join(ROOT, 'a/b.md')}/`)
  })

  it('lowercases the identifier only when not case sensitive', () => {
    const sensitive = createResolver([ROOT], true)
    const insensitive = createResolver([ROOT], false)
    const p = path.join(ROOT, 'A/B.MD')

    // Case-insensitive output is the lowercased case-sensitive output...
    expect(insensitive.identify(p)).toBe(sensitive.identify(p).toLowerCase())
    // ...and they genuinely differ because the path carries uppercase letters.
    expect(sensitive.identify(p)).not.toBe(insensitive.identify(p))
  })
})
