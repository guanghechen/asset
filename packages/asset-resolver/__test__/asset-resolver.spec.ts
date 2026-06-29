import { AssetResolverFile, FileAssetType } from '@guanghechen/asset-resolver-file'
import type { IAssetResolverApi, IAssetResolverPlugin, IAssetStat } from '@guanghechen/asset-types'
import path from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { AssetLocator, AssetResolver, AssetResolverApi, AssetUriResolver } from '../src'

const GUID_NAMESPACE = '1b671a64-40d5-491e-99b0-da01ff1f3341'
const SRC_ROOT = path.resolve('/srv')

const reporter = {
  warn: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
  verbose: vi.fn(),
} as never

interface IApiOptions {
  findSrcRoot?: (p: string) => string | null
  readFile?: (p: string) => Promise<Buffer | undefined>
}

function createApi(options: IApiOptions = {}): IAssetResolverApi {
  const findSrcRoot = options.findSrcRoot ?? (() => SRC_ROOT)
  const readFile = options.readFile ?? (async () => Buffer.from('hello world'))

  const pathResolver = {
    isSafeAbsolutePath: () => true,
    assertSafeAbsolutePath: () => {},
    findSrcRoot,
    identify: (p: string) => p,
    relative: (root: string, p: string) => path.relative(root, p),
    absolute: (curDir: string, p: string) => path.resolve(curDir, p),
    parseFromUrl: (url: string) => url,
  } as never

  const sourceStorage = {
    readFile,
    statFile: async (): Promise<IAssetStat> =>
      ({ birthtime: new Date(0), mtime: new Date(0) }) as IAssetStat,
    existFile: async () => true,
    assertExistedFile: async () => {},
  } as never

  return new AssetResolverApi({
    encodingDetector: { detect: async () => 'utf8' } as never,
    locator: new AssetLocator({ GUID_NAMESPACE, pathResolver }),
    pathResolver,
    reporter,
    sourceStorage,
    uriResolver: new AssetUriResolver({ resolveUriPrefix: async () => 'asset' }),
  })
}

function createResolver(): AssetResolver {
  return new AssetResolver({ reporter }).use(new AssetResolverFile())
}

describe('AssetResolver.use', () => {
  it('never invokes a plugin that lacks a display name', async () => {
    const resolveSpy = vi.fn(async (_input: unknown, embryo: unknown) => embryo)
    const ghost = { resolve: resolveSpy } as unknown as IAssetResolverPlugin

    const resolver = new AssetResolver({ reporter }).use(ghost).use(new AssetResolverFile())
    const asset = await resolver.resolve(path.join(SRC_ROOT, 'note.txt'), createApi())

    // The ghost plugin was dropped (no displayName), so the file plugin still wins.
    expect(asset).toMatchObject({ sourcetype: FileAssetType })
    expect(resolveSpy).not.toHaveBeenCalled()
  })
})

describe('AssetResolver.resolve', () => {
  it('locates and resolves a source file into an asset', async () => {
    const api = createApi()
    const asset = await createResolver().resolve(path.join(SRC_ROOT, 'note.txt'), api)
    expect(asset).toMatchObject({ sourcetype: FileAssetType, mimetype: 'text/plain' })
    expect(asset!.uri).toMatch(/^\/asset\/[0-9a-f-]+\.txt$/)
  })

  it('returns the cached asset on a second resolve with an unchanged hash', async () => {
    const api = createApi()
    const filePlugin = new AssetResolverFile()
    const resolveSpy = vi.spyOn(filePlugin, 'resolve')
    const resolver = new AssetResolver({ reporter }).use(filePlugin)
    const srcPath = path.join(SRC_ROOT, 'note.txt')

    const first = await resolver.resolve(srcPath, api)
    const second = await resolver.resolve(srcPath, api)

    expect(second).toEqual(first)
    // The second resolve must hit the locator cache (matching guid + hash), so the resolve
    // stage runs exactly once across both calls. Deleting the cache branch in
    // AssetResolver.resolve would run it twice and fail this assertion.
    expect(resolveSpy).toHaveBeenCalledTimes(1)
  })

  it('returns null when the path has no source root', async () => {
    const api = createApi({ findSrcRoot: () => null })
    expect(await createResolver().resolve(path.join(SRC_ROOT, 'note.txt'), api)).toBeNull()
  })
})

describe('AssetResolver.process', () => {
  it('runs every source path through locate -> resolve -> parse -> polish', async () => {
    const api = createApi()
    const results = await createResolver().process(
      [path.join(SRC_ROOT, 'a.txt'), path.join(SRC_ROOT, 'b.txt')],
      api,
    )
    expect(results).toHaveLength(2)
    expect(results[0]).toMatchObject({ datatype: 'binary' })
    expect(results[0].asset.sourcetype).toBe(FileAssetType)
  })

  it('drops paths that fail to locate and warns', async () => {
    reporter.warn.mockClear()
    const api = createApi({
      findSrcRoot: (p: string) => (p.includes('skip') ? null : SRC_ROOT),
    })
    const results = await createResolver().process(
      [path.join(SRC_ROOT, 'keep.txt'), path.join(SRC_ROOT, 'skip.txt')],
      api,
    )
    expect(results).toHaveLength(1)
    expect(reporter.warn).toHaveBeenCalled()
  })

  it('rethrows the underlying error when a stage throws for a source path', async () => {
    const api = createApi({
      readFile: async () => {
        throw new Error('boom')
      },
    })
    const failure = await createResolver()
      .process([path.join(SRC_ROOT, 'a.txt')], api)
      .then(
        () => null,
        (error: unknown) => error,
      )

    expect(Array.isArray(failure)).toBe(true)
    expect((failure as unknown[])[0]).toBeInstanceOf(Error)
    expect(String((failure as Error[])[0])).toContain('boom')
  })
})

describe('AssetResolverApi.resolveRefPath', () => {
  it('returns the absolute path when the file exists under a src root', async () => {
    const api = createApi()
    const resolved = await api.resolveRefPath(SRC_ROOT, 'note.txt')
    expect(resolved).toBe(path.join(SRC_ROOT, 'note.txt'))
  })

  it('returns null and warns when no src root is found', async () => {
    reporter.warn.mockClear()
    const api = createApi({ findSrcRoot: () => null })
    expect(await api.resolveRefPath(SRC_ROOT, 'note.txt')).toBeNull()
    expect(reporter.warn).toHaveBeenCalled()
  })

  it('returns null and warns when the file does not exist', async () => {
    const pathResolver = {
      absolute: (curDir: string, p: string) => path.resolve(curDir, p),
      findSrcRoot: () => SRC_ROOT,
    } as never
    const api = new AssetResolverApi({
      encodingDetector: { detect: async () => 'utf8' } as never,
      locator: new AssetLocator({ GUID_NAMESPACE, pathResolver }),
      pathResolver,
      reporter,
      sourceStorage: { existFile: async () => false } as never,
      uriResolver: new AssetUriResolver({ resolveUriPrefix: async () => 'asset' }),
    })
    reporter.warn.mockClear()
    expect(await api.resolveRefPath(SRC_ROOT, 'missing.txt')).toBeNull()
    expect(reporter.warn).toHaveBeenCalled()
  })
})
