import { AssetUriResolver } from '@guanghechen/asset-resolver'
import { FileAssetType } from '@guanghechen/asset-resolver-file'
import { ImageAssetType } from '@guanghechen/asset-resolver-image'
import { MarkdownAssetType } from '@guanghechen/asset-resolver-markdown'
import type { IAssetUriResolver } from '@guanghechen/asset-types'

export function createAssetUriResolver(group: string): IAssetUriResolver {
  const uriResolver: IAssetUriResolver = new AssetUriResolver({
    resolveUriPrefix: async asset => {
      switch (asset.sourcetype) {
        case FileAssetType:
          return `/asset/${group}/file/`
        case ImageAssetType:
          return `/asset/${group}/img/`
        case MarkdownAssetType:
          return `/api/${group}/`
        default:
          if (asset.mimetype === 'application/json') return `/asset/${group}/json/`
          if (asset.mimetype.startsWith('text/')) return `/asset/${group}/text/`
          return `/asset/${group}/unknown/`
      }
    },
  })
  return uriResolver
}
