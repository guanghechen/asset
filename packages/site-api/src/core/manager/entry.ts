import fs from 'fs-extra'
import { writeJSON } from '../../util/fs'
import type { EntryDataMap } from '../entity/entry'


/**
 * Manage EntryDataItems
 */
export class EntryDataManager {
  protected readonly dataMapFilepath: string
  protected readonly urlRoot: string
  protected readonly assetDataMapUrl: string
  protected readonly categoryDataMapUrl: string
  protected readonly tagDataMapUrl: string

  public constructor(
    dataMapFilepath: string,
    urlRoot: string,
    assetDataMapUrl: string,
    categoryDataMapUrl: string,
    tagDataMapUrl: string,
  ) {
    this.dataMapFilepath = dataMapFilepath
    this.urlRoot = urlRoot
    this.assetDataMapUrl = assetDataMapUrl
    this.categoryDataMapUrl = categoryDataMapUrl
    this.tagDataMapUrl = tagDataMapUrl
  }

  /**
   * Load entry data map from entryDataMap filepath
   */
  public async load(): Promise<void> {
    const data: EntryDataMap = await fs.readJSON(this.dataMapFilepath)
    ; (this.urlRoot as string) = data.api.prefix
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
      api: {
        prefix: this.urlRoot,
        assetDataMap: this.assetDataMapUrl,
        categoryDatMap: this.categoryDataMapUrl,
        tagDataMap: this.tagDataMapUrl,
      }
    }
    return data
  }
}
