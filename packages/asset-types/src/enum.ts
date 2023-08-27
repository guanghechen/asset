export enum AssetDataType {
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

export enum AssetChangeEvent {
  CREATED = 'created',
  MODIFIED = 'modified',
  REMOVED = 'removed',
}
