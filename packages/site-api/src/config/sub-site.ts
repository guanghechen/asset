import { coverString, isNotEmptyString } from '@barusu/util-option'
import { resolveLocalPath, resolveUrlPath } from '../util/path'
import type { SitePathConfig } from './site'


/**
 * Sub site configuration
 */
export interface SubSiteConfig {
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
}


/**
 * Resolve BlogConfig
 * @param rawConfig
 */
export function resolveSubSiteConfig(
  sitePathConfig: SitePathConfig,
  defaultConfig: SubSiteConfig,
  rawConfig: Partial<SubSiteConfig> = {},
): SubSiteConfig {
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

  // resolve assetDataMapFilepath
  const assetDataMapFilepath = resolveLocalPath(
    dataRoot,
    coverString(
      defaultConfig.assetDataMapFilepath,
      rawConfig.assetDataMapFilepath,
      isNotEmptyString
    )
  )

  // resolve tagDataMapFilepath
  const tagDataMapFilepath = resolveLocalPath(
    dataRoot,
    coverString(
      defaultConfig.tagDataMapFilepath,
      rawConfig.tagDataMapFilepath,
      isNotEmptyString
    )
  )

  // resolve categoryDataMapFilepath
  const categoryDataMapFilepath = resolveLocalPath(
    dataRoot,
    coverString(
      defaultConfig.categoryDataMapFilepath,
      rawConfig.categoryDataMapFilepath,
      isNotEmptyString
    )
  )

  const result: SubSiteConfig = {
    urlRoot,
    sourceRoot,
    dataRoot,
    assetDataMapFilepath,
    tagDataMapFilepath,
    categoryDataMapFilepath,
  }
  return result
}


/**
 * Sub-site config resolver
 *
 * @param sitePathConfig  site path config
 * @param defaultConfig   default sub-site config
 * @param rawConfig       raw sub-site config
 */
export type SubSiteConfigResolver<T extends SubSiteConfig = SubSiteConfig> = (
  sitePathConfig: SitePathConfig,
  defaultConfig?: T,
  rawConfig?: Partial<T>,
) => T
