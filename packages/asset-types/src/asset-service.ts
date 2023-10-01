import type { IAsset } from './asset'
import type { IAssetPathResolver } from './asset-path-resolver'
import type { IAssetWatchShouldIgnore } from './asset-storage-source'
import type { IAssetServiceWatcher } from './common'

export interface IAssetService {
  readonly dataMapUri: string
  readonly pathResolver: IAssetPathResolver

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
   * Need to call `this.prepare()` in advance.
   * @param absoluteSrcPaths
   */
  buildByPaths(absoluteSrcPaths: ReadonlyArray<string>): Promise<void>

  /**
   * Need to call `this.prepare()` in advance.
   * @param acceptedPattern
   */
  buildByPatterns(cwd: string, acceptedPattern: Iterable<string>): Promise<void>

  /**
   * Find asset by predicate function.
   * @param predicate
   */
  findAsset(predicate: (asset: Readonly<IAsset>) => boolean): Promise<IAsset | null>

  /**
   * Find the absolute source path by the given uri.
   * @param uri
   */
  findSrcPathByUri(uri: string): Promise<string | null>

  /**
   * Locate the asset by the given filepath.
   * @param absoluteSrcPath
   */
  resolveAsset(absoluteSrcPath: string): Promise<IAsset | null>

  /**
   * Need to call `this.prepare()` in advance.
   * @param acceptedPattern
   * @param shouldIgnore
   */
  watch(
    cwd: string,
    acceptedPattern: ReadonlyArray<string>,
    shouldIgnore?: IAssetWatchShouldIgnore,
  ): Promise<IAssetServiceWatcher>
}
