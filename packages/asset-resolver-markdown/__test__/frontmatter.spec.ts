import { YozoraParser } from '@yozora/parser'
import { describe, expect, it } from 'vitest'
import { AssetResolverMarkdown } from '../src'

function createResolver(): {
  _parseFrontmatter(raw: string): { match: string[]; frontmatter: Record<string, any> }
} {
  const resolver = new AssetResolverMarkdown({ parser: new YozoraParser() })
  return resolver as unknown as {
    _parseFrontmatter(raw: string): { match: string[]; frontmatter: Record<string, any> }
  }
}

describe('AssetResolverMarkdown._parseFrontmatter', () => {
  it('parses a well-formed object frontmatter', () => {
    const raw = '---\ntitle: Hello\ntags:\n  - a\n  - b\n---\nbody'
    const { frontmatter } = createResolver()._parseFrontmatter(raw)
    expect(frontmatter).toEqual({ title: 'Hello', tags: ['a', 'b'] })
  })

  it('returns empty object when there is no frontmatter', () => {
    const { match, frontmatter } = createResolver()._parseFrontmatter('# just body')
    expect(frontmatter).toEqual({})
    expect(match[0]).toBe('')
  })

  it('isolates malformed YAML into an empty object instead of throwing', () => {
    const raw = '---\ntitle: [unterminated\n  : : :\n---\n'
    expect(() => createResolver()._parseFrontmatter(raw)).not.toThrow()
    expect(createResolver()._parseFrontmatter(raw).frontmatter).toEqual({})
  })

  it('drops scalar / non-object frontmatter', () => {
    const raw = '---\njust-a-string\n---\nbody'
    expect(createResolver()._parseFrontmatter(raw).frontmatter).toEqual({})
  })

  it('exposes the full match so the body offset can be sliced', () => {
    const raw = '---\ntitle: x\n---\nrest'
    const { match } = createResolver()._parseFrontmatter(raw)
    expect(raw.slice(match[0].length)).toBe('rest')
  })
})
