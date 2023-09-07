import { FileTargetAssetStorage } from '@guanghechen/asset-storage-file'
import type { IAssetTargetStorage } from '@guanghechen/asset-types'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { chalk } from '@guanghechen/chalk/node'
import { Reporter, ReporterLevelEnum } from '@guanghechen/reporter'
import { FIXTURE_TARGET_ROOT, PostGenerator } from './post.mjs'

const reporter = new Reporter(chalk, {
  baseName: 'prebuild',
  level: ReporterLevelEnum.VERBOSE,
})
const targetStorage: IAssetTargetStorage = new FileTargetAssetStorage({
  rootDir: FIXTURE_TARGET_ROOT,
  prettier: true,
})
const generator = new PostGenerator({
  reporter,
  targetStorage,
})

if (process.argv.some(arg => /--watch/.test(arg))) {
  void generator.watch()
} else {
  void generator.build()
}
