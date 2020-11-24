import { AssetDataProvider, AssetProcessor } from '@guanghechen/site-api'
import type { HandbookConfig } from './config/handbook'
import { createHandbookEntryDataManager } from './core/entry/manager'
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
  /**
   * The prefix of 'pathname' of HandbookMenuLeafNode
   */
  routePrefix?: string
}


export class HandbookDataProvider extends AssetDataProvider<HandbookConfig> {
  public readonly postService: PostService
  public readonly routePrefix?: string

  public constructor(
    handbookConfig: HandbookConfig,
    props: HandbookDataProviderProps = {},
  ) {
    const { source } = handbookConfig

    // Create AssetParser
    const postProcessor = new PostProcessor({
      dataRoot: source.post.dataRoot,
      patterns: source.post.pattern,
      encoding: source.post.encoding,
    })
    const processors: AssetProcessor[] = props.processors || [postProcessor]

    // Build AssetDataProvider
    super({
      subSiteConfig: handbookConfig,
      processors,
      EntryDataManagerImpl: createHandbookEntryDataManager(props.routePrefix),
    })

    // Create PostService
    const postDataManager = new PostEntityManager(source.post.dataRoot)
    const postService = new PostService(postDataManager, this.assetService)
    this.postService = postService
  }
}
