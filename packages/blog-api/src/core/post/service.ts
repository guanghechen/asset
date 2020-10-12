import type {
  AssetDataItem,
  AssetService,
  AssetUUID,
} from '@guanghechen/site-api'
import { BlogSourceType } from '../../config/blog'
import { PostDataItem, PostEntity } from './entity'
import type { PostEntityManager } from './manager'


export class PostService {
  protected readonly postEntityManager: PostEntityManager
  protected readonly assetService: AssetService

  public constructor(
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
  public fetchPost(uuid: AssetUUID): PostEntity | null {
    return this.postEntityManager.find(uuid)
  }

  /**
   * Fetch posts with pagination { page, size }
   * @param page  page number
   * @param size  page size
   */
  public fetchPosts(
    page: number,
    size: number,
  ): PostDataItem[] {
    const result: AssetDataItem[] = this.assetService
      .fetchAssets(BlogSourceType.POST, page, size)
    return result as PostDataItem[]
  }
}
