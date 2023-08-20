export function normalizeUrlPath(urlPath: string): string {
  const isAbsolute = urlPath.startsWith('/')
  const pieces = urlPath
    .split(/[/\\]+/g)
    .map(x => x.trim())
    .filter(piece => !!piece)
  const pieceStack: string[] = []
  for (const piece of pieces) {
    if (/^\./.test(piece)) {
      if (piece === '.') {
        if (pieceStack.length > 0) continue
      } else if (piece === '..') {
        if (pieceStack.length > 0) {
          pieceStack.pop()
          continue
        }
      }
    }
    pieceStack.push(piece)
  }
  const p = pieceStack.join('/')
  return isAbsolute ? '/' + p : p
}
