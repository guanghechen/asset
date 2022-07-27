import { AssetResolver, AssetService } from '@guanghechen/asset-core-service'
import { FileAssetPlugin, FileAssetType } from '@guanghechen/asset-plugin-file'
import {
  MarkdownAssetPlugin,
  MarkdownAssetPluginCode,
  MarkdownAssetPluginFootnote,
  MarkdownAssetPluginSlug,
  MarkdownAssetType,
} from '@guanghechen/asset-plugin-markdown'
import fs from 'fs-extra'
import path from 'node:path'

async function build(): Promise<void> {
  const FIXTURE_ROOT = path.join(__dirname, 'fixtures/asset-build')
  const FIXTURE_SOURCE_ROOT = path.join(FIXTURE_ROOT, 'src')
  const FIXTURE_STATIC_ROOT = path.join(FIXTURE_ROOT, 'static')
  const FIXTURE_ASSET_DATA_MAP = path.join(FIXTURE_STATIC_ROOT, 'asset.map.json')

  const assetService = new AssetService()
  assetService
    .use(
      new MarkdownAssetPlugin(),
      new MarkdownAssetPluginCode(),
      new MarkdownAssetPluginFootnote(),
      new MarkdownAssetPluginSlug(),
    )
    .use(
      new FileAssetPlugin({
        accepted: filepath => {
          const { ext } = path.parse(filepath)
          if (['.txt', '.jpg', '.png'].includes(ext)) return true
          return false
        },
      }),
    )

  const assetResolver = new AssetResolver({
    sourceRoot: FIXTURE_SOURCE_ROOT,
    staticRoot: FIXTURE_STATIC_ROOT,
    urlPathPrefixMap: {
      [MarkdownAssetType]: '/api/post/',
      [FileAssetType]: '/asset/file/',
      _fallback: '/asset/unknown/',
    },
    caseSensitive: true,
    saveOptions: {
      prettier: true,
    },
  })
  const locations = fs
    .readdirSync(FIXTURE_SOURCE_ROOT)
    .map(filename => path.resolve(FIXTURE_SOURCE_ROOT, filename))
  await assetService.create(assetResolver, locations)

  const assets = assetService.dump()
  await fs.writeJSON(FIXTURE_ASSET_DATA_MAP, assets, { encoding: 'UTF-8', spaces: 2 })
}

void build()
