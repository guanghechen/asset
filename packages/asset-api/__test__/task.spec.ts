import { AssetChangeEventEnum } from '@guanghechen/asset-types'
import type { IAssetTaskApi } from '@guanghechen/asset-types'
import { describe, expect, it, vi } from 'vitest'
import { AssetTask } from '../src'

function createApi(): IAssetTaskApi {
  return {
    create: vi.fn(async () => {}),
    remove: vi.fn(async () => {}),
    update: vi.fn(async () => {}),
    resolve: vi.fn(async () => null),
  } as unknown as IAssetTaskApi
}

// run() is protected; tests invoke it directly to exercise the dispatch table.
const runTask = (task: AssetTask): Promise<void> =>
  (task as unknown as { run(): Promise<void> }).run()

describe('AssetTask.toJSON', () => {
  it('serializes its type and source paths', () => {
    const task = new AssetTask(createApi(), AssetChangeEventEnum.MODIFIED, ['/a', '/b'])
    expect(task.toJSON()).toEqual({
      type: AssetChangeEventEnum.MODIFIED,
      absoluteSrcPaths: ['/a', '/b'],
    })
  })
})

describe('AssetTask.run dispatch', () => {
  it.each([
    [AssetChangeEventEnum.CREATED, 'create'],
    [AssetChangeEventEnum.REMOVED, 'remove'],
    [AssetChangeEventEnum.MODIFIED, 'update'],
  ] as const)('routes %s to api.%s', async (type, method) => {
    const api = createApi()
    await runTask(new AssetTask(api, type, ['/a']))
    expect(api[method]).toHaveBeenCalledWith(['/a'])
  })

  it('throws for an unknown change type', async () => {
    const task = new AssetTask(createApi(), 'bogus' as AssetChangeEventEnum, ['/a'])
    await expect(runTask(task)).rejects.toThrow(/unknown task/)
  })
})
