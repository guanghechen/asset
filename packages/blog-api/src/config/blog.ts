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
  urlRoot: '/blog',
  sourceRoot: 'blog/source',
  dataRoot: 'blog/data',
  assetDataMapFilepath: 'asset.map.json',
  tagDataMapFilepath: 'tag.map.json',
  categoryDataMapFilepath: 'category.map.json',
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
 * @param rawConfig
 */
export const resolveBlogConfig: SubSiteConfigResolver<
  BlogSourceType,
  BlogSourceItem,
  BlogConfig
  > = (
  sitePathConfig: SitePathConfig,
  defaultConfig: BlogConfig = defaultBlogConfig,
  rawConfig: Partial<BlogConfig> = {},
): BlogConfig => {
  const subSiteConfig: SubSiteConfig = resolveSubSiteConfig<BlogSourceType, BlogSourceItem>(
    blogSourceTypes, resolveSubSiteSourceItem, sitePathConfig, defaultConfig, rawConfig)

  const result: BlogConfig = {
    ...subSiteConfig,
  }
  return result
}
