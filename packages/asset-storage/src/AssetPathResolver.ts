import type { IAssetPathResolver } from '@guanghechen/asset-types'
import path from 'node:path'
import { PathResolver } from './PathResolver'

export interface IAssetPathResolverProps {
  /**
   * If the filepath is case sensitive.
   */
  caseSensitive: boolean
  /**
   * Absolute path of the root directory of the project.
   */
  srcRoots: string[]
}

export class AssetPathResolver extends PathResolver implements IAssetPathResolver {
  protected readonly _caseSensitive: boolean
  protected readonly _srcRoots: string[]

  constructor(props: IAssetPathResolverProps) {
    super()

    const srcRoots: string[] = this._validateSrcRoots(props.srcRoots)
    this._caseSensitive = props.caseSensitive
    this._srcRoots = srcRoots
  }

  public get caseSensitive(): boolean {
    return this._caseSensitive
  }

  public get srcRoots(): string[] {
    return this._srcRoots.slice()
  }

  public assertSafeAbsolutePath(absoluteFilepath: string, caller?: string): string | never {
    const srcRoot: string | null = this.findSrcRoot(absoluteFilepath)
    if (srcRoot === null) {
      const title: string = caller ?? 'AssetPathResolver.assertFindSrcRoot'
      throw new Error(`[${title}] cannot find srcRoot. absoluteFilepath: ${absoluteFilepath}`)
    }
    return srcRoot
  }

  public findSrcRoot(absoluteFilepath: string): string | null {
    this.assertAbsolutePath(absoluteFilepath, 'AssetPathResolver.findSrcRoot')
    for (const srcRoot of this._srcRoots) {
      if (this.isRelativePath(srcRoot, absoluteFilepath)) return srcRoot
    }
    return null
  }

  public isSafeAbsolutePath(filepath: string): boolean {
    if (!this.isAbsolutePath(filepath)) return false
    for (const srcRoot of this._srcRoots) {
      if (this.isRelativePath(srcRoot, filepath)) return true
    }
    return false
  }

  public identify(absoluteFilepath: string): string {
    this.assertSafeAbsolutePath(absoluteFilepath)
    const p: string = absoluteFilepath
      .replace(/^[^/\\]+/, '/')
      .replace(/[/\\]+/g, '/')
      .replace(/[/]?$/, '/')
    return this._caseSensitive ? p : p.toLowerCase()
  }

  protected _validateSrcRoots(srcRoots_: string[]): string[] | never {
    const srcRoots: string[] = srcRoots_
      .slice()
      .map(p => path.normalize(p))
      .sort()

    // 1. all of srcRoots should be absolute paths.
    for (const srcRoot of srcRoots) this.assertAbsolutePath(srcRoot, 'AssetPathResolver')

    // 2. all srcRoot should be overlapped.
    for (let i = 0; i < srcRoots.length; ++i) {
      const srcRoot0: string = srcRoots[i]
      for (let j = i + 1; j < srcRoots.length; ++j) {
        const srcRoot1: string = srcRoots[j]
        const relative0: string = this._relative(srcRoot0, srcRoot1)
        const relative1: string = this._relative(srcRoot1, srcRoot0)

        if (!relative0.startsWith('..') || !relative1.startsWith('..')) {
          throw new Error(
            `[AssetPathResolver] invalid, srcRoots should not be overlapped: ${srcRoot0} (${i}) === ${srcRoot1} (${j})`,
          )
        }
      }
    }

    return srcRoots
  }
}
