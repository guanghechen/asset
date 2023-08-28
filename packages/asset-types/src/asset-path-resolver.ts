export interface IAssetPathResolver {
  readonly rootDir: string

  /**
   * Ensure the location is under the {rootDir} folder.
   * @param location absolute path or relative path to the {rootDir}
   */
  assertSafeLocation(location: string): Promise<void | never> | void | never

  /**
   * Get the basename of a location. i.e., `bar.txt` from `/a/b/c/d/bar.txt`
   * @param location absolute path or relative path to the {rootDir}
   */
  basename(location: string): string

  /**
   * Get the dirname of a location. i.e., `bar.txt` from `/a/b/c/d`
   * @param location absolute path or relative path to the {rootDir}
   */
  dirname(location: string): string

  /**
   * Get the relative path to the {rootDir}
   * @param location absolute path or relative path to the {rootDir}
   */
  relative(location: string): string

  /**
   * Get the absolute path.
   * @param location absolute path or relative path to the {rootDir}
   */
  absolute(location: string): string
}
