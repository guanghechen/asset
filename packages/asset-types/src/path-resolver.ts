export interface IPathResolver {
  /**
   * Ensure the filepath is under the {basedir} folder.
   * @param basedir the base directory.
   * @param filepath absolute path or relative path to the {basedir}.
   * @param caller
   */
  assertRelativePath(basedir: string, filepath: string, caller?: string): void | never

  /**
   * Ensure the filepath is an absolute filepath
   * @param absoluteFilepath
   * @param caller
   */
  assertAbsolutePath(absoluteFilepath: string, caller?: string): void | never

  /**
   * Get the absolute path.
   * @param basedir the base directory.
   * @param filepath absolute path or relative path to the {basedir}.
   */
  absolute(basedir: string, filepath: string): string

  /**
   * Get the relative path to the {basedir}.
   * @param basedir the base directory.
   * @param filepath absolute path or relative path to the {basedir}.
   */
  relative(basedir: string, filepath: string): string

  /**
   * Join path pieces to a path.
   * @param pathPieces
   */
  join(pathPiece0: string, ...pathPieces: string[]): string

  /**
   * Check if the given filepath is an absolute path.
   * @param filepath
   */
  isAbsolutePath(filepath: string): boolean

  /**
   * Check if the filepath is under the {basedir}.
   * @param basedir
   * @param filepath
   */
  isRelativePath(basedir: string, filepath: string): boolean
}
