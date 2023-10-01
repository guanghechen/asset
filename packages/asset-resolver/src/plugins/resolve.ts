import type {
  IAsset,
  IAssetDetail,
  IAssetLocation,
  IAssetMeta,
  IAssetPluginResolveApi,
  IAssetPluginResolveInput,
  IAssetPluginResolveNext,
  IAssetPluginResolveOutput,
  IAssetResolvePlugin,
  IAssetResolverApi,
  IBinaryFileData,
} from '@guanghechen/asset-types'
import path from 'node:path'
import type { IAssetPluginLocateResult } from './locate'

export async function resolve(
  args: IAssetPluginResolveArgs,
  plugins: ReadonlyArray<IAssetResolvePlugin>,
  api: IAssetResolverApi,
): Promise<IAssetPluginResolveResult | null> {
  const { lastStageResult, loadContent } = args
  const { absoluteSrcPath, guid, hash, src, extname, content, encoding } = lastStageResult
  const input: IAssetPluginResolveInput = {
    guid,
    hash,
    src,
    extname,
    content,
    encoding,
    title: lastStageResult.title,
    createdAt: lastStageResult.createdAt,
    updatedAt: lastStageResult.updatedAt,
  }

  const curDir: string = path.dirname(absoluteSrcPath)
  const pluginApi: IAssetPluginResolveApi = {
    loadContent,
    parseSrcPathFromUrl: url => api.pathResolver.parseFromUrl(url),
    resolveRefPath: relativePath => api.resolveRefPath(curDir, relativePath),
    resolveSlug: meta => api.uriResolver.resolveSlug(meta),
    resolveUri: (sourcetype, mimetype) =>
      api.uriResolver.resolveUri({ guid, hash, sourcetype, mimetype, extname }),
  }

  const reducer: IAssetPluginResolveNext = plugins.reduceRight<IAssetPluginResolveNext>(
    (next, middleware) => embryo => middleware.resolve(input, embryo, pluginApi, next),
    async embryo => embryo,
  )

  const output: IAssetPluginResolveOutput | null = await reducer(null)
  if (output === null) return null

  const {
    mimetype,
    sourcetype,
    slug,
    uri: uri0,
    title,
    description,
    createdAt,
    updatedAt,
    categories,
    tags,
  } = output

  const uri: string = uri0 ?? (await pluginApi.resolveUri(sourcetype, mimetype))
  const meta: IAssetMeta = { uri, slug }
  const location: IAssetLocation = { guid, hash, mimetype, sourcetype, extname }
  const detail: IAssetDetail = { title, description, createdAt, updatedAt, categories, tags }
  const asset: IAsset = { ...meta, ...location, ...detail }
  const result: IAssetPluginResolveResult = { absoluteSrcPath, asset, src, content, encoding }
  return result
}

export interface IAssetPluginResolveArgs {
  lastStageResult: IAssetPluginLocateResult
  /**
   * Load content by source file srcPath.
   * @param absoluteSrcPath
   */
  loadContent: (absoluteSrcPath: string) => Promise<IBinaryFileData | null>
}

export interface IAssetPluginResolveResult {
  absoluteSrcPath: string
  asset: IAsset
  src: string
  content: IBinaryFileData
  encoding: BufferEncoding | undefined
}
