export enum AssetDataTypeEnum {
  /**
   * Binary data.
   */
  BINARY = 'binary',
  /**
   * LITERAL text.
   */
  TEXT = 'string',
  /**
   * JSON Object.
   */
  JSON = 'json',
  /**
   * Asset map
   */
  ASSET_MAP = 'asset-map',
}

export enum AssetChangeEventEnum {
  CREATED = 'created',
  MODIFIED = 'modified',
  REMOVED = 'removed',
}
