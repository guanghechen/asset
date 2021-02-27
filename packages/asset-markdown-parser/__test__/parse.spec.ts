import fs from 'fs-extra'
import path from 'path'
import parse from '../src'

describe('parser', function () {
  const caseDir = path.resolve(__dirname, 'case')
  const cases = fs.readdirSync(caseDir)
  for (const kase of cases) {
    const filepath = path.join(caseDir, kase)

    test(path.parse(kase).name, async function () {
      const content = await fs.readFile(filepath, 'utf-8')
      const result = parse(content)
      expect(result).toMatchSnapshot()
    })
  }
})
