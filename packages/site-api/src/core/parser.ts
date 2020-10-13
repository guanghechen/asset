import chokidar from 'chokidar'
import dayjs from 'dayjs'
import fs from 'fs-extra'
import globby from 'globby'
import path from 'path'
import { resolveLocalPath } from '../util/path'
import { createSerialExecutor } from '../util/sync'
import { calcFingerprint } from '../util/uuid'
import type { AssetLocation } from './entity/_types'
import type { AssetDataItem, RoughAssetDataItem } from './entity/asset'
import { CategoryDataItem } from './entity/category'
import { TagDataItem } from './entity/tag'
import type { AssetDataManager } from './manager/asset'
import type { CategoryDataManager } from './manager/category'
import type { TagDataManager } from './manager/tag'
import type { AssetProcessor } from './processor'


export class AssetParser {
  protected readonly processors: AssetProcessor[]
  protected readonly assetDataManager: AssetDataManager
  protected readonly tagDataManager: TagDataManager
  protected readonly categoryDataManager: CategoryDataManager
  protected watcher: chokidar.FSWatcher | null = null

  public constructor(
    processors: AssetProcessor[],
    assetDataManager: AssetDataManager,
    tagDataManager: TagDataManager,
    categoryDataManager: CategoryDataManager,
  ) {
    this.processors = processors
    this.assetDataManager = assetDataManager
    this.tagDataManager = tagDataManager
    this.categoryDataManager = categoryDataManager
  }

  /**
   * Load data map from data map files
   */
  public async load(): Promise<void> {
    await Promise.all([
      this.assetDataManager.load(),
      this.tagDataManager.load(),
      this.categoryDataManager.load(),
    ])
  }

  /**
   * Output data maps into data map files
   */
  public async dump(): Promise<void> {
    await Promise.all([
      this.assetDataManager.dump(),
      this.tagDataManager.dump(),
      this.categoryDataManager.dump(),
    ])
  }

  /**
   * Scan specified source root directory
   *
   * @param srcRoot
   */
  public async scan(srcRoot: string): Promise<void> {
    const filepaths = await globby(['**/*'], {
      cwd: srcRoot,
      onlyFiles: true,
    })

    for (const filepath of filepaths) {
      const absoluteFilepath = resolveLocalPath(srcRoot, filepath)
      this.touchFile(absoluteFilepath)
    }
  }

  /**
   * Watch mode
   */
  public watch(
    rootDir: string,
    watchOptions: chokidar.WatchOptions,
    afterChanged?: () => void | Promise<void>
  ): void {
    if (this.watcher != null) return

    type TaskData = { type: 'touch' | 'remove', filepath: string }
    const squashable = (currentData: TaskData, nextData: TaskData): boolean => {
      if (currentData.filepath !== nextData.filepath) return false
      if (currentData.type === nextData.type) return true
      if (nextData.type === 'remove') return true
      return false
    }

    const serialExecutor = createSerialExecutor<TaskData>(
      squashable,
      afterChanged
    )

    this.watcher = chokidar.watch(rootDir, {
      persistent: true,
      ...watchOptions,
    })
      .on('add', (filepath: string) => {
        serialExecutor.addTask({
          data: { type: 'touch', filepath },
          execute: () => this.touchFile(filepath),
        })
      })
      .on('change', (filepath: string) => {
        serialExecutor.addTask({
          data: { type: 'touch', filepath },
          execute: () => this.touchFile(filepath),
        })
      })
      .on('unlink', (filepath: string) => {
        serialExecutor.addTask({
          data: { type: 'remove', filepath },
          execute: () => this.removeFile(filepath)
        })
      })
  }

  /**
   * Close watcher
   */
  public async close(): Promise<void> {
    await this.watcher?.close()
    this.watcher = null
  }

  /**
   * Add asset file
   *
   * @param filepath
   */
  public touchFile(filepath: string): void {
    const { assetDataManager, tagDataManager, categoryDataManager } = this
    for (const processor of this.processors) {
      if (!processor.processable(filepath)) continue

      const location: AssetLocation = assetDataManager.calcLocation(filepath)
      const existedAsset = assetDataManager.locate(location)
      const stat = fs.statSync(filepath)
      const lastModifiedTime = stat.mtimeMs

      // If the asset exists, check if it has changed
      if (existedAsset != null) {
        // The file is not changed, so no update needed
        if (existedAsset.lastModifiedTime >= lastModifiedTime) continue
      }

      const rawContent: Buffer = fs.readFileSync(filepath)
      const fingerprint: string = calcFingerprint(rawContent)

      // Check if its content changed
      if (existedAsset != null) {
        // The file is not changed, so no update needed
        if (existedAsset.fingerprint === fingerprint) continue
      }

      const createAt = existedAsset != null
        ? existedAsset.createAt
        : dayjs(stat.atimeMs).toDate().toISOString()

      const updateAt = existedAsset != null
        ? existedAsset.updateAt
        : dayjs(stat.mtimeMs).toDate().toISOString()

      const title = existedAsset != null
        ? existedAsset.title
        : path.parse(filepath).name

      const roughAsset: RoughAssetDataItem = {
        fingerprint,
        location,
        lastModifiedTime,
        createAt,
        updateAt,
        title,
        tags: existedAsset != null ? existedAsset.tags : [],
        categories: existedAsset != null ? existedAsset.categories : [],
      }

      const [asset, tags, categoriesList] = processor.process(
        filepath, rawContent, roughAsset,
        tagDataManager, categoryDataManager, assetDataManager)

      if (existedAsset != null) this._remove(existedAsset)
      this._insert(asset, tags, categoriesList)
      break
    }
  }

  /**
   * Remove asset file
   *
   * @param filepath
   */
  public removeFile(filepath: string): void {
    const location: AssetLocation = this.assetDataManager.calcLocation(filepath)
    const asset: AssetDataItem | null = this.assetDataManager.locate(location)
    if (asset == null) return
    this._remove(asset)
  }

  /**
   * Insert new asset, tag and category
   *
   * @param asset
   * @param tags
   * @param categoriesList
   */
  protected _insert(
    asset: AssetDataItem,
    tags: TagDataItem[],
    categoriesList: CategoryDataItem[][],
  ): void {
    // Insert asset
    this.assetDataManager.insert(asset)

    // Insert tag list
    for (const tag of tags) {
      this.tagDataManager.insert(tag, asset.uuid)
    }

    // Insert categories list
    for (const categories of categoriesList) {
      if (categories.length <= 0) continue
      this.categoryDataManager.insert(categories, asset.uuid)
    }
  }

  /**
   * Remove asset, tag and category
   *
   * @param asset
   * @param tags
   * @param categoriesList
   */
  protected _remove(asset: AssetDataItem): void {
    // Remove asset
    this.assetDataManager.remove(asset.uuid)

    // Remove Tag
    for (const tag of asset.tags) {
      this.tagDataManager.remove(tag, asset.uuid)
    }

    // Remove category
    for (const categories of asset.categories) {
      const category = categories[categories.length - 1]
      this.categoryDataManager.remove(category, asset.uuid)
    }
  }
}