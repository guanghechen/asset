import { SiteConfig } from '../config/site'


/**
 * SiteData
 */
export interface SiteData {
  /**
   * site title
   */
  title: string
  /**
   * site description
   */
  description: string
  /**
   * site author
   */
  author: string
}


/**
 * Calc SiteData from SiteConfig
 * @param config
 */
export function resolveSiteData(config: SiteConfig): SiteData {
  const { title, description, author } = config
  const result: SiteData = { title, description, author }
  return result
}
