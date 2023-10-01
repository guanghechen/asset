import type {
  IAsset,
  IAssetPluginPolishApi,
  IAssetPluginPolishInput,
  IAssetPluginPolishNext,
  IAssetPluginPolishOutput,
  IAssetResolverPlugin,
} from '@guanghechen/asset-types'
import type {
  IMarkdownAssetPolishOutput,
  IMarkdownPolishedData,
  IMarkdownResolverPlugin,
} from '../types'
import { isMarkdownPolishOutput } from '../types'
import type { IAPlayerAudioItem, IAplayerOptions } from '../types.aplayer'

export function markdownPluginAplayer(): IMarkdownResolverPlugin {
  const plugin: IMarkdownResolverPlugin = (): IAssetResolverPlugin => {
    return {
      get displayName(): string {
        return '@guanghechen/asset-resolver-markdown/aplayer'
      },
      async polish(
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
              const resolveUri = async (url: string | undefined): Promise<string | undefined> => {
                if (url === undefined) return undefined

                const p: string | null = api.parseSrcPathFromUrl(url)
                if (!p) return url

                const refPath: string | null = await api.resolveRefPath(p)
                if (refPath === null) return url

                const asset: IAsset | null = refPath ? await api.resolveAsset(refPath) : null
                return asset ? asset.slug || asset.uri : url
              }

              const rawAudios = Array.isArray(rawAplayer.audio)
                ? rawAplayer.audio
                : [rawAplayer.audio]
              for (const rawAudio of rawAudios) {
                const audioUrl: string | undefined = await resolveUri(rawAudio.url)
                const audioCover: string | undefined = await resolveUri(rawAudio.cover)
                const audioLrc: string | undefined = await resolveUri(rawAudio.lrc)

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
      },
    }
  }
  return plugin
}
