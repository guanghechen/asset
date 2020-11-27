import path from 'path'
import {
  EntryDataManager,
  EntryDataMap,
  resolveUrlPath,
} from '@guanghechen/site-api'
import { AssetUUID } from '@guanghechen/site-api'
import { HandbookSourceType } from '../../config/handbook'
import type {
  HandbookEntryDataMap,
  HandbookMenuLeafNode,
  HandbookMenuParentNode,
} from './types'


/**
 *
 * @param routePrefix The prefix of 'pathname' of HandbookMenuLeafNode
 */
export class HandbookEntryDataManager extends EntryDataManager {
  /**
   * @override
   */
  public toDataMap(): HandbookEntryDataMap {
    const data: EntryDataMap = super.toDataMap()
    const menu = this.buildMenu()
    return {
      ...data,
      menu,
    }
  }

  protected buildMenu(): HandbookEntryDataMap['menu'] {
    const posts = this.assetService.fetchAssets(HandbookSourceType.POST)

    type LocationItem = {
      uuid: AssetUUID,
      extname: string,
      pieces: string[],
    }

    /**
     * Sort by path name
     */
    const locations: LocationItem[] = posts
      .map((post): LocationItem => ({
        uuid: post.uuid,
        extname: post.extname,
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

    const menu: HandbookEntryDataMap['menu'] = { items: [] }
    for (const location of locations) {
      let child: HandbookMenuParentNode | HandbookMenuLeafNode = {
        title: '',
        children: menu.items
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
              pathname: resolveUrlPath(this.routeRoot, p, title),
              source: resolveUrlPath(
                this.urlRoot, HandbookSourceType.POST, location.uuid + location.extname),
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
