import fs from 'fs-extra'
import path from 'path'
import {
  AssetDataItem,
  AssetDataProvider,
  AssetEntity,
  AssetEntityManager,
  AssetProcessor,
  CategoryDataItem,
  TagDataItem,
} from '@guanghechen/site-api'
import { cases } from './util/case'
import { assetDataReplacer, desensitize } from './util/snapshot'
import { noop } from './util/sys'


describe('AssetDataProvider', function () {
  jest
    .spyOn(global.console, 'info')
    .mockImplementation(function (...args: string[]): any {
      expect(desensitize(args, assetDataReplacer))
        .toMatchSnapshot('console.info')
    })

  for (const kase of cases) {
    describe(kase.title, function () {
      const { getSiteConfig } = kase
      const siteConfig = getSiteConfig()
      const fsWriteJsonSyncMock = jest
        .spyOn(fs, 'writeJSON')
        .mockImplementation(function (
          absolutePath: string | any,
          data: any,
        ): any {
          const snapshotName = path.relative(siteConfig.workspace, absolutePath)
          expect(desensitize(data, assetDataReplacer))
            .toMatchSnapshot(desensitize(snapshotName))
        })

      const subSiteNames = Object.keys(siteConfig.sites)
      for (const subSiteName of subSiteNames) {
        describe(subSiteName, function () {
          const subSiteConfig = siteConfig.sites[subSiteName]

          const fakeEntityManagerMap: Record<string, AssetEntityManager<AssetEntity>> = {}
          const fakeProcessor: AssetProcessor = {
            processable: filepath => /\.([^.]+)\.json$/.test(filepath),
            process: (filepath, rawContent, roughAsset, tagDataManager, categoryDataManager) => {
              const data = JSON.parse(rawContent.toString('utf-8'))

              const tags: TagDataItem[] = (data.tags || []).map((rawTag: string) => (
                tagDataManager.normalize(rawTag)
              ))

              const categories: CategoryDataItem[][] = (data.categories || []).map(
                (categoryPath: string[]) => (
                  categoryPath.map(c => categoryDataManager.normalize(c))))

              const asset: AssetEntity = {
                ...roughAsset,
                type: /\.([^.]+)\.json$/.exec(filepath)![1],
                tags: tags.map(tag => tag.uuid),
                categories: categories.map(cp => cp.map(c => c.uuid)),
              }

              if (fakeEntityManagerMap[asset.type] == null) {
                fakeEntityManagerMap[asset.type] = new AssetEntityManager(
                  subSiteConfig.source[asset.type].dataRoot)
              }

              const entityManager = fakeEntityManagerMap[asset.type]
              entityManager.insert(asset)
              return [asset, tags, categories]
            }
          }

          const getCurrentData = (provider: AssetDataProvider<any>): unknown[] => {
            const assets = Object.keys(subSiteConfig.source)
              .reduce((acc, assetType) => {
                const assets = provider.assetService.fetchAssets(assetType)
                acc.push(...assets)
                return acc
              }, [] as any[])
            const tags = provider.tagService.fetchTags()
            const categories = provider.categoryService.fetchCategories()
            return [assets, tags, categories]
          }

          const baseTest = function (provider: AssetDataProvider<any>) {
            // test tags
            const tags: TagDataItem[] = provider.tagService.fetchTags()
            expect(tags.map(t => provider.tagService.fetchTag(t.uuid))).toEqual(tags)
            expect(provider.tagService.fetchTag('non-exist uuid')).toBeNull()

            // test categories
            const categories: CategoryDataItem[] = provider.categoryService.fetchCategories()
            expect(
              categories.map(c => provider.categoryService.fetchCategory(c.uuid))
            ).toEqual(categories)
            expect(provider.categoryService.fetchCategory('non-exist uuid')).toBeNull()

            // test assets
            for (const assetType of Object.keys(subSiteConfig.source)) {
              const assets: AssetDataItem[] = provider.assetService.fetchAssets(assetType)
              expect(assets.map(a => provider.assetService.fetchAsset(a.uuid))).toEqual(assets)
              expect(provider.assetService.fetchAsset('non-exist uuid')).toBeNull()

              const entityManager = fakeEntityManagerMap[assetType]
              if (entityManager == null) {
                expect(assets.length).toBeLessThanOrEqual(0)
              } else {
                expect(entityManager.find('non-exist uuid')).toBeNull()
              }

              expect(
                provider.assetService.fetchAssets(assetType, 0, assets.length)
              ).toEqual(assets)
              expect(
                provider.assetService.fetchAssets(assetType, 0, assets.length - 1)
              ).toEqual(assets.slice(0, -1))

              // test asset entity
              expect(
                assets.map(a => {
                  const entity = entityManager.find(a.uuid)!
                  const result = {}
                  for (const key of Object.keys(a)) {
                    result[key] = entity[key]
                  }
                  return result
                })
              ).toEqual(assets)
            }
          }

          test('build', async function () {
            const provider = new AssetDataProvider(subSiteConfig, [fakeProcessor])
            await provider.build(true)

            // test tags
            const tags: TagDataItem[] = provider.tagService.fetchTags()
            expect(desensitize(tags, assetDataReplacer)).toMatchSnapshot('tags')

            // test categories
            const categories: CategoryDataItem[] = provider.categoryService.fetchCategories()
            expect(desensitize(categories, assetDataReplacer)).toMatchSnapshot('categories')

            // test assets
            for (const assetType of Object.keys(subSiteConfig.source)) {
              const assets: AssetDataItem[] = provider.assetService.fetchAssets(assetType)
              expect(desensitize(assets, assetDataReplacer)).toMatchSnapshot('asset -- ' + assetType)
            }

            baseTest(provider)
          })

          test('start', async function () {
            const provider = new AssetDataProvider(subSiteConfig, [fakeProcessor])
            await provider.watch(true)
            baseTest(provider)
            const initialData = getCurrentData(provider)

            const testImageData = {
              tags: ['gif', 'jpg', 'jpeg'],
              categories: [
                ['test', 'provider', 'image'],
                ['asset', 'image'],
              ]
            }
            const testImageFilepath = path.resolve(
              subSiteConfig.source.image.sourceRoot, 'provider.test.image.json')

            await fs.writeFile(testImageFilepath, JSON.stringify(testImageData), 'utf-8')
            await noop(2000)
            baseTest(provider)

            // test tags
            expect(
              provider.tagService.fetchTags()
              .filter(tag => testImageData.tags.includes(tag.title))
              .map(tag => tag.title)
              .sort()
            ).toEqual([...testImageData.tags].sort())

            // test categories
            expect(
              provider.categoryService.fetchCategories()
              .filter(category => testImageData.categories.flat().includes(category.title))
              .map(category => category.title)
              .sort()
            ).toEqual([...new Set(testImageData.categories.flat())].sort())

            await fs.unlink(testImageFilepath)
            await noop(2000)
            baseTest(provider)

            const finalData = getCurrentData(provider)
            expect(finalData).toEqual(initialData)

            await provider.close()
          })
        })
      }

      fsWriteJsonSyncMock.mockRestore()
    })
  }
})
