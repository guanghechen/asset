import type { IAssetDataMap } from '@guanghechen/asset-core'
import type { IAssetProcessingMiddleware } from './middleware'

export interface IAssetService {
  /**
   * Use a asset middleware.
   * @param middleware
   */
  use(middleware: IAssetProcessingMiddleware): void
  /**
   * Export asset data mpa.
   */
  dump(): IAssetDataMap
  /**
   * Mark the assets on the locations invalid.
   * @param locations
   */
  invalidate(locations: string): void
  /**
   * Process assets on the given locations.
   * @param locations
   */
  handle(locations: string[]): Promise<void>
}
