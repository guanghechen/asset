import type { IAssetPathResolver } from '@guanghechen/asset-types'
import invariant from '@guanghechen/invariant'
import path from 'node:path'

const urlRegex: RegExp = /^\w+:\/\//

export interface IAssetPathResolverProps {
  rootDir: string
  caseSensitive: boolean
}

export class AssetPathResolver implements IAssetPathResolver {
  public readonly rootDir: string
  public readonly caseSensitive: boolean

  constructor(props: IAssetPathResolverProps) {
    this.rootDir = props.rootDir
    this.caseSensitive = props.caseSensitive
  }

  public assertSafePath(filepath: string): void | never {
    invariant(
      this.isSafePath(filepath),
      `[assertSafePath] !!!unsafe filepath. rootDir: ${this.rootDir}, filepath: ${filepath}`,
    )
  }

  public absolute(filepath: string): string {
    const absoluteFilepath = this._absolute(this.rootDir, filepath)
    this.assertSafePath(absoluteFilepath)
    return absoluteFilepath
  }

  public identify(filepath: string): string {
    let relativePath: string = this.relative(filepath)
    relativePath = relativePath.replace(/[/\\]+/g, '/').replace(/[/]?$/, '/')
    return this.caseSensitive ? relativePath : relativePath.toLowerCase()
  }

  public isSafePath(filepath: string): boolean {
    return !this.relative(filepath).startsWith('..')
  }

  public relative(filepath: string): string {
    return this._relative(this.rootDir, filepath)
  }

  protected _absolute(cwd: string, filepath: string): string {
    if (urlRegex.test(filepath)) return filepath
    return path.resolve(cwd, path.normalize(filepath))
  }

  protected _relative(cwd: string, filepath: string): string {
    return path.normalize(path.relative(cwd, this._absolute(cwd, filepath)))
  }
}
