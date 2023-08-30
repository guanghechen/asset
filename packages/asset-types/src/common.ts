export interface IAssetWatcher {
  unwatch(): Promise<void>
}

export interface IAssetServiceWatcher {
  unwatch(): Promise<void>
}
