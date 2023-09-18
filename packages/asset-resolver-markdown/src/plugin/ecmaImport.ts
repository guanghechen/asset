import type {
  IAssetPluginPolishApi,
  IAssetPluginPolishInput,
  IAssetPluginPolishNext,
  IAssetPluginPolishOutput,
  IAssetResolverPlugin,
} from '@guanghechen/asset-types'
import type { EcmaImport } from '@yozora/ast'
import { EcmaImportType } from '@yozora/ast'
import { collectNodes } from '@yozora/ast-util'
import type {
  IMarkdownAssetPolishOutput,
  IMarkdownPolishedData,
  IMarkdownResolverPlugin,
} from '../types'
import { isMarkdownPolishOutput } from '../types'

export function markdownPluginEcmaImport(): IMarkdownResolverPlugin {
  const plugin: IMarkdownResolverPlugin = (): IAssetResolverPlugin => {
    return {
      get displayName(): string {
        return '@guanghechen/asset-resolver-markdown/ecma-import'
      },
      async polish(
        input: Readonly<IAssetPluginPolishInput>,
        embryo: Readonly<IAssetPluginPolishOutput> | null,
        _api: Readonly<IAssetPluginPolishApi>,
        next: IAssetPluginPolishNext,
      ): Promise<IAssetPluginPolishOutput | null> {
        if (isMarkdownPolishOutput(input, embryo)) {
          const data: IMarkdownPolishedData = embryo.data
          const ecmaImports = collectNodes(data.ast, [EcmaImportType]) as EcmaImport[]
          const result: IMarkdownAssetPolishOutput = {
            ...embryo,
            data: { ...data, ecmaImports },
          }
          return next(result)
        }
        return next(embryo)
      },
    }
  }
  return plugin
}
