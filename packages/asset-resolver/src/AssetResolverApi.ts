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
    return this._encodingDetector.detect(src, data)
  }

  public resolveGUID(absoluteSrcPath: string): Promise<string> {
    return this.locator.resolveGUID(absoluteSrcPath)
  }

  public async resolveRefPath(curDir: string, refPath: string): Promise<string | null> {
    const absoluteSrcPath: string = this.pathResolver.absolute(curDir, refPath)
    const srcRoot: string | null = this.pathResolver.findSrcRoot(absoluteSrcPath)
    if (srcRoot === null) return null

    const exists: boolean = await this.sourceStorage.existFile(absoluteSrcPath)
    return exists ? absoluteSrcPath : null
  }
}
