import { AssetDataTypeEnum } from '@guanghechen/asset-types'
import type {
  IAssetTargetDataStorage,
  IBinaryFileData,
  IFileData,
  IJsonFileData,
  IPathResolver,
  ITargetItem,
  ITargetItemWithoutData,
  ITextFileData,
} from '@guanghechen/asset-types'
import { lstat, mkdir, readFile, realpath, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'

const parentDirPrefix = `..${path.sep}`
const supportedDataTypes: ReadonlySet<AssetDataTypeEnum> = new Set([
  AssetDataTypeEnum.BINARY,
  AssetDataTypeEnum.TEXT,
  AssetDataTypeEnum.JSON,
  AssetDataTypeEnum.ASSET_MAP,
])

function isMissingPathError(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT'
}

function assertPathInside(rootDir: string, filepath: string, uri: string): void {
  const relativeFilepath: string = path.relative(rootDir, filepath)
  if (
    relativeFilepath !== '..' &&
    !relativeFilepath.startsWith(parentDirPrefix) &&
    !path.isAbsolute(relativeFilepath)
  ) {
    return
  }
  throw new TypeError(`[FileAssetTargetDataStorage] uri escapes rootDir: ${uri}`)
}

interface IProps {
  rootDir: string
  pathResolver: IPathResolver
  prettier?: boolean
}

/**
 * Pins rootDir's real path on the first successful operation. Symlinks may resolve within that
 * root, but the canonical tree must not be concurrently replaced by an untrusted actor.
 */
export class FileAssetTargetDataStorage implements IAssetTargetDataStorage {
  public readonly rootDir: string
  public readonly pathResolver: IPathResolver
  protected readonly _prettier: boolean
  private _realRootDir?: string

  constructor(props: IProps) {
    const { rootDir, pathResolver, prettier = true } = props
    this.rootDir = rootDir
    this.pathResolver = pathResolver
    this._prettier = prettier
  }

  public async load(uri: string, fileItem: ITargetItemWithoutData): Promise<IFileData> {
    const { datatype } = fileItem
    if (!supportedDataTypes.has(datatype)) {
      throw new TypeError(`Unexpected datatype: ${datatype}`)
    }

    const filepath: string = await this._resolveSafeLoadPath(uri)
    switch (datatype) {
      case AssetDataTypeEnum.BINARY: {
        const content: IBinaryFileData = await readFile(filepath)
        return content
      }
      case AssetDataTypeEnum.TEXT: {
        const content: ITextFileData = await readFile(filepath, fileItem.encoding)
        return content
      }
      case AssetDataTypeEnum.JSON:
      case AssetDataTypeEnum.ASSET_MAP: {
        const content: string = await readFile(filepath, 'utf8')
        const data: IJsonFileData = JSON.parse(content)
        return data
      }
    }
  }

  public async remove(uri: string): Promise<void> {
    try {
      const filepath: string = await this._resolveSafeRemovePath(uri)
      await unlink(filepath)
    } catch (error) {
      if (isMissingPathError(error)) return
      throw error
    }
  }

  public async save(uri: string, item: ITargetItem): Promise<void> {
    const filepath: string = await this._resolveSafeSavePath(uri)

    const { datatype, data } = item
    switch (datatype) {
      case AssetDataTypeEnum.BINARY: {
        await writeFile(filepath, data)
        break
      }
      case AssetDataTypeEnum.TEXT: {
        await writeFile(filepath, data, item.encoding)
        break
      }
      case AssetDataTypeEnum.JSON:
      case AssetDataTypeEnum.ASSET_MAP: {
        const content: string = this._prettier
          ? JSON.stringify(data, null, 2)
          : JSON.stringify(data)
        await writeFile(filepath, content, 'utf8')
        break
      }
      default:
        throw new TypeError(`[FileAssetTargetDataStorage.save] Unexpected datatype: ${datatype}`)
    }
  }

  public _resolvePathFromUri(uri: string): string {
    const p: string = uri.replace(/^[/\\]/, '').replace(/[?#][\s\S]+$/, '')
    const filepath: string = this.pathResolver.absolute(this.rootDir, p)
    if (!path.isAbsolute(filepath)) {
      throw new TypeError(`[FileAssetTargetDataStorage] uri escapes rootDir: ${uri}`)
    }
    assertPathInside(path.resolve(this.rootDir), filepath, uri)
    return filepath
  }

  protected async _resolveSafeLoadPath(uri: string): Promise<string> {
    const relativeFilepath: string = this._resolveRelativeFilepath(uri)
    const realRootDir: string = await this._getRealRootDir()
    const realFilepath: string = await realpath(path.resolve(realRootDir, relativeFilepath))
    assertPathInside(realRootDir, realFilepath, uri)
    return realFilepath
  }

  protected async _resolveSafeRemovePath(uri: string): Promise<string> {
    const relativeFilepath: string = this._resolveRelativeFilepath(uri)
    const realRootDir: string = await this._getRealRootDir()
    const filepath: string = path.resolve(realRootDir, relativeFilepath)

    const realDirpath: string = await realpath(path.dirname(filepath))
    assertPathInside(realRootDir, realDirpath, uri)
    return path.join(realDirpath, path.basename(filepath))
  }

  protected async _resolveSafeSavePath(uri: string): Promise<string> {
    const relativeFilepath: string = this._resolveRelativeFilepath(uri)
    const realRootDir: string = await this._getRealRootDir(true)
    const realDirpath: string = await this._resolveOrCreateDir(
      realRootDir,
      path.dirname(relativeFilepath),
      uri,
    )
    const filepath: string = path.join(realDirpath, path.basename(relativeFilepath))

    // lstat distinguishes a missing file from a dangling symlink, which writeFile would follow.
    try {
      if (!(await lstat(filepath)).isSymbolicLink()) return filepath
    } catch (error) {
      if (isMissingPathError(error)) return filepath
      throw error
    }

    const realFilepath: string = await realpath(filepath)
    assertPathInside(realRootDir, realFilepath, uri)
    return realFilepath
  }

  protected _resolveRelativeFilepath(uri: string): string {
    return path.relative(path.resolve(this.rootDir), this._resolvePathFromUri(uri))
  }

  private async _getRealRootDir(createIfMissing = false): Promise<string> {
    if (this._realRootDir !== undefined) return this._realRootDir

    if (createIfMissing) await mkdir(this.rootDir, { recursive: true })
    const realRootDir: string = await realpath(this.rootDir)
    this._realRootDir ??= realRootDir
    return this._realRootDir
  }

  private async _resolveOrCreateDir(
    realRootDir: string,
    relativeDirpath: string,
    uri: string,
  ): Promise<string> {
    let realDirpath: string = realRootDir
    const dirnames: string[] = relativeDirpath === '.' ? [] : relativeDirpath.split(path.sep)

    for (const dirname of dirnames) {
      const nextDirpath: string = path.join(realDirpath, dirname)
      await mkdir(nextDirpath, { recursive: true })
      realDirpath = await realpath(nextDirpath)
      assertPathInside(realRootDir, realDirpath, uri)
    }
    return realDirpath
  }
}
