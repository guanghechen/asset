import { describe, expect, it } from 'vitest'
import { calcFingerprint, normalizePattern, normalizeUrlPath } from '../src'

describe('calcFingerprint', () => {
  it('returns empty string for undefined', () => {
    expect(calcFingerprint(undefined)).toBe('')
  })

  it('is deterministic and content-dependent', () => {
    expect(calcFingerprint('abc')).toBe(calcFingerprint('abc'))
    expect(calcFingerprint('abc')).not.toBe(calcFingerprint('abd'))
  })
})

describe('normalizeUrlPath', () => {
  it('keeps already-normalized paths intact', () => {
    expect(normalizeUrlPath('a/b/c')).toBe('a/b/c')
    expect(normalizeUrlPath('/a/b/c')).toBe('/a/b/c')
    expect(normalizeUrlPath('/a/b')).toBe('/a/b')
  })

  it('normalizes separators: backslashes, duplicates, surrounding spaces, trailing slash', () => {
    expect(normalizeUrlPath('\\a\\b')).toBe('a/b')
    expect(normalizeUrlPath('a//b\\c')).toBe('a/b/c')
    expect(normalizeUrlPath('/a//b///c')).toBe('/a/b/c')
    expect(normalizeUrlPath('  a / b  ')).toBe('a/b')
    expect(normalizeUrlPath('a/b/')).toBe('a/b')
  })

  it('drops "." segments', () => {
    expect(normalizeUrlPath('/a/b/../c/./d')).toBe('/a/c/d')
    expect(normalizeUrlPath('./a')).toBe('a')
    expect(normalizeUrlPath('a/./b')).toBe('a/b')
  })

  it('pops one real segment per ".."', () => {
    expect(normalizeUrlPath('a/../b')).toBe('b')
    expect(normalizeUrlPath('foo/bar/..')).toBe('foo')
    expect(normalizeUrlPath('/a/../b')).toBe('/b')
  })

  it('keeps leading ".." that cannot be popped', () => {
    expect(normalizeUrlPath('../a')).toBe('../a')
    expect(normalizeUrlPath('../../a')).toBe('../../a')
    expect(normalizeUrlPath('../../../a')).toBe('../../../a')
    expect(normalizeUrlPath('a/../../b')).toBe('../b')
  })

  it('treats dotfiles (".hidden", "..foo") as ordinary segments', () => {
    expect(normalizeUrlPath('.hidden')).toBe('.hidden')
    expect(normalizeUrlPath('..foo')).toBe('..foo')
  })

  it('collapses degenerate inputs', () => {
    expect(normalizeUrlPath('')).toBe('')
    expect(normalizeUrlPath('/')).toBe('/')
    expect(normalizeUrlPath('.')).toBe('')
    expect(normalizeUrlPath('..')).toBe('..')
    expect(normalizeUrlPath('a/..')).toBe('')
  })

  // Current contract: absolute paths are NOT clamped at the root — a leading ".." that
  // escapes the root is preserved rather than dropped (differs from path.posix.normalize).
  it('does not clamp ".." that escapes an absolute root', () => {
    expect(normalizeUrlPath('/../a')).toBe('/../a')
    expect(normalizeUrlPath('/a/../../b')).toBe('/../b')
  })
})

describe('normalizePattern', () => {
  it('returns null for nullish', () => {
    expect(normalizePattern(null)).toBeNull()
  })

  it('wraps regexp and array-of-regexp', () => {
    expect(normalizePattern(/x/)!('x')).toBe(true)
    expect(normalizePattern([/a/, /b/])!('ab')).toBe(true)
    expect(normalizePattern([/a/, /b/])!('a')).toBe(false)
  })

  it('throws on a bad array', () => {
    expect(() => normalizePattern(['nope' as unknown as RegExp])).toThrow()
  })
})
