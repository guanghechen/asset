export const AssetFileType = 'file'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type AssetFileType = typeof AssetFileType

export interface IAssetFileData {
  srcLocation: string
}
