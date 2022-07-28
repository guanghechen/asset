import type { IAssetParserPluginPolishInput } from '@guanghechen/asset-core-parser'

export const FileAssetType = 'file'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type FileAssetType = typeof FileAssetType

export const isFileAsset = (
  input: Readonly<IAssetParserPluginPolishInput> | null,
): input is Readonly<IAssetParserPluginPolishInput<IFileResolvedData>> =>
  input?.type === FileAssetType

export interface IFileResolvedData {
  srcLocation: string
}

export type IFilePolishedData = Buffer
