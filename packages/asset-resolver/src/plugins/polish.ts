import type {
  AssetDataTypeEnum,
  IAsset,
  IAssetMeta,
  IAssetPluginPolishApi,
  IAssetPluginPolishInput,
  IAssetPluginPolishNext,
  IAssetPluginPolishOutput,
  IAssetPolishPlugin,
  IAssetResolverApi,
  IBinaryFileData,
} from '@guanghechen/asset-types'
import path from 'node:path'
import type { IAssetPluginParseResult } from './parse'

export async function polish(
  args: IAssetPluginPolishArgs,
  plugins: ReadonlyArray<IAssetPolishPlugin>,
  api: IAssetResolverApi,
): Promise<IAssetPluginPolishResult | null> {
  const { lastStageResult, loadContent, resolveAssetMeta } = args
  const { absoluteSrcPath, asset, content, encoding, data } = lastStageResult
  const input: IAssetPluginPolishInput = {
    sourcetype: asset.sourcetype,
    title: asset.title,
    content,
    data,
  }

  const curDir: string = path.dirname(absoluteSrcPath)
  const pluginApi: IAssetPluginPolishApi = {
    loadContent: async relativePath => {
      const refPath: string | null = api.resolveRefPath(curDir, relativePath)
      if (refPath === null) return null
      return loadContent(refPath)
    },
    resolveAssetMeta: async relativePath => {
      const refPath: string | null = api.resolveRefPath(curDir, relativePath)
      if (refPath === null) return null
      return resolveAssetMeta(refPath)
    },
  }
  const reducer: IAssetPluginPolishNext = plugins.reduceRight<IAssetPluginPolishNext>(
    (next, middleware) => embryo => middleware.polish(input, embryo, pluginApi, next),
    async embryo => embryo,
  )

  const output: IAssetPluginPolishOutput | null = await reducer(null)
  if (output === null) return null

  const result: IAssetPluginPolishResult = {
    asset,
    encoding,
    datatype: output.datatype,
    data: output.data,
  }
  return result
}

export interface IAssetPluginPolishArgs {
  lastStageResult: IAssetPluginParseResult
  /**
   * Load content by source file srcPath.
   * @param absoluteSrcPath
   */
  loadContent: (absoluteSrcPath: string) => Promise<IBinaryFileData | null>
  /**
   * Resolve asset by srcPathId.
   * @param absoluteSrcPath
   */
  resolveAssetMeta(absoluteSrcPath: string): Promise<Readonly<IAssetMeta> | null>
}

export interface IAssetPluginPolishResult {
  asset: IAsset
  encoding: BufferEncoding | undefined
  datatype: AssetDataTypeEnum
  data: unknown
}
