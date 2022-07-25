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
  REMOVED = 'removed',
  RENAMED = 'renamed',
  UPDATED = 'updated',
}
