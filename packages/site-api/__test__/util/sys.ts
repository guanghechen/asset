/**
 * Create a promise resolved after ${milliseconds} ms.
 *
 * @param milliseconds
 */
export function noop(milliseconds: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, milliseconds)
  })
}
