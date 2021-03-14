import { AssetFileProcessor } from '@guanghechen/asset-file'
import type { AssetProcessor } from '@guanghechen/site-api'
import { AssetDataProvider } from '@guanghechen/site-api'
import type { BlogConfig } from './config/blog'
import { BlogSourceType } from './config/blog'
import { PostEntityManager } from './core/post/manager'
import { PostProcessor } from './core/post/processor'
import { PostService } from './core/post/service'

/**
 * props for creating BlogDataProvider
 */
export interface BlogDataProviderProps {
  /**
   * Blog asset processors
   */
  processors?: AssetProcessor[]
}

export class BlogDataProvider extends AssetDataProvider<BlogConfig> {
  public readonly postService: PostService

  constructor(blogConfig: BlogConfig, props: BlogDataProviderProps = {}) {
    const { source } = blogConfig

    // Create AssetParser
    const postProcessor = new PostProcessor({
      routeRoot: blogConfig.routeRoot,
      urlRoot: blogConfig.urlRoot,
      subSiteDataRoot: blogConfig.dataRoot,
      sourceRoot: source.post.sourceRoot,
      dataRoot: source.post.dataRoot,
      patterns: source.post.pattern,
      encoding: source.post.encoding,
    })
    const processors: AssetProcessor[] = props.processors || [
      postProcessor,
      new AssetFileProcessor({
        sourceRoot: source.image.sourceRoot,
        dataRoot: source.image.dataRoot,
        patterns: source.image.pattern,
        assetType: BlogSourceType.IMAGE,
      }),
      new AssetFileProcessor({
        sourceRoot: source.image.sourceRoot,
        dataRoot: source.file.dataRoot,
        patterns: source.file.pattern,
        assetType: BlogSourceType.FILE,
      }),
    ]

    // Build AssetDataProvider
    super({
      subSiteConfig: blogConfig,
      processors,
    })

    // Create PostService
    const postDataManager = new PostEntityManager(source.post.dataRoot)
    const postService = new PostService(postDataManager, this.assetService)
    this.postService = postService
  }
}
