import invariant from '@guanghechen/invariant'
import fs from 'fs-extra'
import path from 'path'

export function assetSafeLocation(rootDir: string, location: string): void | never {
  invariant(
    location.startsWith(rootDir.replace(/\/?$/, '/')),
    `[assetSafeLocation] !!!unsafe location. rootDir: ${rootDir}, location: ${location}`,
  )
}

export function assetExistedLocation(location: string): void | never {
  invariant(fs.existsSync(location), `[assetExistedLocation] Cannot find file. (${location})`)
}

export function assetExistedFilepath(filepath: string): void | never {
  assetExistedLocation(filepath)
  const stat = fs.statSync(filepath)
  invariant(stat.isFile(), `[assetExistedFilepath] Not a file'. (${filepath})`)
}

export function mkdirsIfNotExists(filepath: string, isDir: boolean): void {
  const dirPath = isDir ? filepath : path.dirname(filepath)
  if (fs.existsSync(dirPath)) return
  fs.mkdirsSync(dirPath)
}
