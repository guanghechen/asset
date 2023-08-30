import type {
  IAssetPluginPolishApi,
  IAssetPluginPolishInput,
  IAssetPluginPolishNext,
  IAssetPluginPolishOutput,
  IAssetPolishPlugin,
} from '@guanghechen/asset-types'
import type { IMarkdownAssetPolishOutput, IMarkdownPolishedData } from '../types'
import { isMarkdownPolishOutput } from '../types'
import type { IAPlayerAudioItem, IAplayerOptions } from '../types.aplayer'

export class MarkdownPolishAplayer implements IAssetPolishPlugin {
  public readonly displayName: string = '@guanghechen/asset-resolver-markdown/aplayer'

  public async polish(
    input: Readonly<IAssetPluginPolishInput>,
    embryo: Readonly<IAssetPluginPolishOutput> | null,
    api: Readonly<IAssetPluginPolishApi>,
    next: IAssetPluginPolishNext,
  ): Promise<IAssetPluginPolishOutput | null> {
    if (isMarkdownPolishOutput(input, embryo)) {
      const data: IMarkdownPolishedData = embryo.data
      if (data.frontmatter.aplayer) {
        const rawAplayer = data.frontmatter.aplayer
        const audios: IAPlayerAudioItem[] = []

        if (rawAplayer.audio) {
          const resolveUri = (_url: string | undefined): string | undefined => {
            const asset = _url ? api.resolveAsset(_url) : undefined
            return asset ? asset.slug || asset.uri : _url
          }

          const rawAudios = Array.isArray(rawAplayer.audio) ? rawAplayer.audio : [rawAplayer.audio]
          for (const rawAudio of rawAudios) {
            const audioUrl: string | undefined = resolveUri(rawAudio.url)
            const audioCover: string | undefined = resolveUri(rawAudio.cover)
            const audioLrc: string | undefined = resolveUri(rawAudio.lrc)

            if (rawAudio.name && rawAudio.artist && audioUrl && audioCover) {
              audios.push({
                name: rawAudio.name,
                artist: rawAudio.artist,
                url: audioUrl,
                cover: audioCover,
                lrc: audioLrc,
                type: ['auo', 'hsl', 'normal'].includes(rawAudio.type as string)
                  ? rawAudio.type
                  : undefined,
              })
            }
          }
        }
        if (audios.length > 0) {
          const aplayerOptions: IAplayerOptions = {
            fixed: rawAplayer.fixed,
            mini: rawAplayer.mini,
            autoplay: rawAplayer.autoplay,
            theme: rawAplayer.theme,
            loop: ['all', 'one', 'none'].includes(rawAplayer.loop as string)
              ? rawAplayer.loop
              : undefined,
            order: ['list', 'random'].includes(rawAplayer.order as string)
              ? rawAplayer.order
              : undefined,
            preload: ['none', 'metadata', 'auto'].includes(rawAplayer.preload as string)
              ? rawAplayer.preload
              : undefined,
            volume: rawAplayer.volume,
            mutex: rawAplayer.mutex,
            lrcType: [0, 1, 2, 3].includes(rawAplayer.lrcType as number)
              ? rawAplayer.lrcType
              : undefined,
            listFolded: rawAplayer.listFolded,
            listMaxHeight: rawAplayer.listMaxHeight,
            storageName: rawAplayer.storageName,
            audio: audios,
          }
          const result: IMarkdownAssetPolishOutput = {
            ...embryo,
            data: { ...data, aplayer: aplayerOptions },
          }
          return next(result)
        }
      }
    }
    return next(embryo)
  }
}
