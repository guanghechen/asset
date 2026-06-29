import { CodeType, InlineMathType, MathType } from '@yozora/ast'
import type { Root } from '@yozora/ast'
import { YozoraParser } from '@yozora/parser'
import { describe, expect, it } from 'vitest'
import { getTimeToRead } from '../src/util/timeToRead'

const parser = new YozoraParser()
const parse = (content: string): ReturnType<typeof parser.parse> =>
  parser.parse(content, {
    shouldReservePosition: false,
    presetDefinitions: [],
    presetFootnoteDefinitions: [],
  })

const lit = (type: string, value: string): unknown => ({ type, value })
const root = (...children: unknown[]): Root => ({ type: 'root', children }) as unknown as Root

describe('getTimeToRead', () => {
  it('counts latin words at the configured reading speed', () => {
    // 5 words / 120 wpm * 60 = 2.5s -> ceil = 3s
    expect(getTimeToRead(parse('one two three four five'), 120)).toBe(3)
  })

  it('defaults to 120 words per minute', () => {
    expect(getTimeToRead(parse('one two three four five'))).toBe(3)
  })

  it('counts each Han character as a word', () => {
    // 4 Han chars / 600 wpm * 60 = 0.4s -> ceil = 1s
    expect(getTimeToRead(parse('中文字符'), 600)).toBe(1)
  })

  it('scales with content length', () => {
    const few = getTimeToRead(parse('alpha beta'), 120)
    const many = getTimeToRead(parse(Array(60).fill('word').join(' ')), 120)
    expect(many).toBeGreaterThan(few)
  })

  it('returns 0 for empty content', () => {
    expect(getTimeToRead(parse(''))).toBe(0)
  })

  it('weights math and code nodes by their type-specific formulas', () => {
    // inlineMath 5/5=1, math 60/30=2, code min(200,50)/100=0.5 -> 3.5 words
    // 3.5 / 120 * 60 = 1.75 -> ceil = 2
    const ast = root(
      lit(InlineMathType, 'x'.repeat(5)),
      lit(MathType, 'y'.repeat(60)),
      lit(CodeType, 'z'.repeat(200)),
    )
    expect(getTimeToRead(ast, 120)).toBe(2)
  })

  it('caps a code node contribution at 50 characters', () => {
    const small = root(lit(CodeType, 'z'.repeat(50)))
    const huge = root(lit(CodeType, 'z'.repeat(5000)))
    expect(getTimeToRead(huge, 120)).toBe(getTimeToRead(small, 120))
  })
})
