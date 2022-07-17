export const normalizeRelativeUrlPath = (relativeUrlPath: string): string => {
  return relativeUrlPath
    .split(/[/\\]/g)
    .map(x => x.trim())
    .filter(x => !!x)
    .join('/')
}
