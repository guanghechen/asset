import micromatch from 'micromatch'
import { AssetMarkdownProcessor } from '@guanghechen/asset-markdown'
import {
  MdastPropsRoot,
  MdastRoot,
  parseMdast,
  parseMdastProps,
} from '@guanghechen/ast-md-props'
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
  writeJSONSync,
} from '@guanghechen/site-api'
import { HandbookSourceType } from '../../config/handbook'
import { PostAssetEntity, PostDataItem, PostEntity } from './entity'


/**
 * Props for create PostProcessor
 */
export interface PostProcessorProps {
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
   * Inner post data processors, such as AssetMarkdownProcessor
   */
  realProcessors?: AssetProcessor<PostAssetEntity>[]
}


/**
 * Post asset processor
 */
export class PostProcessor implements AssetProcessor<PostDataItem> {
  protected readonly dataRoot: string
  protected readonly patterns: string[]
  protected readonly encoding: BufferEncoding
  protected readonly realProcessors: AssetProcessor<PostAssetEntity>[]

  public constructor(props: PostProcessorProps) {
    const {
      dataRoot,
      patterns,
      encoding = 'utf-8',
      realProcessors = [
        new AssetMarkdownProcessor<MdastPropsRoot>({
          encoding,
          isMetaOptional: true,
          parse: (rawContent: string): MdastPropsRoot => {
            const mdast: MdastRoot = parseMdast(rawContent)
            const MdastProps: MdastPropsRoot = parseMdastProps(mdast)
            return MdastProps
          }
        }),
      ]
    } = props

    this.encoding = encoding
    this.dataRoot = dataRoot
    this.patterns = patterns
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
  public process(
    filepath: string,
    _rawContent: Buffer,
    roughAsset: RoughAssetDataItem,
    tagDataManager: ImmutableTagDataManager,
    categoryDataManager: ImmutableCategoryDataManager,
    assetDataManager: ImmutableAssetDataManager,
  ): [PostDataItem, TagDataItem[], CategoryDataItem[][]] {
    for (const processor of this.realProcessors) {
      if (!processor.processable(filepath)) continue
      const [postAssetEntity, tags, categories] = processor.process(
        filepath, _rawContent, roughAsset,
        tagDataManager, categoryDataManager, assetDataManager)

      const { content, ...assetEntity } = postAssetEntity
      const postEntity: PostEntity = {
        ...assetEntity,
        type: HandbookSourceType.POST,
        docType: postAssetEntity.type as any,
        content,
      }

      // save postEntity
      const postFilepath = resolveLocalPath(this.dataRoot, postEntity.uuid + '.json')
      writeJSONSync(postFilepath, postEntity)

      const postItem: PostDataItem = {
        ...assetEntity,
        type: HandbookSourceType.POST,
        docType: postAssetEntity.type as any,
      }

      return [postItem, tags, categories]
    }

    throw new Error(`no suitable AssetDataProcessor found for file ${ filepath }`)
  }
}
