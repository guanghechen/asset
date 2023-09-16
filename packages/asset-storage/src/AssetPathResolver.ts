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
    const relativeFilepath = this._relative(this.rootDir, absoluteFilepath)
    invariant(
      this._isSafePath(relativeFilepath),
      `[assertSafePath] !!!unsafe filepath. rootDir: ${this.rootDir}, filepath: ${filepath}`,
    )
    return absoluteFilepath
  }

  public identify(filepath: string): string {
    const p: string = this.relative(filepath)
      .replace(/[/\\]+/g, '/')
      .replace(/[/]?$/, '/')
    return this.caseSensitive ? p : p.toLowerCase()
  }

  public isSafePath(filepath: string): boolean {
    const absoluteFilepath: string = this._absolute(this.rootDir, filepath)
    const relativeFilepath: string = this._relative(this.rootDir, absoluteFilepath)
    return this._isSafePath(relativeFilepath)
  }

  public relative(filepath: string): string {
    const absoluteFilepath = this._absolute(this.rootDir, filepath)
    const relativeFilepath = this._relative(this.rootDir, absoluteFilepath)
    invariant(
      this._isSafePath(relativeFilepath),
      `[assertSafePath] !!!unsafe filepath. rootDir: ${this.rootDir}, filepath: ${filepath}`,
    )
    return relativeFilepath
  }

  public resolveFromUri(uri: string): string {
    return this.absolute(uri.replace(/^[/\\]/, '').replace(/[?#][\s\S]+$/, ''))
  }

  protected _absolute(cwd: string, filepath: string): string {
    if (urlRegex.test(filepath)) return filepath
    return path.resolve(cwd, path.normalize(filepath))
  }

  protected _relative(cwd: string, absoluteFilepath: string): string {
    const relativeFilepath: string = path.relative(cwd, absoluteFilepath)
    const normalizedFilepath: string = path.normalize(relativeFilepath)
    return normalizedFilepath
  }

  protected _isSafePath(relativeFilepath: string): boolean {
    return !relativeFilepath.startsWith('..')
  }
}
