export interface IAssetStat {
  birthtime: Date
  mtime: Date
}

export type ITextFileData = string
export type IBinaryFileData = Buffer
export type IJsonFileData = object | string | boolean | number | null
export type IFileData = ITextFileData | IBinaryFileData | IJsonFileData
