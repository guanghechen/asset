export enum AssetChangeEvent {
  CREATED = 'created',
  MODIFIED = 'modified',
  REMOVED = 'removed',
}

export interface IAssetChangeTask {
  type: AssetChangeEvent
  payload: {
    locations: string[]
  }
}
