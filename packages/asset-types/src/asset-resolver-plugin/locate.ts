// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IAssetPluginLocateApi {}

export interface IAssetPluginLocateNext {
  (embryo: Readonly<IAssetPluginLocateOutput> | null): Promise<IAssetPluginLocateOutput | null>
}

export interface IAssetPluginLocateInput {
  /**
   * Absolute source path.
   */
  absoluteSrcPath: string
}

export interface IAssetPluginLocateOutput {
  /**
   * Asset global unique identifier.
   */
  guid: string
  /**
   * The fingerprint of the asset content.
   */
  hash: string
  /**
   * Source virtual filepath (*nix style).
   */
  src: string
  /**
   * The created date of the asset (ISOString).
   */
  createdAt: string
  /**
   * The last modification date of the asset (ISOString).
   */
  updatedAt: string
  /**
   * Asset title.
   */
  title: string
  /**
   * The source file name.
   */
  filename: string
  /**
   * File extension (without dot).
   */
  extname: string | undefined
  /**
   * Source file encoding.
   */
  encoding: BufferEncoding | undefined
}
