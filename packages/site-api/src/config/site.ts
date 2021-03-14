import { coverString, isNotEmptyString } from '@barusu/util-option'
import fs from 'fs-extra'
import yaml from 'js-yaml'
import path from 'path'
import { resolveLocalPath, resolveUrlPath } from '../util/path'
import type { DeployConfig } from './deploy'
import { defaultDeployConfig, resolveDeployConfig } from './deploy'
import type { SubSiteConfig, SubSiteConfigResolver } from './sub-site/config'

/**
 * Site path config
 */
export interface SitePathConfig {
  /**
   * The root route (spa) path of the site
   * @default '/''
   */
  routeRoot: string
  /**
   * The root url path of the site
   */
  urlRoot: string
  /**
   * Reference path of all paths under the site
   * @default '.'
   */
  workspace: string
}

/**
 * Site config
 */
export interface SiteConfig extends SitePathConfig {
  /**
   * site title
   */
  title: string
  /**
   * site description
   */
  description: string
  /**
   * site author
   */
  author: string
  /**
   * Sub sites
   */
  sites: Record<string, SubSiteConfig>
  /**
   * Deploy configuration
   */
  deploy: DeployConfig
}

/**
 * Default site config
 */
export const defaultSiteConfig: SiteConfig = {
  routeRoot: '/',
  urlRoot: '/',
  workspace: '.',
  title: 'Demo',
  description: 'demo',
  author: 'lemon-clown',
  sites: {},
  deploy: defaultDeployConfig,
}

/**
 * Resolve SiteConfig
 *
 * @param cwd
 * @param defaultConfig
 * @param rawConfig
 * @param sitesResolver
 */
export function resolveSiteConfig(
  rawConfig: Partial<SiteConfig> = {},
  cwd: string,
  defaultConfig: SiteConfig = defaultSiteConfig,
  sitesResolver: Record<string, SubSiteConfigResolver> = {},
): SiteConfig {
  // resolve routeRoot (absolute url path)
  const routeRoot = resolveUrlPath(
    coverString(defaultConfig.routeRoot, rawConfig.routeRoot, isNotEmptyString),
  )

  // resolve urlRoot (absolute url path)
  const urlRoot = resolveUrlPath(
    coverString(defaultConfig.urlRoot, rawConfig.urlRoot, isNotEmptyString),
  )

  // resolve workspace (absolute filepath)
  const workspace = resolveLocalPath(
    cwd,
    coverString(defaultConfig.workspace, rawConfig.workspace, isNotEmptyString),
  )

  // resolve title
  const title: string = coverString(
    defaultConfig.title,
    rawConfig.title,
    isNotEmptyString,
  )

  // resolve description
  const description: string = coverString(
    defaultConfig.description,
    rawConfig.description,
    isNotEmptyString,
  )

  // resolve author
  const author: string = coverString(
    defaultConfig.author,
    rawConfig.author,
    isNotEmptyString,
  )

  // resolve deploy
  const deploy = resolveDeployConfig(rawConfig.deploy, defaultConfig.deploy)

  // resolve sites
  const rawSites = rawConfig.sites || {}
  const sites: Record<string, SubSiteConfig> = {}
  const sitePathConfig: SitePathConfig = {
    routeRoot,
    urlRoot,
    workspace,
  }

  for (const key of Object.getOwnPropertyNames(rawSites)) {
    const resolveSubSite = sitesResolver[key]
    if (resolveSubSite == null) {
      throw new Error(`Cannot find resolver for sub-site (${key})`)
    }
    const subSite: SubSiteConfig = resolveSubSite(
      rawSites[key],
      sitePathConfig,
      defaultConfig.sites[key],
    )
    sites[key] = subSite
  }

  const result: SiteConfig = {
    routeRoot,
    urlRoot,
    workspace,
    sites,
    title,
    description,
    author,
    deploy,
  }
  return result
}

/**
 * Load site config
 *
 * @param filepath      absolute filepath of site config
 * @param encoding      encoding of the config file
 * @param defaultConfig default site config
 * @param sitesResolver func for resolving sub sites
 */
export function loadSiteConfig(
  cwd: string,
  filepath: string,
  encoding: BufferEncoding = 'utf-8',
  defaultConfig: SiteConfig = defaultSiteConfig,
  sitesResolver: Record<string, SubSiteConfigResolver> = {},
): SiteConfig {
  if (!fs.existsSync(filepath)) {
    throw new Error(`Cannot find siteConfig. no such file: ${filepath}`)
  }
  const rawContent = fs.readFileSync(filepath, encoding)
  const extname = path.extname(filepath)

  switch (extname) {
    case '.yml':
    case '.yaml': {
      const rawConfig: any = yaml.safeLoad(rawContent) || {}
      return resolveSiteConfig(rawConfig, cwd, defaultConfig, sitesResolver)
    }
    case '.json': {
      const rawConfig: any = JSON.parse(rawContent)
      return resolveSiteConfig(rawConfig, cwd, defaultConfig, sitesResolver)
    }
  }

  throw new Error(`Only yaml / json supported. filepath: ${filepath}`)
}
