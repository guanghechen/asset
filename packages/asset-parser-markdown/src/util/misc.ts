import type {
  IAssetPluginPolishInput,
  IAssetPluginPolishOutput,
} from '@guanghechen/asset-core-plugin'
import type { IMarkdownPolishedData, IMarkdownResolvedData } from '../types'
import { MarkdownAssetType } from '../types'

export const isMarkdownAsset = (
  input: Readonly<IAssetPluginPolishInput> | null,
): input is Readonly<IAssetPluginPolishInput<IMarkdownResolvedData>> =>
  input?.type === MarkdownAssetType

export const isMarkdownPolishedData = (
  input: Readonly<IAssetPluginPolishInput> | null,
  embryo: Readonly<IAssetPluginPolishOutput> | null,
): embryo is Readonly<IAssetPluginPolishOutput<IMarkdownPolishedData>> => {
  return isMarkdownAsset(input) && embryo !== null
}
