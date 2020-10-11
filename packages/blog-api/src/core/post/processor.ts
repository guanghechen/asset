import dayjs from 'dayjs'
import yaml from 'js-yaml'
import micromatch from 'micromatch'
import invariant from 'tiny-invariant'
import { isNotEmptyString } from '@barusu/util-option'
import {
  AssetDataItem,
  AssetProcessor,
  CategoryDataItem,
  ImmutableCategoryDataManager,
  ImmutableTagDataManager,
  RawCategoryDataItem,
  RawTagDataItem,
  RoughAssetDataItem,
  TagDataItem,
  resolveLocalPath,
  writeJSONSync,
} from '@guanghechen/site-api'
import { PostAssetType, PostDataItem, PostEntity } from './entity'


export class PostProcessor implements AssetProcessor {
  protected readonly encoding: BufferEncoding
  protected readonly postDataRoot: string
  protected readonly postPattern: string[]

  public constructor(
    encoding: BufferEncoding,
    postDataRoot: string,
    postPattern: string[],
  ) {
    this.encoding = encoding
    this.postDataRoot = postDataRoot
    this.postPattern = postPattern
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
  ): [AssetDataItem, TagDataItem[], CategoryDataItem[][]] {
    const rawContent: string = _rawContent.toString(this.encoding)
    const match = /^\s*[-]{3,}\n\s*([\s\S]*?)[-]{3,}\n/.exec(rawContent)

    invariant(match != null, `No meta data found in ${ filepath }`)

    const meta: Record<string, any> = yaml.safeLoad(match[1]) as any
    invariant(isNotEmptyString(meta.uuid), `No uuid found in ${ filepath }`)

    const uuid: string = meta.uuid
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
    const content: string = rawContent.slice(match[0].length)

    const postEntity: PostEntity = {
      uuid,
      type: PostAssetType,
      fingerprint: roughAsset.fingerprint,
      location: roughAsset.location,
      lastModifiedTime: roughAsset.lastModifiedTime,
      createAt,
      updateAt,
      title,
      tags: tags.map(tag => tag.uuid),
      categories: categories.map(cp => cp.map(c => c.uuid)),
      docType: 'markdown',
      content,
    }

    // save postEntity
    const postFilepath = resolveLocalPath(this.postDataRoot, postEntity.uuid + '.json')
    writeJSONSync(postFilepath, postEntity)

    const postItem: PostDataItem = {
      uuid: postEntity.uuid,
      type: postEntity.type,
      fingerprint: postEntity.fingerprint,
      location: postEntity.location,
      lastModifiedTime: roughAsset.lastModifiedTime,
      createAt: postEntity.createAt,
      updateAt: postEntity.updateAt,
      title: postEntity.title,
      tags: postEntity.tags,
      categories: postEntity.categories,
      docType: postEntity.docType,
      summary: '',
    }

    return [postItem, tags, categories]
  }
}
