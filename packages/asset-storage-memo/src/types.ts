import type { IAssetStat, IBinaryLike } from '@guanghechen/asset-types'

export enum FileType {
  FILE = 'file',
  FOLDER = 'folder',
}

export interface IFileFileItem {
  type: FileType.FILE
  path: string
  content: IBinaryLike
  encoding: BufferEncoding | undefined
  stat: IAssetStat
}

export interface IFileFolderItem {
  type: FileType.FOLDER
  path: string
}

export type IFileItem = IFileFileItem | IFileFolderItem

export interface IWatcher {
  patterns: string[]
  onAdd: (filepath: string) => void
  onChange: (filepath: string) => void
  onUnlink: (filepath: string) => void
}
