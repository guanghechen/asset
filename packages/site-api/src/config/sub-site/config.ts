import { coverString, isNotEmptyString } from '@barusu/util-option'
import { resolveLocalPath, resolveUrlPath } from '../../util/path'
import type { SitePathConfig } from '../site'
import { SubSiteSourceItem, SubSiteSourceItemResolver } from './source-item'


/**
 * Sub site configuration
 */
export interface SubSiteConfig<
  SourceType extends string = string,
  SourceItem extends SubSiteSourceItem = SubSiteSourceItem,
> {
  /**
   * The root path of the sub-site
   */
  urlRoot: string
  /**
   * The root directory where the source files are located
   */
  sourceRoot: string
  /**
   * The root directory of the data files obtained by parsing the source files
   */
  dataRoot: string
  /**
   * Filepath of the AssetDataMap
   */
  assetDataMapFilepath: string
  /**
   * Filepath of the TagDataMap
   */
  tagDataMapFilepath: string
  /**
   * Filepath of the CategoryDataMap
   */
  categoryDataMapFilepath: string
  /**
   * Source items
   */
  source: Record<SourceType, SourceItem>
}


/**
 * Sub-site config resolver
 *
 * @param sitePathConfig  site path config
 * @param defaultConfig   default sub-site config
 * @param rawConfig       raw sub-site config
 */
export type SubSiteConfigResolver<
  SourceType extends string = string,
  SourceItem extends SubSiteSourceItem = SubSiteSourceItem,
  T extends SubSiteConfig<SourceType, SourceItem> = SubSiteConfig<SourceType, SourceItem>,
  > = (
    sitePathConfig: SitePathConfig,
    defaultConfig?: T,
    rawConfig?: Partial<T>,
  ) => T


/**
 * Create default sub site config
 *
 * @param name
 */
export function createDefaultSubSiteConfig(name: string): SubSiteConfig {
  const defaultConfig: SubSiteConfig = {
    urlRoot: '/' + name,
    sourceRoot: name + '/source',
    dataRoot: name + '/data',
    assetDataMapFilepath: 'asset.map.json',
    tagDataMapFilepath: 'tag.map.json',
    categoryDataMapFilepath: 'category.map.json',
    source: {},
  }
  return defaultConfig
}


/**
 * Resolve BlogConfig
 * @param rawConfig
 */
export function resolveSubSiteConfig<
  SourceType extends string = string,
  SourceItem extends SubSiteSourceItem = SubSiteSourceItem,
>(
  sourceItemTypes: SourceType[],
  resolveSourceItem: SubSiteSourceItemResolver<SourceItem>,
  sitePathConfig: SitePathConfig,
  defaultConfig: SubSiteConfig<SourceType, SourceItem>,
  rawConfig: Partial<SubSiteConfig<SourceType, SourceItem>> = {},
): SubSiteConfig<SourceType, SourceItem> {
  // resolve urlRoot (absolute url path)
  const urlRoot = resolveUrlPath(
    sitePathConfig.urlRoot,
    coverString(defaultConfig.urlRoot, rawConfig.urlRoot, isNotEmptyString))

  // resolve sourceRoot (absolute filepath)
  const sourceRoot = resolveLocalPath(
    sitePathConfig.workspace,
    coverString(defaultConfig.sourceRoot, rawConfig.sourceRoot, isNotEmptyString))

  // resolve dataRoot (absolute filepath)
  const dataRoot = resolveLocalPath(
    sitePathConfig.workspace,
    coverString(defaultConfig.dataRoot, rawConfig.dataRoot, isNotEmptyString))

  // resolve assetDataMapFilepath (absolute filepath)
  const assetDataMapFilepath = resolveLocalPath(
    dataRoot,
    coverString(
      defaultConfig.assetDataMapFilepath,
      rawConfig.assetDataMapFilepath,
      isNotEmptyString
    )
  )

  // resolve tagDataMapFilepath (absolute filepath)
  const tagDataMapFilepath = resolveLocalPath(
    dataRoot,
    coverString(
      defaultConfig.tagDataMapFilepath,
      rawConfig.tagDataMapFilepath,
      isNotEmptyString
    )
  )

  // resolve categoryDataMapFilepath (absolute filepath)
  const categoryDataMapFilepath = resolveLocalPath(
    dataRoot,
    coverString(
      defaultConfig.categoryDataMapFilepath,
      rawConfig.categoryDataMapFilepath,
      isNotEmptyString
    )
  )

  // resolve source
  const source: Record<SourceType, SourceItem> = {} as any
  const rawSources: Record<SourceType, Partial<SourceItem>> = rawConfig.source || {} as any
  for (const sourceType of sourceItemTypes) {
    source[sourceType] = resolveSourceItem!(
      sourceRoot,
      dataRoot,
      defaultConfig.source[sourceType],
      rawSources[sourceType],
    )
  }

  const result: SubSiteConfig<SourceType, SourceItem> = {
    urlRoot,
    sourceRoot,
    dataRoot,
    assetDataMapFilepath,
    tagDataMapFilepath,
    categoryDataMapFilepath,
    source,
  }
  return result
}
