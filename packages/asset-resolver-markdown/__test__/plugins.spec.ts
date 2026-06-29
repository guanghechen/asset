import type {
  IAssetPluginParseInput,
  IAssetPluginPolishApi,
  IAssetPluginPolishInput,
  IAssetPluginResolveInput,
  IAssetPluginResolveOutput,
  IAssetResolverPlugin,
} from '@guanghechen/asset-types'
import { AssetDataTypeEnum } from '@guanghechen/asset-types'
import { ImageReferenceType, ParagraphType } from '@yozora/ast'
import type { Paragraph, Root } from '@yozora/ast'
import { YozoraParser } from '@yozora/parser'
import { describe, expect, it } from 'vitest'
import {
  MarkdownAssetType,
  markdownPluginAplayer,
  markdownPluginCode,
  markdownPluginDefinition,
  markdownPluginEcmaImport,
  markdownPluginExcerpt,
  markdownPluginFootnote,
  markdownPluginImages,
  markdownPluginSlug,
  markdownPluginStripSpace,
  markdownPluginTimeToRead,
  markdownPluginToc,
} from '../src'
import type { IMarkdownResolverPlugin, IMarkdownResolverPluginContext } from '../src'

const identity = async <T>(embryo: T): Promise<T> => embryo
const parser = new YozoraParser()
const parseMarkdown = (content: string): Root =>
  parser.parse(content, {
    shouldReservePosition: false,
    presetDefinitions: [],
    presetFootnoteDefinitions: [],
  })

const ctx: IMarkdownResolverPluginContext = {
  getPresetDefinitions: () => undefined,
  getPresetFootnoteDefinitions: () => undefined,
  parseMarkdown,
  resolvable: src => /\.md$/.test(src),
}

const build = (factory: IMarkdownResolverPlugin): IAssetResolverPlugin => factory(ctx)
const title: Paragraph = { type: ParagraphType, children: [] }

const polishStr = { sourcetype: MarkdownAssetType } as unknown as IAssetPluginPolishInput
const parseStr = { sourcetype: MarkdownAssetType } as unknown as IAssetPluginParseInput

function polishEmbryo(
  markdown: string,
  frontmatter: Record<string, unknown> = {},
  extra: object = {},
): never {
  return {
    datatype: AssetDataTypeEnum.JSON,
    data: { title, ast: parseMarkdown(markdown), frontmatter, ...extra },
  } as never
}

function parseEmbryo(markdown: string, frontmatter: Record<string, unknown> = {}): never {
  return { data: { title, ast: parseMarkdown(markdown), frontmatter } } as never
}

const noopApi = {} as never

// ─── resolve-stage plugin ────────────────────────────────────────────────────
describe('markdownPluginSlug', () => {
  const resolveInput = (src: string): IAssetPluginResolveInput =>
    ({ src }) as IAssetPluginResolveInput
  const mdEmbryo = (slug: string | null): IAssetPluginResolveOutput =>
    ({ sourcetype: MarkdownAssetType, slug }) as unknown as IAssetPluginResolveOutput

  it('derives a slug from the prefix and source path', async () => {
    const out = await build(markdownPluginSlug({ slugPrefix: '/p/' })).resolve!(
      resolveInput('foo/bar.md'),
      mdEmbryo(null),
      noopApi,
      identity,
    )
    expect((out as IAssetPluginResolveOutput).slug).toBe('/p/foo/bar')
  })

  it('strips a trailing index segment', async () => {
    const out = await build(markdownPluginSlug({ slugPrefix: '/p/' })).resolve!(
      resolveInput('foo/index.md'),
      mdEmbryo(null),
      noopApi,
      identity,
    )
    expect((out as IAssetPluginResolveOutput).slug).toBe('/p/foo')
  })

  it('keeps an existing slug', async () => {
    const out = await build(markdownPluginSlug()).resolve!(
      resolveInput('foo/bar.md'),
      mdEmbryo('/keep'),
      noopApi,
      identity,
    )
    expect((out as IAssetPluginResolveOutput).slug).toBe('/keep')
  })

  it('clears the slug when the custom resolver returns nothing', async () => {
    const out = await build(markdownPluginSlug({ resolveSlug: async () => null })).resolve!(
      resolveInput('foo/bar.md'),
      mdEmbryo('/old'),
      noopApi,
      identity,
    )
    expect((out as IAssetPluginResolveOutput).slug).toBeNull()
  })

  it('ignores non-markdown embryos', async () => {
    const embryo = { sourcetype: 'file', slug: null } as unknown as IAssetPluginResolveOutput
    const out = await build(markdownPluginSlug()).resolve!(
      resolveInput('a.md'),
      embryo,
      noopApi,
      identity,
    )
    expect(out).toBe(embryo)
  })
})

// ─── parse-stage plugins ─────────────────────────────────────────────────────
describe('markdownPluginStripSpace', () => {
  // A soft line break between two Han characters is what the plugin collapses.
  it('strips line breaks between Chinese characters', async () => {
    const out = await build(markdownPluginStripSpace()).parse!(
      parseStr,
      parseEmbryo('中文\n测试'),
      noopApi,
      identity,
    )
    expect(JSON.stringify((out as { data: { ast: Root } }).data.ast)).toContain('中文测试')
  })

  it('is a no-op when disabled', async () => {
    const out = await build(markdownPluginStripSpace({ betweenChineseCharacters: false })).parse!(
      parseStr,
      parseEmbryo('中文\n测试'),
      noopApi,
      identity,
    )
    expect(JSON.stringify((out as { data: { ast: Root } }).data.ast)).not.toContain('中文测试')
  })
})

describe('markdownPluginCode', () => {
  const api = {
    resolveRefPath: async (p: string) => `/abs/${p}`,
    loadContent: async () => Buffer.from('line1\nline2\nline3'),
  } as unknown as IAssetPluginPolishApi

  it('inlines referenced source file content', async () => {
    const md = '```ts sourcefile="src/x.ts"\nplaceholder\n```'
    const out = await build(markdownPluginCode()).parse!(
      parseStr,
      parseEmbryo(md),
      api as never,
      identity,
    )
    expect(JSON.stringify((out as { data: { ast: Root } }).data.ast)).toContain('line1')
  })

  it('slices the requested line interval', async () => {
    const md = '```ts sourcefile="src/x.ts" sourceline="1-2"\n\n```'
    const out = await build(markdownPluginCode()).parse!(
      parseStr,
      parseEmbryo(md),
      api as never,
      identity,
    )
    const serialized = JSON.stringify((out as { data: { ast: Root } }).data.ast)
    expect(serialized).toContain('line1')
    expect(serialized).toContain('line2')
    expect(serialized).not.toContain('line3')
  })

  it('leaves code blocks without a sourcefile meta untouched', async () => {
    const md = '```ts\noriginal\n```'
    const out = await build(markdownPluginCode()).parse!(
      parseStr,
      parseEmbryo(md),
      api as never,
      identity,
    )
    expect(JSON.stringify((out as { data: { ast: Root } }).data.ast)).toContain('original')
  })

  it('trims the common indent of the sliced lines', async () => {
    const indentedApi = {
      resolveRefPath: async (p: string) => `/abs/${p}`,
      loadContent: async () => Buffer.from('    indentedA\n    indentedB\n    indentedC'),
    } as unknown as IAssetPluginPolishApi
    const md = '```ts sourcefile="src/x.ts" sourceline="1-2"\n\n```'
    const out = await build(markdownPluginCode()).parse!(
      parseStr,
      parseEmbryo(md),
      indentedApi as never,
      identity,
    )
    const code = ((out as { data: { ast: Root } }).data.ast.children[0] as { value: string }).value
    expect(code).toBe('indentedA\nindentedB') // 4-space common indent stripped, line 3 excluded
  })
})

// ─── polish-stage plugins ────────────────────────────────────────────────────
describe('markdownPluginTimeToRead', () => {
  it('computes the reading time from the ast', async () => {
    const out = await build(markdownPluginTimeToRead({ wordsPerMinute: 120 })).polish!(
      polishStr,
      polishEmbryo('one two three four five'),
      noopApi,
      identity,
    )
    expect((out as { data: { timeToRead: number } }).data.timeToRead).toBe(3)
  })

  it('prefers an explicit integer timeToRead from the frontmatter', async () => {
    const out = await build(markdownPluginTimeToRead()).polish!(
      polishStr,
      polishEmbryo('x', { timeToRead: 7 }),
      noopApi,
      identity,
    )
    expect((out as { data: { timeToRead: number } }).data.timeToRead).toBe(7)
  })
})

describe('markdownPluginExcerpt', () => {
  it('uses the frontmatter excerpt when provided', async () => {
    const out = await build(markdownPluginExcerpt({ pruneLength: 140 })).polish!(
      polishStr,
      polishEmbryo('body', { excerpt: 'Custom excerpt' }),
      noopApi,
      identity,
    )
    expect(JSON.stringify((out as { data: { excerpt: Root } }).data.excerpt)).toContain(
      'Custom excerpt',
    )
  })

  it('derives an excerpt from the ast otherwise', async () => {
    const out = await build(markdownPluginExcerpt({})).polish!(
      polishStr,
      polishEmbryo('# Title\n\nSome body paragraph.'),
      noopApi,
      identity,
    )
    expect((out as { data: { excerpt: Root } }).data.excerpt.type).toBe('root')
  })
})

describe('markdownPluginToc', () => {
  it('builds a table of contents from headings', async () => {
    const out = await build(markdownPluginToc()).polish!(
      polishStr,
      polishEmbryo('# Alpha\n\n## Beta'),
      noopApi,
      identity,
    )
    const serialized = JSON.stringify((out as { data: { toc: unknown } }).data.toc)
    expect(serialized).toContain('Alpha')
    expect(serialized).toContain('Beta')
  })
})

describe('markdownPluginDefinition', () => {
  it('collects definitions and can remove definition nodes', async () => {
    const md = '[link][foo]\n\n[foo]: https://example.com/foo'
    const out = await build(markdownPluginDefinition({ removeDefinitionNodes: true })).polish!(
      polishStr,
      polishEmbryo(md),
      noopApi,
      identity,
    )
    const data = (out as { data: { definitionMap: Record<string, { url: string }>; ast: Root } })
      .data
    const urls = Object.values(data.definitionMap).map(d => d.url)
    expect(urls).toContain('https://example.com/foo')
    expect(JSON.stringify(data.ast)).not.toContain('"definition"')
  })

  it('keeps definition nodes by default', async () => {
    const md = '[link][foo]\n\n[foo]: https://example.com/foo'
    const out = await build(markdownPluginDefinition()).polish!(
      polishStr,
      polishEmbryo(md),
      noopApi,
      identity,
    )
    expect(JSON.stringify((out as { data: { ast: Root } }).data.ast)).toContain('definition')
  })
})

describe('markdownPluginFootnote', () => {
  it('collects footnote definitions', async () => {
    const md = 'Text[^1].\n\n[^1]: A footnote.'
    const out = await build(markdownPluginFootnote({ removeFootnoteDefinitionNodes: true }))
      .polish!(polishStr, polishEmbryo(md), noopApi, identity)
    const map = (out as { data: { footnoteDefinitionMap: Record<string, unknown> } }).data
      .footnoteDefinitionMap
    expect(Object.keys(map).length).toBeGreaterThan(0)
  })
})

describe('markdownPluginImages', () => {
  it('collects unique image urls from the ast', async () => {
    const md =
      '![cat](https://img/cat.png)\n\n![dog](https://img/dog.png)\n\n![cat2](https://img/cat.png)'
    const out = await build(markdownPluginImages()).polish!(
      polishStr,
      polishEmbryo(md),
      noopApi,
      identity,
    )
    expect((out as { data: { images: unknown[] } }).data.images).toEqual([
      { src: 'https://img/cat.png', alt: 'cat' },
      { src: 'https://img/dog.png', alt: 'dog' },
    ])
  })

  it('treats preset images as already-seen', async () => {
    const plugin = build(
      markdownPluginImages({
        presetPreviewImages: [{ src: 'https://img/cat.png', alt: 'preset' }],
      }),
    )
    const out = await plugin.polish!(
      polishStr,
      polishEmbryo('![cat](https://img/cat.png)'),
      noopApi,
      identity,
    )
    expect((out as { data: { images: unknown[] } }).data.images).toEqual([])
  })

  it('resolves image references through the definition map', async () => {
    const ast = {
      type: 'root',
      children: [{ type: ImageReferenceType, identifier: 'ref', alt: 'a ref image' }],
    } as unknown as Root
    const embryo = {
      datatype: AssetDataTypeEnum.JSON,
      data: {
        title,
        ast,
        frontmatter: {},
        definitionMap: { ref: { url: 'https://img/ref.png' } },
      },
    } as never
    const out = await build(markdownPluginImages()).polish!(polishStr, embryo, noopApi, identity)
    expect((out as { data: { images: unknown[] } }).data.images).toEqual([
      { src: 'https://img/ref.png', alt: 'a ref image' },
    ])
  })
})

describe('markdownPluginEcmaImport', () => {
  it('exposes a (possibly empty) list of ecma imports', async () => {
    const out = await build(markdownPluginEcmaImport()).polish!(
      polishStr,
      polishEmbryo('plain paragraph'),
      noopApi,
      identity,
    )
    expect((out as { data: { ecmaImports: unknown[] } }).data.ecmaImports).toEqual([])
  })
})

describe('markdownPluginAplayer', () => {
  const api = {
    parseSrcPathFromUrl: () => null,
    resolveRefPath: async () => null,
    resolveAsset: async () => null,
  } as unknown as IAssetPluginPolishApi

  it('builds aplayer options from a complete audio entry', async () => {
    const frontmatter = {
      aplayer: {
        loop: 'all',
        order: 'list',
        audio: [
          {
            name: 'song',
            artist: 'me',
            url: 'https://x/s.mp3',
            cover: 'https://x/c.png',
            type: 'normal',
          },
        ],
      },
    }
    const out = await build(markdownPluginAplayer()).polish!(
      polishStr,
      polishEmbryo('body', frontmatter),
      api as never,
      identity,
    )
    const aplayer = (out as { data: { aplayer: { audio: unknown[]; loop: string } } }).data.aplayer
    expect(aplayer.audio).toHaveLength(1)
    expect(aplayer.loop).toBe('all')
    expect(aplayer.audio[0]).toMatchObject({ name: 'song', artist: 'me', url: 'https://x/s.mp3' })
  })

  it('rewrites audio urls through the resolved asset', async () => {
    const resolvingApi = {
      parseSrcPathFromUrl: (url: string) => url,
      resolveRefPath: async (p: string) => `/abs/${p}`,
      resolveAsset: async () => ({ slug: '/page/song', uri: '/asset/song.json' }),
    } as unknown as IAssetPluginPolishApi
    const frontmatter = {
      aplayer: {
        audio: [{ name: 'song', artist: 'me', url: './song.mp3', cover: './cover.png' }],
      },
    }
    const out = await build(markdownPluginAplayer()).polish!(
      polishStr,
      polishEmbryo('body', frontmatter),
      resolvingApi as never,
      identity,
    )
    const aplayer = (out as { data: { aplayer: { audio: Array<{ url: string; cover: string }> } } })
      .data.aplayer
    expect(aplayer.audio[0].url).toBe('/page/song')
    expect(aplayer.audio[0].cover).toBe('/page/song')
  })

  it('passes through when audio entries are incomplete', async () => {
    const frontmatter = { aplayer: { audio: [{ name: 'song' }] } }
    const embryo = polishEmbryo('body', frontmatter)
    const out = await build(markdownPluginAplayer()).polish!(
      polishStr,
      embryo,
      api as never,
      identity,
    )
    expect((out as { data: { aplayer?: unknown } }).data.aplayer).toBeUndefined()
  })

  it('passes through when there is no aplayer frontmatter', async () => {
    const embryo = polishEmbryo('body')
    const out = await build(markdownPluginAplayer()).polish!(
      polishStr,
      embryo,
      api as never,
      identity,
    )
    expect(out).toBe(embryo)
  })
})
