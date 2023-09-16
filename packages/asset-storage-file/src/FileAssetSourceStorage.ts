import { AssetDataTypeEnum } from '@guanghechen/asset-types'
import type {
  IAssetCollectOptions,
  IAssetPathResolver,
  IAssetSourceStorage,
  IAssetStat,
  IAssetWatchOptions,
  IAssetWatcher,
  IBinaryFileData,
  IBinarySourceItem,
  IJsonFileData,
  IJsonSourceItem,
  IRawSourceItem,
  ISourceItem,
  ITextFileData,
  ITextSourceItem,
} from '@guanghechen/asset-types'
import invariant from '@guanghechen/invariant'
import chokidar from 'chokidar'
import fastGlob from 'fast-glob'
import { existsSync } from 'node:fs'
import { readFile, stat, unlink, writeFile } from 'node:fs/promises'

export interface IFileAssetSourceStorageProps {
  pathResolver: IAssetPathResolver
  watchOptions?: Partial<chokidar.WatchOptions>
}

export class FileAssetSourceStorage implements IAssetSourceStorage {
  public readonly pathResolver: IAssetPathResolver
  protected readonly _watchOptions: Partial<chokidar.WatchOptions>

  constructor(props: IFileAssetSourceStorageProps) {
    const { pathResolver, watchOptions = {} } = props
    this.pathResolver = pathResolver
    this._watchOptions = watchOptions
  }

  public async assertExistedFile(filepath: string): Promise<void | never> {
    const absolutePath: string = this.pathResolver.absolute(filepath)
    invariant(existsSync(absolutePath), `[assertExistedFile] Cannot find file. (${filepath})`)

    const assertion: boolean = (await stat(absolutePath)).isFile()
    invariant(assertion, `[assertExistedFile] Not a file'. (${filepath})`)
  }

  public async collect(
    patterns_: Iterable<string>,
    options: IAssetCollectOptions,
  ): Promise<string[]> {
    const cwd: string = options.cwd || this.pathResolver.rootDir
    this.pathResolver.assertSafePath(cwd)

    const patterns: string[] = Array.from(patterns_)
    const filepaths: string[] = await fastGlob(patterns, {
      cwd,
      dot: true,
      absolute: options.absolute ?? false,
      onlyDirectories: false,
      onlyFiles: true,
      throwErrorOnBrokenSymbolicLink: true,
      unique: true,
    })
    return filepaths
  }

  public async readFile(rawItem: IRawSourceItem): Promise<ISourceItem> {
    const filepath: string = this.pathResolver.absolute(rawItem.filepath)
    const stat = await this.statFile(filepath)
    switch (rawItem.datatype) {
      case AssetDataTypeEnum.BINARY: {
        const data: IBinaryFileData = await readFile(filepath)
        const item: IBinarySourceItem = {
          datatype: AssetDataTypeEnum.BINARY,
          filepath,
          stat,
          data,
        }
        return item
      }
      case AssetDataTypeEnum.TEXT: {
        const data: ITextFileData = await readFile(filepath, rawItem.encoding)
        const item: ITextSourceItem = {
          datatype: AssetDataTypeEnum.TEXT,
          filepath,
          stat,
          data,
          encoding: rawItem.encoding,
        }
        return item
      }
      case AssetDataTypeEnum.JSON: {
        const content: string = await readFile(filepath, 'utf8')
        const data: IJsonFileData = JSON.parse(content)
        const item: IJsonSourceItem = {
          datatype: AssetDataTypeEnum.JSON,
          filepath,
          stat,
          data,
        }
        return item
      }
      default:
        throw new TypeError(
          `[${this.constructor.name}.readFile] Invalid datatype: ${(rawItem as any).datatype}`,
        )
    }
  }

  public async removeFile(filepath: string): Promise<void> {
    await unlink(filepath)
  }

  public async statFile(filepath: string): Promise<IAssetStat> {
    return await stat(filepath)
  }

  public async updateFile(item: ISourceItem): Promise<void> {
    const filepath: string = this.pathResolver.absolute(item.filepath)
    switch (item.datatype) {
      case AssetDataTypeEnum.BINARY: {
        await writeFile(filepath, item.data)
        break
      }
      case AssetDataTypeEnum.TEXT: {
        await writeFile(filepath, item.data, item.encoding)
        break
      }
      case AssetDataTypeEnum.JSON: {
        const content: string = JSON.stringify(item.data)
        await writeFile(filepath, content, 'utf8')
        break
      }
      default:
        throw new TypeError(
          `[${this.constructor.name}.updateFile] Invalid datatype: ${(item as any).datatype}`,
        )
    }
  }

  public watch(patterns: string[], options: IAssetWatchOptions): IAssetWatcher {
    const { onAdd, onChange, onRemove, shouldIgnore = () => false } = options
    const { pathResolver, _watchOptions } = this

    const watcher = chokidar.watch(patterns, {
      persistent: true,
      ..._watchOptions,
      cwd: pathResolver.rootDir,
    })

    if (onAdd) {
      watcher.on('add', filepath => {
        if (shouldIgnore(filepath, pathResolver)) return
        onAdd(filepath, pathResolver)
      })
    }

    if (onChange) {
      watcher.on('change', filepath => {
        if (shouldIgnore(filepath, pathResolver)) return
        onChange(filepath, pathResolver)
      })
    }

    if (onRemove) {
      watcher.on('unlink', filepath => {
        if (shouldIgnore(filepath, pathResolver)) return
        onRemove(filepath, pathResolver)
      })
    }

    let unWatching = false
    return {
      unwatch: async (): Promise<void> => {
        if (unWatching) return
        unWatching = true

        await watcher.close()
      },
    }
  }
}
