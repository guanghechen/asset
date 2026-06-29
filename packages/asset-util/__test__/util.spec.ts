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
  it('collapses . and .. segments', () => {
    expect(normalizeUrlPath('/a/b/../c/./d')).toBe('/a/c/d')
  })

  it('preserves relative vs absolute prefix', () => {
    expect(normalizeUrlPath('a//b\\c')).toBe('a/b/c')
    expect(normalizeUrlPath('/a/b')).toBe('/a/b')
  })

  it('keeps leading .. that cannot be popped', () => {
    expect(normalizeUrlPath('../a')).toBe('../a')
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
