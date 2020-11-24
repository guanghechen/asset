import chalk from 'chalk'
import chokidar from 'chokidar'
import fs from 'fs-extra'
import type { SubSiteConfig } from '../config/sub-site/config'
import { resolveUniversalPath, resolveUrlPath } from '../util/path'
import { AssetDataManager } from './manager/asset'
import { CategoryDataManager } from './manager/category'
import { EntryDataManager } from './manager/entry'
import { TagDataManager } from './manager/tag'
import { AssetParser } from './parser'
import { AssetProcessor } from './processor'
import { AssetService } from './service/asset'
import { CategoryService } from './service/category'
import { TagService } from './service/tag'


export class AssetDataProvider<C extends SubSiteConfig> {
  protected readonly subSiteConfig: C
  protected readonly assetParser: AssetParser

  public readonly assetService: AssetService
  public readonly tagService: TagService
  public readonly categoryService: CategoryService

  public constructor(subSiteConfig: C, processors: AssetProcessor[]) {
    const {
      urlRoot,
      dataRoot,
      sourceRoot,
      entryDataMapFilepath,
      assetDataMapFilepath,
      categoryDataMapFilepath,
      tagDataMapFilepath,
    } = subSiteConfig

    // Create AssetService
    const assetDataManager = new AssetDataManager(sourceRoot, assetDataMapFilepath)
    const assetService = new AssetService(assetDataManager)

    // Create CategoryService
    const categoryDataManager = new CategoryDataManager(categoryDataMapFilepath)
    const categoryService = new CategoryService(categoryDataManager)

    // Create TagService
    const tagDataManager = new TagDataManager(tagDataMapFilepath)
    const tagService = new TagService(tagDataManager)

    // Create EntryDataManager
    const entryDataManager = new EntryDataManager(
      entryDataMapFilepath,
      urlRoot,
      resolveUrlPath(urlRoot, resolveUniversalPath(dataRoot, assetDataMapFilepath)),
      resolveUrlPath(urlRoot, resolveUniversalPath(dataRoot, categoryDataMapFilepath)),
      resolveUrlPath(urlRoot, resolveUniversalPath(dataRoot, tagDataMapFilepath)),
    )

    // Create AssetParser
    const assetParser = new AssetParser(
      processors,
      entryDataManager, assetDataManager,
      categoryDataManager, tagDataManager
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
      console.info(chalk.yellow(`clearing ${ subSiteConfig.dataRoot }`))
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
      console.info(chalk.green(`rebuilding ${ subSiteConfig.dataRoot }`))
      await this.build(true)
    }

    // loading data
    console.info(chalk.green(`loading ${ subSiteConfig.dataRoot }`))
    await assetParser.load()

    // watching source change
    console.info(chalk.green(`watching ${ subSiteConfig.sourceRoot }`))
    assetParser.watch(subSiteConfig.sourceRoot, watchOptions, () => assetParser.dump())
  }

  /**
   * Close watcher
   */
  public close(): Promise<void> {
    console.info(chalk.green('closing watch mode'))
    return this.assetParser.close()
  }
}
