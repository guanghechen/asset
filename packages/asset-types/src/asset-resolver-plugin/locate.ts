import type { IBinaryFileData } from '../asset-file'
import type { IAssetLocator } from '../asset-locator'
import type { IAssetPathResolver } from '../asset-path-resolver'
import type { IAssetUriResolver } from '../asset-uri-resolver'

export interface IAssetPluginLocateApi {
  readonly locator: IAssetLocator
  readonly pathResolver: IAssetPathResolver
  readonly uriResolver: IAssetUriResolver
  /**
   * Extract src path from url.
   * @param url
   */
  parseSrcPathFromUrl(url: string): string | null
}

export interface IAssetPluginLocateNext {
  (embryo: Readonly<IAssetPluginLocateOutput> | null): Promise<IAssetPluginLocateOutput | null>
}

export interface IAssetPluginLocateInput {
  /**
   * Relative src path.
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
   * Asset content.
   */
  content: IBinaryFileData
  /**
   * The created date of the asset (ISOString).
   */
  createdAt: string
  /**
   * The last modification date of the asset (ISOString).
   */
  updatedAt: string
}

export interface IAssetPluginLocateOutput {
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
