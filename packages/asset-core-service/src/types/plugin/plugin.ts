import type { IAssetPluginPolish } from './polish'
import type { IAssetPluginResolve } from './resolve'

export interface IAssetPlugin {
  readonly displayName: string
  resolve?: IAssetPluginResolve
  polish?: IAssetPluginPolish
}
