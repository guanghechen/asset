import type {
  IAssetPluginPolishApi,
  IAssetPluginPolishInput,
  IAssetPluginPolishNext,
  IAssetPluginPolishOutput,
  IAssetResolverPlugin,
} from '@guanghechen/asset-types'
import type { Definition, Image, ImageReference } from '@yozora/ast'
import { ImageReferenceType, ImageType } from '@yozora/ast'
import { traverseAst } from '@yozora/ast-util'
import type {
  IMarkdownAssetPolishOutput,
  IMarkdownPolishedData,
  IMarkdownResolverPlugin,
  IPreviewImageItem,
} from '../types'
import { isMarkdownPolishOutput } from '../types'

interface IParams {
  /**
   * Preset definition definitions.
   */
  presetPreviewImages?: ReadonlyArray<IPreviewImageItem>
}

/**
 * This plugin is used to collect all images in the markdown content.
 * !!!Should push after the plugin of 'MarkdownPolishDefinition'!!!
 */
export function markdownPluginImages(params: IParams = {}): IMarkdownResolverPlugin {
  const presetImages: IPreviewImageItem[] = []
  {
    const srcSets: Set<string> = new Set<string>()
    for (const item of params.presetPreviewImages ?? []) {
      if (srcSets.has(item.src)) continue
      srcSets.add(item.src)
      presetImages.push({ src: item.src, alt: item.alt })
    }
    srcSets.clear()
  }

  const plugin: IMarkdownResolverPlugin = (): IAssetResolverPlugin => {
    return {
      get displayName(): string {
        return '@guanghechen/asset-resolver-markdown/images'
      },
      async polish(
        input: Readonly<IAssetPluginPolishInput>,
        embryo: Readonly<IAssetPluginPolishOutput> | null,
        _api: Readonly<IAssetPluginPolishApi>,
        next: IAssetPluginPolishNext,
      ): Promise<IAssetPluginPolishOutput | null> {
        if (isMarkdownPolishOutput(input, embryo)) {
          const data: IMarkdownPolishedData = embryo.data
          const images: IPreviewImageItem[] = []
          const srcSets: Set<string> = new Set<string>(presetImages.map(item => item.src))

          traverseAst(data.ast, null, node => {
            switch (node.type) {
              case ImageType: {
                const { alt, url } = node as Image
                if (!srcSets.has(url)) {
                  srcSets.add(url)
                  images.push({ src: url, alt })
                }
                break
              }
              case ImageReferenceType: {
                if (data.definitionMap) {
                  const { alt, identifier } = node as ImageReference
                  const definition: Definition | undefined = data.definitionMap[identifier]
                  const url: string | undefined = definition?.url
                  if (url && !srcSets.has(url)) {
                    srcSets.add(url)
                    images.push({ alt, src: url })
                  }
                }
                break
              }
              default:
            }
          })

          srcSets.clear()
          const result: IMarkdownAssetPolishOutput = {
            ...embryo,
            data: { ...data, images },
          }
          return next(result)
        }
        return next(embryo)
      },
    }
  }
  return plugin
}
