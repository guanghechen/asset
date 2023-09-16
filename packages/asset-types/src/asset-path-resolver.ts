export interface IAssetPathResolver {
  readonly rootDir: string
  readonly caseSensitive: boolean

  /**
   * Ensure the filepath is under the {rootDir} folder.
   * @param filepath absolute path or relative path to the {rootDir}
   */
  assertSafePath(filepath: string): void | never

  /**
   * Get the absolute path.
   * @param filepath absolute path or relative path to the {rootDir}
   */
  absolute(filepath: string): string

  /**
   * Generate a unique id for the filepath.
   * @param filepath
   */
  identify(srcPath: string): string

  /**
   * Check if the filepath is relative path.
   * @param filepath
   */
  isSafePath(filepath: string): boolean

  /**
   * Get the relative path to the {rootDir}.
   * @param filepath absolute path or relative path to the {rootDir}
   */
  relative(filepath: string): string

  /**
   * Resolve path from uri.
   * @param uri
   */
  resolveFromUri(uri: string): string
}
