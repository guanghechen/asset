import type { AssetService, AssetUUID } from '@guanghechen/site-api'
import type { PostAssetEntity } from './entity'
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
  public fetchPost(uuid: AssetUUID): PostAssetEntity | null {
    return this.postEntityManager.find(uuid)
  }
}
