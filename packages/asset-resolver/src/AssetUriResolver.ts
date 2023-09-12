import type { IAssetLocation, IAssetUriResolver } from '@guanghechen/asset-types'
import { mime, normalizeUrlPath } from '@guanghechen/asset-util'

interface IAssetUriResolverProps {
  /**
   * Resolve asset uri prefix.
   * @param assetType
   * @param mimeType
   */
  resolveUriPrefix(assetType: string, mimeType: string): Promise<string>
}

export class AssetUriResolver implements IAssetUriResolver {
  protected readonly _resolveUriPrefix: (assetType: string, mimeType: string) => Promise<string>

  constructor(props: IAssetUriResolverProps) {
    this._resolveUriPrefix = props.resolveUriPrefix
  }

  public async resolveSlug(slug: string | null | undefined): Promise<string | null> {
    return slug ?? null
  }

  public async resolveUri(asset: Readonly<IAssetLocation>): Promise<string> {
    const { guid, type, mimetype } = asset
    const extname: string | undefined = mime.getExtension(mimetype) ?? asset.extname
    const uriPrefix: string = await this._resolveUriPrefix(type, mimetype)
    const uri: string = `/${uriPrefix}/${guid}`
    return normalizeUrlPath(extname ? `${uri}.${extname}` : uri)
  }
}
