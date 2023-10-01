import type {
  AssetDataTypeEnum,
  IAsset,
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
  const { lastStageResult, loadContent, resolveAsset } = args
  const { absoluteSrcPath, asset, content, encoding, data } = lastStageResult
  const input: IAssetPluginPolishInput = {
    sourcetype: asset.sourcetype,
    content,
    data,
  }

  const curDir: string = path.dirname(absoluteSrcPath)
  const pluginApi: IAssetPluginPolishApi = {
    loadContent,
    parseSrcPathFromUrl: url => api.pathResolver.parseFromUrl(url),
    resolveAsset,
    resolveRefPath: relativePath => api.resolveRefPath(curDir, relativePath),
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
   * Resolve asset by absoluteSrcPath.
   * @param absoluteSrcPath
   */
  resolveAsset(absoluteSrcPath: string): Promise<Readonly<IAsset> | null>
}

export interface IAssetPluginPolishResult {
  asset: IAsset
  encoding: BufferEncoding | undefined
  datatype: AssetDataTypeEnum
  data: unknown
}
