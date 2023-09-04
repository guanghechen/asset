import type { IAssetPathResolver } from '@guanghechen/asset-types'
import invariant from '@guanghechen/invariant'
import path from 'node:path'

const urlRegex: RegExp = /^\w+:\/\//

export interface IAssetPathResolverProps {
  rootDir: string
}

export class AssetPathResolver implements IAssetPathResolver {
  public readonly rootDir: string

  constructor(props: IAssetPathResolverProps) {
    this.rootDir = props.rootDir
  }

  public identity(location: string): string {
    const relativeLocation: string = this.relative(location)
    return relativeLocation.replace(/[/\\]+/g, '/').replace(/[/]?$/, '/')
  }

  public assertSafeLocation(location: string): void | never {
    invariant(
      this.isSafeLocation(location),
      `[assertSafeLocation] !!!unsafe location. rootDir: ${this.rootDir}, location: ${location}`,
    )
  }

  public absolute(location: string): string {
    const absoluteFilepath = this._absolute(this.rootDir, location)
    this.assertSafeLocation(absoluteFilepath)
    return absoluteFilepath
  }

  public isSafeLocation(location: string): boolean {
    return !this.relative(location).startsWith('..')
  }

  public relative(location: string): string {
    return this._relative(this.rootDir, location)
  }

  protected _absolute(cwd: string, location: string): string {
    if (urlRegex.test(location)) return location
    return path.resolve(cwd, path.normalize(location))
  }

  protected _relative(cwd: string, location: string): string {
    return path.normalize(path.relative(cwd, this._absolute(cwd, location)))
  }
}
