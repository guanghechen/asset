import { AssetDataTypeEnum } from '@guanghechen/asset-types'
import type {
  IAssetStat,
  IAssetTargetDataStorage,
  IAssetTargetStorage,
  IAssetTargetStorageMonitor,
  IFileData,
  IParametersOfOnFileRemoved,
  IParametersOfOnFileWritten,
  IRawTargetItem,
  ITargetItem,
  ITargetItemWithoutData,
} from '@guanghechen/asset-types'
import invariant from '@guanghechen/invariant'
import { Monitor } from '@guanghechen/monitor'
import type { IMonitor, IMonitorUnsubscribe } from '@guanghechen/monitor'

const noop = (..._args: any[]): void => {}

export class AssetTargetStorage implements IAssetTargetStorage {
  protected readonly _monitorFileWritten: IMonitor<IParametersOfOnFileWritten>
  protected readonly _monitorFileRemoved: IMonitor<IParametersOfOnFileRemoved>
  protected readonly _fileItemMap: Map<string, ITargetItemWithoutData>
  protected readonly _dataStorage: IAssetTargetDataStorage
  private _destroyed: boolean

  constructor(dataStorage: IAssetTargetDataStorage) {
    this._monitorFileWritten = new Monitor<IParametersOfOnFileWritten>('onFileWritten')
    this._monitorFileRemoved = new Monitor<IParametersOfOnFileRemoved>('onFileRemoved')
    this._fileItemMap = new Map<string, ITargetItemWithoutData>()
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
    const fileItem: ITargetItemWithoutData | undefined = this._fileItemMap.get(uri)
    if (fileItem === undefined) {
      await this._dataStorage.remove(uri)
      return
    }

    const data = await this._dataStorage.load(uri, fileItem)
    const item: ITargetItem = { ...fileItem, data: data as any }

    await this._dataStorage.remove(uri)
    this._fileItemMap.delete(uri)

    // Notify
    this._monitorFileRemoved.notify(item)
  }

  public async resolveFile(uri: string): Promise<ITargetItem | undefined> {
    const fileItem: ITargetItemWithoutData | undefined = this._fileItemMap.get(uri)
    if (fileItem === undefined) return undefined

    const data: IFileData | undefined = await this._dataStorage.load(uri, fileItem)
    const item: ITargetItem = { ...fileItem, data: data as any }
    return item
  }

  public async writeFile(rawItem: IRawTargetItem): Promise<void> {
    const title: string = `[${this.constructor.name}.writeFile]`
    const { sourcetype, mimetype, datatype, uri, data } = rawItem
    const fileItem = this._fileItemMap.get(uri)

    invariant(!fileItem || fileItem.datatype === datatype, `${title} invalid uri(${uri})`)

    const mtime: Date = new Date()
    const birthtime: Date = fileItem?.stat?.birthtime ?? mtime
    const stat: IAssetStat = { birthtime, mtime }

    let nextAssetItem: ITargetItemWithoutData
    let item: ITargetItem
    switch (datatype) {
      case AssetDataTypeEnum.BINARY:
        nextAssetItem = {
          datatype,
          mimetype,
          sourcetype,
          uri,
          encoding: undefined,
          stat,
        }
        item = { ...nextAssetItem, data }
        break
      case AssetDataTypeEnum.TEXT:
        invariant(!!rawItem.encoding, `${title} missing encoding for text file: ${uri}`)
        nextAssetItem = {
          datatype,
          mimetype,
          sourcetype,
          uri,
          encoding: rawItem.encoding,
          stat,
        }
        item = { ...nextAssetItem, data }
        break
      case AssetDataTypeEnum.JSON:
        nextAssetItem = {
          datatype,
          mimetype,
          sourcetype,
          uri,
          encoding: undefined,
          stat,
        }
        item = { ...nextAssetItem, data }
        break
      default:
        throw new TypeError(`${title} Unexpected datatype: ${datatype}`)
    }
    await this._dataStorage.save(rawItem)
    this._fileItemMap.set(uri, nextAssetItem)

    // Notify
    this._monitorFileWritten.notify(item)
  }
}
