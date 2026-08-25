export interface IImageSize {
  readonly width: number
  readonly height: number
}

type ImageSizeParser = (input: Uint8Array) => IImageSize | null

const JPEG_MAX_MARKER_PREFIX_BYTES = 32
const JPEG_MAX_SEGMENTS = 4096

const hasBytes = (input: Uint8Array, offset: number, length: number): boolean => {
  return offset >= 0 && length >= 0 && offset <= input.length - length
}

const matchesBytes = (
  input: Uint8Array,
  offset: number,
  expected: ReadonlyArray<number>,
): boolean => {
  if (!hasBytes(input, offset, expected.length)) return false
  return expected.every((value, index) => input[offset + index] === value)
}

const matchesAscii = (input: Uint8Array, offset: number, expected: string): boolean => {
  if (!hasBytes(input, offset, expected.length)) return false
  for (let index = 0; index < expected.length; index += 1) {
    if (input[offset + index] !== expected.charCodeAt(index)) return false
  }
  return true
}

const readUint16BE = (input: Uint8Array, offset: number): number => {
  return input[offset] * 0x100 + input[offset + 1]
}

const readUint16LE = (input: Uint8Array, offset: number): number => {
  return input[offset] + input[offset + 1] * 0x100
}

const readUint24LE = (input: Uint8Array, offset: number): number => {
  return input[offset] + input[offset + 1] * 0x100 + input[offset + 2] * 0x10000
}

const readUint32BE = (input: Uint8Array, offset: number): number => {
  return (
    input[offset] * 0x1000000 +
    input[offset + 1] * 0x10000 +
    input[offset + 2] * 0x100 +
    input[offset + 3]
  )
}

const readUint32LE = (input: Uint8Array, offset: number): number => {
  return (
    input[offset] +
    input[offset + 1] * 0x100 +
    input[offset + 2] * 0x10000 +
    input[offset + 3] * 0x1000000
  )
}

const readInt32LE = (input: Uint8Array, offset: number): number => {
  const value = readUint32LE(input, offset)
  return value > 0x7fffffff ? value - 0x100000000 : value
}

const createImageSize = (width: number, height: number): IImageSize | null => {
  if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height)) return null
  if (width <= 0 || height <= 0) return null
  return { width, height }
}

const parsePngHeaderSize = (input: Uint8Array, chunkOffset: number): IImageSize | null => {
  if (!hasBytes(input, chunkOffset, 25)) return null
  if (readUint32BE(input, chunkOffset) !== 13 || !matchesAscii(input, chunkOffset + 4, 'IHDR')) {
    return null
  }

  const dataOffset = chunkOffset + 8
  if (
    input[dataOffset + 8] === 0 ||
    input[dataOffset + 10] !== 0 ||
    input[dataOffset + 11] !== 0 ||
    input[dataOffset + 12] > 1
  ) {
    return null
  }

  const width = readUint32BE(input, dataOffset)
  const height = readUint32BE(input, dataOffset + 4)
  if (width > 0x7fffffff || height > 0x7fffffff) return null
  return createImageSize(width, height)
}

const parsePngSize: ImageSizeParser = input => {
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
  if (!matchesBytes(input, 0, signature)) return null
  if (!hasBytes(input, 8, 8)) return null

  if (matchesAscii(input, 12, 'CgBI')) {
    const chunkLength = readUint32BE(input, 8)
    if (chunkLength > input.length - 20) return null
    return parsePngHeaderSize(input, 20 + chunkLength)
  }

  return parsePngHeaderSize(input, 8)
}

const parseGifSize: ImageSizeParser = input => {
  if (!matchesAscii(input, 0, 'GIF87a') && !matchesAscii(input, 0, 'GIF89a')) return null
  if (!hasBytes(input, 6, 7)) return null
  return createImageSize(readUint16LE(input, 6), readUint16LE(input, 8))
}

const isJpegStartOfFrame = (marker: number): boolean => {
  return (
    (marker >= 0xc0 && marker <= 0xc3) ||
    (marker >= 0xc5 && marker <= 0xc7) ||
    (marker >= 0xc9 && marker <= 0xcb) ||
    (marker >= 0xcd && marker <= 0xcf)
  )
}

const isStandaloneJpegMarker = (marker: number): boolean => {
  return marker === 0x01 || marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd7)
}

const parseJpegSize: ImageSizeParser = input => {
  if (!matchesBytes(input, 0, [0xff, 0xd8])) return null

  let offset = 2
  let segmentCount = 0

  while (offset < input.length && segmentCount < JPEG_MAX_SEGMENTS) {
    if (input[offset] !== 0xff) return null

    let markerPrefixLength = 0
    while (offset < input.length && input[offset] === 0xff) {
      offset += 1
      markerPrefixLength += 1
      if (markerPrefixLength > JPEG_MAX_MARKER_PREFIX_BYTES) return null
    }
    if (offset >= input.length) return null

    const marker = input[offset]
    offset += 1
    segmentCount += 1

    if (marker === 0x00 || marker === 0xd9 || marker === 0xda) return null
    if (isStandaloneJpegMarker(marker)) continue
    if (!hasBytes(input, offset, 2)) return null

    const segmentLength = readUint16BE(input, offset)
    if (segmentLength < 2) return null

    const segmentEnd = offset + segmentLength
    if (segmentEnd > input.length) return null

    if (isJpegStartOfFrame(marker)) {
      if (segmentLength < 11) return null
      const componentCount = input[offset + 7]
      if (componentCount === 0 || segmentLength !== 8 + componentCount * 3) return null
      return createImageSize(readUint16BE(input, offset + 5), readUint16BE(input, offset + 3))
    }

    offset = segmentEnd
  }

  return null
}

const parseWebpSize: ImageSizeParser = input => {
  if (!matchesAscii(input, 0, 'RIFF') || !matchesAscii(input, 8, 'WEBP')) return null
  if (!hasBytes(input, 0, 20)) return null

  const riffSize = readUint32LE(input, 4)
  const fileSize = riffSize + 8
  if (riffSize < 12 || fileSize > input.length) return null

  const chunkSize = readUint32LE(input, 16)
  const chunkEnd = 20 + chunkSize
  if (chunkEnd > fileSize || chunkEnd > input.length) return null

  if (matchesAscii(input, 12, 'VP8X')) {
    if (chunkSize < 10 || !hasBytes(input, 20, 10)) return null
    return createImageSize(readUint24LE(input, 24) + 1, readUint24LE(input, 27) + 1)
  }

  if (matchesAscii(input, 12, 'VP8L')) {
    if (chunkSize < 5 || !hasBytes(input, 20, 5) || input[20] !== 0x2f) return null
    const width = 1 + input[21] + ((input[22] & 0x3f) << 8)
    const height = 1 + ((input[22] & 0xc0) >> 6) + (input[23] << 2) + ((input[24] & 0x0f) << 10)
    return createImageSize(width, height)
  }

  if (matchesAscii(input, 12, 'VP8 ')) {
    if (chunkSize < 10 || !hasBytes(input, 20, 10)) return null
    if (!matchesBytes(input, 23, [0x9d, 0x01, 0x2a])) return null
    const width = readUint16LE(input, 26) & 0x3fff
    const height = readUint16LE(input, 28) & 0x3fff
    return createImageSize(width, height)
  }

  return null
}

const parseBmpSize: ImageSizeParser = input => {
  if (!matchesAscii(input, 0, 'BM') || !hasBytes(input, 14, 4)) return null

  const dibSize = readUint32LE(input, 14)
  if (dibSize > input.length - 14) return null

  if (dibSize === 12) {
    if (!hasBytes(input, 18, 4)) return null
    return createImageSize(readUint16LE(input, 18), readUint16LE(input, 20))
  }

  if (dibSize >= 40) {
    if (!hasBytes(input, 18, 8)) return null
    const width = readInt32LE(input, 18)
    const height = readInt32LE(input, 22)
    if (height === -0x80000000) return null
    return createImageSize(width, Math.abs(height))
  }

  return null
}

const parsers: ReadonlyArray<ImageSizeParser> = [
  parsePngSize,
  parseGifSize,
  parseJpegSize,
  parseWebpSize,
  parseBmpSize,
]

/**
 * Parse dimensions from PNG (including CgBI), JPEG, GIF, WebP, or BMP data.
 *
 * Malformed and unsupported inputs return null. Container and text formats such
 * as HEIF, JXL, ICNS, TIFF, and SVG are deliberately excluded because securely
 * parsing them requires substantially more complex processing.
 */
export const imageSize = (input: Uint8Array): IImageSize | null => {
  for (const parser of parsers) {
    const result = parser(input)
    if (result !== null) return result
  }
  return null
}
