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
   * @param basedir
   */
  absolute(filepath: string, basedir?: string): string

  /**
   * Generate a unique id for the filepath.
   * @param filepath
   */
  identify(srcPath: string): string

  /**
   * Check if the given filepath is an absolute path.
   * @param filepath
   */
  isAbsolute(filepath: string): boolean

  /**
   * Check if the filepath is under the rootDir.
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
