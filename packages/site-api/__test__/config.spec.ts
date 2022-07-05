import path from 'path'
import type { SubSiteConfig } from '../src'
import { createDefaultSubSiteConfig, resolveSubSiteConfig, resolveSubSiteSourceItem } from '../src'
import { cases } from './util/case'
import { desensitize } from './util/snapshot'

describe('resolveSubSiteConfig', function () {
  const resolveConfig = (
    workspace: string,
    rawSubSiteConfig: Partial<SubSiteConfig>,
  ): SubSiteConfig => {
    const sourceItemTypes = ['image']
    const resolveSourceItem = resolveSubSiteSourceItem
    const sitePathConfig = { routeRoot: '/', urlRoot: '/', workspace }
    const defaultConfig: SubSiteConfig = {
      ...createDefaultSubSiteConfig('demo'),
      source: {
        image: {
          sourceRoot: 'asset/image',
          dataRoot: 'asset/image',
          pattern: ['**/*{.png,jpg}'],
        },
      },
    }

    const subSiteConfig = resolveSubSiteConfig(
      rawSubSiteConfig,
      sourceItemTypes,
      resolveSourceItem,
      sitePathConfig,
      defaultConfig,
    )
    return subSiteConfig
  }

  test('empty rawConfig', function () {
    expect(desensitize(resolveConfig(path.resolve(__dirname, 'case'), {}))).toMatchSnapshot()
  })

  test('full rawConfig', function () {
    expect(
      desensitize(
        resolveConfig(path.resolve(__dirname, 'case'), {
          routeRoot: '/waw',
          sourceRoot: 'emm/waw/source',
          dataRoot: 'waw/emm/data',
          assetDataMapFilepath: 'asset.json',
          tagDataMapFilepath: 'tag.json',
          categoryDataMapFilepath: 'category.json',
        }),
      ),
    ).toMatchSnapshot()
  })
})

describe('loadSiteConfig', function () {
  for (const kase of cases) {
    const { title, getSiteConfig } = kase
    // eslint-disable-next-line jest/valid-title
    test(title, function () {
      const siteConfig = getSiteConfig()
      expect(desensitize(siteConfig)).toMatchSnapshot()

      // loadSiteConfig should be a pure function
      expect(getSiteConfig()).toEqual(siteConfig)
    })
  }
})
