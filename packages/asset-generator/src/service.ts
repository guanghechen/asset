import { AssetService, AssetTaskApi } from '@guanghechen/asset-api'
import { AssetManager } from '@guanghechen/asset-manager'
import { AssetResolverApi } from '@guanghechen/asset-resolver'
import type { IParser } from '@guanghechen/asset-resolver-markdown'
import type {
  IAssetManager,
  IAssetResolver,
  IAssetResolverApi,
  IAssetService,
  IAssetSourceStorage,
  IAssetTargetStorage,
  IAssetUriResolver,
} from '@guanghechen/asset-types'
import type { IReporter } from '@guanghechen/types'
import type { Definition, FootnoteDefinition } from '@yozora/ast'
import { createAsstResolver } from './resolver'
import { createAssetUriResolver } from './uri'

interface IParams {
  group: string
  GUID_NAMESPACE: string
  sourceStorage: IAssetSourceStorage
  targetStorage: IAssetTargetStorage
  reporter: IReporter
  parser: IParser
  getPresetDefinitions?: () => Definition[] | undefined
  getPresetFootnoteDefinitions?: () => FootnoteDefinition[] | undefined
}

export function createAssetService(params: IParams): IAssetService {
  const {
    group,
    GUID_NAMESPACE,
    sourceStorage,
    targetStorage,
    reporter,
    parser,
    getPresetDefinitions,
    getPresetFootnoteDefinitions,
  } = params

  const resolver: IAssetResolver = createAsstResolver(
    `/${group}/`,
    reporter,
    parser,
    getPresetDefinitions,
    getPresetFootnoteDefinitions,
  )
  const assetManager: IAssetManager = new AssetManager()
  const dataMapUri: string = `/api/${group}.asset.map.json`
  const uriResolver: IAssetUriResolver = createAssetUriResolver(group)
  const resolverApi: IAssetResolverApi = new AssetResolverApi({
    GUID_NAMESPACE,
    sourceStorage,
    assetManager,
    uriResolver,
  })
  const api = new AssetTaskApi({
    resolverApi,
    resolver,
    reporter,
    targetStorage,
    dataMapUri,
  })
  const service: IAssetService = new AssetService({ api, reporter, sourceStorage })
  return service
}
