import type { IBinaryFileData } from './asset-file'

export interface IEncodingDetector {
  detect(relativePath: string, data: IBinaryFileData): Promise<BufferEncoding | undefined>
}
