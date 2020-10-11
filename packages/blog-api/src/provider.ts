import {
  AssetDataProvider,
  AssetProcessor,
  AssetUUID,
} from '@guanghechen/site-api'
import type { BlogConfig } from './config/blog'
import type { PostDataItem, PostEntity } from './core/post/entity'
import { PostEntityManager } from './core/post/manager'
import { PostProcessor } from './core/post/processor'
import { PostService } from './core/post/service'


export class BlogDataProvider extends AssetDataProvider<BlogConfig> {
  protected readonly postService: PostService

  public constructor(blogConfig: BlogConfig) {
    const { source } = blogConfig

    // Create AssetParser
    const postProcessor = new PostProcessor(
      source.post.encoding!, source.post.dataRoot, source.post.pattern)
    const processors: AssetProcessor[] = [postProcessor]

    // Build AssetDataProvider
    super(blogConfig, processors)

    // Create PostService
    const postDataManager = new PostEntityManager(source.post.dataRoot)
    const postService = new PostService(postDataManager, this.assetService)
    this.postService = postService
  }

  public fetchPost(uuid: AssetUUID): PostEntity | null {
    return this.postService.fetchPost(uuid)
  }

  public fetchPosts(page: number, size: number): PostDataItem[] {
    return this.postService.fetchPosts(page, size)
  }
}
