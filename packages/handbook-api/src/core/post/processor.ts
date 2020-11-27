import micromatch from 'micromatch'
import path from 'path'
import invariant from 'tiny-invariant'
import {
  AssetMarkdownProcessor,
  MarkdownAssetDataItem,
} from '@guanghechen/asset-markdown'
import parseMd from '@guanghechen/asset-markdown-parser'
import {
  AssetProcessor,
  AssetType,
  CategoryDataItem,
  ImmutableAssetDataManager,
  ImmutableCategoryDataManager,
  ImmutableTagDataManager,
  RoughAssetDataItem,
  TagDataItem,
  resolveLocalPath,
  resolveUrlPath,
  writeJSON,
} from '@guanghechen/site-api'
import { HandbookSourceType } from '../../config/handbook'
import { PostDataItem } from './entity'


/**
 * Props for create PostProcessor
 */
export interface PostProcessorProps {
  /**
   * Route url prefix
   */
  routeRoot: string
  /**
   * Api url prefix
   */
  urlRoot: string
  /**
   * Root directory of post data
   */
  dataRoot: string
  /**
   * Glob pattern for matching post asset filepath
   */
  patterns: string[]
  /**
   * File encoding of post asset files
   * In fact, I would like to (force) you to use a uniform file encoding
   */
  encoding?: BufferEncoding
  /**
   * Process markdown asset
   */
  markdownProcessor?: AssetProcessor<MarkdownAssetDataItem>
  /**
   * Extra inner post data processors, such as parsing assets
   */
  extraProcessors?: AssetProcessor<PostDataItem>[]
}


/**
 * Post asset processor
 */
export class PostProcessor implements AssetProcessor<PostDataItem> {
  protected readonly routeRoot: string
  protected readonly urlRoot: string
  protected readonly dataRoot: string
  protected readonly patterns: string[]
  protected readonly encoding: BufferEncoding
  protected readonly realProcessors: AssetProcessor<PostDataItem>[]

  public constructor(props: PostProcessorProps) {
    const {
      routeRoot,
      urlRoot,
      dataRoot,
      patterns,
      encoding = 'utf-8',
      extraProcessors = [],
    } = props

    const {
      markdownProcessor = new AssetMarkdownProcessor({
        encoding,
        isMetaOptional: true,
        resolve: async (content, asset, _tdm, _cdm, assetDataManager) => {
          const routeRegex = /^[\s]*(route:)/
          const absoluteUrlRegex = /^~\/([\s\S]+)$/
          const relativeUrlRegex = /^[.]/

          const resolveUrl = (_url: string): string => {
            const isRoute = routeRegex.test(_url)
            const url = _url.trim().replace(routeRegex, '')

            const resolveApiUrl = (urlPath: string): string => {
              const location = assetDataManager.calcLocation(urlPath)
              const target = assetDataManager.locate(location)
              if (target == null) return url
              return resolveUrlPath(urlRoot, target.type, target.uuid + target.extname)
            }

            // absolute alias '~'
            const absoluteMatch = absoluteUrlRegex.exec(url)
            if (absoluteMatch != null) {
              if (isRoute) {
                return resolveUrlPath(routeRoot, absoluteMatch[1])
              }
              return resolveApiUrl(absoluteMatch[1])
            }

            // relative filepath
            const relativeMatch = relativeUrlRegex.exec(url)
            if (relativeMatch != null) {
              if (isRoute) {
                return resolveUrl(path.join(routeRoot, url))
              }
              const urlPath = path.join(path.dirname(asset.location), url)
              return resolveApiUrl(urlPath)
            }

            return url
          }

          const data = parseMd(content, resolveUrl)
          const postFilepath = resolveLocalPath(dataRoot, asset.uuid + asset.extname)
          await writeJSON(postFilepath, { ...asset, content: data })
        }
      }),
    } = props

    const realProcessors: AssetProcessor<PostDataItem>[] = [
      markdownProcessor as AssetProcessor<any>,
      ...extraProcessors,
    ]

    this.routeRoot = routeRoot
    this.urlRoot = urlRoot
    this.dataRoot = dataRoot
    this.patterns = patterns
    this.encoding = encoding
    this.realProcessors = realProcessors
  }

  /**
   * @override
   */
  public types(): AssetType[] {
    return [HandbookSourceType.POST]
  }

  /**
   * @override
   */
  public processable(filepath: string): boolean {
    const isMatched = micromatch.isMatch(
      filepath, this.patterns, { cwd: this.dataRoot })
    return isMatched
  }

  /**
   * @override
   */
  public * process(
    filepath: string,
    _rawContent: Buffer,
    roughAsset: RoughAssetDataItem,
    tagDataManager: ImmutableTagDataManager,
    categoryDataManager: ImmutableCategoryDataManager,
    assetDataManager: ImmutableAssetDataManager,
  ): Generator<
    [PostDataItem, TagDataItem[], CategoryDataItem[][]],
    Promise<void> | void,
    PostDataItem
  > {
    for (const processor of this.realProcessors) {
      if (!processor.processable(filepath)) continue
      const process = processor.process(
        filepath, _rawContent, roughAsset,
        tagDataManager, categoryDataManager, assetDataManager)

      const firstResult = process.next()
      invariant(
        !firstResult.done,
        'processor.process() first call should yield a triple'
      )

      const [PostDataItem, tags, categories] = firstResult.value
      const postItem: PostDataItem = {
        ...PostDataItem,
        type: HandbookSourceType.POST,
        docType: PostDataItem.type,
      }
      yield [postItem, tags, categories]

      // post processing
      while (true) {
        const result = process.next(postItem)
        if (result.done) return result.value
      }
    }

    throw new Error(`no suitable AssetDataProcessor found for file ${ filepath }`)
  }
}
