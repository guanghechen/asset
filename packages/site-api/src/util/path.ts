import path from 'path'


/**
 * Resolve url path
 *
 * @param prefixPath
 * @param p
 */
export function resolveUrlPath(
  prefixPath: string,
  ...pathPieces: string[]
): string {
  const result = (prefixPath + '/' + pathPieces.join('/'))
    .replace(/[\\/]+/g, '/')
    .replace(/^[/]?/, '/')
    .replace(/[/]$/, '')
  return result
}


/**
 * Resolve local data path
 *
 * @param basePath
 * @param p
 */
export function resolveLocalPath(
  basePath: string,
  ...pathPieces: string[]
): string {
  const result = path.resolve(basePath, ...pathPieces)
  return result
}


/**
 * Calculate filepath cross platform and repository
 *
 * @param workspace
 * @param filepath
 */
export function resolveUniversalPath(
  workspace: string,
  filepath: string,
): string {
  const result = path
    .normalize(path.relative(workspace, path.resolve(workspace, filepath)))
    .replace(/[\\/]+/g, '/')
    .replace(/[/]$/, '')
  return result
}
