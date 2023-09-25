import type { IBinaryFileData } from './asset-file'

export interface IEncodingDetector {
  detect(
    filepath: string,
    loadData: () => Promise<IBinaryFileData | undefined>,
  ): Promise<BufferEncoding | undefined>
}
