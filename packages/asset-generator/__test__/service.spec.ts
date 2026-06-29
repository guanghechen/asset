import { FileAssetType } from '@guanghechen/asset-resolver-file'
import { AssetPathResolver } from '@guanghechen/asset-storage'
import type { IAssetResolverApi, IAssetService } from '@guanghechen/asset-types'
import { Reporter } from '@guanghechen/reporter'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { createAssetService } from '../src'

const ROOT = path.resolve('/srv/project')
const reporter = new Reporter().mock()

describe('createAssetService', () => {
  it('wires the group into both the data-map uri and the resolver-api uri resolver', async () => {
    const pathResolver = new AssetPathResolver({ caseSensitive: true, srcRoots: [ROOT] })
    let capturedApi: IAssetResolverApi | undefined
    const service: IAssetService = createAssetService({
      group: 'blog',
      GUID_NAMESPACE: '1b671a64-40d5-491e-99b0-da01ff1f3341',
      encodingDetector: { detect: async () => 'utf8' } as never,
      pathResolver,
      sourceStorage: {} as never,
      targetStorage: {} as never,
      reporter,
      resolver: {
        // Capture the resolver-api the factory built internally so we can inspect its wiring.
        resolve: async (_p: string, api: IAssetResolverApi) => {
          capturedApi = api
          return null
        },
        process: async () => [],
      } as never,
    })

    expect(service.dataMapUri).toBe('/api/blog.asset.map.json')
    expect(service.pathResolver).toBe(pathResolver)

    // The service hands the resolver a group-aware resolverApi; its uriResolver must have been
    // built via createAssetUriResolver('blog'), so file assets get a group-scoped uri prefix.
    await service.resolveAsset(path.join(ROOT, 'a.txt'))
    expect(capturedApi).toBeDefined()
    const uri: string = await capturedApi!.uriResolver.resolveUri({
      guid: 'g',
      sourcetype: FileAssetType,
      mimetype: 'application/octet-stream',
      extname: 'bin',
    } as never)
    expect(uri).toContain('/asset/blog/file/')
  })
})
