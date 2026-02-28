import { AssetTargetStorage, PathResolver } from '@guanghechen/asset-storage'
import { FileAssetTargetDataStorage } from '@guanghechen/asset-storage-file'
import type {
  IAssetTargetDataStorage,
  IAssetTargetStorage,
  IPathResolver,
} from '@guanghechen/asset-types'
import { Reporter } from '@guanghechen/reporter'
import { AssetGenerator, FIXTURE_TARGET_ROOT } from './post.mjs'

const reporter = new Reporter({
  prefix: 'prebuild',
  level: 'debug',
})
const pathResolver: IPathResolver = new PathResolver()
const fileTargetDataStore: IAssetTargetDataStorage = new FileAssetTargetDataStorage({
  rootDir: FIXTURE_TARGET_ROOT,
  pathResolver,
  prettier: true,
})
const targetStorage: IAssetTargetStorage = new AssetTargetStorage(fileTargetDataStore)
const generator = new AssetGenerator(reporter, targetStorage)
await generator.prepare()

if (process.argv.some(arg => /--watch/.test(arg))) {
  await generator.watch()
} else {
  await generator.build()
  await generator.close()
}
