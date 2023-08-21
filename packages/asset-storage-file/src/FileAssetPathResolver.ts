import type { IAssetPathResolver } from '@guanghechen/asset-types'
import invariant from '@guanghechen/invariant'
import path from 'node:path'

export interface IFileAssetPathResolverProps {
  rootDir: string
}

export class FileAssetPathResolver implements IAssetPathResolver {
  public readonly rootDir: string

  constructor(props: IFileAssetPathResolverProps) {
    this.rootDir = props.rootDir
  }

  public async assertSafeLocation(location: string): Promise<void | never> {
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

  public relative(location: string): string {
    const rootDir: string = this.rootDir
    return path.normalize(path.relative(rootDir, path.resolve(rootDir, location)))
  }

  public resolve(location: string): string {
    const rootDir: string = this.rootDir
    return path.resolve(rootDir, path.normalize(location))
  }
}
