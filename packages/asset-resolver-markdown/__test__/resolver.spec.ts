import type {
  IAssetPluginParseApi,
  IAssetPluginParseInput,
  IAssetPluginPolishApi,
  IAssetPluginPolishInput,
  IAssetPluginResolveApi,
  IAssetPluginResolveInput,
} from '@guanghechen/asset-types'
import { ParagraphType } from '@yozora/ast'
import type { Paragraph } from '@yozora/ast'
import { YozoraParser } from '@yozora/parser'
import dayjs from 'dayjs'
import { describe, expect, it } from 'vitest'
import { AssetResolverMarkdown, MarkdownAssetType } from '../src'

const identity = async <T>(embryo: T): Promise<T> => embryo
const parser = new YozoraParser()
const parse = (content: string): ReturnType<typeof parser.parse> =>
  parser.parse(content, {
    shouldReservePosition: false,
    presetDefinitions: [],
    presetFootnoteDefinitions: [],
  })

function createResolver(): AssetResolverMarkdown {
  return new AssetResolverMarkdown({ parser })
}

const resolveApi: IAssetPluginResolveApi = {
  resolveUri: async () => '/asset/post.json',
  resolveSlug: async meta => meta.slug ?? null,
} as unknown as IAssetPluginResolveApi

function resolveInput(src: string, content: string): IAssetPluginResolveInput {
  return {
    guid: 'guid-1',
    hash: 'hash-1',
    src,
    extname: 'md',
    content: Buffer.from(content),
    encoding: 'utf8',
    title: 'fallback title',
    createdAt: '2000-01-01T00:00:00.000Z',
    updatedAt: '2000-01-02T00:00:00.000Z',
  }
}

describe('AssetResolverMarkdown.resolve', () => {
  it('extracts metadata from the frontmatter', async () => {
    const md = [
      '---',
      'title: Hello World',
      'slug: my-slug',
      'description: A description',
      'createdAt: 2020-06-01',
      'tags:',
      '  - a',
      '  - b',
      'categories:',
      '  - [tech, web]',
      '---',
      '# Body',
    ].join('\n')

    const out = await createResolver().resolve(
      resolveInput('post.md', md),
      null,
      resolveApi,
      identity,
    )
    expect(out).toMatchObject({
      sourcetype: MarkdownAssetType,
      mimetype: 'application/json',
      title: 'Hello World',
      slug: 'my-slug',
      description: 'A description',
      tags: ['a', 'b'],
      categories: [['tech', 'web']],
    })
    expect(out!.createdAt).toBe(dayjs('2020-06-01').toISOString())
  })

  it('falls back to input fields and drops malformed tags/categories', async () => {
    const md = ['---', 'tags: not-a-list', 'categories: nope', '---', 'body'].join('\n')
    const out = await createResolver().resolve(
      resolveInput('post.md', md),
      null,
      resolveApi,
      identity,
    )
    expect(out).toMatchObject({
      title: 'fallback title',
      description: 'fallback title',
      createdAt: '2000-01-01T00:00:00.000Z',
      tags: [],
      categories: [],
      slug: null,
    })
  })

  it('passes through sources that are not markdown', async () => {
    const out = await createResolver().resolve(
      resolveInput('photo.png', 'x'),
      null,
      resolveApi,
      identity,
    )
    expect(out).toBeNull()
  })
})

describe('AssetResolverMarkdown.parse', () => {
  const parseApi = {} as unknown as IAssetPluginParseApi
  const parseInput = (content: string): IAssetPluginParseInput =>
    ({
      sourcetype: MarkdownAssetType,
      title: 'fallback',
      src: 'post.md',
      extname: 'md',
      content: Buffer.from(content),
      encoding: 'utf8',
    }) as IAssetPluginParseInput

  it('produces an ast, paragraph title and frontmatter', async () => {
    const md = '---\ntitle: T\n---\n# Heading\n\nparagraph text'
    const out = await createResolver().parse(parseInput(md), null, parseApi, identity)
    expect(out!.data!.ast.type).toBe('root')
    expect(out!.data!.frontmatter.title).toBe('T')
    expect((out!.data!.title as Paragraph).type).toBe(ParagraphType)
    expect(JSON.stringify(out!.data!.ast)).toContain('Heading')
  })

  it('passes through non-markdown inputs', async () => {
    const input = { ...parseInput('x'), sourcetype: 'file' } as IAssetPluginParseInput
    expect(await createResolver().parse(input, null, parseApi, identity)).toBeNull()
  })
})

describe('AssetResolverMarkdown.polish', () => {
  const title: Paragraph = { type: ParagraphType, children: [] }

  function polishInput(markdown: string): IAssetPluginPolishInput {
    return {
      sourcetype: MarkdownAssetType,
      content: Buffer.from(''),
      data: { title, ast: parse(markdown), frontmatter: {} },
    } as unknown as IAssetPluginPolishInput
  }

  it('rewrites local resource urls to the resolved asset slug/uri', async () => {
    const api = {
      parseSrcPathFromUrl: (url: string) => (url.startsWith('http') ? null : url),
      resolveRefPath: async (p: string) => `/abs/${p}`,
      resolveAsset: async () => ({ uri: '/asset/other.json', slug: '/page/other' }),
    } as unknown as IAssetPluginPolishApi

    const out = await createResolver().polish(
      polishInput('[link](./other.md)'),
      null,
      api,
      identity,
    )
    expect(out!.datatype).toBe('json')
    expect(JSON.stringify((out!.data as { ast: unknown }).ast)).toContain('/page/other')
  })

  it('leaves urls untouched when the ref cannot be resolved', async () => {
    const api = {
      parseSrcPathFromUrl: (url: string) => url,
      resolveRefPath: async () => null,
      resolveAsset: async () => null,
    } as unknown as IAssetPluginPolishApi

    const out = await createResolver().polish(
      polishInput('[link](./missing.md)'),
      null,
      api,
      identity,
    )
    expect(JSON.stringify((out!.data as { ast: unknown }).ast)).toContain('./missing.md')
  })

  it('passes through non-markdown or dataless inputs', async () => {
    const api = {} as unknown as IAssetPluginPolishApi
    const notMd = {
      sourcetype: 'file',
      content: Buffer.from(''),
      data: null,
    } as IAssetPluginPolishInput
    expect(await createResolver().polish(notMd, null, api, identity)).toBeNull()

    const noData = {
      sourcetype: MarkdownAssetType,
      content: Buffer.from(''),
      data: null,
    } as IAssetPluginPolishInput
    expect(await createResolver().polish(noData, null, api, identity)).toBeNull()
  })
})
