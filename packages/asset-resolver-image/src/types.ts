import type {
  IAssetPluginPolishInput,
  IAssetPluginPolishOutput,
  IBinaryFileData,
} from '@guanghechen/asset-types'

export const ImageAssetType = 'image'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type ImageAssetType = typeof ImageAssetType

export type IImageAssetPolishInputData = void
export type IImageAssetPolishInput = IAssetPluginPolishInput<IImageAssetPolishInputData>

export type IImageAssetPolishOutputData = IBinaryFileData
export type IImageAssetPolishOutput = IAssetPluginPolishOutput<IImageAssetPolishOutputData>

export const isImageAssetPolishInput = (
  input: Readonly<IAssetPluginPolishInput>,
): input is Readonly<IImageAssetPolishInput> => input.sourcetype === ImageAssetType
