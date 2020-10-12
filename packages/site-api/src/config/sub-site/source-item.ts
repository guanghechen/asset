import {
  cover,
  coverString,
  isNotEmptyArray,
  isNotEmptyString,
} from '@barusu/util-option'
import { resolveLocalPath } from '../../util/path'


/**
 * Source item of sub site
 */
export interface SubSiteSourceItem {
  /**
   * Root directory of the source files
   */
  sourceRoot: string
  /**
   * Root directory of the data files
   */
  dataRoot: string
  /**
   * Glob patterns matching source files
   */
  pattern: string[]
  /**
   * Encoding of source files
   */
  encoding?: BufferEncoding
}


/**
 * Resolve SubSiteSourceItem
 */
export type SubSiteSourceItemResolver<T extends SubSiteSourceItem> = (
  subSiteSourceRoot: string,
  subSiteDataRoot: string,
  defaultSource: T,
  rawSource: Partial<T>,
) => T


/**
 * Resolve SubSiteSourceItem
 *
 * @param subSiteSourceRoot   sourceRoot of sub-site
 * @param subSiteDataRoot     dataRoot of sub-site
 * @param defaultSource       default SubSiteSourceItem.source
 * @param rawSource           input SubSiteSourceItem.source
 */
export const resolveSubSiteSourceItem: SubSiteSourceItemResolver<SubSiteSourceItem> = (
  subSiteSourceRoot: string,
  subSiteDataRoot: string,
  defaultSourceItem: SubSiteSourceItem,
  rawSourceItem: Partial<SubSiteSourceItem> = {},
): SubSiteSourceItem => {
  // resolve sourceRoot (absolute filepath)
  const sourceRoot: string = resolveLocalPath(
    subSiteSourceRoot,
    coverString(defaultSourceItem.sourceRoot, rawSourceItem.sourceRoot, isNotEmptyString))

  // resolve dataRoot (absolute filepath)
  const dataRoot: string = resolveLocalPath(
    subSiteDataRoot,
    coverString(defaultSourceItem.dataRoot, rawSourceItem.dataRoot, isNotEmptyString))

  // resolve pattern
  const pattern: string[] = cover<string[]>(
    defaultSourceItem.pattern, rawSourceItem.pattern, isNotEmptyArray)

  // resolve encoding
  const encoding: BufferEncoding | undefined = cover<BufferEncoding | undefined>(
    defaultSourceItem.encoding, rawSourceItem.encoding, isNotEmptyString)

  return { sourceRoot: sourceRoot, dataRoot: dataRoot, pattern, encoding }
}
