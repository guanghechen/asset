import type {
  IAssetPluginPolishInput,
  IAssetPluginPolishOutput,
  IBinaryFileData,
} from '@guanghechen/asset-types'

export const FileAssetType = 'file'

export type FileAssetType = typeof FileAssetType

export type IFileAssetPolishInputData = void
export type IFileAssetPolishInput = IAssetPluginPolishInput<IFileAssetPolishInputData>

export type IFileAssetPolishOutputData = IBinaryFileData
export type IFileAssetPolishOutput = IAssetPluginPolishOutput<IFileAssetPolishOutputData>

export const isFileAssetPolishInput = (
  input: Readonly<IAssetPluginPolishInput>,
): input is Readonly<IFileAssetPolishInput> => input.sourcetype === FileAssetType
