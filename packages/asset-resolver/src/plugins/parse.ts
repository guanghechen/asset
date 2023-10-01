import type {
  IAsset,
  IAssetParsePlugin,
  IAssetPluginParseApi,
  IAssetPluginParseInput,
  IAssetPluginParseNext,
  IAssetPluginParseOutput,
  IAssetResolverApi,
  IBinaryFileData,
} from '@guanghechen/asset-types'
import path from 'node:path'
import type { IAssetPluginResolveResult } from './resolve'

export async function parse(
  args: IAssetPluginParseArgs,
  plugins: ReadonlyArray<IAssetParsePlugin>,
  api: IAssetResolverApi,
): Promise<IAssetPluginParseResult | null> {
  const { lastStageResult, loadContent, resolveAsset } = args
  const { absoluteSrcPath, src, asset, content, encoding } = lastStageResult
  const input: IAssetPluginParseInput = {
    sourcetype: asset.sourcetype,
    title: asset.title,
    src,
    extname: asset.extname,
    content,
    encoding,
  }

  const curDir: string = path.dirname(absoluteSrcPath)
  const pluginApi: IAssetPluginParseApi = {
    loadContent: async relativePath => {
      const refPath: string | null = api.resolveRefPath(curDir, relativePath)
      if (refPath === null) return null
      return loadContent(refPath)
    },
    resolveAsset: async relativePath => {
      const refPath: string | null = api.resolveRefPath(curDir, relativePath)
      if (refPath === null) return null
      return resolveAsset(refPath)
    },
    resolveSlug: meta => api.uriResolver.resolveSlug(meta),
  }
  const reducer: IAssetPluginParseNext = plugins.reduceRight<IAssetPluginParseNext>(
    (next, middleware) => embryo => middleware.parse(input, embryo, pluginApi, next),
    async embryo => embryo,
  )

  const output: IAssetPluginParseOutput | null = await reducer(null)

  // Don't return null even the output is null cause the plugin could have following stage plugins.
  const result: IAssetPluginParseResult = {
    absoluteSrcPath,
    asset,
    content,
    encoding,
    data: output?.data ?? null,
  }
  return result
}

export interface IAssetPluginParseArgs {
  lastStageResult: IAssetPluginResolveResult
  /**
   * Load content by source file srcPath.
   * @param absoluteSrcPath
   */
  loadContent: (absoluteSrcPath: string) => Promise<IBinaryFileData | null>
  /**
   * Resolve asset by absoluteSrcPath.
   * @param absoluteSrcPath
   */
  resolveAsset(absoluteSrcPath: string): Promise<Readonly<IAsset> | null>
}

export interface IAssetPluginParseResult {
  absoluteSrcPath: string
  asset: IAsset
  content: IBinaryFileData
  encoding: BufferEncoding | undefined
  data: unknown | null
}
