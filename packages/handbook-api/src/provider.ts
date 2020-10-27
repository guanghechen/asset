import { AssetDataProvider, AssetProcessor } from '@guanghechen/site-api'
import type { HandbookConfig } from './config/handbook'
import { PostEntityManager } from './core/post/manager'
import { PostProcessor } from './core/post/processor'
import { PostService } from './core/post/service'


export class HandbookDataProvider extends AssetDataProvider<HandbookConfig> {
  public readonly postService: PostService

  public constructor(handbookConfig: HandbookConfig) {
    const { source } = handbookConfig

    // Create AssetParser
    const postProcessor = new PostProcessor(
      source.post.encoding!, source.post.dataRoot, source.post.pattern)
    const processors: AssetProcessor[] = [postProcessor]

    // Build AssetDataProvider
    super(handbookConfig, processors)

    // Create PostService
    const postDataManager = new PostEntityManager(source.post.dataRoot)
    const postService = new PostService(postDataManager, this.assetService)
    this.postService = postService
  }
}
