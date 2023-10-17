import type { IAssetResolverPlugin } from '@guanghechen/asset-types'
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
      async polish(input, embryo, _api, next) {
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
