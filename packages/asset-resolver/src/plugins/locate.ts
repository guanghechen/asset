import type {
  IAssetLocatePlugin,
  IAssetPluginLocateApi,
  IAssetPluginLocateInput,
  IAssetPluginLocateNext,
  IAssetPluginLocateOutput,
  IAssetResolverApi,
  IAssetStat,
  IBinaryFileData,
} from '@guanghechen/asset-types'
import { calcFingerprint, normalizeUrlPath } from '@guanghechen/asset-util'
import path from 'node:path'

const extnameRegex = /\.([\w]+)$/

export async function locate(
  args: IAssetPluginLocateArgs,
  plugins: IAssetLocatePlugin[],
  api: IAssetResolverApi,
): Promise<IAssetPluginLocateResult | null> {
  const { absoluteSrcPath } = args
  if (!api.pathResolver.isSafeAbsolutePath(absoluteSrcPath)) return null

  const srcRoot: string | null = api.pathResolver.findSrcRoot(absoluteSrcPath)
  if (srcRoot === null) return null

  const guid: string = await api.locator.resolveGUID(absoluteSrcPath)
  const relativePath: string = api.pathResolver.relative(srcRoot, absoluteSrcPath)
  const src: string = normalizeUrlPath(relativePath)
  const filename: string = path.basename(relativePath)
  const title: string = filename
    .trim()
    .replace(/\s+/, ' ')
    .replace(/\.[^.]+$/, '')
  const content: IBinaryFileData | undefined = await api.sourceStorage.readFile(absoluteSrcPath)
  const hash: string = calcFingerprint(content)
  const stat: IAssetStat = await api.sourceStorage.statFile(absoluteSrcPath)
  const createdAt: string = new Date(stat.birthtime).toISOString()
  const updatedAt: string = new Date(stat.mtime).toISOString()

  const input: IAssetPluginLocateInput = {
    absoluteSrcPath,
    guid,
    hash,
    src,
    title,
    content,
    createdAt,
    updatedAt,
  }
  const pluginApi: IAssetPluginLocateApi = {
    locator: api.locator,
    pathResolver: api.pathResolver,
    uriResolver: api.uriResolver,
    parseSrcPathFromUrl: url => api.pathResolver.parseFromUrl(url),
  }
  const defaultPlugin: IAssetPluginLocateNext = async embryo => {
    if (embryo === null) {
      const { hash, src, title, content, createdAt, updatedAt } = input
      const encoding: BufferEncoding | undefined = await api.encodingDetector.detect(src, content)
      const output: IAssetPluginLocateOutput = {
        hash,
        src,
        title,
        content,
        encoding,
        createdAt,
        updatedAt,
      }
      return output
    }
    return embryo
  }
  const reducer: IAssetPluginLocateNext = plugins.reduceRight<IAssetPluginLocateNext>(
    (next, middleware) => embryo => middleware.locate(input, embryo, pluginApi, next),
    defaultPlugin,
  )

  const output: IAssetPluginLocateOutput | null = await reducer(null)
  if (output === null) return null

  const extname: string | undefined = src.match(extnameRegex)?.[1]
  const result: IAssetPluginLocateResult = {
    absoluteSrcPath,
    guid,
    hash: output.hash,
    src: output.src,
    title: output.title,
    extname,
    content: output.content,
    encoding: output.encoding,
    createdAt: output.createdAt,
    updatedAt: output.updatedAt,
  }
  return result
}

export interface IAssetPluginLocateArgs {
  /**
   * Absolute source path.
   */
  absoluteSrcPath: string
}

export interface IAssetPluginLocateResult {
  /**
   * Absolute source path.
   */
  absoluteSrcPath: string
  /**
   * Asset global unique identifier.
   */
  guid: string
  /**
   * The fingerprint of the asset content.
   */
  hash: string
  /**
   * Relative src path. (*nix style).
   */
  src: string
  /**
   * Asset title.
   */
  title: string
  /**
   * File extension (without dot).
   */
  extname: string | undefined
  /**
   * Asset content.
   */
  content: IBinaryFileData
  /**
   * Source file encoding.
   */
  encoding: BufferEncoding | undefined
  /**
   * The created date of the asset (ISOString).
   */
  createdAt: string
  /**
   * The last modification date of the asset (ISOString).
   */
  updatedAt: string
}
