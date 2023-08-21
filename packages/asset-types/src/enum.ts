export enum AssetDataType {
  /**
   * Binary data.
   */
  BINARY = 'binary',
  /**
   * JSON Object.
   */
  JSON = 'json',
  /**
   * LITERAL text.
   */
  TEXT = 'string',
}

export enum AssetChangeEvent {
  CREATED = 'created',
  MODIFIED = 'modified',
  REMOVED = 'removed',
}
