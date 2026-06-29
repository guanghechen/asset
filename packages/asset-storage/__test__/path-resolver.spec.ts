import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { PathResolver } from '../src'

describe('PathResolver', () => {
  const r = new PathResolver()
  const base = path.resolve('/srv/project')

  it('treats in-tree paths as relative', () => {
    expect(r.isRelativePath(base, 'src/a.md')).toBe(true)
    expect(r.isRelativePath(base, 'src/../a.md')).toBe(true)
  })

  it('rejects traversal that escapes the base dir', () => {
    expect(r.isRelativePath(base, '../../etc/passwd')).toBe(false)
  })

  it('does not confuse a sibling prefix dir with being inside', () => {
    expect(r.isRelativePath(path.resolve('/srv/proj'), path.resolve('/srv/project/x'))).toBe(false)
  })

  it('resolves absolute paths idempotently', () => {
    const abs = path.resolve('/srv/project/a.md')
    expect(r.absolute(base, abs)).toBe(abs)
    expect(r.absolute(base, 'a.md')).toBe(abs)
  })

  it('classifies absolute paths and urls', () => {
    expect(r.isAbsolutePath('http://example.com/x')).toBe(true)
    expect(r.isAbsolutePath('relative/x')).toBe(false)
  })

  it('parseFromUrl strips hash and decodes, rejects absolute', () => {
    expect(r.parseFromUrl('a%20b.md#frag')).toBe('a b.md')
    expect(r.parseFromUrl('/abs.md')).toBeNull()
  })
})
