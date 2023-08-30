import type { IAssetPathResolver } from '@guanghechen/asset-types'
import invariant from '@guanghechen/invariant'
import path from 'node:path'

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
    const rootDir: string = this.rootDir
    invariant(
      !this.relative(location).startsWith('..'),
      `[assertSafeLocation] !!!unsafe location. rootDir: ${rootDir}, location: ${location}`,
    )
  }

  public basename(location: string): string {
    return path.basename(location)
  }

  public dirname(location: string): string {
    return path.dirname(location)
  }

  public absolute(location: string): string {
    const rootDir: string = this.rootDir
    const absoluteFilepath = path.resolve(rootDir, path.normalize(location))
    this.assertSafeLocation(absoluteFilepath)
    return absoluteFilepath
  }

  public relative(location: string): string {
    const rootDir: string = this.rootDir
    return this._relative(rootDir, location)
  }

  protected _relative(cwd: string, location: string): string {
    return path.normalize(path.relative(cwd, path.resolve(cwd, location)))
  }
}