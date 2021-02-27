import micromatch from 'micromatch'
import {
  AssetProcessor,
  AssetType,
  AssetTypeItem,
  CategoryDataItem,
  RoughAssetDataItem,
  TagDataItem,
  resolveLocalPath,
  writeFile,
} from '@guanghechen/site-api'
import { FileAssetDataItem, FileAssetType } from './entity'

/**
 * Props for building AssetFileProcessor
 */
export interface AssetFileProcessorProps {
  /**
   * Root directory of the source files (basedir of the patterns)
   */
  sourceRoot: string
  /**
   * Root directory of the asset file
   */
  dataRoot: string
  /**
   * Glob pattern for matching post asset filepath
   */
  patterns: string[]
  /**
   * Asset type
   * @default FileAssetType
   */
  assetType?: AssetType
  /**
   * Custom function to determine whether an asset file processable
   */
  processable?: AssetProcessor['processable']
}


/**
 * Processor for handle file asset
 */
export class AssetFileProcessor implements AssetProcessor<FileAssetDataItem> {
  protected readonly sourceRoot: string
  protected readonly dataRoot: string
  protected readonly patterns: string[]
  protected readonly assetType: AssetType

  public constructor(props: AssetFileProcessorProps) {
    const {
      sourceRoot,
      dataRoot,
      patterns,
      assetType = FileAssetType,
      processable,
    } = props

    this.sourceRoot = sourceRoot
    this.dataRoot = dataRoot
    this.patterns = patterns
    this.assetType = assetType
    if (processable != null) {
      this.processable = processable
    }
  }

  /**
   * @override
   */
  public types(): AssetTypeItem[] {
    return [
      { type: this.assetType, assetDataRoot: this.dataRoot },
    ]
  }

  /**
   * @override
   */
  public processable(filepath: string): boolean {
    const isMatched = micromatch.isMatch(
      filepath, this.patterns, { cwd: this.sourceRoot })
    return isMatched
  }

  /**
   * @override
   */
  public * process(
    filepath: string,
    rawContent: Buffer,
    roughAsset: RoughAssetDataItem,
  ): Generator<
    [FileAssetDataItem, TagDataItem[], CategoryDataItem[][]],
    Promise<void> | void,
    FileAssetDataItem
  > {
    const asset: FileAssetDataItem = {
      uuid: roughAsset.uuid,
      type: this.assetType,
      fingerprint: roughAsset.fingerprint,
      location: roughAsset.location,
      extname: roughAsset.extname,
      lastModifiedTime: roughAsset.lastModifiedTime,
      createAt: roughAsset.createAt,
      updateAt: roughAsset.updateAt,
      title: roughAsset.title,
      tags: roughAsset.tags,
      categories: roughAsset.categories,
    }

    const resolvedAsset = yield [asset, [], []]

    // resolve content
    const assetFilepath = resolveLocalPath(
      this.dataRoot, resolvedAsset.uuid + resolvedAsset.extname)
    return writeFile(assetFilepath, rawContent)
  }
}
