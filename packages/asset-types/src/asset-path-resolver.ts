import type { IPathResolver } from './path-resolver'

export interface IAssetPathResolver extends IPathResolver {
  readonly caseSensitive: boolean
  readonly srcRoots: string[]

  /**
   * Ensure there is a srcRoot of the given filepath and return it.
   * @param absoluteFilepath
   * @param caller
   */
  assertSafeAbsolutePath(absoluteFilepath: string, caller?: string): string | never

  /**
   * Find a matched srcRoot of the given filepath.
   * @param absoluteFilepath
   */
  findSrcRoot(absoluteFilepath: string): string | null

  /**
   * Check if the given filepath is an safe absolute path.
   * @param filepath
   */
  isSafeAbsolutePath(filepath: string): boolean

  /**
   * Make a unique id from the absoluteFilepath.
   * @param absoluteFilepath
   */
  identify(absoluteFilepath: string): string
}
