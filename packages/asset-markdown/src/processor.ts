import dayjs from 'dayjs'
import yaml from 'js-yaml'
import invariant from 'tiny-invariant'
import {
  AssetProcessor,
  CategoryDataItem,
  ImmutableCategoryDataManager,
  ImmutableTagDataManager,
  RawCategoryDataItem,
  RawTagDataItem,
  RoughAssetDataItem,
  TagDataItem,
} from '@guanghechen/site-api'
import { AssetMarkdownEntity, AssetMarkdownType } from './entity'


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
}


/**
 * Processor for handle markdown asset
 */
export class AssetMarkdownProcessor implements AssetProcessor<AssetMarkdownEntity> {
  protected readonly encoding: BufferEncoding
  protected readonly isMetaOptional: boolean

  public constructor(props: AssetMarkdownProcessorProps) {
    const { encoding, isMetaOptional = true, processable } = props
    this.encoding = encoding
    this.isMetaOptional = isMetaOptional

    if (processable != null) {
      this.processable = processable.bind(this)
    }
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
  public process(
    filepath: string,
    _rawContent: Buffer,
    roughAsset: RoughAssetDataItem,
    tagDataManager: ImmutableTagDataManager,
    categoryDataManager: ImmutableCategoryDataManager,
  ): [AssetMarkdownEntity, TagDataItem[], CategoryDataItem[][]] {
    const rawContent: string = _rawContent.toString(this.encoding)
    let match: string[] | null = /^\s*[-]{3,}\n\s*([\s\S]*?)[-]{3,}\n/.exec(rawContent)

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

    // resolve content
    const content: string = rawContent.slice(match[0].length).trim()

    const entity: AssetMarkdownEntity = {
      uuid,
      type: AssetMarkdownType,
      fingerprint: roughAsset.fingerprint,
      location: roughAsset.location,
      lastModifiedTime: roughAsset.lastModifiedTime,
      createAt,
      updateAt,
      title,
      tags: tags.map(tag => tag.uuid),
      categories: categories.map(cp => cp.map(c => c.uuid)),
      content,
      summary: '',
    }

    return [entity, tags, categories]
  }
}
