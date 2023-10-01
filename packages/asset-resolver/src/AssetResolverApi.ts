import type {
  IAssetLocator,
  IAssetPathResolver,
  IAssetResolverApi,
  IAssetSourceStorage,
  IAssetUriResolver,
  IBinaryFileData,
  IEncodingDetector,
} from '@guanghechen/asset-types'

export interface IAssetResolverApiProps {
  encodingDetector: IEncodingDetector
  locator: IAssetLocator
  pathResolver: IAssetPathResolver
  sourceStorage: IAssetSourceStorage
  uriResolver: IAssetUriResolver
}

export class AssetResolverApi implements IAssetResolverApi {
  public readonly locator: IAssetLocator
  public readonly pathResolver: IAssetPathResolver
  public readonly sourceStorage: IAssetSourceStorage
  public readonly uriResolver: IAssetUriResolver
  protected readonly _encodingDetector: IEncodingDetector

  constructor(props: IAssetResolverApiProps) {
    const { encodingDetector, locator, pathResolver, sourceStorage, uriResolver } = props

    this.locator = locator
    this.pathResolver = pathResolver
    this.uriResolver = uriResolver
    this.sourceStorage = sourceStorage
    this._encodingDetector = encodingDetector
  }

  public async detectEncoding(
    src: string,
    data: IBinaryFileData,
  ): Promise<BufferEncoding | undefined> {
    return await this._encodingDetector.detect(src, data)
  }

  public resolveRefPath(curDir: string, refPath: string): string | null {
    const pathResolver: IAssetPathResolver = this.pathResolver
    const filepath: string = pathResolver.isAbsolutePath(refPath)
      ? refPath
      : pathResolver.absolute(curDir, refPath)
    const srcRoot: string | null = pathResolver.findSrcRoot(curDir)
    return srcRoot === null ? null : filepath
  }

  public resolveGUID(absoluteSrcPath: string): Promise<string> {
    return this.locator.resolveGUID(absoluteSrcPath)
  }
}
