import {
  SitePathConfig,
  SubSiteConfig,
  SubSiteConfigResolver,
  SubSiteSourceItem,
  resolveSubSiteConfig,
  resolveSubSiteSourceItem,
} from '@guanghechen/site-api'


export enum BlogSourceType {
  /**
   * Post Asset
   */
  POST = 'post',
}


export type BlogSourceItem = SubSiteSourceItem
export const blogSourceTypes: BlogSourceType[] = [
  BlogSourceType.POST
]


/**
 * Configuration of the blog
 */
export interface BlogConfig extends SubSiteConfig<BlogSourceType, BlogSourceItem> {

}


const defaultBlogConfig: BlogConfig = {
  routeRoot: '/blog',
  urlRoot: '/blog',
  sourceRoot: 'blog/source',
  dataRoot: 'blog/data',
  entryDataMapFilepath: 'entry.map.json',
  assetDataMapFilepath: 'asset.map.json',
  categoryDataMapFilepath: 'category.map.json',
  tagDataMapFilepath: 'tag.map.json',
  source: {
    post: {
      sourceRoot: 'post/',
      dataRoot: 'post/',
      pattern: ['**/*.md'],
      encoding: 'utf-8',
    }
  },
}


/**
 * Resolve BlogConfig
 *
 * @param rawConfig
 * @param sitePathConfig
 * @param defaultConfig
 */
export const resolveBlogConfig: SubSiteConfigResolver<
  BlogSourceType,
  BlogSourceItem,
  BlogConfig
> = (
  rawConfig = {},
  sitePathConfig,
  defaultConfig = defaultBlogConfig,
): BlogConfig => {
  const subSiteConfig: SubSiteConfig = resolveSubSiteConfig<BlogSourceType, BlogSourceItem>(
    rawConfig, blogSourceTypes, resolveSubSiteSourceItem, sitePathConfig, defaultConfig)

  const result: BlogConfig = {
    ...subSiteConfig,
  }
  return result
}
