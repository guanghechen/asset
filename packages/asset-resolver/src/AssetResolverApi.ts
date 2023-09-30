import type {
  IAssetLocator,
  IAssetPathResolver,
  IAssetPluginResolveInput,
  IAssetResolverApi,
  IAssetSourceStorage,
  IAssetUriResolver,
  IBinaryFileData,
} from '@guanghechen/asset-types'
import { calcFingerprint, normalizeUrlPath } from '@guanghechen/asset-util'
import path from 'node:path'

export interface IAssetResolverApiProps {
  locator: IAssetLocator
  pathResolver: IAssetPathResolver
  sourceStorage: IAssetSourceStorage
  uriResolver: IAssetUriResolver
}

const extnameRegex = /\.([\w]+)$/

export class AssetResolverApi implements IAssetResolverApi {
  public readonly locator: IAssetLocator
  public readonly pathResolver: IAssetPathResolver
  public readonly uriResolver: IAssetUriResolver
  protected readonly _sourceStorage: IAssetSourceStorage

  constructor(props: IAssetResolverApiProps) {
    const { locator, pathResolver, sourceStorage, uriResolver } = props

    this.locator = locator
    this.pathResolver = pathResolver
    this.uriResolver = uriResolver
    this._sourceStorage = sourceStorage
  }

  public async detectEncoding(absoluteSrcPath: string): Promise<BufferEncoding | undefined> {
    return await this._sourceStorage.detectEncoding(absoluteSrcPath)
  }

  public async initAsset(absoluteSrcPath: string): Promise<IAssetPluginResolveInput | null> {
    const pathResolver: IAssetPathResolver = this.pathResolver
    const sourceStorage: IAssetSourceStorage = this._sourceStorage

    const srcRoot: string = pathResolver.assertSafeAbsolutePath(absoluteSrcPath)
    await sourceStorage.assertExistedFile(absoluteSrcPath)

    const src: string = normalizeUrlPath(pathResolver.relative(srcRoot, absoluteSrcPath))
    const guid: string = await this.locator.resolveGUID(absoluteSrcPath)
    const stat = await sourceStorage.statFile(absoluteSrcPath)
    const content: IBinaryFileData | undefined = await sourceStorage.readFile(absoluteSrcPath)
    const hash: string = calcFingerprint(content)
    const createdAt: string = new Date(stat.birthtime).toISOString()
    const updatedAt: string = new Date(stat.mtime).toISOString()
    const filename: string = path.basename(absoluteSrcPath)
    const extname: string | undefined = absoluteSrcPath.match(extnameRegex)?.[1]
    const title: string = filename
      .trim()
      .replace(/\s+/, ' ')
      .replace(/\.[^.]+$/, '')
    const encoding: BufferEncoding | undefined = await sourceStorage.detectEncoding(absoluteSrcPath)
    return { guid, hash, src, createdAt, updatedAt, title, filename, extname, encoding }
  }

  public async loadContent(absoluteSrcPath: string): Promise<IBinaryFileData | null> {
    const pathResolver: IAssetPathResolver = this.pathResolver
    const sourceStorage: IAssetSourceStorage = this._sourceStorage

    pathResolver.assertSafeAbsolutePath(absoluteSrcPath)
    await sourceStorage.assertExistedFile(absoluteSrcPath)
    const content: IBinaryFileData | undefined = await sourceStorage.readFile(absoluteSrcPath)
    return content ?? null
  }

  public resolveRefPath(curDir: string, refPath: string): string | null {
    const pathResolver: IAssetPathResolver = this.pathResolver
    const filepath: string = pathResolver.isAbsolutePath(refPath)
      ? refPath
      : pathResolver.absolute(curDir, refPath)
    const srcRoot: string | null = pathResolver.findSrcRoot(curDir)
    return srcRoot === null ? null : filepath
  }
}
