import fastGlob from 'fast-glob'

export async function collectAssetLocations(
  patterns: string[],
  options: {
    cwd: string
    absolute?: boolean
  },
): Promise<string[]> {
  const filepaths: string[] = await fastGlob(patterns, {
    cwd: options.cwd,
    dot: true,
    absolute: options.absolute ?? false,
    onlyDirectories: false,
    onlyFiles: true,
    throwErrorOnBrokenSymbolicLink: true,
    unique: true,
  })
  return filepaths
}
