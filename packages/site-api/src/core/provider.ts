import chalk from 'chalk'
import chokidar from 'chokidar'
import fs from 'fs-extra'
import type { SubSiteConfig } from '../config/sub-site'
import type { CategoryDataItem } from './entity/category'
import type { TagDataItem } from './entity/tag'
import { AssetDataManager } from './manager/asset'
import { CategoryDataManager } from './manager/category'
import { TagDataManager } from './manager/tag'
import { AssetParser } from './parser'
import { AssetProcessor } from './processor'
import { AssetService } from './service/asset'
import { CategoryService } from './service/category'
import { TagService } from './service/tag'


export class AssetDataProvider<C extends SubSiteConfig> {
  protected readonly subSiteConfig: C
  protected readonly assetService: AssetService
  protected readonly tagService: TagService
  protected readonly categoryService: CategoryService
  protected readonly assetParser: AssetParser

  public constructor(
    subSiteConfig: C,
    processors: AssetProcessor[],
  ) {
    const {
      sourceRoot,
      assetDataMapFilepath,
      categoryDataMapFilepath,
      tagDataMapFilepath,
    } = subSiteConfig

    // Create AssetService
    const assetDataManager = new AssetDataManager(sourceRoot, assetDataMapFilepath, false)
    const assetService = new AssetService(assetDataManager)

    // Create TagService
    const tagDataManager = new TagDataManager(tagDataMapFilepath)
    const tagService = new TagService(tagDataManager)

    // Create CategoryService
    const categoryDataManager = new CategoryDataManager(categoryDataMapFilepath)
    const categoryService = new CategoryService(categoryDataManager)

    // Create AssetParser
    const assetParser = new AssetParser(
      processors, assetDataManager, tagDataManager, categoryDataManager)

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
    if (clearDataRoot) {
      console.log(chalk.yellow(`clearing ${ subSiteConfig.dataRoot }`))
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
      console.log(chalk.green(`rebuilding ${ subSiteConfig.dataRoot }`))
      await this.build(true)
    }

    // loading data
    console.log(chalk.green(`loading ${ subSiteConfig.dataRoot }`))
    await assetParser.load()

    // watching source change
    console.log(chalk.green(`watching ${ subSiteConfig.sourceRoot }`))
    assetParser.watch(subSiteConfig.sourceRoot, watchOptions, () => assetParser.dump())
  }

  /**
   * Close watcher
   */
  public close(): Promise<void> {
    return this.assetParser.close()
  }

  public fetchCategories(): CategoryDataItem[] {
    return this.categoryService.fetchCategories()
  }

  public fetchTags(): TagDataItem[] {
    return this.tagService.fetchTags()
  }
}
