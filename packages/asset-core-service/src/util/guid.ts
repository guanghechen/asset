import { v5 as uuid } from 'uuid'

const GUID_NAMESPACE = '188b0b6f-fc7e-4100-8b52-7615fd945c28'

/**
 * Generate global unique identifier.
 */
let GUID_CODE = 0
export const genGuid = (): string => {
  GUID_CODE += 1
  return uuid(`#-${GUID_CODE}`, GUID_NAMESPACE)
}

export const genAssetGuid = (identifier: string): string =>
  uuid(`#asset-${identifier}`, GUID_NAMESPACE)
