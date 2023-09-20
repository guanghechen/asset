import type { IAssetLocation, IAssetMeta, IAssetUriResolver } from '@guanghechen/asset-types'
import { mime, normalizeUrlPath } from '@guanghechen/asset-util'

interface IAssetUriResolverProps {
  /**
   * Resolve asset uri prefix.
   * @param assetType
   * @param mimeType
   */
  resolveUriPrefix(asset: Readonly<IAssetLocation>): Promise<string>
}

export class AssetUriResolver implements IAssetUriResolver {
  protected readonly _resolveUriPrefix: (asset: Readonly<IAssetLocation>) => Promise<string>

  constructor(props: IAssetUriResolverProps) {
    this._resolveUriPrefix = props.resolveUriPrefix
  }

  public async resolveSlug(asset: Readonly<IAssetMeta>): Promise<string | null> {
    return asset.slug ?? null
  }

  public async resolveUri(asset: Readonly<IAssetLocation>): Promise<string> {
    const { guid, mimetype } = asset
    const extname: string | undefined = mime.getExtension(mimetype) ?? asset.extname
    const uriPrefix: string = await this._resolveUriPrefix(asset)
    const uri: string = `/${uriPrefix}/${guid}`
    return normalizeUrlPath(extname ? `${uri}.${extname}` : uri)
  }
}
