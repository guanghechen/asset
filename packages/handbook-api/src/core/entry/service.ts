import path from 'path'
import { AssetService, AssetUUID, writeJSON } from '@guanghechen/site-api'
import { HandbookSourceType } from '../../config/handbook'
import type {
  HandbookEntryData,
  HandbookMenuLeafNode,
  HandbookMenuParentNode,
} from './types'


export class EntryService {
  protected readonly workspace: string
  protected readonly urlRoot: string
  protected readonly sourceUrlRoot: string
  protected readonly assetService: AssetService
  protected readonly dataMapFilepath: string

  public constructor(
    workspace: string,
    urlRoot: string,
    sourceUrlRoot: string,
    dataMapFilepath: string,
    assetService: AssetService
  ) {
    this.workspace = workspace
    this.urlRoot = urlRoot
    this.sourceUrlRoot = sourceUrlRoot
    this.dataMapFilepath = dataMapFilepath
    this.assetService = assetService
  }

  public async dump(): Promise<void> {
    const menu = this.buildMenu()
    const data: HandbookEntryData = { menu }
    await writeJSON(this.dataMapFilepath, data)
  }

  public buildMenu(): HandbookEntryData['menu'] {
    const posts = this.assetService.fetchAssets(HandbookSourceType.POST)

    type LocationItem = {
      uuid: AssetUUID,
      pieces: string[],
    }

    /**
     * Sort by path name
     */
    const locations: LocationItem[] = posts
      .map((post): LocationItem => ({
        uuid: post.uuid,
        pieces: post.location.split(/[/\\]+/g).filter(p => p.length > 0),
      }))
      .sort((x, y): -1 | 0 | 1 => {
        const len = Math.min(x.pieces.length, y.pieces.length) - 1
        for (let i = 0; i < len; ++i) {
          if (x.pieces[i] === y.pieces[i]) continue
          return x.pieces[i] < y.pieces[i] ? -1 : 1
        }
        if (x.pieces.length === y.pieces.length) return 0
        return x.pieces.length < y.pieces.length ? 1 : -1
      })
      .filter(x => x.pieces.length > 0)

    const menu: HandbookEntryData['menu'] = { routes: [] }
    for (const location of locations) {
      let child: HandbookMenuParentNode | HandbookMenuLeafNode = {
        title: '',
        children: menu.routes
      }

      for (let i = 0, p = ''; i < location.pieces.length; ++i) {
        const children: (HandbookMenuParentNode | HandbookMenuLeafNode)[]
          = (child as HandbookMenuParentNode).children
        child = children[children.length - 1]

        if (child == null || child.title !== location.pieces[i]) {
          if (i + 1 < location.pieces.length) {
            child = {
              title: location.pieces[i],
              children: []
            }
          } else {
            const title = path.parse(location.pieces[i]).name
            child = {
              title,
              pathname: this.urlRoot + p + '/' + title,
              source: this.sourceUrlRoot + '/' + location.uuid,
            }
          }
          children.push(child)
        }
        p += '/' + location.pieces[i]
      }
    }
    return menu
  }
}
