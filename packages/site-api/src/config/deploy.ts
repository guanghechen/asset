import { cover, coverString, isNotEmptyString } from '@barusu/util-option'


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
  defaultConfig: DeployConfig = defaultDeployConfig,
  rawConfig: Partial<DeployConfig> = {},
): DeployConfig {
  // resolve type
  const type = cover<'git'>(
    defaultConfig.type, rawConfig.type, isNotEmptyString)

  // resolve branch
  const branch = coverString(
    defaultConfig.branch, rawConfig.branch, isNotEmptyString)

  // resolve repository
  const repository = coverString(
    defaultConfig.repository, rawConfig.repository, isNotEmptyString)

  // resolve name
  const name = coverString(
    defaultConfig.name, rawConfig.name, isNotEmptyString)

  // resolve email
  const email = coverString(
    defaultConfig.email, rawConfig.name, isNotEmptyString)

  const result: DeployConfig = {
    type,
    branch,
    repository,
    name,
    email,
  }
  return result
}
