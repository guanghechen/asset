import type { IAssetPluginPolishInput, IAssetPluginPolishOutput } from '@guanghechen/asset-types'

export const ImageAssetType = 'image'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type ImageAssetType = typeof ImageAssetType

export type IImageAssetPolishInputData = void
export type IImageAssetPolishInput = IAssetPluginPolishInput<IImageAssetPolishInputData>

export type IImageAssetPolishOutputData = Buffer
export type IImageAssetPolishOutput = IAssetPluginPolishOutput<IImageAssetPolishOutputData>

export const isImageAssetPolishInput = (
  input: Readonly<IAssetPluginPolishInput> | null,
): input is Readonly<IImageAssetPolishInput> => input?.type === ImageAssetType
