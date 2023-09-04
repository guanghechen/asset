export interface IAssetTaskApi {
  /**
   *
   */
  readonly delayAfterContentChanged: number
  /**
   * Create assets on the given locations.
   * @param locations
   */
  create(locations: string[]): Promise<void>
  /**
   * Mark the assets on the locations invalid and remove them from assetManager.
   * @param locations
   */
  remove(locations: string[]): Promise<void>
  /**
   * Update the assets on the locations.
   * @param locations
   */
  update(locations: string[]): Promise<void>
}
