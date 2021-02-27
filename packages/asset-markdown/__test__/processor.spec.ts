import fs from 'fs-extra'
import path from 'path'
import {
  AssetDataManager,
  CategoryDataManager,
  RoughAssetDataItem,
  TagDataManager,
  sha1,
} from '@guanghechen/site-api'
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
      processable: (filepath) => /\.(xmd|txt)$/.test(filepath),
    })
    expect(customProcessor.processable('/a/a.md')).toBeFalsy()
    expect(customProcessor.processable('.../a/a.md')).toBeFalsy()
    expect(customProcessor.processable('a.txt.md')).toBeFalsy()
    expect(customProcessor.processable('a.md.txt')).toBeTruthy()
    expect(customProcessor.processable('a.xmd')).toBeTruthy()
  })

  test('process', function () {
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
      const categoryDataManager = new CategoryDataManager('./category.data.json')
      const assetDataManager = new AssetDataManager(caseRootDir, './asset.data.json')

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

    expect(process('a.md')).toMatchSnapshot('a')
    expect(process('b.md')).toMatchSnapshot('b')
  })
})
