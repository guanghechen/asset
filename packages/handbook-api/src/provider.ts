import { AssetFileProcessor } from '@guanghechen/asset-file'
import type { AssetProcessor } from '@guanghechen/site-api'
import { AssetDataProvider } from '@guanghechen/site-api'
import type { HandbookConfig } from './config/handbook'
import { HandbookSourceType } from './config/handbook'
import { HandbookEntryDataManager } from './core/entry/manager'
import { PostEntityManager } from './core/post/manager'
import { PostProcessor } from './core/post/processor'
import { PostService } from './core/post/service'

/**
 * props for creating HandbookDataProvider
 */
export interface HandbookDataProviderProps {
  /**
   * Handbook asset processors
   */
  processors?: AssetProcessor[]
}

export class HandbookDataProvider extends AssetDataProvider<HandbookConfig> {
  public readonly postService: PostService

  constructor(
    handbookConfig: HandbookConfig,
    props: HandbookDataProviderProps = {},
  ) {
    const { source } = handbookConfig

    // Create AssetParser
    const postProcessor = new PostProcessor({
      routeRoot: handbookConfig.routeRoot,
      urlRoot: handbookConfig.urlRoot,
      subSiteDataRoot: handbookConfig.dataRoot,
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
        assetType: HandbookSourceType.IMAGE,
      }),
      new AssetFileProcessor({
        sourceRoot: source.image.sourceRoot,
        dataRoot: source.file.dataRoot,
        patterns: source.file.pattern,
        assetType: HandbookSourceType.FILE,
      }),
    ]

    // Build AssetDataProvider
    super({
      subSiteConfig: handbookConfig,
      processors,
      EntryDataManagerImpl: HandbookEntryDataManager,
    })

    // Create PostService
    const postDataManager = new PostEntityManager(source.post.dataRoot)
    const postService = new PostService(postDataManager, this.assetService)
    this.postService = postService
  }
}
