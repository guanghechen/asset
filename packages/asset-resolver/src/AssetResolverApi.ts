import type {
  IAssetLocator,
  IAssetPathResolver,
  IAssetResolverApi,
  IAssetSourceStorage,
  IAssetUriResolver,
  IBinaryFileData,
  IEncodingDetector,
} from '@guanghechen/asset-types'
import type { IReporter } from '@guanghechen/types'

export interface IAssetResolverApiProps {
  encodingDetector: IEncodingDetector
  locator: IAssetLocator
  pathResolver: IAssetPathResolver
  reporter: IReporter
  sourceStorage: IAssetSourceStorage
  uriResolver: IAssetUriResolver
}

export class AssetResolverApi implements IAssetResolverApi {
  public readonly locator: IAssetLocator
  public readonly pathResolver: IAssetPathResolver
  public readonly sourceStorage: IAssetSourceStorage
  public readonly uriResolver: IAssetUriResolver
  protected readonly _encodingDetector: IEncodingDetector
  protected readonly _reporter: IReporter

  constructor(props: IAssetResolverApiProps) {
    const { encodingDetector, locator, pathResolver, reporter, sourceStorage, uriResolver } = props

    this.locator = locator
    this.pathResolver = pathResolver
    this.uriResolver = uriResolver
    this.sourceStorage = sourceStorage
    this._encodingDetector = encodingDetector
    this._reporter = reporter
  }

  public async detectEncoding(
    src: string,
    data: IBinaryFileData,
  ): Promise<BufferEncoding | undefined> {
    return this._encodingDetector.detect(src, data)
  }

  public async resolveRefPath(curDir: string, refPath: string): Promise<string | null> {
    const absoluteSrcPath: string = this.pathResolver.absolute(curDir, refPath)
    const srcRoot: string | null = this.pathResolver.findSrcRoot(absoluteSrcPath)
    if (srcRoot === null) {
      this._reporter.warn(`[AssetResolverApi.resolveRefPath] bad ref path: ${refPath}`)
      return null
    }

    const exists: boolean = await this.sourceStorage.existFile(absoluteSrcPath)
    if (exists) return absoluteSrcPath

    this._reporter.warn(`[AssetResolverApi.resolveRefPath] bad ref path: ${refPath}`)
    return null
  }
}
