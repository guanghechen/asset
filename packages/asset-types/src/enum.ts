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
}

export enum AssetChangeEventEnum {
  CREATED = 'created',
  MODIFIED = 'modified',
  REMOVED = 'removed',
}
