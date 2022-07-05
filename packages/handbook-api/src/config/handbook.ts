import type { SubSiteConfig, SubSiteConfigResolver, SubSiteSourceItem } from '@guanghechen/site-api'
import { resolveSubSiteConfig, resolveSubSiteSourceItem } from '@guanghechen/site-api'

export enum HandbookSourceType {
  /**
   * Post Asset
   */
  POST = 'post',
  /**
   * Image Asset
   */
  IMAGE = 'image',
  /**
   * fallback asset
   */
  FILE = 'file',
}

export type HandbookSourceItem = SubSiteSourceItem
export const handbookSourceTypes: HandbookSourceType[] = [
  HandbookSourceType.POST,
  HandbookSourceType.IMAGE,
  HandbookSourceType.FILE,
]

/**
 * Configuration of the handbook
 */
export type HandbookConfig = SubSiteConfig<HandbookSourceType>

const defaultHandbookConfig: HandbookConfig = {
  routeRoot: '/handbook',
  urlRoot: '/handbook',
  sourceRoot: 'handbook/source',
  dataRoot: 'handbook/data',
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
    },
    image: {
      sourceRoot: 'resource',
      dataRoot: 'resource/image/',
      pattern: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.svg'],
    },
    file: {
      sourceRoot: 'resource',
      dataRoot: 'resource/file/',
      pattern: ['**/*'],
    },
  },
}

/**
 * Resolve HandbookConfig
 *
 * @param rawConfig
 * @param sitePathConfig
 * @param defaultConfig
 */
export const resolveHandbookConfig: SubSiteConfigResolver<
  HandbookSourceType,
  HandbookSourceItem,
  HandbookConfig
> = (rawConfig = {}, sitePathConfig, defaultConfig = defaultHandbookConfig): HandbookConfig => {
  const subSiteConfig: SubSiteConfig = resolveSubSiteConfig<HandbookSourceType>(
    rawConfig,
    handbookSourceTypes,
    resolveSubSiteSourceItem,
    sitePathConfig,
    defaultConfig,
  )

  const result: HandbookConfig = {
    ...subSiteConfig,
  }
  return result
}
