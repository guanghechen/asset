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
 * @param fingerprint
 * @returns
 */
export const genTagGuid = (fingerprint: string): string =>
  uuid(`#tag-${fingerprint}`, GUID_NAMESPACE)

/**
 * Generate global unique identifier for asset category.
 *
 * @param fingerprint
 * @returns
 */
export const genCategoryGuid = (fingerprint: string): string =>
  uuid(`#category-${fingerprint}`, GUID_NAMESPACE)
