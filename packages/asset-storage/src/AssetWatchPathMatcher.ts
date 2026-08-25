export function createAssetWatchPathMatcher(
  patterns: ReadonlyArray<RegExp>,
): (absoluteSrcPath: string) => boolean {
  const stablePatterns: RegExp[] = patterns.map(pattern => {
    if (!(pattern instanceof RegExp)) {
      throw new TypeError('[createAssetWatchPathMatcher] pattern must be a regular expression')
    }
    const flags: string = pattern.flags.replace(/[gy]/gu, '')
    return new RegExp(pattern.source, flags)
  })

  return (absoluteSrcPath: string): boolean => {
    const normalizedSrcPath: string = absoluteSrcPath.replaceAll('\\', '/')
    return stablePatterns.some(pattern => pattern.test(normalizedSrcPath))
  }
}
