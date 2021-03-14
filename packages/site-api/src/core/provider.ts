import chalk from 'chalk'
import type chokidar from 'chokidar'
import fs from 'fs-extra'
import type { SubSiteConfig } from '../config/sub-site/config'
import { resolveUniversalPath, resolveUrlPath } from '../util/path'
import type { AssetDataManagerConstructor } from './manager/asset'
import { AssetDataManager } from './manager/asset'
import type { CategoryDataManagerConstructor } from './manager/category'
import { CategoryDataManager } from './manager/category'
import type { EntryDataManagerConstructor } from './manager/entry'
import { EntryDataManager } from './manager/entry'
import type { TagDataManagerConstructor } from './manager/tag'
import { TagDataManager } from './manager/tag'
import { AssetParser } from './parser'
import type { AssetProcessor } from './processor'
import type { AssetServiceConstructor } from './service/asset'
import { AssetService } from './service/asset'
import type { CategoryServiceConstructor } from './service/category'
import { CategoryService } from './service/category'
import type { TagServiceConstructor } from './service/tag'
import { TagService } from './service/tag'

export interface AssetDataProviderProps<C extends SubSiteConfig> {
  /**
   * Sub site config
   */
  subSiteConfig: C
  /**
   * Asset processors
   */
  processors: AssetProcessor[]
  AssetDataManagerImpl?: AssetDataManagerConstructor
  CategoryDataManagerImpl?: CategoryDataManagerConstructor
  EntryDataManagerImpl?: EntryDataManagerConstructor
  TagDataManagerImpl?: TagDataManagerConstructor
  AssetServiceImpl?: AssetServiceConstructor
  CategoryServiceImpl?: CategoryServiceConstructor
  TagServiceImpl?: TagServiceConstructor
}

export class AssetDataProvider<C extends SubSiteConfig> {
  protected readonly subSiteConfig: C
  protected readonly assetParser: AssetParser

  public readonly assetService: AssetService
  public readonly categoryService: CategoryService
  public readonly tagService: TagService

  constructor(props: AssetDataProviderProps<C>) {
    const {
      subSiteConfig,
      processors,
      AssetDataManagerImpl = AssetDataManager,
      CategoryDataManagerImpl = CategoryDataManager,
      EntryDataManagerImpl = EntryDataManager,
      TagDataManagerImpl = TagDataManager,
      AssetServiceImpl = AssetService,
      CategoryServiceImpl = CategoryService,
      TagServiceImpl = TagService,
    } = props

    const {
      routeRoot,
      urlRoot,
      dataRoot,
      sourceRoot,
      entryDataMapFilepath,
      assetDataMapFilepath,
      categoryDataMapFilepath,
      tagDataMapFilepath,
    } = subSiteConfig

    // Create AssetService
    const assetDataManager = new AssetDataManagerImpl(
      sourceRoot,
      assetDataMapFilepath,
    )
    const assetService: AssetService = new AssetServiceImpl(assetDataManager)

    // Create CategoryService
    const categoryDataManager = new CategoryDataManagerImpl(
      categoryDataMapFilepath,
    )
    const categoryService: CategoryService = new CategoryServiceImpl(
      categoryDataManager,
    )

    // Create TagService
    const tagDataManager = new TagDataManagerImpl(tagDataMapFilepath)
    const tagService: TagService = new TagServiceImpl(tagDataManager)

    // Create EntryDataManager
    const entryDataManager = new EntryDataManagerImpl(
      routeRoot,
      urlRoot,
      entryDataMapFilepath,
      resolveUrlPath(
        routeRoot,
        resolveUniversalPath(dataRoot, assetDataMapFilepath),
      ),
      resolveUrlPath(
        routeRoot,
        resolveUniversalPath(dataRoot, categoryDataMapFilepath),
      ),
      resolveUrlPath(
        routeRoot,
        resolveUniversalPath(dataRoot, tagDataMapFilepath),
      ),
      assetService,
      categoryService,
      tagService,
    )

    // Create AssetParser
    const assetParser = new AssetParser(
      processors,
      entryDataManager,
      assetDataManager,
      categoryDataManager,
      tagDataManager,
    )

    this.subSiteConfig = subSiteConfig
    this.assetService = assetService
    this.tagService = tagService
    this.categoryService = categoryService
    this.assetParser = assetParser
  }

  /**
   * Generate data and dataMap from source files
   *
   * @param clearDataRoot   clear dataRoot before building
   */
  public async build(clearDataRoot = false): Promise<void> {
    const { assetParser, subSiteConfig } = this

    // clear dataRoot
    if (clearDataRoot && fs.existsSync(subSiteConfig.dataRoot)) {
      console.info(chalk.yellow(`clearing ${subSiteConfig.dataRoot}`))
      await fs.remove(subSiteConfig.dataRoot)
    }

    await assetParser.scan(subSiteConfig.sourceRoot)
    await assetParser.dump()
  }

  /**
   * Watch source data change, and trigger dynamic update
   *
   * @param clearStart    should rebuild data dir before watching
   * @param watchOptions  options for chokidar.WatchOptions
   */
  public async watch(
    clearStart = true,
    watchOptions: chokidar.WatchOptions = {},
  ): Promise<void> {
    const { assetParser, subSiteConfig } = this

    // building data
    if (clearStart) {
      console.info(chalk.green(`rebuilding ${subSiteConfig.dataRoot}`))
      await this.build(true)
    }

    // loading data
    console.info(chalk.green(`loading ${subSiteConfig.dataRoot}`))
    await assetParser.load()

    // watching source change
    console.info(chalk.green(`watching ${subSiteConfig.sourceRoot}`))
    assetParser.watch(subSiteConfig.sourceRoot, watchOptions, () =>
      assetParser.dump(),
    )
  }

  /**
   * Close watcher
   */
  public close(): Promise<void> {
    console.info(chalk.green('closing watch mode'))
    return this.assetParser.close()
  }
}
