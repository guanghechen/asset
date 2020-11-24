import { EntryDataMap } from '@guanghechen/site-api'


/**
 * Parent node of HandbookMenu
 */
export interface HandbookMenuParentNode {
  /**
   * Title
   */
  title: string
  /**
   * child data
   */
  children: (HandbookMenuParentNode | HandbookMenuLeafNode)[]
}


/**
 * Leaf node of HandbookMenu
 */
export interface HandbookMenuLeafNode {
  /**
   * Title
   */
  title: string
  /**
   * Route path
   */
  pathname: string
  /**
   * Data source url
   */
  source: string
}


/**
 * Handbook entry data
 */
export interface HandbookEntryDataMap extends EntryDataMap {
  /**
   * Handbook menu data
   */
  menu: {
    /**
     * Menu items
     */
    items: (HandbookMenuParentNode | HandbookMenuLeafNode)[]
  }
}
