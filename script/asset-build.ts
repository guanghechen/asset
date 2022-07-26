import type { IAssetPluginResolveOutput } from '@guanghechen/asset-core-service'
import { AssetResolver, AssetService, normalizeSlug } from '@guanghechen/asset-core-service'
import { AssetFileType, AssetPluginFile } from '@guanghechen/asset-plugin-file'
import { AssetMarkdownType, AssetPluginMarkdown } from '@guanghechen/asset-plugin-markdown'
import fs from 'fs-extra'
import path from 'node:path'

async function build(): Promise<void> {
  const FIXTURE_ROOT = path.join(__dirname, '_fixtures/asset-build')
  const FIXTURE_SOURCE_ROOT = path.join(FIXTURE_ROOT, 'src')
  const FIXTURE_STATIC_ROOT = path.join(FIXTURE_ROOT, 'static')
  const FIXTURE_ASSET_DATA_MAP = path.join(FIXTURE_STATIC_ROOT, 'asset.map.json')

  const assetResolver = new AssetResolver({
    sourceRoot: FIXTURE_SOURCE_ROOT,
    staticRoot: FIXTURE_STATIC_ROOT,
    urlPathPrefixMap: {
      [AssetMarkdownType]: '/api/post/',
      [AssetFileType]: '/asset/file/',
      _fallback: '/asset/unknown/',
    },
    caseSensitive: true,
    saveOptions: {
      prettier: true,
    },
  })

  const assetService = new AssetService({ assetResolver })

  assetService
    .use(new AssetPluginMarkdown()) // resolve markdown
    .use(new AssetPluginFile())
    .use({
      displayName: 'customized/markdown-resolve-slug',
      resolve: (input, embryo, api, next) => {
        if (embryo?.type === AssetMarkdownType) {
          if (!embryo.slug) {
            const result: IAssetPluginResolveOutput = {
              ...embryo,
              slug: normalizeSlug('/page/post/' + input.src.replace(/\.[^.]+$/, '')),
            }
            return next(result) ?? result
          }
        }
        return next(embryo)
      },
    })
  // .use({
  //   displayName: 'customized/non-text',
  //   resolve: (input, embryo) => {
  //     if (input.src.endsWith('.txt')) return null
  //     return embryo
  //   },
  // })

  const locations = fs
    .readdirSync(FIXTURE_SOURCE_ROOT)
    .map(filename => path.resolve(FIXTURE_SOURCE_ROOT, filename))

  await assetService.create(locations)
  const assets = assetService.dump()
  await fs.writeJSON(FIXTURE_ASSET_DATA_MAP, assets, { encoding: 'UTF-8', spaces: 2 })
}

void build()
