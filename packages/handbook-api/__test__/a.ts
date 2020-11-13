import fs from 'fs-extra'
import path from 'path'
import {
  HandbookConfig,
  HandbookDataProvider,
  SitePathConfig,
  resolveHandbookConfig,
} from '../src'


async function handle(
  workspace: string,
  handbookSourceRoot: string,
  handbookDataRoot: string,
): Promise<void> {
  const handbookNames = fs.readdirSync(path.resolve(workspace, handbookSourceRoot))
    .filter(p => fs.statSync(path.resolve(workspace, handbookSourceRoot, p)).isDirectory())

  const sitePathConfig: SitePathConfig = { urlRoot: '/', workspace }
  for (const handbookName of handbookNames) {
    const config: HandbookConfig = resolveHandbookConfig(
      {
        urlRoot: `/handbook/${ handbookName }`,
        sourceRoot: path.join(handbookSourceRoot, handbookName),
        dataRoot: path.join(handbookDataRoot, handbookName),
      },
      sitePathConfig,
    )
    const provider = new HandbookDataProvider(config)
    await provider.build()
  }
}


handle(
  path.resolve(__dirname, '../../../../react-playground'),
  'doc',
  'doc-data'
)
