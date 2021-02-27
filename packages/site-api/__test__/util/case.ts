import path from 'path'
import {
  SiteConfig,
  createDefaultSubSiteConfig,
  loadSiteConfig,
  resolveSubSiteConfig,
  resolveSubSiteSourceItem,
} from '../../src'

const caseRootDir = path.resolve(__dirname, '../cases')
const resolveCasePath = (...relativePieces: string[]): string => (
  path.resolve(caseRootDir, ...relativePieces))


export interface CaseItem {
  /**
   * Case title
   */
  title: string
  /**
   * Root dir of the case
   */
  workspace: string
  /**
   * Site config provider
   */
  getSiteConfig: () => SiteConfig
}


export const cases: CaseItem[] = [
  // load full config
  ((): CaseItem => {
    const title = 'full-config'
    const workspace = resolveCasePath(title)
    const configFilepath = path.resolve(workspace, '_config.yml')

    const getSiteConfig = (): SiteConfig => {
      return loadSiteConfig(
        workspace,
        configFilepath,
        undefined,
        undefined,
        {
          barusu: function (rawConfig, sitePathConfig, defaultConfig) {
            return resolveSubSiteConfig(
              rawConfig,
              ['image'],
              resolveSubSiteSourceItem,
              sitePathConfig,
              {
                ...createDefaultSubSiteConfig('barusu'),
                source: {
                  image: {
                    sourceRoot: 'asset/image',
                    dataRoot: 'asset/image',
                    pattern: ['**/*{.png,jpg}'],
                  }
                },
              },
            )
          }
        }
      )
    }

    return { title, workspace, getSiteConfig }
  })()
]
