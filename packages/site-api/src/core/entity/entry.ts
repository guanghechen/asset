/**
 * Entry data map
 */
export interface EntryDataMap {
  /**
   * urls
   */
  api: {
    /**
     * The root url path of the site
     */
    prefix: string
    /**
     * url for fetching asset data map
     */
    assetDataMap: string
    /**
     * url for fetching category data map
     */
    categoryDatMap: string
    /**
     * url for fetching tag data map
     */
    tagDataMap: string
  }
}
