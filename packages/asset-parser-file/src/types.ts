import type { IAssetPluginPolishInput } from '@guanghechen/asset-core-plugin'

export const FileAssetType = 'file'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type FileAssetType = typeof FileAssetType

export const isFileAsset = (
  input: Readonly<IAssetPluginPolishInput> | null,
): input is Readonly<IAssetPluginPolishInput<IFileResolvedData>> => input?.type === FileAssetType

export interface IFileResolvedData {
  filename: string
}

export type IFilePolishedData = Buffer
