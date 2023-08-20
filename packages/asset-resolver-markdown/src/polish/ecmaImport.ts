import type {
  IAssetPluginPolishApi,
  IAssetPluginPolishInput,
  IAssetPluginPolishNext,
  IAssetPluginPolishOutput,
  IAssetPolishPlugin,
} from '@guanghechen/asset-types'
import type { EcmaImport } from '@yozora/ast'
import { EcmaImportType } from '@yozora/ast'
import { collectNodes } from '@yozora/ast-util'
import type { IMarkdownAssetPolishOutput } from '../types'
import { isMarkdownPolishOutput } from '../types'

export class MarkdownPolishEcmaImport implements IAssetPolishPlugin {
  public readonly displayName: string = '@guanghechen/asset-resolver-markdown/ecma-import'

  public async polish(
    input: Readonly<IAssetPluginPolishInput>,
    embryo: Readonly<IAssetPluginPolishOutput> | null,
    api: Readonly<IAssetPluginPolishApi>,
    next: IAssetPluginPolishNext,
  ): Promise<IAssetPluginPolishOutput | null> {
    if (isMarkdownPolishOutput(input, embryo)) {
      const data = await embryo.data
      const ecmaImports = collectNodes(data.ast, [EcmaImportType]) as EcmaImport[]
      const result: IMarkdownAssetPolishOutput = {
        ...embryo,
        data: { ...data, ecmaImports },
      }
      return next(result)
    }
    return next(embryo)
  }
}
