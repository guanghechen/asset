import type { RoughAssetDataItem } from '@guanghechen/site-api'
import {
  AssetDataManager,
  CategoryDataManager,
  TagDataManager,
  sha1,
} from '@guanghechen/site-api'
import fs from 'fs-extra'
import path from 'path'
import { AssetMarkdownProcessor } from '../src'

const caseRootDir = path.resolve(__dirname, 'cases')

describe('base', function () {
  test('processable', function () {
    const processor = new AssetMarkdownProcessor({ encoding: 'utf-8' })
    expect(processor.processable('/a/a.md')).toBeTruthy()
    expect(processor.processable('.../a/a.md')).toBeTruthy()
    expect(processor.processable('a.txt.md')).toBeTruthy()
    expect(processor.processable('a.md.txt')).toBeFalsy()

    const customProcessor = new AssetMarkdownProcessor({
      encoding: 'utf-8',
      processable: filepath => /\.(xmd|txt)$/.test(filepath),
    })
    expect(customProcessor.processable('/a/a.md')).toBeFalsy()
    expect(customProcessor.processable('.../a/a.md')).toBeFalsy()
    expect(customProcessor.processable('a.txt.md')).toBeFalsy()
    expect(customProcessor.processable('a.md.txt')).toBeTruthy()
    expect(customProcessor.processable('a.xmd')).toBeTruthy()
  })

  test('process', function () {
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    function process(filepath: string) {
      const absoluteFilepath = path.resolve(caseRootDir, filepath)
      const rawContent = fs.readFileSync(absoluteFilepath)

      const createDate: Date = new Date('2020-01-01 00:00:00')
      const updateDate: Date = new Date('2020-01-02 12:34:56')
      const lastModifiedDate: Date = new Date('2020-01-02 12:34:56')

      const roughAsset: RoughAssetDataItem = {
        uuid: sha1(filepath),
        location: filepath,
        extname: path.extname(filepath),
        fingerprint: sha1(filepath),
        lastModifiedTime: lastModifiedDate.getMilliseconds(),
        createAt: createDate.toISOString(),
        updateAt: updateDate.toISOString(),
        title: filepath,
        tags: [],
        categories: [],
      }

      const tagDataManager = new TagDataManager('./tag.json')
      const categoryDataManager = new CategoryDataManager(
        './category.data.json',
      )
      const assetDataManager = new AssetDataManager(
        caseRootDir,
        './asset.data.json',
      )

      const processor = new AssetMarkdownProcessor({
        encoding: 'utf-8',
        isMetaOptional: true,
      })
      const result = processor.process(
        filepath,
        Buffer.from(rawContent),
        roughAsset,
        tagDataManager,
        categoryDataManager,
        assetDataManager,
      )
      return result.next()
    }

    const desensitize = (data: any): any => {
      const json = JSON.stringify(data).replace(
        /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/g,
        '<ISO_DATE>',
      )
      return JSON.parse(json)
    }

    expect(desensitize(process('a.md').value)).toMatchSnapshot('a')
    expect(desensitize(process('b.md').value)).toMatchSnapshot('b')
  })
})
