import { describe, expect, it, vi } from 'vitest'
import { delay } from '../src'

describe('delay', () => {
  it('resolves only after the requested duration has elapsed', async () => {
    vi.useFakeTimers()
    try {
      let resolved = false
      const pending = delay(100).then(() => {
        resolved = true
      })

      await vi.advanceTimersByTimeAsync(99)
      expect(resolved).toBe(false) // not yet — still 1ms short

      await vi.advanceTimersByTimeAsync(1)
      await pending
      expect(resolved).toBe(true)
    } finally {
      vi.useRealTimers()
    }
  })
})
