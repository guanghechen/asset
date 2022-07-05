import { cover, coverString, isNonBlankString } from '@guanghechen/option-helper'

/**
 * Deploy configuration
 */
export interface DeployConfig {
  /**
   * Version control system
   * @default 'git'
   */
  type: 'git'
  /**
   * Repository branch
   * @default 'master'
   */
  branch: string
  /**
   * Repository  address
   */
  repository: string
  /**
   * User name
   * @default ''
   */
  name: string
  /**
   * User email
   * @default ''
   */
  email: string
}

export const defaultDeployConfig: DeployConfig = {
  type: 'git',
  branch: 'master',
  repository: '',
  name: '',
  email: '',
}

/**
 * Resolve DeployConfig
 * @param rawConfig
 */
export function resolveDeployConfig(
  rawConfig: Partial<DeployConfig> = {},
  defaultConfig: DeployConfig = defaultDeployConfig,
): DeployConfig {
  // resolve type
  const type = cover<'git'>(defaultConfig.type, rawConfig.type, isNonBlankString)

  // resolve branch
  const branch = coverString(defaultConfig.branch, rawConfig.branch, isNonBlankString)

  // resolve repository
  const repository = coverString(defaultConfig.repository, rawConfig.repository, isNonBlankString)

  // resolve name
  const name = coverString(defaultConfig.name, rawConfig.name, isNonBlankString)

  // resolve email
  const email = coverString(defaultConfig.email, rawConfig.name, isNonBlankString)

  const result: DeployConfig = {
    type,
    branch,
    repository,
    name,
    email,
  }
  return result
}
