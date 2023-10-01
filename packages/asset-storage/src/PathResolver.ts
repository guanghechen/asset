import type { IPathResolver } from '@guanghechen/asset-types'
import invariant from '@guanghechen/invariant'
import path from 'node:path'

const hashRegex = /#([\s\S]*)$/
const urlRegex = /^\w+:\/\//

export class PathResolver implements IPathResolver {
  public assertAbsolutePath(absoluteFilepath: string, caller?: string): void | never {
    const title: string = caller ?? 'AssetPathResolver.assetAbsolutePath'
    invariant(
      this.isAbsolutePath(absoluteFilepath),
      `[${title}] not an absolute filepath. absoluteFilepath: ${absoluteFilepath}`,
    )
  }

  public assertRelativePath(basedir: string, filepath: string, caller?: string): void | never {
    const title: string = caller ?? 'AssetPathResolver.assertRelativePath'
    invariant(
      this.isRelativePath(basedir, filepath),
      `[${title}] not a relative filepath. basedir: ${basedir}, filepath: ${filepath}`,
    )
  }

  public absolute(basedir: string, filepath: string): string {
    if (this.isAbsolutePath(filepath)) return filepath
    const absoluteFilepath: string = path.resolve(basedir, path.normalize(filepath))
    const normalizedFilepath: string = path.normalize(absoluteFilepath)
    return normalizedFilepath
  }

  public relative(basedir: string, filepath: string): string {
    const absoluteFilepath: string = this.absolute(basedir, filepath)
    const relativeFilepath: string = this._relative(basedir, absoluteFilepath)
    return relativeFilepath
  }

  public join(pathPiece0: string, ...pathPieces: string[]): string {
    return path.join(pathPiece0, ...pathPieces)
  }

  public parseFromUrl(url: string): string | null {
    if (this.isAbsolutePath(url)) return null
    const p: string = url.replace(hashRegex, '')
    return decodeURIComponent(p)
  }

  public isAbsolutePath(filepath: string): boolean {
    if (path.isAbsolute(filepath)) return true
    if (urlRegex.test(filepath)) return true
    return false
  }

  public isRelativePath(basedir: string, filepath: string): boolean {
    const absoluteFilepath: string = this.absolute(basedir, filepath)
    const relativeFilepath: string = this._relative(basedir, absoluteFilepath)
    return !relativeFilepath.startsWith('..')
  }

  protected _relative(basedir: string, absoluteFilepath: string): string {
    const relativeFilepath: string = path.relative(basedir, absoluteFilepath)
    const normalizedFilepath: string = path.normalize(relativeFilepath)
    return normalizedFilepath
  }
}
