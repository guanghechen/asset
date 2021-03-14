import type {
  AssetDataItem,
  AssetService,
  AssetUUID,
} from '@guanghechen/site-api'
import { BlogSourceType } from '../../config/blog'
import type { PostAssetEntity, PostDataItem } from './entity'
import type { PostEntityManager } from './manager'

export class PostService {
  protected readonly postEntityManager: PostEntityManager
  protected readonly assetService: AssetService

  constructor(
    postEntityManager: PostEntityManager,
    assetService: AssetService,
  ) {
    this.postEntityManager = postEntityManager
    this.assetService = assetService
  }

  /**
   * Fetch post by uuid
   * @param uuid
   */
  public fetchPost(uuid: AssetUUID): PostAssetEntity | null {
    return this.postEntityManager.find(uuid)
  }

  /**
   * Fetch posts with pagination { offset, limit }
   *
   * @param offset  start index
   * @param limit   size of results
   */
  public fetchPosts(offset: number, limit: number): PostDataItem[] {
    const result: AssetDataItem[] = this.assetService.fetchAssets(
      BlogSourceType.POST,
      offset,
      limit,
    )
    return result as PostDataItem[]
  }
}
