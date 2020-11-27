/**
 * Entry data map
 */
export interface EntryDataMap {
  /**
   * The root route path of the site
   */
  routeRoot: string
  /**
   * urls
   */
  api: {
    /**
     * The root api url path of the site
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
