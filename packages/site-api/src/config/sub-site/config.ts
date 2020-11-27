import { coverString, isNotEmptyString } from '@barusu/util-option'
import { resolveLocalPath, resolveUrlPath } from '../../util/path'
import type { SitePathConfig } from '../site'
import type {
  SubSiteSourceItem,
  SubSiteSourceItemResolver,
} from './source-item'


/**
 * Sub site configuration
 */
export interface SubSiteConfig<
  SourceType extends string = string,
  SourceItem extends SubSiteSourceItem = SubSiteSourceItem,
> {
  /**
   * The root route path of the sub-site
   */
  routeRoot: string
  /**
   * The root api url path of the sub-site
   */
  apiUrlRoot: string
  /**
   * The root directory where the source files are located
   */
  sourceRoot: string
  /**
   * The root directory of the data files obtained by parsing the source files
   */
  dataRoot: string
  /**
   * Filepath of the EntryDataMap
   */
  entryDataMapFilepath: string
  /**
   * Filepath of the AssetDataMap
   */
  assetDataMapFilepath: string
  /**
   * Filepath of the CategoryDataMap
   */
  categoryDataMapFilepath: string
  /**
   * Filepath of the TagDataMap
   */
  tagDataMapFilepath: string
  /**
   * Source items
   */
  source: Record<SourceType, SourceItem>
}


/**
 * Sub-site config resolver
 *
 * @param rawConfig       raw sub-site config
 * @param sitePathConfig  site path config
 * @param defaultConfig   default sub-site config
 */
export type SubSiteConfigResolver<
  SourceType extends string = string,
  SourceItem extends SubSiteSourceItem = SubSiteSourceItem,
  T extends SubSiteConfig<SourceType, SourceItem> = SubSiteConfig<SourceType, SourceItem>,
  > = (
    rawConfig: Partial<T>,
    sitePathConfig: SitePathConfig,
    defaultConfig?: T,
  ) => T


/**
 * Create default sub site config
 *
 * @param name
 */
export function createDefaultSubSiteConfig(name: string): SubSiteConfig {
  const defaultConfig: SubSiteConfig = {
    routeRoot: '/' + name,
    apiUrlRoot: '/' + name,
    sourceRoot: name + '/source',
    dataRoot: name + '/data',
    entryDataMapFilepath: 'entry.map.json',
    assetDataMapFilepath: 'asset.map.json',
    categoryDataMapFilepath: 'category.map.json',
    tagDataMapFilepath: 'tag.map.json',
    source: {},
  }
  return defaultConfig
}


/**
 * Resolve sub site config
 *
 * @param rawConfig
 * @param sourceItemTypes
 * @param resolveSourceItem
 * @param sitePathConfig
 * @param defaultConfig
 */
export function resolveSubSiteConfig<
  SourceType extends string = string,
  SourceItem extends SubSiteSourceItem = SubSiteSourceItem,
>(
  rawConfig: Partial<SubSiteConfig<SourceType, SourceItem>> = {},
  sourceItemTypes: SourceType[],
  resolveSourceItem: SubSiteSourceItemResolver<SourceItem>,
  sitePathConfig: SitePathConfig,
  defaultConfig: SubSiteConfig<SourceType, SourceItem>,
): SubSiteConfig<SourceType, SourceItem> {
  // resolve routeRoot (absolute url path)
  const routeRoot = resolveUrlPath(
    sitePathConfig.routeRoot,
    coverString(defaultConfig.routeRoot, rawConfig.routeRoot, isNotEmptyString))

  // resolve apiUrlRoot (absolute url path)
  const apiUrlRoot = resolveUrlPath(
    sitePathConfig.apiUrlRoot,
    coverString(defaultConfig.apiUrlRoot, rawConfig.apiUrlRoot, isNotEmptyString))

  // resolve sourceRoot (absolute filepath)
  const sourceRoot = resolveLocalPath(
    sitePathConfig.workspace,
    coverString(defaultConfig.sourceRoot, rawConfig.sourceRoot, isNotEmptyString))

  // resolve dataRoot (absolute filepath)
  const dataRoot = resolveLocalPath(
    sitePathConfig.workspace,
    coverString(defaultConfig.dataRoot, rawConfig.dataRoot, isNotEmptyString))

  // resolve entryDataMapFilepath (absolute filepath)
  const entryDataMapFilepath = resolveLocalPath(
    dataRoot,
    coverString(
      defaultConfig.entryDataMapFilepath,
      rawConfig.entryDataMapFilepath,
      isNotEmptyString
    )
  )

  // resolve assetDataMapFilepath (absolute filepath)
  const assetDataMapFilepath = resolveLocalPath(
    dataRoot,
    coverString(
      defaultConfig.assetDataMapFilepath,
      rawConfig.assetDataMapFilepath,
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

  // resolve tagDataMapFilepath (absolute filepath)
  const tagDataMapFilepath = resolveLocalPath(
    dataRoot,
    coverString(
      defaultConfig.tagDataMapFilepath,
      rawConfig.tagDataMapFilepath,
      isNotEmptyString
    )
  )

  // resolve source
  const source: Record<SourceType, SourceItem> = {} as any
  const rawSources: Record<SourceType, Partial<SourceItem>> = rawConfig.source || {} as any
  for (const sourceType of sourceItemTypes) {
    source[sourceType] = resolveSourceItem(
      rawSources[sourceType],
      sourceRoot,
      dataRoot,
      defaultConfig.source[sourceType],
    )
  }

  const result: SubSiteConfig<SourceType, SourceItem> = {
    routeRoot,
    apiUrlRoot,
    sourceRoot,
    dataRoot,
    entryDataMapFilepath,
    assetDataMapFilepath,
    categoryDataMapFilepath,
    tagDataMapFilepath,
    source,
  }
  return result
}
