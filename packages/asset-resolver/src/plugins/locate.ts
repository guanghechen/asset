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

  const content0: IBinaryFileData | undefined = await api.sourceStorage.readFile(absoluteSrcPath)
  const guid: string = await api.resolveGUID(absoluteSrcPath)
  const hash: string = calcFingerprint(content0)
  const stat: IAssetStat = await api.sourceStorage.statFile(absoluteSrcPath)
  const relativePath: string = api.pathResolver.relative(srcRoot, absoluteSrcPath)

  const input: IAssetPluginLocateInput = {
    relativePath,
    guid,
    hash,
    content: content0,
    createdAt: new Date(stat.birthtime).toISOString(),
    updatedAt: new Date(stat.mtime).toISOString(),
  }
  const pluginApi: IAssetPluginLocateApi = {
    pathResolver: api.pathResolver,
    sourceStorage: api.sourceStorage,
    detectEncoding: (src, data) => api.detectEncoding(src, data),
  }
  const fallback: IAssetPluginLocateNext = async embryo => {
    if (embryo === null) {
      const src: string = normalizeUrlPath(relativePath)
      const filename: string = path.basename(relativePath)
      const title: string = filename
        .trim()
        .replace(/\s+/, ' ')
        .replace(/\.[^.]+$/, '')
      const encoding: BufferEncoding | undefined = await api.detectEncoding(src, input.content)
      const output: IAssetPluginLocateOutput = {
        src,
        title,
        encoding,
        content: input.content,
        createdAt: input.createdAt,
        updatedAt: input.updatedAt,
      }
      return output
    }
    return embryo
  }
  const reducer: IAssetPluginLocateNext = plugins.reduceRight<IAssetPluginLocateNext>(
    (next, middleware) => embryo => middleware.locate(input, embryo, pluginApi, next),
    fallback,
  )

  const output: IAssetPluginLocateOutput | null = await reducer(null)
  if (output === null) return null

  const { src, title, content, encoding, createdAt, updatedAt } = output
  const extname: string | undefined = src.match(extnameRegex)?.[1]

  const result: IAssetPluginLocateResult = {
    absoluteSrcPath,
    guid,
    hash,
    src,
    title,
    extname,
    content,
    encoding,
    createdAt,
    updatedAt,
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
