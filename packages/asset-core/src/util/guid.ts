import { v5 as uuid } from 'uuid'

const GUID_NAMESPACE = '188b0b6f-fc7e-4100-8b52-7615fd945c28'

/**
 * Generate global unique identifier for asset.
 */
let GUID_CODE = 0
export const genAssetGuid = (): string => {
  GUID_CODE += 1
  return uuid(`#asset-${GUID_CODE}`, GUID_NAMESPACE)
}

/**
 * Generate global unique identifier for asset tag.
 *
 * @param identifier Tag identifier
 * @returns
 */
export const genTagGuid = (identifier: string): string => uuid(`#tag-${identifier}`, GUID_NAMESPACE)

/**
 * Generate global unique identifier for asset category.
 *
 * @param identifier Category path identifier
 * @returns
 */
export const genCategoryGuid = (identifier: string): string =>
  uuid(`#category-${identifier}`, GUID_NAMESPACE)
