import type { IAssetWatchShouldIgnore } from './asset-storage-source'
import type { IAssetServiceWatcher } from './common'

export interface IAssetService {
  /**
   * Prepare the asset service.
   */
  prepare(): Promise<void>

  /**
   * Close the asset service and waiting all of the tasks in the pipeline terminated (done / cancelled / failed),
   * the subsequent `build` and `watch` will ignored.
   */
  close(): Promise<void>

  /**
   * Need to call `this.start()` in advance.
   * @param acceptedPattern
   */
  build(acceptedPattern: ReadonlyArray<string>): Promise<void>

  /**
   * Need to call `this.start()` in advance.
   * @param acceptedPattern
   * @param shouldIgnore
   */
  watch(
    acceptedPattern: ReadonlyArray<string>,
    shouldIgnore?: IAssetWatchShouldIgnore,
  ): Promise<IAssetServiceWatcher>
}
