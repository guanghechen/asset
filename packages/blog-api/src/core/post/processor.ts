import micromatch from 'micromatch'
import { AssetMarkdownProcessor } from '@guanghechen/asset-markdown'
import {
  MdastPropsRoot,
  MdastRoot,
  parseMdast,
  parseMdastProps,
} from '@guanghechen/asset-markdown-parser'
import {
  AssetProcessor,
  CategoryDataItem,
  ImmutableAssetDataManager,
  ImmutableCategoryDataManager,
  ImmutableTagDataManager,
  RoughAssetDataItem,
  TagDataItem,
  resolveLocalPath,
  writeJSONSync,
} from '@guanghechen/site-api'
import { BlogSourceType } from '../../config/blog'
import { PostAssetEntity, PostDataItem, PostEntity } from './entity'


export class PostProcessor implements AssetProcessor<PostDataItem> {
  protected readonly encoding: BufferEncoding
  protected readonly postDataRoot: string
  protected readonly postPattern: string[]
  protected readonly realProcessors: AssetProcessor<PostAssetEntity>[]

  public constructor(
    encoding: BufferEncoding,
    postDataRoot: string,
    postPattern: string[],
    realProcessors?: AssetProcessor<PostAssetEntity>[]
  ) {
    this.encoding = encoding
    this.postDataRoot = postDataRoot
    this.postPattern = postPattern
    this.realProcessors = realProcessors != null
      ? realProcessors
      : [
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
  }

  /**
   * @override
   */
  public processable(filepath: string): boolean {
    const isMatched = micromatch.isMatch(
      filepath, this.postPattern, { cwd: this.postDataRoot })
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
        type: BlogSourceType.POST,
        docType: postAssetEntity.type as any,
        content,
      }

      // save postEntity
      const postFilepath = resolveLocalPath(this.postDataRoot, postEntity.uuid + '.json')
      writeJSONSync(postFilepath, postEntity)

      const postItem: PostDataItem = {
        ...assetEntity,
        type: BlogSourceType.POST,
        docType: postAssetEntity.type as any,
      }

      return [postItem, tags, categories]
    }

    throw new Error(`no suitable AssetDataProcessor found for file ${ filepath }`)
  }
}
