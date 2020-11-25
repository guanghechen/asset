import dayjs from 'dayjs'
import yaml from 'js-yaml'
import invariant from 'tiny-invariant'
import type {
  AssetProcessor,
  CategoryDataItem,
  ImmutableAssetDataManager,
  ImmutableCategoryDataManager,
  ImmutableTagDataManager,
  RawCategoryDataItem,
  RawTagDataItem,
  RoughAssetDataItem,
  TagDataItem,
} from '@guanghechen/site-api'
import { MarkdownAssetDataItem, MarkdownAssetType } from './entity'


/**
 * Props for building AssetMarkdownProcessor
 */
export interface AssetMarkdownProcessorProps {
  /**
   * Encoding of markdown files
   */
  encoding: BufferEncoding
  /**
   * Whether the meta data is optional
   */
  isMetaOptional?: boolean
  /**
   * Custom function to determine whether an asset file processable
   */
  processable?: AssetProcessor['processable']
  /**
   * Deeply processing the content
   */
  resolve?: (
    content: string,
    asset: MarkdownAssetDataItem,
    tagDataManager: ImmutableTagDataManager,
    categoryDataManager: ImmutableCategoryDataManager,
    assetDataManager: ImmutableAssetDataManager,
  ) => Promise<void> | void
}


/**
 * Processor for handle markdown asset
 */
export class AssetMarkdownProcessor
  implements AssetProcessor<MarkdownAssetDataItem> {
  protected readonly encoding: BufferEncoding
  protected readonly isMetaOptional: boolean
  protected readonly resolve: AssetMarkdownProcessorProps['resolve']
  protected readonly pattern: RegExp = /^\s*[-]{3,}\n\s*([\s\S]*?)[-]{3,}\n/

  public constructor(props: AssetMarkdownProcessorProps) {
    const { encoding, isMetaOptional = true, processable, resolve } = props
    this.encoding = encoding
    this.isMetaOptional = isMetaOptional

    if (processable != null) {
      this.processable = processable
    }

    this.resolve = resolve
  }

  /**
   * @override
   */
  public processable(filepath: string): boolean {
    return /\.md$/.test(filepath)
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
    [MarkdownAssetDataItem, TagDataItem[], CategoryDataItem[][]],
    Promise<void> | void,
    MarkdownAssetDataItem
  > {
    const rawContent: string = _rawContent.toString(this.encoding)
    let match: string[] | null = this.pattern.exec(rawContent)

    if (this.isMetaOptional) {
      if (match == null) match = ['', '']
    } else {
      invariant(match != null, `No meta data found in ${ filepath }`)
    }

    const meta: Record<string, any> = yaml.safeLoad(match[1]) || {} as any
    const uuid: string = meta.uuid || roughAsset.uuid
    const title: string = meta.title || roughAsset.title
    const createAt = meta.createAt != null
      ? dayjs(meta.createAt).toDate().toISOString()
      : roughAsset.createAt
    const updateAt = meta.updateAt != null
      ? dayjs(meta.updateAt).toDate().toISOString()
      : roughAsset.updateAt

    // resolve tags
    const rawTags = (meta.tags || []) as RawTagDataItem[]
    const tags: TagDataItem[] = rawTags.map(rawTag => (
      tagDataManager.normalize(rawTag)
    ))

    // resolve categories
    const rawCategories = (meta.categories || []) as RawCategoryDataItem[][]
    const categories: CategoryDataItem[][] = rawCategories.map(categoryPath => (
      categoryPath.map(c => categoryDataManager.normalize(c))
    ))

    const asset: MarkdownAssetDataItem = {
      uuid,
      type: MarkdownAssetType,
      fingerprint: roughAsset.fingerprint,
      location: roughAsset.location,
      lastModifiedTime: roughAsset.lastModifiedTime,
      createAt,
      updateAt,
      title,
      tags: tags.map(tag => tag.uuid),
      categories: categories.map(cp => cp.map(c => c.uuid)),
    }

    const resolvedAsset = yield [asset, tags, categories]

    // resolve content
    const content = rawContent.substring(match[0].length)
    if (this.resolve == null) return
    return this.resolve(
      content, resolvedAsset,
      tagDataManager, categoryDataManager, assetDataManager
    )
  }
}
