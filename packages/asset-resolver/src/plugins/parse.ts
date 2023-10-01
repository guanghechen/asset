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
  const { lastStageResult, loadContent } = args
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
    resolveSlug: meta => api.uriResolver.resolveSlug(meta),
  }
  const reducer: IAssetPluginParseNext = plugins.reduceRight<IAssetPluginParseNext>(
    (next, middleware) => embryo => middleware.parse(input, embryo, pluginApi, next),
    async embryo => embryo,
  )

  const output: IAssetPluginParseOutput | null = await reducer(null)

  // Don't return null even the output is null cause the plugin could have following stage plugins.
  const result: IAssetPluginParseResult = {
    asset,
    absoluteSrcPath,
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
}

export interface IAssetPluginParseResult {
  asset: IAsset
  absoluteSrcPath: string
  content: IBinaryFileData
  encoding: BufferEncoding | undefined
  data: unknown | null
}
