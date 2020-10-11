import {
  cover,
  coverString,
  isNotEmptyArray,
  isNotEmptyString,
} from '@barusu/util-option'
import {
  SitePathConfig,
  SubSiteConfig,
  SubSiteConfigResolver,
  resolveLocalPath,
  resolveSubSiteConfig,
} from '@guanghechen/site-api'


/**
 * source item
 */
export interface BlogSourceItem {
  /**
   * Root directory of the source files
   */
  sourceRoot: string
  /**
   * Root directory of the data files
   */
  dataRoot: string
  /**
   * Glob patterns matching source files
   */
  pattern: string[]
  /**
   * Encoding of source files
   */
  encoding?: BufferEncoding
}


/**
 * Configuration of the blog
 */
export interface BlogConfig extends SubSiteConfig {
  /**
   * Source patterns
   */
  source: {
    /**
     *
     */
    post: BlogSourceItem
  }
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
export const resolveBlogConfig: SubSiteConfigResolver<BlogConfig> = (
  sitePathConfig: SitePathConfig,
  defaultConfig: BlogConfig = defaultBlogConfig,
  rawConfig: Partial<BlogConfig> = {},
): BlogConfig => {
  const subSiteConfig: SubSiteConfig = resolveSubSiteConfig(
    sitePathConfig, defaultConfig, rawConfig)
  const resolveSourceItem = (key: keyof BlogConfig['source']): BlogSourceItem => {
    const rawSourceItem: BlogSourceItem = (rawConfig.source || {})[key] || {} as any
    const sourceRoot: string = resolveLocalPath(
      subSiteConfig.sourceRoot,
      coverString(
        defaultConfig.source[key].sourceRoot,
        rawSourceItem.sourceRoot,
        isNotEmptyString)
    )
    const dataRoot: string = resolveLocalPath(
      subSiteConfig.dataRoot,
      coverString(
        defaultConfig.source[key].dataRoot,
        rawSourceItem.dataRoot,
        isNotEmptyString)
    )
    const pattern: string[] = cover<string[]>(
      defaultConfig.source[key].pattern, rawSourceItem.pattern, isNotEmptyArray)
    const encoding: BufferEncoding | undefined = cover<BufferEncoding | undefined>(
      defaultConfig.source[key].encoding, rawSourceItem.encoding, isNotEmptyString)

    return { sourceRoot: sourceRoot, dataRoot: dataRoot, pattern, encoding }
  }

  // resolve source
  const source: BlogConfig['source'] = {
    post: resolveSourceItem('post'),
  }

  const result: BlogConfig = {
    ...subSiteConfig,
    source,
  }
  return result
}
