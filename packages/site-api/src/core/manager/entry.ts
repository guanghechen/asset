import fs from 'fs-extra'
import { writeJSON } from '../../util/fs'
import type { EntryDataMap } from '../entity/entry'
import { AssetService } from '../service/asset'
import { CategoryService } from '../service/category'
import { TagService } from '../service/tag'


/**
 * EntryDataManager constructor
 */
export interface EntryDataManagerConstructor {
  /**
   * @param routeRoot           route path prefix
   * @param apiUrlRoot          api url prefix
   * @param dataMapFilepath     filepath of EntryDataMap
   * @param assetDataMapUrl     url for fetching asset.data.map
   * @param categoryDataMapUrl  url for fetching category.data.map
   * @param tagDataMapUrl       url for fetching tag.data.map
   * @param assetService
   * @param categoryService
   * @param tagService
   */
  new (
    routeRoot: string,
    apiUrlRoot: string,
    dataMapFilepath: string,
    assetDataMapUrl: string,
    categoryDataMapUrl: string,
    tagDataMapUrl: string,
    assetService: AssetService,
    categoryService: CategoryService,
    tagService: TagService,
  ): EntryDataManager
}


/**
 * Manage EntryDataItems
 */
export class EntryDataManager {
  protected readonly routeRoot: string
  protected readonly apiUrlRoot: string
  protected readonly dataMapFilepath: string
  protected readonly assetDataMapUrl: string
  protected readonly categoryDataMapUrl: string
  protected readonly tagDataMapUrl: string
  protected readonly assetService: AssetService
  protected readonly categoryService: CategoryService
  protected readonly tagService: TagService

  public constructor(
    routeRoot: string,
    apiUrlRoot: string,
    dataMapFilepath: string,
    assetDataMapUrl: string,
    categoryDataMapUrl: string,
    tagDataMapUrl: string,
    assetService: AssetService,
    categoryService: CategoryService,
    tagService: TagService,
  ) {
    this.routeRoot = routeRoot
    this.apiUrlRoot = apiUrlRoot
    this.dataMapFilepath = dataMapFilepath
    this.assetDataMapUrl = assetDataMapUrl
    this.categoryDataMapUrl = categoryDataMapUrl
    this.tagDataMapUrl = tagDataMapUrl
    this.assetService = assetService
    this.categoryService = categoryService
    this.tagService = tagService
  }

  /**
   * Load entry data map from entryDataMap filepath
   */
  public async load(): Promise<void> {
    const data: EntryDataMap = await fs.readJSON(this.dataMapFilepath)
    ; (this.routeRoot as string) = data.routeRoot
    ; (this.apiUrlRoot as string) = data.api.prefix
    ; (this.assetDataMapUrl as string) = data.api.assetDataMap
    ; (this.categoryDataMapUrl as string) = data.api.categoryDatMap
    ; (this.tagDataMapUrl as string) = data.api.tagDataMap
  }

  /**
   * Output entry data map into entryDataMap file
   */
  public async dump(): Promise<void> {
    const data: EntryDataMap = this.toDataMap()
    await writeJSON(this.dataMapFilepath, data)
  }

  /**
   * Return entry data map
   */
  public toDataMap(): EntryDataMap {
    const data: EntryDataMap = {
      routeRoot: this.routeRoot,
      api: {
        prefix: this.apiUrlRoot,
        assetDataMap: this.assetDataMapUrl,
        categoryDatMap: this.categoryDataMapUrl,
        tagDataMap: this.tagDataMapUrl,
      }
    }
    return data
  }
}
