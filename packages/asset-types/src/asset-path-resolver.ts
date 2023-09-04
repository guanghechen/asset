export interface IAssetPathResolver {
  readonly rootDir: string

  /**
   * Ensure the location is under the {rootDir} folder.
   * @param location absolute path or relative path to the {rootDir}
   */
  assertSafeLocation(location: string): void | never

  /**
   * Check if the location is relative path.
   * @param location
   */
  isSafeLocation(location: string): boolean

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
