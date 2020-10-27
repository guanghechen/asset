import {
  SitePathConfig,
  SubSiteConfig,
  SubSiteConfigResolver,
  SubSiteSourceItem,
  resolveSubSiteConfig,
  resolveSubSiteSourceItem,
} from '@guanghechen/site-api'


export enum HandbookSourceType {
  /**
   * Post Asset
   */
  POST = 'post',
}


export type HandbookSourceItem = SubSiteSourceItem
export const handbookSourceTypes: HandbookSourceType[] = [
  HandbookSourceType.POST
]


/**
 * Configuration of the handbook
 */
export interface HandbookConfig extends SubSiteConfig<HandbookSourceType, HandbookSourceItem> {

}


const defaultHandbookConfig: HandbookConfig = {
  urlRoot: '/handbook',
  sourceRoot: 'handbook/source',
  dataRoot: 'handbook/data',
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
 * Resolve HandbookConfig
 * @param rawConfig
 */
export const resolveHandbookConfig: SubSiteConfigResolver<
  HandbookSourceType,
  HandbookSourceItem,
  HandbookConfig
  > = (
  sitePathConfig: SitePathConfig,
  defaultConfig: HandbookConfig = defaultHandbookConfig,
  rawConfig: Partial<HandbookConfig> = {},
): HandbookConfig => {
  const subSiteConfig: SubSiteConfig = resolveSubSiteConfig<HandbookSourceType, HandbookSourceItem>(
    handbookSourceTypes, resolveSubSiteSourceItem, sitePathConfig, defaultConfig, rawConfig)

  const result: HandbookConfig = {
    ...subSiteConfig,
  }
  return result
}
