import { coverString, isNotEmptyString } from '@barusu/util-option'
import {
  SitePathConfig,
  SubSiteConfig,
  SubSiteConfigResolver,
  SubSiteSourceItem,
  resolveSubSiteConfig,
  resolveSubSiteSourceItem,
  resolveLocalPath,
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
  /**
   * Filepath of the entry data of the handbook sub-site
   */
  entryDataFilepath: string
}


const defaultHandbookConfig: HandbookConfig = {
  urlRoot: '/handbook',
  sourceRoot: 'handbook/source',
  dataRoot: 'handbook/data',
  entryDataFilepath: 'entry.map.json',
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
  const subSiteConfig: SubSiteConfig = resolveSubSiteConfig<HandbookSourceType, HandbookSourceItem>(
    rawConfig, handbookSourceTypes, resolveSubSiteSourceItem, sitePathConfig, defaultConfig)

  const result: HandbookConfig = {
    entryDataFilepath: resolveLocalPath(
      subSiteConfig.dataRoot,
      coverString(
        defaultHandbookConfig.entryDataFilepath,
        rawConfig.entryDataFilepath,
        isNotEmptyString
      )
    ),
    ...subSiteConfig,
  }
  return result
}
