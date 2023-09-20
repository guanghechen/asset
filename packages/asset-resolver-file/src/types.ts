import type {
  IAssetPluginPolishInput,
  IAssetPluginPolishOutput,
  IBinaryFileData,
} from '@guanghechen/asset-types'

export const FileAssetType = 'file'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type FileAssetType = typeof FileAssetType

export type IFileAssetPolishInputData = void
export type IFileAssetPolishInput = IAssetPluginPolishInput<IFileAssetPolishInputData>

export type IFileAssetPolishOutputData = IBinaryFileData
export type IFileAssetPolishOutput = IAssetPluginPolishOutput<IFileAssetPolishOutputData>

export const isFileAssetPolishInput = (
  input: Readonly<IAssetPluginPolishInput> | null,
): input is Readonly<IFileAssetPolishInput> => input?.sourcetype === FileAssetType
