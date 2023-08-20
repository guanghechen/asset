export interface IAssetPluginParseApi {
  /**
   * Load source content.
   * @param pathRelativeToCurDir the path relative to the parent path of the current resource.
   */
  loadContent(pathRelativeToCurDir: string): Promise<Buffer | null>
  /**
   * Resolve asset slug.
   * @param slug
   */
  resolveSlug(slug: string | null | undefined): string | null
}

export interface IAssetPluginParseNext {
  (embryo: Readonly<IAssetPluginParseOutput> | null):
    | IAssetPluginParseOutput
    | null
    | Promise<IAssetPluginParseOutput | null>
}

export interface IAssetPluginParse {
  (
    input: Readonly<IAssetPluginParseInput>,
    embryo: Readonly<IAssetPluginParseOutput> | null,
    api: Readonly<IAssetPluginParseApi>,
    next: IAssetPluginParseNext,
  ): IAssetPluginParseOutput | null | Promise<IAssetPluginParseOutput | null>
}

export interface IAssetPluginParseInput {
  /**
   * Asset type.
   */
  type: string
  /**
   * Asset tittle.
   */
  title: string
  /**
   * The source file name which can be used to locate this asset by `api.loadContent(filename)`.
   */
  filename: string
}

export interface IAssetPluginParseOutput<D = unknown> {
  /**
   * Asset data
   */
  data: D | null
}