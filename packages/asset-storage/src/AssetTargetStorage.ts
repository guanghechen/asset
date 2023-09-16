import { AssetDataTypeEnum } from '@guanghechen/asset-types'
import type {
  IAssetFileItem,
  IAssetStat,
  IAssetTargetDataStorage,
  IAssetTargetStorage,
  IAssetTargetStorageMonitor,
  IFileData,
  IFileItem,
  IParametersOfOnFileRemoved,
  IParametersOfOnFileWritten,
  IRawFileItem,
} from '@guanghechen/asset-types'
import invariant from '@guanghechen/invariant'
import { Monitor } from '@guanghechen/monitor'
import type { IMonitor, IMonitorUnsubscribe } from '@guanghechen/monitor'

const noop = (..._args: any[]): void => {}

export class AssetTargetStorage implements IAssetTargetStorage {
  protected readonly _monitorFileWritten: IMonitor<IParametersOfOnFileWritten>
  protected readonly _monitorFileRemoved: IMonitor<IParametersOfOnFileRemoved>
  protected readonly _assetFileItemMap: Map<string, IAssetFileItem>
  protected readonly _dataStorage: IAssetTargetDataStorage
  private _destroyed: boolean

  constructor(dataStorage: IAssetTargetDataStorage) {
    this._monitorFileWritten = new Monitor<IParametersOfOnFileWritten>('onFileWritten')
    this._monitorFileRemoved = new Monitor<IParametersOfOnFileRemoved>('onFileRemoved')
    this._assetFileItemMap = new Map<string, IAssetFileItem>()
    this._dataStorage = dataStorage
    this._destroyed = false
  }

  public get destroyed(): boolean {
    return this._destroyed
  }

  public async destroy(): Promise<void> {
    if (this._destroyed) return

    this._destroyed = true
    this._monitorFileWritten.destroy()
  }

  public monitor(monitor: Partial<IAssetTargetStorageMonitor>): IMonitorUnsubscribe {
    if (this.destroyed) return noop

    const { onFileWritten, onFileRemoved } = monitor
    const unsubscribeOnFileWritten = this._monitorFileWritten.subscribe(onFileWritten)
    const unsubscribeOnFileRemoved = this._monitorFileRemoved.subscribe(onFileRemoved)

    return (): void => {
      unsubscribeOnFileWritten()
      unsubscribeOnFileRemoved()
    }
  }

  public async removeFile(uri: string): Promise<void> {
    const assetFileItem: IAssetFileItem | undefined = this._assetFileItemMap.get(uri)
    if (assetFileItem === undefined) {
      await this._dataStorage.remove(uri)
      return
    }

    const data = await this._dataStorage.load(uri, assetFileItem)
    const item: IFileItem = { ...assetFileItem, data: data as any }

    await this._dataStorage.remove(uri)
    this._assetFileItemMap.delete(uri)

    // Notify
    this._monitorFileRemoved.notify(item)
  }

  public async resolveFile(uri: string): Promise<IFileItem | undefined> {
    const assetFileItem: IAssetFileItem | undefined = this._assetFileItemMap.get(uri)
    if (assetFileItem === undefined) return undefined

    const data: IFileData = this._dataStorage.load(uri, assetFileItem)
    const item: IFileItem = { ...assetFileItem, data: data as any }
    return item
  }

  public async writeFile(rawItem: IRawFileItem): Promise<void> {
    const title: string = `[${this.constructor.name}.writeFile]`
    const { datatype, mimetype, uri, data } = rawItem
    const assetItem = this._assetFileItemMap.get(uri)

    invariant(!assetItem || assetItem.datatype === datatype, `${title} invalid uri(${uri})`)

    const filepath: string = this._dataStorage.pathResolver.resolveFromUri(uri)
    const mtime: Date = new Date()
    const birthtime: Date = assetItem?.stat?.birthtime ?? mtime
    const stat: IAssetStat = { birthtime, mtime }

    let nextAssetItem: IAssetFileItem
    let fileItem: IFileItem
    switch (datatype) {
      case AssetDataTypeEnum.BINARY:
        nextAssetItem = {
          datatype,
          mimetype,
          absolutePath: filepath,
          encoding: undefined,
          stat,
        }
        fileItem = { ...nextAssetItem, data }
        break
      case AssetDataTypeEnum.TEXT:
        invariant(!!rawItem.encoding, `${title} missing encoding for text file: ${uri}`)
        nextAssetItem = {
          datatype,
          mimetype,
          absolutePath: filepath,
          encoding: rawItem.encoding,
          stat,
        }
        fileItem = { ...nextAssetItem, data }
        break
      case AssetDataTypeEnum.JSON:
        nextAssetItem = {
          datatype,
          mimetype,
          absolutePath: filepath,
          encoding: undefined,
          stat,
        }
        fileItem = { ...nextAssetItem, data }
        break
      default:
        throw new TypeError(`${title} Unexpected datatype: ${datatype}`)
    }
    await this._dataStorage.save(rawItem)
    this._assetFileItemMap.set(uri, nextAssetItem)

    // Notify
    this._monitorFileWritten.notify(fileItem)
  }
}
