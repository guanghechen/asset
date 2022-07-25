export interface IBuffer extends Uint8Array {
  toString(encoding?: BufferEncoding, start?: number, end?: number): string
}

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
