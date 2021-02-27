import type { SitePathConfig } from '../site'
import type {
  SubSiteSourceItem,
  SubSiteSourceItemResolver,
} from './source-item'
import { coverString, isNotEmptyString } from '@barusu/util-option'
import { resolveLocalPath, resolveUrlPath } from '../../util/path'

/**
 * Sub site configuration
 */
export interface SubSiteConfig<
  SourceType extends string = string,
  SourceItem extends SubSiteSourceItem = SubSiteSourceItem,
> {
  /**
   * The root route (spa) path of the sub-site
   */
  routeRoot: string
  /**
   * The root url path of the sub-site
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
    rawConfig: Partial<Omit<T, 'source'>> & { source?: Partial<T['source']> },
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
    urlRoot: '/' + name,
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
  T extends SubSiteConfig<SourceType, SourceItem> = SubSiteConfig<SourceType, SourceItem>,
>(
  rawConfig: (Partial<Omit<T, 'source'>> & { source?: Partial<T['source']> }) = {},
  sourceItemTypes: SourceType[],
  resolveSourceItem: SubSiteSourceItemResolver<SourceItem>,
  sitePathConfig: SitePathConfig,
  defaultConfig: SubSiteConfig<SourceType, SourceItem>,
): SubSiteConfig<SourceType, SourceItem> {
  // resolve routeRoot (absolute url path)
  const routeRoot = resolveUrlPath(
    sitePathConfig.routeRoot,
    coverString(defaultConfig.routeRoot, rawConfig.routeRoot, isNotEmptyString))

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
    urlRoot,
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
