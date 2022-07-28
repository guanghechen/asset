import type { IAssetParserPluginParse } from './parse'
import type { IAssetParserPluginPolish } from './polish'

export interface IAssetParserPlugin {
  readonly displayName: string
  parse?: IAssetParserPluginParse
  polish?: IAssetParserPluginPolish
}
