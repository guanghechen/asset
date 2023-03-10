import type {
  IAssetPluginPolishApi,
  IAssetPluginPolishInput,
  IAssetPluginPolishNext,
  IAssetPluginPolishOutput,
  IAssetPolishPlugin,
} from '@guanghechen/asset-core-plugin'
import type { EcmaImport } from '@yozora/ast'
import { EcmaImportType } from '@yozora/ast'
import { collectNodes } from '@yozora/ast-util'
import type { IMarkdownPolishedData } from '../types'
import { isMarkdownPolishedData } from '../util/misc'

export class MarkdownParsePluginEcmaImport implements IAssetPolishPlugin {
  public readonly displayName: string = '@guanghechen/asset-parser-markdown/ecma-import'

  public async polish(
    input: Readonly<IAssetPluginPolishInput>,
    embryo: Readonly<IAssetPluginPolishOutput> | null,
    api: Readonly<IAssetPluginPolishApi>,
    next: IAssetPluginPolishNext,
  ): Promise<IAssetPluginPolishOutput | null> {
    if (isMarkdownPolishedData(input, embryo)) {
      const data = await embryo.data
      const ecmaImports = collectNodes(data.ast, [EcmaImportType]) as EcmaImport[]
      const result: IAssetPluginPolishOutput<IMarkdownPolishedData> = {
        ...embryo,
        data: {
          ...data,
          ecmaImports,
        },
      }
      return next(result)
    }
    return next(embryo)
  }
}
