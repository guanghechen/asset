import { AssetService } from '@guanghechen/asset-api'
import { AssetLocator, AssetResolverApi } from '@guanghechen/asset-resolver'
import type {
  IAssetLocator,
  IAssetPathResolver,
  IAssetResolver,
  IAssetResolverApi,
  IAssetService,
  IAssetSourceStorage,
  IAssetTargetStorage,
  IAssetUriResolver,
  IEncodingDetector,
} from '@guanghechen/asset-types'
import type { IReporter } from '@guanghechen/reporter.types'
import { createAssetUriResolver } from './uri'

interface IParams {
  group: string
  GUID_NAMESPACE: string
  encodingDetector: IEncodingDetector
  pathResolver: IAssetPathResolver
  sourceStorage: IAssetSourceStorage
  targetStorage: IAssetTargetStorage
  reporter: IReporter
  resolver: IAssetResolver
}

export function createAssetService(params: IParams): IAssetService {
  const {
    group,
    GUID_NAMESPACE,
    encodingDetector,
    pathResolver,
    sourceStorage,
    targetStorage,
    reporter,
    resolver,
  } = params

  const dataMapUri: string = `/api/${group}.asset.map.json`
  const uriResolver: IAssetUriResolver = createAssetUriResolver(group)
  const locator: IAssetLocator = new AssetLocator({ GUID_NAMESPACE, pathResolver })
  const resolverApi: IAssetResolverApi = new AssetResolverApi({
    locator,
    encodingDetector,
    pathResolver,
    reporter,
    sourceStorage,
    uriResolver,
  })
  const service: IAssetService = new AssetService({
    reporter,
    resolver,
    resolverApi,
    pathResolver,
    sourceStorage,
    targetStorage,
    dataMapUri,
  })
  return service
}
