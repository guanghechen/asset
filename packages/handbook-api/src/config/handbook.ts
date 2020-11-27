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
    }
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
> = (
  rawConfig: Partial<HandbookConfig> = {},
  sitePathConfig: SitePathConfig,
  defaultConfig: HandbookConfig = defaultHandbookConfig,
): HandbookConfig => {
  const subSiteConfig: SubSiteConfig =
    resolveSubSiteConfig<HandbookSourceType, HandbookSourceItem>(
      rawConfig, handbookSourceTypes, resolveSubSiteSourceItem,
      sitePathConfig, defaultConfig
    )

  const result: HandbookConfig = {
    ...subSiteConfig,
  }
  return result
}
