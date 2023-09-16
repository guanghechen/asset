export interface IAssetTaskApi {
  /**
   * Create assets on the given srcPaths.
   * @param srcPaths
   */
  create(srcPaths: string[]): Promise<void>
  /**
   * Mark the assets on the srcPaths invalid and remove them from assetManager.
   * @param srcPaths
   */
  remove(srcPaths: string[]): Promise<void>
  /**
   * Update the assets on the srcPaths.
   * @param srcPaths
   */
  update(srcPaths: string[]): Promise<void>
}
