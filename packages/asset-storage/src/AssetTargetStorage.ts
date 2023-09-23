import { AssetDataTypeEnum } from '@guanghechen/asset-types'
import type {
  IAsset,
  IAssetMapTargetItem,
  IAssetMapTargetItemWithoutData,
  IAssetTargetDataStorage,
  IAssetTargetStorage,
  IAssetTargetStorageMonitor,
  IFileData,
  IParametersOfOnFileRemoved,
  IParametersOfOnFileWritten,
  ITargetItem,
  ITargetItemWithoutData,
} from '@guanghechen/asset-types'
import invariant from '@guanghechen/invariant'
import { Monitor } from '@guanghechen/monitor'
import type { IMonitor, IMonitorUnsubscribe } from '@guanghechen/monitor'
import { resolveUriFromTargetItem } from './util'

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

  public async writeFile(rawItem: ITargetItem): Promise<void> {
    const __title__: string = `[${this.constructor.name}.writeFile]`
    const uri: string = resolveUriFromTargetItem(rawItem)
    const fileItem = this._fileItemMap.get(uri)

    invariant(
      !fileItem || fileItem.datatype === rawItem.datatype,
      `${__title__} invalid uri(${uri})`,
    )

    const { datatype } = rawItem
    switch (datatype) {
      case AssetDataTypeEnum.BINARY:
      case AssetDataTypeEnum.TEXT:
      case AssetDataTypeEnum.JSON: {
        const { data, ...rawFileItem } = rawItem
        const asset: IAsset = { ...rawItem.asset }
        const itemWithoutData: ITargetItemWithoutData = { ...rawFileItem, asset }
        const item: ITargetItem = { ...itemWithoutData, data } as unknown as ITargetItem
        await this._dataStorage.save(item)
        this._fileItemMap.set(uri, itemWithoutData)
        this._monitorFileWritten.notify(item)
        break
      }
      case AssetDataTypeEnum.ASSET_MAP: {
        const itemWithoutData: IAssetMapTargetItemWithoutData = {
          datatype: AssetDataTypeEnum.ASSET_MAP,
          uri: rawItem.uri,
        }
        const item: IAssetMapTargetItem = { ...itemWithoutData, data: rawItem.data }
        await this._dataStorage.save(item)
        this._fileItemMap.set(uri, itemWithoutData)
        this._monitorFileWritten.notify(item)
        break
      }
      default:
        throw new TypeError(`${__title__} invalid datatype(${datatype})`)
    }
  }
}
