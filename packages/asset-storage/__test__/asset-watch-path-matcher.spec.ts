import { describe, expect, it } from 'vitest'
import { createAssetWatchPathMatcher } from '../src'

describe('createAssetWatchPathMatcher', () => {
  it('matches any pattern against normalized absolute paths', () => {
    const isMatched = createAssetWatchPathMatcher([/\/src\/[^/]+\.md$/u, /\/image\.png$/u])

    expect(isMatched('C:\\project\\src\\post.md')).toBe(true)
    expect(isMatched('/project/image.png')).toBe(true)
    expect(isMatched('/project/src/post.txt')).toBe(false)
  })

  it('ignores stateful regexp flags', () => {
    const globalPattern = /\.txt$/gu
    globalPattern.lastIndex = 3
    const stickyPattern = /.*\.md$/uy
    stickyPattern.lastIndex = 4
    const isMatched = createAssetWatchPathMatcher([globalPattern, stickyPattern])

    expect(isMatched('/project/a.txt')).toBe(true)
    expect(isMatched('/project/a.txt')).toBe(true)
    expect(isMatched('/project/a.md')).toBe(true)
    expect(globalPattern.lastIndex).toBe(3)
    expect(stickyPattern.lastIndex).toBe(4)
  })

  it('never matches when no patterns are provided', () => {
    expect(createAssetWatchPathMatcher([])('/project/a.txt')).toBe(false)
  })

  it('rejects non-regexp patterns at the runtime boundary', () => {
    expect(() => createAssetWatchPathMatcher(['*.txt' as unknown as RegExp])).toThrow(TypeError)
  })
})
