export interface IAPlayerAudioItem {
  /**
   * Audio name
   */
  name: string
  /**
   * Audio artist
   */
  artist: string
  /**
   * Audio URL
   */
  url: string
  /**
   * Audio cover image URL
   */
  cover: string
  /**
   * Path to the lyrics file or lyrics content
   * @see https://aplayer.js.org/#/home?id=lrc
   */
  lrc?: string
  /**
   * @default 'auto'
   * @see https://aplayer.js.org/#/home?id=lrc
   */
  type?: 'auto' | 'hsl' | 'normal'
}

export interface IAplayerOptions {
  /**
   * Enable sticky mode
   * @default false
   * @see https://aplayer.js.org/#/home?id=fixed-mode
   */
  fixed?: boolean
  /**
   * Enable mini mode
   * @default false
   * @see https://aplayer.js.org/#/home?id=mini-mode
   */
  mini?: boolean
  /**
   * Automatically play audio
   * @default false
   */
  autoplay?: boolean
  /**
   * Theme color
   * @default '#b7daff'
   */
  theme?: string
  /**
   * Audio loop mode
   * @default 'all'
   */
  loop?: 'all' | 'one' | 'none'
  /**
   * Audio playback order
   * @default 'list'
   */
  order?: 'list' | 'random'
  /**
   * Preload behavior
   * @default 'auto'
   */
  preload?: 'none' | 'metadata' | 'auto'
  /**
   * Default volume
   * @default 0.7
   */
  volume?: number
  /**
   * Audio information
   */
  audio: IAPlayerAudioItem | IAPlayerAudioItem[]
  /**
   * Mutex; prevent multiple players from playing simultaneously,
   * pause other players when the current player starts playing
   * @default true
   */
  mutex?: boolean
  /**
   * Lyrics type
   *
   * - 1: Lyrics as plain text
   * - 2: Lyrics in HTML format
   * - 3: Lyrics file
   *
   * @default 0
   */
  lrcType?: 1 | 2 | 3 | number
  /**
   * Fold the playlist
   * @default false
   */
  listFolded?: boolean
  /**
   * Maximum height of the playlist
   */
  listMaxHeight?: number
  /**
   * LocalStorage key to store player settings
   * @default 'aplayer-setting'
   */
  storageName?: string
}
