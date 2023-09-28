import type { IAsset } from './asset'

export interface IAssetTaskApi {
  /**
   * Locate the asset by the given filepath.
   * @param absoluteSrcPath
   */
  locate(absoluteSrcPath: string): Promise<IAsset | null>
  /**
   * Create assets on the given srcPaths.
   * @param absoluteSrcPaths
   */
  create(absoluteSrcPaths: ReadonlyArray<string>): Promise<void>
  /**
   * Mark the assets on the srcPaths invalid and remove them from assetManager.
   * @param absoluteSrcPaths
   */
  remove(absoluteSrcPaths: ReadonlyArray<string>): Promise<void>
  /**
   * Update the assets on the srcPaths.
   * @param absoluteSrcPaths
   */
  update(absoluteSrcPaths: ReadonlyArray<string>): Promise<void>
}
