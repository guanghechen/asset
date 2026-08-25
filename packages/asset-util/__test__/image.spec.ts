import { describe, expect, it } from 'vitest'
import { imageSize } from '../src'

const writeUint24LE = (buffer: Buffer, value: number, offset: number): void => {
  buffer.writeUIntLE(value, offset, 3)
}

const createPng = (width: number, height: number): Buffer => {
  const buffer = Buffer.alloc(33)
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(buffer)
  buffer.writeUInt32BE(13, 8)
  buffer.write('IHDR', 12, 'ascii')
  buffer.writeUInt32BE(width, 16)
  buffer.writeUInt32BE(height, 20)
  buffer[24] = 8
  buffer[25] = 6
  return buffer
}

const createCgbiPng = (width: number, height: number): Buffer => {
  const buffer = Buffer.alloc(49)
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(buffer)
  buffer.writeUInt32BE(4, 8)
  buffer.write('CgBI', 12, 'ascii')
  buffer.writeUInt32BE(13, 24)
  buffer.write('IHDR', 28, 'ascii')
  buffer.writeUInt32BE(width, 32)
  buffer.writeUInt32BE(height, 36)
  buffer[40] = 8
  buffer[41] = 6
  return buffer
}

const createGif = (width: number, height: number): Buffer => {
  const buffer = Buffer.alloc(13)
  buffer.write('GIF89a', 0, 'ascii')
  buffer.writeUInt16LE(width, 6)
  buffer.writeUInt16LE(height, 8)
  return buffer
}

const createJpeg = (width: number, height: number, marker = 0xc0): Buffer => {
  return Buffer.from([
    0xff,
    0xd8,
    0xff,
    0xe0,
    0x00,
    0x04,
    0x00,
    0x00,
    0xff,
    marker,
    0x00,
    0x0b,
    0x08,
    (height >> 8) & 0xff,
    height & 0xff,
    (width >> 8) & 0xff,
    width & 0xff,
    0x01,
    0x01,
    0x11,
    0x00,
    0xff,
    0xd9,
  ])
}

const createWebpExtended = (width: number, height: number): Buffer => {
  const buffer = Buffer.alloc(30)
  buffer.write('RIFF', 0, 'ascii')
  buffer.writeUInt32LE(buffer.length - 8, 4)
  buffer.write('WEBP', 8, 'ascii')
  buffer.write('VP8X', 12, 'ascii')
  buffer.writeUInt32LE(10, 16)
  writeUint24LE(buffer, width - 1, 24)
  writeUint24LE(buffer, height - 1, 27)
  return buffer
}

const createWebpLossless = (width: number, height: number): Buffer => {
  const widthValue = width - 1
  const heightValue = height - 1
  const buffer = Buffer.alloc(26)
  buffer.write('RIFF', 0, 'ascii')
  buffer.writeUInt32LE(buffer.length - 8, 4)
  buffer.write('WEBP', 8, 'ascii')
  buffer.write('VP8L', 12, 'ascii')
  buffer.writeUInt32LE(5, 16)
  buffer[20] = 0x2f
  buffer[21] = widthValue & 0xff
  buffer[22] = ((widthValue >> 8) & 0x3f) | ((heightValue & 0x03) << 6)
  buffer[23] = (heightValue >> 2) & 0xff
  buffer[24] = (heightValue >> 10) & 0x0f
  return buffer
}

const createWebpLossy = (width: number, height: number): Buffer => {
  const buffer = Buffer.alloc(30)
  buffer.write('RIFF', 0, 'ascii')
  buffer.writeUInt32LE(buffer.length - 8, 4)
  buffer.write('WEBP', 8, 'ascii')
  buffer.write('VP8 ', 12, 'ascii')
  buffer.writeUInt32LE(10, 16)
  buffer.set([0x9d, 0x01, 0x2a], 23)
  buffer.writeUInt16LE(width, 26)
  buffer.writeUInt16LE(height, 28)
  return buffer
}

const createBmp = (width: number, height: number): Buffer => {
  const buffer = Buffer.alloc(54)
  buffer.write('BM', 0, 'ascii')
  buffer.writeUInt32LE(buffer.length, 2)
  buffer.writeUInt32LE(40, 14)
  buffer.writeInt32LE(width, 18)
  buffer.writeInt32LE(height, 22)
  return buffer
}

describe('imageSize', () => {
  it('parses bounded binary image formats', () => {
    expect(imageSize(createPng(640, 480))).toEqual({ width: 640, height: 480 })
    expect(imageSize(createCgbiPng(128, 68))).toEqual({ width: 128, height: 68 })
    expect(imageSize(createGif(320, 200))).toEqual({ width: 320, height: 200 })
    expect(imageSize(createJpeg(1920, 1080))).toEqual({ width: 1920, height: 1080 })
    expect(imageSize(createJpeg(800, 600, 0xc2))).toEqual({ width: 800, height: 600 })
    expect(imageSize(createWebpExtended(2048, 1024))).toEqual({ width: 2048, height: 1024 })
    expect(imageSize(createWebpLossless(123, 456))).toEqual({ width: 123, height: 456 })
    expect(imageSize(createWebpLossy(1280, 720))).toEqual({ width: 1280, height: 720 })
    expect(imageSize(createBmp(1024, -768))).toEqual({ width: 1024, height: 768 })
  })

  it('rejects truncated, zero-sized, and unsupported inputs', () => {
    expect(imageSize(Buffer.alloc(0))).toBeNull()
    expect(imageSize(createPng(0, 100))).toBeNull()
    expect(imageSize(createPng(100, 0))).toBeNull()
    expect(imageSize(createPng(100, 100).subarray(0, 20))).toBeNull()
    expect(imageSize(Buffer.from('icns0000', 'ascii'))).toBeNull()
    expect(imageSize(Buffer.from([0x00, 0x00, 0x00, 0x00, 0x66, 0x74, 0x79, 0x70]))).toBeNull()
    expect(imageSize(Buffer.from([0xff, 0x0a, 0x00, 0x00]))).toBeNull()
    expect(imageSize(Buffer.from('<svg width="10" height="20"/>'))).toBeNull()
  })

  it('rejects malformed JPEG segments without unbounded scanning', () => {
    expect(imageSize(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x00]))).toBeNull()
    expect(
      imageSize(
        Buffer.from([
          0xff, 0xd8, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x10, 0x00, 0x20, 0x02, 0x01, 0x11, 0x00,
        ]),
      ),
    ).toBeNull()

    const segments = 5000
    const buffer = Buffer.alloc(2 + segments * 4)
    buffer.set([0xff, 0xd8])
    for (let index = 0; index < segments; index += 1) {
      buffer.set([0xff, 0xe0, 0x00, 0x02], 2 + index * 4)
    }
    expect(imageSize(buffer)).toBeNull()

    const excessiveMarkerPrefix = Buffer.concat([
      Buffer.from([0xff, 0xd8]),
      Buffer.alloc(33, 0xff),
      Buffer.from([0xe0, 0x00, 0x02]),
    ])
    expect(imageSize(excessiveMarkerPrefix)).toBeNull()
  })

  it('parses JPEG dimensions after large metadata segments', () => {
    const appSegment = Buffer.alloc(65537)
    appSegment.set([0xff, 0xe2, 0xff, 0xff])

    const input = Buffer.concat([
      Buffer.from([0xff, 0xd8]),
      ...Array.from({ length: 16 }, () => appSegment),
      createJpeg(123, 456).subarray(8),
    ])
    expect(input.length).toBeGreaterThan(1024 * 1024)
    expect(imageSize(input)).toEqual({ width: 123, height: 456 })
  })

  it('does not throw or mutate arbitrary input', () => {
    for (let length = 0; length <= 128; length += 1) {
      const input = Uint8Array.from({ length }, (_, index) => (length * 31 + index * 17) & 0xff)
      const snapshot = input.slice()
      expect(() => imageSize(input)).not.toThrow()
      expect(input).toEqual(snapshot)
    }
  })
})
